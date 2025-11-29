//! JSX to Taffy tree builder
//!
//! This module builds Taffy layout trees from JSX elements, resolving styles
//! and creating the necessary data structures for CSS layout computation.

use super::box_extractor::{ContentType, JsxElementInfo};
use super::element_mapping::tag_to_element_type;
use super::layout_element::jsx_to_layout_element;
use super::style_conversion::convert_style_to_taffy;
use super::text_measurement::TextMeasureContext;
use crate::error::LayoutError;
use layout_types::{Display, StyleDeclaration, TextMeasurer};
use std::collections::HashMap;
use style_resolver::resolve_element_styles;
use taffy::prelude::*;
use tsx_parser::{JSXChild, JSXElement};

/// Convert JSX element to Taffy node (recursive)
///
/// Builds Taffy tree and stores JsxElementInfo for each node in the map.
/// This function recursively processes JSX elements, resolving styles,
/// extracting text content, and building the Taffy layout tree.
///
/// # Arguments
///
/// * `tree` - Mutable reference to the Taffy tree being built
/// * `node_info_map` - Map to store semantic information for each Taffy NodeId
/// * `jsx` - The JSX element to convert
/// * `parent_style` - Optional parent style for inheritance
/// * `measurer` - Text measurement implementation for text nodes
///
/// # Returns
///
/// NodeId of the created Taffy node
///
/// # Errors
///
/// Returns LayoutError if:
/// - Taffy fails to create a node
/// - Style resolution fails
pub fn jsx_to_taffy(
    tree: &mut TaffyTree<TextMeasureContext>,
    node_info_map: &mut HashMap<NodeId, JsxElementInfo>,
    jsx: &JSXElement,
    parent_style: Option<&StyleDeclaration>,
    measurer: &dyn TextMeasurer,
) -> Result<NodeId, LayoutError> {
    // 1. Convert JSX to LayoutElement (abstraction layer for testability)
    let layout_elem = jsx_to_layout_element(jsx);

    // 2. Extract styling attributes from JSX (still need JSX for this)
    let element_name = &layout_elem.tag;
    let class_name = layout_elem.class_name.as_deref();
    let inline_style = layout_elem.inline_style.as_deref();

    // 3. Resolve styles using style-resolver
    let resolved_style = resolve_element_styles(class_name, inline_style, parent_style);

    // 4. Determine element type
    let element_type = tag_to_element_type(element_name);

    // Check if this element is a flex container
    // In flex containers, ALL children (including spans) become flex items
    let is_flex_container = resolved_style.flex.display == Some(Display::Flex);

    // Check if element has styled inline children that need their own layout boxes
    // e.g., <p><span className="font-semibold">Label:</span> value</p>
    // The span needs to be a separate box to preserve its bold styling
    let has_styled_inline_children = layout_elem.children.iter().any(|child| {
        !child.is_text()
            && matches!(child.tag.as_str(), "span" | "strong" | "em" | "b" | "i")
            && child.class_name.as_ref().is_some_and(|c| {
                c.contains("font-semibold") || c.contains("font-bold") || c.contains("font-medium")
            })
    });

    // If we have styled inline children, set display:flex on the resolved style
    // so the container is properly laid out and preserved during flattening
    // Also add a small gap for proper spacing between label and value
    let resolved_style = if has_styled_inline_children && !is_flex_container {
        let mut owned_style = resolved_style.clone();
        owned_style.flex.display = Some(Display::Flex);
        owned_style.flex.gap = Some(3.0); // Small gap for inline label spacing
        owned_style
    } else {
        resolved_style.clone()
    };

    // Treat elements with styled inline children like flex containers for layout purposes
    let treat_as_flex = is_flex_container || has_styled_inline_children;

    // 5. Extract text content from LayoutElement (now unit testable!)
    // For flex containers or elements with styled inline children,
    // we don't extract text from child elements - they're layout children
    let text_content = if treat_as_flex {
        // Only extract direct text nodes, not from child elements
        // Don't trim - preserve leading whitespace for proper spacing after inline elements
        layout_elem
            .children
            .iter()
            .filter_map(|c| c.text_content())
            .collect::<Vec<_>>()
            .join(" ")
    } else {
        layout_elem.extract_text_for_layout()
    };
    // Trim only if empty or whitespace-only
    let text_content = if text_content.trim().is_empty() {
        String::new()
    } else {
        text_content
    };

    // Check if element has block-level children (not inline like span, em, etc.)
    // Inline elements are already extracted in text_content above
    // BUT in flex containers (or flex-like), even inline elements become layout children
    // Note: "br" is included because it's a self-closing inline element with no content
    let has_block_element_children = layout_elem.children.iter().any(|child| {
        !child.is_text()
            && (treat_as_flex
                || !matches!(
                    child.tag.as_str(),
                    "span" | "strong" | "em" | "b" | "i" | "a" | "code" | "br"
                ))
    });

    // Elements with borders must be containers (so borders can render)
    let has_border = resolved_style.box_model.border_top.is_some()
        || resolved_style.box_model.border_right.is_some()
        || resolved_style.box_model.border_bottom.is_some()
        || resolved_style.box_model.border_left.is_some();

    let (node_id, content_type) =
        if !text_content.is_empty() && !has_border && !has_block_element_children {
            // Text leaf node (only if no borders and no block children)
            create_text_node(tree, &text_content, &resolved_style, element_name)?
        } else {
            // Container with children (or text node that needs borders)
            create_container_node(
                tree,
                node_info_map,
                jsx,
                &text_content,
                &resolved_style,
                element_name,
                measurer,
                has_styled_inline_children,
                element_type,
            )?
        };

    // Store info in map for later LayoutBox extraction
    let info = JsxElementInfo {
        element_type,
        style: resolved_style,
        content_type,
    };
    node_info_map.insert(node_id, info);

    Ok(node_id)
}

