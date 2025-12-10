//! ABOUTME: Macros for WASM-JavaScript boundary operations.
//! ABOUTME: Provides debug logging, type conversion, and error handling helpers.

/// Debug logging macro - only logs when debug-logging feature is enabled.
///
/// Outputs to the browser console via `web_sys::console::log_1`.
/// When the `debug-logging` feature is disabled, this compiles to nothing.
///
/// # Example
///
/// ```ignore
/// debug_log!("Processing stage: {}", stage_name);
/// debug_log!("Elapsed: {}ms", elapsed);
/// ```
#[cfg(feature = "debug-logging")]
#[macro_export]
macro_rules! debug_log {
    ($($arg:tt)*) => {
        web_sys::console::log_1(&format!($($arg)*).into());
    };
}

#[cfg(not(feature = "debug-logging"))]
#[macro_export]
macro_rules! debug_log {
    ($($arg:tt)*) => {};
}

/// Convert JsValue to a Rust type with automatic error handling
///
/// This macro wraps `serde_wasm_bindgen::from_value()` and converts errors into
/// a structured `ConversionError` with consistent error message formatting.
///
/// # Usage
///
/// ```no_run
/// use wasm_bindgen::prelude::*;
/// use serde::Deserialize;
///
/// #[derive(Deserialize)]
/// struct Config {
///     page_size: String,
///     margins: f32,
/// }
///
/// # fn example(config: JsValue) -> Result<(), JsValue> {
/// // Before (verbose):
/// let pdf_config: Config = serde_wasm_bindgen::from_value(config.clone())
///     .map_err(|e| JsValue::from_str(&format!("Invalid config: {}", e)))?;
/// # Ok(())
/// # }
/// ```
///
/// With `from_js!` macro:
/// ```no_run
/// # use wasm_bindgen::prelude::*;
/// # use serde::Deserialize;
/// # #[derive(Deserialize)]
/// # struct Config { page_size: String, margins: f32 }
/// # fn example(config: JsValue) -> Result<(), JsValue> {
/// // After (concise - includes error handling and ? operator):
/// // let pdf_config: Config = from_js!(config, "INVALID_CONFIG", "parsing");
/// # Ok(())
/// # }
/// ```
///
/// # Arguments
///
/// * `$js_val` - JsValue to deserialize
/// * `$error_code` - Error code string literal (e.g., "INVALID_CONFIG")
/// * `$stage` - Pipeline stage string literal (e.g., "parsing", "validation")
///
/// # Returns
///
/// `Result<T, JsValue>` where T is the target Rust type
///
/// # Example
///
/// ```no_run
/// # use wasm_bindgen::prelude::*;
/// # use serde::Deserialize;
/// #
/// #[derive(Deserialize)]
/// struct PdfConfig {
///     page_size: String,
///     orientation: String,
/// }
///
/// # fn convert_config(config_js: JsValue) -> Result<PdfConfig, JsValue> {
/// // Macro handles deserialization and error conversion:
/// // let config: PdfConfig = from_js!(config_js, "INVALID_CONFIG", "parsing");
/// # Ok(PdfConfig { page_size: String::new(), orientation: String::new() })
/// # }
/// ```
#[macro_export]
macro_rules! from_js {
    ($js_val:expr, $error_code:expr, $stage:expr) => {
        serde_wasm_bindgen::from_value($js_val).map_err(|e| {
            $crate::error::create_error(
                $error_code,
                &format!(
                    "Invalid {}: {}",
                    stringify!($error_code)
                        .trim_start_matches("INVALID_")
                        .to_lowercase()
                        .replace('_', " "),
                    e
                ),
                $stage,
                true,
            )
        })?
    };
}

/// Convert a Rust type to JsValue with automatic error handling
///
/// This macro wraps `serde_wasm_bindgen::to_value()` and converts serialization
/// errors into JsValue error strings for consistent error handling at the WASM boundary.
///
/// # Usage
///
/// ```no_run
/// # use wasm_bindgen::prelude::*;
/// # use serde::Serialize;
/// #[derive(Serialize)]
/// struct ValidationReport {
///     score: f64,
///     issues: Vec<String>,
/// }
///
/// # fn create_report(report: ValidationReport) -> Result<JsValue, JsValue> {
/// // Before (verbose):
/// let js_report = serde_wasm_bindgen::to_value(&report)
///     .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))?;
/// # Ok(js_report)
/// # }
/// ```
///
/// With `to_js!` macro:
/// ```
/// # use wasm_bindgen::prelude::*;
/// # use serde::Serialize;
/// use wasm_bridge::to_js;
///
/// # #[derive(Serialize)]
/// # struct ValidationReport { score: f64, issues: Vec<String> }
/// # fn create_report(report: ValidationReport) -> Result<JsValue, JsValue> {
/// // After (concise - macro includes ? internally):
/// let js_report = to_js!(report);
/// # Ok(js_report)
/// # }
/// ```
///
/// # Arguments
///
/// * `$rust_val` - Reference to Rust value to serialize
///
/// # Returns
///
/// `Result<JsValue, JsValue>` containing the serialized value or error
///
/// # Example
///
/// ```
/// # use wasm_bindgen::prelude::*;
/// # use serde::Serialize;
/// use wasm_bridge::to_js;
///
/// #[derive(Serialize)]
/// struct ATSReport {
///     compliant: bool,
///     warnings: Vec<String>,
/// }
///
/// # fn generate_ats_report(report: ATSReport) -> Result<JsValue, JsValue> {
/// // Macro handles serialization and error conversion
/// let js_value = to_js!(report);
/// # Ok(js_value)
/// # }
/// ```
#[macro_export]
macro_rules! to_js {
    ($rust_val:expr) => {
        serde_wasm_bindgen::to_value(&$rust_val)
            .map_err(|e| wasm_bindgen::JsValue::from_str(&format!("Serialization error: {}", e)))?
    };
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_macros_compile() {
        // This test just ensures the macros are syntactically correct
        // Actual WASM functionality requires wasm-bindgen-test
    }
}
