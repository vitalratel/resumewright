//! Font Processing Module
//!
//! This module handles font detection, validation, and collection building.
//! Extracted from converter.rs as part of SRP refactoring (Phase 2).
//!
//! Responsibilities:
//! - Font requirement extraction from TSX documents
//! - Font format validation (TrueType/OpenType magic number checks)
//! - Font collection building from FontData

use std::collections::HashMap;

use crate::converter::FontCollection;
use crate::font_detection::extract_font_requirements;
use crate::validation::is_valid_font_format;
use tsx_parser::TsxDocument;

/// Font processor for managing font detection and validation
pub struct FontProcessor;

impl FontProcessor {
    /// Create a new FontProcessor instance
    pub fn new() -> Self {
        Self
    }

    /// Detect font requirements from TSX document
    ///
    /// # Arguments
    /// * `document` - Parsed TSX document
    ///
    /// # Returns
    /// JSON string of font requirements or error
    pub fn detect_fonts(&self, document: &TsxDocument) -> Result<String, String> {
        let requirements = extract_font_requirements(document)?;

        serde_json::to_string(&requirements).map_err(|e| format!("JSON serialization error: {}", e))
    }

    /// Validate font data bytes
    ///
    /// # Arguments
    /// * `bytes` - Font file bytes to validate
    /// * `family` - Font family name (for error messages)
    ///
    /// # Returns
    /// Ok(()) if valid, Err with descriptive message if invalid
    pub fn validate_font_data(&self, bytes: &[u8], family: &str) -> Result<(), String> {
        if !is_valid_font_format(bytes) {
            return Err(format!(
                "Invalid TrueType/OpenType font data for family '{}'",
                family
            ));
        }
        Ok(())
    }

    /// Build font bytes HashMap from FontCollection
    ///
    /// Validates each font and creates a HashMap with keys in format:
    /// "family:weight:is_italic" -> font_bytes
    ///
    /// # Arguments
    /// * `font_collection` - FontCollection containing font data
    ///
    /// # Returns
    /// HashMap of font keys to font bytes, or error if validation fails
    pub fn build_font_collection(
        &self,
        font_collection: &FontCollection,
    ) -> Result<HashMap<String, Vec<u8>>, String> {
        let mut font_bytes_map = HashMap::new();

        for font in font_collection.fonts_internal() {
            // Validate font bytes before using
            self.validate_font_data(font.bytes_internal(), &font.family())?;

            let key = format!("{}:{}:{}", font.family(), font.weight(), font.is_italic());
            font_bytes_map.insert(key, font.bytes_internal().to_vec());
        }

        Ok(font_bytes_map)
    }
}

