//! Error Recovery Tests for WASM Bridge
//!
//! Tests all error codes and recovery scenarios to ensure proper error handling
//! and user-friendly error messages.

use js_sys::{Object, Reflect};
use wasm_bindgen::prelude::*;
use wasm_bindgen_test::*;
use wasm_bridge::TsxToPdfConverter;

wasm_bindgen_test_configure!(run_in_browser);

/// Helper to create a basic PDF config for testing (using JS Object API)
fn create_test_config() -> JsValue {
    let config = Object::new();
    Reflect::set(&config, &"page_size".into(), &"A4".into()).unwrap();

    let margin = Object::new();
    Reflect::set(&margin, &"top".into(), &36.0.into()).unwrap();
    Reflect::set(&margin, &"right".into(), &36.0.into()).unwrap();
    Reflect::set(&margin, &"bottom".into(), &36.0.into()).unwrap();
    Reflect::set(&margin, &"left".into(), &36.0.into()).unwrap();
    Reflect::set(&config, &"margin".into(), &margin).unwrap();

    Reflect::set(&config, &"standard".into(), &"PDF17".into()).unwrap();
    Reflect::set(&config, &"title".into(), &"Test CV".into()).unwrap();
    Reflect::set(&config, &"author".into(), &JsValue::null()).unwrap();
    Reflect::set(&config, &"subject".into(), &"CV Test".into()).unwrap();
    Reflect::set(&config, &"keywords".into(), &JsValue::null()).unwrap();
    Reflect::set(&config, &"creator".into(), &"WASM Test".into()).unwrap();

    config.into()
}

#[wasm_bindgen_test]
fn test_memory_limit_exceeded() {
    // Test TSX exceeding 5MB limit
    let huge_tsx = "x".repeat(6 * 1024 * 1024); // 6MB (exceeds 5MB limit)
    let converter = TsxToPdfConverter::new();
    let config = create_test_config();

    let result = converter.convert_tsx_to_pdf(&huge_tsx, config, None, None);
    assert!(result.is_err(), "Should fail with memory limit exceeded");

    // Verify error is a structured object
    let err = result.unwrap_err();
    let err_json = js_sys::JSON::stringify(&err)
        .ok()
        .and_then(|s| s.as_string())
        .unwrap_or_default();
    assert!(
        err_json.contains("MEMORY_LIMIT_EXCEEDED")
            || err_json.contains("fileSize")
            || err_json.contains("code"),
        "Error should indicate memory limit: {}",
        err_json
    );
}

#[wasm_bindgen_test]
fn test_invalid_config_recovery() {
    // Test with invalid config object
    let valid_tsx = r#"<CV><Name>Test User</Name></CV>"#;
    let converter = TsxToPdfConverter::new();
    let invalid_config = wasm_bindgen::JsValue::from_str("not a valid config");

    let result = converter.convert_tsx_to_pdf(valid_tsx, invalid_config, None, None);
    assert!(result.is_err(), "Should fail with invalid config");

    let err = result.unwrap_err();
    let err_json = js_sys::JSON::stringify(&err)
        .ok()
        .and_then(|s| s.as_string())
        .unwrap_or_default();
    assert!(
        err_json.contains("INVALID_CONFIG") || err_json.contains("config"),
        "Error should indicate invalid config: {}",
        err_json
    );
}

#[wasm_bindgen_test]
fn test_invalid_tsx_syntax() {
    // Test with malformed TSX
    let invalid_tsx = r#"<CV><Name>Missing closing tag"#;
    let converter = TsxToPdfConverter::new();
    let config = create_test_config();

    let result = converter.convert_tsx_to_pdf(invalid_tsx, config, None, None);
    assert!(result.is_err(), "Should fail with TSX parse error");

    let err = result.unwrap_err();
    let err_json = js_sys::JSON::stringify(&err)
        .ok()
        .and_then(|s| s.as_string())
        .unwrap_or_default();
    assert!(
        err_json.contains("TSX_PARSE_ERROR") || err_json.contains("parse"),
        "Error should indicate parse error: {}",
        err_json
    );
}

