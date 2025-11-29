//! Text measurement for Taffy layout engine
//!
//! This module provides text measurement functionality required by Taffy's layout algorithm.
//! It wraps text styling information and implements measurement logic for different layout
//! scenarios (definite width, min-content, max-content).

use crate::text_layout::{calculate_text_width, wrap_text_with_config, TextLayoutConfig};
use layout_types::{StyleDeclaration, TextMeasurer};
use taffy::prelude::*;

/// Default font size in points (10pt)
pub const DEFAULT_FONT_SIZE: f64 = 10.0;

/// Default line height multiplier (1.2x font size)
pub const DEFAULT_LINE_HEIGHT_MULTIPLIER: f64 = 1.2;

/// Default font family (PDF Standard 14 font)
pub const DEFAULT_FONT_FAMILY: &str = "Helvetica";

/// Text measurement context for Taffy
///
/// Taffy needs to measure text dimensions during layout. This struct
/// holds the text content and styling information needed for measurement.
#[derive(Debug, Clone)]
pub struct TextMeasureContext {
    pub content: String,
    pub font_size: f64,
    pub line_height: f64,
    pub font_name: String,
}

impl TextMeasureContext {
    /// Create a new text measurement context from content and style
    ///
    /// # Arguments
    ///
    /// * `content` - The text content to measure
    /// * `style` - Style declaration containing font information
    ///
    /// # Returns
    ///
    /// A new `TextMeasureContext` with resolved font properties
    pub fn new(content: String, style: &StyleDeclaration) -> Self {
        let font_size = style.text.font_size.unwrap_or(DEFAULT_FONT_SIZE);
        let line_height = style
            .text
            .line_height
            .unwrap_or(font_size * DEFAULT_LINE_HEIGHT_MULTIPLIER);

        let font_name = style
            .text
            .font_family
            .clone()
            .unwrap_or_else(|| DEFAULT_FONT_FAMILY.to_string());

        Self {
            content,
            font_size,
            line_height,
            font_name,
        }
    }

    /// Measure text dimensions for Taffy layout
    ///
    /// This method is called by Taffy during layout to determine text box sizes.
    /// It handles three different measurement scenarios:
    ///
    /// 1. **Definite width**: Text wraps to fit within the available width
    /// 2. **Min-content**: Width of the longest word (no wrapping)
    /// 3. **Max-content**: Natural width of text on a single line
    ///
    /// # Arguments
    ///
    /// * `known_dimensions` - Dimensions already determined by layout (if any)
    /// * `available_space` - Available space for layout (definite, min, or max content)
    /// * `measurer` - Text measurement implementation for calculating glyph widths
    ///
    /// # Returns
    ///
    /// Measured size of the text box (width and height in points)
    pub fn measure(
        &self,
        known_dimensions: Size<Option<f32>>,
        available_space: Size<AvailableSpace>,
        measurer: &dyn TextMeasurer,
    ) -> Size<f32> {
        // If width is already known, use it
        if let Some(width) = known_dimensions.width {
            if let Some(height) = known_dimensions.height {
                return Size { width, height };
            }
        }

        // Calculate available width for text wrapping
        let (width, height) = match available_space.width {
            AvailableSpace::Definite(w) => {
                // Check if the definite width is sufficient for max-content (no wrapping needed)
                let (max_width, max_height) = self.measure_max_content(measurer);

                // Use 1pt tolerance to handle Taffy's integer rounding during flex layout
                // Taffy may assign box widths slightly smaller than max-content
                if w >= max_width - 1.0 {
                    // Width is sufficient for max-content (with tolerance for flex layout rounding)
                    // No wrapping needed - text fits on one line
                    (max_width, max_height)
                } else {
                    // Width is significantly constrained - wrap text to fit
                    self.measure_with_wrapping(w as f64, measurer)
                }
            }
            AvailableSpace::MinContent => {
                // Min-content: width of longest word (no wrapping)
                self.measure_min_content(measurer)
            }
            AvailableSpace::MaxContent => {
                // MaxContent: natural width without wrapping (single line)
                // This is critical for flexbox layouts with justify-between to work correctly
                self.measure_max_content(measurer)
            }
        };

        Size { width, height }
    }

    /// Measure text with wrapping to fit within a definite width
    fn measure_with_wrapping(&self, max_width: f64, measurer: &dyn TextMeasurer) -> (f32, f32) {
        let config = TextLayoutConfig::default();
        let lines = wrap_text_with_config(
            &self.content,
            max_width,
            self.font_size,
            &self.font_name,
            &config,
            measurer,
        )
        .unwrap_or_else(|_| vec![self.content.clone()]);

        let width = lines
            .iter()
            .map(|line| {
                calculate_text_width(line.as_str(), self.font_size, &self.font_name, measurer)
            })
            .max_by(|a, b| a.partial_cmp(b).unwrap())
            .unwrap_or(0.0) as f32;

        let height = (lines.len() as f64 * self.line_height) as f32;
        (width, height)
    }

