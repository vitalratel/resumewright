//! Validation utilities for conversion pipeline
//!
//! This module provides validation functions for inputs to the conversion pipeline,
//! including font file validation and configuration validation.

/// Validate font bytes by checking for valid TrueType/OpenType magic numbers
///
/// Checks for common font format signatures:
/// - TrueType: 0x00010000 or 'true'
/// - OpenType (CFF): 'OTTO'
/// - TrueType Collection: 'ttcf'
///
/// # Arguments
/// * `bytes` - Font file bytes to validate
///
/// # Returns
/// `true` if bytes start with a valid font format signature, `false` otherwise
///
/// # Examples
/// ```
/// # fn is_valid_font_format(bytes: &[u8]) -> bool {
/// #     if bytes.len() < 4 { return false; }
/// #     matches!(&bytes[0..4],
/// #         [0x00, 0x01, 0x00, 0x00] | [0x74, 0x72, 0x75, 0x65] |
/// #         [0x4F, 0x54, 0x54, 0x4F] | [0x74, 0x74, 0x63, 0x66])
/// # }
/// // Valid TrueType
/// let ttf_bytes = [0x00, 0x01, 0x00, 0x00];
/// assert!(is_valid_font_format(&ttf_bytes));
///
/// // Invalid magic number
/// let invalid_bytes = [0xFF, 0xFF, 0xFF, 0xFF];
/// assert!(!is_valid_font_format(&invalid_bytes));
///
/// // Truncated file
/// let truncated = [0x00, 0x01];
/// assert!(!is_valid_font_format(&truncated));
/// ```
pub fn is_valid_font_format(bytes: &[u8]) -> bool {
    if bytes.len() < 4 {
        return false;
    }

    // Check for TrueType and OpenType signatures
    matches!(
        &bytes[0..4],
        [0x00, 0x01, 0x00, 0x00]  // Standard TrueType (version 1.0)
        | [0x74, 0x72, 0x75, 0x65]  // 'true' (macOS TrueType)
        | [0x4F, 0x54, 0x54, 0x4F]  // 'OTTO' (OpenType with CFF outlines)
        | [0x74, 0x74, 0x63, 0x66] // 'ttcf' (TrueType Collection)
    )
}

