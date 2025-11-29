//! TSX parsing functions using oxc_parser

use crate::error::{ParseError, ParseResult};

/// Maximum allowed TSX input size (1MB)
pub(crate) const MAX_TSX_SIZE: usize = 1_048_576;

/// Parse TSX source code into TsxDocument with error recovery
///
/// This function uses oxc_parser's error recovery mode to collect multiple syntax errors
/// and return a partial AST when possible. This is useful for providing better
/// error messages and allowing partial preview of valid sections.
///
/// # Arguments
/// * `tsx` - The TSX source code string
///
/// # Returns
/// A ParseResult which can be:
/// - `Complete(document)` - Parsing succeeded with no errors
/// - `Partial { document, errors }` - Parsing succeeded partially with recoverable errors
/// - `Failed { errors }` - Parsing failed completely
///
/// # Example
/// ```
/// use tsx_parser::parse_tsx_with_recovery;
///
/// let tsx = r#"
///   const CV = () => (
///     <div style="color: red">
///       <h1>Unclosed tag
///     </div>
///   );
/// "#;
///
/// let result = parse_tsx_with_recovery(tsx);
/// if let Some(doc) = result.document() {
///     // Can still work with partial document
///     println!("Found {} errors", result.errors().len());
/// }
/// ```
pub fn parse_tsx_with_recovery(tsx: &str) -> ParseResult {
    // Validate input size to prevent DoS attacks
    if tsx.len() > MAX_TSX_SIZE {
        return ParseResult::Failed {
            errors: vec![ParseError::InvalidStructure {
                message: format!(
                    "TSX input too large: {} bytes (max: {} bytes)",
                    tsx.len(),
                    MAX_TSX_SIZE
                ),
            }],
        };
    }

    // Validate input is not empty
    if tsx.trim().is_empty() {
        return ParseResult::Failed {
            errors: vec![ParseError::InvalidStructure {
                message: "TSX input cannot be empty".to_string(),
            }],
        };
    }

    // Parse using TsxDocument::from_source which handles allocator lifetime correctly
    match super::TsxDocument::from_source(tsx.to_string()) {
        Ok(document) => {
            // Validate supported features
            match crate::validation::validate_supported_features(&document) {
                Ok(()) => ParseResult::Complete(document),
                Err(feature_error) => ParseResult::Partial {
                    document,
                    errors: vec![feature_error],
                },
            }
        }
        Err((mut errors, maybe_doc)) => {
            if let Some(document) = maybe_doc {
                // Validate supported features
                if let Err(feature_error) =
                    crate::validation::validate_supported_features(&document)
                {
                    errors.push(feature_error);
                }
                ParseResult::Partial { document, errors }
            } else {
                ParseResult::Failed { errors }
            }
        }
    }
}

/// Parse TSX source code into TsxDocument (legacy function)
///
/// This function provides backward compatibility with the original API.
/// For new code, consider using `parse_tsx_with_recovery` which provides
/// better error handling and partial parsing support.
///
/// # Arguments
/// * `tsx` - The TSX source code string
///
/// # Returns
/// A TsxDocument containing the parsed AST, or a ParseError if parsing fails
///
/// # Example
/// ```
/// use tsx_parser::parse_tsx;
///
/// let tsx = r#"
///   const CV = () => (
///     <div style="color: red">
///       <h1>John Doe</h1>
///     </div>
///   );
/// "#;
///
/// let document = parse_tsx(tsx).unwrap();
/// ```
pub fn parse_tsx(tsx: &str) -> Result<super::TsxDocument, ParseError> {
    // Validate input size to prevent DoS attacks
    if tsx.len() > MAX_TSX_SIZE {
        return Err(ParseError::InvalidStructure {
            message: format!(
                "TSX input too large: {} bytes (max: {} bytes)",
                tsx.len(),
                MAX_TSX_SIZE
            ),
        });
    }

    // Validate input is not empty
    if tsx.trim().is_empty() {
        return Err(ParseError::InvalidStructure {
            message: "TSX input cannot be empty".to_string(),
        });
    }

    // Parse using TsxDocument::from_source which handles allocator lifetime correctly
    match super::TsxDocument::from_source(tsx.to_string()) {
        Ok(document) => {
            // Validate supported features
            crate::validation::validate_supported_features(&document)?;
            Ok(document)
        }
        Err((errors, _)) => {
            // Return the first error
            Err(errors
                .into_iter()
                .next()
                .unwrap_or_else(|| ParseError::InvalidStructure {
                    message: "Unknown parsing error".to_string(),
                }))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_with_recovery_oversized_input() {
        // Create input larger than MAX_TSX_SIZE (1MB)
        let large_tsx = "a".repeat(MAX_TSX_SIZE + 1);
        let result = parse_tsx_with_recovery(&large_tsx);

        assert!(
            matches!(result, ParseResult::Failed { .. }),
            "Oversized input should fail"
        );
        assert_eq!(result.errors().len(), 1, "Should have exactly one error");

        // Verify the error is InvalidStructure with appropriate message
        let error = result.errors().first().expect("Should have an error");
        assert!(
            matches!(error, ParseError::InvalidStructure { .. }),
            "Expected InvalidStructure error, got: {:?}",
            error
        );

        if let ParseError::InvalidStructure { message } = error {
            assert!(
                message.contains("too large"),
                "Error should mention size limit, got: {}",
                message
            );
            assert!(
                message.contains(&MAX_TSX_SIZE.to_string()),
                "Error should mention max size"
            );
        }
    }

    #[test]
    fn test_parse_with_recovery_empty_input() {
        let result = parse_tsx_with_recovery("");
        assert!(matches!(result, ParseResult::Failed { .. }));

        if let Some(ParseError::InvalidStructure { message }) = result.errors().first() {
            assert!(
                message.contains("empty"),
                "Error should mention empty input"
            );
        }
    }

    #[test]
    fn test_parse_with_recovery_whitespace_only() {
        let result = parse_tsx_with_recovery("   \n\t  ");
        assert!(matches!(result, ParseResult::Failed { .. }));
    }

    #[test]
    fn test_tsx_document_display() {
        let tsx = r#"const CV = () => <div>Test</div>;"#;
        let document = parse_tsx(tsx).unwrap();
        let display_string = format!("{}", document);

        // Should include element count and source preview
        assert!(display_string.contains("TsxDocument"));
        assert!(display_string.contains("elements"));
    }
}
