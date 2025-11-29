//! PDF Generator Error Tests
//!
//! Tests for PDFError enum and error handling, including error codes,
//! recoverability flags, and serialization/deserialization.

#[cfg(test)]
mod tests {
    use pdf_generator::PDFError;

    #[test]
    fn test_init_error_code() {
        let error = PDFError::InitError("Failed to initialize".to_string());
        assert_eq!(error.code(), "PDF_INIT_ERROR");
        assert_eq!(
            error.to_string(),
            "Failed to initialize PDF document: Failed to initialize"
        );
    }

    #[test]
    fn test_font_error_code() {
        let error = PDFError::FontError("Font not found".to_string());
        assert_eq!(error.code(), "PDF_FONT_ERROR");
        assert_eq!(error.to_string(), "Font error: Font not found");
    }

    #[test]
    fn test_render_error_code() {
        let error = PDFError::RenderError("Rendering failed".to_string());
        assert_eq!(error.code(), "PDF_RENDER_ERROR");
        assert_eq!(error.to_string(), "Rendering error: Rendering failed");
    }

    #[test]
    fn test_save_error_code() {
        let error = PDFError::SaveError("Could not save".to_string());
        assert_eq!(error.code(), "PDF_SAVE_ERROR");
        assert_eq!(error.to_string(), "Failed to save PDF: Could not save");
    }

    #[test]
    fn test_config_error_code() {
        let error = PDFError::ConfigError("Invalid config".to_string());
        assert_eq!(error.code(), "PDF_CONFIG_ERROR");
        assert_eq!(error.to_string(), "Invalid configuration: Invalid config");
    }

    #[test]
    fn test_init_error_not_recoverable() {
        let error = PDFError::InitError("Failed".to_string());
        assert!(
            !error.is_recoverable(),
            "InitError should not be recoverable"
        );
    }

    #[test]
    fn test_font_error_not_recoverable() {
        let error = PDFError::FontError("Missing font".to_string());
        assert!(
            !error.is_recoverable(),
            "FontError should not be recoverable"
        );
    }

    #[test]
    fn test_render_error_is_recoverable() {
        let error = PDFError::RenderError("Render failed".to_string());
        assert!(error.is_recoverable(), "RenderError should be recoverable");
    }

    #[test]
    fn test_save_error_is_recoverable() {
        let error = PDFError::SaveError("Save failed".to_string());
        assert!(error.is_recoverable(), "SaveError should be recoverable");
    }

    #[test]
    fn test_config_error_is_recoverable() {
        let error = PDFError::ConfigError("Bad config".to_string());
        assert!(error.is_recoverable(), "ConfigError should be recoverable");
    }

    #[test]
    fn test_error_serialization() {
        use serde_json;

        let error = PDFError::RenderError("Test error".to_string());
        let serialized = serde_json::to_string(&error);
        assert!(serialized.is_ok(), "Error should be serializable");

        let json = serialized.unwrap();
        assert!(
            json.contains("RenderError"),
            "Serialized error should contain variant name"
        );
        assert!(
            json.contains("Test error"),
            "Serialized error should contain message"
        );
    }

    #[test]
    fn test_error_deserialization() {
        use serde_json;

        let json = r#"{"FontError":"Font not available"}"#;
        let deserialized: Result<PDFError, _> = serde_json::from_str(json);

        assert!(deserialized.is_ok(), "Error should be deserializable");

        let error = deserialized.unwrap();
        match &error {
            PDFError::FontError(msg) => {
                assert_eq!(msg, "Font not available");
                assert_eq!(error.code(), "PDF_FONT_ERROR");
            }
            _ => panic!("Expected FontError variant"),
        }
    }
}
