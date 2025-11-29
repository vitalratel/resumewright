//! Font resolution utilities for PDF rendering
//!
//! This module provides utilities for resolving font names based on
//! style properties (family, weight, style).

use crate::css_parser::{FontStyle, FontWeight, StyleDeclaration};
use font_toolkit::mapper::{map_web_safe_font, select_font_variant};

/// Get PDF font name based on style declaration
///
/// Resolves the appropriate PDF font name (from Standard 14 fonts) based on
/// the font family, weight, and style specified in the style declaration.
///
/// # Arguments
///
/// * `style` - The style declaration containing font properties
///
/// # Returns
///
/// A static string reference to the PDF font name (e.g., "Helvetica-Bold")
///
/// # Examples
///
/// ```
/// use pdf_generator::font_resolver::get_font_name;
/// use layout_types::{StyleDeclaration, TextStyle, FontWeight};
///
/// let mut style = StyleDeclaration::default();
/// style.text.font_weight = Some(FontWeight::Bold);
///
/// assert_eq!(get_font_name(&style), "Helvetica-Bold");
/// ```
pub fn get_font_name(style: &StyleDeclaration) -> &'static str {
    let font_family = style.text.font_family.as_deref().unwrap_or("Helvetica");
    let font_weight = style.text.font_weight.unwrap_or(FontWeight::Normal);
    let font_style = style.text.font_style.unwrap_or(FontStyle::Normal);

    // Map web-safe font to PDF Standard 14 base font
    let base_font = map_web_safe_font(font_family);

    // Convert layout-types enums to font-toolkit enums
    let toolkit_weight = match font_weight {
        FontWeight::Normal => font_toolkit::FontWeight::Normal,
        FontWeight::Bold => font_toolkit::FontWeight::Bold,
        FontWeight::Lighter => font_toolkit::FontWeight::Lighter,
        FontWeight::Bolder => font_toolkit::FontWeight::Bolder,
    };
    let toolkit_style = match font_style {
        FontStyle::Normal => font_toolkit::FontStyle::Normal,
        FontStyle::Italic => font_toolkit::FontStyle::Italic,
        FontStyle::Oblique => font_toolkit::FontStyle::Oblique,
    };

    // Select font variant with weight and style
    select_font_variant(base_font, toolkit_weight, toolkit_style)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_font_name_normal() {
        let style = StyleDeclaration::default();
        assert_eq!(get_font_name(&style), "Helvetica");
    }

    #[test]
    fn test_get_font_name_bold() {
        let mut style = StyleDeclaration::default();
        style.text.font_weight = Some(FontWeight::Bold);
        assert_eq!(get_font_name(&style), "Helvetica-Bold");
    }

    #[test]
    fn test_get_font_name_italic() {
        let mut style = StyleDeclaration::default();
        style.text.font_style = Some(FontStyle::Italic);
        assert_eq!(get_font_name(&style), "Helvetica-Oblique");
    }

    #[test]
    fn test_get_font_name_bold_italic() {
        let mut style = StyleDeclaration::default();
        style.text.font_weight = Some(FontWeight::Bold);
        style.text.font_style = Some(FontStyle::Italic);
        assert_eq!(get_font_name(&style), "Helvetica-BoldOblique");
    }
}
