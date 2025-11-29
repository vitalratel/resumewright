//! Layout element types and structures

mod structure;

pub use structure::{BoxContent, ElementType, LayoutBox, LayoutStructure, Page};

use serde::{Deserialize, Serialize};

use crate::css::{FontStyle, FontWeight, StyleDeclaration};

// ============================================================================
// Layout Element Types
// ============================================================================

/// A text segment with specific styling (for inline formatted text)
///
/// When rendering text like `<p><span className="font-semibold">Native:</span> Russian</p>`,
/// we need to preserve the fact that "Native:" should be bold and " Russian" should be normal.
/// TextSegments allow us to store this information.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TextSegment {
    /// The text content
    pub text: String,
    /// Font weight (None means inherit from parent)
    pub font_weight: Option<FontWeight>,
    /// Font style (None means inherit from parent)
    pub font_style: Option<FontStyle>,
    /// Font size in points (None means inherit from parent)
    pub font_size: Option<f64>,
}

/// Layout information attached to an element after layout computation
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct LayoutInfo {
    /// X coordinate (left edge) in points
    pub x: f64,
    /// Y coordinate (top edge) in points
    pub y: f64,
    /// Width in points
    pub width: f64,
    /// Height in points
    pub height: f64,
}

/// Intermediate representation of an element for layout computation
///
/// This abstraction allows us to:
/// 1. Write unit tests without depending on JSX parser
/// 2. Separate concerns between parsing and layout
/// 3. Test layout logic in isolation
/// 4. Preserve DOM structure for inline styling (spans, strong, etc.)
///
/// # Example
/// ```
/// use layout_types::LayoutElement;
///
/// let element = LayoutElement {
///     tag: "p".to_string(),
///     class_name: Some("text-lg font-bold".to_string()),
///     inline_style: None,
///     children: vec![
///         LayoutElement::text("Hello "),
///         LayoutElement {
///             tag: "span".to_string(),
///             class_name: Some("font-semibold".to_string()),
///             inline_style: None,
///             children: vec![LayoutElement::text("world")],
///             text_segments: None,
///             layout: None,
///             resolved_style: None,
///         },
///     ],
///     text_segments: None,
///     layout: None,
///     resolved_style: None,
/// };
/// ```
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct LayoutElement {
    /// HTML tag name (e.g., "div", "p", "span")
    pub tag: String,

    /// CSS class names (space-separated)
    pub class_name: Option<String>,

    /// Inline CSS styles
    pub inline_style: Option<String>,

    /// Child elements (can be elements or text nodes)
    pub children: Vec<LayoutElement>,

    /// Text segments with inline styling (for elements with mixed text formatting)
    /// When set, this takes precedence over extracting text from children.
    /// Example: `<p><span className="font-bold">Name:</span> John</p>` becomes
    /// text_segments = [TextSegment { text: "Name:", font_weight: Bold }, TextSegment { text: " John", ... }]
    pub text_segments: Option<Vec<TextSegment>>,

    /// Layout information (populated after layout computation)
    pub layout: Option<LayoutInfo>,

    /// Resolved style declaration (populated during layout computation for rendering)
    pub resolved_style: Option<StyleDeclaration>,
}

impl LayoutElement {
    /// Create a text node (special case with "#text" tag)
    ///
    /// Text nodes have a special tag "#text" and store their content in inline_style
    /// (we reuse this field to avoid adding a separate text field)
    pub fn text(content: impl Into<String>) -> Self {
        Self {
            tag: "#text".to_string(),
            class_name: None,
            inline_style: Some(content.into()),
            children: vec![],
            text_segments: None,
            layout: None,
            resolved_style: None,
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

    /// Extract text content for layout calculation
    /// Recursively concatenates all text from this element and its children
    pub fn extract_text_for_layout(&self) -> String {
        self.extract_text(true)
    }

    /// Extract all text content recursively (alias for backwards compatibility)
    pub fn extract_all_text(&self) -> String {
        self.extract_text(false)
    }

    /// Extract text with optional trimming (consolidated implementation)
    fn extract_text(&self, trim: bool) -> String {
        let mut text = String::new();
        self.collect_text_recursive(&mut text);
        if trim {
            text.trim().to_string()
        } else {
            text
        }
    }

    fn collect_text_recursive(&self, text: &mut String) {
        if self.is_text() {
            if let Some(content) = &self.inline_style {
                text.push_str(content);
            }
        } else {
            for child in &self.children {
                child.collect_text_recursive(text);
            }
        }
    }
}

// Test-only helper methods for constructing LayoutElement fixtures
// Note: These are available in all builds but intended for testing only
impl LayoutElement {
    /// Create an element with children (test helper)
    pub fn with_children(tag: &str, children: Vec<LayoutElement>) -> Self {
        Self {
            tag: tag.to_string(),
            class_name: None,
            inline_style: None,
            children,
            text_segments: None,
            layout: None,
            resolved_style: None,
        }
    }

    /// Create an element with class name (test helper)
    pub fn with_class(tag: &str, class_name: &str) -> Self {
        Self {
            tag: tag.to_string(),
            class_name: Some(class_name.to_string()),
            inline_style: None,
            children: Vec::new(),
            text_segments: None,
            layout: None,
            resolved_style: None,
        }
    }

    /// Add a child element (test helper)
    pub fn add_child(&mut self, child: LayoutElement) {
        self.children.push(child);
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
