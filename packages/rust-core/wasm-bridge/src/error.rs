//! Error handling utilities for WASM conversion pipeline
//!
//! This module provides structured error creation and categorization for the TSX to PDF
//! conversion process. All errors are designed to be serialized to JavaScript as structured
//! objects with actionable suggestions.

use wasm_bindgen::prelude::*;

/// Error object structure for WASM boundary
///
/// This structure is serialized to JavaScript and provides comprehensive error information
/// including user-friendly messages, technical details, and actionable suggestions.
#[derive(Debug, serde::Serialize)]
pub struct ConversionError {
    /// Pipeline stage where the error occurred (parsing, rendering, generating-pdf, etc.)
    pub stage: String,
    /// Error code matching TypeScript ErrorCode enum
    pub code: String,
    /// User-friendly error message
    pub message: String,
    /// Technical error details for debugging
    #[serde(rename = "technicalDetails")]
    pub technical_details: String,
    /// Whether the user can retry with changes
    pub recoverable: bool,
    /// Actionable suggestions to fix the issue
    pub suggestions: Vec<String>,
    /// Error category: SYNTAX, SIZE, NETWORK, SYSTEM, UNKNOWN
    pub category: String,
    /// Optional error-specific metadata (line/column, file size, etc.)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

/// Create structured error object without metadata
///
/// # Arguments
/// * `code` - Error code (TSX_PARSE_ERROR, PDF_GENERATION_FAILED, etc.)
/// * `message` - User-friendly error message
/// * `stage` - Pipeline stage (parsing, rendering, generating-pdf, etc.)
/// * `recoverable` - Whether user can retry with changes
///
/// # Returns
/// JsValue containing serialized ConversionError
pub fn create_error(code: &str, message: &str, stage: &str, recoverable: bool) -> JsValue {
    create_error_with_metadata(code, message, stage, recoverable, None)
}

/// Create error with optional metadata
///
/// # Arguments
/// * `code` - Error code
/// * `message` - User-friendly error message
/// * `stage` - Pipeline stage
/// * `recoverable` - Whether user can retry
/// * `metadata` - Optional error metadata (line/column for parse errors, file size for memory errors)
///
/// # Returns
/// JsValue containing serialized ConversionError with all fields populated
pub fn create_error_with_metadata(
    code: &str,
    message: &str,
    stage: &str,
    recoverable: bool,
    metadata: Option<serde_json::Value>,
) -> JsValue {
    let category = get_error_category(code);
    let suggestions = get_suggestions(code);

    let error = ConversionError {
        stage: stage.to_string(),
        code: code.to_string(),
        message: message.to_string(),
        technical_details: message.to_string(), // Technical details for debugging
        recoverable,
        suggestions,
        category: category.to_string(),
        metadata,
    };

    serde_wasm_bindgen::to_value(&error)
        .unwrap_or_else(|_| JsValue::from_str("SERIALIZATION_ERROR"))
}

/// Map error code to category
///
/// Categories:
/// - **SYNTAX**: Parse errors, invalid config, malformed metadata
/// - **SIZE**: Memory limits, storage quota exceeded
/// - **NETWORK**: Font loading, network errors
/// - **SYSTEM**: WASM execution, PDF generation, timeouts
/// - **UNKNOWN**: Unrecognized error codes
fn get_error_category(code: &str) -> &'static str {
    match code {
        // SYNTAX errors
        "TSX_DETECTION_FAILED"
        | "TSX_PARSE_ERROR"
        | "INVALID_TSX_STRUCTURE"
        | "INVALID_CONFIG"
        | "INVALID_METADATA"
        | "parse-error"
        | "config-parse"
        | "metadata-error" => "SYNTAX",

        // SIZE errors
        "MEMORY_LIMIT_EXCEEDED" | "STORAGE_QUOTA_EXCEEDED" => "SIZE",

        // NETWORK errors
        "FONT_LOAD_ERROR" | "NETWORK_ERROR" => "NETWORK",

        // SYSTEM errors
        "WASM_INIT_FAILED"
        | "WASM_EXECUTION_ERROR"
        | "PDF_GENERATION_FAILED"
        | "PDF_LAYOUT_ERROR"
        | "RENDER_TIMEOUT"
        | "CONVERSION_TIMEOUT"
        | "BROWSER_PERMISSION_DENIED"
        | "render-error"
        | "layout-error"
        | "pdf-render-error"
        | "pdf-finalize-error"
        | "pdf-init-error"
        | "INVALID_FONT_DATA"
        | "font-validation" => "SYSTEM",

        // UNKNOWN
        _ => "UNKNOWN",
    }
}

