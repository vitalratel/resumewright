//! Box splitting logic for pagination
//!
//! This module handles splitting layout boxes at page boundaries.
//! When a box is too tall to fit on the current page, it's fragmented into:
//! - A first fragment that fits on the current page
//! - A remainder that continues on the next page
//!
//! Implements CSS `box-decoration-break: clone` semantics.

use layout_types::{BoxContent, LayoutBox, StyleDeclaration, TextLine};

use super::coordinate_adjuster::adjust_box_y_coordinates;

/// Calculate line height from style, falling back to defaults
fn get_line_height(style: &StyleDeclaration) -> f64 {
    style.text.line_height.unwrap_or_else(|| {
        style
            .text
            .font_size
            .unwrap_or(layout_types::DEFAULT_FONT_SIZE)
            * layout_types::DEFAULT_LINE_HEIGHT_RATIO
    })
}

/// Restack boxes vertically starting from a given Y position
///
/// Adjusts Y coordinates of each box to stack sequentially without gaps.
fn restack_boxes_vertically(boxes: &mut [LayoutBox], start_y: f64) {
    let mut current_y = start_y;
    for b in boxes.iter_mut() {
        adjust_box_y_coordinates(b, current_y);
        current_y += b.height;
    }
}

/// Split a box into two fragments at a given height
///
/// # Arguments
/// * `box_to_split` - The box to fragment
/// * `split_height` - Height for the first fragment
/// * `y_position` - Y coordinate for the first fragment
///
/// # Returns
/// Tuple of (first_fragment, remainder)
pub fn split_box_at_height(
    box_to_split: LayoutBox,
    split_height: f64,
    y_position: f64,
) -> (LayoutBox, LayoutBox) {
    // Clone the box style for both fragments (box-decoration-break: clone)
    let style = box_to_split.style.clone();

    // Split the content based on type
    let (first_content, second_content) = match box_to_split.content {
        BoxContent::Container(children) => {
            // Split children across the boundary
            let split_y_coordinate = y_position + split_height;
            split_container_children(children, split_y_coordinate, 0.0)
        }
        BoxContent::Text(lines) => {
            // Split text lines across the boundary
            split_text_lines(lines, split_height, &style)
        }
        BoxContent::Empty => (BoxContent::Empty, BoxContent::Empty),
    };

    // Calculate actual heights based on content after splitting
    let first_fragment_height = calculate_content_height(&first_content, &style);
    let remainder_height = calculate_content_height(&second_content, &style);

    // Create first fragment
    let first_fragment = LayoutBox {
        x: box_to_split.x,
        y: y_position,
        width: box_to_split.width,
        height: first_fragment_height,
        content: first_content,
        style: style.clone(),
        element_type: box_to_split.element_type,
    };

    // Create remainder fragment (will be positioned on next page)
    let remainder = LayoutBox {
        x: box_to_split.x,
        y: 0.0, // Will be adjusted when placed on next page
        width: box_to_split.width,
        height: remainder_height,
        content: second_content,
        style,
        element_type: box_to_split.element_type,
    };

    (first_fragment, remainder)
}

