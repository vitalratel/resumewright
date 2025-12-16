//! Main pagination logic - builds pages from layout boxes
//!
//! This module orchestrates the pagination process by:
//! 1. Iterating through boxes
//! 2. Deciding when to break pages
//! 3. Splitting boxes that span page boundaries
//! 4. Finalizing pages with accumulated boxes

use crate::error::LayoutError;
use layout_types::{BoxContent, LayoutBox, Page};

use super::box_splitter::split_box_at_height;
use super::coordinate_adjuster::adjust_box_y_coordinates;
use super::page_breaker::{should_break_page_for_box, PageBreakReason};

/// Minimum height threshold for splitting (avoid creating tiny fragments)
const MIN_FRAGMENT_HEIGHT: f64 = 50.0;

/// Paginate layout boxes into multiple pages
///
/// Takes a flat list of layout boxes and splits them across pages
/// when content exceeds the available height per page.
///
/// # Arguments
/// * `boxes` - Flat list of all layout boxes (with Taffy-computed positions including margins)
/// * `content_top` - Y position where content starts (TSX padding from top)
/// * `content_height` - Available height per page (page height minus margins)
///
/// # Returns
/// Vector of pages, each containing boxes for that page
///
/// # Position Preservation
/// Boxes come in with positions computed by Taffy, which include CSS margins.
/// For page 1, we preserve these positions to maintain proper spacing.
/// For subsequent pages, we apply an offset to shift content appropriately,
/// using the same `content_top` for consistency.
pub fn paginate_boxes(
    boxes: Vec<LayoutBox>,
    content_top: f64,
    content_height: f64,
) -> Result<Vec<Page>, LayoutError> {
    let mut pages = Vec::new();
    let mut current_page_boxes = Vec::new();
    let page_bottom = content_top + content_height;

    // Track where each box ENDS (box.y + box.height) to determine page breaks
    // Y offset is applied when moving to a new page
    let mut page_y_offset: f64 = 0.0;

    // Use indexed iteration for look-ahead capability
    let mut i = 0;
    while i < boxes.len() {
        let current_box = &boxes[i];

        // Calculate where this box would be on the current page
        let box_top_on_page = current_box.y - page_y_offset;
        let box_bottom_on_page = box_top_on_page + current_box.height;

        // Check if this heading needs look-ahead orphan prevention (H1/H2 only)
        let needs_lookahead = current_box
            .element_type
            .is_some_and(|et| et.needs_lookahead_orphan_prevention());

        // Check if this heading needs threshold-based orphan prevention (H1/H2/H3)
        let needs_orphan_prevention = current_box
            .element_type
            .is_some_and(|et| et.needs_orphan_prevention());

        // Look-ahead orphan prevention for H1/H2 section headings
        // H3+ don't use look-ahead because they're sub-headings within sections
        let should_move_heading_to_next_page =
            if needs_lookahead && box_bottom_on_page <= page_bottom {
                // Heading fits on current page - check if next content fits too
                let next_content_idx = find_next_content_box(&boxes, i + 1);
                if let Some(idx) = next_content_idx {
                    let next_box = &boxes[idx];
                    let next_top = next_box.y - page_y_offset;
                    let next_bottom = next_top + next_box.height;

                    // Check if next content would fit
                    let next_overflows = next_bottom > page_bottom;

                    // Also check if next content is a MAJOR heading (H1/H2) that would trigger
                    // threshold-based orphan prevention (< 30pt remaining after it).
                    // If so, the next content will move to page 2, orphaning this H2.
                    //
                    // NOTE: Only cascade for H1/H2, not H3+. Sub-headings (H3+) can be
                    // moved independently - if H3 triggers orphan prevention, it's better
                    // to have H2+H3 on page 1 with H3 content on page 2 than moving the
                    // entire section and creating large whitespace.
                    //
                    // BUT: Don't trigger threshold if the content AFTER the next box is
                    // a new major section (H1/H2). The threshold protects content
                    // within a section, not across section boundaries.
                    let next_would_trigger_threshold = if !next_overflows {
                        let next_is_major_heading = next_box
                            .element_type
                            .is_some_and(|et| et.needs_lookahead_orphan_prevention());
                        if next_is_major_heading {
                            let space_after_next = page_bottom - next_bottom;
                            let below_threshold =
                                space_after_next <= super::page_breaker::MIN_SPACE_AFTER_HEADING;

                            // Check what comes after the next box - if it's a new H1/H2 section,
                            // the threshold doesn't apply (no in-section content to protect)
                            let content_after_next_idx = find_next_content_box(&boxes, idx + 1);
                            let next_sibling_is_major_section =
                                content_after_next_idx.is_some_and(|after_idx| {
                                    boxes[after_idx].element_type.is_some_and(|et| {
                                        matches!(
                                            et,
                                            layout_types::ElementType::Heading1
                                                | layout_types::ElementType::Heading2
                                        )
                                    })
                                });

                            below_threshold && !next_sibling_is_major_section
                        } else {
                            false
                        }
                    } else {
                        false
                    };

                    // Move H2 if next content overflows OR would trigger threshold orphan prevention
                    next_overflows || next_would_trigger_threshold
                } else {
                    false
                }
            } else {
                false
            };

        // H3 subtitle-aware orphan prevention
        // H3 headings often have a subtitle (italic text) immediately following.
        // If the H3 + subtitle fit but leave no room for actual content, move H3 to next page.
        let is_h3 = current_box
            .element_type
            .is_some_and(|et| matches!(et, layout_types::ElementType::Heading3));

        let should_move_h3_with_subtitle =
            if is_h3 && !should_move_heading_to_next_page && box_bottom_on_page <= page_bottom {
                // H3 fits - check if it has a subtitle that also fits but leaves no room for content
                let next_idx = find_next_content_box(&boxes, i + 1);
                if let Some(idx) = next_idx {
                    let next_box = &boxes[idx];
                    let next_bottom = (next_box.y - page_y_offset) + next_box.height;
                    let next_is_text = matches!(&next_box.content, BoxContent::Text(_));
                    let next_is_small = next_box.height < 25.0; // Subtitle is typically small

                    // If next box is a small text box (subtitle pattern) that fits
                    if next_is_text && next_is_small && next_bottom <= page_bottom {
                        // Check what comes after the subtitle
                        let content_after_idx = find_next_content_box(&boxes, idx + 1);
                        if let Some(after_idx) = content_after_idx {
                            let content_box = &boxes[after_idx];
                            let content_bottom =
                                (content_box.y - page_y_offset) + content_box.height;

                            // If the content after subtitle doesn't fit, move H3 to prevent orphan
                            content_bottom > page_bottom
                        } else {
                            false
                        }
                    } else {
                        false
                    }
                } else {
                    false
                }
            } else {
                false
            };

        if should_move_heading_to_next_page || should_move_h3_with_subtitle {
            // Move heading to next page to keep it with its content
            finalize_and_start_new_page(&mut pages, &mut current_page_boxes);
            page_y_offset = current_box.y - content_top;

            let mut positioned_box = current_box.clone();
            adjust_box_y_coordinates(&mut positioned_box, content_top);
            current_page_boxes.push(positioned_box);
            i += 1;

            // Also move any immediately following border boxes with the heading
            // Border boxes are zero-height Empty boxes that render the heading's border
            while i < boxes.len() {
                let next_box = &boxes[i];
                let is_border_box = matches!(&next_box.content, BoxContent::Empty)
                    && next_box.height == 0.0
                    && next_box.style.box_model.border_bottom.is_some();
                if is_border_box {
                    let mut border_positioned = next_box.clone();
                    let border_top = next_box.y - page_y_offset;
                    adjust_box_y_coordinates(&mut border_positioned, border_top);
                    current_page_boxes.push(border_positioned);
                    i += 1;
                } else {
                    break;
                }
            }
            continue;
        }

        // For H1/H2 headings that passed the look-ahead check, we can skip
        // the hard threshold in should_break_page_for_box.
        //
        // We skip the threshold if:
        // 1. This is an H1/H2 heading that had look-ahead done
        // 2. The heading fits on the current page
        // 3. The next content is NOT itself a heading (if it is, the threshold is still useful
        //    because a heading followed by another heading doesn't tell us if there's enough
        //    room for actual content)
        //
        // For H3+ headings, we skip the threshold if their next sibling is a major
        // section (H1/H2). The threshold protects content within a section, but if
        // the next content is a new section, there's nothing to protect.
        let next_content_idx = find_next_content_box(&boxes, i + 1);
        let next_content_is_heading = next_content_idx
            .is_some_and(|idx| boxes[idx].element_type.is_some_and(|et| et.is_heading()));
        let next_content_is_major_section = next_content_idx.is_some_and(|idx| {
            boxes[idx].element_type.is_some_and(|et| {
                matches!(
                    et,
                    layout_types::ElementType::Heading1 | layout_types::ElementType::Heading2
                )
            })
        });

        // Skip orphan prevention threshold check when:
        // 1. Look-ahead already handled it (H1/H2 with non-heading content that fits)
        // 2. Next content is a new major section (no in-section content to protect)
        let skip_threshold = box_bottom_on_page <= page_bottom
            && ((needs_lookahead && !next_content_is_heading)
                || (needs_orphan_prevention && next_content_is_major_section));

        let element_type_for_break_check = if skip_threshold {
            None
        } else {
            current_box.element_type
        };

        let break_reason = should_break_page_for_box(
            box_top_on_page,
            current_box.height,
            box_bottom_on_page,
            page_bottom,
            element_type_for_break_check,
        );

        match break_reason {
            PageBreakReason::NoBreak => {
                // Box fits completely - add it to current page with original position
                // (adjusted for page offset if on page 2+)
                let mut positioned_box = current_box.clone();
                if page_y_offset > 0.0 {
                    adjust_box_y_coordinates(&mut positioned_box, box_top_on_page);
                }
                current_page_boxes.push(positioned_box);
                i += 1;
            }
            PageBreakReason::OrphanPrevention => {
                // Heading would be orphaned - move entire box to next page (don't split)
                finalize_and_start_new_page(&mut pages, &mut current_page_boxes);

                page_y_offset = current_box.y - content_top;

                let mut positioned_box = current_box.clone();
                adjust_box_y_coordinates(&mut positioned_box, content_top);
                current_page_boxes.push(positioned_box);
                i += 1;
            }
            PageBreakReason::Overflow => {
                // Box doesn't fit - determine split strategy
                let remaining_space = page_bottom - box_top_on_page;

                if remaining_space >= MIN_FRAGMENT_HEIGHT && box_top_on_page < page_bottom {
                    // We have enough space to split - attempt to split the box
                    split_box_across_pages_preserving_positions(
                        current_box.clone(),
                        &mut pages,
                        &mut current_page_boxes,
                        &mut page_y_offset,
                        page_bottom,
                        content_top,
                    );
                } else {
                    // Not enough space left for a meaningful fragment - move entire box to next page
                    finalize_and_start_new_page(&mut pages, &mut current_page_boxes);

                    // Calculate new page offset: shift so this box starts at content_top
                    page_y_offset = current_box.y - content_top;

                    let mut positioned_box = current_box.clone();
                    adjust_box_y_coordinates(&mut positioned_box, content_top);
                    current_page_boxes.push(positioned_box);
                }
                i += 1;
            }
        }
    }

    // Finalize last page
    if let Some(page) = finalize_current_page(current_page_boxes, pages.len() + 1) {
        pages.push(page);
    }

    // If no pages were created, return single empty page
    if pages.is_empty() {
        pages.push(Page::new(1, Vec::new()));
    }

    Ok(pages)
}