    /// Measure minimum content width (longest word, no wrapping)
    fn measure_min_content(&self, measurer: &dyn TextMeasurer) -> (f32, f32) {
        let words: Vec<&str> = self.content.split_whitespace().collect();
        let longest_word = words
            .iter()
            .map(|word| calculate_text_width(word, self.font_size, &self.font_name, measurer))
            .max_by(|a, b| a.partial_cmp(b).unwrap())
            .unwrap_or(0.0);

        let width = longest_word as f32;
        let height = self.line_height as f32;
        (width, height)
    }

    /// Measure maximum content width (single line, no wrapping)
    fn measure_max_content(&self, measurer: &dyn TextMeasurer) -> (f32, f32) {
        let width =
            calculate_text_width(&self.content, self.font_size, &self.font_name, measurer) as f32;
        let height = self.line_height as f32;
        (width, height)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Mock text measurer for testing
    struct MockTextMeasurer;

    impl TextMeasurer for MockTextMeasurer {
        fn measure_text(&self, text: &str, _font_size: f64, _font_name: &str) -> f64 {
            // Simple mock: 6 points per character (typical for 10pt font)
            text.len() as f64 * 6.0
        }
    }

    #[test]
    fn test_new_with_default_values() {
        let style = StyleDeclaration::default();
        let context = TextMeasureContext::new("Hello World".to_string(), &style);

        assert_eq!(context.content, "Hello World");
        assert_eq!(context.font_size, DEFAULT_FONT_SIZE);
        assert_eq!(
            context.line_height,
            DEFAULT_FONT_SIZE * DEFAULT_LINE_HEIGHT_MULTIPLIER
        );
        assert_eq!(context.font_name, DEFAULT_FONT_FAMILY);
    }

    #[test]
    fn test_new_with_custom_font() {
        let mut style = StyleDeclaration::default();
        style.text.font_size = Some(14.0);
        style.text.line_height = Some(20.0);
        style.text.font_family = Some("Arial".to_string());

        let context = TextMeasureContext::new("Test".to_string(), &style);

        assert_eq!(context.font_size, 14.0);
        assert_eq!(context.line_height, 20.0);
        assert_eq!(context.font_name, "Arial");
    }

    #[test]
    fn test_measure_with_known_dimensions() {
        let style = StyleDeclaration::default();
        let context = TextMeasureContext::new("Test".to_string(), &style);
        let measurer = MockTextMeasurer;

        let known = Size {
            width: Some(100.0),
            height: Some(50.0),
        };
        let available = Size {
            width: AvailableSpace::MaxContent,
            height: AvailableSpace::MaxContent,
        };

        let result = context.measure(known, available, &measurer);
        assert_eq!(result.width, 100.0);
        assert_eq!(result.height, 50.0);
    }

    #[test]
    fn test_measure_max_content() {
        let style = StyleDeclaration::default();
        let context = TextMeasureContext::new("Hello".to_string(), &style);
        let measurer = MockTextMeasurer;

        let known = Size {
            width: None,
            height: None,
        };
        let available = Size {
            width: AvailableSpace::MaxContent,
            height: AvailableSpace::MaxContent,
        };

        let result = context.measure(known, available, &measurer);
        // "Hello" = 5 chars * 6 pts = 30.0
        assert_eq!(result.width, 30.0);
        // line_height = 10.0 * 1.2 = 12.0
        assert_eq!(result.height, 12.0);
    }

    #[test]
    fn test_measure_min_content() {
        let style = StyleDeclaration::default();
        let context = TextMeasureContext::new("Hello World".to_string(), &style);
        let measurer = MockTextMeasurer;

        let known = Size {
            width: None,
            height: None,
        };
        let available = Size {
            width: AvailableSpace::MinContent,
            height: AvailableSpace::MaxContent,
        };

        let result = context.measure(known, available, &measurer);
        // Longest word is "Hello" = 5 chars * 6 pts = 30.0
        assert_eq!(result.width, 30.0);
        assert_eq!(result.height, 12.0);
    }

    #[test]
    fn test_measure_definite_width_no_wrapping() {
        let style = StyleDeclaration::default();
        let context = TextMeasureContext::new("Hi".to_string(), &style);
        let measurer = MockTextMeasurer;

        let known = Size {
            width: None,
            height: None,
        };
        let available = Size {
            width: AvailableSpace::Definite(100.0),
            height: AvailableSpace::MaxContent,
        };

        let result = context.measure(known, available, &measurer);
        // "Hi" = 2 chars * 6 pts = 12.0 (fits in 100.0)
        assert_eq!(result.width, 12.0);
        // Single line = 12.0 height
        assert_eq!(result.height, 12.0);
    }

    #[test]
    fn test_empty_content() {
        let style = StyleDeclaration::default();
        let context = TextMeasureContext::new("".to_string(), &style);
        let measurer = MockTextMeasurer;

        let known = Size {
            width: None,
            height: None,
        };
        let available = Size {
            width: AvailableSpace::MaxContent,
            height: AvailableSpace::MaxContent,
        };

        let result = context.measure(known, available, &measurer);
        assert_eq!(result.width, 0.0);
        assert_eq!(result.height, 12.0); // Still has line height
    }
}