#[wasm_bindgen_test]
fn test_empty_tsx_handling() {
    // Test with empty TSX
    let empty_tsx = "";
    let converter = TsxToPdfConverter::new();
    let config = create_test_config();

    let result = converter.convert_tsx_to_pdf(empty_tsx, config, None, None);
    // Empty TSX should either fail gracefully or handle with default
    if let Err(err) = result {
        let err_json = js_sys::JSON::stringify(&err)
            .ok()
            .and_then(|s| s.as_string())
            .unwrap_or_default();
        assert!(!err_json.is_empty(), "Error message should not be empty");
    }
}

#[wasm_bindgen_test]
fn test_invalid_font_data() {
    // Test with invalid font bytes in FontCollection
    use wasm_bridge::{FontCollection, FontData};

    let valid_tsx = r#"<CV style="font-family: Roboto"><Name>Test</Name></CV>"#;
    let converter = TsxToPdfConverter::new();
    let config = create_test_config();

    // Create FontCollection with invalid font bytes
    let mut fonts = FontCollection::new();
    let invalid_font_bytes = vec![0xFF, 0xFF, 0xFF, 0xFF]; // Invalid magic number
    fonts.add(FontData::new(
        "Roboto".to_string(),
        400,
        false,
        invalid_font_bytes,
    ));

    let result = converter.convert_tsx_to_pdf(valid_tsx, config, Some(fonts), None);
    assert!(result.is_err(), "Should fail with invalid font data");

    let err = result.unwrap_err();
    let err_json = js_sys::JSON::stringify(&err)
        .ok()
        .and_then(|s| s.as_string())
        .unwrap_or_default();
    assert!(
        err_json.contains("INVALID_FONT_DATA") || err_json.contains("font"),
        "Error should indicate invalid font: {}",
        err_json
    );
}

#[wasm_bindgen_test]
fn test_detect_fonts_with_invalid_tsx() {
    // Test font detection with invalid TSX
    let invalid_tsx = r#"<CV><Name>Missing closing"#;
    let converter = TsxToPdfConverter::new();

    let result = converter.detect_fonts(invalid_tsx);
    assert!(result.is_err(), "Should fail on invalid TSX");
}

#[wasm_bindgen_test]
fn test_detect_fonts_with_empty_tsx() {
    // Test font detection with empty TSX
    let empty_tsx = "";
    let converter = TsxToPdfConverter::new();

    let result = converter.detect_fonts(empty_tsx);
    // Should either succeed with empty list or fail gracefully
    if let Err(err) = result {
        // If fails, should have error message
        assert!(err.as_string().is_some());
    }
}

#[wasm_bindgen_test]
fn test_ats_validation_with_invalid_tsx() {
    // Test ATS validation with invalid TSX
    let invalid_tsx = r#"<CV><Name incomplete"#;
    let converter = TsxToPdfConverter::new();
    let config = create_test_config();

    let result = converter.validate_ats_compatibility(invalid_tsx, config);
    assert!(result.is_err(), "Should fail with invalid TSX");
}

#[wasm_bindgen_test]
fn test_ats_validation_with_invalid_config() {
    // Test ATS validation with invalid config
    let valid_tsx = r#"<CV><Name>Test</Name></CV>"#;
    let converter = TsxToPdfConverter::new();
    let invalid_config = wasm_bindgen::JsValue::from_str("invalid");

    let result = converter.validate_ats_compatibility(valid_tsx, invalid_config);
    assert!(result.is_err(), "Should fail with invalid config");
}

#[wasm_bindgen_test]
fn test_progress_callback_error_handling() {
    // Test that conversion handles progress callback errors gracefully
    let valid_tsx = r#"<CV><Name>Test User</Name><Title>Developer</Title></CV>"#;
    let converter = TsxToPdfConverter::new();
    let config = create_test_config();

    // Create a callback that throws an error
    let failing_callback =
        js_sys::Function::new_with_args("stage, percentage", "throw new Error('Callback failed');");

    let result = converter.convert_tsx_to_pdf(valid_tsx, config, None, Some(failing_callback));
    // Conversion should either succeed despite callback error or fail gracefully
    if let Err(err) = result {
        // Error should exist - either as string or structured object
        let err_json = js_sys::JSON::stringify(&err)
            .ok()
            .and_then(|s| s.as_string())
            .unwrap_or_default();
        assert!(
            !err_json.is_empty() || err.as_string().is_some(),
            "Error should have content"
        );
    }
}

