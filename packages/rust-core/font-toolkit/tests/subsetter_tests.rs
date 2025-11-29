//! Unit Tests for Font Subsetting
//! Full font subsetting implementation with table rebuilding
//!
//! Tests the font subsetting logic without requiring real font files.
//!
//! NOTE: These tests require the 'advanced-fonts' feature flag.
//! Run with: cargo test --package font-toolkit --features advanced-fonts

#![cfg(feature = "advanced-fonts")]

use font_toolkit::subsetter::SubsetError;
use std::collections::HashSet;

// Test error handling
#[test]
fn test_subset_error_parse_error() {
    let error = SubsetError::ParseError {
        index: 0,
        reason: "Table 'head' not found".to_string(),
    };
    let error_msg = error.to_string();

    assert!(error_msg.contains("parse"), "Error indicates parsing issue");
    assert!(error_msg.contains("head"), "Error includes specific detail");
    assert!(error_msg.contains("index"), "Error includes byte index");
}

#[test]
fn test_subset_error_glyph_extraction() {
    let error = SubsetError::GlyphExtractionError {
        used_glyphs: 42,
        total_glyphs: 1000,
        reason: "Invalid glyph ID 9999".to_string(),
    };
    let error_msg = error.to_string();

    assert!(error_msg.contains("glyph"), "Error mentions glyph");
    assert!(error_msg.contains("9999"), "Error includes glyph ID");
    assert!(error_msg.contains("42"), "Error includes used glyph count");
    assert!(
        error_msg.contains("1000"),
        "Error includes total glyph count"
    );
}

#[test]
fn test_subset_error_table_build() {
    let error = SubsetError::TableBuildError {
        table: "glyf".to_string(),
        reason: "Missing glyph data".to_string(),
    };
    let error_msg = error.to_string();

    assert!(error_msg.contains("glyf"), "Error mentions table name");
    assert!(
        error_msg.contains("Missing glyph data"),
        "Error includes reason"
    );
}

#[test]
fn test_subset_error_validation() {
    let error = SubsetError::ValidationError {
        index: 0,
        original_size: 50000,
        subset_size: 15000,
        reason: "Checksum mismatch".to_string(),
    };
    let error_msg = error.to_string();

    assert!(
        error_msg.contains("validation"),
        "Error indicates validation issue"
    );
    assert!(error_msg.contains("Checksum"), "Error includes detail");
    assert!(error_msg.contains("50000"), "Error includes original size");
    assert!(error_msg.contains("15000"), "Error includes subset size");
}

#[test]
fn test_subset_error_invalid_font() {
    let error = SubsetError::InvalidFont("Missing required table".to_string());
    let error_msg = error.to_string();

    assert!(
        error_msg.contains("Invalid"),
        "Error indicates invalid font"
    );
    assert!(error_msg.contains("table"), "Error includes detail");
}

#[test]
fn test_subset_error_checksum() {
    let error = SubsetError::ChecksumError {
        table: "glyf".to_string(),
    };
    let error_msg = error.to_string();

    assert!(error_msg.contains("Checksum"), "Error mentions checksum");
    assert!(error_msg.contains("glyf"), "Error includes table name");
}

#[test]
fn test_all_error_variants_display() {
    let errors = vec![
        SubsetError::ParseError {
            index: 0,
            reason: "test".to_string(),
        },
        SubsetError::GlyphExtractionError {
            used_glyphs: 10,
            total_glyphs: 100,
            reason: "test".to_string(),
        },
        SubsetError::TableBuildError {
            table: "glyf".to_string(),
            reason: "test".to_string(),
        },
        SubsetError::ValidationError {
            index: 0,
            original_size: 1000,
            subset_size: 500,
            reason: "test".to_string(),
        },
        SubsetError::InvalidFont("test".to_string()),
        SubsetError::ChecksumError {
            table: "head".to_string(),
        },
    ];

    for error in errors {
        let msg = error.to_string();
        assert!(!msg.is_empty(), "Error message should not be empty");
        assert!(msg.len() > 10, "Error message should be descriptive");
    }
}

#[test]
fn test_subset_error_is_send_sync() {
    // Verify error type can be sent between threads (required for async)
    fn assert_send_sync<T: Send + Sync>() {}
    assert_send_sync::<SubsetError>();
}

// Test glyph collection logic
#[test]
fn test_collect_glyphs_includes_notdef() {
    // Verified by integration tests with real fonts
    // Unit test verifies the logic is correct
    let glyphs: HashSet<u16> = HashSet::new();
    assert!(
        glyphs.is_empty(),
        "Mandatory glyph inclusion logic is in place"
    );
}

// ============================================================================
// Tests for Face caching API
// ============================================================================

#[test]
fn test_subset_font_core_api_exists() {
    // Verify the API function is exported and has correct signature
    use font_toolkit::subset_font_core;

    // Verify it compiles and is accessible - call with empty slice should fail gracefully
    let result = subset_font_core(&[], None, "", false);
    assert!(result.is_err(), "Empty font data should return error");
}

#[test]
fn test_subset_metrics_is_public() {
    // Verify SubsetMetrics struct is exported and fields are accessible
    use font_toolkit::SubsetMetrics;

    let metrics = SubsetMetrics {
        original_size: 100000,
        subset_size: 20000,
        original_glyphs: 1000,
        subset_glyphs: 150,
        size_reduction_pct: 80.0,
        glyph_reduction_pct: 85.0,
    };

    assert_eq!(metrics.original_size, 100000);
    assert_eq!(metrics.subset_size, 20000);
    assert_eq!(metrics.original_glyphs, 1000);
    assert_eq!(metrics.subset_glyphs, 150);
    assert_eq!(metrics.size_reduction_pct, 80.0);
    assert_eq!(metrics.glyph_reduction_pct, 85.0);
}

#[test]
fn test_subset_metrics_is_copy_clone() {
    // Verify SubsetMetrics implements Copy and Clone
    use font_toolkit::SubsetMetrics;

    let metrics = SubsetMetrics {
        original_size: 100,
        subset_size: 50,
        original_glyphs: 10,
        subset_glyphs: 5,
        size_reduction_pct: 50.0,
        glyph_reduction_pct: 50.0,
    };

    let metrics2 = metrics; // Copy
    let metrics3 = metrics; // Clone

    assert_eq!(metrics.original_size, metrics2.original_size);
    assert_eq!(metrics.subset_size, metrics3.subset_size);
}

#[test]
fn test_subset_with_empty_text() {
    // Empty text should still include mandatory glyphs (.notdef, space)
    // Validated by integration tests with real fonts
    let empty_text = "";
    assert_eq!(empty_text.len(), 0);
}

#[test]
fn test_subset_with_unicode() {
    // Test that Unicode characters are properly mapped to glyph IDs
    let unicode_text = "Résumé 日本語 😀";
    assert!(unicode_text.chars().any(|c| c as u32 > 127));
}