/// Create a text leaf node in the Taffy tree
fn create_text_node(
    tree: &mut TaffyTree<TextMeasureContext>,
    text_content: &str,
    resolved_style: &StyleDeclaration,
    element_name: &str,
) -> Result<(NodeId, ContentType), LayoutError> {
    let context = TextMeasureContext::new(text_content.to_string(), resolved_style);
    let taffy_style = convert_style_to_taffy(resolved_style, Some(element_name));

    let node_id = tree
        .new_leaf_with_context(taffy_style, context)
        .map_err(|e| LayoutError::CalculationFailed(format!("Taffy leaf error: {}", e)))?;

    Ok((node_id, ContentType::Text(text_content.to_string())))
}

/// Create a container node with children in the Taffy tree
#[allow(clippy::too_many_arguments)]
fn create_container_node(
    tree: &mut TaffyTree<TextMeasureContext>,
    node_info_map: &mut HashMap<NodeId, JsxElementInfo>,
    jsx: &JSXElement,
    text_content: &str,
    resolved_style: &StyleDeclaration,
    element_name: &str,
    measurer: &dyn TextMeasurer,
    has_styled_inline_children: bool,
    element_type: Option<layout_types::ElementType>,
) -> Result<(NodeId, ContentType), LayoutError> {
    let mut child_ids = Vec::new();

    // Check if this is a flex container - in flex context, ALL children become flex items
    // Note: has_styled_inline_children already set display:flex on resolved_style
    let is_flex_container = resolved_style.flex.display == Some(Display::Flex);

    // Process JSX children recursively
    // Skip inline elements - their text is already extracted into parent's text_content
    // BUT in flex containers, even inline elements become flex items
    // AND styled inline elements (font-semibold spans) need their own boxes
    for child in &jsx.children {
        if let JSXChild::Element(child_jsx) = child {
            let child_tag = tsx_parser::extract_element_name(child_jsx);
            let child_class = tsx_parser::extract_class_name(child_jsx);

            // Check if this is a styled inline element that needs its own box
            let is_styled_inline =
                matches!(child_tag.as_str(), "span" | "strong" | "em" | "b" | "i")
                    && child_class.as_ref().is_some_and(|c| {
                        c.contains("font-semibold")
                            || c.contains("font-bold")
                            || c.contains("font-medium")
                    });

            // Process if: flex container, styled inline, or block-level element
            // Note: "br" is skipped because it's a self-closing inline element with no content
            let should_process = is_flex_container
                || is_styled_inline
                || !matches!(
                    child_tag.as_str(),
                    "span" | "strong" | "em" | "b" | "i" | "a" | "code" | "br"
                );
            if should_process {
                let child_id = jsx_to_taffy(
                    tree,
                    node_info_map,
                    child_jsx,
                    Some(resolved_style),
                    measurer,
                )?;
                child_ids.push(child_id);
            }
        }
    }

    // If container has text content, create a text child for it
    // This handles:
    // 1. <h2 className="border-b">HEADING</h2> - bordered container with text
    // 2. <p><span className="font-semibold">Label:</span> value</p> - " value" sibling text
    let should_add_text_child = !text_content.is_empty()
        && (
            child_ids.is_empty() ||  // No children yet, text is the only content
        is_flex_container ||     // Flex containers need separate text boxes
        has_styled_inline_children
            // Styled inline children mean we have sibling text
        );
    if should_add_text_child {
        // Create style for text child WITHOUT borders (container renders borders)
        let mut text_child_style = resolved_style.clone();
        text_child_style.box_model.border_top = None;
        text_child_style.box_model.border_right = None;
        text_child_style.box_model.border_bottom = None;
        text_child_style.box_model.border_left = None;

        let (text_node_id, text_content_type) =
            create_text_node(tree, text_content, &text_child_style, element_name)?;
        child_ids.push(text_node_id);

        // Store the text node info
        // Text nodes inherit element_type from parent for orphan prevention
        // e.g., h3 text should be marked as Heading3 for page break decisions
        let text_info = JsxElementInfo {
            element_type,
            style: text_child_style,
            content_type: text_content_type,
        };
        node_info_map.insert(text_node_id, text_info);
    }

    let taffy_style = convert_style_to_taffy(resolved_style, Some(element_name));
    let node_id = tree
        .new_with_children(taffy_style, &child_ids)
        .map_err(|e| LayoutError::CalculationFailed(format!("Taffy container error: {}", e)))?;

    Ok((node_id, ContentType::Container))
}

#[cfg(test)]
mod tests {
    // Note: Full integration tests are in tests/direct_layout_tests.rs
    // These unit tests focus on text extraction which doesn't require
    // full JSX parsing infrastructure

    // ARCHITECTURE ISSUE: Cannot write unit tests because functions depend on
    // swc_ecma_ast::JSXElement which requires full TSX parsing to create.
    //
    // This violates testability principles. The module should be refactored to:
    // 1. Accept an abstraction/trait instead of concrete AST types
    // 2. Separate parsing logic from layout logic
    // 3. Make core logic testable in isolation
    //
    // Current blockers for unit testing:
    // - extract_text_from_jsx(&swc_ecma_ast::JSXElement) - can't create JSXElement in tests
    // - jsx_to_taffy() - requires JSXElement + TaffyTree + complex setup
    // - create_text_node() - requires TaffyTree setup
    // - create_container_node() - requires JSXElement + TaffyTree + HashMap
    //
    // The only way to test currently is through integration tests that parse full TSX.
    // This makes debugging specific issues (like inline bold spans) very difficult.

    // NOTE: Module needs refactoring for unit testability
    // See ARCHITECTURE ISSUE comment above
}
