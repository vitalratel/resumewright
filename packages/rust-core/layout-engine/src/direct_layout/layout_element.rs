//! Intermediate representation for layout elements
//!
//! This module provides a testable abstraction layer between JSX parsing and layout computation.
//! By introducing LayoutElement as an intermediate representation, we decouple the layout logic
//! from the specific AST structure, making the code unit testable.

use layout_types::{FontStyle, FontWeight, TextSegment};
use style_resolver::resolve_tailwind_classes;
use tsx_parser::{JSXChild, JSXElement, JSXExpression};

/// Intermediate representation of an element for layout computation
///
/// This abstraction allows us to:
/// 1. Write unit tests without depending on JSX parser
/// 2. Separate concerns between parsing and layout
/// 3. Test layout logic in isolation
#[derive(Debug, Clone, PartialEq)]
pub struct LayoutElement {
    /// HTML tag name (e.g., "div", "p", "span")
    pub tag: String,

    /// CSS class names (space-separated)
    pub class_name: Option<String>,

    /// Inline CSS styles
    pub inline_style: Option<String>,

    /// Child elements (can be elements or text nodes)
    pub children: Vec<LayoutElement>,
}

impl LayoutElement {
    /// Create a text node (special case with "#text" tag)
    ///
    /// Text nodes have a special tag "#text" and store their content in inline_style
    /// (we reuse this field to avoid adding a separate text field)
    pub fn text(content: &str) -> Self {
        Self {
            tag: "#text".to_string(),
            class_name: None,
            inline_style: Some(content.to_string()),
            children: Vec::new(),
        }
    }

    /// Check if this is a text node
    pub fn is_text(&self) -> bool {
        self.tag == "#text"
    }

    /// Get text content (only for text nodes)
    pub fn text_content(&self) -> Option<&str> {
        if self.is_text() {
            self.inline_style.as_deref()
        } else {
            None
        }
    }
}

// Test-only helper methods for constructing LayoutElement fixtures
#[cfg(test)]
impl LayoutElement {
    /// Create an element with children (test helper)
    pub fn with_children(tag: &str, children: Vec<LayoutElement>) -> Self {
        Self {
            tag: tag.to_string(),
            class_name: None,
            inline_style: None,
            children,
        }
    }

    /// Create an element with class name (test helper)
    pub fn with_class(tag: &str, class_name: &str) -> Self {
        Self {
            tag: tag.to_string(),
            class_name: Some(class_name.to_string()),
            inline_style: None,
            children: Vec::new(),
        }
    }

    /// Get direct text children only (not nested in elements) - test helper
    pub fn direct_text(&self) -> String {
        let mut text = String::new();
        for child in &self.children {
            if child.is_text() {
                text.push_str(child.text_content().unwrap_or(""));
            }
        }
        text.trim().to_string()
    }

    /// Get element children (non-text) - test helper
    pub fn element_children(&self) -> Vec<&LayoutElement> {
        self.children.iter().filter(|c| !c.is_text()).collect()
    }
}

// Production methods (available in all builds)
impl LayoutElement {
    /// Extract all text content recursively
    #[allow(dead_code)]
    pub fn extract_all_text(&self) -> String {
        if self.is_text() {
            return self.text_content().unwrap_or("").to_string();
        }

        let mut text = String::new();
        for child in &self.children {
            text.push_str(&child.extract_all_text());
        }
        text
    }

    /// Extract text for layout (combines ALL text including nested elements)
    ///
    /// This is the replacement for extract_text_from_jsx() that properly
    /// handles inline styled elements like `<span className="font-semibold">`.
    ///
    /// Unlike direct_text(), this recursively extracts ALL text content,
    /// which is what we need for layout computation.
    #[allow(dead_code)]
    pub fn extract_text_for_layout(&self) -> String {
        self.extract_all_text().trim().to_string()
    }

