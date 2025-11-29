//! Text width estimation for PDF rendering
//!
//! Provides accurate text measurement for Standard 14 PDF fonts (Helvetica, Times, Courier)
//! with fallback to Helvetica for embedded fonts like Google Fonts.

use super::width_tables::get_char_width;
use layout_types::TextMeasurer;

/// Estimate text width for a given font
///
/// Supports Standard 14 PDF fonts (Helvetica, Times, Courier) with accurate character width tables.
/// For other fonts (e.g., embedded Google Fonts), uses Helvetica as approximation.
///
/// # Arguments
/// * `text` - The text to measure
/// * `font_size` - Font size in points
/// * `font_name` - PDF font name (e.g., "Helvetica", "Times-Roman", "Courier-Bold")
///
/// # Returns
/// Estimated width in points
///
/// # Examples
/// ```
/// use pdf_generator::fonts::estimate_text_width;
///
/// let width = estimate_text_width("Hello", 12.0, "Helvetica");
/// assert!(width > 0.0);
/// ```
pub fn estimate_text_width(text: &str, font_size: f64, font_name: &str) -> f64 {
    text.chars()
        .map(|ch| get_char_width(ch, font_name) * font_size)
        .sum()
}

/// Text measurer using accurate PDF font metrics
///
/// This implementation uses actual character width tables from PDF Standard 14 fonts,
/// providing accurate measurements for Helvetica, Times, and Courier families.
/// For other fonts (e.g., embedded Google Fonts), it falls back to Helvetica metrics.
///
/// # Examples
///
/// ```
/// use pdf_generator::fonts::PDFTextMeasurer;
/// use layout_types::TextMeasurer;
///
/// let measurer = PDFTextMeasurer;
/// let width = measurer.measure_text("Hello", 12.0, "Helvetica");
/// assert!(width > 0.0);
/// ```
pub struct PDFTextMeasurer;

impl TextMeasurer for PDFTextMeasurer {
    fn measure_text(&self, text: &str, font_size: f64, font_name: &str) -> f64 {
        estimate_text_width(text, font_size, font_name)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_estimate_text_width_helvetica() {
        let text = "Hello World";
        let width = estimate_text_width(text, 12.0, "Helvetica");
        // Rough check - should be reasonable width
        assert!(width > 0.0);
        assert!(width < text.len() as f64 * 12.0); // Less than max possible
    }

    #[test]
    fn test_estimate_text_width_times() {
        let text = "Hello World";
        let width_times = estimate_text_width(text, 12.0, "Times-Roman");
        let width_helvetica = estimate_text_width(text, 12.0, "Helvetica");

        // Times is generally narrower than Helvetica for most text
        assert!(width_times > 0.0);
        assert!(width_times != width_helvetica); // Should be different
    }

    #[test]
    fn test_estimate_text_width_courier() {
        // Courier is monospaced - same number of characters should have same width
        let text_short = "iii";
        let text_wide = "WWW";
        let width_short = estimate_text_width(text_short, 12.0, "Courier");
        let width_wide = estimate_text_width(text_wide, 12.0, "Courier");

        assert!((width_short - width_wide).abs() < 0.01);
    }

    #[test]
    fn test_estimate_text_width_proportional() {
        // Test that narrow and wide characters differ in Helvetica
        let narrow = "iiii";
        let wide = "MMMM";
        let width_narrow = estimate_text_width(narrow, 12.0, "Helvetica");
        let width_wide = estimate_text_width(wide, 12.0, "Helvetica");

        // Wide characters should be wider
        assert!(width_wide > width_narrow);
    }

    #[test]
    fn test_estimate_text_width_scales_with_font_size() {
        let text = "Test";
        let width_12 = estimate_text_width(text, 12.0, "Helvetica");
        let width_24 = estimate_text_width(text, 24.0, "Helvetica");

        // Double font size should roughly double width
        assert!((width_24 / width_12 - 2.0).abs() < 0.01);
    }

    #[test]
    fn test_estimate_text_width_google_fonts_fallback() {
        // Unknown fonts should fall back to Helvetica approximation
        let text = "Hello";
        let width_unknown = estimate_text_width(text, 12.0, "Roboto-Regular");
        let width_helvetica = estimate_text_width(text, 12.0, "Helvetica");

        // Should use Helvetica as fallback
        assert_eq!(width_unknown, width_helvetica);
    }
}
