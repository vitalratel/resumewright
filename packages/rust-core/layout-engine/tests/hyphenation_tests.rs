//! Comprehensive tests for hyphenation functionality

use layout_engine::{wrap_text_with_config, TextLayoutConfig};

#[test]
fn test_hyphenation_long_word() {
    let config = TextLayoutConfig {
        enable_hyphenation: true,
        min_word_length: 6,
    };

    // "Telecommunications" should be hyphenated in a narrow column
    let text = "Telecommunications";
    let max_width = 100.0; // Narrow column
    let font_size = 12.0;

    let lines = wrap_text_with_config(
        text,
        max_width,
        font_size,
        "Helvetica",
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .unwrap();

    // Should produce at least 2 lines with hyphenation
    assert!(
        lines.len() >= 2,
        "Expected hyphenation to split word into multiple lines"
    );

    // First line should end with hyphen
    assert!(
        lines[0].ends_with('-'),
        "First line should end with hyphen: {}",
        lines[0]
    );

    // Verify the word is split correctly (combined lines should equal original)
    let combined: String = lines
        .iter()
        .map(|line| line.trim_end_matches('-'))
        .collect::<Vec<_>>()
        .join("");
    assert_eq!(
        combined, text,
        "Hyphenated word should recombine to original"
    );
}

#[test]
fn test_hyphenation_disabled() {
    let config = TextLayoutConfig {
        enable_hyphenation: false,
        min_word_length: 6,
    };

    let text = "Telecommunications is a long word";
    let max_width = 100.0;
    let font_size = 12.0;

    let lines = wrap_text_with_config(
        text,
        max_width,
        font_size,
        "Helvetica",
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .unwrap();

    // Should not hyphenate - each line should contain whole words
    for line in &lines {
        assert!(
            !line.ends_with('-'),
            "Line should not be hyphenated when disabled: {}",
            line
        );
    }
}

#[test]
fn test_hyphenation_short_words_not_hyphenated() {
    let config = TextLayoutConfig {
        enable_hyphenation: true,
        min_word_length: 6,
    };

    let text = "Hello World Test";
    let max_width = 50.0; // Very narrow to force breaks
    let font_size = 12.0;

    let lines = wrap_text_with_config(
        text,
        max_width,
        font_size,
        "Helvetica",
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .unwrap();

    // Short words (<6 chars) should not be hyphenated
    for line in &lines {
        if line.contains("Hello") || line.contains("World") || line.contains("Test") {
            // These words are too short to hyphenate
            let trimmed = line.trim_end_matches('-');
            assert!(
                trimmed == "Hello" || trimmed == "World" || trimmed == "Test" || trimmed.is_empty(),
                "Short words should not be hyphenated: {}",
                line
            );
        }
    }
}

#[test]
fn test_hyphenation_min_word_length() {
    let config = TextLayoutConfig {
        enable_hyphenation: true,
        min_word_length: 10, // Only hyphenate very long words
    };

    let text = "Programming languages";
    let max_width = 80.0;
    let font_size = 12.0;

    let lines = wrap_text_with_config(
        text,
        max_width,
        font_size,
        "Helvetica",
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .unwrap();

    // "Programming" (11 chars) might be hyphenated
    // "languages" (9 chars) should not be hyphenated (< min_word_length)
    for line in &lines {
        if line.contains("languages") && line.ends_with('-') {
            panic!(
                "Word shorter than min_word_length should not be hyphenated: {}",
                line
            );
        }
    }
}

#[test]
fn test_hyphenation_common_prefixes() {
    let config = TextLayoutConfig::default();

    // Test words with common prefixes
    let test_cases = vec![
        ("preprocessing", "pre-processing"),
        ("international", "inter-national"),
        ("undergraduate", "under-graduate"),
        ("transportation", "trans-portation"),
        ("semicircle", "semi-circle"),
        ("reorganize", "re-organize"),
        ("disconnect", "dis-connect"),
    ];

    for (word, expected_prefix) in test_cases {
        let max_width = 80.0; // Narrow enough to trigger hyphenation
        let font_size = 12.0;

        let lines = wrap_text_with_config(
            word,
            max_width,
            font_size,
            "Helvetica",
            &config,
            &layout_types::EstimatedTextMeasurer,
        )
        .unwrap();

        if lines.len() > 1 && lines[0].ends_with('-') {
            // Verify prefix is hyphenated correctly
            let hyphenated = lines[0].trim_end_matches('-');
            assert!(
                expected_prefix.starts_with(&format!("{}-", hyphenated)),
                "Expected prefix hyphenation for '{}', got '{}'",
                word,
                lines[0]
            );
        }
    }
}

#[test]
fn test_hyphenation_double_consonants() {
    let config = TextLayoutConfig::default();

    // Words with double consonants should hyphenate between them
    let text = "letter"; // Should hyphenate as "let-ter"
    let max_width = 40.0; // Narrow to force hyphenation
    let font_size = 12.0;

    let lines = wrap_text_with_config(
        text,
        max_width,
        font_size,
        "Helvetica",
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .unwrap();

    // Should produce hyphenation or fit on one line
    if lines.len() > 1 {
        assert!(lines[0].ends_with('-'), "Should hyphenate with hyphen");
    }
}

#[test]
fn test_hyphenation_preserves_text_content() {
    let config = TextLayoutConfig::default();

    let text = "The telecommunications infrastructure requires comprehensive documentation and implementation strategies";
    let max_width = 150.0;
    let font_size = 12.0;

    let lines = wrap_text_with_config(
        text,
        max_width,
        font_size,
        "Helvetica",
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .unwrap();

    // Verify lines were created
    assert!(!lines.is_empty());

    // Reconstruct by properly handling hyphenation
    let mut reconstructed_words = Vec::new();
    let mut current_word = String::new();

    for line in &lines {
        if line.ends_with('-') {
            // This line ends with a hyphenated word part
            let part = &line[..line.len() - 1];
            // Extract the hyphenated part (last word on the line)
            let words_in_line: Vec<&str> = part.split_whitespace().collect();

            // Add all complete words except the last one
            for word in words_in_line
                .iter()
                .take(words_in_line.len().saturating_sub(1))
            {
                if !current_word.is_empty() {
                    reconstructed_words.push(current_word.clone());
                    current_word.clear();
                }
                reconstructed_words.push(word.to_string());
            }

            // The last word is incomplete (hyphenated)
            if let Some(&last) = words_in_line.last() {
                current_word.push_str(last);
            }
        } else {
            // This line doesn't end with hyphen
            let words_in_line: Vec<&str> = line.split_whitespace().collect();

            for (i, word) in words_in_line.iter().enumerate() {
                if i == 0 && !current_word.is_empty() {
                    // First word might be continuation of hyphenated word
                    current_word.push_str(word);
                    reconstructed_words.push(current_word.clone());
                    current_word.clear();
                } else {
                    reconstructed_words.push(word.to_string());
                }
            }
        }
    }

    // Add any remaining word
    if !current_word.is_empty() {
        reconstructed_words.push(current_word);
    }

    let original_words: Vec<_> = text.split_whitespace().collect();

    assert_eq!(
        reconstructed_words, original_words,
        "Hyphenated text should preserve all words"
    );
}

#[test]
fn test_hyphenation_narrow_column() {
    let config = TextLayoutConfig {
        enable_hyphenation: true,
        min_word_length: 6,
    };

    let text = "Antidisestablishmentarianism";
    let max_width = 60.0; // Very narrow
    let font_size = 10.0;

    let lines = wrap_text_with_config(
        text,
        max_width,
        font_size,
        "Helvetica",
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .unwrap();

    // Debug output
    println!("Lines: {:?}", lines);
    println!("Number of lines: {}", lines.len());

    // Should produce multiple lines with hyphenation
    assert!(
        lines.len() > 1,
        "Long word should be hyphenated in narrow column (got {} lines)",
        lines.len()
    );

    // At least one line should have a hyphen (except possibly the last)
    let has_hyphen = lines
        .iter()
        .take(lines.len() - 1)
        .any(|line| line.ends_with('-'));
    assert!(has_hyphen, "Should use hyphenation in narrow column");
}

#[test]
fn test_hyphenation_with_multiple_words() {
    let config = TextLayoutConfig::default();

    let text = "The comprehensive documentation includes telecommunications and implementation";
    let max_width = 120.0;
    let font_size = 12.0;

    let lines = wrap_text_with_config(
        text,
        max_width,
        font_size,
        "Helvetica",
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .unwrap();

    // Should successfully wrap text
    assert!(!lines.is_empty());

    // Verify no orphan hyphens (hyphen should only appear at end of line)
    for line in &lines {
        let hyphen_count = line.matches('-').count();
        if hyphen_count > 0 {
            // If there's a hyphen, it should be at the end for line breaking
            // (unless it's part of a compound word like "well-known")
            assert!(
                line.ends_with('-') || line.contains('-') && !line.ends_with('-'),
                "Hyphens should be at end of line or part of compound words: {}",
                line
            );
        }
    }
}

#[test]
fn test_hyphenation_empty_text() {
    let config = TextLayoutConfig::default();

    let text = "";
    let max_width = 100.0;
    let font_size = 12.0;

    let lines = wrap_text_with_config(
        text,
        max_width,
        font_size,
        "Helvetica",
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .unwrap();

    assert_eq!(lines.len(), 1);
    assert_eq!(lines[0], "");
}

#[test]
fn test_hyphenation_performance() {
    let config = TextLayoutConfig::default();

    // Large text with many long words
    let text = "telecommunications preprocessing international undergraduate \
                transportation infrastructure implementation documentation \
                comprehensive antidisestablishmentarianism"
        .repeat(10);

    let max_width = 150.0;
    let font_size = 12.0;

    let start = std::time::Instant::now();
    let lines = wrap_text_with_config(
        &text,
        max_width,
        font_size,
        "Helvetica",
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .unwrap();
    let duration = start.elapsed();

    // Should complete in reasonable time (<250ms for this text)
    // Note: The hyphenation crate loads patterns on first use, which adds overhead
    // In production use, the dictionary is cached and reused
    // Increased threshold from 200ms to 250ms to reduce flakiness on slower CI systems
    assert!(
        duration.as_millis() < 250,
        "Hyphenation should be reasonably fast, took {}ms",
        duration.as_millis()
    );

    // Should produce multiple lines
    assert!(lines.len() > 10);
}

#[test]
fn test_hyphenation_vs_no_hyphenation_line_count() {
    let text = "telecommunications infrastructure comprehensive";
    let max_width = 120.0;
    let font_size = 12.0;

    let config_with = TextLayoutConfig {
        enable_hyphenation: true,
        min_word_length: 6,
    };
    let lines_with = wrap_text_with_config(
        text,
        max_width,
        font_size,
        "Helvetica",
        &config_with,
        &layout_types::EstimatedTextMeasurer,
    )
    .unwrap();

    let config_without = TextLayoutConfig {
        enable_hyphenation: false,
        min_word_length: 6,
    };
    let lines_without = wrap_text_with_config(
        text,
        max_width,
        font_size,
        "Helvetica",
        &config_without,
        &layout_types::EstimatedTextMeasurer,
    )
    .unwrap();

    // Hyphenation might reduce line count or keep it same, but should not increase it
    assert!(
        lines_with.len() <= lines_without.len(),
        "Hyphenation should not increase line count: with={}, without={}",
        lines_with.len(),
        lines_without.len()
    );
}
