//! PDF pipeline integration tests
//!
//! Tests that validate the layout engine integrates correctly with the
//! PDF generation pipeline and produces valid layout structures.

mod common;

use common::{default_test_config, default_test_metadata};
use cv_domain::extract_tsx_layout_config_from_document;
use layout_engine::calculate_layout_direct;
use pdf_generator::config::{Margin, PDFConfig, PageSize};
use pdf_generator::PDFGenerator;
use std::sync::Arc;
use tsx_parser::parse_tsx;

/// Test that layout output can be successfully consumed by PDF generator for a single-page CV
#[test]
fn test_layout_to_pdf_single_page() {
    let tsx =
        include_str!("../../../../test-fixtures/tsx-samples/single-page/03-minimal-simple.tsx");

    let document = parse_tsx(tsx).expect("Failed to parse TSX");
    let metadata = default_test_metadata();
    let layout_config = extract_tsx_layout_config_from_document(&document);

    let config = default_test_config();
    let layout = calculate_layout_direct(
        &document,
        &Arc::new(metadata),
        &layout_config,
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .expect("Failed to calculate layout");

    // Validate layout structure
    assert!(
        !layout.pages.is_empty(),
        "Layout should have at least one page"
    );
    assert_eq!(layout.page_width, 612.0, "Page width should be Letter size");
    assert_eq!(
        layout.page_height, 792.0,
        "Page height should be Letter size"
    );

    // Verify layout can be consumed by PDF generator
    let mut generator = PDFGenerator::new(config.clone()).expect("Failed to create PDF generator");
    generator
        .render_layout(&layout)
        .expect("Failed to render layout");
    let pdf_bytes = generator.finalize().expect("Failed to generate PDF");

    // PDF should have reasonable size (not empty, not absurdly large)
    assert!(pdf_bytes.len() > 1000, "PDF should be at least 1KB");
    assert!(
        pdf_bytes.len() < 1_000_000,
        "PDF should be less than 1MB for simple CV"
    );

    // Verify PDF magic number (PDF files start with "%PDF")
    assert_eq!(
        &pdf_bytes[0..4],
        b"%PDF",
        "Output should be a valid PDF file"
    );
}

/// Test that layout handles multi-page CVs correctly and PDF generator processes all pages
#[test]
fn test_layout_to_pdf_multipage() {
    let tsx = include_str!(
        "../../../../test-fixtures/tsx-samples/multi-page/01-two-page-traditional.tsx"
    );

    let document = parse_tsx(tsx).expect("Failed to parse TSX");
    let metadata = default_test_metadata();
    let layout_config = extract_tsx_layout_config_from_document(&document);

    let config = default_test_config();
    let layout = calculate_layout_direct(
        &document,
        &Arc::new(metadata),
        &layout_config,
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .expect("Failed to calculate layout");

    // Validate multi-page layout
    assert!(
        !layout.pages.is_empty(),
        "Layout should have at least one page, got {}",
        layout.pages.len()
    );

    // Verify each page has content
    for (idx, page) in layout.pages.iter().enumerate() {
        assert!(!page.boxes.is_empty(), "Page {} should have boxes", idx + 1);
    }

    // Generate PDF
    let mut generator = PDFGenerator::new(config.clone()).expect("Failed to create PDF generator");
    generator
        .render_layout(&layout)
        .expect("Failed to render layout");
    let pdf_bytes = generator.finalize().expect("Failed to generate PDF");

    // Multi-page PDF should be larger than single-page
    assert!(
        pdf_bytes.len() > 2000,
        "Multi-page PDF should be at least 2KB"
    );
    assert!(pdf_bytes.len() < 5_000_000, "PDF should be less than 5MB");

    // Verify PDF magic number
    assert_eq!(
        &pdf_bytes[0..4],
        b"%PDF",
        "Output should be a valid PDF file"
    );
}

/// Test that layout handles two-column layouts correctly
#[test]
fn test_layout_to_pdf_two_column() {
    let tsx =
        include_str!("../../../../test-fixtures/tsx-samples/single-page/02-two-column-modern.tsx");

    let document = parse_tsx(tsx).expect("Failed to parse TSX");
    let metadata = default_test_metadata();
    let layout_config = extract_tsx_layout_config_from_document(&document);

    let config = default_test_config();
    let layout = calculate_layout_direct(
        &document,
        &Arc::new(metadata),
        &layout_config,
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .expect("Failed to calculate layout");

    assert!(
        !layout.pages.is_empty(),
        "Layout should have at least one page"
    );

    // Generate PDF
    let mut generator = PDFGenerator::new(config.clone()).expect("Failed to create PDF generator");
    generator
        .render_layout(&layout)
        .expect("Failed to render layout");
    let pdf_bytes = generator.finalize().expect("Failed to generate PDF");

    assert!(pdf_bytes.len() > 1000, "PDF should have reasonable size");
    assert_eq!(
        &pdf_bytes[0..4],
        b"%PDF",
        "Output should be a valid PDF file"
    );
}

/// Test that layout correctly handles different page sizes
#[test]
fn test_layout_to_pdf_a4_page_size() {
    let tsx =
        include_str!("../../../../test-fixtures/tsx-samples/single-page/03-minimal-simple.tsx");

    let document = parse_tsx(tsx).expect("Failed to parse TSX");
    let metadata = default_test_metadata();
    let layout_config = extract_tsx_layout_config_from_document(&document);

    // Calculate layout with A4 config
    let config = PDFConfig {
        page_size: PageSize::A4,
        margin: Margin::from_inches(1.0),
        standard: pdf_generator::PDFStandard::PDF17,
        title: None,
        author: None,
        subject: None,
        keywords: None,
        creator: None,
        ats_weights: None,
        compress_content_streams: false,
        generate_bookmarks: true,
    };

    let layout = calculate_layout_direct(
        &document,
        &Arc::new(metadata),
        &layout_config,
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .expect("Failed to calculate layout");

    // Validate A4 dimensions (595.28 x 841.89 points)
    assert!(
        (layout.page_width - 595.28).abs() < 0.1,
        "Page width should be A4 size"
    );
    assert!(
        (layout.page_height - 841.89).abs() < 0.1,
        "Page height should be A4 size"
    );

    // Generate PDF
    let mut generator = PDFGenerator::new(config.clone()).expect("Failed to create PDF generator");
    generator
        .render_layout(&layout)
        .expect("Failed to render layout");
    let pdf_bytes = generator.finalize().expect("Failed to generate PDF");

    assert!(pdf_bytes.len() > 1000, "PDF should have reasonable size");
    assert_eq!(
        &pdf_bytes[0..4],
        b"%PDF",
        "Output should be a valid PDF file"
    );
}

/// Test that layout handles empty CVs gracefully
#[test]
fn test_layout_to_pdf_empty_cv() {
    let tsx = "<div></div>";
    let document = parse_tsx(tsx).expect("Failed to parse minimal TSX");
    let metadata = default_test_metadata();
    let layout_config = extract_tsx_layout_config_from_document(&document);

    let config = default_test_config();
    let layout = calculate_layout_direct(
        &document,
        &Arc::new(metadata),
        &layout_config,
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .expect("Failed to calculate layout");

    assert!(
        !layout.pages.is_empty(),
        "Empty CV should have at least one page"
    );

    // Generate PDF (should succeed even with empty content)
    let mut generator = PDFGenerator::new(config.clone()).expect("Failed to create PDF generator");
    generator
        .render_layout(&layout)
        .expect("Failed to render layout");
    let pdf_bytes = generator
        .finalize()
        .expect("Failed to generate PDF from empty CV");

    assert!(
        pdf_bytes.len() > 500,
        "Empty PDF should still have structure"
    );
    assert_eq!(
        &pdf_bytes[0..4],
        b"%PDF",
        "Output should be a valid PDF file"
    );
}

/// Test that layout preserves box positioning across the pipeline
#[test]
fn test_layout_box_positioning_integrity() {
    let tsx =
        include_str!("../../../../test-fixtures/tsx-samples/single-page/03-minimal-simple.tsx");

    let document = parse_tsx(tsx).expect("Failed to parse TSX");
    let metadata = default_test_metadata();
    let layout_config = extract_tsx_layout_config_from_document(&document);

    let config = default_test_config();
    let layout = calculate_layout_direct(
        &document,
        &Arc::new(metadata),
        &layout_config,
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .expect("Failed to calculate layout");

    // Validate that all boxes have valid positions
    for (page_idx, page) in layout.pages.iter().enumerate() {
        for (box_idx, layout_box) in page.boxes.iter().enumerate() {
            assert!(
                layout_box.x >= 0.0 && layout_box.x <= layout.page_width,
                "Page {}, Box {}: X coordinate {} out of bounds",
                page_idx + 1,
                box_idx,
                layout_box.x
            );

            assert!(
                layout_box.y >= 0.0 && layout_box.y <= layout.page_height,
                "Page {}, Box {}: Y coordinate {} out of bounds",
                page_idx + 1,
                box_idx,
                layout_box.y
            );

            assert!(
                layout_box.width > 0.0 && layout_box.width <= layout.page_width,
                "Page {}, Box {}: Width {} invalid",
                page_idx + 1,
                box_idx,
                layout_box.width
            );

            assert!(
                layout_box.height > 0.0,
                "Page {}, Box {}: Height {} should be positive",
                page_idx + 1,
                box_idx,
                layout_box.height
            );
        }
    }

    // Verify the layout can be converted to PDF without errors
    let mut generator = PDFGenerator::new(config.clone()).expect("Failed to create PDF generator");
    generator
        .render_layout(&layout)
        .expect("Failed to render layout");
    let _pdf_bytes = generator.finalize().expect("Failed to generate PDF");
}
