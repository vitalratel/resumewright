//! CSS parsing module for converting inline styles to PDF styling
//!
//! This module provides functionality to parse inline CSS styles and convert them
//! to a format suitable for PDF rendering. It uses lightningcss for robust CSS parsing
//! and provides conversions for common CSS units to PDF points.
//!
//! # Module Organization
//!
//! This module has been refactored into focused submodules for token efficiency:
//! - `css::parser` - CSS property parsing and inline style processing (280 LOC)
//! - `css::converter` - CSS unit conversion to PDF points (80 LOC)
//! - `css::color` - Color parsing for hex, RGB, and named colors (170 LOC)
//!
//! Original size: 619 LOC (largest module in pdf-generator)
//! New structure: 3 modules × 80-280 LOC each
//! Rationale: Improves AI navigation, follows token-efficiency pattern from
//! tsx-parser and layout-engine refactorings (2025-10-19)

use thiserror::Error;

// Re-export style types from shared layout-types crate
pub use layout_types::{
    AlignItems, BorderLineStyle, BorderStyle, Color, Display, FlexDirection, FontStyle, FontWeight,
    JustifyContent, Spacing, StyleDeclaration, TextAlign, TextTransform,
};

// Re-export parsing functions from submodules
pub use crate::css::css_to_points;
pub use crate::css::parse_color;
pub use crate::css::parse_inline_styles;

/// CSS parsing error type
#[derive(Debug, Error)]
pub enum CSSParseError {
    #[error("CSS parse failed: {0}")]
    ParseFailed(String),

    #[error("Invalid CSS value: {0}")]
    InvalidValue(String),

    #[error("Invalid CSS color: {0}")]
    InvalidColor(String),
}

#[cfg(test)]
mod tests {
    use super::*;
    use layout_types::DEFAULT_FONT_SIZE;

    #[test]
    fn test_parse_inline_styles_empty() {
        let result = parse_inline_styles("").unwrap();
        assert_eq!(result.text.font_family, Some("Helvetica".to_string()));
    }

    #[test]
    fn test_parse_font_size() {
        let result = parse_inline_styles("font-size: 16px").unwrap();
        assert_eq!(result.text.font_size, Some(12.0)); // 16 * 0.75 = 12
    }

    #[test]
    fn test_parse_color_hex() {
        let result = parse_inline_styles("color: #ff0000").unwrap();
        assert_eq!(
            result.text.color,
            Some(Color {
                r: 255,
                g: 0,
                b: 0,
                a: 1.0
            })
        );
    }

    #[test]
    fn test_parse_color_rgb() {
        let result = parse_inline_styles("color: rgb(255, 0, 0)").unwrap();
        assert_eq!(
            result.text.color,
            Some(Color {
                r: 255,
                g: 0,
                b: 0,
                a: 1.0
            })
        );
    }

    #[test]
    fn test_parse_color_named() {
        let result = parse_inline_styles("color: red").unwrap();
        assert_eq!(
            result.text.color,
            Some(Color {
                r: 255,
                g: 0,
                b: 0,
                a: 1.0
            })
        );
    }

    #[test]
    fn test_parse_margin_shorthand() {
        let result = parse_inline_styles("margin: 10px 20px").unwrap();
        let margin = result.box_model.margin.unwrap();
        assert_eq!(margin.top, 7.5); // 10 * 0.75
        assert_eq!(margin.right, 15.0); // 20 * 0.75
        assert_eq!(margin.bottom, 7.5);
        assert_eq!(margin.left, 15.0);
    }

    #[test]
    fn test_css_to_points_px() {
        assert_eq!(css_to_points("16px").unwrap(), 12.0);
    }

    #[test]
    fn test_css_to_points_pt() {
        assert_eq!(css_to_points("12pt").unwrap(), 12.0);
    }

    #[test]
    fn test_css_to_points_em() {
        assert_eq!(css_to_points("1.5em").unwrap(), 1.5 * DEFAULT_FONT_SIZE);
    }

    #[test]
    fn test_parse_hex_color_3_digit() {
        let color = parse_color("#f00").unwrap();
        assert_eq!(
            color,
            Color {
                r: 255,
                g: 0,
                b: 0,
                a: 1.0
            }
        );
    }

    #[test]
    fn test_parse_hex_color_6_digit() {
        let color = parse_color("#ff0000").unwrap();
        assert_eq!(
            color,
            Color {
                r: 255,
                g: 0,
                b: 0,
                a: 1.0
            }
        );
    }

    #[test]
    fn test_parse_hex_color_8_digit() {
        let color = parse_color("#ff000080").unwrap();
        assert_eq!(
            color,
            Color {
                r: 255,
                g: 0,
                b: 0,
                a: 0.5019608
            }
        );
    }
}
