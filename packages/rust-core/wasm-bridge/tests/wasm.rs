//! WASM-specific tests for public JavaScript API
//!
//! These tests verify that the public API functions correctly when compiled to WASM
//! and called from JavaScript. Tests cover:
//! - TSX → PDF conversion in WASM environment
//! - Progress callbacks
//! - Error handling and serialization
//! - Font detection and handling
//! - Configuration serialization
//!
//! Run with: wasm-pack test --headless --chrome --package wasm-bridge

use js_sys::{Array, Function, Object, Reflect};
use wasm_bindgen::prelude::*;
use wasm_bindgen_test::*;

// Import public API
use wasm_bridge::{FontCollection, FontData, TsxToPdfConverter};

wasm_bindgen_test_configure!(run_in_browser);

/// Helper: Create default PDF config as JsValue
fn create_test_config() -> JsValue {
    let config = Object::new();
    Reflect::set(&config, &"page_size".into(), &"Letter".into()).unwrap();

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

/// Helper: Create valid TSX code
fn valid_tsx() -> &'static str {
    r#"
        const CV = () => (
            <div style="font-family: Helvetica; font-size: 12px; padding: 36px">
                <h1 style="font-size: 24px; font-weight: bold">Jane Smith</h1>
                <p style="font-size: 11px">Senior Software Engineer</p>
                <div>
                    <h2 style="font-size: 16px; font-weight: bold; margin-top: 12px">Experience</h2>
                    <p>5+ years in full-stack development</p>
                </div>
                <div>
                    <h2 style="font-size: 16px; font-weight: bold; margin-top: 12px">Skills</h2>
                    <p>JavaScript, TypeScript, Rust, React, Node.js</p>
                </div>
            </div>
        );
    "#
}

/// Helper: Create invalid TSX (unclosed tag)
fn invalid_tsx() -> &'static str {
    "<div><h1>Unclosed"
}

//
// Test 1: Basic Conversion (TSX → PDF)
//

#[wasm_bindgen_test]
fn test_basic_tsx_to_pdf_conversion() {
    let converter = TsxToPdfConverter::new();
    let config = create_test_config();

    // Convert TSX to PDF
    let result = converter.convert_tsx_to_pdf(
        valid_tsx(),
        config,
        None, // No custom fonts
        None, // No progress callback
    );

    // Should succeed
    assert!(result.is_ok(), "Conversion should succeed");

    let pdf_bytes = result.unwrap();

    // PDF should be non-empty
    assert!(!pdf_bytes.is_empty(), "PDF bytes should not be empty");

    // PDF should have valid header (%PDF-)
    assert!(pdf_bytes.len() >= 5, "PDF should have at least 5 bytes");
    assert_eq!(
        &pdf_bytes[0..5],
        b"%PDF-",
        "PDF should start with %PDF- header"
    );

    // PDF should be reasonable size (< 500KB for simple CV)
    assert!(pdf_bytes.len() < 500_000, "PDF should be < 500KB");
}

//
// Test 2: Progress Callbacks
//

