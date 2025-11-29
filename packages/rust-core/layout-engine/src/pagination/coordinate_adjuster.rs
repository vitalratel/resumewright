//! Y coordinate adjustment for pagination
//!
//! When boxes are moved to new pages, their Y coordinates need to be adjusted
//! while maintaining relative positioning of nested children.

use layout_types::{BoxContent, LayoutBox};

/// Recursively adjust Y coordinates for a box and its children
///
/// Sets the box's Y coordinate to the specified value and adjusts all nested
/// children by the same delta to maintain relative positioning.
///
/// # Arguments
/// * `layout_box` - The box to adjust (modified in place)
/// * `new_y` - The new absolute Y coordinate for the box's top edge
///
/// # Algorithm
/// 1. Calculate the Y delta (difference between new and current Y position)
/// 2. Set the box's Y coordinate to the new value
/// 3. If the box is a Container, recursively adjust all children by the same delta
///
/// # Example
/// ```text
/// Original:  Box at Y=500, Child at Y=520 (20pt below parent)
/// New page:  Box moved to Y=100
/// Delta:     100 - 500 = -400
/// Result:    Box at Y=100, Child at Y=120 (still 20pt below parent)
/// ```
pub fn adjust_box_y_coordinates(layout_box: &mut LayoutBox, new_y: f64) {
    let y_diff = new_y - layout_box.y;
    layout_box.y = new_y;

    // Recursively adjust children if this is a container
    if let BoxContent::Container(ref mut children) = layout_box.content {
        for child in children.iter_mut() {
            adjust_box_y_coordinates(child, child.y + y_diff);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use layout_types::{ElementType, StyleDeclaration};

    fn create_test_box(y: f64, height: f64) -> LayoutBox {
        LayoutBox {
            x: 0.0,
            y,
            width: 100.0,
            height,
            content: BoxContent::Text(vec!["Test".to_string()]),
            element_type: None,
            style: StyleDeclaration::default(),
        }
    }

    #[test]
    fn test_adjust_simple_box() {
        let mut box_simple = create_test_box(100.0, 50.0);
        adjust_box_y_coordinates(&mut box_simple, 200.0);
        assert_eq!(box_simple.y, 200.0);
    }

    #[test]
    fn test_adjust_box_with_children() {
        let child1 = create_test_box(520.0, 15.0);
        let child2 = create_test_box(540.0, 30.0);

        let mut parent = LayoutBox {
            x: 0.0,
            y: 500.0,
            width: 100.0,
            height: 70.0,
            content: BoxContent::Container(vec![child1, child2]),
            element_type: Some(ElementType::Div),
            style: StyleDeclaration::default(),
        };

        adjust_box_y_coordinates(&mut parent, 72.0);

        assert_eq!(parent.y, 72.0);

        if let BoxContent::Container(ref children) = parent.content {
            // Original: parent=500, children at 520, 540 (offsets of 20, 40)
            // New: parent=72, should be children at 92, 112 (same offsets)
            assert_eq!(children[0].y, 92.0);
            assert_eq!(children[1].y, 112.0);

            // Verify offsets maintained
            assert_eq!(children[0].y - parent.y, 20.0);
            assert_eq!(children[1].y - parent.y, 40.0);
        } else {
            panic!("Expected Container");
        }
    }
}
