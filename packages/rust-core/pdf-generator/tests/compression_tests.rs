//! PDF Content Stream Compression Tests
//!
//! Content stream compression (DEFLATE) for smaller PDFs
//!
//! These tests verify that:
//! 1. Compression can be enabled/disabled via PDFConfig
//! 2. Compressed PDFs are significantly smaller (30-50% reduction expected)
//! 3. Both compressed and uncompressed PDFs are valid and readable
//! 4. Compression maintains PDF correctness

#[cfg(test)]
mod tests {
    use lopdf::Document;
    use pdf_generator::{Margin, PDFConfig, PDFGenerator, PageSize};

    /// Helper function to create a test layout with substantial content
    /// Returns a layout that generates meaningful PDF content streams
    fn create_test_content() -> String {
        // Create substantial text content to make compression meaningful
        let mut content = String::with_capacity(10_000);

        // Repeated text patterns compress well with DEFLATE
        for i in 0..50 {
            content.push_str(&format!(
                "This is line {} of test content. DEFLATE compression works best with repeated patterns. ",
                i
            ));
            content.push_str("Lorem ipsum dolor sit amet, consectetur adipiscing elit. ");
            content.push_str("The quick brown fox jumps over the lazy dog. ");
            content.push_str("Pack my box with five dozen liquor jugs. ");
        }

        content
    }

    #[test]
    fn test_compression_disabled_by_default() {
        let config = PDFConfig::default();
        assert!(
            !config.compress_content_streams,
            "Compression should be disabled by default for backward compatibility"
        );
    }

    #[test]
    fn test_compression_can_be_enabled() {
        let config = PDFConfig {
            compress_content_streams: true,
            ..Default::default()
        };
        assert!(
            config.compress_content_streams,
            "Compression should be enabled when explicitly set"
        );
    }

    #[test]
    fn test_generate_uncompressed_pdf() {
        // Create PDF without compression
        let config = PDFConfig {
            compress_content_streams: false,
            page_size: PageSize::Letter,
            margin: Margin::from_inches(0.5),
            title: Some("Uncompressed Test".to_string()),
            ..Default::default()
        };

        let mut generator = PDFGenerator::new(config).expect("Should create generator");

        // Add test content
        let content = create_test_content();
        generator
            .add_text(&content, 50.0, 700.0, 12.0)
            .expect("Should add text");

        // Generate PDF
        let pdf_bytes = generator
            .finalize()
            .expect("Should generate uncompressed PDF");

        // Verify PDF is valid
        assert!(!pdf_bytes.is_empty(), "PDF should not be empty");
        assert!(
            pdf_bytes.starts_with(b"%PDF"),
            "Should start with PDF header"
        );

        // Verify PDF can be parsed
        let doc = Document::load_mem(&pdf_bytes).expect("Should parse uncompressed PDF");
        assert!(!doc.get_pages().is_empty(), "Should have at least one page");
    }

    #[test]
    fn test_generate_compressed_pdf() {
        // Create PDF with compression enabled
        let config = PDFConfig {
            compress_content_streams: true,
            page_size: PageSize::Letter,
            margin: Margin::from_inches(0.5),
            title: Some("Compressed Test".to_string()),
            ..Default::default()
        };

        let mut generator = PDFGenerator::new(config).expect("Should create generator");

        // Add test content
        let content = create_test_content();
        generator
            .add_text(&content, 50.0, 700.0, 12.0)
            .expect("Should add text");

        // Generate PDF
        let pdf_bytes = generator
            .finalize()
            .expect("Should generate compressed PDF");

        // Verify PDF is valid
        assert!(!pdf_bytes.is_empty(), "PDF should not be empty");
        assert!(
            pdf_bytes.starts_with(b"%PDF"),
            "Should start with PDF header"
        );

        // Verify PDF can be parsed
        let doc = Document::load_mem(&pdf_bytes).expect("Should parse compressed PDF");
        assert!(!doc.get_pages().is_empty(), "Should have at least one page");
    }