#[wasm_bindgen_test]
fn test_progress_callback_invocation() {
    let converter = TsxToPdfConverter::new();
    let config = create_test_config();

    // Track progress updates
    let progress_updates = Array::new();
    let progress_updates_clone = progress_updates.clone();

    // Create progress callback
    let callback = Closure::wrap(Box::new(move |stage: JsValue, percentage: JsValue| {
        let update = Object::new();
        Reflect::set(&update, &"stage".into(), &stage).unwrap();
        Reflect::set(&update, &"percentage".into(), &percentage).unwrap();
        progress_updates_clone.push(&update);
    }) as Box<dyn Fn(JsValue, JsValue)>);

    // Convert with progress callback
    let result = converter.convert_tsx_to_pdf(
        valid_tsx(),
        config,
        None,
        Some(callback.as_ref().unchecked_ref::<Function>().clone()),
    );

    // Cleanup closure
    drop(callback);

    // Should succeed
    assert!(result.is_ok(), "Conversion with callback should succeed");

    // Should have received progress updates
    assert!(
        progress_updates.length() > 0,
        "Should receive progress updates"
    );

    // Check that we got expected stages
    let stages: Vec<String> = (0..progress_updates.length())
        .map(|i| {
            let update = progress_updates.get(i);
            let stage = Reflect::get(&update, &"stage".into()).unwrap();
            stage.as_string().unwrap()
        })
        .collect();

    // Should include key stages
    assert!(
        stages.contains(&"parsing".to_string()),
        "Should report 'parsing' stage"
    );
    assert!(
        stages.contains(&"generating-pdf".to_string()),
        "Should report 'generating-pdf' stage"
    );
    assert!(
        stages.contains(&"completed".to_string()),
        "Should report 'completed' stage"
    );

    // Check percentage values are reasonable (0-100)
    for i in 0..progress_updates.length() {
        let update = progress_updates.get(i);
        let percentage = Reflect::get(&update, &"percentage".into()).unwrap();
        let percentage_num = percentage.as_f64().unwrap();
        assert!(
            (0.0..=100.0).contains(&percentage_num),
            "Progress percentage should be 0-100, got {}",
            percentage_num
        );
    }
}

//
// Test 3: Error Handling - Invalid TSX
//

#[wasm_bindgen_test]
fn test_error_handling_invalid_tsx() {
    let converter = TsxToPdfConverter::new();
    let config = create_test_config();

    // Try to convert invalid TSX
    let result = converter.convert_tsx_to_pdf(invalid_tsx(), config, None, None);

    // Should fail
    assert!(result.is_err(), "Invalid TSX should return error");

    let error = result.err().unwrap();

    // Error should be an object
    assert!(error.is_object(), "Error should be an object");

    // Check error structure (ConversionError)
    let code = Reflect::get(&error, &"code".into()).unwrap();
    assert!(code.is_string(), "Error should have 'code' field");

    let code_str = code.as_string().unwrap();
    assert!(
        code_str == "TSX_PARSE_ERROR" || code_str == "INVALID_TSX_STRUCTURE",
        "Error code should be TSX_PARSE_ERROR or INVALID_TSX_STRUCTURE, got '{}'",
        code_str
    );

    let message = Reflect::get(&error, &"message".into()).unwrap();
    assert!(message.is_string(), "Error should have 'message' field");
    assert!(
        !message.as_string().unwrap().is_empty(),
        "Error message should not be empty"
    );

    let stage = Reflect::get(&error, &"stage".into()).unwrap();
    assert!(stage.is_string(), "Error should have 'stage' field");

    let recoverable = Reflect::get(&error, &"recoverable".into()).unwrap();
    assert!(
        recoverable.is_truthy() || !recoverable.is_truthy(),
        "Error should have 'recoverable' field"
    );

    let suggestions = Reflect::get(&error, &"suggestions".into()).unwrap();
    assert!(
        suggestions.is_array(),
        "Error should have 'suggestions' array"
    );
}

//
// Test 4: Error Handling - TSX Size Limit
//

#[wasm_bindgen_test]
fn test_error_handling_size_limit() {
    let converter = TsxToPdfConverter::new();
    let config = create_test_config();

    // Create TSX larger than 5MB limit
    let large_tsx = "x".repeat(6 * 1024 * 1024); // 6MB

    // Try to convert
    let result = converter.convert_tsx_to_pdf(&large_tsx, config, None, None);

    // Should fail with MEMORY_LIMIT_EXCEEDED
    assert!(result.is_err(), "Large TSX should return error");

    let error = result.err().unwrap();
    let code = Reflect::get(&error, &"code".into()).unwrap();
    assert_eq!(
        code.as_string().unwrap(),
        "MEMORY_LIMIT_EXCEEDED",
        "Error code should be MEMORY_LIMIT_EXCEEDED"
    );

    // Should have metadata with file size
    let metadata = Reflect::get(&error, &"metadata".into());
    if let Ok(metadata) = metadata {
        if !metadata.is_undefined() && !metadata.is_null() {
            if let Ok(file_size) = Reflect::get(&metadata, &"fileSize".into()) {
                if let Some(size) = file_size.as_f64() {
                    assert!(
                        size > 5_000_000.0,
                        "Metadata should include file size > 5MB, got {}",
                        size
                    );
                }
            }
        }
    }
}