/// Find the next content box (skip empty/border boxes) starting from index
fn find_next_content_box(boxes: &[LayoutBox], start_idx: usize) -> Option<usize> {
    for (idx, b) in boxes.iter().enumerate().skip(start_idx) {
        // Skip empty boxes and zero-height boxes (borders)
        if !matches!(&b.content, BoxContent::Empty) && b.height > 0.0 {
            return Some(idx);
        }
    }
    None
}

/// Split a box across multiple pages while preserving spacing
fn split_box_across_pages_preserving_positions(
    mut box_to_split: LayoutBox,
    pages: &mut Vec<Page>,
    current_page_boxes: &mut Vec<LayoutBox>,
    page_y_offset: &mut f64,
    page_bottom: f64,
    content_top: f64,
) {
    // Track the current Taffy Y coordinate through splits
    // This is needed because after adjusting the remainder, box_to_split.y becomes page-relative
    let mut taffy_y = box_to_split.y;

    while box_to_split.height > 0.0 {
        // Use taffy_y to calculate page position (not box_to_split.y which may be adjusted)
        let box_top_on_page = taffy_y - *page_y_offset;
        let available_height = page_bottom - box_top_on_page;

        if box_to_split.height <= available_height {
            // Remaining content fits on current page
            if *page_y_offset > 0.0 {
                adjust_box_y_coordinates(&mut box_to_split, box_top_on_page);
            }
            current_page_boxes.push(box_to_split);
            break;
        }

        // Split the box
        if available_height >= MIN_FRAGMENT_HEIGHT {
            let (fragment, remainder) =
                split_box_at_height(box_to_split, available_height, box_top_on_page);
            let fragment_height = fragment.height;

            // Only add fragment if it has content (widow/orphan prevention may create empty fragments)
            if fragment_height > 0.0 {
                current_page_boxes.push(fragment);
            }

            // Finalize current page
            finalize_and_start_new_page(pages, current_page_boxes);

            // Move taffy_y to where the split occurred
            taffy_y += fragment_height;

            // Calculate offset for new page based on Taffy coordinates
            // The remainder will be placed at content_top, so:
            // page_y = taffy_y - page_y_offset = content_top
            // Therefore: page_y_offset = taffy_y - content_top
            *page_y_offset = taffy_y - content_top;

            // Adjust remainder position for new page
            let mut adjusted_remainder = remainder;
            adjust_box_y_coordinates(&mut adjusted_remainder, content_top);
            box_to_split = adjusted_remainder;
        } else {
            // Not enough space for meaningful fragment, move to next page
            finalize_and_start_new_page(pages, current_page_boxes);

            // Calculate offset for new page
            *page_y_offset = taffy_y - content_top;
            adjust_box_y_coordinates(&mut box_to_split, content_top);
        }
    }
}

