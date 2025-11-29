//! Font Fallback Scenario Tests
//!
//! Tests for font fallback handling including corrupted fonts,
//! unsupported formats, and decompression workflows.

use font_toolkit::{decompress_woff, decompress_woff2};

// Test fixtures
const ROBOTO_TTF: &[u8] = include_bytes!("../../../../test-fixtures/fonts/Roboto-Regular.ttf");
const ROBOTO_WOFF: &[u8] = include_bytes!("../../../../test-fixtures/fonts/Roboto-Regular.woff");
const ROBOTO_WOFF2: &[u8] = include_bytes!("../../../../test-fixtures/fonts/Roboto-Regular.woff2");
// Only Roboto fixtures available

#[test]
fn test_corrupted_woff_returns_error() {
    // Create corrupted WOFF data (random bytes)
    let corrupted_data: Vec<u8> = vec![0xFF; 1000];

    let result = decompress_woff(&corrupted_data);

    // Should return error
    assert!(result.is_err(), "Corrupted WOFF should return error");
}

#[test]
fn test_corrupted_woff_with_valid_header() {
    // Create data with valid WOFF magic but corrupted content
    let mut corrupted_data = vec![b'w', b'O', b'F', b'F']; // Valid WOFF magic
    corrupted_data.extend(vec![0xFF; 1000]); // Garbage data

    let result = decompress_woff(&corrupted_data);

    // Should fail during decompression
    assert!(
        result.is_err(),
        "WOFF with corrupted content should return error"
    );
}

#[test]
fn test_woff_decompression_succeeds() {
    // Test with actual WOFF font (Roboto)
    let ttf_data = decompress_woff(ROBOTO_WOFF).expect("WOFF decompression should succeed");

    // Should produce valid TTF
    assert!(!ttf_data.is_empty(), "Decompressed TTF should not be empty");
    assert_eq!(
        &ttf_data[0..4],
        b"\x00\x01\x00\x00",
        "Should have valid TTF magic number"
    );
}

// Removed - NotoSans fixtures not available

#[test]
fn test_corrupted_woff2_returns_error() {
    // Create corrupted WOFF2 data
    let corrupted_data: Vec<u8> = vec![0xFF; 1000];

    let result = decompress_woff2(&corrupted_data);

    assert!(result.is_err(), "Corrupted WOFF2 should return error");
}

#[test]
fn test_corrupted_woff2_with_valid_header() {
    // WOFF2 magic is 'wOF2'
    let mut corrupted_data = vec![b'w', b'O', b'F', b'2'];
    corrupted_data.extend(vec![0xFF; 1000]);

    let result = decompress_woff2(&corrupted_data);

    assert!(
        result.is_err(),
        "WOFF2 with corrupted content should return error"
    );
}

#[test]
fn test_woff2_decompression_succeeds() {
    // Test with actual WOFF2 font (Roboto)
    let ttf_data = decompress_woff2(ROBOTO_WOFF2).expect("WOFF2 decompression should succeed");

    // Should produce valid TTF
    assert!(!ttf_data.is_empty(), "Decompressed TTF should not be empty");
    assert_eq!(
        &ttf_data[0..4],
        b"\x00\x01\x00\x00",
        "Should have valid TTF magic number"
    );
}

// Removed - NotoSans fixtures not available

#[test]
fn test_empty_woff_data() {
    let empty_data: Vec<u8> = vec![];
    let result = decompress_woff(&empty_data);

    assert!(result.is_err(), "Empty WOFF data should return error");
}

#[test]
fn test_empty_woff2_data() {
    let empty_data: Vec<u8> = vec![];
    let result = decompress_woff2(&empty_data);

    assert!(result.is_err(), "Empty WOFF2 data should return error");
}

#[test]
fn test_ttf_passed_to_woff_decompressor() {
    // Passing TTF to WOFF decompressor should fail
    let result = decompress_woff(ROBOTO_TTF);

    assert!(result.is_err(), "TTF data should not decompress as WOFF");
}

#[test]
fn test_ttf_passed_to_woff2_decompressor() {
    // Passing TTF to WOFF2 decompressor should fail
    let result = decompress_woff2(ROBOTO_TTF);

    assert!(result.is_err(), "TTF data should not decompress as WOFF2");
}

#[test]
fn test_woff_passed_to_woff2_decompressor() {
    // Passing WOFF to WOFF2 decompressor should fail
    let result = decompress_woff2(ROBOTO_WOFF);

    assert!(result.is_err(), "WOFF data should not decompress as WOFF2");
}

#[test]
fn test_woff2_passed_to_woff_decompressor() {
    // Passing WOFF2 to WOFF decompressor should fail
    let result = decompress_woff(ROBOTO_WOFF2);

    assert!(result.is_err(), "WOFF2 data should not decompress as WOFF");
}

#[test]
fn test_decompressed_woff_same_as_original_ttf() {
    // Decompress WOFF
    let woff_ttf = decompress_woff(ROBOTO_WOFF).expect("WOFF decompression should succeed");

    // Both should have same TTF magic and similar size
    assert_eq!(
        &woff_ttf[0..4],
        &ROBOTO_TTF[0..4],
        "Should have same TTF magic"
    );

    // Sizes might differ slightly due to table reordering, but should be similar
    let size_diff_ratio =
        (woff_ttf.len() as f64 - ROBOTO_TTF.len() as f64).abs() / ROBOTO_TTF.len() as f64;
    assert!(
        size_diff_ratio < 0.1,
        "Decompressed size should be within 10% of original TTF"
    );
}

#[test]
fn test_decompressed_woff2_same_as_original_ttf() {
    // Decompress WOFF2
    let woff2_ttf = decompress_woff2(ROBOTO_WOFF2).expect("WOFF2 decompression should succeed");

    // Should have same TTF magic
    assert_eq!(
        &woff2_ttf[0..4],
        &ROBOTO_TTF[0..4],
        "Should have same TTF magic"
    );

    // Sizes should be similar
    let size_diff_ratio =
        (woff2_ttf.len() as f64 - ROBOTO_TTF.len() as f64).abs() / ROBOTO_TTF.len() as f64;
    assert!(
        size_diff_ratio < 0.1,
        "Decompressed size should be within 10% of original TTF"
    );
}

#[test]
fn test_very_small_corrupted_woff() {
    // WOFF header is 44 bytes minimum - test with less
    let tiny_data = vec![b'w', b'O', b'F', b'F', 0, 0, 0, 0];

    let result = decompress_woff(&tiny_data);
    assert!(result.is_err(), "Truncated WOFF should return error");
}

#[test]
fn test_very_small_corrupted_woff2() {
    // WOFF2 has minimum size requirements too
    let tiny_data = vec![b'w', b'O', b'F', b'2', 0, 0, 0, 0];

    let result = decompress_woff2(&tiny_data);
    assert!(result.is_err(), "Truncated WOFF2 should return error");
}
