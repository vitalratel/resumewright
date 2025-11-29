//! Full Pipeline Smoke Tests for TSX to PDF Conversion
//!
//! Add full pipeline integration test
//!
//! These smoke tests validate the basic conversion pipeline from TSX → PDF.
//! Comprehensive E2E testing is performed by the TypeScript test suite.
//!
//! Smoke Test Coverage:
//! - Basic single-page conversion (minimal CV)
//! - Multi-page conversion (2-page traditional CV)
//! - Error recovery (invalid/empty TSX)
//!
//! Pipeline Components:
//! 1. tsx-parser - Parse TSX to AST
//! 2. cv-domain - Extract metadata
//! 3. react-renderer - Render to layout tree
//! 4. layout-engine - Calculate layout with positioning
//! 5. pdf-generator - Generate PDF bytes

use std::time::Instant;

// Import pipeline components
use cv_domain::{extract_metadata, extract_tsx_layout_config_from_document};
use layout_engine::calculate_layout_direct;
use pdf_generator::{Margin, PDFConfig, PDFGenerator, PDFStandard, PageSize};
use tsx_parser::parse_tsx;

/// Helper function to create default PDF config for tests
fn create_test_config() -> PDFConfig {
    PDFConfig {
        page_size: PageSize::Letter,
        margin: Margin {
            top: 36.0, // 0.5 inch
            right: 36.0,
            bottom: 36.0,
            left: 36.0,
        },
        standard: PDFStandard::PDF17,
        title: Some("Integration Test Resume".to_string()),
        author: None,
        subject: Some("Curriculum Vitae".to_string()),
        keywords: None,
        creator: Some("ResumeWright Integration Tests".to_string()),
        ats_weights: None,
        compress_content_streams: false,
        generate_bookmarks: true,
    }
}

/// Helper to validate PDF structure
fn validate_pdf_structure(pdf_bytes: &[u8]) {
    // Must have content
    assert!(!pdf_bytes.is_empty(), "PDF bytes should not be empty");

    // Must be at least 500 bytes (empty PDF is ~300 bytes, minimal content ~800 bytes)
    assert!(
        pdf_bytes.len() > 500,
        "PDF should be larger than 500 bytes (got {} bytes)",
        pdf_bytes.len()
    );

    // Must start with PDF magic number
    assert_eq!(&pdf_bytes[0..5], b"%PDF-", "PDF must have valid header");

    // Must end with EOF marker
    let pdf_string = String::from_utf8_lossy(pdf_bytes);
    assert!(pdf_string.contains("%%EOF"), "PDF must have EOF marker");
}

/// Helper to print test summary
fn print_test_summary(test_name: &str, duration: std::time::Duration, pdf_bytes: &[u8]) {
    let size_kb = pdf_bytes.len() as f64 / 1024.0;
    println!("\n┌─────────────────────────────────────────┐");
    println!("│ Test: {:<33} │", test_name);
    println!("├─────────────────────────────────────────┤");
    println!("│ Duration:  {:>7.2?}                    │", duration);
    println!("│ PDF Size:  {:>7.2} KB                 │", size_kb);
    println!("│ Status:    ✓ PASS                       │");
    println!("└─────────────────────────────────────────┘\n");
}

// =============================================================================
// Smoke Test 1: Minimal Valid CV (Basic Functionality)
// =============================================================================

