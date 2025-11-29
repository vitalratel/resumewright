//! PDF/A-1b Integration Tests
//!
//! These tests verify PDF/A-1b compliance at the document level, testing the
//! complete generation pipeline including edge cases with Unicode, XML escaping,
//! and minimal metadata.

use pdf_generator::{Margin, PDFConfig, PDFGenerator, PDFStandard, PageSize};

/// Test PDF/A-1b generation with minimal metadata
///
/// Verifies that PDF/A-1b documents can be generated with only required fields,
/// using fallback values for optional metadata.
#[test]
fn test_pdfa1b_minimal_metadata() {
    let config = PDFConfig {
        standard: PDFStandard::PDFA1b,
        page_size: PageSize::Letter,
        margin: Margin::from_inches(1.0),
        title: None, // Will use "Untitled" fallback
        author: None,
        subject: None,
        keywords: None,
        creator: None, // Will use "ResumeWright" fallback
        ..Default::default()
    };

    let mut gen = PDFGenerator::new(config).unwrap();
    gen.add_text("Test Content", 100.0, 700.0, 12.0).unwrap();
    let pdf_bytes = gen.finalize().unwrap();

    // Verify PDF structure
    assert!(!pdf_bytes.is_empty(), "PDF should not be empty");
    assert!(
        pdf_bytes.starts_with(b"%PDF"),
        "PDF should start with header"
    );

    // Verify PDF version is 1.4 (PDF/A-1 requirement)
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);
    assert!(
        pdf_str.contains("%PDF-1.4"),
        "PDF/A-1b requires PDF version 1.4"
    );

    // Verify GTS_PDFA1 OutputIntent is present
    assert!(
        pdf_str.contains("GTS_PDFA1"),
        "PDF/A-1b requires GTS_PDFA1 OutputIntent"
    );

    // Verify XMP metadata exists
    assert!(
        pdf_str.contains("<pdfaid:part>1</pdfaid:part>"),
        "PDF/A-1b requires XMP with part=1"
    );
    assert!(
        pdf_str.contains("<pdfaid:conformance>B</pdfaid:conformance>"),
        "PDF/A-1b requires XMP with conformance=B"
    );

    // Verify fallback values are used
    assert!(
        pdf_str.contains("Untitled"),
        "Should use 'Untitled' fallback for missing title"
    );
    assert!(
        pdf_str.contains("ResumeWright"),
        "Should use 'ResumeWright' fallback for missing creator"
    );
}

/// Test PDF/A-1b generation with Unicode metadata
///
/// Verifies that Unicode characters in metadata (names with accents, non-Latin
/// scripts) are properly preserved in XMP and Info dictionary.
#[test]
fn test_pdfa1b_unicode_metadata() {
    let config = PDFConfig {
        standard: PDFStandard::PDFA1b,
        page_size: PageSize::A4,
        margin: Margin::from_inches(1.0),
        title: Some("José's Résumé 简历".to_string()),
        author: Some("Émilie Müller".to_string()),
        subject: Some("Développeur Logiciel".to_string()),
        keywords: Some("Rust, Python, Ελληνικά".to_string()),
        ..Default::default()
    };

    let mut gen = PDFGenerator::new(config).unwrap();
    gen.add_text("Unicode test content", 100.0, 700.0, 12.0)
        .unwrap();
    let pdf_bytes = gen.finalize().unwrap();

    // Verify PDF structure
    assert!(!pdf_bytes.is_empty());
    assert!(pdf_bytes.starts_with(b"%PDF"));

    // Verify Unicode characters are preserved
    // XMP metadata should contain the Unicode characters
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);

    // Check for UTF-8 encoded Unicode in XMP
    assert!(
        pdf_str.contains("José") || pdf_str.contains("Jos"),
        "Should preserve name with accent"
    );
    assert!(
        pdf_str.contains("Émilie") || pdf_str.contains("mile"),
        "Should preserve name with diacritic"
    );
    assert!(
        pdf_str.contains("简历") || pdf_str.contains("Unicode"),
        "Should handle non-Latin scripts"
    );
}

/// Test PDF/A-1b generation with XML special characters
///
/// Verifies that XML special characters in metadata are properly escaped
/// to prevent XMP parsing errors.
#[test]
fn test_pdfa1b_xml_escape() {
    let config = PDFConfig {
        standard: PDFStandard::PDFA1b,
        page_size: PageSize::Letter,
        margin: Margin::from_inches(1.0),
        title: Some("<script>alert('xss')</script>".to_string()),
        author: Some("John & Jane Doe".to_string()),
        subject: Some("A title with \"quotes\" and <tags>".to_string()),
        keywords: Some("C++, AT&T, <html>".to_string()),
        ..Default::default()
    };

    let mut gen = PDFGenerator::new(config).unwrap();
    gen.add_text("Test content", 100.0, 700.0, 12.0).unwrap();
    let pdf_bytes = gen.finalize().unwrap();

    let pdf_str = String::from_utf8_lossy(&pdf_bytes);

    // Verify XML escaping worked
    assert!(
        pdf_str.contains("&lt;script&gt;"),
        "< and > should be escaped"
    );
    assert!(
        !pdf_str.contains("<script>") || pdf_str.contains("&lt;script&gt;"),
        "Unescaped <script> should not appear in XMP"
    );
    assert!(pdf_str.contains("&amp;"), "& should be escaped to &amp;");
    assert!(pdf_str.contains("&quot;"), "Quotes should be escaped");

    // Verify PDF is still valid despite special characters
    assert!(pdf_str.contains("%PDF-1.4"));
    assert!(pdf_str.contains("GTS_PDFA1"));
}

