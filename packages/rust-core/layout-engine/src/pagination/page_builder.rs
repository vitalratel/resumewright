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
use super::page_breaker::should_break_page_for_box;

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

        // Check if this is a heading that needs look-ahead orphan prevention
        // Only apply look-ahead orphan prevention to section headings (H1, H2)
        // H3+ are typically sub-headings within a section and shouldn't trigger
        // cascading page breaks that separate them from their parent section
        let is_section_heading = current_box
            .element_type
            .is_some_and(|et| et.is_section_heading());

        // Look-ahead orphan prevention for headings
        let should_move_heading_to_next_page =
            if is_section_heading && box_bottom_on_page <= page_bottom {
                // Heading fits on current page - check if next content fits too
                let next_content_idx = find_next_content_box(&boxes, i + 1);
                if let Some(idx) = next_content_idx {
                    let next_box = &boxes[idx];
                    let next_top = next_box.y - page_y_offset;
                    let next_bottom = next_top + next_box.height;

                    // If next content doesn't fit, move heading to next page
                    next_bottom > page_bottom
                } else {
                    false
                }
            } else {
                false
            };

        if should_move_heading_to_next_page {
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

        // For headings that passed the look-ahead check (next content fits), skip the
        // hard threshold in should_break_page_for_box. The look-ahead is smarter because
        // it checks actual content size, not an arbitrary threshold.
        //
        // Also skip the threshold for H3+ headings - they're sub-headings within a section
        // and shouldn't trigger cascading page breaks. The section heading (H2) handles
        // orphan prevention for the whole section.
        let is_sub_heading = current_box
            .element_type
            .is_some_and(|et| et.is_sub_heading());
        let element_type_for_break_check =
            if (is_section_heading && box_bottom_on_page <= page_bottom) || is_sub_heading {
                None // Skip orphan prevention threshold
            } else {
                current_box.element_type
            };

        if !should_break_page_for_box(
            box_top_on_page,
            current_box.height,
            box_bottom_on_page,
            page_bottom,
            element_type_for_break_check,
        ) {
            // Box fits completely - add it to current page with original position
            // (adjusted for page offset if on page 2+)
            let mut positioned_box = current_box.clone();
            if page_y_offset > 0.0 {
                adjust_box_y_coordinates(&mut positioned_box, box_top_on_page);
            }
            current_page_boxes.push(positioned_box);
            i += 1;
        } else {
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
    use layout_types::{BoxContent, ElementType, StyleDeclaration};

    /// Create a test box with proper y position (simulating Taffy-computed positions)
    fn create_test_box_at(y: f64, height: f64, element_type: Option<ElementType>) -> LayoutBox {
        LayoutBox {
            x: 0.0,
            y,
            width: 100.0,
            height,
            content: BoxContent::Text(vec!["Test".to_string()]),
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
}
