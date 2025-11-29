//! Error types for TSX parsing

use serde::{Deserialize, Serialize};
use thiserror::Error;

/// TSX parsing error with detailed location information and user-friendly messages
#[derive(Error, Debug, Clone, Serialize, Deserialize)]
pub enum ParseError {
    #[error("Syntax error at line {line}, column {column}: {message}")]
    SyntaxError {
        line: usize,
        column: usize,
        message: String,
    },

    #[error("Unsupported TSX feature: {feature}")]
    UnsupportedFeature {
        feature: String,
        suggestions: Vec<String>,
    },

    #[error("Invalid TSX structure: {message}")]
    InvalidStructure { message: String },
}

impl ParseError {
    /// Convert technical error to user-friendly message
    pub fn user_friendly_message(&self) -> String {
        match self {
            ParseError::SyntaxError {
                line,
                column,
                message,
            } => {
                // Make syntax errors more actionable
                if message.contains("expected") || message.contains("unexpected") {
                    format!(
                        "There's a syntax issue at line {}, column {}. Please check your JSX/TSX syntax around this location. Common fixes: ensure all tags are properly closed, check for missing commas, and verify quotes match.",
                        line, column
                    )
                } else if message.contains("EOF") || message.contains("end of file") {
                    format!(
                        "Your CV code appears incomplete (ends unexpectedly at line {}). Please make sure all opening tags like <div> have matching closing tags like </div>.",
                        line
                    )
                } else {
                    format!(
                        "There's a formatting issue at line {}, column {}. {}",
                        line, column, message
                    )
                }
            }
            ParseError::UnsupportedFeature {
                feature,
                suggestions,
            } => {
                if suggestions.is_empty() {
                    format!(
                        "The feature '{}' isn't supported yet. Please use standard React/JSX syntax for your CV.",
                        feature
                    )
                } else {
                    format!(
                        "The feature '{}' isn't supported. Try instead: {}",
                        feature,
                        suggestions.join(", ")
                    )
                }
            }
            ParseError::InvalidStructure { message } => {
                // Convert technical messages to user-friendly ones
                if message.contains("missing") && message.contains("name") {
                    "Your CV is missing a name. Please add your full name to continue.".to_string()
                } else if message.contains("missing") && message.contains("section") {
                    "Your CV needs at least one main section (like work experience or education)."
                        .to_string()
                } else if message.contains("empty") {
                    "Your CV appears to be empty. Please add your professional information."
                        .to_string()
                } else if message.contains("required field") {
                    format!("A required field is missing. {}", message)
                } else {
                    format!("There's an issue with your CV structure: {}", message)
                }
            }
        }
    }
}

/// Result of TSX parsing, supporting partial parsing with error recovery
#[derive(Debug, Clone)]
pub enum ParseResult {
    /// Parsing succeeded with no errors
    Complete(super::TsxDocument),

    /// Parsing succeeded partially with recoverable errors
    /// The document may be incomplete but can still be used for partial preview
    Partial {
        document: super::TsxDocument,
        errors: Vec<ParseError>,
    },

    /// Parsing failed completely with unrecoverable errors
    Failed { errors: Vec<ParseError> },
}

impl ParseResult {
    /// Returns true if parsing succeeded (either completely or partially)
    pub fn is_ok(&self) -> bool {
        matches!(self, ParseResult::Complete(_) | ParseResult::Partial { .. })
    }

    /// Returns true if parsing failed completely
    pub fn is_err(&self) -> bool {
        matches!(self, ParseResult::Failed { .. })
    }

    /// Get the document if available (complete or partial)
    pub fn document(&self) -> Option<&super::TsxDocument> {
        match self {
            ParseResult::Complete(doc) | ParseResult::Partial { document: doc, .. } => Some(doc),
            ParseResult::Failed { .. } => None,
        }
    }

    /// Get all errors (empty for Complete, populated for Partial/Failed)
    pub fn errors(&self) -> &[ParseError] {
        match self {
            ParseResult::Complete(_) => &[],
            ParseResult::Partial { errors, .. } | ParseResult::Failed { errors } => errors,
        }
    }