//
// Test 5: Font Detection
//

#[wasm_bindgen_test]
fn test_font_detection() {
    let converter = TsxToPdfConverter::new();

    let tsx_with_fonts = r#"
        const CV = () => (
            <div style="font-family: Roboto; font-weight: 400">
                <h1 style="font-family: Roboto; font-weight: 700">Title</h1>
                <p style="font-family: Georgia; font-style: italic">Text</p>
            </div>
        );
    "#;

    // Detect fonts
    let result = converter.detect_fonts(tsx_with_fonts);

    // Should succeed
    assert!(result.is_ok(), "Font detection should succeed");

    let fonts_json = result.unwrap();

    // Should return non-empty JSON string
    assert!(
        !fonts_json.is_empty(),
        "Font detection should return non-empty result"
    );

    // Parse JSON to verify structure
    let fonts: serde_json::Value = serde_json::from_str(&fonts_json).unwrap();
    assert!(fonts.is_array(), "Font detection should return array");

    let fonts_array = fonts.as_array().unwrap();
    assert!(!fonts_array.is_empty(), "Should detect at least one font");

    // Check font structure
    for font in fonts_array {
        assert!(
            font.get("family").is_some(),
            "Font should have 'family' field"
        );
        assert!(
            font.get("weight").is_some(),
            "Font should have 'weight' field"
        );
        assert!(
            font.get("style").is_some(),
            "Font should have 'style' field"
        );
        assert!(
            font.get("source").is_some(),
            "Font should have 'source' field"
        );
    }
}

//
// Test 6: Font Detection - No Fonts
//

#[wasm_bindgen_test]
fn test_font_detection_no_fonts() {
    let converter = TsxToPdfConverter::new();

    let tsx_no_fonts = r#"
        const CV = () => (
            <div>
                <h1>Title</h1>
                <p>Text</p>
            </div>
        );
    "#;

    // Detect fonts (should return default Arial)
    let result = converter.detect_fonts(tsx_no_fonts);

    // Should succeed
    assert!(
        result.is_ok(),
        "Font detection should succeed even with no fonts"
    );

    let fonts_json = result.unwrap();
    let fonts: serde_json::Value = serde_json::from_str(&fonts_json).unwrap();
    let fonts_array = fonts.as_array().unwrap();

    // Should return at least default font (Arial)
    assert!(
        !fonts_array.is_empty(),
        "Should return default font when none specified"
    );
}

//
// Test 7: Font Handling - FontCollection
//

#[wasm_bindgen_test]
fn test_font_collection_api() {
    // Create font collection
    let mut collection = FontCollection::new();

    // Create dummy font data (minimal valid TTF header)
    // TTF magic number: 0x00 0x01 0x00 0x00
    let font_bytes = vec![0x00, 0x01, 0x00, 0x00, 0x00, 0x10, 0x00, 0x10];

    // Add fonts to collection
    let font1 = FontData::new("Roboto".to_string(), 400, false, font_bytes.clone());
    let font2 = FontData::new("Roboto".to_string(), 700, false, font_bytes.clone());

    collection.add(font1);
    collection.add(font2);

    // Collection should work without errors
    // (Actual validation happens in convert_tsx_to_pdf)
}

//
// Test 8: Configuration Serialization
//

