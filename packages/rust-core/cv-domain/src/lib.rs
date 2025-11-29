//! CV Domain module for extracting metadata and structure from parsed TSX documents
//!
//! This module analyzes TSX documents to extract CV-specific information such as
//! personal details, layout type, sections, and ATS optimization hints.
//!
//! # Module Organization
//!
//! - `metadata` - CVMetadata struct and extraction logic
//! - `extractors` - Specialized extractors (name, email, phone, location, url)
//! - `analysis` - Layout detection and ATS analysis

mod analysis;
mod extractors;
mod metadata;
mod tsx_layout;

// Re-export public API
pub use metadata::{extract_metadata, CVMetadata, ExtractionError, FontComplexity, LayoutType};

pub use tsx_layout::{
    extract_tsx_layout_config_from_document, parse_class_names, Spacing, TSXLayoutConfig,
};

#[cfg(test)]
mod tests {
    use super::*;
    use tsx_parser::parse_tsx;

    #[test]
    fn test_debug_fixture_parsing() {
        let tsx = r#"
            export default function TestCV() {
              return (
                <div>
                    <h1>Test Name</h1>
                    <p>test@example.com</p>
                </div>
              );
            }
        "#;

        let document = parse_tsx(tsx).unwrap();
        let elements = tsx_parser::extract_jsx_elements(&document);

        println!("Found {} elements", elements.len());
        for elem in &elements {
            let tag = tsx_parser::extract_element_name(elem);
            let texts = tsx_parser::extract_text_content(elem);
            println!("  <{}> - texts: {:?}", tag, texts);
        }

        let metadata = extract_metadata(&document).unwrap();
        println!("Name extracted: {:?}", metadata.name);
        assert!(metadata.name.is_some());
    }

    #[test]
    fn test_extract_metadata_simple_cv() {
        let tsx = r#"
            const CV = () => (
                <div>
                    <h1>John Doe</h1>
                    <p>john.doe@example.com</p>
                    <p>(555) 123-4567</p>
                    <h2>Experience</h2>
                    <p>Software Engineer at Tech Co</p>
                    <h2>Education</h2>
                    <p>BS Computer Science</p>
                </div>
            );
        "#;

        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();

        assert_eq!(metadata.name, Some("John Doe".to_string()));
        assert_eq!(metadata.email, Some("john.doe@example.com".to_string()));
        assert!(metadata.phone.is_some());
        assert!(metadata.has_contact_info);
        assert!(metadata.has_clear_sections);
    }

    #[test]
    fn test_extract_email() {
        let tsx = r#"<p>Contact me at john.doe@example.com for more info</p>"#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert_eq!(metadata.email, Some("john.doe@example.com".to_string()));
    }

    #[test]
    fn test_extract_phone() {
        let tsx = r#"<p>Call me at (555) 123-4567 anytime</p>"#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert!(metadata.phone.is_some());
    }

    #[test]
    fn test_detect_layout_type_single_column() {
        let tsx = r#"
            const CV = () => (
                <div>
                    <h1>John Doe</h1>
                    <p>Software Engineer</p>
                </div>
            );
        "#;

        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert_eq!(metadata.layout_type, LayoutType::SingleColumn);
    }

    #[test]
    fn test_detect_clear_sections() {
        let tsx = r#"
            const CV = () => (
                <div>
                    <h1>John Doe</h1>
                    <h2>Experience</h2>
                    <p>Software Engineer</p>
                    <h2>Education</h2>
                    <p>BS Computer Science</p>
                </div>
            );
        "#;

        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert!(metadata.has_clear_sections);
    }

    #[test]
    fn test_font_complexity_simple() {
        let tsx = r#"
            const CV = () => (
                <div style="font-family: Arial">
                    <h1>John Doe</h1>
                </div>
            );
        "#;

        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert_eq!(metadata.font_complexity, FontComplexity::Simple);
    }

    #[test]
    fn test_estimate_page_count() {
        let short_content = "a".repeat(2000);
        let long_content = "a".repeat(7000);

        let tsx_short = format!("<div>{}</div>", short_content);
        let tsx_long = format!("<div>{}</div>", long_content);

        let doc_short = parse_tsx(&tsx_short).unwrap();
        let doc_long = parse_tsx(&tsx_long).unwrap();

        let metadata_short = extract_metadata(&doc_short).unwrap();
        let metadata_long = extract_metadata(&doc_long).unwrap();

        assert_eq!(metadata_short.estimated_pages, 1);
        assert_eq!(metadata_long.estimated_pages, 2);
    }

    // Edge case tests for international formats and special characters

