use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug, Serialize, Deserialize)]
pub enum PDFError {
    #[error("Failed to initialize PDF document: {0}")]
    InitError(String),

    #[error("Font error: {0}")]
    FontError(String),

    #[error("Rendering error: {0}")]
    RenderError(String),

    #[error("Failed to save PDF: {0}")]
    SaveError(String),

    #[error("Invalid configuration: {0}")]
    ConfigError(String),
}

impl PDFError {
    /// Get error code for programmatic handling
    pub fn code(&self) -> &'static str {
        match self {
            PDFError::InitError(_) => "PDF_INIT_ERROR",
            PDFError::FontError(_) => "PDF_FONT_ERROR",
            PDFError::RenderError(_) => "PDF_RENDER_ERROR",
            PDFError::SaveError(_) => "PDF_SAVE_ERROR",
            PDFError::ConfigError(_) => "PDF_CONFIG_ERROR",
        }
    }

    /// Check if error is recoverable
    pub fn is_recoverable(&self) -> bool {
        match self {
            PDFError::InitError(_) => false,
            PDFError::FontError(_) => false,
            PDFError::RenderError(_) => true,
            PDFError::SaveError(_) => true,
            PDFError::ConfigError(_) => true,
        }
    }

    /// Convert technical error to user-friendly message
    pub fn user_friendly_message(&self) -> String {
        match self {
            PDFError::InitError(msg) => {
                format!("We couldn't start generating your PDF. This is usually a temporary issue. Please try again. (Technical details: {})", msg)
            }
            PDFError::FontError(msg) => {
                if msg.contains("not found") || msg.contains("missing") {
                    "One or more fonts used in your CV couldn't be loaded. Try using standard fonts like Arial, Times New Roman, or Helvetica.".to_string()
                } else if msg.contains("invalid") || msg.contains("corrupt") {
                    "There's an issue with one of the fonts in your CV. Please try a different font or use a standard web-safe font.".to_string()
                } else {
                    format!("There's a problem with the fonts in your CV. {}", msg)
                }
            }
            PDFError::RenderError(msg) => {
                if msg.contains("too large") || msg.contains("exceeds") {
                    "Your CV content is too large for a single page. Try reducing content or using a smaller font size.".to_string()
                } else if msg.contains("layout") {
                    "There's an issue with how your CV is laid out. Try simplifying the structure or removing complex elements.".to_string()
                } else {
                    format!("We encountered an issue while creating your PDF: {}", msg)
                }
            }
            PDFError::SaveError(msg) => {
                format!("Your PDF was created but couldn't be saved. This might be a browser storage issue. Please try again. ({})", msg)
            }
            PDFError::ConfigError(msg) => {
                if msg.contains("page size") || msg.contains("margin") {
                    "There's an issue with your page settings. Please check your page size and margin configuration.".to_string()
                } else {
                    format!("There's a configuration issue: {}", msg)
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_code_init_error() {
        let error = PDFError::InitError("test".to_string());
        assert_eq!(error.code(), "PDF_INIT_ERROR");
    }

    #[test]
    fn test_error_code_font_error() {
        let error = PDFError::FontError("test".to_string());
        assert_eq!(error.code(), "PDF_FONT_ERROR");
    }

    #[test]
    fn test_error_code_render_error() {
        let error = PDFError::RenderError("test".to_string());
        assert_eq!(error.code(), "PDF_RENDER_ERROR");
    }

    #[test]
    fn test_error_code_save_error() {
        let error = PDFError::SaveError("test".to_string());
        assert_eq!(error.code(), "PDF_SAVE_ERROR");
    }

    #[test]
    fn test_error_code_config_error() {
        let error = PDFError::ConfigError("test".to_string());
        assert_eq!(error.code(), "PDF_CONFIG_ERROR");
    }

    #[test]
    fn test_init_error_not_recoverable() {
        let error = PDFError::InitError("failed".to_string());
        assert!(!error.is_recoverable());
    }

    #[test]
    fn test_font_error_not_recoverable() {
        let error = PDFError::FontError("missing font".to_string());
        assert!(!error.is_recoverable());
    }

    #[test]
    fn test_render_error_recoverable() {
        let error = PDFError::RenderError("layout issue".to_string());
        assert!(error.is_recoverable());
    }

    #[test]
    fn test_save_error_recoverable() {
        let error = PDFError::SaveError("storage issue".to_string());
        assert!(error.is_recoverable());
    }

    #[test]
    fn test_config_error_recoverable() {
        let error = PDFError::ConfigError("invalid margin".to_string());
        assert!(error.is_recoverable());
    }

    #[test]
    fn test_user_friendly_message_init_error() {
        let error = PDFError::InitError("internal failure".to_string());
        let msg = error.user_friendly_message();
        assert!(msg.contains("couldn't start generating"));
        assert!(msg.contains("temporary issue"));
        assert!(msg.contains("internal failure"));
    }

    #[test]
    fn test_user_friendly_message_font_error_not_found() {
        let error = PDFError::FontError("Roboto not found".to_string());
        let msg = error.user_friendly_message();
        assert!(msg.contains("fonts used in your CV couldn't be loaded"));
        assert!(msg.contains("standard fonts"));
    }

    #[test]
    fn test_user_friendly_message_font_error_missing() {
        let error = PDFError::FontError("font file missing".to_string());
        let msg = error.user_friendly_message();
        assert!(msg.contains("fonts used in your CV couldn't be loaded"));
    }

    #[test]
    fn test_user_friendly_message_font_error_invalid() {
        let error = PDFError::FontError("invalid font data".to_string());
        let msg = error.user_friendly_message();
        assert!(msg.contains("issue with one of the fonts"));
        assert!(msg.contains("different font"));
    }

    #[test]
    fn test_user_friendly_message_font_error_corrupt() {
        let error = PDFError::FontError("corrupt TTF file".to_string());
        let msg = error.user_friendly_message();
        assert!(msg.contains("issue with one of the fonts"));
    }

    #[test]
    fn test_user_friendly_message_font_error_generic() {
        let error = PDFError::FontError("encoding error".to_string());
        let msg = error.user_friendly_message();
        assert!(msg.contains("problem with the fonts"));
        assert!(msg.contains("encoding error"));
    }

    #[test]
    fn test_user_friendly_message_render_error_too_large() {
        let error = PDFError::RenderError("content too large".to_string());
        let msg = error.user_friendly_message();
        assert!(msg.contains("content is too large"));
        assert!(msg.contains("reducing content"));
    }

    #[test]
    fn test_user_friendly_message_render_error_exceeds() {
        let error = PDFError::RenderError("exceeds page bounds".to_string());
        let msg = error.user_friendly_message();
        assert!(msg.contains("content is too large"));
    }

    #[test]
    fn test_user_friendly_message_render_error_layout() {
        let error = PDFError::RenderError("layout calculation failed".to_string());
        let msg = error.user_friendly_message();
        assert!(msg.contains("issue with how your CV is laid out"));
        assert!(msg.contains("simplifying"));
    }

    #[test]
    fn test_user_friendly_message_render_error_generic() {
        let error = PDFError::RenderError("unknown rendering issue".to_string());
        let msg = error.user_friendly_message();
        assert!(msg.contains("encountered an issue while creating"));
        assert!(msg.contains("unknown rendering issue"));
    }

    #[test]
    fn test_user_friendly_message_save_error() {
        let error = PDFError::SaveError("disk full".to_string());
        let msg = error.user_friendly_message();
        assert!(msg.contains("created but couldn't be saved"));
        assert!(msg.contains("browser storage issue"));
        assert!(msg.contains("disk full"));
    }

    #[test]
    fn test_user_friendly_message_config_error_page_size() {
        let error = PDFError::ConfigError("invalid page size".to_string());
        let msg = error.user_friendly_message();
        assert!(msg.contains("issue with your page settings"));
        assert!(msg.contains("page size and margin"));
    }

    #[test]
    fn test_user_friendly_message_config_error_margin() {
        let error = PDFError::ConfigError("negative margin".to_string());
        let msg = error.user_friendly_message();
        assert!(msg.contains("issue with your page settings"));
    }

    #[test]
    fn test_user_friendly_message_config_error_generic() {
        let error = PDFError::ConfigError("invalid setting".to_string());
        let msg = error.user_friendly_message();
        assert!(msg.contains("configuration issue"));
        assert!(msg.contains("invalid setting"));
    }

    #[test]
    fn test_error_display_format() {
        let error = PDFError::FontError("test error".to_string());
        let display = format!("{}", error);
        assert!(display.contains("Font error"));
        assert!(display.contains("test error"));
    }

    #[test]
    fn test_error_debug_format() {
        let error = PDFError::RenderError("test".to_string());
        let debug = format!("{:?}", error);
        assert!(debug.contains("RenderError"));
    }
}