/// Smoke test: Pipeline with minimal but valid CV
///
/// Validates:
/// - Pipeline works with smallest possible valid CV
/// - All 5 crates work together
/// - PDF output is valid
/// - Performance: <500ms
#[test]
fn test_full_pipeline_minimal_cv() {
    println!("\n🧪 Smoke Test: Full Pipeline - Minimal Valid CV");

    // Minimal valid CV
    let minimal_tsx = r#"
        const CV = () => (
            <div style="font-family: Helvetica; font-size: 12px; padding: 36px">
                <h1>Jane Doe</h1>
                <p>Software Engineer</p>
            </div>
        );
    "#;

    let start = Instant::now();

    // Full pipeline
    let document = parse_tsx(minimal_tsx).expect("tsx-parser should parse minimal CV");

    let metadata = extract_metadata(&document).expect("cv-domain should extract metadata");

    let layout_config = extract_tsx_layout_config_from_document(&document);

    let config = create_test_config();
    let measurer = pdf_generator::fonts::PDFTextMeasurer;
    let layout = calculate_layout_direct(&document, &metadata, &layout_config, &config, &measurer)
        .expect("layout-engine should calculate layout");

    let mut generator = PDFGenerator::new(config).expect("pdf-generator should initialize");

    generator
        .render_layout(&layout)
        .expect("pdf-generator should render layout");

    let pdf_bytes = generator
        .finalize()
        .expect("pdf-generator should finalize PDF");

    let duration = start.elapsed();

    // Validate PDF
    validate_pdf_structure(&pdf_bytes);

    // Performance assertion: <500ms
    assert!(
        duration.as_millis() < 500,
        "Minimal CV smoke test took {:?}, should be <500ms",
        duration
    );

    print_test_summary("Minimal Valid CV", duration, &pdf_bytes);
}

// =============================================================================
// Smoke Test 2: Two-Page Traditional CV (Multi-page)
// =============================================================================

/// Smoke test: Complete pipeline with realistic two-page CV
///
/// Validates:
/// - Multi-page layout and pagination
/// - Full pipeline with realistic fixture
/// - PDF output is valid and complete
/// - Performance: <500ms
#[test]
fn test_full_pipeline_two_page_traditional() {
    println!("\n🧪 Smoke Test: Full Pipeline - Two-Page Traditional CV");

    // Load realistic two-page CV fixture
    let fixture_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .join("test-fixtures/tsx-samples/multi-page/01-two-page-traditional.tsx");
    let tsx = std::fs::read_to_string(&fixture_path).expect("Failed to read two-page CV fixture");

    let start = Instant::now();

    // Stage 1: Parse TSX → AST
    let document = parse_tsx(&tsx).expect("tsx-parser should successfully parse two-page CV");
    assert!(
        !document.source.is_empty(),
        "Parsed document should have source"
    );

    // Stage 2: Extract metadata
    let metadata =
        extract_metadata(&document).expect("cv-domain should extract metadata from two-page CV");
    assert!(metadata.name.is_some(), "CV should have a name");

    // Stage 3: Extract layout config
    let layout_config = extract_tsx_layout_config_from_document(&document);

    // Stage 4: Calculate layout (with pagination)
    let config = create_test_config();
    let measurer = pdf_generator::fonts::PDFTextMeasurer;
    let layout = calculate_layout_direct(&document, &metadata, &layout_config, &config, &measurer)
        .expect("layout-engine should calculate layout for two-page CV");

    // Stage 5: Generate PDF
    let mut generator =
        PDFGenerator::new(config.clone()).expect("pdf-generator should initialize successfully");

    generator
        .render_layout(&layout)
        .expect("pdf-generator should render two-page layout");

    let pdf_bytes = generator
        .finalize()
        .expect("pdf-generator should finalize PDF successfully");

    let duration = start.elapsed();

    // Validate PDF output
    validate_pdf_structure(&pdf_bytes);

    // Verify multi-page content (should have multiple /Page objects)
    let pdf_string = String::from_utf8_lossy(&pdf_bytes);
    let page_count = pdf_string.matches("/Type/Page").count();
    let actual_pages = page_count.saturating_sub(1);
    assert!(
        actual_pages >= 2,
        "Two-page CV should have at least 2 PDF pages, found {}",
        actual_pages
    );

    // Performance assertion: <500ms
    assert!(
        duration.as_millis() < 500,
        "Two-page CV smoke test took {:?}, should be <500ms",
        duration
    );

    print_test_summary("Two-Page Traditional CV", duration, &pdf_bytes);
}