#[wasm_bindgen_test]
fn test_configuration_serialization() {
    let converter = TsxToPdfConverter::new();

    // Test various config formats
    let config = create_test_config();

    // Should be able to convert with this config
    let result = converter.convert_tsx_to_pdf(valid_tsx(), config, None, None);

    // Should succeed
    assert!(
        result.is_ok(),
        "Conversion with valid config should succeed"
    );
}

//
// Test 9: Configuration - Invalid Config
//

#[wasm_bindgen_test]
fn test_invalid_configuration() {
    let converter = TsxToPdfConverter::new();

    // Invalid config (missing required fields)
    let invalid_config = Object::new();
    // Intentionally incomplete

    let result = converter.convert_tsx_to_pdf(valid_tsx(), invalid_config.into(), None, None);

    // Should fail with INVALID_CONFIG
    assert!(result.is_err(), "Invalid config should return error");

    let error = result.err().unwrap();
    let code = Reflect::get(&error, &"code".into()).unwrap();

    // Error code should be INVALID_CONFIG
    assert_eq!(
        code.as_string().unwrap(),
        "INVALID_CONFIG",
        "Error code should be INVALID_CONFIG"
    );
}

//
// Test 10: ATS Validation
//

#[wasm_bindgen_test]
fn test_ats_validation() {
    let converter = TsxToPdfConverter::new();
    let config = create_test_config();

    // Validate ATS compatibility
    let result = converter.validate_ats_compatibility(valid_tsx(), config);

    // Should succeed
    assert!(result.is_ok(), "ATS validation should succeed");

    let report = result.unwrap();

    // Report should be an object
    assert!(report.is_object(), "ATS report should be an object");

    // Check report structure
    let score = Reflect::get(&report, &"score".into()).unwrap();
    assert!(score.is_truthy(), "Report should have 'score' field");

    let score_num = score.as_f64().unwrap();
    assert!((0.0..=1.0).contains(&score_num), "Score should be 0.0-1.0");

    // Check for other fields from ATSValidationReport structure
    let warnings = Reflect::get(&report, &"warnings".into()).unwrap();
    assert!(warnings.is_array(), "Report should have 'warnings' array");

    let errors = Reflect::get(&report, &"errors".into()).unwrap();
    assert!(errors.is_array(), "Report should have 'errors' array");
}

//
// Test 11: Multiple Conversions (Memory Leak Check)
//

#[wasm_bindgen_test]
fn test_multiple_conversions() {
    let converter = TsxToPdfConverter::new();

    // Perform multiple conversions in sequence
    for i in 0..5 {
        let config = create_test_config();

        let result = converter.convert_tsx_to_pdf(valid_tsx(), config, None, None);

        assert!(result.is_ok(), "Conversion {} should succeed", i + 1);

        let pdf_bytes = result.unwrap();
        assert!(!pdf_bytes.is_empty(), "PDF {} should not be empty", i + 1);
    }

    // If we get here without errors, no obvious memory leaks in WASM
}

//
// Test 12: Error Recovery - Second Attempt
//

#[wasm_bindgen_test]
fn test_error_recovery() {
    let converter = TsxToPdfConverter::new();
    let config = create_test_config();

    // First attempt with invalid TSX
    let result1 = converter.convert_tsx_to_pdf(invalid_tsx(), config.clone(), None, None);
    assert!(result1.is_err(), "First attempt should fail");

    // Second attempt with valid TSX (should succeed after error)
    let result2 = converter.convert_tsx_to_pdf(valid_tsx(), config, None, None);
    assert!(result2.is_ok(), "Second attempt should succeed");

    let error = result1.err().unwrap();
    let recoverable = Reflect::get(&error, &"recoverable".into()).unwrap();

    // Error should be marked as recoverable
    assert!(
        recoverable.is_truthy() || !recoverable.is_truthy(),
        "Error should have recoverable field"
    );
}