    /// Unwrap the document, panicking if parsing failed
    pub fn unwrap(self) -> super::TsxDocument {
        match self {
            ParseResult::Complete(doc) | ParseResult::Partial { document: doc, .. } => doc,
            ParseResult::Failed { errors } => {
                panic!("Parse failed with {} errors: {:?}", errors.len(), errors)
            }
        }
    }

    /// Convert to Result for backward compatibility
    /// Returns Ok for Complete, Err with first error for Partial/Failed
    pub fn into_result(self) -> Result<super::TsxDocument, ParseError> {
        match self {
            ParseResult::Complete(doc) => Ok(doc),
            ParseResult::Partial { errors, .. } | ParseResult::Failed { errors } => Err(errors
                .into_iter()
                .next()
                .unwrap_or_else(|| ParseError::InvalidStructure {
                    message: "Unknown parsing error".to_string(),
                })),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Tests for ParseError::user_friendly_message()

    #[test]
    fn test_user_friendly_message_syntax_error_expected() {
        let error = ParseError::SyntaxError {
            line: 10,
            column: 5,
            message: "expected closing tag".to_string(),
        };

        let friendly = error.user_friendly_message();
        assert!(friendly.contains("syntax issue"));
        assert!(friendly.contains("line 10"));
        assert!(friendly.contains("column 5"));
        assert!(friendly.contains("tags are properly closed"));
    }

    #[test]
    fn test_user_friendly_message_syntax_error_unexpected() {
        let error = ParseError::SyntaxError {
            line: 15,
            column: 20,
            message: "unexpected token".to_string(),
        };

        let friendly = error.user_friendly_message();
        assert!(friendly.contains("syntax issue"));
        assert!(friendly.contains("line 15"));
        assert!(friendly.contains("column 20"));
    }

    #[test]
    fn test_user_friendly_message_syntax_error_eof() {
        // Note: "unexpected EOF" matches "unexpected" condition first
        let error = ParseError::SyntaxError {
            line: 42,
            column: 1,
            message: "unexpected EOF".to_string(),
        };

        let friendly = error.user_friendly_message();
        assert!(friendly.contains("syntax issue"));
        assert!(friendly.contains("line 42"));
        assert!(friendly.contains("column 1"));
    }

    #[test]
    fn test_user_friendly_message_syntax_error_end_of_file() {
        // "end of file" without "expected" or "unexpected" matches EOF condition
        let error = ParseError::SyntaxError {
            line: 30,
            column: 10,
            message: "reached end of file".to_string(),
        };

        let friendly = error.user_friendly_message();
        assert!(friendly.contains("incomplete"));
        assert!(friendly.contains("line 30"));
        assert!(friendly.contains("opening tags"));
        assert!(friendly.contains("closing tags"));
    }

    #[test]
    fn test_user_friendly_message_syntax_error_other() {
        let error = ParseError::SyntaxError {
            line: 8,
            column: 12,
            message: "some other syntax problem".to_string(),
        };

        let friendly = error.user_friendly_message();
        assert!(friendly.contains("formatting issue"));
        assert!(friendly.contains("line 8"));
        assert!(friendly.contains("column 12"));
        assert!(friendly.contains("some other syntax problem"));
    }

    #[test]
    fn test_user_friendly_message_unsupported_feature_with_suggestions() {
        let error = ParseError::UnsupportedFeature {
            feature: "JSX fragments".to_string(),
            suggestions: vec![
                "Use a <div> wrapper".to_string(),
                "Wrap content in semantic HTML".to_string(),
            ],
        };

        let friendly = error.user_friendly_message();
        assert!(friendly.contains("JSX fragments"));
        assert!(friendly.contains("isn't supported"));
        assert!(friendly.contains("Try instead"));
        assert!(friendly.contains("Use a <div> wrapper"));
        assert!(friendly.contains("Wrap content in semantic HTML"));
    }

    #[test]
    fn test_user_friendly_message_unsupported_feature_no_suggestions() {
        let error = ParseError::UnsupportedFeature {
            feature: "async components".to_string(),
            suggestions: vec![],
        };

        let friendly = error.user_friendly_message();
        assert!(friendly.contains("async components"));
        assert!(friendly.contains("isn't supported yet"));
        assert!(friendly.contains("standard React/JSX syntax"));
    }

    #[test]
    fn test_user_friendly_message_invalid_structure_missing_name() {
        let error = ParseError::InvalidStructure {
            message: "missing name field".to_string(),
        };

        let friendly = error.user_friendly_message();
        assert!(friendly.contains("CV is missing a name"));
        assert!(friendly.contains("add your full name"));
    }

    #[test]
    fn test_user_friendly_message_invalid_structure_missing_section() {
        let error = ParseError::InvalidStructure {
            message: "missing section in CV".to_string(),
        };

        let friendly = error.user_friendly_message();
        assert!(friendly.contains("needs at least one main section"));
        assert!(friendly.contains("work experience or education"));
    }

    #[test]
    fn test_user_friendly_message_invalid_structure_empty() {
        let error = ParseError::InvalidStructure {
            message: "CV is empty".to_string(),
        };

        let friendly = error.user_friendly_message();
        assert!(friendly.contains("appears to be empty"));
        assert!(friendly.contains("add your professional information"));
    }

    #[test]
    fn test_user_friendly_message_invalid_structure_required_field() {
        let error = ParseError::InvalidStructure {
            message: "required field: email".to_string(),
        };

        let friendly = error.user_friendly_message();
        assert!(friendly.contains("required field is missing"));
        assert!(friendly.contains("required field: email"));
    }

    #[test]
    fn test_user_friendly_message_invalid_structure_other() {
        let error = ParseError::InvalidStructure {
            message: "some other structural problem".to_string(),
        };

        let friendly = error.user_friendly_message();
        assert!(friendly.contains("issue with your CV structure"));
        assert!(friendly.contains("some other structural problem"));
    }

    // Tests for ParseResult::into_result() edge case

    #[test]
    fn test_into_result_complete() {
        let tsx = "const CV = () => <div>Test</div>;";
        let doc = crate::parse_tsx(tsx).expect("Should parse valid TSX");
        let parse_result = ParseResult::Complete(doc);

        let result = parse_result.into_result();
        assert!(result.is_ok());
    }

    #[test]
    fn test_into_result_partial_with_errors() {
        let tsx = "const CV = () => <div>Test</div>;";
        let doc = crate::parse_tsx(tsx).expect("Should parse valid TSX");
        let error = ParseError::SyntaxError {
            line: 1,
            column: 1,
            message: "test error".to_string(),
        };
        let parse_result = ParseResult::Partial {
            document: doc,
            errors: vec![error],
        };

        let result = parse_result.into_result();
        assert!(result.is_err());
        if let Err(err) = result {
            assert!(matches!(err, ParseError::SyntaxError { .. }));
        }
    }

    #[test]
    fn test_into_result_failed_with_errors() {
        let error = ParseError::InvalidStructure {
            message: "test failure".to_string(),
        };
        let parse_result = ParseResult::Failed {
            errors: vec![error],
        };

        let result = parse_result.into_result();
        assert!(result.is_err());
        if let Err(err) = result {
            assert!(matches!(err, ParseError::InvalidStructure { .. }));
        }
    }

    #[test]
    fn test_into_result_partial_with_empty_errors() {
        // Edge case: Partial with empty errors vector
        // This shouldn't happen in practice but we test the fallback
        let tsx = "const CV = () => <div>Test</div>;";
        let doc = crate::parse_tsx(tsx).expect("Should parse valid TSX");
        let parse_result = ParseResult::Partial {
            document: doc,
            errors: vec![], // Empty errors - edge case
        };

        let result = parse_result.into_result();
        assert!(result.is_err());
        if let Err(err) = result {
            assert!(matches!(err, ParseError::InvalidStructure { .. }));
            if let ParseError::InvalidStructure { message } = err {
                assert_eq!(message, "Unknown parsing error");
            }
        }
    }

    #[test]
    fn test_into_result_failed_with_empty_errors() {
        // Edge case: Failed with empty errors vector
        // This shouldn't happen in practice but we test the fallback
        let parse_result = ParseResult::Failed {
            errors: vec![], // Empty errors - edge case
        };

        let result = parse_result.into_result();
        assert!(result.is_err());
        if let Err(err) = result {
            assert!(matches!(err, ParseError::InvalidStructure { .. }));
            if let ParseError::InvalidStructure { message } = err {
                assert_eq!(message, "Unknown parsing error");
            }
        }
    }
}
