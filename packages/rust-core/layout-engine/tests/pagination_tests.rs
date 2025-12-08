//! Pagination integration tests
//!
//! Tests for multi-page pagination edge cases including boundary conditions,
//! orphan prevention, and page break handling.

mod common;

use common::{default_test_config, default_test_metadata};
use cv_domain::extract_tsx_layout_config_from_document;
use layout_engine::calculate_layout_direct;
use pdf_generator::config::{Margin, PDFConfig, PageSize};
use pdf_generator::PDFGenerator;
use std::sync::Arc;
use tsx_parser::parse_tsx;

/// Test content that exactly fills one page (at page boundary)
#[test]
fn test_content_exactly_at_page_boundary() {
    // Create content that fills exactly one Letter page (612 x 792 points)
    // With 1-inch margins (72 points), content area is 468 x 648 points
    let metadata = default_test_metadata();

    let tsx = r#"<div style="height: 648px">Content fills exactly one page</div>"#;
    let document = parse_tsx(tsx).expect("Failed to parse TSX");
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

    // Should create exactly 1 page, not 2
    assert_eq!(
        layout.pages.len(),
        1,
        "Content at exact page boundary should create 1 page, got {}",
        layout.pages.len()
    );
    assert!(
        !layout.pages[0].boxes.is_empty(),
        "Page should have content"
    );
}

/// Test that multi-page documents properly paginate content
#[test]
fn test_multipage_pagination() {
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

    assert!(
        !layout.pages.is_empty(),
        "Layout should have at least one page"
    );

    // Verify no empty pages
    for (idx, page) in layout.pages.iter().enumerate() {
        assert!(!page.boxes.is_empty(), "Page {} should not be empty", idx);
    }

    // Verify all boxes have valid positions
    for page in &layout.pages {
        for layout_box in &page.boxes {
            assert!(
                layout_box.x >= 0.0,
                "Box X coordinate should be non-negative"
            );
            assert!(
                layout_box.y >= 0.0,
                "Box Y coordinate should be non-negative"
            );
            assert!(layout_box.width > 0.0, "Box width should be positive");
            // Zero-height boxes are allowed for border rendering
            let has_border = layout_box.style.box_model.border_bottom.is_some();
            assert!(
                layout_box.height > 0.0 || has_border,
                "Box height should be positive (or zero for border boxes)"
            );
        }
    }
}

/// Test that page boundaries are respected and content doesn't overflow
#[test]
fn test_page_boundaries_respected() {
    let tsx = r#"
        <div>
            <p>Paragraph 1</p><p>Paragraph 2</p><p>Paragraph 3</p><p>Paragraph 4</p><p>Paragraph 5</p>
            <p>Paragraph 6</p><p>Paragraph 7</p><p>Paragraph 8</p><p>Paragraph 9</p><p>Paragraph 10</p>
        </div>
    "#;

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

    // Verify all boxes respect page boundaries
    let page_bottom = config.margin.top + 648.0; // Content height for Letter with 1" margins

    for (page_idx, page) in layout.pages.iter().enumerate() {
        for layout_box in &page.boxes {
            let box_bottom = layout_box.y + layout_box.height;
            assert!(
                box_bottom <= page_bottom + 1.0, // Allow 1pt tolerance for rounding
                "Page {}: Box at y={} with height={} exceeds page boundary {} (bottom at {})",
                page_idx + 1,
                layout_box.y,
                layout_box.height,
                page_bottom,
                box_bottom
            );
        }
    }

    assert!(!layout.pages.is_empty(), "Should create at least one page");
}

/// Test that no empty pages are created in complex layouts
#[test]
fn test_no_empty_pages_in_complex_layouts() {
    let tsx =
        include_str!("../../../../test-fixtures/tsx-samples/multi-page/02-three-page-academic.tsx");

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

    // Verify no empty pages exist
    for (idx, page) in layout.pages.iter().enumerate() {
        assert!(
            !page.boxes.is_empty(),
            "Page {} should not be empty in complex layout",
            idx + 1
        );
    }

    assert!(
        !layout.pages.is_empty(),
        "Layout should create at least one page"
    );

    // Verify PDF generation handles complex layout
    let mut generator = PDFGenerator::new(config).expect("Failed to create PDF generator");
    generator
        .render_layout(&layout)
        .expect("Failed to render layout");
    let pdf_bytes = generator.finalize().expect("Failed to generate PDF");

    assert!(
        pdf_bytes.len() > 2000,
        "Complex layout PDF should have content"
    );
}

/// Test that RECENT PROJECTS section is not orphaned in ATS-optimized CVs
///
/// The H2 "RECENT PROJECTS" should be on the same page as its H3 content.
/// This was a bug where the H3 would trigger threshold-based orphan prevention
/// and move to page 2, leaving the H2 orphaned on page 1.
#[test]
fn test_ats_optimized_recent_projects_not_orphaned() {
    let tsx = include_str!(
        "../../../../test-fixtures/tsx-samples/multi-page/03-two-page-ats-optimized.tsx"
    );

    let document = parse_tsx(tsx).expect("Failed to parse TSX");
    let metadata = default_test_metadata();
    let layout_config = extract_tsx_layout_config_from_document(&document);

    // Use zero margins like production
    let config = PDFConfig {
        page_size: PageSize::Letter,
        margin: Margin::from_inches(0.0),
        standard: pdf_generator::PDFStandard::PDF17,
        title: None,
        author: None,
        subject: None,
        keywords: None,
        creator: None,
        ats_weights: None,
        compress_content_streams: false,
        generate_bookmarks: false,
    };

    let layout = calculate_layout_direct(
        &document,
        &Arc::new(metadata),
        &layout_config,
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .expect("Failed to calculate layout");

    // Find which page has RECENT PROJECTS
    let recent_projects_page = layout.pages.iter().position(|page| {
        page.boxes.iter().any(|b| {
            if let layout_types::BoxContent::Text(lines) = &b.content {
                lines
                    .first()
                    .map_or(false, |l| l.contains("RECENT PROJECTS"))
            } else {
                false
            }
        })
    });

    let rp_page_idx = recent_projects_page.expect("RECENT PROJECTS should exist in layout");

    // Check that H3 content is on the same page as RECENT PROJECTS H2
    let has_h3_on_same_page = layout.pages[rp_page_idx]
        .boxes
        .iter()
        .any(|b| b.element_type == Some(layout_types::ElementType::Heading3));

    assert!(
        has_h3_on_same_page,
        "RECENT PROJECTS (H2) should have H3 content on the same page (page {})",
        rp_page_idx + 1
    );
}
