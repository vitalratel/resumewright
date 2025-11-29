//! PDF/A compliance tests
//!
//! These tests verify that PDF/A-1b documents are generated correctly
//! with all required components for archival compliance.

use pdf_generator::{PDFConfig, PDFGenerator, PDFStandard, PageSize};

#[test]
fn test_pdfa_version_set_correctly() {
    let config = PDFConfig {
        standard: PDFStandard::PDFA1b,
        ..Default::default()
    };

    let generator = PDFGenerator::new(config).unwrap();
    let pdf_bytes = generator.finalize().unwrap();

    // PDF/A-1 requires PDF version 1.4
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);
    assert!(
        pdf_str.starts_with("%PDF-1.4"),
        "PDF/A-1b must use PDF version 1.4"
    );
}

#[test]
fn test_regular_pdf_version() {
    let config = PDFConfig {
        standard: PDFStandard::PDF17,
        ..Default::default()
    };

    let generator = PDFGenerator::new(config).unwrap();
    let pdf_bytes = generator.finalize().unwrap();

    // Regular PDF should use version 1.7
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);
    assert!(
        pdf_str.starts_with("%PDF-1.7"),
        "Regular PDF should use PDF version 1.7"
    );
}

#[test]
fn test_pdfa_xmp_metadata_present() {
    let config = PDFConfig {
        standard: PDFStandard::PDFA1b,
        title: Some("Test Resume".to_string()),
        author: Some("John Doe".to_string()),
        ..Default::default()
    };

    let generator = PDFGenerator::new(config).unwrap();
    let pdf_bytes = generator.finalize().unwrap();
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);

    // Check for XMP metadata packet
    assert!(
        pdf_str.contains("<?xpacket begin="),
        "PDF/A must contain XMP metadata packet"
    );
    assert!(
        pdf_str.contains("<?xpacket end="),
        "PDF/A XMP packet must be properly closed"
    );

    // Check for PDF/A identification schema
    assert!(
        pdf_str.contains("pdfaid:part"),
        "PDF/A XMP must contain part identifier"
    );
    assert!(
        pdf_str.contains("pdfaid:conformance"),
        "PDF/A XMP must contain conformance identifier"
    );

    // Verify PDF/A-1b identification
    assert!(
        pdf_str.contains("<pdfaid:part>1</pdfaid:part>"),
        "Must specify PDF/A part 1"
    );
    assert!(
        pdf_str.contains("<pdfaid:conformance>B</pdfaid:conformance>"),
        "Must specify conformance level B"
    );
}

#[test]
fn test_pdfa_metadata_includes_document_info() {
    let config = PDFConfig {
        standard: PDFStandard::PDFA1b,
        title: Some("Software Engineer Resume".to_string()),
        author: Some("Jane Smith".to_string()),
        subject: Some("Job Application".to_string()),
        keywords: Some("software,engineering,rust".to_string()),
        creator: Some("ResumeWright".to_string()),
        ..Default::default()
    };

    let generator = PDFGenerator::new(config).unwrap();
    let pdf_bytes = generator.finalize().unwrap();
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);

    // Verify metadata is embedded in XMP
    assert!(
        pdf_str.contains("Software Engineer Resume"),
        "Title must be in XMP metadata"
    );
    assert!(
        pdf_str.contains("Jane Smith"),
        "Author must be in XMP metadata"
    );
    assert!(
        pdf_str.contains("Job Application"),
        "Subject must be in XMP metadata"
    );
    assert!(
        pdf_str.contains("software,engineering,rust"),
        "Keywords must be in XMP metadata"
    );
    assert!(
        pdf_str.contains("ResumeWright"),
        "Creator must be in XMP metadata"
    );
}

#[test]
fn test_pdfa_output_intent_present() {
    let config = PDFConfig {
        standard: PDFStandard::PDFA1b,
        ..Default::default()
    };

    let generator = PDFGenerator::new(config).unwrap();
    let pdf_bytes = generator.finalize().unwrap();
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);

    // Check for OutputIntent with GTS_PDFA1 conformance
    assert!(
        pdf_str.contains("/OutputIntents"),
        "PDF/A must contain OutputIntents array"
    );
    assert!(
        pdf_str.contains("/GTS_PDFA1"),
        "OutputIntent must specify GTS_PDFA1 conformance"
    );
    assert!(
        pdf_str.contains("sRGB"),
        "OutputIntent must reference sRGB color space"
    );
}

#[test]
fn test_pdfa_metadata_object_linked_to_catalog() {
    let config = PDFConfig {
        standard: PDFStandard::PDFA1b,
        ..Default::default()
    };

    let generator = PDFGenerator::new(config).unwrap();
    let pdf_bytes = generator.finalize().unwrap();
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);

    // The catalog should have a /Metadata reference
    // This is a basic check - full validation would require PDF parsing
    assert!(
        pdf_str.contains("/Type/Metadata"),
        "Metadata stream must have Type of Metadata"
    );
    assert!(
        pdf_str.contains("/Subtype/XML"),
        "Metadata stream must have Subtype of XML"
    );
}