/// Finalize current page and prepare for a new one
fn finalize_and_start_new_page(pages: &mut Vec<Page>, current_page_boxes: &mut Vec<LayoutBox>) {
    if !current_page_boxes.is_empty() {
        let page_boxes = std::mem::take(current_page_boxes);
        if let Some(page) = finalize_current_page(page_boxes, pages.len() + 1) {
            pages.push(page);
        }
    }
}

/// Finalize the current page with its accumulated boxes
///
/// # Arguments
/// * `current_page_boxes` - The boxes accumulated for this page
/// * `page_number` - The 1-based page number
///
/// # Returns
/// Some(Page) if there are boxes, None if empty
fn finalize_current_page(current_page_boxes: Vec<LayoutBox>, page_number: usize) -> Option<Page> {
    if !current_page_boxes.is_empty() {
        Some(Page::new(page_number, current_page_boxes))
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use layout_types::{BoxContent, ElementType, StyleDeclaration, TextLine};

    /// Create a test box with proper y position (simulating Taffy-computed positions)
    fn create_test_box_at(y: f64, height: f64, element_type: Option<ElementType>) -> LayoutBox {
        LayoutBox {
            x: 0.0,
            y,
            width: 100.0,
            height,
            content: BoxContent::Text(vec![TextLine::from("Test")]),
            element_type,
            style: StyleDeclaration::default(),
        }
    }

    #[test]
    fn test_single_box_fits_on_one_page() {
        let content_top = 72.0;
        // Box at y=72 (content_top) with height 100
        let boxes = vec![create_test_box_at(72.0, 100.0, None)];

        let result = paginate_boxes(boxes, content_top, 648.0).unwrap();

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].boxes.len(), 1);
    }

    #[test]
    fn test_box_overflow_creates_new_page() {
        let content_top = 72.0;
        let content_height = 648.0;

        // First box at y=72 (content_top), height=600, ends at y=672
        // Second box at y=672, height=100 - would end at y=772, exceeds page_bottom (720)
        let boxes = vec![
            create_test_box_at(72.0, 600.0, None),
            create_test_box_at(672.0, 100.0, None),
        ];

        let result = paginate_boxes(boxes, content_top, content_height).unwrap();

        assert_eq!(result.len(), 2);
    }

    #[test]
    fn test_heading_orphan_prevention() {
        let content_top = 72.0;
        let content_height = 648.0;
        // page_bottom = 72 + 648 = 720

        // First box at y=72, height=600, ends at y=672
        // Heading at y=672, height=50, ends at y=722 - beyond page_bottom (720) but only 2pt over
        // The heading triggers orphan prevention because only 48pt remaining (720-672)
        // which is less than MIN_SPACE_AFTER_HEADING (15pt) + heading + some content space
        let boxes = vec![
            create_test_box_at(72.0, 600.0, None),
            create_test_box_at(672.0, 50.0, Some(ElementType::Heading2)),
            create_test_box_at(722.0, 100.0, None),
        ];

        let result = paginate_boxes(boxes, content_top, content_height).unwrap();

        assert_eq!(result.len(), 2, "Heading should move to page 2");
    }

    #[test]
    fn test_h3_heading_orphan_prevention() {
        // Simulates the resume scenario where an h3 job title ends up at the
        // bottom of a page with very little space for content.
        //
        // Page layout:
        // - content_top = 72, content_height = 648, page_bottom = 720
        // - Content fills most of the page (y=72, height=600, ends at y=672)
        // - H3 heading at y=672, height=30, ends at y=702
        // - Remaining space after heading: 720 - 702 = 18pt (< 30pt threshold)
        // - Following content at y=702, height=200 would overflow
        //
        // The h3 heading should move to page 2 because < 30pt remaining.
        let content_top = 72.0;
        let content_height = 648.0;
        // page_bottom = 720

        let boxes = vec![
            create_test_box_at(72.0, 600.0, None), // Main content
            create_test_box_at(672.0, 30.0, Some(ElementType::Heading3)), // Job title (h3)
            create_test_box_at(702.0, 200.0, None), // Bullet points
        ];

        let result = paginate_boxes(boxes, content_top, content_height).unwrap();

        // The h3 and its content should be on page 2
        assert_eq!(result.len(), 2, "Should create 2 pages");

        // Page 1 should only have the first content box
        assert_eq!(
            result[0].boxes.len(),
            1,
            "Page 1 should have only the main content"
        );

        // Page 2 should have the h3 heading and its following content
        assert_eq!(
            result[1].boxes.len(),
            2,
            "Page 2 should have the h3 heading and bullet points"
        );
    }

    #[test]
    fn test_h2_section_heading_orphan_prevention() {
        // Simulates the resume scenario where an H2 section heading (like "RECENT PROJECTS")
        // ends up at the bottom of a page with its content on the next page.
        //
        // Page layout:
        // - content_top = 72, content_height = 648, page_bottom = 720
        // - Content fills most of the page (y=72, height=610, ends at y=682)
        // - H2 heading at y=682, height=25, ends at y=707 (fits on page)
        // - Following content at y=707, height=150 would overflow (ends at 857 > 720)
        //
        // The H2 heading should move to page 2 with its content.
        let content_top = 72.0;
        let content_height = 648.0;
        // page_bottom = 720

        let boxes = vec![
            create_test_box_at(72.0, 610.0, None), // Main content (skills section)
            create_test_box_at(682.0, 25.0, Some(ElementType::Heading2)), // "RECENT PROJECTS" (H2)
            create_test_box_at(707.0, 150.0, None), // First project content
        ];

        let result = paginate_boxes(boxes, content_top, content_height).unwrap();

        // The H2 and its content should be on page 2
        assert_eq!(result.len(), 2, "Should create 2 pages");

        // Page 1 should only have the first content box
        assert_eq!(
            result[0].boxes.len(),
            1,
            "Page 1 should have only the main content (skills section)"
        );

        // Page 2 should have the H2 heading and its following content
        assert_eq!(
            result[1].boxes.len(),
            2,
            "Page 2 should have the H2 section heading and project content"
        );
    }

    #[test]
    fn test_h2_with_border_box_orphan_prevention() {
        // Simulates the resume where H2 has border-b class, creating a border box after it.
        // The border box should be skipped when looking for next content.
        //
        // Box sequence:
        // 1. Main content (y=72, h=610, ends at 682)
        // 2. H2 "RECENT PROJECTS" (y=682, h=25, ends at 707)
        // 3. Border box (y=707, h=0, Empty content) - should be skipped
        // 4. H3 "ResumeWright" content (y=707, h=150, ends at 857 > 720)
        //
        // The H2 should move to page 2 because its following content doesn't fit.
        let content_top = 72.0;
        let content_height = 648.0;
        // page_bottom = 720

        // Create border box
        let mut border_box = LayoutBox {
            x: 0.0,
            y: 707.0,
            width: 100.0,
            height: 0.0,
            content: BoxContent::Empty,
            element_type: None,
            style: StyleDeclaration::default(),
        };
        // Add border styling
        border_box.style.box_model.border_bottom = Some(layout_types::BorderStyle {
            width: 1.0,
            style: layout_types::BorderLineStyle::Solid,
            color: layout_types::Color {
                r: 128,
                g: 128,
                b: 128,
                a: 1.0,
            },
        });

        let boxes = vec![
            create_test_box_at(72.0, 610.0, None), // Main content
            create_test_box_at(682.0, 25.0, Some(ElementType::Heading2)), // H2 heading
            border_box,                            // Border box (should be skipped)
            create_test_box_at(707.0, 150.0, None), // Project content
        ];

        let result = paginate_boxes(boxes, content_top, content_height).unwrap();

        // The H2, border, and content should be on page 2
        assert_eq!(result.len(), 2, "Should create 2 pages");

        // Page 1 should only have the first content box
        assert_eq!(
            result[0].boxes.len(),
            1,
            "Page 1 should have only the main content"
        );

        // Page 2 should have the H2, border box, and following content
        assert_eq!(
            result[1].boxes.len(),
            3,
            "Page 2 should have H2 + border + content"
        );
    }

    #[test]
    fn test_h2_followed_by_small_h3_no_cascade() {
        // Simulates the real resume scenario:
        // - H2 "RECENT PROJECTS" at bottom of page
        // - H3 "ResumeWright" (small title that fits)
        // - But paragraph content would overflow
        //
        // The H2 should STAY on page 1 because:
        // - H2's look-ahead only cascades for H1/H2 (major sections), not H3
        // - H3 is a sub-heading and doesn't trigger cascade
        // - This reduces whitespace compared to moving entire H2 section
        //
        // Box sequence:
        // 1. Main content (y=72, h=580, ends at 652)
        // 2. H2 "RECENT PROJECTS" (y=652, h=25, ends at 677)
        // 3. H3 "ResumeWright" (y=677, h=20, ends at 697) - fits!
        // 4. Paragraph (y=697, h=100, ends at 797 > 720) - doesn't fit
        //
        // H2 stays on page 1, H3+paragraph move to page 2
        let content_top = 72.0;
        let content_height = 648.0;
        // page_bottom = 720

        let boxes = vec![
            create_test_box_at(72.0, 580.0, None), // Main content
            create_test_box_at(652.0, 25.0, Some(ElementType::Heading2)), // H2 "RECENT PROJECTS"
            create_test_box_at(677.0, 20.0, Some(ElementType::Heading3)), // H3 "ResumeWright" (fits!)
            create_test_box_at(697.0, 100.0, None),                       // Paragraph (doesn't fit)
        ];

        let result = paginate_boxes(boxes, content_top, content_height).unwrap();

        assert_eq!(result.len(), 2, "Should create 2 pages");

        // Page 1 should have main content + H2 (H2 stays because H3 doesn't cascade)
        assert_eq!(
            result[0].boxes.len(),
            2,
            "Page 1 should have main content + H2"
        );

        // Page 2 should have H3 + paragraph
        assert_eq!(
            result[1].boxes.len(),
            2,
            "Page 2 should have H3 + paragraph"
        );
    }
}
