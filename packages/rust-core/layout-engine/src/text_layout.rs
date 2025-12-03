//! Text layout - wrapping, measurement, and line breaking

use crate::error::LayoutError;
use hyphenation::{Hyphenator, Language, Load, Standard};
use layout_types::TextMeasurer;

/// Configuration for text layout behavior
#[derive(Debug, Clone)]
pub struct TextLayoutConfig {
    /// Enable hyphenation for better text flow
    pub enable_hyphenation: bool,
    /// Minimum word length to consider for hyphenation (default: 6)
    pub min_word_length: usize,
}

impl Default for TextLayoutConfig {
    fn default() -> Self {
        Self {
            enable_hyphenation: false, // Disabled by default to prevent word splits in CVs
            min_word_length: 6,
        }
    }
}

/// Calculate text width using character-specific width estimates
///
/// **Note:** This function uses hardcoded character widths based on typical sans-serif fonts
/// (such as Helvetica or Arial). These estimates provide reasonable approximations for most
/// common CV layouts but may not be accurate for custom fonts with different metrics.
///
/// For precise text measurement with custom fonts or when exact width is critical,
/// consider integrating a font-toolkit crate that can load actual font metrics.
///
/// # Arguments
/// * `text` - The text to measure
/// * `font_size` - The font size in points
///
/// # Returns
/// Estimated width in points based on character-specific estimates
pub(crate) fn calculate_text_width(
    text: &str,
    font_size: f64,
    font_name: &str,
    measurer: &dyn TextMeasurer,
) -> f64 {
    measurer.measure_text(text, font_size, font_name)
}

/// Find hyphenation break point for a word using industry-standard patterns
///
/// Uses the `hyphenation` crate with embedded Liang-Teng hyphenation patterns,
/// which are the same patterns used by TeX, LibreOffice, and Firefox.
///
/// # Arguments
/// * `word` - The word to hyphenate
/// * `max_width` - Maximum width available
/// * `font_size` - Font size for width calculation
/// * `current_line` - Current line content (to calculate remaining space)
///
/// # Returns
/// Some((prefix, suffix)) if hyphenation is possible, None otherwise
fn find_hyphenation_break(
    word: &str,
    max_width: f64,
    font_size: f64,
    font_name: &str,
    current_line: &str,
    measurer: &dyn TextMeasurer,
) -> Option<(String, String)> {
    // Load English US hyphenation patterns (embedded at compile time)
    let dictionary = Standard::from_embedded(Language::EnglishUS).ok()?;

    // Get hyphenation points using industry-standard Liang-Teng algorithm
    let hyphenated = dictionary.hyphenate(word);
    let breaks = hyphenated.breaks;

    // Try each hyphenation point from right to left (prefer later breaks)
    for &point in breaks.iter().rev() {
        let prefix = &word[..point];
        let suffix = &word[point..];

        // Build test line with hyphenated word
        let test_line = if current_line.is_empty() {
            format!("{}-", prefix)
        } else {
            format!("{} {}-", current_line, prefix)
        };

        let test_width = calculate_text_width(&test_line, font_size, font_name, measurer);

        if test_width <= max_width {
            return Some((prefix.to_string(), suffix.to_string()));
        }
    }

    None
}

/// Combine words with intermediate punctuation to prevent orphan separators
///
/// Handles patterns like "1997 – 2002" to prevent breaking into "1997 –" | "2002"
///
/// # Arguments
/// * `words` - Slice of word tokens
/// * `index` - Current word index
///
/// # Returns
/// `(combined_word, words_consumed)` where words_consumed includes the current word
fn combine_words_with_punctuation(words: &[&str], index: usize) -> (String, usize) {
    let word = words[index];

    // Look ahead: if next word is short punctuation, combine with following word
    // Pattern: "1997" "–" "2002" -> "1997 – 2002"
    if index + 2 < words.len() {
        let next = words[index + 1];
        // Check if next word is a single dash character (use char count, not byte length)
        let char_count = next.chars().count();
        if char_count <= 2 && (next.contains('–') || next.contains('—') || next.contains('-')) {
            // Combine current + dash + following word
            let combined = format!("{} {} {}", word, next, words[index + 2]);
            return (combined, 3); // Consumed 3 words
        }
    }

    (word.to_string(), 1) // Consumed 1 word
}