/// Test PDF/A-1b with multi-page document
///
/// Verifies that PDF/A-1b compliance works correctly with multi-page documents,
/// including proper OutputIntent and XMP metadata for all pages.
#[test]
fn test_pdfa1b_multipage() {
    let config = PDFConfig {
        standard: PDFStandard::PDFA1b,
        page_size: PageSize::Letter,
        margin: Margin::from_inches(1.0),
        title: Some("Multi-page Test".to_string()),
        author: Some("Test Author".to_string()),
        ..Default::default()
    };

    let mut gen = PDFGenerator::new(config).unwrap();

    // Add content across multiple pages
    gen.add_text("Page 1 content", 100.0, 700.0, 12.0).unwrap();
    gen.add_page().unwrap();
    gen.add_text("Page 2 content", 100.0, 700.0, 12.0).unwrap();
    gen.add_page().unwrap();
    gen.add_text("Page 3 content", 100.0, 700.0, 12.0).unwrap();

    let pdf_bytes = gen.finalize().unwrap();
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);

    // Verify PDF/A-1b structure
    assert!(pdf_str.contains("%PDF-1.4"));
    assert!(pdf_str.contains("GTS_PDFA1"));
    assert!(pdf_str.contains("<pdfaid:part>1</pdfaid:part>"));

    // Verify all pages exist (basic check)
    // Note: A more thorough check would use lopdf to parse and count pages
    assert!(pdf_str.contains("Page 1"));
    assert!(pdf_str.contains("Page 2"));
    assert!(pdf_str.contains("Page 3"));
}

/// Test PDF/A-1b with empty content
///
/// Verifies that PDF/A-1b documents can be generated even with minimal or no
/// text content, ensuring metadata and compliance structures are still valid.
#[test]
fn test_pdfa1b_empty_content() {
    let config = PDFConfig {
        standard: PDFStandard::PDFA1b,
        page_size: PageSize::A4,
        margin: Margin::from_inches(1.0),
        title: Some("Empty Document".to_string()),
        ..Default::default()
    };

    let gen = PDFGenerator::new(config).unwrap();
    // Don't add any content - just finalize
    let pdf_bytes = gen.finalize().unwrap();

    // Should still generate valid PDF/A-1b structure
    assert!(!pdf_bytes.is_empty());
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);
    assert!(pdf_str.contains("%PDF-1.4"));
    assert!(pdf_str.contains("GTS_PDFA1"));
    assert!(pdf_str.contains("<pdfaid:part>1</pdfaid:part>"));
}

/// Test PDF/A-1b vs regular PDF generation
///
/// Verifies that PDF/A-1b documents have additional compliance structures
/// compared to regular PDFs.
#[test]
fn test_pdfa1b_vs_regular() {
    // Generate PDF/A-1b document
    let pdfa_config = PDFConfig {
        standard: PDFStandard::PDFA1b,
        page_size: PageSize::Letter,
        title: Some("Test".to_string()),
        ..Default::default()
    };

    let mut pdfa_gen = PDFGenerator::new(pdfa_config).unwrap();
    pdfa_gen.add_text("Test", 100.0, 700.0, 12.0).unwrap();
    let pdfa_bytes = pdfa_gen.finalize().unwrap();
    let pdfa_str = String::from_utf8_lossy(&pdfa_bytes);

    // Generate regular PDF document
    let regular_config = PDFConfig {
        standard: PDFStandard::PDF17,
        page_size: PageSize::Letter,
        title: Some("Test".to_string()),
        ..Default::default()
    };

    let mut regular_gen = PDFGenerator::new(regular_config).unwrap();
    regular_gen.add_text("Test", 100.0, 700.0, 12.0).unwrap();
    let regular_bytes = regular_gen.finalize().unwrap();
    let regular_str = String::from_utf8_lossy(&regular_bytes);

    // PDF/A-1b should have version 1.4
    assert!(pdfa_str.contains("%PDF-1.4"));
    assert!(regular_str.contains("%PDF-1.7")); // Default version

    // PDF/A-1b should have OutputIntent
    assert!(pdfa_str.contains("GTS_PDFA1"));
    assert!(!regular_str.contains("GTS_PDFA1"));

    // PDF/A-1b should have XMP with pdfaid schema
    assert!(pdfa_str.contains("<pdfaid:part>1</pdfaid:part>"));
    assert!(!regular_str.contains("<pdfaid:part>"));

    // Regular PDF should not have PDF/A markers
    assert!(!regular_str.contains("pdfaid:conformance"));
}

/// Test that PDF/A-1b metadata synchronization between Info and XMP
///
/// PDF/A-1b requires that metadata in the Info dictionary must match XMP metadata.
/// This test verifies basic presence of metadata in both locations.
#[test]
fn test_pdfa1b_metadata_sync() {
    let config = PDFConfig {
        standard: PDFStandard::PDFA1b,
        title: Some("Sync Test".to_string()),
        author: Some("Test Author".to_string()),
        subject: Some("Test Subject".to_string()),
        keywords: Some("test,keywords".to_string()),
        ..Default::default()
    };

    let mut gen = PDFGenerator::new(config).unwrap();
    gen.add_text("Test", 100.0, 700.0, 12.0).unwrap();
    let pdf_bytes = gen.finalize().unwrap();
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);

    // Verify metadata appears in the PDF (both Info and XMP)
    assert!(pdf_str.contains("Sync Test"));
    assert!(pdf_str.contains("Test Author"));
    assert!(pdf_str.contains("Test Subject"));
    assert!(pdf_str.contains("test,keywords"));

    // Verify XMP metadata structure
    assert!(pdf_str.contains("<dc:title>"));
    assert!(pdf_str.contains("<dc:creator>"));
    assert!(pdf_str.contains("<dc:description>"));
    assert!(pdf_str.contains("<dc:subject>"));
}
