//! JSX element traversal and collection
//!
//! This module provides functions to recursively traverse the AST and collect JSX elements.
//! By using direct recursion instead of the visitor pattern, we avoid lifetime issues
//! and eliminate the need for unsafe code.

use oxc_ast::ast::{Declaration, Expression, JSXChild, JSXElement, Statement};

/// Extract all JSX elements from the parsed document
///
/// This function walks the AST and collects all JSXElement nodes using direct recursion.
/// By using direct recursion instead of the visitor pattern, we avoid lifetime issues
/// and eliminate the need for unsafe code.
///
/// # Arguments
/// * `document` - The parsed TSX document
///
/// # Returns
/// A vector of references to JSXElement nodes found in the AST
pub fn extract_jsx_elements<'a>(document: &'a crate::TsxDocument) -> Vec<&'a JSXElement<'a>> {
    let mut elements = Vec::new();

    for stmt in &document.program().body {
        collect_jsx_from_statement(stmt, &mut elements);
    }

    elements
}

/// Recursively collect JSX elements from a statement.
///
/// Entry point for AST traversal from the document body.
fn collect_jsx_from_statement<'a>(stmt: &'a Statement<'a>, elements: &mut Vec<&'a JSXElement<'a>>) {
    match stmt {
        Statement::ExpressionStatement(expr_stmt) => {
            collect_jsx_from_expr(&expr_stmt.expression, elements);
        }
        Statement::ReturnStatement(return_stmt) => {
            if let Some(arg) = &return_stmt.argument {
                collect_jsx_from_expr(arg, elements);
            }
        }
        Statement::BlockStatement(block_stmt) => {
            for stmt in &block_stmt.body {
                collect_jsx_from_statement(stmt, elements);
            }
        }
        // Handle variable declarations (inherited from Declaration)
        Statement::VariableDeclaration(var_decl) => {
            for declarator in &var_decl.declarations {
                if let Some(init) = &declarator.init {
                    collect_jsx_from_expr(init, elements);
                }
            }
        }
        // Handle function declarations (inherited from Declaration)
        Statement::FunctionDeclaration(fn_decl) => {
            if let Some(body) = &fn_decl.body {
                for stmt in &body.statements {
                    collect_jsx_from_statement(stmt, elements);
                }
            }
        }
        // Handle export default declaration (inherited from ModuleDeclaration)
        Statement::ExportDefaultDeclaration(export) => {
            use oxc_ast::ast::ExportDefaultDeclarationKind;
            match &export.declaration {
                ExportDefaultDeclarationKind::FunctionDeclaration(fn_decl) => {
                    if let Some(body) = &fn_decl.body {
                        for stmt in &body.statements {
                            collect_jsx_from_statement(stmt, elements);
                        }
                    }
                }
                // Expression variants are inherited into ExportDefaultDeclarationKind
                // Check for JSX element directly
                ExportDefaultDeclarationKind::JSXElement(jsx_elem) => {
                    elements.push(jsx_elem);
                    collect_jsx_from_element(jsx_elem, elements);
                }
                // Handle parenthesized expressions that may contain JSX
                ExportDefaultDeclarationKind::ParenthesizedExpression(paren) => {
                    collect_jsx_from_expr(&paren.expression, elements);
                }
                // Handle arrow functions
                ExportDefaultDeclarationKind::ArrowFunctionExpression(arrow) => {
                    let body = &*arrow.body;
                    if body.statements.len() == 1 {
                        if let Statement::ExpressionStatement(expr_stmt) = &body.statements[0] {
                            collect_jsx_from_expr(&expr_stmt.expression, elements);
                            return;
                        }
                    }
                    for stmt in &body.statements {
                        collect_jsx_from_statement(stmt, elements);
                    }
                }
                _ => {}
            }
        }
        // Handle export named declaration (inherited from ModuleDeclaration)
        Statement::ExportNamedDeclaration(export) => {
            if let Some(decl) = &export.declaration {
                collect_jsx_from_decl(decl, elements);
            }
        }
        _ => {}
    }
}

/// Recursively collect JSX elements from a declaration.
fn collect_jsx_from_decl<'a>(decl: &'a Declaration<'a>, elements: &mut Vec<&'a JSXElement<'a>>) {
    match decl {
        Declaration::VariableDeclaration(var_decl) => {
            for declarator in &var_decl.declarations {
                if let Some(init) = &declarator.init {
                    collect_jsx_from_expr(init, elements);
                }
            }
        }
        Declaration::FunctionDeclaration(fn_decl) => {
            if let Some(body) = &fn_decl.body {
                for stmt in &body.statements {
                    collect_jsx_from_statement(stmt, elements);
                }
            }
        }
        _ => {}
    }
}

