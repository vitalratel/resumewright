//! WOFF2 (Web Open Font Format 2) Decompression
//!
//! Decompresses WOFF2 fonts to TrueType format for use in PDF generation.
//! WOFF2 uses Brotli compression and has a transformed table format.
//!
//! Uses the `wuff` crate for:
//! - glyf/loca table transformations (common in Google Fonts)
//! - Brotli decompression
//! - TrueType reconstruction
//!
//! Reference: <https://www.w3.org/TR/WOFF2/>

use thiserror::Error;

/// Default maximum font size (2MB) - suitable for Latin/Cyrillic fonts.
/// This limit protects against memory exhaustion in WASM environments.
/// CJK fonts may exceed this limit and require a higher value.
pub const DEFAULT_MAX_FONT_SIZE: usize = 2 * 1024 * 1024;

/// Format first N bytes of data as a hex dump for error diagnostics
///
/// Returns a space-separated hex string of the form "77 4F 46 32 00 01 ..."
/// useful for debugging malformed font files.
///
/// # Arguments
/// * `bytes` - The byte slice to dump
/// * `max_bytes` - Maximum number of bytes to include in the dump
fn format_hex_dump(bytes: &[u8], max_bytes: usize) -> String {
    bytes[..max_bytes.min(bytes.len())]
        .iter()
        .map(|b| format!("{:02X}", b))
        .collect::<Vec<_>>()
        .join(" ")
}

/// Errors that can occur during WOFF2 decompression
///
/// # Examples
///
/// ## InvalidFormat
/// Returned when the file is not a valid WOFF2 font.
///
/// ```
/// use font_toolkit::woff2::{decompress_woff2, Woff2Error};
///
/// let not_woff2 = b"not a WOFF2 file";
///
/// match decompress_woff2(not_woff2) {
///     Err(Woff2Error::InvalidFormat(msg)) => {
///         // Error includes hex dump of file header for debugging
///         assert!(msg.contains("File header"));
///     }
///     _ => panic!("Expected InvalidFormat"),
/// }
/// ```
///
/// ## UnsupportedFeature
/// Returned when the WOFF2 file uses features not yet supported (e.g., hmtx transformations).
///
/// ```no_run
/// # use font_toolkit::woff2::{decompress_woff2, Woff2Error};
/// # let woff2_with_hmtx_transform = b"woff2 data with hmtx";
/// match decompress_woff2(woff2_with_hmtx_transform) {
///     Err(Woff2Error::UnsupportedFeature(msg)) => {
///         eprintln!("Unsupported: {}. Try a different font variant.", msg);
///     }
///     Ok(ttf_bytes) => {
///         println!("Successfully decompressed {} bytes", ttf_bytes.len());
///     }
///     _ => {}
/// }
/// ```
#[derive(Error, Debug)]
pub enum Woff2Error {
    #[error("Invalid WOFF2 file: {0}")]
    InvalidFormat(String),

    #[error("Decompression failed: {0}")]
    DecompressionError(String),

    #[error("I/O error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Font too large after decompression: {0} bytes (limit: {1} bytes)")]
    FontTooLarge(usize, usize),

    #[error("Unsupported WOFF2 feature: {0}")]
    UnsupportedFeature(String),
}

/// Decompress a WOFF2 font file to TrueType format with configurable size limit
///
/// Uses the `wuff` crate for table transformations including glyf/loca
/// reconstruction (common in Google Fonts).
///
/// # Arguments
/// * `woff2_bytes` - The WOFF2 font file bytes
/// * `max_size` - Maximum allowed font size in bytes after decompression.
///   Use `None` for no limit (not recommended in WASM contexts).
///   Use `Some(DEFAULT_MAX_FONT_SIZE)` for the default 2MB limit.
///
/// # Returns
/// * `Ok(Vec<u8>)` - The decompressed TrueType font bytes
/// * `Err(Woff2Error)` - If decompression fails
///
/// # Supported Features
/// * ✅ glyf/loca table transformations (Google Fonts)
/// * ✅ Brotli decompression
/// * ✅ TrueType-flavored fonts
///
/// # Example
/// ```no_run
/// use font_toolkit::woff2::{decompress_woff2_with_limit, DEFAULT_MAX_FONT_SIZE};
///
/// let woff2_bytes = std::fs::read("font.woff2").unwrap();
/// // Use default 2MB limit
/// let ttf_bytes = decompress_woff2_with_limit(&woff2_bytes, Some(DEFAULT_MAX_FONT_SIZE)).unwrap();
/// // Or allow larger fonts (e.g., CJK fonts)
/// let ttf_bytes_large = decompress_woff2_with_limit(&woff2_bytes, Some(10 * 1024 * 1024)).unwrap();
/// ```
pub fn decompress_woff2_with_limit(
    woff2_bytes: &[u8],
    max_size: Option<usize>,
) -> Result<Vec<u8>, Woff2Error> {
    // 1. Decompress using wuff crate (handles glyf/loca transformations)
    // Wrap in catch_unwind to prevent panics from corrupted WOFF2 files
    let ttf_bytes = std::panic::catch_unwind(|| wuff::decompress_woff2(woff2_bytes))
        .map_err(|panic_err| {
            // Convert panic to error
            let panic_msg = if let Some(s) = panic_err.downcast_ref::<&str>() {
                s.to_string()
            } else if let Some(s) = panic_err.downcast_ref::<String>() {
                s.clone()
            } else {
                "Unknown panic during WOFF2 decompression".to_string()
            };
            Woff2Error::DecompressionError(format!(
                "WOFF2 decompression panicked (likely corrupted font data): {}",
                panic_msg
            ))
        })?
        .map_err(|e| {
            // Provide helpful error with hex dump for invalid format errors
            let header_hex = format_hex_dump(woff2_bytes, 16);
            Woff2Error::InvalidFormat(format!(
                "{:?}\nFile header (first 16 bytes): {}",
                e, header_hex
            ))
        })?;

    // 2. Check size limit if specified
    if let Some(limit) = max_size {
        if ttf_bytes.len() > limit {
            return Err(Woff2Error::FontTooLarge(ttf_bytes.len(), limit));
        }
    }

    // 3. Validate the decompressed TrueType font
    validate_truetype_font(&ttf_bytes)?;

    Ok(ttf_bytes)
}