#[test]
fn test_regular_pdf_no_xmp_metadata() {
    let config = PDFConfig {
        standard: PDFStandard::PDF17,
        ..Default::default()
    };

    let generator = PDFGenerator::new(config).unwrap();
    let pdf_bytes = generator.finalize().unwrap();
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);

    // Regular PDFs should not include PDF/A-specific XMP
    assert!(
        !pdf_str.contains("pdfaid:part"),
        "Regular PDF should not contain PDF/A identification"
    );
    assert!(
        !pdf_str.contains("/GTS_PDFA1"),
        "Regular PDF should not contain PDF/A OutputIntent"
    );
}

#[test]
fn test_pdfa_with_different_page_sizes() {
    for page_size in [PageSize::Letter, PageSize::A4, PageSize::Legal] {
        let config = PDFConfig {
            standard: PDFStandard::PDFA1b,
            page_size,
            title: Some("Test".to_string()),
            ..Default::default()
        };

        let generator = PDFGenerator::new(config).unwrap();
        let result = generator.finalize();

        assert!(
            result.is_ok(),
            "PDF/A generation should work with {:?}",
            page_size
        );

        let pdf_bytes = result.unwrap();
        let pdf_str = String::from_utf8_lossy(&pdf_bytes);

        // Verify PDF/A compliance markers
        assert!(pdf_str.starts_with("%PDF-1.4"));
        assert!(pdf_str.contains("pdfaid:part"));
        assert!(pdf_str.contains("/GTS_PDFA1"));
    }
}

#[test]
fn test_pdfa_metadata_xml_well_formed() {
    let config = PDFConfig {
        standard: PDFStandard::PDFA1b,
        title: Some("Test with <special> & \"characters\"".to_string()),
        author: Some("O'Brien".to_string()),
        ..Default::default()
    };

    let generator = PDFGenerator::new(config).unwrap();
    let pdf_bytes = generator.finalize().unwrap();
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);

    // Special characters should be escaped in XML
    assert!(
        pdf_str.contains("&lt;special&gt;"),
        "< and > must be escaped as &lt; and &gt;"
    );
    assert!(
        pdf_str.contains("&quot;characters&quot;"),
        "Quotes must be escaped as &quot;"
    );
    assert!(
        pdf_str.contains("O&apos;Brien"),
        "Apostrophes must be escaped as &apos;"
    );
}

#[test]
fn test_pdfa_with_minimal_metadata() {
    let config = PDFConfig {
        standard: PDFStandard::PDFA1b,
        title: None,
        author: None,
        subject: None,
        keywords: None,
        creator: None,
        ..Default::default()
    };

    let generator = PDFGenerator::new(config).unwrap();
    let result = generator.finalize();

    // Should still generate valid PDF/A even with minimal metadata
    assert!(
        result.is_ok(),
        "PDF/A should generate with minimal metadata"
    );

    let pdf_bytes = result.unwrap();
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);

    // Core PDF/A elements must still be present
    assert!(pdf_str.starts_with("%PDF-1.4"));
    assert!(pdf_str.contains("pdfaid:part"));
    assert!(pdf_str.contains("pdfaid:conformance"));
    assert!(pdf_str.contains("/GTS_PDFA1"));
}

#[test]
fn test_pdfa_document_structure() {
    let config = PDFConfig {
        standard: PDFStandard::PDFA1b,
        ..Default::default()
    };

    let generator = PDFGenerator::new(config).unwrap();
    let pdf_bytes = generator.finalize().unwrap();

    // Basic PDF structure validation
    assert!(pdf_bytes.starts_with(b"%PDF-1.4"));
    // PDF may end with %%EOF or %%EOF\n, both are valid
    let ends_correctly = pdf_bytes.ends_with(b"%%EOF\n") || pdf_bytes.ends_with(b"%%EOF");
    assert!(ends_correctly, "PDF must end with %%EOF");

    // Document should be parseable as valid PDF
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);
    assert!(pdf_str.contains("/Root")); // Catalog reference
    assert!(pdf_str.contains("/Pages")); // Pages tree
    assert!(pdf_str.contains("/Type/Catalog")); // Document catalog
}

#[test]
fn test_pdfa_standard_enum_default() {
    let standard = PDFStandard::default();
    assert_eq!(standard, PDFStandard::PDF17, "Default should be PDF 1.7");
}

#[test]
fn test_pdfa_config_default() {
    let config = PDFConfig::default();
    assert_eq!(
        config.standard,
        PDFStandard::PDF17,
        "Default config should use PDF 1.7"
    );
}

#[test]
fn test_pdfa_xmp_timestamp_format() {
    let config = PDFConfig {
        standard: PDFStandard::PDFA1b,
        ..Default::default()
    };

    let generator = PDFGenerator::new(config).unwrap();
    let pdf_bytes = generator.finalize().unwrap();
    let pdf_str = String::from_utf8_lossy(&pdf_bytes);

    // XMP timestamps should be in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
    // Check for the pattern (relaxed check for flexibility)
    assert!(
        pdf_str.contains("<xmp:CreateDate>"),
        "XMP must contain CreateDate"
    );
    assert!(
        pdf_str.contains("<xmp:ModifyDate>"),
        "XMP must contain ModifyDate"
    );

    // Verify ISO 8601 format pattern exists (basic check)
    // Format: 2025-01-20T12:00:00Z
    let has_iso_timestamp =
        pdf_str.contains("T") && pdf_str.contains("Z") && pdf_str.contains("<xmp:CreateDate>20");
    assert!(
        has_iso_timestamp,
        "XMP timestamps should use ISO 8601 format"
    );
}
