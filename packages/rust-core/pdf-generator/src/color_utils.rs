//! Color utilities for PDF rendering
//!
//! This module provides utilities for color conversion and manipulation.

use crate::css_parser::Color;

/// Convert Color (0-255 RGB) to PDF color format (0.0-1.0)
///
/// PDF uses floating-point color values in the range 0.0-1.0, while
/// CSS/web colors typically use 0-255 integers.
///
/// # Arguments
///
/// * `color` - Color with r, g, b values in 0-255 range
///
/// # Returns
///
/// Tuple of (r, g, b) in 0.0-1.0 range for PDF
///
/// # Examples
///
/// ```
/// use pdf_generator::color_utils::rgb_to_pdf_color;
/// use pdf_generator::css_parser::Color;
///
/// let color = Color { r: 255, g: 128, b: 0, a: 1.0 };
/// let (r, g, b) = rgb_to_pdf_color(&color);
/// assert_eq!(r, 1.0);
/// assert!((g - 0.502).abs() < 0.001);
/// assert_eq!(b, 0.0);
/// ```
pub fn rgb_to_pdf_color(color: &Color) -> (f64, f64, f64) {
    (
        color.r as f64 / 255.0,
        color.g as f64 / 255.0,
        color.b as f64 / 255.0,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rgb_to_pdf_color_black() {
        let color = Color {
            r: 0,
            g: 0,
            b: 0,
            a: 1.0,
        };
        let (r, g, b) = rgb_to_pdf_color(&color);
        assert_eq!(r, 0.0);
        assert_eq!(g, 0.0);
        assert_eq!(b, 0.0);
    }

    #[test]
    fn test_rgb_to_pdf_color_white() {
        let color = Color {
            r: 255,
            g: 255,
            b: 255,
            a: 1.0,
        };
        let (r, g, b) = rgb_to_pdf_color(&color);
        assert_eq!(r, 1.0);
        assert_eq!(g, 1.0);
        assert_eq!(b, 1.0);
    }

    #[test]
    fn test_rgb_to_pdf_color_red() {
        let color = Color {
            r: 255,
            g: 0,
            b: 0,
            a: 1.0,
        };
        let (r, g, b) = rgb_to_pdf_color(&color);
        assert_eq!(r, 1.0);
        assert_eq!(g, 0.0);
        assert_eq!(b, 0.0);
    }

    #[test]
    fn test_rgb_to_pdf_color_gray() {
        let color = Color {
            r: 128,
            g: 128,
            b: 128,
            a: 1.0,
        };
        let (r, g, b) = rgb_to_pdf_color(&color);
        assert!((r - 0.502).abs() < 0.001);
        assert!((g - 0.502).abs() < 0.001);
        assert!((b - 0.502).abs() < 0.001);
    }
}
