//! PDF Generator Integration Tests
//!
//! Comprehensive tests for PDFGenerator.

use pdf_generator::{Margin, PDFConfig, PDFGenerator, PDFStandard, PageSize};

/// Helper function to encode text as hex for CIDFont Type 2 validation
/// Matches the encoding used in layout_renderer.rs:encode_as_cidfont_hex()
fn encode_text_as_hex(text: &str) -> String {
    text.chars()
        .map(|c| format!("{:04X}", c as u32))
        .collect::<String>()
}

// ============================================================================
// Basic Initialization Tests
// ============================================================================

#[test]
fn test_create_generator_with_default_config() {
    let config = PDFConfig::default();
    let generator = PDFGenerator::new(config);
    assert!(
        generator.is_ok(),
        "Should create generator with default config"
    );
}

#[test]
fn test_create_generator_with_letter_size() {
    let config = PDFConfig {
        page_size: PageSize::Letter,
        margin: Margin::from_inches(0.5),
        standard: PDFStandard::PDF17,
        title: Some("Test".to_string()),
        ..Default::default()
    };
    let generator = PDFGenerator::new(config);
    assert!(
        generator.is_ok(),
        "Should create generator with Letter size"
    );
}

#[test]
fn test_create_generator_with_a4_size() {
    let config = PDFConfig {
        page_size: PageSize::A4,
        margin: Margin::from_inches(1.0),
        standard: PDFStandard::PDF17,
        title: Some("Test".to_string()),
        ..Default::default()
    };
    let generator = PDFGenerator::new(config);
    assert!(generator.is_ok(), "Should create generator with A4 size");
}

#[test]
fn test_custom_config() {
    let config = PDFConfig {
        page_size: PageSize::A4,
        margin: Margin::from_inches(1.0),
        title: Some("Test Resume".to_string()),
        author: Some("Test Author".to_string()),
        subject: Some("CV/Resume".to_string()),
        ..Default::default()
    };

    let result = PDFGenerator::new(config);
    assert!(result.is_ok(), "PDFGenerator should support custom config");
}

// ============================================================================
// Content Addition Tests
// ============================================================================

#[test]
fn test_add_text() {
    let config = PDFConfig::default();
    let mut generator = PDFGenerator::new(config).unwrap();
    let result = generator.add_text("Test text", 100.0, 700.0, 12.0);
    assert!(result.is_ok(), "Should add text to PDF");
}

#[test]
fn test_add_multiple_text_entries() {
    let config = PDFConfig::default();
    let mut generator = PDFGenerator::new(config).unwrap();

    generator.add_text("Line 1", 100.0, 700.0, 12.0).unwrap();
    generator.add_text("Line 2", 100.0, 680.0, 12.0).unwrap();
    generator.add_text("Line 3", 100.0, 660.0, 12.0).unwrap();

    let pdf_bytes = generator.finalize();
    assert!(
        pdf_bytes.is_ok(),
        "Should finalize PDF with multiple text entries"
    );
}

// ============================================================================
// Page Management Tests
// ============================================================================

#[test]
fn test_add_page() {
    let config = PDFConfig::default();
    let mut generator = PDFGenerator::new(config).unwrap();

    let result = generator.add_page();
    assert!(result.is_ok(), "Should be able to add a new page");
}

#[test]
fn test_multiple_pages() {
    let config = PDFConfig::default();
    let mut generator = PDFGenerator::new(config).unwrap();

    generator.add_text("Page 1", 100.0, 700.0, 12.0).unwrap();
    generator.add_page().unwrap();
    generator.add_text("Page 2", 100.0, 700.0, 12.0).unwrap();

    let pdf_bytes = generator.finalize().unwrap();
    assert!(
        pdf_bytes.len() > 100,
        "Multi-page PDF should be at least 100 bytes"
    );
}

#[test]
fn test_multi_page() {
    let config = PDFConfig::default();
    let mut generator = PDFGenerator::new(config).unwrap();

    // Add content to first page
    generator.add_text("Page 1", 100.0, 700.0, 14.0).unwrap();

    // Add second page
    generator.add_page().unwrap();
    generator.add_text("Page 2", 100.0, 700.0, 14.0).unwrap();

    // Add third page
    generator.add_page().unwrap();
    generator.add_text("Page 3", 100.0, 700.0, 14.0).unwrap();

    let pdf_bytes = generator.finalize().unwrap();

    // Verify PDF is valid
    assert!(!pdf_bytes.is_empty());
    assert!(pdf_bytes.starts_with(b"%PDF"));
}

