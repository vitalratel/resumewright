//! Integration tests for WOFF2 decompression with real fonts
//!
//! These tests use actual Google Fonts to verify that transformed
//! table support (glyf/loca reconstruction) works correctly.

use font_toolkit::woff2::{decompress_woff2, decompress_woff2_with_limit, DEFAULT_MAX_FONT_SIZE};

/// Test data: Roboto Regular from Google Fonts
/// This font uses glyf/loca transformations
const ROBOTO_WOFF2: &[u8] = include_bytes!("../../../../test-fixtures/fonts/Roboto-Regular.woff2");

#[test]
fn test_decompress_roboto_transformed_woff2() {
    // This font has glyf/loca transformations (common in Google Fonts)
    let result = decompress_woff2(ROBOTO_WOFF2);

    assert!(result.is_ok(), "Should decompress transformed WOFF2 font");

    let ttf_bytes = result.unwrap();
    assert!(
        !ttf_bytes.is_empty(),
        "Decompressed font should not be empty"
    );
    assert!(
        ttf_bytes.len() < DEFAULT_MAX_FONT_SIZE,
        "Should be within default size limit"
    );

    // Verify it's a valid TrueType font by parsing
    let face = ttf_parser::Face::parse(&ttf_bytes, 0);
    assert!(face.is_ok(), "Decompressed font should be valid TrueType");

    let face = face.unwrap();
    assert!(face.number_of_glyphs() > 0, "Font should have glyphs");

    // Roboto should have Latin character support
    assert!(
        face.number_of_glyphs() > 200,
        "Roboto should have many glyphs"
    );
}

#[test]
fn test_decompress_roboto_with_size_limit() {
    // Test with default 2MB limit
    let result = decompress_woff2_with_limit(ROBOTO_WOFF2, Some(DEFAULT_MAX_FONT_SIZE));
    assert!(result.is_ok(), "Should succeed with default limit");

    // Test with tight limit (should fail)
    let result = decompress_woff2_with_limit(ROBOTO_WOFF2, Some(10_000));
    assert!(result.is_err(), "Should fail with too small limit");

    // Test with no limit
    let result = decompress_woff2_with_limit(ROBOTO_WOFF2, None);
    assert!(result.is_ok(), "Should succeed with no limit");
}

#[test]
fn test_roboto_font_metadata() {
    let ttf_bytes = decompress_woff2(ROBOTO_WOFF2).expect("Should decompress");
    let face = ttf_parser::Face::parse(&ttf_bytes, 0).expect("Should parse");

    // Verify basic font properties
    assert!(
        face.is_regular(),
        "Roboto Regular should be marked as regular weight"
    );
    assert!(!face.is_italic(), "Roboto Regular should not be italic");
    assert!(!face.is_bold(), "Roboto Regular should not be bold");

    // Check that font has required tables for PDF embedding
    assert!(face.ascender() != 0, "Should have ascender metric");
    assert!(face.descender() != 0, "Should have descender metric");
    assert!(face.units_per_em() > 0, "Should have valid units per em");
}

#[test]
fn test_roboto_glyph_access() {
    let ttf_bytes = decompress_woff2(ROBOTO_WOFF2).expect("Should decompress");
    let face = ttf_parser::Face::parse(&ttf_bytes, 0).expect("Should parse");

    // Test glyph access (verifies glyf/loca tables were properly reconstructed)
    let glyph_id = face.glyph_index('A').expect("Should have glyph for 'A'");
    assert!(glyph_id.0 > 0, "Glyph ID should be non-zero");

    // Test bounding box access (requires valid glyf table)
    let bbox = face.glyph_bounding_box(glyph_id);
    assert!(bbox.is_some(), "Should have bounding box for glyph");

    let bbox = bbox.unwrap();
    assert!(bbox.width() > 0, "Glyph should have non-zero width");
    assert!(bbox.height() > 0, "Glyph should have non-zero height");
}

#[test]
fn test_roboto_character_mapping() {
    // Verify character-to-glyph mapping works (requires valid cmap table)
    let ttf_bytes = decompress_woff2(ROBOTO_WOFF2).expect("Should decompress");
    let face = ttf_parser::Face::parse(&ttf_bytes, 0).expect("Should parse");

    // Test common ASCII characters
    let test_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let mut found_glyphs = 0;

    for c in test_chars.chars() {
        if face.glyph_index(c).is_some() {
            found_glyphs += 1;
        }
    }

    // Should find all ASCII alphanumeric characters
    assert_eq!(
        found_glyphs,
        test_chars.len(),
        "Should have glyphs for all ASCII alphanumeric characters"
    );
}