// Smoke Test 3: Six-Page Executive CV (Maximum Length)
/// Smoke test: Complete pipeline with realistic six-page CV
///
/// Validates:
/// - Pipeline handles maximum typical CV length (6 pages)
/// - Multi-page layout and pagination works for long content
/// - Performance target: <500ms total
#[test]
fn test_full_pipeline_six_page_executive() {
    println!("\n🧪 Smoke Test: Full Pipeline - Six-Page Executive CV");
    let start = Instant::now();

    // Load realistic six-page CV fixture
    let fixture_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .join("test-fixtures/tsx-samples/multi-page/03-six-page-executive.tsx");
    let tsx_content =
        std::fs::read_to_string(&fixture_path).expect("Failed to read six-page CV fixture");

    // Run pipeline
    let ast = parse_tsx(&tsx_content).expect("tsx-parser should successfully parse six-page CV");

    let metadata =
        extract_metadata(&ast).expect("cv-domain should extract metadata from six-page CV");

    let layout_config = extract_tsx_layout_config_from_document(&ast);

    let config = create_test_config();
    let measurer = pdf_generator::fonts::PDFTextMeasurer;
    let layout = calculate_layout_direct(&ast, &metadata, &layout_config, &config, &measurer)
        .expect("layout-engine should calculate layout for six-page CV");

    let mut generator =
        PDFGenerator::new(config.clone()).expect("pdf-generator should initialize successfully");

    generator
        .render_layout(&layout)
        .expect("pdf-generator should render six-page layout");

    let pdf_bytes = generator
        .finalize()
        .expect("pdf-generator should finalize PDF successfully");

    let duration = start.elapsed();

    // Validation
    validate_pdf_structure(&pdf_bytes);

    // Verify multi-page content
    let pdf_string = String::from_utf8_lossy(&pdf_bytes);
    let page_count = pdf_string.matches("/Type/Page").count();
    let actual_pages = page_count.saturating_sub(1);

    println!("  Pages generated: {}", actual_pages);
    println!("  Expected: ~6 pages");

    assert!(
        actual_pages >= 4,
        "Six-page CV should have at least 4 PDF pages (got {})",
        actual_pages
    );
    assert!(
        actual_pages <= 7,
        "Six-page CV should have at most 7 PDF pages (got {})",
        actual_pages
    );

    // Performance target: <500ms
    assert!(
        duration.as_millis() < 500,
        "Six-page CV smoke test took {:?}, should be <500ms",
        duration
    );

    print_test_summary("Six-Page Executive CV", duration, &pdf_bytes);
}

// =============================================================================
// Error Recovery Tests (Unit Tests - Keep These)
// =============================================================================

/// Test: Pipeline error handling with invalid TSX
///
/// Validates:
/// - tsx-parser correctly rejects invalid syntax
/// - Error propagates cleanly through pipeline
/// - No panics or crashes
#[test]
fn test_error_recovery_invalid_tsx() {
    println!("\n🧪 Testing: Error Recovery - Invalid TSX Syntax");

    // Invalid TSX: unclosed tags
    let invalid_tsx = r#"
        const CV = () => (
            <div style="font-family: Helvetica">
                <h1>John Doe</h1>
                <p>Software Engineer
                <!-- Missing closing tags -->
            </div>
        );
    "#;

    // Should fail at parse stage
    let result = parse_tsx(invalid_tsx);

    assert!(
        result.is_err(),
        "tsx-parser should reject invalid TSX syntax"
    );

    println!("✓ tsx-parser correctly rejected invalid TSX");
    println!("  Error: {:?}", result.unwrap_err());
}

/// Test: Pipeline error handling with empty TSX
///
/// Validates:
/// - Pipeline handles edge case of empty input
/// - Appropriate error returned
#[test]
fn test_error_recovery_empty_tsx() {
    println!("\n🧪 Testing: Error Recovery - Empty TSX");

    let empty_tsx = "";

    // Should fail at parse stage
    let result = parse_tsx(empty_tsx);

    assert!(result.is_err(), "tsx-parser should reject empty TSX");

    println!("✓ tsx-parser correctly rejected empty TSX");
    println!("  Error: {:?}", result.unwrap_err());
}