    /// Extract styled text segments from this element's children
    ///
    /// This is the key method for inline rich text support. It walks through
    /// children and extracts text with their associated styles, preserving
    /// inline formatting like italic and bold from spans.
    ///
    /// # Arguments
    /// * `parent_style` - The resolved style of the parent element (for inheritance)
    ///
    /// # Returns
    /// Vector of TextSegments with text and style information
    pub fn extract_styled_segments(
        &self,
        parent_font_weight: Option<FontWeight>,
        parent_font_style: Option<FontStyle>,
    ) -> Vec<TextSegment> {
        let mut segments = Vec::new();
        self.collect_styled_segments_recursive(
            &mut segments,
            parent_font_weight,
            parent_font_style,
        );
        segments
    }

    fn collect_styled_segments_recursive(
        &self,
        segments: &mut Vec<TextSegment>,
        current_font_weight: Option<FontWeight>,
        current_font_style: Option<FontStyle>,
    ) {
        if self.is_text() {
            // Direct text node - use current styles
            if let Some(content) = self.text_content() {
                if !content.is_empty() {
                    segments.push(TextSegment {
                        text: content.to_string(),
                        font_weight: current_font_weight,
                        font_style: current_font_style,
                        font_size: None, // Inherit from parent
                        text_decoration: None,
                        color: None,
                    });
                }
            }
        } else {
            // Element node - check if it has styles to apply
            let (child_weight, child_style) =
                self.resolve_inline_styles(current_font_weight, current_font_style);

            // Process children with potentially updated styles
            for child in &self.children {
                child.collect_styled_segments_recursive(segments, child_weight, child_style);
            }
        }
    }

    /// Resolve styles from this element's className
    fn resolve_inline_styles(
        &self,
        parent_weight: Option<FontWeight>,
        parent_style: Option<FontStyle>,
    ) -> (Option<FontWeight>, Option<FontStyle>) {
        // Check if this is a semantic element that implies styling
        let (semantic_weight, semantic_style) = match self.tag.as_str() {
            "strong" | "b" => (Some(FontWeight::Bold), parent_style),
            "em" | "i" => (parent_weight, Some(FontStyle::Italic)),
            _ => (parent_weight, parent_style),
        };

        // Apply className styles (override semantic)
        if let Some(class_name) = &self.class_name {
            let resolved = resolve_tailwind_classes(class_name);
            let weight = resolved.text.font_weight.or(semantic_weight);
            let style = resolved.text.font_style.or(semantic_style);
            (weight, style)
        } else {
            (semantic_weight, semantic_style)
        }
    }
}