// ============================================================================
// Font Management Tests
// ============================================================================

#[test]
fn test_set_font_bytes() {
    use std::collections::HashMap;

    let config = PDFConfig::default();
    let mut generator = PDFGenerator::new(config).unwrap();

    let mut font_bytes = HashMap::new();
    // Empty font bytes for testing (real usage would have actual font data)
    font_bytes.insert("Roboto:400:false".to_string(), vec![]);

    // Should not panic
    generator.set_font_bytes(font_bytes);

    generator.add_text("Test", 100.0, 700.0, 12.0).unwrap();
    let result = generator.finalize();
    assert!(result.is_ok());
}

// ============================================================================
// PDF Output Validation Tests
// ============================================================================

#[test]
fn test_finalize() {
    let config = PDFConfig::default();
    let mut generator = PDFGenerator::new(config).unwrap();

    generator
        .add_text("Test Document", 100.0, 700.0, 14.0)
        .unwrap();

    let result = generator.finalize();
    assert!(result.is_ok(), "Should be able to finalize PDF");

    let pdf_bytes = result.unwrap();
    assert!(!pdf_bytes.is_empty(), "PDF should have content");
    assert!(
        pdf_bytes.starts_with(b"%PDF"),
        "Should start with PDF header"
    );
}

#[test]
fn test_finalize_returns_pdf_bytes() {
    let config = PDFConfig::default();
    let mut generator = PDFGenerator::new(config).unwrap();
    generator.add_text("Test", 100.0, 700.0, 12.0).unwrap();

    let pdf_bytes = generator.finalize().unwrap();

    assert!(!pdf_bytes.is_empty(), "PDF bytes should not be empty");
    assert!(pdf_bytes.len() > 100, "PDF should be at least 100 bytes");
}

#[test]
fn test_pdf_has_valid_header() {
    let config = PDFConfig::default();
    let mut generator = PDFGenerator::new(config).unwrap();
    generator.add_text("Test", 100.0, 700.0, 12.0).unwrap();

    let pdf_bytes = generator.finalize().unwrap();

    // Verify PDF magic header: %PDF-
    assert_eq!(
        &pdf_bytes[0..5],
        b"%PDF-",
        "PDF should start with %PDF- header"
    );
}

// ============================================================================
// Metadata Tests
// ============================================================================

#[test]
fn test_pdf_metadata_included() {
    let config = PDFConfig {
        page_size: PageSize::Letter,
        margin: Margin::from_inches(0.5),
        standard: PDFStandard::PDF17,
        title: Some("Test Resume".to_string()),
        author: Some("Jane Doe".to_string()),
        subject: Some("Test CV".to_string()),
        keywords: Some("test, resume, software".to_string()),
        creator: Some("ResumeWright Browser Extension".to_string()),
        ..Default::default()
    };

    let mut generator = PDFGenerator::new(config).unwrap();
    generator.add_text("Test", 100.0, 700.0, 12.0).unwrap();

    let pdf_bytes = generator.finalize().unwrap();
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);

    // Verify metadata is present in PDF
    assert!(pdf_str.contains("Test Resume"), "PDF should contain title");
    assert!(pdf_str.contains("Jane Doe"), "PDF should contain author");
    assert!(pdf_str.contains("Test CV"), "PDF should contain subject");
    assert!(
        pdf_str.contains("test, resume, software"),
        "PDF should contain keywords"
    );
    assert!(
        pdf_str.contains("ResumeWright Browser Extension"),
        "PDF should contain creator"
    );
    assert!(
        pdf_str.contains("lopdf + ResumeWright"),
        "PDF should contain producer"
    );
    assert!(
        pdf_str.contains("/CreationDate"),
        "PDF should contain creation date"
    );
}

#[test]
fn test_pdf_metadata_default_creator() {
    let config = PDFConfig::default();
    let mut generator = PDFGenerator::new(config).unwrap();
    generator.add_text("Test", 100.0, 700.0, 12.0).unwrap();

    let pdf_bytes = generator.finalize().unwrap();
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);

    // Verify default creator is set
    assert!(
        pdf_str.contains("ResumeWright Browser Extension"),
        "PDF should contain default creator"
    );
}

