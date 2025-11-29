//! Font Decompression WASM Bridge
//! WASM bindings for WOFF/WOFF2 decompression

use font_toolkit::woff::{decompress_woff, WoffError};
use font_toolkit::woff2::{decompress_woff2, Woff2Error};
use wasm_bindgen::prelude::*;

/// Result type for font decompression operations
#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct FontDecompressionResult {
    success: bool,
    error_message: Option<String>,
}

#[wasm_bindgen]
impl FontDecompressionResult {
    #[wasm_bindgen(getter)]
    pub fn success(&self) -> bool {
        self.success
    }

    #[wasm_bindgen(getter)]
    pub fn error_message(&self) -> Option<String> {
        self.error_message.clone()
    }
}

/// Decompress WOFF font to TrueType format
///
/// # Arguments
/// * `woff_bytes` - WOFF font file bytes
///
/// # Returns
/// * TrueType font bytes if successful
/// * Error message if decompression fails
///
/// # JavaScript Example
/// ```javascript
/// import { decompress_woff_font } from 'wasm-bridge';
///
/// const woffBytes = new Uint8Array([...]); // WOFF file
/// try {
///   const ttfBytes = decompress_woff_font(woffBytes);
///   console.log('Decompressed:', ttfBytes.length, 'bytes');
/// } catch (error) {
///   console.error('Decompression failed:', error);
/// }
/// ```
#[wasm_bindgen]
pub fn decompress_woff_font(woff_bytes: &[u8]) -> Result<Vec<u8>, JsValue> {
    decompress_woff(woff_bytes).map_err(|e| {
        let error_msg = match e {
            WoffError::InvalidFormat(msg) => format!("INVALID_WOFF_MAGIC: {}", msg),
            WoffError::DecompressionError(msg) => format!("WOFF_DECOMPRESS_FAILED: {}", msg),
            WoffError::FontTooLarge(size) => format!("FONT_TOO_LARGE_DECOMPRESSED: {} bytes", size),
            WoffError::IoError(err) => format!("IO_ERROR: {}", err),
        };
        JsValue::from_str(&error_msg)
    })
}

/// Decompress WOFF2 font to TrueType format
///
/// # Arguments
/// * `woff2_bytes` - WOFF2 font file bytes
///
/// # Returns
/// * TrueType font bytes if successful
/// * Error message if decompression fails
///
/// # Limitations
/// * Transformed tables (variable fonts) not supported
/// * Only TrueType-flavored WOFF2 supported (not CFF)
///
/// # JavaScript Example
/// ```javascript
/// import { decompress_woff2_font } from 'wasm-bridge';
///
/// const woff2Bytes = new Uint8Array([...]); // WOFF2 file
/// try {
///   const ttfBytes = decompress_woff2_font(woff2Bytes);
///   console.log('Decompressed:', ttfBytes.length, 'bytes');
/// } catch (error) {
///   console.error('Decompression failed:', error);
/// }
/// ```
#[wasm_bindgen]
pub fn decompress_woff2_font(woff2_bytes: &[u8]) -> Result<Vec<u8>, JsValue> {
    decompress_woff2(woff2_bytes).map_err(|e| {
        let error_msg = match e {
            Woff2Error::InvalidFormat(msg) => format!("INVALID_WOFF2_MAGIC: {}", msg),
            Woff2Error::DecompressionError(msg) => format!("WOFF2_DECOMPRESS_FAILED: {}", msg),
            Woff2Error::FontTooLarge(size, _max) => {
                format!("FONT_TOO_LARGE_DECOMPRESSED: {} bytes", size)
            }
            Woff2Error::UnsupportedFeature(msg) => format!("UNSUPPORTED_FEATURE: {}", msg),
            Woff2Error::IoError(err) => format!("IO_ERROR: {}", err),
        };
        JsValue::from_str(&error_msg)
    })
}

