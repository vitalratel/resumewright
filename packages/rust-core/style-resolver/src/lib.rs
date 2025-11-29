//! Style Resolution for TSX → PDF Pipeline
//!
//! This crate provides style resolution functionality extracted from react-renderer,
//! enabling direct TSX → layout conversion without the RenderNode intermediate layer.
//!
//! # Purpose
//!
//! This crate handles three critical style-related operations:
//! 1. **Tailwind CSS Conversion** - Parse Tailwind classes into StyleDeclaration
//! 2. **Style Inheritance** - Implement CSS inheritance rules (text properties)
//! 3. **Style Merging** - Merge Tailwind base + inline style overrides
//!
//! # Architecture Position
//!
//! ```text
//! TSX Input (string)
//!     ↓
//! tsx-parser::parse_tsx() → TsxDocument
//!     ↓
//! style-resolver::resolve_element_styles() → StyleDeclaration  ← THIS CRATE
//!     ↓
//! layout-engine::calculate_layout_direct() → LayoutStructure
//!     ↓
//! pdf-generator::generate() → PDF bytes
//! ```
//!
//! # Usage Example
//!
//! ```rust
//! use style_resolver::resolve_element_styles;
//! use pdf_generator::css_parser::StyleDeclaration;
//!
//! // Resolve styles for an element with Tailwind classes
//! let style = resolve_element_styles(
//!     Some("font-bold text-lg"),                // Tailwind classes
//!     None,                                      // No inline CSS
//!     None,                                      // No parent (root element)
//! );
//!
//! // Check that Tailwind classes were applied
//! assert_eq!(style.text.font_weight, Some(layout_types::FontWeight::Bold));   // Bold from Tailwind
//! assert!(style.text.font_size.unwrap() > 11.0); // text-lg applied
//! ```

mod inheritance;
mod merge;
mod tailwind;

pub use inheritance::{apply_inherited_properties, inherit_text_styles};
pub use merge::{merge_inherited_styles, merge_style_overrides};
pub use tailwind::resolve_tailwind_classes;

use pdf_generator::css_parser::StyleDeclaration;

/// Resolve complete styles for an element
///
/// This is the main entry point for style resolution. It combines Tailwind class
/// parsing, inline style parsing, and CSS inheritance into a single operation.
///
/// # Arguments
/// * `class_name` - Optional Tailwind CSS classes (e.g., "text-lg font-bold")
/// * `inline_style` - Optional inline CSS string (e.g., "color: red; margin: 10px")
/// * `parent_style` - Optional parent element's computed style (for inheritance)
///
/// # Returns
/// Fully resolved StyleDeclaration with all properties computed
///
/// # CSS Cascade Order
/// 1. **Inherited properties** from parent (text properties only)
/// 2. **Tailwind classes** from className attribute
/// 3. **Inline styles** from style attribute (highest specificity)
///
/// # Example
/// ```rust
/// use style_resolver::resolve_element_styles;
///
/// // Element: <div className="text-lg" style="font-size: 15pt">
/// let style = resolve_element_styles(
///     Some("text-lg"),           // Tailwind: font-size: ~11.25pt
///     Some("font-size: 15pt"),   // Inline: font-size: 15pt (wins)
///     None,
/// );
/// // Inline style overrides Tailwind
/// assert_eq!(style.text.font_size, Some(15.0));
/// ```
pub fn resolve_element_styles(
    class_name: Option<&str>,
    inline_style: Option<&str>,
    parent_style: Option<&StyleDeclaration>,
) -> StyleDeclaration {
    // Step 1: Start with inherited properties from parent (if any)
    let mut resolved = if let Some(parent) = parent_style {
        inherit_text_styles(parent)
    } else {
        StyleDeclaration::default()
    };

    // Step 2: Apply Tailwind classes (override inherited properties)
    if let Some(classes) = class_name {
        let tw_style = resolve_tailwind_classes(classes);
        resolved = merge_inherited_styles(resolved, tw_style);
    }

    // Step 3: Apply inline styles (highest specificity, override everything)
    if let Some(inline) = inline_style {
        if let Ok(inline_parsed) = pdf_generator::css_parser::parse_inline_styles(inline) {
            resolved = merge_style_overrides(resolved, inline_parsed);
        }
    }

    resolved
}

/// Resolve styles for a text node (inherits from parent)
///
/// Text nodes in HTML/JSX inherit text-related properties from their parent element.
/// This function applies CSS inheritance rules to create a style for text content.
///
/// # Arguments
/// * `parent_style` - The parent element's computed style
/// * `inline_style` - Optional inline style overrides (rare for text nodes)
///
/// # Returns
/// StyleDeclaration appropriate for rendering text
///
/// # Example
/// ```rust
/// use style_resolver::resolve_text_node_styles;
/// use pdf_generator::css_parser::StyleDeclaration;
///
/// let mut parent = StyleDeclaration::default();
/// parent.text.font_size = Some(16.0);
/// parent.text.color = Some(layout_types::Color { r: 0, g: 0, b: 0, a: 1.0 });
///
/// let text_style = resolve_text_node_styles(&parent, None);
/// assert_eq!(text_style.text.font_size, Some(16.0));
/// assert_eq!(text_style.text.color, Some(layout_types::Color { r: 0, g: 0, b: 0, a: 1.0 }));
/// ```
pub fn resolve_text_node_styles(
    parent_style: &StyleDeclaration,
    inline_style: Option<&str>,
) -> StyleDeclaration {
    let mut resolved = inherit_text_styles(parent_style);

    if let Some(inline) = inline_style {
        if let Ok(inline_parsed) = pdf_generator::css_parser::parse_inline_styles(inline) {
            resolved = merge_style_overrides(resolved, inline_parsed);
        }
    }

    resolved
}
