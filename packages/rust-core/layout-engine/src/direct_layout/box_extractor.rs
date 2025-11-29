//! LayoutBox extraction from Taffy layout tree
//!
//! This module converts Taffy's computed layout results into ResumeWright's
//! LayoutBox tree structure, which is then used for PDF rendering.

use super::text_measurement::TextMeasureContext;
use crate::error::LayoutError;
use crate::text_layout::{wrap_text_with_config, TextLayoutConfig};
use layout_types::{BoxContent, ElementType, LayoutBox, Rect, StyleDeclaration, TextMeasurer};
use std::collections::HashMap;
use taffy::prelude::*;

/// Default font size for text layout (10pt)
const DEFAULT_FONT_SIZE: f64 = 10.0;

/// Default font family (PDF Standard 14 font)
const DEFAULT_FONT_FAMILY: &str = "Helvetica";

/// Stores information needed to create LayoutBox from Taffy layout
///
/// This struct associates semantic information (element type, styles, content)
/// with Taffy's NodeId, allowing us to reconstruct the full LayoutBox tree
/// after Taffy computes positions and dimensions.
#[derive(Debug, Clone)]
pub struct JsxElementInfo {
    pub element_type: Option<ElementType>,
    pub style: StyleDeclaration,
    pub content_type: ContentType,
}

/// Content type for a layout node
#[derive(Debug, Clone)]
pub enum ContentType {
    /// Text content with the actual string
    Text(String),
    /// Container node (has children)
    Container,
}

/// Extract LayoutBox tree from Taffy layout (recursive)
///
/// Converts Taffy's computed layout (positions, dimensions) back into
/// ResumeWright's LayoutBox tree structure. This function recursively
/// processes the Taffy tree, extracting layout information and wrapping
/// text content to fit within computed widths.
///
/// # Arguments
///
/// * `tree` - The Taffy tree with computed layout
/// * `node_info_map` - Map of NodeId to JsxElementInfo (semantic information)
/// * `node_id` - Current node to process
/// * `offset_x` - X offset from parent (for absolute positioning)
/// * `offset_y` - Y offset from parent (for absolute positioning)
/// * `measurer` - Text measurement implementation for wrapping
///
/// # Returns
///
/// Vector of LayoutBox (typically one box, but may be multiple for special cases)
///
/// # Errors
///
/// Returns LayoutError if:
/// - Node info is missing from the map
/// - Failed to get layout from Taffy
/// - Failed to get children from Taffy
/// - Text wrapping fails
pub fn taffy_to_layout_boxes(
    tree: &TaffyTree<TextMeasureContext>,
    node_info_map: &HashMap<NodeId, JsxElementInfo>,
    node_id: NodeId,
    offset_x: f64,
    offset_y: f64,
    measurer: &dyn TextMeasurer,
) -> Result<Vec<LayoutBox>, LayoutError> {
    // Get info for this node
    let info = node_info_map.get(&node_id).ok_or_else(|| {
        LayoutError::CalculationFailed(format!("Node info missing for node {:?}", node_id))
    })?;

    // Get computed layout from Taffy
    let layout = tree
        .layout(node_id)
        .map_err(|e| LayoutError::CalculationFailed(format!("Failed to get layout: {}", e)))?;

    let bounds = Rect::new(
        offset_x + layout.location.x as f64,
        offset_y + layout.location.y as f64,
        layout.size.width as f64,
        layout.size.height as f64,
    );

    match &info.content_type {
        ContentType::Text(text) => {
            extract_text_box(text, bounds, &info.style, info.element_type, measurer)
        }
        ContentType::Container => {
            extract_container_box(tree, node_info_map, node_id, bounds, info, measurer)
        }
    }
}

/// Extract a text LayoutBox
fn extract_text_box(
    text: &str,
    bounds: Rect,
    style: &StyleDeclaration,
    element_type: Option<ElementType>,
    measurer: &dyn TextMeasurer,
) -> Result<Vec<LayoutBox>, LayoutError> {
    // Wrap text to fit within computed width
    let config = TextLayoutConfig::default();
    let font_size = style.text.font_size.unwrap_or(DEFAULT_FONT_SIZE);
    let font_name = style
        .text
        .font_family
        .clone()
        .unwrap_or_else(|| DEFAULT_FONT_FAMILY.to_string());

    // Check if text needs wrapping by comparing width to max-content width
    let max_content_width =
        crate::text_layout::calculate_text_width(text, font_size, &font_name, measurer);

    // Use 1pt tolerance to handle Taffy's integer rounding during flex layout
    // Taffy may assign box widths slightly smaller than max-content (e.g., 130pt vs 130.55pt)
    let lines = if bounds.width >= max_content_width - 1.0 {
        // Width is sufficient for max-content (with tolerance for flex layout rounding)
        // No wrapping needed - text fits on single line
        vec![text.to_string()]
    } else {
        // Width is significantly constrained - wrap text to fit
        wrap_text_with_config(text, bounds.width, font_size, &font_name, &config, measurer)?
    };

    Ok(vec![LayoutBox {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        content: BoxContent::Text(lines),
        style: style.clone(),
        element_type,
    }])
}