/// Get suggestions for error codes
///
/// Returns actionable suggestions matching TypeScript ERROR_SUGGESTIONS.
/// Each error code maps to a list of user-friendly suggestions that help resolve the issue.
///
/// # Arguments
/// * `code` - Error code
///
/// # Returns
/// Vector of suggestion strings (always returns at least one suggestion)
fn get_suggestions(code: &str) -> Vec<String> {
    let suggestions: &[&str] = match code {
        "TSX_DETECTION_FAILED" => &[
            "Make sure you are on a Claude.ai conversation with a CV",
            "Try refreshing the page",
            "Check if the CV is visible on screen",
        ],
        "TSX_PARSE_ERROR" => &[
            "The CV code may be incomplete or corrupted",
            "Try regenerating the CV in Claude",
            "Report this issue if the problem persists",
        ],
        "INVALID_TSX_STRUCTURE" => &[
            "Ask Claude to generate a valid CV structure",
            "Ensure the CV follows standard formatting",
        ],
        "WASM_INIT_FAILED" => &[
            "Try restarting your browser",
            "Check if your browser supports WebAssembly",
            "Update your browser to the latest version",
        ],
        "WASM_EXECUTION_ERROR" => &[
            "Try the conversion again",
            "If the error persists, report it to support",
        ],
        "PDF_GENERATION_FAILED" => &[
            "Try simplifying your CV",
            "Reduce the number of sections",
            "Try again with different settings",
        ],
        "PDF_LAYOUT_ERROR" => &[
            "Adjust page margins in settings",
            "Try a different page size",
            "Simplify CV formatting",
        ],
        "FONT_LOAD_ERROR" => &[
            "Check your internet connection",
            "Try using a standard font",
            "Reload the extension",
        ],
        "MEMORY_LIMIT_EXCEEDED" => &[
            "Your CV is too large",
            "Try reducing the content",
            "Split into multiple CVs",
        ],
        "RENDER_TIMEOUT" => &[
            "Your CV is taking too long to render",
            "Try simplifying the content",
            "Try again later",
        ],
        "CONVERSION_TIMEOUT" => &[
            "Conversion is taking too long",
            "Try a simpler CV",
            "Check your system resources",
        ],
        "BROWSER_PERMISSION_DENIED" => &[
            "Grant the extension necessary permissions",
            "Check browser extension settings",
        ],
        "STORAGE_QUOTA_EXCEEDED" => &[
            "Clear conversion history",
            "Free up browser storage",
            "Reduce history retention period",
        ],
        "INVALID_CONFIG" => &[
            "Reset settings to default",
            "Check page size and margin values",
        ],
        "INVALID_METADATA" => &["Metadata validation failed", "Try regenerating the CV"],
        "INVALID_FONT_DATA" => &[
            "Font file is corrupted or invalid",
            "Try using a different font",
            "Re-download the font file",
        ],
        "NETWORK_ERROR" => &["Check your internet connection", "Try again in a moment"],
        "UNKNOWN_ERROR" => &[
            "Try restarting the extension",
            "Reload the page",
            "Report this error if it persists",
        ],
        _ => &[
            "Try restarting the extension",
            "Report this error if it persists",
        ],
    };
    suggestions.iter().map(|s| s.to_string()).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_category_syntax() {
        assert_eq!(get_error_category("TSX_PARSE_ERROR"), "SYNTAX");
        assert_eq!(get_error_category("INVALID_CONFIG"), "SYNTAX");
        assert_eq!(get_error_category("INVALID_METADATA"), "SYNTAX");
    }

    #[test]
    fn test_error_category_size() {
        assert_eq!(get_error_category("MEMORY_LIMIT_EXCEEDED"), "SIZE");
        assert_eq!(get_error_category("STORAGE_QUOTA_EXCEEDED"), "SIZE");
    }

    #[test]
    fn test_error_category_network() {
        assert_eq!(get_error_category("FONT_LOAD_ERROR"), "NETWORK");
        assert_eq!(get_error_category("NETWORK_ERROR"), "NETWORK");
    }

    #[test]
    fn test_error_category_system() {
        assert_eq!(get_error_category("PDF_GENERATION_FAILED"), "SYSTEM");
        assert_eq!(get_error_category("WASM_EXECUTION_ERROR"), "SYSTEM");
        assert_eq!(get_error_category("INVALID_FONT_DATA"), "SYSTEM");
    }

    #[test]
    fn test_error_category_unknown() {
        assert_eq!(get_error_category("SOME_RANDOM_ERROR"), "UNKNOWN");
    }

    #[test]
    fn test_get_suggestions_returns_non_empty() {
        let suggestions = get_suggestions("TSX_PARSE_ERROR");
        assert!(!suggestions.is_empty());
    }

    #[test]
    fn test_get_suggestions_default() {
        let suggestions = get_suggestions("UNKNOWN_CODE_12345");
        assert_eq!(suggestions.len(), 2);
        assert_eq!(suggestions[0], "Try restarting the extension");
    }
}