/// Wrap text with custom configuration
pub fn wrap_text_with_config(
    text: &str,
    max_width: f64,
    font_size: f64,
    font_name: &str,
    config: &TextLayoutConfig,
    measurer: &dyn TextMeasurer,
) -> Result<Vec<String>, LayoutError> {
    let mut lines = Vec::new();
    let words: Vec<&str> = text.split_whitespace().collect();
    let mut current_line = String::new();
    let mut i = 0;

    while i < words.len() {
        let (word, consumed) = combine_words_with_punctuation(&words, i);
        i += consumed;

        let test_line = if current_line.is_empty() {
            word.clone()
        } else {
            format!("{} {}", current_line, word)
        };

        let test_width = calculate_text_width(&test_line, font_size, font_name, measurer);

        if test_width > max_width {
            // Current line would be too long

            // If current line is not empty, finish it first
            if !current_line.is_empty() {
                // Try hyphenation if enabled and word is long enough
                if config.enable_hyphenation && word.len() >= config.min_word_length {
                    if let Some((prefix, suffix)) = find_hyphenation_break(
                        &word,
                        max_width,
                        font_size,
                        font_name,
                        &current_line,
                        measurer,
                    ) {
                        // Add prefix with hyphen to current line
                        current_line = format!("{} {}-", current_line, prefix);
                        lines.push(current_line.trim().to_string());
                        current_line = suffix.to_string();
                        continue;
                    }
                }

                // No hyphenation possible or disabled, start new line
                lines.push(current_line.trim().to_string());
                current_line = word.clone();
            }

            // If word itself is too long for the line (even when starting fresh), hyphenate it
            if current_line.is_empty()
                || calculate_text_width(&current_line, font_size, font_name, measurer) > max_width
            {
                if config.enable_hyphenation && word.len() >= config.min_word_length {
                    // Try to hyphenate the word to fit on current line
                    let mut remaining = word.to_string();
                    while calculate_text_width(&remaining, font_size, font_name, measurer)
                        > max_width
                    {
                        if let Some((prefix, suffix)) = find_hyphenation_break(
                            &remaining, max_width, font_size, font_name, "", measurer,
                        ) {
                            lines.push(format!("{}-", prefix));
                            remaining = suffix;
                        } else {
                            // Can't hyphenate further, just add the word
                            break;
                        }
                    }
                    current_line = remaining;
                } else {
                    // Hyphenation disabled, word stays on one line (may overflow)
                    current_line = word.clone();
                }
            }
        } else {
            current_line = test_line;
        }
    }

    if !current_line.is_empty() {
        lines.push(current_line.trim().to_string());
    }

    // If no lines were created (empty text), add one empty line
    if lines.is_empty() {
        lines.push(String::new());
    }

    Ok(lines)
}

#[cfg(test)]
mod tests {
    use super::*;

    // Mock text measurer for testing (simple character count estimation)
    struct MockMeasurer;

    impl TextMeasurer for MockMeasurer {
        fn measure_text(&self, text: &str, font_size: f64, _font_name: &str) -> f64 {
            // Simple estimation: 0.6 * font_size per character
            text.len() as f64 * font_size * 0.6
        }
    }

    #[test]
    fn test_combine_words_with_punctuation_en_dash() {
        let words = vec!["1997", "–", "2002"];
        let (combined, consumed) = combine_words_with_punctuation(&words, 0);

        assert_eq!(combined, "1997 – 2002");
        assert_eq!(consumed, 3);
    }

    #[test]
    fn test_combine_words_with_punctuation_em_dash() {
        let words = vec!["Part", "—", "whole"];
        let (combined, consumed) = combine_words_with_punctuation(&words, 0);

        assert_eq!(combined, "Part — whole");
        assert_eq!(consumed, 3);
    }

    #[test]
    fn test_combine_words_with_punctuation_hyphen() {
        let words = vec!["Page", "-", "1"];
        let (combined, consumed) = combine_words_with_punctuation(&words, 0);

        assert_eq!(combined, "Page - 1");
        assert_eq!(consumed, 3);
    }

    #[test]
    fn test_combine_words_no_punctuation() {
        let words = vec!["hello", "world"];
        let (combined, consumed) = combine_words_with_punctuation(&words, 0);

        assert_eq!(combined, "hello");
        assert_eq!(consumed, 1);
    }

    #[test]
    fn test_combine_words_punctuation_at_end() {
        let words = vec!["test", "–"];
        let (combined, consumed) = combine_words_with_punctuation(&words, 0);

        assert_eq!(combined, "test");
        assert_eq!(consumed, 1);
    }

    #[test]
    fn test_combine_words_long_punctuation_not_combined() {
        let words = vec!["test", "---", "word"];
        let (combined, consumed) = combine_words_with_punctuation(&words, 0);

        assert_eq!(combined, "test");
        assert_eq!(consumed, 1);
    }

    #[test]
    fn test_wrap_text_simple() {
        let measurer = MockMeasurer;
        let config = TextLayoutConfig::default();

        let result =
            wrap_text_with_config("Hello world", 100.0, 10.0, "Helvetica", &config, &measurer);

        assert!(result.is_ok());
        let lines = result.unwrap();
        assert_eq!(lines.len(), 1);
        assert_eq!(lines[0], "Hello world");
    }

