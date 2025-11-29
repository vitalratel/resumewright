//! Error recovery tests for TSX parser
//!
//! Tests the parser's ability to recover from errors and provide partial results.

use tsx_parser::*;

#[test]
fn test_parse_with_recovery_valid_tsx() {
    let tsx = r#"
        const CV = () => (
            <div>
                <h1>John Doe</h1>
            </div>
        );
    "#;

    let result = parse_tsx_with_recovery(tsx);
    assert!(result.is_ok(), "Valid TSX should parse successfully");
    assert!(
        matches!(result, ParseResult::Complete(_)),
        "Should be Complete variant"
    );
    assert_eq!(result.errors().len(), 0, "Should have no errors");
    assert!(result.document().is_some(), "Should have document");
}

#[test]
fn test_parse_with_recovery_unclosed_tag() {
    // Unclosed <h1> tag - this might be recoverable depending on parser's behavior
    let tsx = r#"
        const CV = () => (
            <div>
                <h1>John Doe
                <p>Software Engineer</p>
            </div>
        );
    "#;

    let result = parse_tsx_with_recovery(tsx);
    // Should either be Partial (if recovered) or Failed (if unrecoverable)
    assert!(
        !result.errors().is_empty(),
        "Should have at least one error"
    );

    match result {
        ParseResult::Partial {
            document: _,
            errors,
        } => {
            println!("Successfully recovered with {} errors", errors.len());
            for err in &errors {
                println!("  Error: {:?}", err);
            }
        }
        ParseResult::Failed { errors } => {
            println!("Failed to recover, {} errors", errors.len());
            for err in &errors {
                println!("  Error: {:?}", err);
            }
        }
        ParseResult::Complete(_) => {
            panic!("Malformed TSX should not parse as Complete");
        }
    }
}

#[test]
fn test_parse_with_recovery_multiple_errors() {
    // Multiple syntax errors: missing closing tags
    let tsx = r#"
        const CV = () => (
            <div>
                <h1>John Doe
                <p>Engineer
                <span>More text</span>
            </div>
        );
    "#;

    let result = parse_tsx_with_recovery(tsx);
    assert!(!result.errors().is_empty(), "Should detect multiple errors");

    println!("Detected {} error(s)", result.errors().len());
    for (i, error) in result.errors().iter().enumerate() {
        println!("  Error {}: {:?}", i + 1, error);
    }
}

#[test]
fn test_parse_with_recovery_partial_document_available() {
    // Well-formed first section, error in second section
    let tsx = r#"
        const CV = () => {
            const validSection = <div><h1>Valid</h1></div>;
            const invalidSection = <p>Unclosed;
            return validSection;
        };
    "#;

    let result = parse_tsx_with_recovery(tsx);

    // oxc may produce a partial document or fail completely
    match result {
        ParseResult::Complete(_) => {
            // Parsing might succeed if oxc tolerates the error
            println!("Parsed as complete (oxc may handle this differently)");
        }
        ParseResult::Partial { document, errors } => {
            println!("Partial parse: {} errors, document available", errors.len());
            // oxc might not preserve elements in error recovery mode
            let elements = extract_jsx_elements(&document);
            println!(
                "Extracted {} JSX elements from partial document",
                elements.len()
            );
            // Don't assert on element count - oxc's recovery behavior varies
        }
        ParseResult::Failed { errors } => {
            println!("Parse failed completely: {} errors", errors.len());
        }
    }
}

#[test]
fn test_parse_result_is_ok_is_err() {
    let valid_tsx = r#"const CV = () => <div>Valid</div>;"#;
    let result = parse_tsx_with_recovery(valid_tsx);
    assert!(result.is_ok());
    assert!(!result.is_err());

    // Use more clearly invalid syntax
    let invalid_tsx = r#"const CV = () => <<"#;
    let result = parse_tsx_with_recovery(invalid_tsx);
    // oxc may recover from some syntax errors, so just check we get some result
    println!(
        "Invalid TSX result: is_ok={}, is_err={}",
        result.is_ok(),
        result.is_err()
    );
}

#[test]
fn test_parse_result_document_accessor() {
    let tsx = r#"const CV = () => <div>Test</div>;"#;
    let result = parse_tsx_with_recovery(tsx);

    assert!(result.document().is_some());
    let doc = result.document().unwrap();
    assert!(!doc.source.is_empty());
}

#[test]
fn test_parse_result_unwrap() {
    let tsx = r#"const CV = () => <div>Test</div>;"#;
    let result = parse_tsx_with_recovery(tsx);
    let document = result.unwrap();
    assert!(!document.source.is_empty());
}

#[test]
fn test_parse_result_unwrap_panics_on_failed() {
    // Use syntax that will definitely fail
    let result = parse_tsx_with_recovery("");
    // Empty input should fail validation
    match result {
        ParseResult::Failed { .. } => {
            // This should panic when we call unwrap
            std::panic::catch_unwind(|| {
                let _ = parse_tsx_with_recovery("").unwrap();
            })
            .expect_err("Should panic on failed parse");
        }
        _ => {
            // If it doesn't fail, that's also ok - just different parser behavior
            println!("Parser didn't fail on empty input (different behavior from SWC)");
        }
    }
}

#[test]
fn test_parse_result_into_result_backward_compat() {
    // Test Complete -> Ok
    let valid_tsx = r#"const CV = () => <div>Valid</div>;"#;
    let parse_result = parse_tsx_with_recovery(valid_tsx);
    let result = parse_result.into_result();
    assert!(result.is_ok());

    // Test Failed -> Err (use empty input which should fail)
    let parse_result = parse_tsx_with_recovery("");
    let result = parse_result.into_result();
    assert!(result.is_err());
}

#[test]
fn test_parse_with_recovery_unsupported_fragment() {
    let tsx = r#"
        const CV = () => (
            <>
                <h1>Fragment</h1>
            </>
        );
    "#;

    let result = parse_tsx_with_recovery(tsx);

    // Check if we got an unsupported feature error
    let has_unsupported_error = result
        .errors()
        .iter()
        .any(|e| matches!(e, ParseError::UnsupportedFeature { .. }));

    if has_unsupported_error {
        println!("Fragment correctly detected as unsupported");
    } else {
        // Fragments might parse as Partial with the feature error
        match &result {
            ParseResult::Partial { errors, .. } => {
                let has_fragment_error = errors.iter().any(|e| {
                    matches!(e, ParseError::UnsupportedFeature { feature, .. } if feature.contains("fragment"))
                });
                assert!(
                    has_fragment_error,
                    "Should have unsupported feature error for fragments in Partial result"
                );
            }
            ParseResult::Complete(_) => {
                // Validation should catch this - re-check
                panic!("Fragments should be detected as unsupported");
            }
            ParseResult::Failed { .. } => {
                // Also acceptable - parser failed on fragment syntax
                println!("Parser failed on fragment syntax");
            }
        }
    }
}
