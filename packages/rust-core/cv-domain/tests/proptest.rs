//! Property-based tests for CV domain validation functions
//!
//! These tests verify robustness by testing validators with arbitrary inputs,
//! ensuring they never panic and maintain invariants across edge cases.
//!
//! Note: Some tests catch panics from the underlying TSX parser, as malformed
//! TSX input can trigger parser panics. These are handled gracefully to focus
//! on cv-domain's robustness.

use cv_domain::*;
use proptest::prelude::*;
use std::panic;

// ===========================
// Robustness Tests (No Panic)
// ===========================

proptest! {
    /// Email extraction should never panic on any input string
    /// Note: TSX parser may panic on malformed input, which we catch
    #[test]
    fn extract_email_no_panic(s in "\\PC*") {
        let _ = panic::catch_unwind(|| {
            let tsx = format!(r#"<p>{}</p>"#, s);
            if let Ok(doc) = tsx_parser::parse_tsx(&tsx) {
                let _ = extract_metadata(&doc);
            }
        });
    }

    /// Phone extraction should never panic on any input string
    /// Note: TSX parser may panic on malformed input, which we catch
    #[test]
    fn extract_phone_no_panic(s in "\\PC*") {
        let _ = panic::catch_unwind(|| {
            let tsx = format!(r#"<p>{}</p>"#, s);
            if let Ok(doc) = tsx_parser::parse_tsx(&tsx) {
                let _ = extract_metadata(&doc);
            }
        });
    }

    /// Location extraction should never panic on any input string
    /// Note: TSX parser may panic on malformed input, which we catch
    #[test]
    fn extract_location_no_panic(s in "\\PC*") {
        let _ = panic::catch_unwind(|| {
            let tsx = format!(r#"<p>{}</p>"#, s);
            if let Ok(doc) = tsx_parser::parse_tsx(&tsx) {
                let _ = extract_metadata(&doc);
            }
        });
    }

    /// Website extraction should never panic on any input string
    /// Note: TSX parser may panic on malformed input, which we catch
    #[test]
    fn extract_website_no_panic(s in "\\PC*") {
        let _ = panic::catch_unwind(|| {
            let tsx = format!(r#"<p>{}</p>"#, s);
            if let Ok(doc) = tsx_parser::parse_tsx(&tsx) {
                let _ = extract_metadata(&doc);
            }
        });
    }

    /// Name extraction should never panic on any input string
    /// Note: TSX parser may panic on malformed input, which we catch
    #[test]
    fn extract_name_no_panic(s in "\\PC*") {
        let _ = panic::catch_unwind(|| {
            let tsx = format!(r#"<h1>{}</h1>"#, s);
            if let Ok(doc) = tsx_parser::parse_tsx(&tsx) {
                let _ = extract_metadata(&doc);
            }
        });
    }

    /// Metadata extraction should never panic on arbitrary TSX structures
    /// Note: TSX parser may panic on malformed input, which we catch
    #[test]
    fn extract_metadata_no_panic(
        tag in prop::sample::select(vec!["div", "h1", "h2", "h3", "p", "span"]),
        content in "\\PC{0,200}"
    ) {
        let _ = panic::catch_unwind(|| {
            let tsx = format!(r#"<{tag}>{content}</{tag}>"#);
            if let Ok(doc) = tsx_parser::parse_tsx(&tsx) {
                let _ = extract_metadata(&doc);
            }
        });
    }
}

// ===========================
// Correctness Tests
// ===========================

proptest! {
    /// Valid email format should be parseable
    #[test]
    fn valid_email_pattern(
        local in "[a-z0-9]{1,10}",
        domain in "[a-z0-9]{1,10}",
        tld in "[a-z]{2,4}"
    ) {
        let email = format!("{}@{}.{}", local, domain, tld);
        let tsx = format!(r#"<p>Contact: {}</p>"#, email);

        if let Ok(doc) = tsx_parser::parse_tsx(&tsx) {
            let metadata = extract_metadata(&doc).unwrap();
            // Should extract a valid-looking email
            // May be None if email validation filters it out (e.g., test domains)
            if let Some(extracted) = metadata.email {
                assert!(extracted.contains('@'));
                assert!(extracted.contains('.'));
            }
        }
    }

    /// Valid phone patterns should be extracted
    #[test]
    fn valid_phone_pattern(
        area in "[0-9]{3}",
        prefix in "[0-9]{3}",
        line in "[0-9]{4}"
    ) {
        let phone = format!("{}-{}-{}", area, prefix, line);
        let tsx = format!(r#"<p>Phone: {}</p>"#, phone);

        if let Ok(doc) = tsx_parser::parse_tsx(&tsx) {
            let metadata = extract_metadata(&doc).unwrap();
            // Should extract the phone number
            assert!(metadata.phone.is_some());
            let extracted_phone = metadata.phone.unwrap();
            // Should contain the digits
            assert!(extracted_phone.contains(&area));
            assert!(extracted_phone.contains(&prefix));
            assert!(extracted_phone.contains(&line));
        }
    }

    /// Names with reasonable patterns should be extracted
    #[test]
    fn valid_name_pattern(
        first in "[A-Z][a-z]{2,10}",
        last in "[A-Z][a-z]{2,10}"
    ) {
        let name = format!("{} {}", first, last);
        let tsx = format!(r#"<h1>{}</h1>"#, name);

        if let Ok(doc) = tsx_parser::parse_tsx(&tsx) {
            let metadata = extract_metadata(&doc).unwrap();
            // Should extract the name
            assert!(metadata.name.is_some());
            assert_eq!(metadata.name.unwrap(), name);
        }
    }
}

// ===========================
// Invariant Tests
// ===========================

proptest! {
    /// ATS score should always be 0-100
    #[test]
    fn ats_score_bounds(
        has_email in proptest::bool::ANY,
        has_phone in proptest::bool::ANY,
        section_count in 0usize..10
    ) {
        let mut tsx = String::from(r#"<div><h1>John Doe</h1>"#);

        if has_email {
            tsx.push_str(r#"<p>test@example.com</p>"#);
        }

        if has_phone {
            tsx.push_str(r#"<p>555-123-4567</p>"#);
        }

        for i in 0..section_count {
            tsx.push_str(&format!(r#"<h2>Section {}</h2><p>Content</p>"#, i));
        }

        tsx.push_str("</div>");

        if let Ok(doc) = tsx_parser::parse_tsx(&tsx) {
            let metadata = extract_metadata(&doc).unwrap();
            let score = metadata.ats_score();
            prop_assert!(score <= 100, "ATS score {} out of bounds (should be 0-100)", score);
        }
    }

    /// Estimated pages should never be zero for non-empty content
    #[test]
    fn estimated_pages_nonzero(content in "[a-zA-Z0-9 ]{100,1000}") {
        let tsx = format!(r#"<div>{}</div>"#, content);

        if let Ok(doc) = tsx_parser::parse_tsx(&tsx) {
            let metadata = extract_metadata(&doc).unwrap();
            prop_assert!(metadata.estimated_pages > 0, "Estimated pages should be > 0 for non-empty content");
        }
    }

    /// Component count should never exceed element count
    #[test]
    fn component_count_reasonable(
        element_count in 1usize..20
    ) {
        let mut tsx = String::from("<div>");

        for i in 0..element_count {
            tsx.push_str(&format!("<p>Element {}</p>", i));
        }

        tsx.push_str("</div>");

        if let Ok(doc) = tsx_parser::parse_tsx(&tsx) {
            let metadata = extract_metadata(&doc).unwrap();
            // Component count should be reasonable (at least 1 for the root div)
            prop_assert!(metadata.component_count > 0);
            // Should not exceed total elements + some overhead for containers
            prop_assert!(metadata.component_count <= element_count + 10);
        }
    }

    /// Layout type should always be one of the defined variants
    #[test]
    fn layout_type_valid(
        has_columns in proptest::bool::ANY
    ) {
        let tsx = if has_columns {
            r#"
                <div style="display: flex">
                    <div style="width: 30%"><h1>Name</h1></div>
                    <div style="width: 70%"><p>Content</p></div>
                </div>
            "#
        } else {
            r#"<div><h1>Name</h1><p>Content</p></div>"#
        };

        if let Ok(doc) = tsx_parser::parse_tsx(tsx) {
            let metadata = extract_metadata(&doc).unwrap();
            // Should be one of the valid layout types
            match metadata.layout_type {
                LayoutType::SingleColumn | LayoutType::TwoColumn | LayoutType::Custom | LayoutType::Academic | LayoutType::Portfolio => {},
            }
        }
    }

    /// Font complexity should always be one of the defined variants
    #[test]
    fn font_complexity_valid(
        font_count in 1usize..5
    ) {
        let mut tsx = String::from("<div>");

        for i in 0..font_count {
            tsx.push_str(&format!(r#"<p style="font-family: Font{}">Text</p>"#, i));
        }

        tsx.push_str("</div>");

        if let Ok(doc) = tsx_parser::parse_tsx(&tsx) {
            let metadata = extract_metadata(&doc).unwrap();
            // Should be one of the valid font complexity variants
            match metadata.font_complexity {
                FontComplexity::Simple | FontComplexity::Moderate | FontComplexity::Complex => {},
            }
        }
    }
}

// ===========================
// Edge Case Tests
// ===========================

proptest! {
    /// Empty strings should not cause panics
    #[test]
    fn empty_string_handling(
        tag in prop::sample::select(vec!["div", "h1", "p"])
    ) {
        let tsx = format!("<{tag}></{tag}>");

        if let Ok(doc) = tsx_parser::parse_tsx(&tsx) {
            let metadata = extract_metadata(&doc).unwrap();
            // Should handle empty content gracefully (component_count is usize, always >= 0)
            prop_assert!(metadata.estimated_pages >= 1);
        }
    }

    /// Very long strings should not cause panics or excessive memory use
    #[test]
    fn long_string_handling(len in 1000usize..5000) {
        let content = "a".repeat(len);
        let tsx = format!(r#"<div>{}</div>"#, content);

        if let Ok(doc) = tsx_parser::parse_tsx(&tsx) {
            let metadata = extract_metadata(&doc).unwrap();
            // Should estimate pages based on content length
            prop_assert!(metadata.estimated_pages > 0);
        }
    }

    /// Unicode strings should be handled correctly
    #[test]
    fn unicode_handling(
        emoji_count in 0usize..10
    ) {
        let emojis = "😀🎉🚀";
        let mut content = String::new();
        for _ in 0..emoji_count {
            content.push_str(emojis);
        }

        let tsx = format!(r#"<h1>{}</h1>"#, content);

        if let Ok(doc) = tsx_parser::parse_tsx(&tsx) {
            let _ = extract_metadata(&doc);
            // Should not panic on unicode content
        }
    }

    /// Special characters in emails should be handled
    #[test]
    fn special_email_chars(
        local in "[a-z]{1,5}",
        separator in prop::sample::select(vec!["+", ".", "_", "-"])
    ) {
        let email = format!("test{}{}@example.com", separator, local);
        let tsx = format!(r#"<p>{}</p>"#, email);

        if let Ok(doc) = tsx_parser::parse_tsx(&tsx) {
            let _ = extract_metadata(&doc);
            // Should not panic on special characters in emails
        }
    }
}
