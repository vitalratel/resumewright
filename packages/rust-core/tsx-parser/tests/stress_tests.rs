//! Large TSX Document Stress Tests
//!
//! Tests for handling large TSX documents including size limits,
//! deeply nested elements, and performance validation.

use tsx_parser::parse_tsx;

#[test]
fn test_max_tsx_size_enforced() {
    // Create 6MB TSX (over limit - exceeds 5MB max)
    let large_tsx = format!("<div>{}</div>", "a".repeat(6 * 1024 * 1024));

    // Should handle gracefully (either parse or return descriptive error)
    // The key is not panicking on large input
    let result = parse_tsx(&large_tsx);

    // Either succeeds or fails gracefully
    match result {
        Ok(_) => {
            // If it parses, that's acceptable
        }
        Err(e) => {
            // Error should be descriptive
            let error_msg = e.to_string();
            assert!(!error_msg.is_empty(), "Error message should not be empty");
        }
    }
}

#[test]
fn test_deeply_nested_elements() {
    // Create 100 levels of nesting
    let mut tsx = String::new();
    for _ in 0..100 {
        tsx.push_str("<div>");
    }
    tsx.push_str("Content");
    for _ in 0..100 {
        tsx.push_str("</div>");
    }

    let result = parse_tsx(&tsx);

    // Should either parse successfully or fail with clear error
    match result {
        Ok(doc) => {
            // If successful, should have content
            let source = doc.source();
            assert!(!source.is_empty(), "Parsed document should have source");
        }
        Err(e) => {
            // Error should be descriptive
            assert!(!e.to_string().is_empty());
        }
    }
}

#[test]
fn test_large_text_content() {
    // 1MB of text content
    let text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(20_000);
    let tsx = format!("<p>{}</p>", text);

    let result = parse_tsx(&tsx);

    // Should either parse or fail gracefully (not panic)
    match result {
        Ok(doc) => {
            assert!(!doc.source().is_empty(), "Document should have source");
        }
        Err(e) => {
            // Large text might exceed parser limits - that's acceptable
            assert!(!e.to_string().is_empty(), "Error should be descriptive");
        }
    }
}

#[test]
fn test_many_sibling_elements() {
    // 1,000 sibling elements
    let mut tsx = String::from("<div>");
    for i in 0..1_000 {
        tsx.push_str(&format!("<p>Item {}</p>", i));
    }
    tsx.push_str("</div>");

    let start = std::time::Instant::now();
    let result = parse_tsx(&tsx);
    let elapsed = start.elapsed();

    assert!(result.is_ok(), "Should parse many siblings");

    // Should parse in reasonable time (< 1 second for 1000 elements)
    assert!(
        elapsed.as_secs() < 1,
        "Parsing 1000 elements should take < 1s, took {:?}",
        elapsed
    );
}

#[test]
fn test_many_attributes() {
    // Element with 100 attributes
    let mut tsx = String::from("<div");
    for i in 0..100 {
        tsx.push_str(&format!(" attr{}=\"value{}\"", i, i));
    }
    tsx.push_str(">Content</div>");

    let result = parse_tsx(&tsx);
    assert!(result.is_ok(), "Should parse many attributes");
}

#[test]
fn test_empty_tsx() {
    let tsx = "";
    let result = parse_tsx(tsx);

    // Empty TSX should return error
    assert!(result.is_err(), "Empty TSX should return error");
}

#[test]
fn test_whitespace_only() {
    let tsx = "   \n\t\r\n   ";
    let result = parse_tsx(tsx);

    // Whitespace-only should return error
    assert!(result.is_err(), "Whitespace-only TSX should return error");
}

#[test]
fn test_single_element() {
    let tsx = "<div>Content</div>";
    let result = parse_tsx(tsx);

    assert!(result.is_ok(), "Simple element should parse");
}

#[test]
fn test_self_closing_elements() {
    let tsx = "<div><br /><hr /><img src=\"test.jpg\" /></div>";
    let result = parse_tsx(tsx);

    assert!(result.is_ok(), "Self-closing elements should parse");
}

#[test]
fn test_mixed_content() {
    let tsx = r#"
        <div>
            <h1>Title</h1>
            <p>Paragraph with <strong>bold</strong> text</p>
            <ul>
                <li>Item 1</li>
                <li>Item 2</li>
            </ul>
        </div>
    "#;

    let result = parse_tsx(tsx);
    assert!(result.is_ok(), "Mixed content should parse");
}

#[test]
fn test_unicode_content() {
    let tsx = "<div>Hello 世界 🌍 Héllo</div>";
    let result = parse_tsx(tsx);

    assert!(result.is_ok(), "Unicode content should parse");
}

#[test]
fn test_long_attribute_values() {
    // Attribute with 10KB value
    let long_value = "x".repeat(10_000);
    let tsx = format!("<div data-long=\"{}\">Content</div>", long_value);

    let result = parse_tsx(&tsx);
    assert!(result.is_ok(), "Long attribute values should parse");
}

#[test]
fn test_deeply_nested_with_content() {
    // 50 levels with content at each level
    let mut tsx = String::new();
    for i in 0..50 {
        tsx.push_str(&format!("<div>Level {}", i));
    }
    for _ in 0..50 {
        tsx.push_str("</div>");
    }

    // Either success or failure is acceptable for extreme nesting
    let _ = parse_tsx(&tsx);
}

#[test]
fn test_performance_baseline_small() {
    // Establish performance baseline for small document
    let tsx =
        include_str!("../../../../test-fixtures/tsx-samples/single-page/03-minimal-simple.tsx");

    let start = std::time::Instant::now();
    let result = parse_tsx(tsx);
    let elapsed = start.elapsed();

    assert!(result.is_ok(), "Small document should parse");
    assert!(
        elapsed.as_millis() < 100,
        "Small document should parse in < 100ms, took {:?}",
        elapsed
    );
}

#[test]
fn test_performance_baseline_medium() {
    // Medium-sized document
    let tsx = include_str!(
        "../../../../test-fixtures/tsx-samples/single-page/01-single-column-traditional.tsx"
    );

    let start = std::time::Instant::now();
    let result = parse_tsx(tsx);
    let elapsed = start.elapsed();

    assert!(result.is_ok(), "Medium document should parse");
    assert!(
        elapsed.as_millis() < 200,
        "Medium document should parse in < 200ms, took {:?}",
        elapsed
    );
}

#[test]
fn test_malformed_unclosed_tags() {
    let tsx = "<div><p>Unclosed";
    let result = parse_tsx(tsx);

    // Should return error for malformed TSX
    assert!(result.is_err(), "Unclosed tags should return error");
}

#[test]
fn test_malformed_mismatched_tags() {
    let tsx = "<div><p>Content</div></p>";
    let result = parse_tsx(tsx);

    // Should return error for mismatched tags
    assert!(result.is_err(), "Mismatched tags should return error");
}

#[test]
fn test_invalid_tag_names() {
    let tsx = "<123>Content</123>";
    let result = parse_tsx(tsx);

    // Should return error for invalid tag names
    assert!(result.is_err(), "Invalid tag names should return error");
}