/// Split container children across a page boundary
///
/// Uses absolute Y coordinates to determine which children go in each fragment.
///
/// # Arguments
/// * `children` - Container's child boxes
/// * `split_y_coordinate` - Absolute Y where page break occurs
/// * `container_top_y` - Absolute Y of container's top edge
///
/// # Returns
/// Tuple of (first_fragment_content, second_fragment_content)
fn split_container_children(
    children: Vec<LayoutBox>,
    split_y_coordinate: f64,
    container_top_y: f64,
) -> (BoxContent, BoxContent) {
    let mut first_fragment_children = Vec::new();
    let mut second_fragment_children = Vec::new();

    // Track the current Y position in the second fragment for sequential stacking
    let mut second_fragment_current_y = container_top_y;

    for child in children {
        let child_top = child.y;
        let child_bottom = child.y + child.height;

        if child_bottom <= split_y_coordinate {
            // Child fits entirely before the break
            first_fragment_children.push(child);
        } else if child_top >= split_y_coordinate {
            // Child starts after the break - place sequentially in second fragment
            let mut adjusted_child = child;
            adjust_box_y_coordinates(&mut adjusted_child, second_fragment_current_y);
            second_fragment_current_y += adjusted_child.height;
            second_fragment_children.push(adjusted_child);
        } else {
            // Child spans the break - split it recursively
            let split_height_within_child = split_y_coordinate - child_top;
            let (first_part, mut second_part) =
                split_box_at_height(child, split_height_within_child, child_top);

            // Only add fragments if they have content (widow/orphan prevention may create empty fragments)
            if first_part.height > 0.0 {
                first_fragment_children.push(first_part);
            }
            if second_part.height > 0.0 {
                // Place the second part sequentially in second fragment
                adjust_box_y_coordinates(&mut second_part, second_fragment_current_y);
                second_fragment_current_y += second_part.height;
                second_fragment_children.push(second_part);
            }
        }
    }

    // Orphan prevention: move trailing headings from first fragment to second
    // This prevents headings from being stranded at the bottom of a page
    if !second_fragment_children.is_empty() {
        move_orphaned_headings_to_second_fragment(
            &mut first_fragment_children,
            &mut second_fragment_children,
            container_top_y,
        );
    }

    // List orphan/widow prevention: don't leave just 1 list item in either fragment
    // Move items to keep at least 2 together, or move all to second fragment
    apply_list_orphan_prevention(
        &mut first_fragment_children,
        &mut second_fragment_children,
        container_top_y,
    );

    (
        BoxContent::Container(first_fragment_children),
        BoxContent::Container(second_fragment_children),
    )
}

/// Move trailing headings from first fragment to second fragment to prevent orphans
fn move_orphaned_headings_to_second_fragment(
    first: &mut Vec<LayoutBox>,
    second: &mut Vec<LayoutBox>,
    container_top_y: f64,
) {
    // Collect trailing elements to move: headings and any empty/border boxes that follow them
    // This handles cases like: [text_box(heading), border_box] where border_box has height=0
    let mut elements_to_move = Vec::new();

    // First, collect any trailing empty/border boxes (they should move with their heading)
    while let Some(last) = first.last() {
        if matches!(&last.content, BoxContent::Empty) || last.height == 0.0 {
            elements_to_move.push(first.pop().unwrap());
        } else {
            break;
        }
    }

    // Now check if the last remaining element is a heading
    let mut found_heading = false;
    while let Some(last) = first.last() {
        if last.element_type.is_some_and(|et| et.is_heading()) {
            found_heading = true;
            elements_to_move.push(first.pop().unwrap());
        } else {
            break;
        }
    }

    // If no heading was found, put the empty boxes back
    if !found_heading {
        while let Some(elem) = elements_to_move.pop() {
            first.push(elem);
        }
        return;
    }

    // We found a heading - rename for clarity
    let mut headings_to_move = elements_to_move;

    // If we found headings, prepend them to second fragment
    if !headings_to_move.is_empty() {
        // Reverse to restore original order (we popped from end)
        headings_to_move.reverse();

        // Prepend headings to second fragment and restack
        headings_to_move.append(second);
        *second = headings_to_move;
        restack_boxes_vertically(second, container_top_y);
    }
}