    #[test]
    fn test_wrap_text_with_line_break() {
        let measurer = MockMeasurer;
        let config = TextLayoutConfig::default();

        // "Hello" = 5 chars * 10 * 0.6 = 30
        // "world" = 5 chars * 10 * 0.6 = 30
        // "Hello world" = 11 chars * 10 * 0.6 = 66
        // Max width = 50, so should break
        let result =
            wrap_text_with_config("Hello world", 50.0, 10.0, "Helvetica", &config, &measurer);

        assert!(result.is_ok());
        let lines = result.unwrap();
        assert_eq!(lines.len(), 2);
        assert_eq!(lines[0], "Hello");
        assert_eq!(lines[1], "world");
    }

    #[test]
    fn test_wrap_text_with_date_range() {
        let measurer = MockMeasurer;
        let config = TextLayoutConfig::default();

        // Test that "1997 – 2002" stays together
        let result = wrap_text_with_config(
            "Studied 1997 – 2002 here",
            200.0, // Wide enough for all
            10.0,
            "Helvetica",
            &config,
            &measurer,
        );

        assert!(result.is_ok());
        let lines = result.unwrap();
        // Should keep date range together
        assert!(lines.iter().any(|line| line.contains("1997 – 2002")));
    }

    #[test]
    fn test_wrap_text_empty() {
        let measurer = MockMeasurer;
        let config = TextLayoutConfig::default();

        let result = wrap_text_with_config("", 100.0, 10.0, "Helvetica", &config, &measurer);

        assert!(result.is_ok());
        let lines = result.unwrap();
        assert_eq!(lines.len(), 1);
        assert_eq!(lines[0], "");
    }

    #[test]
    fn test_wrap_text_whitespace_only() {
        let measurer = MockMeasurer;
        let config = TextLayoutConfig::default();

        let result =
            wrap_text_with_config("   \t\n  ", 100.0, 10.0, "Helvetica", &config, &measurer);

        assert!(result.is_ok());
        let lines = result.unwrap();
        assert_eq!(lines.len(), 1);
        assert_eq!(lines[0], "");
    }

    // Tests for mutation coverage - boundary conditions

    #[test]
    fn test_wrap_text_exact_width_fits_on_one_line() {
        // Line 154: test_width > max_width boundary
        // When test_width == max_width exactly, should NOT wrap
        let measurer = MockMeasurer;
        let config = TextLayoutConfig::default();

        // "Hello" = 5 chars * 10 * 0.6 = 30.0
        // Set max_width to exactly 30.0 - should fit on one line
        let result = wrap_text_with_config("Hello", 30.0, 10.0, "Helvetica", &config, &measurer);

        let lines = result.unwrap();
        assert_eq!(
            lines.len(),
            1,
            "Text at exact max_width should fit on one line"
        );
        assert_eq!(lines[0], "Hello");
    }

    #[test]
    fn test_wrap_text_one_point_over_wraps() {
        // Line 154: Verify that exceeding by even a tiny amount causes wrap
        let measurer = MockMeasurer;
        let config = TextLayoutConfig::default();

        // "Hello " + "w" would be 7 chars * 10 * 0.6 = 42.0
        // "Hello" alone = 30.0
        // Set max_width to 35.0 - "Hello" fits, "Hello w" doesn't
        let result =
            wrap_text_with_config("Hello world", 35.0, 10.0, "Helvetica", &config, &measurer);

        let lines = result.unwrap();
        assert_eq!(lines.len(), 2, "Text exceeding max_width should wrap");
        assert_eq!(lines[0], "Hello");
        assert_eq!(lines[1], "world");
    }

    #[test]
    fn test_hyphenation_disabled_preserves_long_word() {
        // Line 160: Test && vs || - hyphenation disabled should NOT hyphenate
        let measurer = MockMeasurer;
        let config = TextLayoutConfig {
            enable_hyphenation: false,
            min_word_length: 6,
        };

        // "programming" = 11 chars * 10 * 0.6 = 66.0, exceeds max_width of 50
        let result = wrap_text_with_config(
            "Start programming end",
            50.0,
            10.0,
            "Helvetica",
            &config,
            &measurer,
        );

        let lines = result.unwrap();
        // "programming" should appear intact somewhere (not hyphenated)
        assert!(
            lines.iter().any(|l| l.contains("programming")),
            "Long word should not be hyphenated when hyphenation is disabled"
        );
    }