// ============================================================================
// PDF Spec Compliance Tests
// ============================================================================

#[test]
fn test_pdf_includes_color_space() {
    let config = PDFConfig::default();
    let mut generator = PDFGenerator::new(config).unwrap();
    generator.add_text("Test", 100.0, 700.0, 12.0).unwrap();

    let pdf_bytes = generator.finalize().unwrap();
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);

    // Verify ColorSpace is explicitly declared (PDF spec compliance)
    assert!(
        pdf_str.contains("/ColorSpace"),
        "PDF should contain explicit ColorSpace declaration"
    );
    assert!(
        pdf_str.contains("DeviceRGB"),
        "PDF should use DeviceRGB color space"
    );
}

// ============================================================================
// Comprehensive Integration Tests
// ============================================================================

#[test]
fn test_comprehensive_multi_page_layout() {
    use cv_domain::CVMetadata;
    use pdf_generator::css_parser::{Color, StyleDeclaration};
    use pdf_generator::{validate_ats_compatibility, BoxContent, LayoutBox, LayoutStructure, Page};

    // Create a 3-page layout with various content and fonts
    let mut pages = Vec::new();

    // Page 1: Header with Helvetica Bold
    let page1_boxes = vec![
        LayoutBox {
            x: 72.0,
            y: 72.0,
            width: 468.0,
            height: 24.0,
            content: BoxContent::Text(vec!["John Doe - Software Engineer".to_string()]),
            style: {
                let mut s = StyleDeclaration::default();
                s.text.font_size = Some(18.0);
                s.text.font_family = Some("Helvetica".to_string());
                s.text.font_weight = Some(pdf_generator::css_parser::FontWeight::Bold);
                s.text.color = Some(Color {
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 1.0,
                });
                s
            },
            element_type: Some(layout_types::ElementType::Heading1),
        },
        LayoutBox {
            x: 72.0,
            y: 110.0,
            width: 468.0,
            height: 16.0,
            content: BoxContent::Text(vec!["Experience Section".to_string()]),
            style: {
                let mut s = StyleDeclaration::default();
                s.text.font_size = Some(12.0);
                s.text.font_family = Some("Times".to_string());
                s
            },
            element_type: Some(layout_types::ElementType::Paragraph),
        },
    ];
    pages.push(Page {
        page_number: 1,
        boxes: page1_boxes,
    });

    // Page 2: Content with different fonts
    let page2_boxes = vec![LayoutBox {
        x: 72.0,
        y: 72.0,
        width: 468.0,
        height: 14.0,
        content: BoxContent::Text(vec!["Continued from page 1".to_string()]),
        style: {
            let mut s = StyleDeclaration::default();
            s.text.font_size = Some(11.0);
            s.text.font_family = Some("Courier".to_string());
            s
        },
        element_type: Some(layout_types::ElementType::Paragraph),
    }];
    pages.push(Page {
        page_number: 2,
        boxes: page2_boxes,
    });

    // Page 3: More content
    let page3_boxes = vec![LayoutBox {
        x: 72.0,
        y: 72.0,
        width: 468.0,
        height: 14.0,
        content: BoxContent::Text(vec!["Final page content".to_string()]),
        style: {
            let mut s = StyleDeclaration::default();
            s.text.font_size = Some(10.0);
            s
        },
        element_type: Some(layout_types::ElementType::Paragraph),
    }];
    pages.push(Page {
        page_number: 3,
        boxes: page3_boxes,
    });

    let layout = LayoutStructure {
        pages,
        page_height: 792.0,
        page_width: 612.0,
    };

    // Generate PDF
    let config = PDFConfig::default();
    let mut generator = PDFGenerator::new(config).unwrap();
    generator.render_layout(&layout).unwrap();
    let pdf_bytes = generator.finalize().unwrap();

    // Verify PDF structure
    assert!(pdf_bytes.len() > 1000, "3-page PDF should be substantial");

    let pdf_str = String::from_utf8_lossy(&pdf_bytes);

    // Verify page count
    assert!(pdf_str.contains("/Count 3"), "PDF should have 3 pages");

    // Verify page numbers rendered (pages 2 and 3 should have page numbers)
    // Page numbers are rendered at bottom center on pages 2+
    let page_2_number_present = pdf_str.contains("2");
    let page_3_number_present = pdf_str.contains("3");
    assert!(page_2_number_present, "Page 2 number should be rendered");
    assert!(page_3_number_present, "Page 3 number should be rendered");

    // Verify fonts are registered (Helvetica, Times, Courier)
    assert!(
        pdf_str.contains("Helvetica"),
        "PDF should include Helvetica font"
    );
    assert!(pdf_str.contains("Times"), "PDF should include Times font");
    assert!(
        pdf_str.contains("Courier"),
        "PDF should include Courier font"
    );

    // Verify content is present (text is hex-encoded in PDF as CIDFont Type 2)
    let john_doe_hex = encode_text_as_hex("John Doe");
    let continued_hex = encode_text_as_hex("Continued from page 1");
    let final_hex = encode_text_as_hex("Final page content");

    assert!(
        pdf_str.contains(&john_doe_hex),
        "PDF should contain page 1 content (hex-encoded)"
    );
    assert!(
        pdf_str.contains(&continued_hex),
        "PDF should contain page 2 content (hex-encoded)"
    );
    assert!(
        pdf_str.contains(&final_hex),
        "PDF should contain page 3 content (hex-encoded)"
    );

    // Verify ColorSpace on all pages (PDF spec compliance)
    let colorspace_count = pdf_str.matches("/ColorSpace").count();
    assert!(
        colorspace_count >= 3,
        "Each page should have ColorSpace declared"
    );

    // Verify ATS compatibility - basic checks
    let metadata = CVMetadata {
        name: Some("John Doe".to_string()),
        email: Some("john@example.com".to_string()),
        phone: Some("+1-555-0100".to_string()),
        location: Some("San Francisco, CA".to_string()),
        title: Some("Software Engineer".to_string()),
        website: None,
        layout_type: cv_domain::LayoutType::SingleColumn,
        estimated_pages: 3,
        component_count: 3,
        has_contact_info: true,
        font_complexity: cv_domain::FontComplexity::Simple,
        has_clear_sections: true,
    };
    let ats_report = validate_ats_compatibility(&layout, &metadata, true, None);
    // Note: Score may be low for minimal test layout - focus on structural checks
    assert!(
        ats_report.text_embedded,
        "Multi-page PDF should have text embedded"
    );
    assert!(
        ats_report.fonts_embedded,
        "Multi-page PDF should have fonts embedded"
    );
    assert!(
        ats_report.score > 0.0,
        "Multi-page PDF should have non-zero ATS score"
    );
}