/// Apply list orphan/widow prevention
///
/// When splitting a list container, ensure neither fragment has just 1 list item.
/// If the second fragment would have only 1 item (orphan), move items from the first
/// fragment to keep at least 2 together.
fn apply_list_orphan_prevention(
    first: &mut Vec<LayoutBox>,
    second: &mut Vec<LayoutBox>,
    container_top_y: f64,
) {
    use layout_types::ElementType;

    // Count list items in each fragment
    let first_list_items: usize = first
        .iter()
        .filter(|b| matches!(b.element_type, Some(ElementType::ListItem)))
        .count();
    let second_list_items: usize = second
        .iter()
        .filter(|b| matches!(b.element_type, Some(ElementType::ListItem)))
        .count();

    // No action needed if neither fragment has list items, or if both have 2+
    if first_list_items == 0 && second_list_items == 0 {
        return;
    }
    if first_list_items >= 2 && second_list_items >= 2 {
        return;
    }
    if first_list_items == 0 || second_list_items == 0 {
        // One fragment has no list items - that's fine
        return;
    }

    // At this point, we have list items in both fragments, but at least one has only 1 item

    // If second fragment has only 1 list item (orphan at top of page), move more from first
    if second_list_items == 1 && first_list_items >= 1 {
        // Move the last list item from first to second to give second at least 2 items
        // Keep moving until second has 2, or first runs out of list items
        while second
            .iter()
            .filter(|b| matches!(b.element_type, Some(ElementType::ListItem)))
            .count()
            < 2
        {
            // Find and remove last list item from first fragment
            let last_li_idx = first
                .iter()
                .rposition(|b| matches!(b.element_type, Some(ElementType::ListItem)));

            if let Some(idx) = last_li_idx {
                let item = first.remove(idx);
                second.insert(0, item);
            } else {
                break; // No more list items in first
            }
        }

        restack_boxes_vertically(second, container_top_y);
    }

    // If first fragment has only 1 list item left (widow at bottom of page), move it to second
    let first_list_items_after: usize = first
        .iter()
        .filter(|b| matches!(b.element_type, Some(ElementType::ListItem)))
        .count();

    if first_list_items_after == 1 {
        // Find and move the lone list item to second fragment
        if let Some(idx) = first
            .iter()
            .position(|b| matches!(b.element_type, Some(ElementType::ListItem)))
        {
            let item = first.remove(idx);
            second.insert(0, item);
            restack_boxes_vertically(second, container_top_y);
        }
    }
}

/// Split text lines across a page boundary
///
/// Implements widow/orphan prevention: requires at least 2 lines in each fragment
/// to avoid splitting a paragraph with only 1 line on a page.
///
/// # Arguments
/// * `lines` - Text lines to split
/// * `split_height` - Height available for first fragment
/// * `style` - Style containing font size and line height
///
/// # Returns
/// Tuple of (first_fragment_content, second_fragment_content)
pub fn split_text_lines(
    lines: Vec<TextLine>,
    split_height: f64,
    style: &StyleDeclaration,
) -> (BoxContent, BoxContent) {
    let line_height = get_line_height(style);

    // Calculate how many lines fit in split_height
    let lines_in_first = (split_height / line_height).floor() as usize;
    let lines_in_first = lines_in_first.min(lines.len());

    // Widow/orphan prevention: require at least 2 lines in each fragment
    // Only applies when we would actually create two non-empty fragments
    const MIN_LINES_PER_FRAGMENT: usize = 2;

    // If we can't fit anything, return empty first fragment (let caller decide what to do)
    if lines_in_first == 0 {
        return (BoxContent::Text(Vec::new()), BoxContent::Text(lines));
    }

    // If all lines fit, return them in first fragment
    if lines_in_first >= lines.len() {
        return (BoxContent::Text(lines), BoxContent::Text(Vec::new()));
    }

    // Now we know we're splitting: 0 < lines_in_first < lines.len()
    // Apply widow/orphan prevention
    if lines_in_first < MIN_LINES_PER_FRAGMENT
        || (lines.len() - lines_in_first) < MIN_LINES_PER_FRAGMENT
    {
        // Can't split without creating orphan/widow - return all in second fragment
        return (BoxContent::Text(Vec::new()), BoxContent::Text(lines));
    }

    let (first_lines, second_lines) = lines.split_at(lines_in_first);

    (
        BoxContent::Text(first_lines.to_vec()),
        BoxContent::Text(second_lines.to_vec()),
    )
}