/// Enrich PDF configuration with CV metadata
///
/// Extracts relevant metadata and enriches PDF configuration with:
/// - Author: CV name
/// - Title: "CV name - Resume" or just "Resume"
/// - Subject: CV title or "Curriculum Vitae"
/// - Keywords: Generated from sections and skills
///
/// # Arguments
/// * `config` - Base PDF configuration to enrich
/// * `metadata` - CV metadata extracted from document
///
/// # Returns
/// Enriched PDFConfig with metadata populated from CV information
pub fn enrich_pdf_config_with_metadata(
    mut config: pdf_generator::PDFConfig,
    metadata: &cv_domain::CVMetadata,
) -> pdf_generator::PDFConfig {
    // Set author from CV name
    if let Some(ref name) = metadata.name {
        config.author = Some(name.clone());
        // Set title as "Name - Resume"
        config.title = Some(format!("{} - Resume", name));
    }

    // Set subject from CV title or use default
    if let Some(ref title) = metadata.title {
        config.subject = Some(title.clone());
    }

    // Generate keywords from metadata
    let mut keywords = Vec::new();

    if let Some(ref name) = metadata.name {
        keywords.push(name.clone());
    }

    if let Some(ref title) = metadata.title {
        keywords.push(title.clone());
    }

    // Add layout type as keyword for ATS
    keywords.push(match metadata.layout_type {
        cv_domain::LayoutType::SingleColumn => "single-column".to_string(),
        cv_domain::LayoutType::TwoColumn => "two-column".to_string(),
        cv_domain::LayoutType::Academic => "academic".to_string(),
        cv_domain::LayoutType::Portfolio => "portfolio".to_string(),
        cv_domain::LayoutType::Custom => "custom".to_string(),
    });

    keywords.push("resume".to_string());
    keywords.push("cv".to_string());

    config.keywords = Some(keywords.join(", "));

    // Ensure creator is set
    if config.creator.is_none() {
        config.creator = Some("ResumeWright Browser Extension".to_string());
    }

    config
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_valid_font_format_truetype() {
        // Standard TrueType 1.0
        let ttf_bytes = [0x00, 0x01, 0x00, 0x00, 0xFF, 0xFF];
        assert!(is_valid_font_format(&ttf_bytes));
    }

    #[test]
    fn test_is_valid_font_format_macos_truetype() {
        // macOS TrueType variant ('true')
        let mac_ttf = [0x74, 0x72, 0x75, 0x65, 0x00, 0x00];
        assert!(is_valid_font_format(&mac_ttf));
    }

    #[test]
    fn test_is_valid_font_format_opentype_cff() {
        // OpenType with CFF outlines ('OTTO')
        let otf_bytes = [0x4F, 0x54, 0x54, 0x4F, 0x00, 0x00];
        assert!(is_valid_font_format(&otf_bytes));
    }

    #[test]
    fn test_is_valid_font_format_truetype_collection() {
        // TrueType Collection ('ttcf')
        let ttc_bytes = [0x74, 0x74, 0x63, 0x66, 0x00, 0x00];
        assert!(is_valid_font_format(&ttc_bytes));
    }

    #[test]
    fn test_is_valid_font_format_invalid() {
        // Invalid magic number
        let invalid_bytes = [0xFF, 0xFF, 0xFF, 0xFF];
        assert!(!is_valid_font_format(&invalid_bytes));

        // Random bytes
        let random_bytes = [0xDE, 0xAD, 0xBE, 0xEF];
        assert!(!is_valid_font_format(&random_bytes));
    }

    #[test]
    fn test_is_valid_font_format_truncated() {
        // Less than 4 bytes
        assert!(!is_valid_font_format(&[0x00, 0x01, 0x00]));
        assert!(!is_valid_font_format(&[0x00, 0x01]));
        assert!(!is_valid_font_format(&[0x00]));
        assert!(!is_valid_font_format(&[]));
    }

    #[test]
    fn test_is_valid_font_format_woff() {
        // WOFF is NOT a valid format for embedding (needs decompression first)
        let woff_bytes = [0x77, 0x4F, 0x46, 0x46];
        assert!(!is_valid_font_format(&woff_bytes));
    }

    #[test]
    fn test_is_valid_font_format_woff2() {
        // WOFF2 is NOT a valid format for embedding (needs decompression first)
        let woff2_bytes = [0x77, 0x4F, 0x46, 0x32];
        assert!(!is_valid_font_format(&woff2_bytes));
    }

    //
    // P2 Edge Case Tests
    //

    #[test]
    fn test_is_valid_font_format_exactly_4_bytes() {
        // Exactly 4 bytes (minimum valid)
        let ttf_min = [0x00, 0x01, 0x00, 0x00];
        assert!(is_valid_font_format(&ttf_min));

        let otto_min = [0x4F, 0x54, 0x54, 0x4F];
        assert!(is_valid_font_format(&otto_min));
    }

    #[test]
    fn test_is_valid_font_format_partial_match() {
        // First 3 bytes match but 4th doesn't
        let partial1 = [0x00, 0x01, 0x00, 0xFF];
        assert!(!is_valid_font_format(&partial1));

        let partial2 = [0x74, 0x72, 0x75, 0xFF];
        assert!(!is_valid_font_format(&partial2));

        let partial3 = [0x4F, 0x54, 0x54, 0xFF];
        assert!(!is_valid_font_format(&partial3));
    }

    #[test]
    fn test_is_valid_font_format_all_signatures() {
        // Test all 4 valid signatures
        let ttf_v1 = [0x00, 0x01, 0x00, 0x00, 0xFF, 0xFF];
        assert!(is_valid_font_format(&ttf_v1));

        let ttf_true = [0x74, 0x72, 0x75, 0x65, 0xFF, 0xFF];
        assert!(is_valid_font_format(&ttf_true));

        let otf_cff = [0x4F, 0x54, 0x54, 0x4F, 0xFF, 0xFF];
        assert!(is_valid_font_format(&otf_cff));

        let ttc = [0x74, 0x74, 0x63, 0x66, 0xFF, 0xFF];
        assert!(is_valid_font_format(&ttc));
    }

    #[test]
    fn test_is_valid_font_format_common_invalid() {
        // PDF signature
        let pdf = [0x25, 0x50, 0x44, 0x46];
        assert!(!is_valid_font_format(&pdf));

        // PNG signature
        let png = [0x89, 0x50, 0x4E, 0x47];
        assert!(!is_valid_font_format(&png));

        // JPEG signature
        let jpeg = [0xFF, 0xD8, 0xFF, 0xE0];
        assert!(!is_valid_font_format(&jpeg));

        // ZIP signature
        let zip = [0x50, 0x4B, 0x03, 0x04];
        assert!(!is_valid_font_format(&zip));
    }

    #[test]
    fn test_enrich_pdf_config_with_metadata_complete() {
        use pdf_generator::{Margin, PDFConfig, PDFStandard, PageSize};

        let config = PDFConfig {
            page_size: PageSize::Letter,
            margin: Margin {
                top: 36.0,
                right: 36.0,
                bottom: 36.0,
                left: 36.0,
            },
            standard: PDFStandard::PDF17,
            title: None,
            author: None,
            subject: None,
            keywords: None,
            creator: Some("Test".to_string()),
            ats_weights: None,
            compress_content_streams: false,
            generate_bookmarks: true,
        };

        // Create metadata with name
        let tsx = r#"
            const CV = () => (
                <div>
                    <h1>John Doe</h1>
                    <p>Software Engineer</p>
                </div>
            );
        "#;

        let document = tsx_parser::parse_tsx(tsx).unwrap();
        let metadata = cv_domain::extract_metadata(&document).unwrap();

        // Enrich config
        let enriched = enrich_pdf_config_with_metadata(config, &metadata);

        // Should set title and author from metadata
        assert!(enriched.title.is_some());
        assert!(enriched.author.is_some());
    }

    #[test]
    fn test_enrich_pdf_config_metadata_overwrites_when_name_present() {
        use pdf_generator::{Margin, PDFConfig, PDFStandard, PageSize};

        let config = PDFConfig {
            page_size: PageSize::Letter,
            margin: Margin {
                top: 36.0,
                right: 36.0,
                bottom: 36.0,
                left: 36.0,
            },
            standard: PDFStandard::PDF17,
            title: Some("Existing Title".to_string()),
            author: Some("Existing Author".to_string()),
            subject: None,
            keywords: None,
            creator: Some("Test".to_string()),
            ats_weights: None,
            compress_content_streams: false,
            generate_bookmarks: true,
        };

        let tsx = "<div><h1>John Doe</h1></div>";
        let document = tsx_parser::parse_tsx(tsx).unwrap();
        let metadata = cv_domain::extract_metadata(&document).unwrap();

        // Enrich config
        let enriched = enrich_pdf_config_with_metadata(config, &metadata);

        // When metadata has a name, it overwrites title and author
        assert_eq!(enriched.title, Some("John Doe - Resume".to_string()));
        assert_eq!(enriched.author, Some("John Doe".to_string()));

        // Creator should remain unchanged
        assert_eq!(enriched.creator, Some("Test".to_string()));
    }
}
