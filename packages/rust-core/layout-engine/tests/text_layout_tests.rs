//! Text layout and wrapping tests
//!
//! Tests for text wrapping algorithms, line breaking, and text box layout.

use layout_engine::{wrap_text_with_config, TextLayoutConfig};

// ============================================================================
// Text Wrapping Tests (Non-Hyphenation)
// ============================================================================

#[test]
fn test_wrap_text_single_line() {
    let config = TextLayoutConfig {
        enable_hyphenation: false,
        min_word_length: 6,
    };

    let text = "Hello";
    let max_width = 100.0;
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
    assert_eq!(lines.len(), 1);
    assert_eq!(lines[0], "Hello");
}

#[test]
fn test_wrap_text_multiple_lines() {
    let config = TextLayoutConfig {
        enable_hyphenation: false,
        min_word_length: 6,
    };

    let text = "This is a long line of text that should wrap to multiple lines";
    let max_width = 100.0;
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
    assert!(lines.len() > 1);
}

#[test]
fn test_wrap_text_empty() {
    let config = TextLayoutConfig {
        enable_hyphenation: false,
        min_word_length: 6,
    };

    let text = "";
    let max_width = 100.0;
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
    assert_eq!(lines.len(), 1);
    assert_eq!(lines[0], "");
}

#[test]
fn test_wrap_text_with_long_word() {
    let config = TextLayoutConfig {
        enable_hyphenation: false,
        min_word_length: 6,
    };

    let text = "Supercalifragilisticexpialidocious";
    let max_width = 100.0;
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
    // Without hyphenation, long word stays on one line
    assert_eq!(lines.len(), 1);
    assert_eq!(lines[0], text);
}

// ============================================================================
// Text Layout Box Tests
// ============================================================================

#[test]
fn test_layout_text_node() {
    // This test would require exposing layout_text function
    // For now, covered by integration tests through calculate_layout
    // TODO: Consider exposing text_layout module functions
}

#[test]
fn test_layout_multiple_text_nodes() {
    // This test would require exposing layout_text function
    // TODO: Expose text_layout module or test through integration
}

// ============================================================================
// Container Layout Tests
// ============================================================================

#[test]
fn test_layout_container_vertical_stacking() {
    // This test would require exposing layout_container function
    // TODO: Expose element_layout module or test through integration
}

#[test]
fn test_layout_box_positioning() {
    // This test would require exposing layout_element function
    // TODO: Expose element_layout module or test through integration
}

// NOTE: Many text layout tests require access to internal functions
// that are not currently part of the public API. These are tested
// through integration tests in integration_tests.rs and layout_tests.rs.
// Consider exposing text_layout module if more granular unit testing is needed.
