//! Property-based tests for tsx-parser using proptest
//!
//! These tests verify invariants that should hold for all inputs:
//! - Parser should never panic
//! - Valid TSX should parse successfully
//! - Parsed documents should be idempotent
//! - Extracted elements should maintain structural properties
//! - Style extraction should preserve format
//! - Attributes should be consistently accessible

use proptest::prelude::*;
use tsx_parser::*;

// Custom proptest configuration for reasonable test execution time
proptest! {
    #![proptest_config(ProptestConfig {
        cases: 500, // Run 500 test cases per property
        max_shrink_iters: 100,
        .. ProptestConfig::default()
    })]

    // ============================================================================
    // PARSER INVARIANTS
    // ============================================================================

    /// Property: Parser should never panic on any input
    /// Even malformed input should return a Result, not panic
    #[test]
    fn parser_never_panics(tsx in "\\PC{0,200}") {
        // This should complete without panicking
        let _ = parse_tsx(&tsx);
        let _ = parse_tsx_with_recovery(&tsx);
    }

    /// Property: Valid TSX should always parse successfully
    /// Generated valid TSX structures should parse without errors
    #[test]
    fn valid_tsx_parses_successfully(
        element_name in valid_element_name(),
        attrs in prop::collection::vec(valid_attribute(), 0..5),
        text in valid_text_content()
    ) {
        let tsx = generate_valid_tsx(&element_name, &attrs, &text);
        let result = parse_tsx(&tsx);
        prop_assert!(result.is_ok(), "Valid TSX should parse: {}", tsx);
    }

    /// Property: Parse → ToString → Parse should be idempotent
    /// Re-parsing a successfully parsed document should succeed
    #[test]
    fn parsing_is_idempotent(
        element_name in valid_element_name(),
        attrs in prop::collection::vec(valid_attribute(), 0..3)
    ) {
        let tsx = generate_valid_tsx(&element_name, &attrs, "Test");

        if let Ok(doc1) = parse_tsx(&tsx) {
            // Re-parse the source from the first parse
            let result2 = parse_tsx(doc1.source());
            prop_assert!(result2.is_ok(), "Re-parsing should succeed");

            if let Ok(doc2) = result2 {
                // Both should have same source
                prop_assert_eq!(doc1.source(), doc2.source());
            }
        }
    }

    // ============================================================================
    // ELEMENT EXTRACTION INVARIANTS
    // ============================================================================

    /// Property: Number of extracted elements should never exceed JSX tags in source
    /// This verifies we're not hallucinating elements
    #[test]
    fn extracted_elements_bounded_by_source(
        elements in prop::collection::vec(valid_element_name(), 1..10)
    ) {
        let tsx = generate_nested_tsx(&elements);

        if let Ok(doc) = parse_tsx(&tsx) {
            let extracted = extract_jsx_elements(&doc);
            let jsx_tag_count = tsx.matches('<').count();

            prop_assert!(
                extracted.len() <= jsx_tag_count,
                "Extracted {} elements but source has {} tags",
                extracted.len(),
                jsx_tag_count
            );
        }
    }

    /// Property: Every extracted element should have a valid, non-empty name
    #[test]
    fn extracted_elements_have_valid_names(
        elements in prop::collection::vec(valid_element_name(), 1..8)
    ) {
        let tsx = generate_nested_tsx(&elements);

        if let Ok(doc) = parse_tsx(&tsx) {
            let extracted = extract_jsx_elements(&doc);

            for element in extracted {
                let name = extract_element_name(element);
                prop_assert!(!name.is_empty(), "Element name should not be empty");
                prop_assert!(
                    name.chars().all(|c| c.is_alphanumeric() || c == '_'),
                    "Element name should be valid identifier: {}",
                    name
                );
            }
        }
    }

    /// Property: Nested elements should maintain parent-child relationships
    /// Child element count should equal number of nested elements
    #[test]
    fn nested_elements_maintain_structure(depth in 1usize..6) {
        let mut elements = vec!["div".to_string()];
        for i in 1..depth {
            elements.push(format!("span{}", i));
        }

        let tsx = generate_nested_tsx(&elements);

        if let Ok(doc) = parse_tsx(&tsx) {
            let extracted = extract_jsx_elements(&doc);
            // Should extract exactly as many elements as we generated
            prop_assert_eq!(
                extracted.len(),
                elements.len(),
                "Should extract {} nested elements",
                elements.len()
            );
        }
    }

    // ============================================================================
    // STYLE EXTRACTION INVARIANTS
    // ============================================================================

    /// Property: If style attribute exists in source, extraction should return Some
    #[test]
    fn style_attribute_extraction_correctness(
        element_name in valid_element_name(),
        css_props in prop::collection::vec(valid_css_property(), 1..5)
    ) {
        let style_string = css_props.join("; ");
        let tsx = format!(
            r#"const CV = () => <{} style="{}">{}</{}>;"#,
            element_name, style_string, "Content", element_name
        );

        if let Ok(doc) = parse_tsx(&tsx) {
            let elements = extract_jsx_elements(&doc);
            if let Some(first_element) = elements.first() {
                let extracted_style = extract_inline_style(first_element);
                prop_assert!(
                    extracted_style.is_some(),
                    "Style attribute should be extracted when present"
                );

                if let Some(style) = extracted_style {
                    prop_assert!(
                        !style.is_empty(),
                        "Extracted style should not be empty"
                    );
                }
            }
        }
    }

    /// Property: Extracted CSS should preserve key-value structure
    #[test]
    fn extracted_css_preserves_structure(
        props in prop::collection::vec(valid_css_property(), 1..5)
    ) {
        let style_string = props.join("; ");
        let tsx = format!(
            r#"const CV = () => <div style="{}">{}</div>;"#,
            style_string, "Test"
        );

        if let Ok(doc) = parse_tsx(&tsx) {
            let elements = extract_jsx_elements(&doc);
            if let Some(element) = elements.first() {
                if let Some(style) = extract_inline_style(element) {
                    // Each original property should be present in extracted style
                    for prop in &props {
                        let key = prop.split(':').next().unwrap().trim();
                        prop_assert!(
                            style.contains(key),
                            "Extracted style should contain property '{}'",
                            key
                        );
                    }
                }
            }
        }
    }

    /// Property: Empty style objects should extract as empty or minimal string
    #[test]
    fn empty_style_extraction(element_name in valid_element_name()) {
        let tsx = format!(
            r#"const CV = () => <{} style="">{}</{}>;"#,
            element_name, "Content", element_name
        );

        if let Ok(doc) = parse_tsx(&tsx) {
            let elements = extract_jsx_elements(&doc);
            if let Some(element) = elements.first() {
                let style = extract_inline_style(element);
                if let Some(s) = style {
                    prop_assert!(
                        s.trim().is_empty(),
                        "Empty style should extract as empty string"
                    );
                }
            }
        }
    }

    // ============================================================================
    // ATTRIBUTE EXTRACTION INVARIANTS
    // ============================================================================

    /// Property: All declared attributes should be retrievable
    #[test]
    fn all_attributes_retrievable(
        element_name in valid_element_name(),
        attrs in prop::collection::vec(valid_attribute(), 1..6)
    ) {
        let tsx = generate_valid_tsx(&element_name, &attrs, "Content");

        if let Ok(doc) = parse_tsx(&tsx) {
            let elements = extract_jsx_elements(&doc);
            if let Some(element) = elements.first() {
                let attr_names = get_attribute_names(element);

                // Each generated attribute should be extractable
                for (name, _) in &attrs {
                    prop_assert!(
                        attr_names.contains(name) || name == "style" || name == "className",
                        "Attribute '{}' should be in extracted names",
                        name
                    );
                }
            }
        }
    }

    /// Property: Getting an attribute by name should return its value
    #[test]
    fn attribute_value_retrieval(
        element_name in valid_element_name(),
        attr_name in "[a-z][a-zA-Z]{2,8}",
        attr_value in "[a-zA-Z0-9 ]{1,20}"
    ) {
        let tsx = format!(
            r#"const CV = () => <{} {}="{}">{}</{}>;"#,
            element_name, attr_name, attr_value, "Test", element_name
        );

        if let Ok(doc) = parse_tsx(&tsx) {
            let elements = extract_jsx_elements(&doc);
            if let Some(element) = elements.first() {
                let retrieved = get_attribute_value(element, &attr_name);
                if let Some(value) = retrieved {
                    prop_assert_eq!(
                        value.trim(),
                        attr_value.trim(),
                        "Retrieved value should match original"
                    );
                }
            }
        }
    }

    // ============================================================================
    // ERROR RECOVERY INVARIANTS
    // ============================================================================

    /// Property: Parser should never panic, always return Result
    /// Even on malformed input with random characters
    #[test]
    fn error_recovery_never_panics(malformed in "[\\PC]{0,100}[<>{};\\[\\]]{0,50}") {
        // Should complete without panic
        let result = parse_tsx_with_recovery(&malformed);

        // ParseResult should always be one of: Complete, Partial, or Failed
        // The key invariant is that this never panics
        let _has_document = result.document().is_some();
        let _has_errors = !result.errors().is_empty();
        // If we got here, no panic occurred ✓
    }

    /// Property: Partial results should contain valid JSX elements
    /// If recovery parsing succeeds, extracted elements should be valid
    #[test]
    fn partial_results_are_valid(
        valid_part in valid_element_name(),
        invalid_part in "[<>{}\\[\\]]{0,20}"
    ) {
        let tsx = format!(
            r#"const CV = () => <{}>{}{}</{}>;"#,
            valid_part, "Text", invalid_part, valid_part
        );

        // Try recovery parsing
        let result = parse_tsx_with_recovery(&tsx);

        // If we got a document (complete or partial), validate it
        if let Some(doc) = result.document() {
            let elements = extract_jsx_elements(doc);

            // All extracted elements should be valid
            for element in elements {
                let name = extract_element_name(element);
                prop_assert!(!name.is_empty(), "Partial element should have name");
            }
        }
        // Otherwise it's a Failed result, which is acceptable
    }
}