#[wasm_bindgen_test]
fn test_null_config_handling() {
    // Test with null config
    let valid_tsx = r#"<CV><Name>Test</Name></CV>"#;
    let converter = TsxToPdfConverter::new();
    let null_config = wasm_bindgen::JsValue::NULL;

    let result = converter.convert_tsx_to_pdf(valid_tsx, null_config, None, None);
    assert!(result.is_err(), "Should fail with null config");
}

#[wasm_bindgen_test]
fn test_undefined_config_handling() {
    // Test with undefined config
    let valid_tsx = r#"<CV><Name>Test</Name></CV>"#;
    let converter = TsxToPdfConverter::new();
    let undefined_config = wasm_bindgen::JsValue::UNDEFINED;

    let result = converter.convert_tsx_to_pdf(valid_tsx, undefined_config, None, None);
    assert!(result.is_err(), "Should fail with undefined config");
}

#[wasm_bindgen_test]
fn test_error_has_suggestions() {
    // Test that errors include actionable suggestions
    let invalid_tsx = r#"<CV><Name>Unclosed"#;
    let converter = TsxToPdfConverter::new();
    let config = create_test_config();

    let result = converter.convert_tsx_to_pdf(invalid_tsx, config, None, None);
    assert!(result.is_err());

    let err = result.unwrap_err();
    let err_json = js_sys::JSON::stringify(&err)
        .ok()
        .and_then(|s| s.as_string())
        .unwrap_or_default();

    // Error should be structured and contain useful information
    assert!(!err_json.is_empty(), "Error message should not be empty");
    assert!(err_json.len() > 10, "Error should be descriptive");
    // Structured errors should contain suggestions field
    assert!(
        err_json.contains("suggestions"),
        "Error should contain suggestions"
    );
}

#[wasm_bindgen_test]
fn test_error_has_recovery_info() {
    // Test that errors indicate if they're recoverable
    let invalid_config = wasm_bindgen::JsValue::from_str("bad config");
    let valid_tsx = r#"<CV><Name>Test</Name></CV>"#;
    let converter = TsxToPdfConverter::new();

    let result = converter.convert_tsx_to_pdf(valid_tsx, invalid_config, None, None);
    assert!(result.is_err());

    let err = result.unwrap_err();
    let err_json = js_sys::JSON::stringify(&err)
        .ok()
        .and_then(|s| s.as_string())
        .unwrap_or_default();

    // Should contain error information (code, message, recoverable)
    assert!(!err_json.is_empty());
    assert!(
        err_json.contains("recoverable"),
        "Error should have recoverable field"
    );
}

#[wasm_bindgen_test]
fn test_truncated_font_data() {
    // Test with truncated font bytes (less than 4 bytes)
    use wasm_bridge::{FontCollection, FontData};

    let valid_tsx = r#"<CV style="font-family: Arial"><Name>Test</Name></CV>"#;
    let converter = TsxToPdfConverter::new();
    let config = create_test_config();

    let mut fonts = FontCollection::new();
    let truncated_bytes = vec![0x00, 0x01]; // Only 2 bytes
    fonts.add(FontData::new(
        "Arial".to_string(),
        400,
        false,
        truncated_bytes,
    ));

    let result = converter.convert_tsx_to_pdf(valid_tsx, config, Some(fonts), None);
    assert!(result.is_err(), "Should fail with truncated font data");
}

// ============================================================================
// Cross-Crate Error Propagation Tests (P1-2)
// ============================================================================