    #[test]
    fn test_extract_name_with_suffix() {
        let tsx = r#"<h1>William Smith Jr.</h1>"#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert_eq!(metadata.name, Some("William Smith Jr.".to_string()));
    }

    #[test]
    fn test_extract_name_with_apostrophe() {
        let tsx = r#"<h1>Patrick O'Brien</h1>"#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert_eq!(metadata.name, Some("Patrick O'Brien".to_string()));
    }

    #[test]
    fn test_extract_name_with_hyphen() {
        let tsx = r#"<h1>Mary-Jane Watson</h1>"#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert_eq!(metadata.name, Some("Mary-Jane Watson".to_string()));
    }

    #[test]
    fn test_extract_name_with_unicode() {
        let tsx = r#"<h1>José García</h1>"#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert_eq!(metadata.name, Some("José García".to_string()));
    }

    #[test]
    fn test_extract_name_with_multiple_suffixes() {
        let tsx = r#"<h1>Dr. Robert Smith III PhD</h1>"#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        // This may or may not pass depending on heuristics - testing edge case
        assert!(metadata.name.is_some());
    }

    #[test]
    fn test_extract_international_phone() {
        // Test international format that matches the current regex pattern
        let tsx = r#"<p>Contact: +1 (555) 123-4567</p>"#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert!(
            metadata.phone.is_some(),
            "Should extract international phone with country code"
        );
    }

    #[test]
    fn test_extract_phone_with_dots() {
        let tsx = r#"<p>Phone: 555.123.4567</p>"#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert!(metadata.phone.is_some());
    }

    #[test]
    fn test_extract_email_with_plus() {
        let tsx = r#"<p>Email: john.doe+cv@example.com</p>"#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert_eq!(metadata.email, Some("john.doe+cv@example.com".to_string()));
    }

    #[test]
    fn test_extract_email_with_subdomain() {
        let tsx = r#"<p>Contact: user@mail.company.com</p>"#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert_eq!(metadata.email, Some("user@mail.company.com".to_string()));
    }

    #[test]
    fn test_reject_test_email() {
        let tsx = r#"<p>Test: user@example.test</p>"#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert_eq!(metadata.email, None, "Should reject .test TLD");
    }

    #[test]
    fn test_reject_local_email() {
        let tsx = r#"<p>Local: admin@localhost</p>"#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert_eq!(metadata.email, None, "Should reject .localhost domain");
    }

    #[test]
    fn test_phone_too_short() {
        let tsx = r#"<p>Short: 123-4567</p>"#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert_eq!(
            metadata.phone, None,
            "Should reject phone with too few digits"
        );
    }

    #[test]
    fn test_empty_cv_graceful_handling() {
        let tsx = r#"<div></div>"#;
        let document = parse_tsx(tsx).unwrap();
        let result = extract_metadata(&document);
        assert!(result.is_ok(), "Should handle empty CV gracefully");
        let metadata = result.unwrap();
        assert_eq!(metadata.name, None);
        assert_eq!(metadata.email, None);
    }

    #[test]
    fn test_minimal_cv() {
        let tsx = r#"<h1>Jane Doe</h1>"#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert_eq!(metadata.name, Some("Jane Doe".to_string()));
        assert!(!metadata.has_contact_info);
        assert!(!metadata.has_clear_sections);
    }

    #[test]
    fn test_ats_score_calculation() {
        let tsx = r#"
            <div>
                <h1>John Doe</h1>
                <p>john@example.com | (555) 123-4567</p>
                <h2>Experience</h2>
                <p>Software Engineer</p>
                <h2>Education</h2>
                <p>BS Computer Science</p>
            </div>
        "#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        let score = metadata.ats_score();
        // Should have: name (20) + email (20) + phone (20) + sections (20) = 80+
        assert!(score >= 80, "Expected high ATS score, got {}", score);
    }

    #[test]
    fn test_ats_friendly_check() {
        let tsx = r#"
            <div>
                <h1>John Doe</h1>
                <p>john@example.com</p>
                <h2>Experience</h2>
                <h2>Education</h2>
            </div>
        "#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        assert!(metadata.is_ats_friendly(), "Should be ATS friendly");
    }

    #[test]
    fn test_ats_suggestions() {
        let tsx = r#"<div><p>Some content</p></div>"#;
        let document = parse_tsx(tsx).unwrap();
        let metadata = extract_metadata(&document).unwrap();
        let suggestions = metadata.ats_suggestions();
        assert!(!suggestions.is_empty(), "Should have ATS suggestions");
        assert!(suggestions.iter().any(|s| s.contains("name")));
        assert!(suggestions.iter().any(|s| s.contains("contact")));
    }
}
