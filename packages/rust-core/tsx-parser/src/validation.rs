//! TSX feature validation

use oxc_ast::ast::{Expression, JSXChild, JSXElement, Statement};

use crate::error::ParseError;

/// Check if an expression contains JSX fragments (recursive)
fn contains_fragment(expr: &Expression) -> bool {
    match expr {
        Expression::JSXFragment(_) => true,
        Expression::ParenthesizedExpression(paren) => contains_fragment(&paren.expression),
        Expression::ArrowFunctionExpression(arrow) => {
            // Check arrow function body
            let body = &*arrow.body;
            for stmt in &body.statements {
                if check_fragments_in_stmt(stmt) {
                    return true;
                }
            }
            false
        }
        Expression::ConditionalExpression(cond) => {
            contains_fragment(&cond.consequent) || contains_fragment(&cond.alternate)
        }
        _ => false,
    }
}

/// Check if any JSX elements contain spread children
fn check_spread_children(element: &JSXElement) -> bool {
    for child in &element.children {
        if matches!(child, JSXChild::Spread(_)) {
            return true;
        }
        if let JSXChild::Element(child_elem) = child {
            if check_spread_children(child_elem) {
                return true;
            }
        }
    }
    false
}

/// Recursively check for fragments in statements
fn check_fragments_in_stmt(stmt: &Statement) -> bool {
    match stmt {
        Statement::ExpressionStatement(expr_stmt) => contains_fragment(&expr_stmt.expression),
        Statement::ReturnStatement(ret) => {
            if let Some(arg) = &ret.argument {
                contains_fragment(arg)
            } else {
                false
            }
        }
        Statement::BlockStatement(block) => block.body.iter().any(check_fragments_in_stmt),
        // In oxc, VariableDeclaration is inherited directly into Statement
        Statement::VariableDeclaration(var_decl) => var_decl
            .declarations
            .iter()
            .any(|d| d.init.as_ref().is_some_and(|init| contains_fragment(init))),
        _ => false,
    }
}

/// Validate that the document only uses supported JSX features
///
/// # Arguments
/// * `document` - The parsed TSX document
///
/// # Returns
/// * `Ok(())` if all features are supported
/// * `Err(ParseError::UnsupportedFeature)` if unsupported features are detected
pub fn validate_supported_features(document: &super::TsxDocument) -> Result<(), ParseError> {
    // Check for JSX fragments
    for stmt in &document.program().body {
        if check_fragments_in_stmt(stmt) {
            return Err(ParseError::UnsupportedFeature {
                feature: "JSX fragments (<>...</>)".to_string(),
                suggestions: vec![
                    "Use a <div> wrapper instead".to_string(),
                    "Wrap content in a semantic HTML element".to_string(),
                ],
            });
        }
    }

    // Check for spread children in JSX elements
    let elements = crate::extract_jsx_elements(document);
    for element in elements {
        if check_spread_children(element) {
            return Err(ParseError::UnsupportedFeature {
                feature: "Spread children ({...items})".to_string(),
                suggestions: vec![
                    "Explicitly list child elements".to_string(),
                    "Use array.map() to generate children".to_string(),
                ],
            });
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parse_tsx;

    #[test]
    fn test_validate_supported_features_with_fragment() {
        let tsx = r#"
            const CV = () => (
                <>
                    <div>Content in fragment</div>
                </>
            );
        "#;

        let parse_result = crate::parse_tsx_with_recovery(tsx);

        if let Some(document) = parse_result.document() {
            let result = validate_supported_features(document);

            if let Err(crate::error::ParseError::UnsupportedFeature {
                feature,
                suggestions,
            }) = result
            {
                assert!(feature.contains("JSX fragments") || feature.contains("<>"));
                assert!(!suggestions.is_empty());
                assert!(suggestions.iter().any(|s| s.contains("<div>")));
                return;
            }
        }

        let has_fragment_error = parse_result.errors().iter().any(|e| match e {
            crate::error::ParseError::UnsupportedFeature { feature, .. } => {
                feature.contains("fragment")
            }
            _ => false,
        });

        assert!(
            has_fragment_error || parse_result.is_err(),
            "Should detect JSX fragments as unsupported either during parse or validation"
        );
    }

    #[test]
    fn test_validate_supported_features_with_spread_children() {
        let tsx = r#"
            const CV = () => (
                <div>
                    {...items}
                </div>
            );
        "#;

        let parse_result = crate::parse_tsx_with_recovery(tsx);

        if let Some(document) = parse_result.document() {
            let result = validate_supported_features(document);

            if let Err(crate::error::ParseError::UnsupportedFeature {
                feature,
                suggestions,
            }) = result
            {
                assert!(feature.contains("Spread children") || feature.contains("..."));
                assert!(!suggestions.is_empty());
                assert!(suggestions.iter().any(|s| s.contains("map")));
                return;
            }
        }

        let has_spread_error = parse_result.errors().iter().any(|e| match e {
            crate::error::ParseError::UnsupportedFeature { feature, .. } => {
                feature.contains("spread") || feature.contains("Spread")
            }
            _ => false,
        });

        assert!(
            has_spread_error || parse_result.is_err(),
            "Should detect spread children as unsupported either during parse or validation"
        );
    }

    #[test]
    fn test_validate_supported_features_valid_tsx() {
        let tsx = r#"
            const CV = () => (
                <div>
                    <h1>Title</h1>
                    <p>Content</p>
                </div>
            );
        "#;

        let document = parse_tsx(tsx).unwrap();
        let result = validate_supported_features(&document);

        assert!(result.is_ok());
    }
}