/// Extract a container LayoutBox with children
fn extract_container_box(
    tree: &TaffyTree<TextMeasureContext>,
    node_info_map: &HashMap<NodeId, JsxElementInfo>,
    node_id: NodeId,
    bounds: Rect,
    info: &JsxElementInfo,
    measurer: &dyn TextMeasurer,
) -> Result<Vec<LayoutBox>, LayoutError> {
    // Get child node IDs from Taffy
    let child_ids = tree
        .children(node_id)
        .map_err(|e| LayoutError::CalculationFailed(format!("Failed to get children: {}", e)))?;

    // Recursively process children with proper info tracking
    let mut child_boxes = Vec::new();
    for child_id in child_ids.iter() {
        let child_box_list = taffy_to_layout_boxes(
            tree,
            node_info_map,
            *child_id,
            bounds.x, // Parent's x becomes offset for children
            bounds.y, // Parent's y becomes offset for children
            measurer,
        )?;
        child_boxes.extend(child_box_list);
    }

    Ok(vec![LayoutBox {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        content: BoxContent::Container(child_boxes),
        style: info.style.clone(),
        element_type: info.element_type,
    }])
}

#[cfg(test)]
mod tests {
    use super::*;

    // Mock text measurer for testing
    struct MockTextMeasurer;

    impl TextMeasurer for MockTextMeasurer {
        fn measure_text(&self, text: &str, _font_size: f64, _font_name: &str) -> f64 {
            // Simple mock: 6 points per character
            text.len() as f64 * 6.0
        }
    }

    #[test]
    fn test_extract_text_box() {
        let style = StyleDeclaration::default();
        let measurer = MockTextMeasurer;
        let bounds = Rect::new(10.0, 20.0, 200.0, 30.0);

        let result = extract_text_box(
            "Hello World",
            bounds,
            &style,
            Some(ElementType::Paragraph),
            &measurer,
        );

        assert!(result.is_ok());
        let boxes = result.unwrap();
        assert_eq!(boxes.len(), 1);

        let layout_box = &boxes[0];
        assert_eq!(layout_box.x, 10.0);
        assert_eq!(layout_box.y, 20.0);
        assert_eq!(layout_box.width, 200.0);
        assert_eq!(layout_box.height, 30.0);
        assert_eq!(layout_box.element_type, Some(ElementType::Paragraph));

        match &layout_box.content {
            BoxContent::Text(lines) => {
                assert_eq!(lines.len(), 1);
                assert_eq!(lines[0], "Hello World");
            }
            _ => panic!("Expected Text content"),
        }
    }

    #[test]
    fn test_extract_text_box_with_custom_font() {
        let mut style = StyleDeclaration::default();
        style.text.font_size = Some(14.0);
        style.text.font_family = Some("Arial".to_string());
        let measurer = MockTextMeasurer;
        let bounds = Rect::new(0.0, 0.0, 100.0, 20.0);

        let result = extract_text_box("Test", bounds, &style, None, &measurer);

        assert!(result.is_ok());
    }

    #[test]
    fn test_content_type_text() {
        let content = ContentType::Text("Sample".to_string());

        match content {
            ContentType::Text(s) => assert_eq!(s, "Sample"),
            _ => panic!("Expected Text variant"),
        }
    }

    #[test]
    fn test_content_type_container() {
        let content = ContentType::Container;

        match content {
            ContentType::Container => {} // Success
            _ => panic!("Expected Container variant"),
        }
    }

    #[test]
    fn test_jsx_element_info_creation() {
        let mut style = StyleDeclaration::default();
        style.text.font_size = Some(24.0);
        let info = JsxElementInfo {
            element_type: Some(ElementType::Heading1),
            style,
            content_type: ContentType::Text("Title".to_string()),
        };

        assert_eq!(info.element_type, Some(ElementType::Heading1));
        assert_eq!(info.style.text.font_size, Some(24.0));

        match info.content_type {
            ContentType::Text(ref s) => assert_eq!(s, "Title"),
            _ => panic!("Expected Text content type"),
        }
    }

    #[test]
    fn test_extract_text_box_empty_string() {
        let style = StyleDeclaration::default();
        let measurer = MockTextMeasurer;
        let bounds = Rect::new(0.0, 0.0, 100.0, 20.0);

        let result = extract_text_box("", bounds, &style, None, &measurer);

        assert!(result.is_ok());
        let boxes = result.unwrap();
        assert_eq!(boxes.len(), 1);

        match &boxes[0].content {
            BoxContent::Text(lines) => {
                // Empty string should produce one empty line
                assert!(!lines.is_empty());
            }
            _ => panic!("Expected Text content"),
        }
    }
}