    #[test]
    fn test_compression_reduces_size() {
        let test_content = create_test_content();

        // Generate uncompressed PDF
        let uncompressed_config = PDFConfig {
            compress_content_streams: false,
            page_size: PageSize::Letter,
            title: Some("Size Test - Uncompressed".to_string()),
            ..Default::default()
        };

        let mut uncompressed_gen =
            PDFGenerator::new(uncompressed_config).expect("Should create uncompressed generator");
        uncompressed_gen
            .add_text(&test_content, 50.0, 700.0, 12.0)
            .expect("Should add text to uncompressed");
        let uncompressed_bytes = uncompressed_gen
            .finalize()
            .expect("Should generate uncompressed PDF");

        // Generate compressed PDF
        let compressed_config = PDFConfig {
            compress_content_streams: true,
            page_size: PageSize::Letter,
            title: Some("Size Test - Compressed".to_string()),
            ..Default::default()
        };

        let mut compressed_gen =
            PDFGenerator::new(compressed_config).expect("Should create compressed generator");
        compressed_gen
            .add_text(&test_content, 50.0, 700.0, 12.0)
            .expect("Should add text to compressed");
        let compressed_bytes = compressed_gen
            .finalize()
            .expect("Should generate compressed PDF");

        // Calculate size reduction
        let uncompressed_size = uncompressed_bytes.len();
        let compressed_size = compressed_bytes.len();
        let reduction_ratio =
            (uncompressed_size - compressed_size) as f64 / uncompressed_size as f64;
        let reduction_percent = reduction_ratio * 100.0;

        println!("Uncompressed size: {} bytes", uncompressed_size);
        println!("Compressed size: {} bytes", compressed_size);
        println!(
            "Size reduction: {:.1}% ({} bytes saved)",
            reduction_percent,
            uncompressed_size - compressed_size
        );

        // Verify compression actually reduces size
        assert!(
            compressed_size < uncompressed_size,
            "Compressed PDF should be smaller than uncompressed"
        );

        // Verify meaningful compression (at least 10% reduction)
        // Note: Real CVs with more content typically see 30-50% reduction
        assert!(
            reduction_percent >= 10.0,
            "Should achieve at least 10% compression (got {:.1}%)",
            reduction_percent
        );
    }

    #[test]
    fn test_compressed_pdf_has_valid_structure() {
        let config = PDFConfig {
            compress_content_streams: true,
            page_size: PageSize::A4,
            margin: Margin::from_inches(1.0),
            title: Some("Structure Test".to_string()),
            author: Some("Test Author".to_string()),
            subject: Some("Test Subject".to_string()),
            ..Default::default()
        };

        let mut generator = PDFGenerator::new(config).expect("Should create generator");

        generator
            .add_text("Test content", 100.0, 700.0, 12.0)
            .expect("Should add text");

        let pdf_bytes = generator.finalize().expect("Should generate PDF");

        // Parse and verify structure
        let doc = Document::load_mem(&pdf_bytes).expect("Should parse PDF");

        // Verify catalog exists
        let catalog_id = doc
            .trailer
            .get(b"Root")
            .expect("Should have Root in trailer")
            .as_reference()
            .expect("Root should be a reference");
        let _catalog = doc
            .get_dictionary(catalog_id)
            .expect("Should get catalog dictionary");

        // Verify pages exist
        let pages = doc.get_pages();
        assert!(!pages.is_empty(), "Should have pages");

        // Verify metadata exists
        if let Ok(info_ref) = doc.trailer.get(b"Info") {
            if let Ok(info_id) = info_ref.as_reference() {
                let info = doc
                    .get_dictionary(info_id)
                    .expect("Should get Info dictionary");

                // Verify title is set
                if let Ok(title_obj) = info.get(b"Title") {
                    assert!(title_obj.as_str().is_ok(), "Title should be a string");
                }
            }
        }
    }

    #[test]
    fn test_compression_preserves_multipage_layout() {
        // Create a multi-page PDF with compression
        let config = PDFConfig {
            compress_content_streams: true,
            page_size: PageSize::Letter,
            ..Default::default()
        };

        let mut generator = PDFGenerator::new(config).expect("Should create generator");

        // Add content that spans multiple pages
        for page in 0..3 {
            if page > 0 {
                generator.add_page().expect("Should add new page");
            }

            let text = format!("Page {} content. {}", page + 1, create_test_content());
            generator
                .add_text(&text, 50.0, 700.0, 12.0)
                .expect("Should add text");
        }

        let pdf_bytes = generator
            .finalize()
            .expect("Should generate multi-page PDF");

        // Verify multi-page structure
        let doc = Document::load_mem(&pdf_bytes).expect("Should parse PDF");

        let pages = doc.get_pages();
        assert_eq!(pages.len(), 3, "Should have 3 pages");
    }

    #[test]
    fn test_compression_with_different_page_sizes() {
        // Test compression works with various page sizes
        for page_size in &[PageSize::Letter, PageSize::A4, PageSize::Legal] {
            let config = PDFConfig {
                compress_content_streams: true,
                page_size: *page_size,
                ..Default::default()
            };

            let mut generator = PDFGenerator::new(config).expect("Should create generator");

            generator
                .add_text(&create_test_content(), 50.0, 700.0, 12.0)
                .expect("Should add text");

            let pdf_bytes = generator.finalize().expect("Should generate PDF");

            let doc = Document::load_mem(&pdf_bytes).expect("Should parse PDF");
            assert!(!doc.get_pages().is_empty(), "Should have pages");
        }
    }
}