/// Validate font format without decompression
///
/// Returns the detected format: "ttf", "woff", "woff2", or null if invalid
///
/// # JavaScript Example
/// ```javascript
/// import { detect_font_format } from 'wasm-bridge';
///
/// const bytes = new Uint8Array([0x77, 0x4F, 0x46, 0x46]);
/// const format = detect_font_format(bytes);
/// console.log('Format:', format); // "woff"
/// ```
#[wasm_bindgen]
pub fn detect_font_format(bytes: &[u8]) -> Option<String> {
    if bytes.len() < 4 {
        return None;
    }

    let magic = u32::from_be_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]);

    match magic {
        0x774F4646 => Some("woff".to_string()),  // "wOFF"
        0x774F4632 => Some("woff2".to_string()), // "wOF2"
        0x00010000 => Some("ttf".to_string()),   // TrueType 1.0
        0x74727565 => Some("ttf".to_string()),   // 'true' (macOS)
        0x4F54544F => Some("otf".to_string()),   // 'OTTO' (OpenType CFF)
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_font_format() {
        // WOFF
        let woff_bytes = [0x77, 0x4F, 0x46, 0x46];
        assert_eq!(detect_font_format(&woff_bytes), Some("woff".to_string()));

        // WOFF2
        let woff2_bytes = [0x77, 0x4F, 0x46, 0x32];
        assert_eq!(detect_font_format(&woff2_bytes), Some("woff2".to_string()));

        // TrueType
        let ttf_bytes = [0x00, 0x01, 0x00, 0x00];
        assert_eq!(detect_font_format(&ttf_bytes), Some("ttf".to_string()));

        // Invalid
        let invalid_bytes = [0xFF, 0xFF, 0xFF, 0xFF];
        assert_eq!(detect_font_format(&invalid_bytes), None);
    }

    /// Edge case tests for font format detection

    #[test]
    fn test_detect_font_format_truncated_file() {
        // Less than 4 bytes
        assert_eq!(detect_font_format(&[0x77, 0x4F]), None);
        assert_eq!(detect_font_format(&[0x77]), None);
        assert_eq!(detect_font_format(&[]), None);
    }

    #[test]
    fn test_detect_font_format_opentype_cff() {
        // OpenType with CFF outlines (0x4F54544F = "OTTO")
        let otf_bytes = [0x4F, 0x54, 0x54, 0x4F];
        assert_eq!(detect_font_format(&otf_bytes), Some("otf".to_string()));
    }

    #[test]
    fn test_detect_font_format_macos_truetype() {
        // macOS TrueType variant (0x74727565 = 'true')
        let mac_ttf = [0x74, 0x72, 0x75, 0x65];
        assert_eq!(detect_font_format(&mac_ttf), Some("ttf".to_string()));
    }

    #[test]
    fn test_detect_font_format_random_bytes() {
        // Various invalid magic numbers
        assert_eq!(detect_font_format(&[0x00, 0x00, 0x00, 0x00]), None);
        assert_eq!(detect_font_format(&[0xDE, 0xAD, 0xBE, 0xEF]), None);
        assert_eq!(detect_font_format(&[0xCA, 0xFE, 0xBA, 0xBE]), None);
    }

    #[test]
    fn test_detect_font_format_longer_file() {
        // Should only check first 4 bytes
        let long_woff = [0x77, 0x4F, 0x46, 0x46, 0xFF, 0xFF, 0xFF, 0xFF];
        assert_eq!(detect_font_format(&long_woff), Some("woff".to_string()));
    }

    #[test]
    fn test_detect_font_format_case_sensitive() {
        // Magic numbers are case-sensitive binary values
        // 0x574F4646 would be "WOFF" (uppercase W), which is invalid
        let wrong_case = [0x57, 0x4F, 0x46, 0x46];
        assert_eq!(detect_font_format(&wrong_case), None);
    }

    #[test]
    fn test_detect_font_format_ttc_collection() {
        // TrueType Collection format (0x74746366 = 'ttcf')
        // Note: We don't currently support TTC, so this should return None
        let ttc_bytes = [0x74, 0x74, 0x63, 0x66];
        assert_eq!(detect_font_format(&ttc_bytes), None);
    }

    //
    // Error Path Tests (P1-COV-FONT_BRIDGE-001)
    //
    // Note: WOFF/WOFF2 decompression tests require WASM environment
    // Error path coverage is tested in tests/google_fonts_error_tests.rs
    // which exercises the font loading error paths in integration tests

    #[test]
    fn test_detect_font_format_error_edge_cases() {
        // Test very small files
        assert_eq!(detect_font_format(&[]), None, "Empty should return None");
        assert_eq!(
            detect_font_format(&[0x00]),
            None,
            "1 byte should return None"
        );
        assert_eq!(
            detect_font_format(&[0x00, 0x00]),
            None,
            "2 bytes should return None"
        );
        assert_eq!(
            detect_font_format(&[0x00, 0x00, 0x00]),
            None,
            "3 bytes should return None"
        );
    }
}
