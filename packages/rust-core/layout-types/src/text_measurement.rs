//! Text measurement abstraction for layout calculations
//!
//! This module provides a trait-based abstraction for measuring text dimensions,
//! allowing different implementations (estimated vs actual font metrics) to be
//! injected into the layout engine.

/// Trait for measuring text dimensions with specific font settings
///
/// This abstraction allows the layout engine to measure text without being
/// tightly coupled to a specific font measurement implementation. Different
/// implementations can provide varying levels of accuracy:
///
/// - **Estimated:** Fast character-width approximations for testing
/// - **Font-based:** Accurate measurements using actual font metrics
///
/// # Examples
///
/// ```rust
/// use layout_types::TextMeasurer;
///
/// struct SimpleMeasurer;
///
/// impl TextMeasurer for SimpleMeasurer {
///     fn measure_text(&self, text: &str, font_size: f64, _font_name: &str) -> f64 {
///         // Simple estimation: 0.6 * font_size per character
///         text.len() as f64 * font_size * 0.6
///     }
/// }
///
/// let measurer = SimpleMeasurer;
/// let width = measurer.measure_text("Hello", 12.0, "Helvetica");
/// assert!(width > 0.0);
/// ```
pub trait TextMeasurer: Send + Sync {
    /// Measure the width of text in points
    ///
    /// # Arguments
    ///
    /// * `text` - The text content to measure
    /// * `font_size` - Font size in points
    /// * `font_name` - Font name (e.g., "Helvetica", "Times-Roman")
    ///
    /// # Returns
    ///
    /// Width of the text in points (1 point = 1/72 inch)
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use layout_types::TextMeasurer;
    /// # struct MyMeasurer;
    /// # impl TextMeasurer for MyMeasurer {
    /// #     fn measure_text(&self, text: &str, font_size: f64, font_name: &str) -> f64 {
    /// #         text.len() as f64 * font_size * 0.6
    /// #     }
    /// # }
    /// let measurer = MyMeasurer;
    /// let width = measurer.measure_text("Resume", 12.0, "Helvetica");
    /// ```
    fn measure_text(&self, text: &str, font_size: f64, font_name: &str) -> f64;
}

/// Default implementation using character-width estimates
///
/// This provides a simple estimation based on typical sans-serif font metrics.
/// Useful for testing and when exact measurements aren't critical.
///
/// For production use with accurate rendering, prefer implementations that
/// use actual font metrics (e.g., from TrueType font files).
pub struct EstimatedTextMeasurer;

impl TextMeasurer for EstimatedTextMeasurer {
    fn measure_text(&self, text: &str, font_size: f64, _font_name: &str) -> f64 {
        let mut total_width = 0.0;

        for ch in text.chars() {
            let char_width = match ch {
                // Narrow characters
                'i' | 'j' | 'l' | '!' | '|' | '.' | ',' | ':' | ';' | '\'' => 0.28,
                'I' | 'f' | 't' | 'r' => 0.33,

                // Medium-narrow characters
                ' ' | 'c' | 's' | 'z' | 'J' => 0.5,

                // Average width characters (most lowercase)
                'a' | 'b' | 'd' | 'e' | 'g' | 'h' | 'k' | 'n' | 'o' | 'p' | 'q' | 'u' | 'v'
                | 'x' | 'y' => 0.56,

                // Wide lowercase
                'm' | 'w' => 0.83,

                // Average uppercase
                'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'K' | 'L' | 'N' | 'O' | 'P'
                | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'X' | 'Y' | 'Z' => 0.67,

                // Wide uppercase
                'M' | 'W' => 0.83,

                // Numbers
                '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' => 0.56,

                // Common punctuation
                '-' | '(' | ')' | '[' | ']' | '{' | '}' => 0.33,
                '&' | '%' | '@' | '#' | '$' | '+' | '=' | '/' | '\\' | '*' => 0.56,
                '?' | '"' | '<' | '>' | '^' | '~' | '`' => 0.56,

                // En dash, em dash
                '–' => 0.5, // En dash
                '—' => 1.0, // Em dash

                // Default for unknown characters
                _ => 0.56,
            };
            total_width += char_width * font_size;
        }

        total_width
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_estimated_measurer_basic() {
        let measurer = EstimatedTextMeasurer;
        let width = measurer.measure_text("Hello", 10.0, "Helvetica");
        assert!(width > 0.0);
        assert!(width < 100.0); // Sanity check
    }

    #[test]
    fn test_estimated_measurer_scales_with_font_size() {
        let measurer = EstimatedTextMeasurer;
        let width_10 = measurer.measure_text("Test", 10.0, "Helvetica");
        let width_20 = measurer.measure_text("Test", 20.0, "Helvetica");

        // Width should scale linearly with font size
        assert!((width_20 / width_10 - 2.0).abs() < 0.01);
    }

    #[test]
    fn test_estimated_measurer_empty_string() {
        let measurer = EstimatedTextMeasurer;
        let width = measurer.measure_text("", 10.0, "Helvetica");
        assert_eq!(width, 0.0);
    }
}