/// Convert JSX element to LayoutElement intermediate representation
///
/// This function bridges the JSX AST from oxc_ast to our testable
/// LayoutElement representation. It extracts all necessary information
/// from the JSX AST and creates a simplified tree structure.
///
/// # Arguments
///
/// * `jsx` - The JSX element to convert
///
/// # Returns
///
/// A LayoutElement tree representing the JSX structure
pub fn jsx_to_layout_element(jsx: &JSXElement) -> LayoutElement {
    // Extract element information
    let element_name = tsx_parser::extract_element_name(jsx);
    let class_name = tsx_parser::extract_class_name(jsx);
    let inline_style = tsx_parser::extract_inline_style(jsx);

    // Process children
    let mut children = Vec::new();

    for child in &jsx.children {
        match child {
            JSXChild::Text(jsx_text) => {
                let text = jsx_text.value.to_string();
                // Only add non-empty text nodes
                if !text.trim().is_empty() {
                    children.push(LayoutElement::text(&text));
                }
            }
            JSXChild::ExpressionContainer(expr_container) => {
                // Extract string literals from expressions
                // In oxc, Expression variants are inherited into JSXExpression
                if let JSXExpression::StringLiteral(str_lit) = &expr_container.expression {
                    let text = str_lit.value.to_string();
                    if !text.trim().is_empty() {
                        children.push(LayoutElement::text(&text));
                    }
                }
            }
            JSXChild::Element(child_jsx) => {
                // Recursively convert child elements
                children.push(jsx_to_layout_element(child_jsx));
            }
            _ => {}
        }
    }

    LayoutElement {
        tag: element_name,
        class_name,
        inline_style,
        children,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_text_node_creation() {
        let text = LayoutElement::text("Hello");

        assert!(text.is_text());
        assert_eq!(text.text_content(), Some("Hello"));
        assert_eq!(text.tag, "#text");
    }

    #[test]
    fn test_element_with_children() {
        let element = LayoutElement::with_children(
            "p",
            vec![LayoutElement::text("Hello "), LayoutElement::text("world")],
        );

        assert!(!element.is_text());
        assert_eq!(element.tag, "p");
        assert_eq!(element.children.len(), 2);
    }

    #[test]
    fn test_extract_all_text() {
        let element = LayoutElement::with_children(
            "p",
            vec![
                LayoutElement::text("Hello "),
                LayoutElement::with_children("span", vec![LayoutElement::text("bold ")]),
                LayoutElement::text("world"),
            ],
        );

        assert_eq!(element.extract_all_text(), "Hello bold world");
    }

    #[test]
    fn test_direct_text() {
        let element = LayoutElement::with_children(
            "p",
            vec![
                LayoutElement::text("Direct text "),
                LayoutElement::with_children("span", vec![LayoutElement::text("nested text")]),
                LayoutElement::text(" more direct"),
            ],
        );

        assert_eq!(element.direct_text(), "Direct text  more direct");
    }

    #[test]
    fn test_element_children() {
        let element = LayoutElement::with_children(
            "p",
            vec![
                LayoutElement::text("Text "),
                LayoutElement::with_class("span", "bold"),
                LayoutElement::text(" more"),
            ],
        );

        let elem_children = element.element_children();
        assert_eq!(elem_children.len(), 1);
        assert_eq!(elem_children[0].tag, "span");
    }

    #[test]
    fn test_inline_bold_span_structure() {
        // Test case for the bug: <p><span className="font-semibold">Native:</span> Russian</p>
        let p = LayoutElement::with_children(
            "p",
            vec![
                LayoutElement::with_children("span", vec![LayoutElement::text("Native:")]),
                LayoutElement::text(" Russian, Ukrainian"),
            ],
        );

        // Verify structure
        assert_eq!(p.children.len(), 2);
        assert_eq!(p.children[0].tag, "span");
        assert!(p.children[1].is_text());

        // Verify we can extract both texts
        assert_eq!(p.extract_all_text(), "Native: Russian, Ukrainian");

        // Verify direct text gets only sibling text, not span content
        assert_eq!(p.direct_text(), "Russian, Ukrainian");

        // Verify span content is accessible
        let span = &p.children[0];
        assert_eq!(span.extract_all_text(), "Native:");
    }

    #[test]
    fn test_extract_text_for_layout() {
        // Test that extract_text_for_layout combines ALL text (nested + direct)
        let p = LayoutElement::with_children(
            "p",
            vec![
                LayoutElement::with_children("span", vec![LayoutElement::text("Native:")]),
                LayoutElement::text(" Russian, Ukrainian"),
            ],
        );

        // This should combine both the span text and the direct text
        assert_eq!(p.extract_text_for_layout(), "Native: Russian, Ukrainian");
    }

    #[test]
    fn test_extract_text_for_layout_trimmed() {
        // Test that whitespace is trimmed
        let p = LayoutElement::with_children(
            "p",
            vec![
                LayoutElement::text("  Hello  "),
                LayoutElement::with_children("span", vec![LayoutElement::text(" world ")]),
            ],
        );

        assert_eq!(p.extract_text_for_layout(), "Hello   world");
    }

    #[test]
    fn test_period_preservation() {
        // Test that periods at end of sentences are preserved
        let elem =
            LayoutElement::with_children("p", vec![LayoutElement::text("Sentence with period.")]);
        assert_eq!(elem.extract_text_for_layout(), "Sentence with period.");
        assert!(
            elem.extract_text_for_layout().ends_with('.'),
            "Period should be preserved"
        );

        // Test multiple sentences
        let elem2 =
            LayoutElement::with_children("p", vec![LayoutElement::text("First. Second. Third.")]);
        let text = elem2.extract_text_for_layout();
        assert!(text.contains("First."), "First period missing");
        assert!(text.contains("Second."), "Second period missing");
        assert!(text.ends_with("Third."), "Final period missing");
    }
}