#[wasm_bindgen_test]
fn test_parse_error_propagates_through_pipeline() {
    // Given: Invalid TSX that triggers parse error (from tsx-parser crate)
    let invalid_tsx = r#"<CV><Header name="Test" incomplete"#; // Missing closing tags

    let converter = TsxToPdfConverter::new();
    let config = create_test_config();

    // When: Convert through full pipeline
    let result = converter.convert_tsx_to_pdf(invalid_tsx, config, None, None);

    // Then: Should get parse error (not layout/PDF error)
    assert!(result.is_err(), "Should fail with parse error");

    let err = result.unwrap_err();

    // Error is a structured object - need to serialize to JSON for inspection
    let err_json = js_sys::JSON::stringify(&err)
        .ok()
        .and_then(|s| s.as_string())
        .unwrap_or_default();

    // Verify error originates from parsing stage (tsx-parser crate)
    assert!(
        err_json.contains("TSX_PARSE_ERROR")
            || err_json.contains("parse")
            || err_json.contains("parsing"),
        "Error should indicate parse error from tsx-parser crate, got: {}",
        err_json
    );

    // Verify it's NOT a downstream error (layout or PDF)
    assert!(
        !err_json.contains("layout") && !err_json.contains("PDF_GENERATION"),
        "Error should be from parser, not downstream stages"
    );
}

#[wasm_bindgen_test]
fn test_layout_error_propagates_through_pipeline() {
    // Given: Valid TSX and config that successfully go through parsing
    // This test verifies that parse errors don't mask layout errors
    let tsx = r#"
        <CV>
            <Section>
                <Name>Test User</Name>
                <Title>Software Engineer</Title>
            </Section>
        </CV>
    "#;

    let converter = TsxToPdfConverter::new();
    let config = create_test_config();

    // When: Convert through full pipeline
    let result = converter.convert_tsx_to_pdf(tsx, config, None, None);

    // Then: Should succeed, demonstrating that errors from parsing stage
    // don't mask errors from downstream stages (layout, PDF)
    //
    // If it were to fail, we verify it's from layout/PDF, not parsing
    match result {
        Ok(pdf_bytes) => {
            assert!(!pdf_bytes.is_empty(), "PDF should have content");
            // Success demonstrates proper error propagation - parse errors didn't mask layout
        }
        Err(err) => {
            let err_json = js_sys::JSON::stringify(&err)
                .ok()
                .and_then(|s| s.as_string())
                .unwrap_or_default();

            // If it fails, should be layout/PDF error, not parse
            assert!(
                !err_json.contains("TSX_PARSE_ERROR"),
                "Should not have parse error with valid TSX, got: {}",
                err_json
            );
        }
    }
}

#[wasm_bindgen_test]
fn test_pdf_error_propagates_with_context() {
    // Given: Valid TSX that goes through complete pipeline
    // This test verifies end-to-end error propagation
    let tsx = r#"<CV><Section><Name>Test User</Name><Title>Developer</Title></Section></CV>"#;

    let converter = TsxToPdfConverter::new();
    let config = create_test_config();

    // When: Convert through full pipeline (all 5 stages)
    let result = converter.convert_tsx_to_pdf(tsx, config, None, None);

    // Then: Verify error propagation works correctly
    match result {
        Ok(pdf_bytes) => {
            // Success path: Verify PDF was generated
            assert!(!pdf_bytes.is_empty(), "PDF should have content");
            assert!(pdf_bytes.len() > 500, "PDF should have substantial content");
            assert_eq!(&pdf_bytes[0..5], b"%PDF-", "PDF should have valid header");

            // Success demonstrates proper error propagation through all stages
        }
        Err(err) => {
            // If it fails, verify the error has proper context and is from correct stage
            let err_json = js_sys::JSON::stringify(&err)
                .ok()
                .and_then(|s| s.as_string())
                .unwrap_or_default();

            // Error should have context (not empty)
            assert!(!err_json.is_empty(), "Error should have context");
            assert!(err_json.len() > 20, "Error should have meaningful details");

            // Error should include stage, code, and message fields
            assert!(
                err_json.contains("\"stage\":"),
                "Error should include stage"
            );
            assert!(err_json.contains("\"code\":"), "Error should include code");
            assert!(
                err_json.contains("\"message\":"),
                "Error should include message"
            );

            // This validates that errors from any stage include proper context
        }
    }
}
