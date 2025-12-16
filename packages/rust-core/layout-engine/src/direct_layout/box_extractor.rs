//! LayoutBox extraction from Taffy layout tree
//!
//! This module converts Taffy's computed layout results into ResumeWright's
//! LayoutBox tree structure, which is then used for PDF rendering.

use super::text_measurement::TextMeasureContext;
use crate::error::LayoutError;
use crate::text_layout::TextLayoutConfig;
use layout_types::{
    BoxContent, ElementType, LayoutBox, Rect, StyleDeclaration, TextLine, TextMeasurer,
    TextSegment, DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE,
};
use std::collections::HashMap;
use taffy::prelude::*;

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
    /// Text content with styled segments (for inline formatting like bold/italic spans)
    Text(Vec<TextSegment>),
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
        ContentType::Text(segments) => {
            extract_text_box(segments, bounds, &info.style, info.element_type, measurer)
        }
        ContentType::Container => {
            extract_container_box(tree, node_info_map, node_id, bounds, info, measurer)
        }
    }
}

/// Extract a text LayoutBox from styled segments
fn extract_text_box(
    segments: &[TextSegment],
    bounds: Rect,
    style: &StyleDeclaration,
    element_type: Option<ElementType>,
    measurer: &dyn TextMeasurer,
) -> Result<Vec<LayoutBox>, LayoutError> {
    let font_size = style.text.font_size.unwrap_or(DEFAULT_FONT_SIZE);
    let font_name = style
        .text
        .font_family
        .clone()
        .unwrap_or_else(|| DEFAULT_FONT_FAMILY.to_string());

    // Concatenate all segment text to check total width
    let full_text: String = segments.iter().map(|s| s.text.as_str()).collect();

    // Check if text needs wrapping by comparing width to max-content width
    let max_content_width =
        crate::text_layout::calculate_text_width(&full_text, font_size, &font_name, measurer);

    // Use 1pt tolerance to handle Taffy's integer rounding during flex layout
    let lines = if bounds.width >= max_content_width - 1.0 {
        // No wrapping needed - all segments fit on single line
        vec![TextLine::from_segments(segments.to_vec())]
    } else {
        // Need to wrap - use styled text wrapping
        wrap_styled_segments(segments, bounds.width, font_size, &font_name, measurer)?
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

/// Wrap styled segments across multiple lines while preserving styling
fn wrap_styled_segments(
    segments: &[TextSegment],
    max_width: f64,
    font_size: f64,
    font_name: &str,
    measurer: &dyn TextMeasurer,
) -> Result<Vec<TextLine>, LayoutError> {
    let _config = TextLayoutConfig::default();
    let mut lines: Vec<TextLine> = Vec::new();
    let mut current_line_segments: Vec<TextSegment> = Vec::new();
    let mut current_line_width = 0.0;

    for segment in segments {
        // Wrap this segment's text, preserving its style
        let segment_words: Vec<&str> = segment.text.split_whitespace().collect();

        for (i, word) in segment_words.iter().enumerate() {
            let word_with_space = if i == 0 && !current_line_segments.is_empty() {
                // Add space before word if not at start of line
                format!(" {}", word)
            } else if i > 0 {
                format!(" {}", word)
            } else {
                word.to_string()
            };

            let word_width = measurer.measure_text(&word_with_space, font_size, font_name);

            if current_line_width + word_width > max_width && !current_line_segments.is_empty() {
                // Start new line
                lines.push(TextLine::from_segments(current_line_segments));
                current_line_segments = Vec::new();

                // Add word without leading space on new line
                let word_only = word.to_string();
                let word_only_width = measurer.measure_text(&word_only, font_size, font_name);
                current_line_segments.push(TextSegment {
                    text: word_only,
                    font_weight: segment.font_weight,
                    font_style: segment.font_style,
                    font_size: segment.font_size,
                    text_decoration: segment.text_decoration,
                    color: segment.color,
                });
                current_line_width = word_only_width;
            } else {
                // Add to current line
                // Try to merge with previous segment if same style
                if let Some(last_seg) = current_line_segments.last_mut() {
                    if last_seg.font_weight == segment.font_weight
                        && last_seg.font_style == segment.font_style
                        && last_seg.font_size == segment.font_size
                        && last_seg.text_decoration == segment.text_decoration
                        && last_seg.color == segment.color
                    {
                        last_seg.text.push_str(&word_with_space);
                        current_line_width += word_width;
                        continue;
                    }
                }
                // Different style - add new segment
                current_line_segments.push(TextSegment {
                    text: word_with_space,
                    font_weight: segment.font_weight,
                    font_style: segment.font_style,
                    font_size: segment.font_size,
                    text_decoration: segment.text_decoration,
                    color: segment.color,
                });
                current_line_width += word_width;
            }
        }
    }

    // Don't forget the last line
    if !current_line_segments.is_empty() {
        lines.push(TextLine::from_segments(current_line_segments));
    }

    // If no content, return single empty line
    if lines.is_empty() {
        lines.push(TextLine::simple(String::new()));
    }

    Ok(lines)
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

        // Create segments for testing
        let segments = vec![TextSegment {
            text: "Hello World".to_string(),
            font_weight: None,
            font_style: None,
            font_size: None,
            text_decoration: None,
            color: None,
        }];

        let result = extract_text_box(
            &segments,
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
                assert_eq!(lines[0].plain_text(), "Hello World");
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

        let segments = vec![TextSegment {
            text: "Test".to_string(),
            font_weight: None,
            font_style: None,
            font_size: None,
            text_decoration: None,
            color: None,
        }];
        let result = extract_text_box(&segments, bounds, &style, None, &measurer);

        assert!(result.is_ok());
    }

    #[test]
    fn test_content_type_text() {
        let segments = vec![TextSegment {
            text: "Sample".to_string(),
            font_weight: None,
            font_style: None,
            font_size: None,
            text_decoration: None,
            color: None,
        }];
        let content = ContentType::Text(segments);

        match content {
            ContentType::Text(segs) => assert_eq!(segs[0].text, "Sample"),
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
        let segments = vec![TextSegment {
            text: "Title".to_string(),
            font_weight: None,
            font_style: None,
            font_size: None,
            text_decoration: None,
            color: None,
        }];
        let info = JsxElementInfo {
            element_type: Some(ElementType::Heading1),
            style,
            content_type: ContentType::Text(segments),
        };

        assert_eq!(info.element_type, Some(ElementType::Heading1));
        assert_eq!(info.style.text.font_size, Some(24.0));

        match info.content_type {
            ContentType::Text(ref segs) => assert_eq!(segs[0].text, "Title"),
            _ => panic!("Expected Text content type"),
        }
    }

    #[test]
    fn test_extract_text_box_empty_string() {
        let style = StyleDeclaration::default();
        let measurer = MockTextMeasurer;
        let bounds = Rect::new(0.0, 0.0, 100.0, 20.0);

        // Empty segments array
        let segments: Vec<TextSegment> = vec![];
        let result = extract_text_box(&segments, bounds, &style, None, &measurer);

        assert!(result.is_ok());
        let boxes = result.unwrap();
        assert_eq!(boxes.len(), 1);

        match &boxes[0].content {
            BoxContent::Text(lines) => {
                // Empty segments should produce one empty line
                assert!(!lines.is_empty());
            }
            _ => panic!("Expected Text content"),
        }
    }
}
