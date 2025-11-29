//! JSX attribute extraction and parsing
//!
//! This module provides functions to extract attributes from JSX elements,
//! including style, className, element names, and text content.

use oxc_ast::ast::{
    JSXAttributeItem, JSXAttributeName, JSXAttributeValue, JSXChild, JSXElement, JSXElementName,
    JSXExpression, JSXMemberExpression,
};

/// Extract the inline style attribute from a JSX element
///
/// # Arguments
/// * `element` - The JSX element to extract styles from
///
/// # Returns
/// An Option containing the style string if found, or None if no style attribute exists
pub fn extract_inline_style(element: &JSXElement) -> Option<String> {
    for attr in &element.opening_element.attributes {
        if let JSXAttributeItem::Attribute(jsx_attr) = attr {
            // Check if attribute name is "style"
            if let JSXAttributeName::Identifier(ident) = &jsx_attr.name {
                if ident.name.as_str() == "style" {
                    // Handle string literal styles: style="color: red"
                    if let Some(JSXAttributeValue::StringLiteral(str_lit)) = &jsx_attr.value {
                        return Some(str_lit.value.to_string());
                    }

                    // Handle object expression styles: style={{ color: 'red' }}
                    // In oxc, ObjectExpression is inherited directly into JSXExpression
                    if let Some(JSXAttributeValue::ExpressionContainer(expr_container)) =
                        &jsx_attr.value
                    {
                        if let JSXExpression::ObjectExpression(obj_lit) = &expr_container.expression
                        {
                            return Some(super::css::convert_object_to_css(obj_lit));
                        }
                    }
                }
            }
        }
    }
    None
}

/// Extract className attribute from a JSX element
///
/// # Arguments
/// * `element` - The JSX element to extract className from
///
/// # Returns
/// An Option containing the className string if found
pub fn extract_class_name(element: &JSXElement) -> Option<String> {
    for attr in &element.opening_element.attributes {
        if let JSXAttributeItem::Attribute(jsx_attr) = attr {
            if let JSXAttributeName::Identifier(ident) = &jsx_attr.name {
                if ident.name.as_str() == "className" {
                    if let Some(JSXAttributeValue::StringLiteral(str_lit)) = &jsx_attr.value {
                        return Some(str_lit.value.to_string());
                    }
                }
            }
        }
    }
    None
}

/// Extract the element name (tag name) from a JSX element
///
/// # Arguments
/// * `element` - The JSX element
///
/// # Returns
/// The element name as a string (e.g., "div", "span", "h1", "Component" from Namespace.Component)
pub fn extract_element_name(element: &JSXElement) -> String {
    match &element.opening_element.name {
        JSXElementName::Identifier(ident) => ident.name.to_string(),
        JSXElementName::IdentifierReference(ident) => ident.name.to_string(),
        JSXElementName::MemberExpression(member_expr) => {
            // Extract "Component" from "Namespace.Component"
            extract_member_expr_name(member_expr)
        }
        JSXElementName::NamespacedName(ns_name) => {
            // Extract "local" from "namespace:local"
            ns_name.name.name.to_string()
        }
        JSXElementName::ThisExpression(_) => "this".to_string(),
    }
}

/// Extract the component name from a JSX member expression
fn extract_member_expr_name(expr: &JSXMemberExpression) -> String {
    expr.property.name.to_string()
}

/// Extract text content from JSX element children
///
/// Recursively extracts all text from an element and its nested children.
pub fn extract_text_content(element: &JSXElement) -> Vec<String> {
    extract_text_content_recursive(element)
}

/// Recursively extract text content from JSX element and its children
fn extract_text_content_recursive(element: &JSXElement) -> Vec<String> {
    let mut texts = Vec::new();

    for child in &element.children {
        match child {
            JSXChild::Text(text) => {
                let content = text.value.to_string();
                if !content.trim().is_empty() {
                    texts.push(content);
                }
            }
            JSXChild::Element(nested_element) => {
                // Recursively extract from nested elements
                texts.extend(extract_text_content_recursive(nested_element));
            }
            JSXChild::ExpressionContainer(expr_container) => {
                // In oxc, Expression variants are inherited directly into JSXExpression
                match &expr_container.expression {
                    JSXExpression::StringLiteral(str_lit) => {
                        texts.push(str_lit.value.to_string());
                    }
                    JSXExpression::TemplateLiteral(tpl) => {
                        // Handle template literals
                        for quasi in &tpl.quasis {
                            let content = quasi.value.raw.to_string();
                            if !content.trim().is_empty() {
                                texts.push(content);
                            }
                        }
                    }
                    _ => {}
                }
            }
            _ => {}
        }
    }

    texts
}

