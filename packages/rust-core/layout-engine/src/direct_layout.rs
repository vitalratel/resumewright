//! Direct TSX to Layout conversion (Phase 2)
//!
//! This module provides direct conversion from TSX documents to layout structures
//! without the intermediate RenderNode layer. This simplifies the architecture and
//! improves performance by eliminating unnecessary data structure conversions.
//!
//! Pipeline: TSX → TsxDocument → Taffy Node → LayoutBox → LayoutStructure

// Sub-modules
pub mod box_extractor;
pub mod content_area;
pub mod element_mapping;
pub mod layout_element;
pub mod style_conversion;
pub mod text_measurement;
pub mod tree_builder;

use crate::error::LayoutError;
use crate::pagination::paginate_boxes;
use cv_domain::CVMetadata;
use cv_domain::TSXLayoutConfig;
use layout_types::{BoxContent, LayoutStructure, TextMeasurer};
use pdf_generator::config::PDFConfig;
use std::collections::HashMap;
use taffy::prelude::*;
use tsx_parser::TsxDocument;

// Imports from sub-modules
use box_extractor::taffy_to_layout_boxes;
use content_area::calculate_content_area;
use tree_builder::jsx_to_taffy;

/// Recursively flatten containers to extract leaf boxes, but preserve flex containers
///
/// This converts a nested LayoutBox tree into a mostly-flat list of boxes.
/// Regular containers are flattened (children extracted), but flex containers
/// are preserved so their children maintain horizontal positioning.
///
/// # Arguments
///
/// * `boxes` - Vector of LayoutBox (may contain nested containers)
///
/// # Returns
///
/// Vector of LayoutBox with flex containers preserved
fn flatten_containers_recursively(
    boxes: &[layout_types::LayoutBox],
) -> Vec<layout_types::LayoutBox> {
    use layout_types::Display;

    let mut flattened = Vec::new();

    for box_item in boxes {
        match &box_item.content {
            BoxContent::Container(children) => {
                // Check if this is a flex-row container - preserve it to maintain horizontal layout
                // Flex-column containers (like space-y-*) should be flattened to allow page breaking
                use pdf_generator::css_parser::FlexDirection;
                let is_flex = box_item.style.flex.display == Some(Display::Flex);
                let is_flex_row =
                    is_flex && box_item.style.flex.flex_direction != Some(FlexDirection::Column);

                if is_flex_row {
                    // Preserve flex-row container as-is (children maintain their x positions)
                    // But recursively process children in case they have nested structures
                    let processed_children = flatten_containers_recursively(children);
                    let mut preserved_box = box_item.clone();
                    preserved_box.content = BoxContent::Container(processed_children.clone());

                    // Propagate heading element_type from children to container for orphan prevention
                    // If container wraps a heading (e.g., job title in flex row), mark it as heading
                    // Check if container is NOT already a heading type before propagating
                    let is_already_heading =
                        preserved_box.element_type.is_some_and(|et| et.is_heading());

                    if !is_already_heading {
                        for child in &processed_children {
                            if let Some(et) = child.element_type {
                                if et.is_heading() {
                                    preserved_box.element_type = Some(et);
                                    break;
                                }
                            }
                        }
                    }

                    flattened.push(preserved_box);
                } else {
                    // Regular container - flatten by extracting children
                    let mut child_boxes = flatten_containers_recursively(children);

                    // If container has border-bottom, create a border-only box
                    // and propagate margin-bottom to the border (the last visual element)
                    if box_item.style.box_model.border_bottom.is_some() {
                        // Find the content bottom (max y+height of children)
                        let content_bottom = child_boxes
                            .iter()
                            .map(|b| b.y + b.height)
                            .fold(box_item.y, f64::max);

                        // CSS places border at the padding edge (content + padding)
                        // Include padding-bottom in border position
                        let padding_bottom = box_item
                            .style
                            .box_model
                            .padding
                            .map(|p| p.bottom)
                            .unwrap_or(0.0);

                        // Create a zero-height box at the padding edge
                        let mut border_box = box_item.clone();
                        border_box.y = content_bottom + padding_bottom;
                        border_box.height = 0.0;
                        border_box.content = BoxContent::Empty;
                        border_box.element_type = None; // Border boxes are not headings

                        // Propagate container's margin-bottom to the border box
                        // This ensures spacing after the border, not between text and border
                        if let Some(container_margin) = &box_item.style.box_model.margin {
                            if container_margin.bottom > 0.0 {
                                let mut border_margin =
                                    border_box.style.box_model.margin.unwrap_or_default();
                                border_margin.bottom =
                                    border_margin.bottom.max(container_margin.bottom);
                                border_box.style.box_model.margin = Some(border_margin);
                            }
                        }

                        // Add children then border box
                        flattened.extend(child_boxes);
                        flattened.push(border_box);
                    } else {
                        // No border - propagate margin-bottom to last child
                        // This preserves section spacing when <section className="mb-6"> gets flattened
                        if let Some(container_margin) = &box_item.style.box_model.margin {
                            if container_margin.bottom > 0.0 {
                                if let Some(last_child) = child_boxes.last_mut() {
                                    let mut child_margin =
                                        last_child.style.box_model.margin.unwrap_or_default();
                                    child_margin.bottom =
                                        child_margin.bottom.max(container_margin.bottom);
                                    last_child.style.box_model.margin = Some(child_margin);
                                }
                            }
                        }
                        flattened.extend(child_boxes);
                    }
                }
            }
            BoxContent::Text(_) => {
                // This is a leaf box - add it directly
                flattened.push(box_item.clone());
            }
            BoxContent::Empty => {
                // Keep empty boxes that have borders (for border rendering)
                if box_item.style.box_model.border_bottom.is_some() {
                    flattened.push(box_item.clone());
                }
                // Otherwise skip empty boxes
            }
        }
    }

    flattened
}