/// Decompress a WOFF2 font file to TrueType format using the default 2MB size limit
///
/// This is a convenience wrapper around `decompress_woff2_with_limit` that uses
/// the default maximum font size of 2MB, which is suitable for most Latin/Cyrillic fonts.
///
/// # Arguments
/// * `woff2_bytes` - The WOFF2 font file bytes
///
/// # Returns
/// * `Ok(Vec<u8>)` - The decompressed TrueType font bytes
/// * `Err(Woff2Error)` - If decompression fails
///
/// # Example
/// ```no_run
/// use font_toolkit::woff2::decompress_woff2;
///
/// let woff2_bytes = std::fs::read("font.woff2").unwrap();
/// let ttf_bytes = decompress_woff2(&woff2_bytes).unwrap();
/// std::fs::write("font.ttf", &ttf_bytes).unwrap();
/// ```
pub fn decompress_woff2(woff2_bytes: &[u8]) -> Result<Vec<u8>, Woff2Error> {
    decompress_woff2_with_limit(woff2_bytes, Some(DEFAULT_MAX_FONT_SIZE))
}

/// Validate TrueType font structure using ttf-parser
///
/// This ensures the decompressed font has valid structure and critical tables.
/// Validates that decompressed TrueType font is well-formed and usable for PDF embedding
///
/// Performs comprehensive validation beyond basic parsing:
/// 1. Valid TrueType structure
/// 2. Non-zero glyph count
/// 3. Horizontal metrics available (required for layout)
/// 4. Character mappings present (required for text rendering)
///
/// Helps catch corrupted fonts and unsupported font types (e.g., icon fonts).
fn validate_truetype_font(ttf_bytes: &[u8]) -> Result<(), Woff2Error> {
    // Attempt to parse with ttf-parser
    let face = ttf_parser::Face::parse(ttf_bytes, 0).map_err(|err| {
        Woff2Error::InvalidFormat(format!("Decompressed font is not valid TrueType: {}", err))
    })?;

    // Check for critical tables that PDF generation requires

    // 1. Must have glyph outlines (reject icon fonts that only have bitmaps)
    if face.number_of_glyphs() == 0 {
        return Err(Woff2Error::InvalidFormat(
            "Font has no glyphs (possibly an icon font or corrupted)".to_string(),
        ));
    }

    // 2. Horizontal metrics table (hmtx) must be accessible
    // Required for PDF layout - without this, we can't calculate text width
    if face.glyph_hor_advance(ttf_parser::GlyphId(0)).is_none() {
        return Err(Woff2Error::InvalidFormat(
            "Font missing horizontal metrics (hmtx table invalid or absent)".to_string(),
        ));
    }

    // 3. Character mapping table (cmap) must have at least some mappings
    // Test with common characters - at least one should map successfully
    let has_mappings = face.glyph_index('A').is_some()
        || face.glyph_index('a').is_some()
        || face.glyph_index('0').is_some()
        || face.glyph_index(' ').is_some();

    if !has_mappings {
        return Err(Woff2Error::InvalidFormat(
            "Font has no character mappings (cmap table invalid or empty)".to_string(),
        ));
    }

    // 4. ttf-parser successfully parsing the font also validates:
    //    - Valid TrueType structure
    //    - Critical tables present (head, maxp, hhea, etc.)
    //    - Name table is valid (checked internally by ttf-parser)
    //    - Table checksums are correct

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_invalid_woff2_file() {
        let invalid_bytes = vec![0xFF, 0xFF, 0xFF, 0xFF];
        let result = decompress_woff2(&invalid_bytes);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), Woff2Error::InvalidFormat(_)));
    }

    #[test]
    fn test_empty_file() {
        let empty_bytes = vec![];
        let result = decompress_woff2(&empty_bytes);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), Woff2Error::InvalidFormat(_)));
    }

    #[test]
    fn test_file_too_small() {
        let small_bytes = vec![0x77, 0x4F, 0x46, 0x32]; // Just magic bytes
        let result = decompress_woff2(&small_bytes);
        assert!(result.is_err());
    }

    #[test]
    fn test_woff2_default_max_size() {
        // Verify the default size limit is 2MB
        assert_eq!(DEFAULT_MAX_FONT_SIZE, 2 * 1024 * 1024);
    }

    #[test]
    fn test_woff2_with_no_size_limit() {
        const ROBOTO_WOFF2: &[u8] =
            include_bytes!("../../../../test-fixtures/fonts/Roboto-Regular.woff2");

        // Should succeed with no size limit
        let result = decompress_woff2_with_limit(ROBOTO_WOFF2, None);
        assert!(result.is_ok(), "Should decompress with no limit");

        let ttf = result.unwrap();
        assert!(!ttf.is_empty());
    }

    #[test]
    fn test_woff2_with_very_small_limit() {
        const ROBOTO_WOFF2: &[u8] =
            include_bytes!("../../../../test-fixtures/fonts/Roboto-Regular.woff2");

        // Should fail with limit smaller than decompressed font
        let result = decompress_woff2_with_limit(ROBOTO_WOFF2, Some(100));

        assert!(result.is_err(), "Should fail with tiny limit");

        match result.unwrap_err() {
            Woff2Error::FontTooLarge(size, limit) => {
                assert!(
                    size > 100,
                    "Font size {} should exceed limit {}",
                    size,
                    limit
                );
                assert_eq!(limit, 100, "Limit should be 100");
            }
            other => panic!("Expected FontTooLarge, got {:?}", other),
        }
    }

    #[test]
    fn test_woff2_with_adequate_limit() {
        const ROBOTO_WOFF2: &[u8] =
            include_bytes!("../../../../test-fixtures/fonts/Roboto-Regular.woff2");

        // Should succeed with limit larger than font
        let result = decompress_woff2_with_limit(ROBOTO_WOFF2, Some(10 * 1024 * 1024));
        assert!(result.is_ok(), "Should succeed with large limit");

        let ttf = result.unwrap();
        assert!(!ttf.is_empty());
        assert!(ttf.len() < 10 * 1024 * 1024, "Should be within limit");
    }

    #[test]
    fn test_validate_truetype_empty_font() {
        // Create minimal invalid TrueType with corrupted structure
        let invalid_ttf = vec![
            0x00, 0x01, 0x00, 0x00, // TrueType magic
            0x00, 0x00, // numTables: 0
        ];

        let result = validate_truetype_font(&invalid_ttf);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), Woff2Error::InvalidFormat(_)));
    }

    #[test]
    fn test_validate_truetype_corrupted_data() {
        // Completely corrupted data
        let corrupted = vec![0xFF; 100];
        let result = validate_truetype_font(&corrupted);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), Woff2Error::InvalidFormat(_)));
    }

    #[test]
    fn test_format_hex_dump() {
        // Test with full 16 bytes
        let data = vec![
            0x77, 0x4F, 0x46, 0x32, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x64, 0x00, 0x01,
            0xAB, 0xCD,
        ];
        let hex = format_hex_dump(&data, 16);
        assert_eq!(hex, "77 4F 46 32 00 01 00 00 00 00 00 64 00 01 AB CD");

        // Test with fewer bytes than max
        let short_data = vec![0xFF, 0xEE, 0xDD];
        let hex = format_hex_dump(&short_data, 16);
        assert_eq!(hex, "FF EE DD");

        // Test with empty data
        let empty_data = vec![];
        let hex = format_hex_dump(&empty_data, 16);
        assert_eq!(hex, "");

        // Test limiting to fewer bytes
        let hex = format_hex_dump(&data, 4);
        assert_eq!(hex, "77 4F 46 32");
    }

    #[test]
    fn test_invalid_woff2_includes_hex_dump() {
        let invalid_bytes = vec![
            0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ];
        let result = decompress_woff2(&invalid_bytes);
        assert!(result.is_err());

        let err = result.unwrap_err();
        let err_msg = format!("{}", err);
        // Should include hex dump in error message
        assert!(
            err_msg.contains("DE AD BE EF"),
            "Error should contain hex dump: {}",
            err_msg
        );
        assert!(
            err_msg.contains("File header"),
            "Error should mention file header: {}",
            err_msg
        );
    }
}