/// Get all attribute names from a JSX element
///
/// # Arguments
/// * `element` - The JSX element
///
/// # Returns
/// A vector of attribute names
pub fn get_attribute_names(element: &JSXElement) -> Vec<String> {
    let mut names = Vec::new();

    for attr in &element.opening_element.attributes {
        if let JSXAttributeItem::Attribute(jsx_attr) = attr {
            if let JSXAttributeName::Identifier(ident) = &jsx_attr.name {
                names.push(ident.name.to_string());
            }
        }
    }

    names
}

/// Get a specific attribute value from a JSX element
///
/// # Arguments
/// * `element` - The JSX element
/// * `attr_name` - The attribute name to look for
///
/// # Returns
/// An Option containing the attribute value as a string if found
pub fn get_attribute_value(element: &JSXElement, attr_name: &str) -> Option<String> {
    for attr in &element.opening_element.attributes {
        if let JSXAttributeItem::Attribute(jsx_attr) = attr {
            if let JSXAttributeName::Identifier(ident) = &jsx_attr.name {
                if ident.name.as_str() == attr_name {
                    if let Some(value) = &jsx_attr.value {
                        return match value {
                            JSXAttributeValue::StringLiteral(str_lit) => {
                                Some(str_lit.value.to_string())
                            }
                            _ => None,
                        };
                    }
                }
            }
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parse_tsx;

    #[test]
    fn test_extract_inline_style_from_object() {
        let tsx = r#"
            const CV = () => (
                <div style={{color: 'red', fontSize: '14px'}}>
                    Test
                </div>
            );
        "#;

        let document = parse_tsx(tsx).unwrap();
        let elements = crate::extract_jsx_elements(&document);
        let element = elements.first().expect("Should have element");

        let style = extract_inline_style(element);
        assert!(style.is_some());
        let style_str = style.unwrap();
        assert!(style_str.contains("color"));
        assert!(style_str.contains("font-size") || style_str.contains("fontSize"));
    }

    #[test]
    fn test_extract_class_name_with_value() {
        let tsx = r#"
            const CV = () => <div className="container">Test</div>;
        "#;

        let document = parse_tsx(tsx).unwrap();
        let elements = crate::extract_jsx_elements(&document);
        let element = elements.first().expect("Should have element");

        let class_name = extract_class_name(element);
        assert_eq!(class_name, Some("container".to_string()));
    }

    #[test]
    fn test_extract_element_name_member_expr() {
        let tsx = r#"
            const CV = () => <React.Fragment>Test</React.Fragment>;
        "#;

        let document = parse_tsx(tsx).unwrap();
        let elements = crate::extract_jsx_elements(&document);
        let element = elements.first().expect("Should have element");

        let name = extract_element_name(element);
        assert_eq!(name, "Fragment");
    }

    #[test]
    fn test_extract_element_name_namespaced() {
        let tsx = r#"
            const CV = () => <svg:circle cx="50" cy="50" r="40" />;
        "#;

        let document = parse_tsx(tsx).unwrap();
        let elements = crate::extract_jsx_elements(&document);
        let element = elements.first().expect("Should have element");

        let name = extract_element_name(element);
        assert_eq!(name, "circle");
    }

    #[test]
    fn test_extract_text_content_with_jsx_expressions() {
        let tsx = r#"
            const CV = () => (
                <div>
                    Plain text
                    {"String literal"}
                    {`Template literal`}
                    <span>Nested</span>
                </div>
            );
        "#;

        let document = parse_tsx(tsx).unwrap();
        let elements = crate::extract_jsx_elements(&document);
        let element = elements.first().expect("Should have element");

        let texts = extract_text_content(element);
        assert!(!texts.is_empty());
        assert!(texts.iter().any(|t| t.contains("Plain text")));
        assert!(texts.iter().any(|t| t.contains("String literal")));
        assert!(texts.iter().any(|t| t.contains("Template literal")));
        assert!(texts.iter().any(|t| t.contains("Nested")));
    }

    #[test]
    fn test_get_attribute_names() {
        let tsx = r#"
            const CV = () => <div id="test" className="container" data-value="123">Test</div>;
        "#;

        let document = parse_tsx(tsx).unwrap();
        let elements = crate::extract_jsx_elements(&document);
        let element = elements.first().expect("Should have element");

        let names = get_attribute_names(element);
        assert_eq!(names.len(), 3);
        assert!(names.contains(&"id".to_string()));
        assert!(names.contains(&"className".to_string()));
        assert!(names.contains(&"data-value".to_string()));
    }

    #[test]
    fn test_get_attribute_value_string() {
        let tsx = r#"
            const CV = () => <div id="main">Test</div>;
        "#;

        let document = parse_tsx(tsx).unwrap();
        let elements = crate::extract_jsx_elements(&document);
        let element = elements.first().expect("Should have element");

        let value = get_attribute_value(element, "id");
        assert_eq!(value, Some("main".to_string()));
    }
}