/// Calculate the actual height of box content
///
/// # Arguments
/// * `content` - Box content to measure
/// * `style` - Style for font/line height calculations
///
/// # Returns
/// Height in points
pub fn calculate_content_height(content: &BoxContent, style: &StyleDeclaration) -> f64 {
    match content {
        BoxContent::Container(children) => {
            if children.is_empty() {
                return 0.0;
            }
            // Find min Y (top) and max Y+height (bottom) of children
            let min_y = children.iter().map(|c| c.y).fold(f64::INFINITY, f64::min);
            let max_y = children
                .iter()
                .map(|c| c.y + c.height)
                .fold(0.0_f64, f64::max);
            max_y - min_y
        }
        BoxContent::Text(lines) => lines.len() as f64 * get_line_height(style),
        BoxContent::Empty => 0.0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use layout_types::{TextLine, TextStyle};

    #[test]
    fn test_split_text_lines_basic() {
        let lines = vec![
            TextLine::from("Line 1"),
            TextLine::from("Line 2"),
            TextLine::from("Line 3"),
        ];
        let style = StyleDeclaration {
            text: TextStyle {
                line_height: Some(20.0),
                ..Default::default()
            },
            ..Default::default()
        };

        // Split at 30pt (would fit 1 line, but widow/orphan prevention refuses)
        // Expects all lines to move to second fragment to prevent 1-line orphan
        let (first, second) = split_text_lines(lines.clone(), 30.0, &style);

        if let (BoxContent::Text(first_lines), BoxContent::Text(second_lines)) = (first, second) {
            assert_eq!(first_lines.len(), 0, "Should prevent 1-line orphan");
            assert_eq!(
                second_lines.len(),
                3,
                "All lines should move to second fragment"
            );
        } else {
            panic!("Expected Text content");
        }
    }

    #[test]
    fn test_calculate_content_height_text() {
        let content = BoxContent::Text(vec![TextLine::from("Line 1"), TextLine::from("Line 2")]);
        let style = StyleDeclaration {
            text: TextStyle {
                line_height: Some(15.0),
                ..Default::default()
            },
            ..Default::default()
        };

        assert_eq!(calculate_content_height(&content, &style), 30.0);
    }

    #[test]
    fn test_split_text_lines_prevents_orphan() {
        // Test that splitting doesn't create 1-line orphans
        let lines = vec![
            TextLine::from("Line 1"),
            TextLine::from("Line 2"),
            TextLine::from("Line 3"),
        ];
        let style = StyleDeclaration {
            text: TextStyle {
                line_height: Some(20.0),
                ..Default::default()
            },
            ..Default::default()
        };

        // Try to split at 30pt (would fit only 1 line)
        let (first, second) = split_text_lines(lines.clone(), 30.0, &style);

        // Should refuse to split - all lines go to second fragment
        if let (BoxContent::Text(first_lines), BoxContent::Text(second_lines)) = (first, second) {
            assert_eq!(first_lines.len(), 0, "Should not create 1-line orphan");
            assert_eq!(
                second_lines.len(),
                3,
                "All lines should go to second fragment"
            );
        } else {
            panic!("Expected Text content");
        }
    }

    #[test]
    fn test_split_text_lines_prevents_widow() {
        // Test that splitting doesn't create 1-line widows
        let lines = vec![
            TextLine::from("Line 1"),
            TextLine::from("Line 2"),
            TextLine::from("Line 3"),
        ];
        let style = StyleDeclaration {
            text: TextStyle {
                line_height: Some(20.0),
                ..Default::default()
            },
            ..Default::default()
        };

        // Try to split at 50pt (would fit 2 lines, leaving 1 line widow)
        let (first, second) = split_text_lines(lines, 50.0, &style);

        // Should refuse to split - all lines go to second fragment
        if let (BoxContent::Text(first_lines), BoxContent::Text(second_lines)) = (first, second) {
            assert_eq!(first_lines.len(), 0, "Should not create 1-line widow");
            assert_eq!(
                second_lines.len(),
                3,
                "All lines should go to second fragment"
            );
        } else {
            panic!("Expected Text content");
        }
    }

    #[test]
    fn test_split_text_lines_allows_valid_split() {
        // Test that valid splits (2+ lines each) work
        let lines = vec![
            TextLine::from("Line 1"),
            TextLine::from("Line 2"),
            TextLine::from("Line 3"),
            TextLine::from("Line 4"),
        ];
        let style = StyleDeclaration {
            text: TextStyle {
                line_height: Some(20.0),
                ..Default::default()
            },
            ..Default::default()
        };

        // Split at 50pt (fits 2 lines, leaves 2 lines)
        let (first, second) = split_text_lines(lines, 50.0, &style);

        if let (BoxContent::Text(first_lines), BoxContent::Text(second_lines)) = (first, second) {
            assert_eq!(
                first_lines.len(),
                2,
                "Should split 2 lines to first fragment"
            );
            assert_eq!(
                second_lines.len(),
                2,
                "Should split 2 lines to second fragment"
            );
        } else {
            panic!("Expected Text content");
        }
    }

    #[test]
    fn test_split_box_at_height_text_box() {
        // Test splitting a text box
        let text_box = LayoutBox {
            x: 0.0,
            y: 100.0,
            width: 200.0,
            height: 80.0, // 4 lines * 20pt
            content: BoxContent::Text(vec![
                TextLine::from("Line 1"),
                TextLine::from("Line 2"),
                TextLine::from("Line 3"),
                TextLine::from("Line 4"),
            ]),
            style: StyleDeclaration {
                text: TextStyle {
                    line_height: Some(20.0),
                    ..Default::default()
                },
                ..Default::default()
            },
            element_type: None,
        };

        // Split at 50pt (should fit 2 lines in first fragment, 2 in second)
        let (first, second) = split_box_at_height(text_box, 50.0, 100.0);

        // Check first fragment
        assert_eq!(
            first.height, 40.0,
            "First fragment should have height for 2 lines"
        );
        if let BoxContent::Text(lines) = first.content {
            assert_eq!(lines.len(), 2, "First fragment should have 2 lines");
        } else {
            panic!("Expected Text content in first fragment");
        }

        // Check second fragment
        assert_eq!(
            second.height, 40.0,
            "Second fragment should have height for 2 lines"
        );
        if let BoxContent::Text(lines) = second.content {
            assert_eq!(lines.len(), 2, "Second fragment should have 2 lines");
        } else {
            panic!("Expected Text content in second fragment");
        }
    }

    #[test]
    fn test_split_container_with_text_children() {
        // Test splitting a container with multiple text children
        let child1 = LayoutBox {
            x: 0.0,
            y: 100.0,
            width: 200.0,
            height: 20.0,
            content: BoxContent::Text(vec![TextLine::from("Child 1 text")]),
            style: StyleDeclaration::default(),
            element_type: None,
        };

        let child2 = LayoutBox {
            x: 0.0,
            y: 120.0,
            width: 200.0,
            height: 20.0,
            content: BoxContent::Text(vec![TextLine::from("Child 2 text")]),
            style: StyleDeclaration::default(),
            element_type: None,
        };

        let child3 = LayoutBox {
            x: 0.0,
            y: 140.0,
            width: 200.0,
            height: 20.0,
            content: BoxContent::Text(vec![TextLine::from("Child 3 text")]),
            style: StyleDeclaration::default(),
            element_type: None,
        };

        let container = LayoutBox {
            x: 0.0,
            y: 100.0,
            width: 200.0,
            height: 60.0,
            content: BoxContent::Container(vec![child1, child2, child3]),
            style: StyleDeclaration::default(),
            element_type: None,
        };

        // Split at y=130 (after child1, in middle of child2)
        let (first, second) = split_box_at_height(container, 30.0, 100.0);

        // First fragment should contain only child1
        // (child2 is single-line and refuses to split due to widow/orphan prevention)
        if let BoxContent::Container(children) = first.content {
            assert_eq!(
                children.len(),
                1,
                "First fragment should have 1 child (child1 only, child2 moved to second)"
            );

            // Child 1 should be complete
            if let BoxContent::Text(lines) = &children[0].content {
                assert_eq!(
                    lines[0].plain_text(),
                    "Child 1 text",
                    "First child should have its text"
                );
            } else {
                panic!("Expected text in first child");
            }
        } else {
            panic!("Expected Container in first fragment");
        }

        // Second fragment should contain child2 and child3 (both complete)
        if let BoxContent::Container(children) = second.content {
            assert_eq!(
                children.len(),
                2,
                "Second fragment should have child2 and child3"
            );

            // Verify child2 text is preserved
            if let BoxContent::Text(lines) = &children[0].content {
                assert_eq!(
                    lines[0].plain_text(),
                    "Child 2 text",
                    "Child2 text should be preserved"
                );
            } else {
                panic!("Expected text in child2");
            }

            // Verify child3 text is preserved
            if let BoxContent::Text(lines) = &children[1].content {
                assert_eq!(
                    lines[0].plain_text(),
                    "Child 3 text",
                    "Child3 text should be preserved"
                );
            } else {
                panic!("Expected text in child3");
            }
        } else {
            panic!("Expected Container in second fragment");
        }
    }

    #[test]
    fn test_split_text_box_with_widow_orphan_prevention() {
        // Test that splitting a 3-line text box refuses to create orphan/widow
        let text_box = LayoutBox {
            x: 0.0,
            y: 100.0,
            width: 200.0,
            height: 60.0, // 3 lines * 20pt
            content: BoxContent::Text(vec![
                TextLine::from("Line 1"),
                TextLine::from("Line 2"),
                TextLine::from("Line 3"),
            ]),
            style: StyleDeclaration {
                text: TextStyle {
                    line_height: Some(20.0),
                    ..Default::default()
                },
                ..Default::default()
            },
            element_type: None,
        };

        // Try to split at 30pt (would create 1-line orphan + 2-line widow)
        let (first, second) = split_box_at_height(text_box, 30.0, 100.0);

        // First fragment should be empty (widow/orphan prevention)
        assert_eq!(
            first.height, 0.0,
            "First fragment should be empty due to widow/orphan prevention"
        );
        if let BoxContent::Text(lines) = first.content {
            assert_eq!(lines.len(), 0, "First fragment should have no lines");
        } else {
            panic!("Expected Text content in first fragment");
        }

        // Second fragment should have all 3 lines
        assert_eq!(
            second.height, 60.0,
            "Second fragment should have all 3 lines"
        );
        if let BoxContent::Text(lines) = second.content {
            assert_eq!(lines.len(), 3, "Second fragment should have all 3 lines");
        } else {
            panic!("Expected Text content in second fragment");
        }
    }

    #[test]
    fn test_split_ul_container_with_orphan_prevention() {
        // Test that orphan prevention moves items when second fragment would have only 1 item
        // With 3 items split at a point where 1 would be orphaned on second page,
        // all items should move to second fragment to prevent orphan

        let li1 = LayoutBox {
            x: 20.0,
            y: 700.0,
            width: 180.0,
            height: 12.0,
            content: BoxContent::Text(vec![TextLine::from("First bullet point")]),
            style: StyleDeclaration {
                text: TextStyle {
                    font_size: Some(10.0),
                    line_height: Some(12.0),
                    ..Default::default()
                },
                ..Default::default()
            },
            element_type: Some(layout_types::ElementType::ListItem),
        };

        let li2 = LayoutBox {
            x: 20.0,
            y: 712.0,
            width: 180.0,
            height: 12.0,
            content: BoxContent::Text(vec![TextLine::from("Second bullet point")]),
            style: StyleDeclaration {
                text: TextStyle {
                    font_size: Some(10.0),
                    line_height: Some(12.0),
                    ..Default::default()
                },
                ..Default::default()
            },
            element_type: Some(layout_types::ElementType::ListItem),
        };

        let li3 = LayoutBox {
            x: 20.0,
            y: 724.0,
            width: 180.0,
            height: 12.0,
            content: BoxContent::Text(vec![TextLine::from("Third bullet point")]),
            style: StyleDeclaration {
                text: TextStyle {
                    font_size: Some(10.0),
                    line_height: Some(12.0),
                    ..Default::default()
                },
                ..Default::default()
            },
            element_type: Some(layout_types::ElementType::ListItem),
        };

        let ul_container = LayoutBox {
            x: 20.0,
            y: 700.0,
            width: 180.0,
            height: 36.0, // 3 items * 12pt each
            content: BoxContent::Container(vec![li1, li2, li3]),
            style: StyleDeclaration::default(),
            element_type: Some(layout_types::ElementType::UnorderedList),
        };

        // Split at 30pt - would normally put li1, li2 on first page, li3 alone on second (orphan)
        // With orphan prevention, all 3 items should move to second fragment
        let (first, second) = split_box_at_height(ul_container, 30.0, 700.0);

        // First fragment should be empty (all items moved to prevent orphan)
        if let BoxContent::Container(children) = first.content {
            assert_eq!(
                children.len(),
                0,
                "First fragment should be empty - items moved to prevent orphan"
            );
        } else {
            panic!("Expected Container in first fragment");
        }

        // Second fragment should have all 3 items
        if let BoxContent::Container(children) = second.content {
            assert_eq!(
                children.len(),
                3,
                "Second fragment should have all 3 list items"
            );
        } else {
            panic!("Expected Container in second fragment");
        }
    }

    #[test]
    fn test_heading_not_orphaned_when_container_split() {
        // Test that when a section container is split, a heading at the end of the first
        // fragment is moved to the second fragment to prevent orphaning.
        // This reproduces the EDUCATION section bug where the heading ended up alone on page 2.

        let heading = LayoutBox {
            x: 0.0,
            y: 700.0,
            width: 200.0,
            height: 20.0,
            content: BoxContent::Text(vec![TextLine::from("EDUCATION")]),
            style: StyleDeclaration::default(),
            element_type: Some(layout_types::ElementType::Heading2),
        };

        let content = LayoutBox {
            x: 0.0,
            y: 720.0,
            width: 200.0,
            height: 60.0,
            content: BoxContent::Text(vec![
                TextLine::from("Mathematician, Mathematics Teacher"),
                TextLine::from("Perm State University"),
                TextLine::from("Perm, Russia"),
            ]),
            style: StyleDeclaration {
                text: TextStyle {
                    line_height: Some(20.0),
                    ..Default::default()
                },
                ..Default::default()
            },
            element_type: None,
        };

        let section = LayoutBox {
            x: 0.0,
            y: 700.0,
            width: 200.0,
            height: 80.0,
            content: BoxContent::Container(vec![heading, content]),
            style: StyleDeclaration::default(),
            element_type: Some(layout_types::ElementType::Section),
        };

        // Split at y=725 - heading fits (ends at 720), content doesn't (starts at 720)
        // Without fix: heading in first fragment (orphaned), content in second
        // With fix: both heading and content in second fragment
        let (first, second) = split_box_at_height(section, 25.0, 700.0);

        // First fragment should be EMPTY - heading should move to second to avoid orphan
        if let BoxContent::Container(children) = &first.content {
            assert_eq!(
                children.len(),
                0,
                "First fragment should have NO children - heading should move to prevent orphan"
            );
        } else {
            panic!("Expected Container in first fragment");
        }

        // Second fragment should have BOTH heading and content
        if let BoxContent::Container(children) = &second.content {
            assert_eq!(
                children.len(),
                2,
                "Second fragment should have both heading and content"
            );
            assert_eq!(
                children[0].element_type,
                Some(layout_types::ElementType::Heading2),
                "First child should be the heading"
            );
        } else {
            panic!("Expected Container in second fragment");
        }
    }

    #[test]
    fn test_split_list_item_with_single_line_text() {
        // Reproduce the missing bullet text bug:
        // A list item container with a single-line text child gets split,
        // and the text disappears

        let bullet_text = LayoutBox {
            x: 20.0,
            y: 700.0,
            width: 180.0,
            height: 13.0,
            content: BoxContent::Text(vec![TextLine::from(
                "Built backend services and RESTful APIs",
            )]),
            style: StyleDeclaration {
                text: TextStyle {
                    line_height: Some(13.0),
                    font_size: Some(10.0),
                    ..Default::default()
                },
                ..Default::default()
            },
            element_type: None,
        };

        let list_item = LayoutBox {
            x: 20.0,
            y: 700.0,
            width: 180.0,
            height: 20.0,
            content: BoxContent::Container(vec![bullet_text]),
            style: StyleDeclaration::default(),
            element_type: Some(layout_types::ElementType::ListItem),
        };

        // Split at y=710 (10pt into the list item)
        let (first, second) = split_box_at_height(list_item, 10.0, 700.0);

        // First fragment should have no children (text moved to second due to widow/orphan prevention)
        if let BoxContent::Container(children) = &first.content {
            assert_eq!(children.len(), 0, "First fragment should have NO children (text moved to second due to widow/orphan prevention)");
        }

        // Verify text is preserved in the second fragment
        if let BoxContent::Container(children) = second.content {
            assert!(
                !children.is_empty(),
                "Second fragment should have the text child"
            );
            if let Some(child) = children.first() {
                if let BoxContent::Text(lines) = &child.content {
                    assert_eq!(lines.len(), 1, "Text should have 1 line");
                    assert_eq!(
                        lines[0].plain_text(),
                        "Built backend services and RESTful APIs",
                        "Text content should be preserved"
                    );
                } else {
                    panic!("Child should be Text content");
                }
            }
        } else {
            panic!("Second fragment should be Container");
        }
    }
}