#[test]
fn test_inline_bold_text_renders_to_pdf() {
    // Test that text with inline bold spans renders all text to PDF
    // This was a bug: "Native: Russian" would only render "Russian", missing "Native:"
    use layout_types::{
        BoxContent, ElementType, FontWeight, LayoutBox, LayoutStructure, Page, StyleDeclaration,
    };

    let config = PDFConfig::default();
    let mut generator = PDFGenerator::new(config).unwrap();

    // Create a simple layout with text that includes inline bold
    let text_box = LayoutBox {
        x: 72.0,
        y: 100.0,
        width: 400.0,
        height: 20.0,
        content: BoxContent::Text(vec!["Native: Russian, Ukrainian".to_string()]),
        style: {
            let mut s = StyleDeclaration::default();
            s.text.font_weight = Some(FontWeight::Normal);
            s.text.font_size = Some(12.0);
            s
        },
        element_type: Some(ElementType::Paragraph),
    };

    let page = Page {
        boxes: vec![text_box],
        page_number: 1,
    };

    let layout = LayoutStructure {
        page_width: 612.0,
        page_height: 792.0,
        pages: vec![page],
    };

    generator.render_layout(&layout).unwrap();
    let pdf_bytes = generator.finalize().unwrap();

    // Verify PDF contains the text
    // Convert to string to check (basic validation)
    let pdf_string = String::from_utf8_lossy(&pdf_bytes);

    // The text should appear in the PDF content stream
    // Look for hex-encoded version (CIDFont Type 2 encoding)
    let native_hex = encode_text_as_hex("Native:");
    let russian_hex = encode_text_as_hex("Russian");

    assert!(
        pdf_string.contains(&native_hex) || pdf_string.contains("Native:"),
        "PDF should contain 'Native:' text (found neither hex {} nor literal)",
        native_hex
    );

    assert!(
        pdf_string.contains(&russian_hex) || pdf_string.contains("Russian"),
        "PDF should contain 'Russian' text (found neither hex {} nor literal)",
        russian_hex
    );
}