/// Recursively collect JSX elements from an expression.
///
/// Core collection function that identifies JSX elements and traverses nested
/// expressions that may contain JSX.
pub fn collect_jsx_from_expr<'a>(expr: &'a Expression<'a>, elements: &mut Vec<&'a JSXElement<'a>>) {
    match expr {
        Expression::JSXElement(jsx_elem) => {
            // Collect this element
            elements.push(jsx_elem);
            // Recursively collect from children
            collect_jsx_from_element(jsx_elem, elements);
        }
        Expression::ParenthesizedExpression(paren) => {
            collect_jsx_from_expr(&paren.expression, elements);
        }
        Expression::ArrowFunctionExpression(arrow) => {
            // Arrow function body is in a Box
            let body = &*arrow.body;
            // Check if it's an expression body (single expression return)
            if body.statements.len() == 1 {
                if let Statement::ExpressionStatement(expr_stmt) = &body.statements[0] {
                    collect_jsx_from_expr(&expr_stmt.expression, elements);
                    return;
                }
            }
            // Otherwise traverse all statements
            for stmt in &body.statements {
                collect_jsx_from_statement(stmt, elements);
            }
        }
        Expression::CallExpression(call) => {
            for arg in &call.arguments {
                if let oxc_ast::ast::Argument::SpreadElement(spread) = arg {
                    collect_jsx_from_expr(&spread.argument, elements);
                } else if let Some(expr) = arg.as_expression() {
                    collect_jsx_from_expr(expr, elements);
                }
            }
        }
        Expression::ConditionalExpression(cond) => {
            collect_jsx_from_expr(&cond.consequent, elements);
            collect_jsx_from_expr(&cond.alternate, elements);
        }
        Expression::JSXFragment(fragment) => {
            for child in &fragment.children {
                if let JSXChild::Element(child_elem) = child {
                    elements.push(child_elem);
                    collect_jsx_from_element(child_elem, elements);
                }
            }
        }
        _ => {}
    }
}

/// Recursively collect JSX elements from a JSX element's children.
pub fn collect_jsx_from_element<'a>(
    element: &'a JSXElement<'a>,
    elements: &mut Vec<&'a JSXElement<'a>>,
) {
    for child in &element.children {
        if let JSXChild::Element(child_elem) = child {
            // Collect this child element
            elements.push(child_elem);
            // Recursively collect from its children
            collect_jsx_from_element(child_elem, elements);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parse_tsx;

    #[test]
    fn test_collect_jsx_from_export_default_fn() {
        let tsx = r#"
            export default function CV() {
                return <div>Test</div>;
            }
        "#;

        let document = parse_tsx(tsx).unwrap();
        let elements = extract_jsx_elements(&document);

        assert!(
            !elements.is_empty(),
            "Should collect JSX from export default function"
        );
    }

    #[test]
    fn test_collect_jsx_from_expr_stmt() {
        let tsx = r#"
            const CV = () => {
                <div>Expression statement</div>;
                return null;
            };
        "#;

        let document = parse_tsx(tsx).unwrap();
        let elements = extract_jsx_elements(&document);

        // Should collect JSX even from expression statements
        assert!(elements.iter().any(|e| {
            crate::extraction::attributes::extract_text_content(e)
                .iter()
                .any(|t| t.contains("Expression statement"))
        }));
    }

    #[test]
    fn test_collect_jsx_from_block_stmt() {
        let tsx = r#"
            const CV = () => {
                {
                    const inner = <div>Block statement</div>;
                }
                return <span>Outer</span>;
            };
        "#;

        let document = parse_tsx(tsx).unwrap();
        let elements = extract_jsx_elements(&document);

        assert!(
            elements.len() >= 2,
            "Should collect from both outer and block statement"
        );
    }

    #[test]
    fn test_collect_jsx_from_conditional_expr() {
        let tsx = r#"
            const CV = () => (
                condition ? <div>True branch</div> : <div>False branch</div>
            );
        "#;

        let document = parse_tsx(tsx).unwrap();
        let elements = extract_jsx_elements(&document);

        assert!(
            elements.len() >= 2,
            "Should collect from both conditional branches"
        );

        let has_true_branch = elements.iter().any(|e| {
            crate::extraction::attributes::extract_text_content(e)
                .iter()
                .any(|t| t.contains("True branch"))
        });

        let has_false_branch = elements.iter().any(|e| {
            crate::extraction::attributes::extract_text_content(e)
                .iter()
                .any(|t| t.contains("False branch"))
        });

        assert!(has_true_branch, "Should find true branch JSX");
        assert!(has_false_branch, "Should find false branch JSX");
    }
}