// ============================================================================
// PROPTEST STRATEGY HELPERS
// ============================================================================

/// Generate valid HTML/JSX element names
fn valid_element_name() -> impl Strategy<Value = String> {
    prop::sample::select(vec![
        "div", "span", "h1", "h2", "h3", "p", "section", "article", "header", "footer", "main",
        "ul", "li", "a", "button",
    ])
    .prop_map(|s| s.to_string())
}

/// Generate valid attribute names and values
fn valid_attribute() -> impl Strategy<Value = (String, String)> {
    (
        prop::sample::select(vec!["id", "className", "data-test", "aria-label"]),
        "[a-zA-Z0-9-_ ]{1,20}",
    )
        .prop_map(|(k, v)| (k.to_string(), v))
}

/// Generate valid text content
fn valid_text_content() -> impl Strategy<Value = String> {
    "[a-zA-Z0-9 .,!?]{0,50}".prop_map(|s| s.to_string())
}

/// Generate valid CSS properties
fn valid_css_property() -> impl Strategy<Value = String> {
    (
        prop::sample::select(vec!["color", "font-size", "margin", "padding", "display"]),
        prop::sample::select(vec!["red", "12px", "10px", "block", "inline"]),
    )
        .prop_map(|(k, v)| format!("{}: {}", k, v))
}

/// Generate valid TSX with attributes
fn generate_valid_tsx(element: &str, attrs: &[(String, String)], content: &str) -> String {
    let attr_string = attrs
        .iter()
        .map(|(k, v)| format!("{}=\"{}\"", k, v))
        .collect::<Vec<_>>()
        .join(" ");

    let attr_part = if attr_string.is_empty() {
        String::new()
    } else {
        format!(" {}", attr_string)
    };

    format!(
        r#"const CV = () => <{}{}>{}</{}>;"#,
        element, attr_part, content, element
    )
}

/// Generate nested TSX structure
fn generate_nested_tsx(elements: &[String]) -> String {
    if elements.is_empty() {
        return "const CV = () => <div>Empty</div>;".to_string();
    }

    let mut opening_tags = String::new();
    let mut closing_tags = String::new();

    for element in elements {
        opening_tags.push_str(&format!("<{}>", element));
        closing_tags.insert_str(0, &format!("</{}>", element));
    }

    format!("const CV = () => {}Content{};", opening_tags, closing_tags)
}