impl Default for FontProcessor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_font_processor_creation() {
        let processor = FontProcessor::new();
        assert!(std::mem::size_of_val(&processor) == 0); // Zero-sized type
    }

    #[test]
    fn test_validate_font_data_valid_truetype() {
        let processor = FontProcessor::new();
        let ttf_bytes = [0x00, 0x01, 0x00, 0x00, 0xFF, 0xFF];
        assert!(processor.validate_font_data(&ttf_bytes, "Arial").is_ok());
    }

    #[test]
    fn test_validate_font_data_invalid() {
        let processor = FontProcessor::new();
        let invalid_bytes = [0xFF, 0xFF, 0xFF, 0xFF];
        let result = processor.validate_font_data(&invalid_bytes, "Arial");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid TrueType/OpenType"));
    }

    #[test]
    fn test_validate_font_data_truncated() {
        let processor = FontProcessor::new();
        let truncated = [0x00, 0x01];
        assert!(processor.validate_font_data(&truncated, "Arial").is_err());
    }

    //
    // P2 Edge Case Tests (P2-COV-FONT_PROCESSOR-001)
    //

    #[test]
    fn test_validate_font_data_all_valid_formats() {
        let processor = FontProcessor::new();

        // TrueType 1.0
        let ttf_v1 = [0x00, 0x01, 0x00, 0x00, 0xFF];
        assert!(processor.validate_font_data(&ttf_v1, "Roboto").is_ok());

        // macOS TrueType ('true')
        let ttf_true = [0x74, 0x72, 0x75, 0x65, 0xFF];
        assert!(processor.validate_font_data(&ttf_true, "Helvetica").is_ok());

        // OpenType CFF ('OTTO')
        let otf_cff = [0x4F, 0x54, 0x54, 0x4F, 0xFF];
        assert!(processor
            .validate_font_data(&otf_cff, "Merriweather")
            .is_ok());

        // TrueType Collection ('ttcf')
        let ttc = [0x74, 0x74, 0x63, 0x66, 0xFF];
        assert!(processor.validate_font_data(&ttc, "Arial").is_ok());
    }

    #[test]
    fn test_validate_font_data_empty_bytes() {
        let processor = FontProcessor::new();
        let empty = [];
        let result = processor.validate_font_data(&empty, "EmptyFont");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("EmptyFont"));
    }

    #[test]
    fn test_validate_font_data_exactly_4_bytes() {
        let processor = FontProcessor::new();

        // Valid - exactly 4 bytes with TrueType signature
        let ttf_min = [0x00, 0x01, 0x00, 0x00];
        assert!(processor.validate_font_data(&ttf_min, "MinFont").is_ok());

        // Invalid - exactly 4 bytes but wrong signature
        let invalid_min = [0xFF, 0xFF, 0xFF, 0xFF];
        assert!(processor
            .validate_font_data(&invalid_min, "BadFont")
            .is_err());
    }

    #[test]
    fn test_validate_font_data_partial_signature_match() {
        let processor = FontProcessor::new();

        // First 3 bytes match TrueType but 4th doesn't
        let partial1 = [0x00, 0x01, 0x00, 0xFF];
        assert!(processor.validate_font_data(&partial1, "Partial1").is_err());

        // First 3 bytes match 'true' but 4th doesn't
        let partial2 = [0x74, 0x72, 0x75, 0xFF];
        assert!(processor.validate_font_data(&partial2, "Partial2").is_err());
    }

    #[test]
    fn test_validate_font_data_error_message_includes_family() {
        let processor = FontProcessor::new();
        let invalid = [0xDE, 0xAD, 0xBE, 0xEF];
        let result = processor.validate_font_data(&invalid, "CustomFamily");
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("CustomFamily"));
        assert!(err_msg.contains("Invalid TrueType/OpenType"));
    }

    #[test]
    fn test_default_trait() {
        let processor1 = FontProcessor;
        let processor2 = FontProcessor::new();

        // Both should be zero-sized
        assert_eq!(std::mem::size_of_val(&processor1), 0);
        assert_eq!(std::mem::size_of_val(&processor2), 0);
    }

    #[test]
    fn test_detect_fonts_invalid_json_serialization() {
        use tsx_parser::parse_tsx;

        let processor = FontProcessor::new();

        // Valid TSX that parses but might have edge cases
        let tsx = r#"
            const CV = () => (
                <div style="font-family: Roboto; font-weight: 400">
                    <p>Test</p>
                </div>
            );
        "#;

        let document = parse_tsx(tsx).unwrap();
        let result = processor.detect_fonts(&document);

        // Should successfully serialize to JSON
        assert!(result.is_ok());
        let json = result.unwrap();
        assert!(
            json.contains("Roboto")
                || json.contains("fonts")
                || json.starts_with("[")
                || json.starts_with("{")
        );
    }

    #[test]
    fn test_build_font_collection_empty() {
        use crate::converter::FontCollection;

        let processor = FontProcessor::new();
        let empty_collection = FontCollection::new();

        let result = processor.build_font_collection(&empty_collection);
        assert!(result.is_ok());
        let map = result.unwrap();
        assert_eq!(map.len(), 0);
    }
}