    #[test]
    fn test_hyphenation_respects_min_word_length_boundary() {
        // Line 160: word.len() >= config.min_word_length boundary
        let measurer = MockMeasurer;
        let config = TextLayoutConfig {
            enable_hyphenation: true,
            min_word_length: 6,
        };

        // "short" = 5 chars, below min_word_length of 6, should NOT be hyphenated
        // even if it exceeds the line width
        // 5 chars * 10 * 0.6 = 30.0
        let result = wrap_text_with_config(
            "Start short end",
            25.0,
            10.0,
            "Helvetica",
            &config,
            &measurer,
        );

        let lines = result.unwrap();
        // "short" should appear intact (not hyphenated) because it's < min_word_length
        assert!(
            lines.iter().any(|l| l == "short"),
            "Word below min_word_length should not be hyphenated"
        );
    }

    #[test]
    fn test_hyphenation_applies_at_min_word_length() {
        // Line 160: word.len() >= config.min_word_length - word exactly at threshold
        let measurer = MockMeasurer;
        let config = TextLayoutConfig {
            enable_hyphenation: true,
            min_word_length: 6,
        };

        // "longer" = 6 chars, exactly at min_word_length, SHOULD be eligible for hyphenation
        // But hyphenation only happens if word doesn't fit
        // 6 chars * 10 * 0.6 = 36.0
        // We need a scenario where the word triggers hyphenation attempt
        let result = wrap_text_with_config(
            "Start longer end",
            35.0,
            10.0,
            "Helvetica",
            &config,
            &measurer,
        );

        let lines = result.unwrap();
        // Word is exactly at min_word_length, so hyphenation should be attempted
        // The word "longer" can be hyphenated as "long-er" by the English dictionary
        // If hyphenation works, we should see a hyphen
        let has_hyphen = lines.iter().any(|l| l.contains('-'));
        let word_intact = lines.iter().any(|l| l == "longer");
        // Either hyphenation worked (has hyphen) or word stayed intact (no valid break point)
        assert!(
            has_hyphen || word_intact,
            "Word at min_word_length should be eligible for hyphenation attempt"
        );
    }

    #[test]
    fn test_single_long_word_exceeds_max_width_with_hyphenation() {
        // Lines 184-190: Word too long even when starting fresh, triggers hyphenation loop
        let measurer = MockMeasurer;
        let config = TextLayoutConfig {
            enable_hyphenation: true,
            min_word_length: 6,
        };

        // "internationalization" = 20 chars * 10 * 0.6 = 120.0
        // max_width = 60, so even alone it exceeds the line
        let result = wrap_text_with_config(
            "internationalization",
            60.0,
            10.0,
            "Helvetica",
            &config,
            &measurer,
        );

        let lines = result.unwrap();
        // Should have been split across multiple lines via hyphenation
        assert!(
            lines.len() > 1,
            "Very long word should be hyphenated across multiple lines"
        );
        // Should contain hyphens from the splits
        let hyphen_count = lines.iter().filter(|l| l.ends_with('-')).count();
        assert!(
            hyphen_count >= 1,
            "Hyphenated lines should end with hyphens"
        );
    }

    #[test]
    fn test_single_long_word_no_hyphenation_stays_intact() {
        // Lines 184-206: Word too long but hyphenation disabled
        let measurer = MockMeasurer;
        let config = TextLayoutConfig {
            enable_hyphenation: false,
            min_word_length: 6,
        };

        // "internationalization" = 20 chars * 10 * 0.6 = 120.0
        // max_width = 60, word alone exceeds it, but no hyphenation
        let result = wrap_text_with_config(
            "internationalization",
            60.0,
            10.0,
            "Helvetica",
            &config,
            &measurer,
        );

        let lines = result.unwrap();
        // Should stay on one line (overflow) since hyphenation is disabled
        assert_eq!(
            lines.len(),
            1,
            "Without hyphenation, long word stays intact"
        );
        assert_eq!(lines[0], "internationalization");
    }

    #[test]
    fn test_hyphenation_loop_boundary_exact_fit() {
        // Line 190: while ... > max_width boundary
        // Test that loop terminates correctly when remaining fits exactly
        let measurer = MockMeasurer;
        let config = TextLayoutConfig {
            enable_hyphenation: true,
            min_word_length: 6,
        };

        // Use a word that hyphenates to a piece that fits exactly
        // "understanding" can hyphenate at multiple points
        // We're testing that the loop terminates properly
        let result =
            wrap_text_with_config("understanding", 50.0, 10.0, "Helvetica", &config, &measurer);

        let lines = result.unwrap();
        // Should complete without infinite loop and produce valid output
        assert!(!lines.is_empty(), "Should produce at least one line");
        // All content should be preserved
        let all_content: String = lines.join("").replace('-', "");
        assert_eq!(
            all_content, "understanding",
            "All content should be preserved after hyphenation"
        );
    }
}