/// Direct layout calculation entry point
///
/// Converts TSX document directly to LayoutStructure without RenderNode intermediate layer.
///
/// # Arguments
///
/// * `document` - Parsed TSX document
/// * `metadata` - CV metadata (for metadata-aware rendering)
/// * `layout_config` - Layout configuration (page dimensions, margins)
/// * `pdf_config` - PDF configuration (fonts, compression)
/// * `measurer` - Text measurement implementation
///
/// # Returns
///
/// Paginated LayoutStructure ready for PDF rendering
pub fn calculate_layout_direct(
    document: &TsxDocument,
    _metadata: &CVMetadata,
    layout_config: &TSXLayoutConfig,
    pdf_config: &PDFConfig,
    measurer: &dyn TextMeasurer,
) -> Result<LayoutStructure, LayoutError> {
    // 1. Extract JSX elements from document
    let jsx_elements = tsx_parser::extract_jsx_elements(document);

    if jsx_elements.is_empty() {
        return Err(LayoutError::CalculationFailed(
            "No JSX elements found in document".to_string(),
        ));
    }

    // 2. Build Taffy tree from JSX elements
    let mut taffy_tree = TaffyTree::new();
    let mut node_info_map = HashMap::new();
    let root_jsx = jsx_elements
        .first()
        .ok_or_else(|| LayoutError::CalculationFailed("No root element".to_string()))?;

    let root_id = jsx_to_taffy(
        &mut taffy_tree,
        &mut node_info_map,
        root_jsx,
        None,
        measurer,
    )?;

    // 3. Compute layout using Taffy
    let (page_width, page_height) = pdf_config.page_size.dimensions();

    // Calculate content area using TSX layout config
    let content = calculate_content_area(page_width, page_height, pdf_config, layout_config);
    let (content_x, content_y, content_width, content_height) =
        (content.x, content.y, content.width, content.height);

    taffy_tree
        .compute_layout_with_measure(
            root_id,
            Size {
                width: AvailableSpace::Definite(content_width as f32),
                height: AvailableSpace::Definite(content_height as f32),
            },
            |known_dimensions, available_space, _node_id, node_context, _font_metrics| {
                // Custom text measurement closure
                if let Some(context) = node_context {
                    context.measure(known_dimensions, available_space, measurer)
                } else {
                    Size::ZERO
                }
            },
        )
        .map_err(|e| LayoutError::CalculationFailed(format!("Taffy layout error: {}", e)))?;

    // 4. Extract LayoutBox tree with computed positions
    let positioned_boxes = taffy_to_layout_boxes(
        &taffy_tree,
        &node_info_map,
        root_id,
        content_x,
        content_y,
        measurer,
    )?;

    // 5. Recursively flatten ALL containers to get leaf boxes for pagination
    // This ensures orphan prevention works on individual headings, not coarse sections
    let mut boxes_to_paginate = flatten_containers_recursively(&positioned_boxes);

    // Filter out empty boxes (height = 0) that may result from widow/orphan prevention
    // BUT keep zero-height boxes that have borders (they're used to render container borders)
    boxes_to_paginate.retain(|b| b.height > 0.0 || b.style.box_model.border_bottom.is_some());

    // 6. Apply pagination
    let pages = paginate_boxes(boxes_to_paginate, content_y, content_height)?;

    Ok(LayoutStructure {
        page_width,
        page_height,
        pages,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use layout_types::{BorderLineStyle, BorderStyle, Color, Display};

    fn create_container_with_border(text: &str, y: f64) -> layout_types::LayoutBox {
        let mut style = layout_types::StyleDeclaration::default();
        style.box_model.border_bottom = Some(BorderStyle {
            width: 1.0,
            style: BorderLineStyle::Solid,
            color: Color {
                r: 0,
                g: 0,
                b: 0,
                a: 1.0,
            },
        });

        layout_types::LayoutBox {
            x: 0.0,
            y,
            width: 500.0,
            height: 30.0,
            content: BoxContent::Container(vec![layout_types::LayoutBox {
                x: 0.0,
                y,
                width: 500.0,
                height: 30.0,
                content: BoxContent::Text(vec![text.to_string()]),
                style: layout_types::StyleDeclaration::default(),
                element_type: Some(layout_types::ElementType::Heading2),
            }]),
            style,
            element_type: Some(layout_types::ElementType::Heading2),
        }
    }

    #[test]
    fn test_flatten_creates_border_box_for_h2() {
        // Create h2-like container with border
        let h2_container = create_container_with_border("PROFESSIONAL EXPERIENCE", 100.0);
        let boxes = vec![h2_container];

        // Flatten
        let flattened = flatten_containers_recursively(&boxes);

        // Should have 2 boxes: text child and border box
        assert_eq!(flattened.len(), 2, "Should have text child and border box");

        // First should be text
        assert!(
            matches!(&flattened[0].content, BoxContent::Text(_)),
            "First box should be text"
        );

        // Second should be empty (border) box
        assert!(
            matches!(&flattened[1].content, BoxContent::Empty),
            "Second box should be empty (border)"
        );
        assert_eq!(
            flattened[1].height, 0.0,
            "Border box should have zero height"
        );
        assert!(
            flattened[1].style.box_model.border_bottom.is_some(),
            "Border box should have border_bottom"
        );
        // content_bottom = child.y + child.height = 100.0 + 30.0 = 130.0
        // No extra gap needed - CSS places border at line-box bottom
        assert_eq!(
            flattened[1].y, 130.0,
            "Border box should be at content bottom (no extra gap)"
        );
    }

    #[test]
    fn test_flatten_section_containing_h2_with_border() {
        // Create structure like: <section><h2 border-b>HEADING</h2><div>content</div></section>
        let h2_container = create_container_with_border("PROFESSIONAL EXPERIENCE", 100.0);

        // Create a div child after h2
        let div_child = layout_types::LayoutBox {
            x: 0.0,
            y: 130.0,
            width: 500.0,
            height: 50.0,
            content: BoxContent::Text(vec!["Job content here".to_string()]),
            style: layout_types::StyleDeclaration::default(),
            element_type: None,
        };

        // Create section container (no border, not flex)
        let section = layout_types::LayoutBox {
            x: 0.0,
            y: 100.0,
            width: 500.0,
            height: 100.0,
            content: BoxContent::Container(vec![h2_container, div_child]),
            style: layout_types::StyleDeclaration::default(),
            element_type: None,
        };

        let boxes = vec![section];
        let flattened = flatten_containers_recursively(&boxes);

        // Should have 3 boxes: h2 text, h2 border, div content
        assert_eq!(
            flattened.len(),
            3,
            "Should have h2 text, h2 border, and div content. Got: {:?}",
            flattened
                .iter()
                .map(|b| match &b.content {
                    BoxContent::Text(t) =>
                        format!("Text({})", t.first().unwrap_or(&"".to_string())),
                    BoxContent::Container(_) => "Container".to_string(),
                    BoxContent::Empty => "Empty".to_string(),
                })
                .collect::<Vec<_>>()
        );

        // Check for border box
        let border_box = flattened
            .iter()
            .find(|b| matches!(&b.content, BoxContent::Empty));
        assert!(
            border_box.is_some(),
            "Should have a border box (Empty content)"
        );
        let border_box = border_box.unwrap();
        assert!(
            border_box.style.box_model.border_bottom.is_some(),
            "Border box should have border_bottom"
        );
    }

    #[test]
    fn test_flatten_preserves_flex_container_with_border() {
        // Create flex container with border (like job title row)
        let mut style = layout_types::StyleDeclaration::default();
        style.flex.display = Some(Display::Flex);
        style.box_model.border_bottom = Some(BorderStyle {
            width: 1.0,
            style: BorderLineStyle::Solid,
            color: Color {
                r: 0,
                g: 0,
                b: 0,
                a: 1.0,
            },
        });

        let flex_container = layout_types::LayoutBox {
            x: 0.0,
            y: 100.0,
            width: 500.0,
            height: 30.0,
            content: BoxContent::Container(vec![layout_types::LayoutBox {
                x: 0.0,
                y: 100.0,
                width: 200.0,
                height: 30.0,
                content: BoxContent::Text(vec!["Title".to_string()]),
                style: layout_types::StyleDeclaration::default(),
                element_type: None,
            }]),
            style,
            element_type: None,
        };

        let boxes = vec![flex_container];
        let flattened = flatten_containers_recursively(&boxes);

        // Flex container should be preserved as a single box
        assert_eq!(
            flattened.len(),
            1,
            "Flex container should be preserved as one box"
        );
        assert!(
            matches!(&flattened[0].content, BoxContent::Container(_)),
            "Should still be a container"
        );
    }
}
