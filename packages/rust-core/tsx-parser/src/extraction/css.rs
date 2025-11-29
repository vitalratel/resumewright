//! CSS conversion utilities
//!
//! This module provides functions to convert JavaScript style objects to CSS strings.

use crate::helpers::camel_to_kebab;
use oxc_ast::ast::{Expression, ObjectExpression, ObjectPropertyKind, PropertyKey};

/// Converts a JavaScript style object literal to CSS string.
///
/// This function handles style objects commonly used in React/TSX inline styles,
/// converting JavaScript object notation to valid CSS property declarations.
///
/// # Supported Value Types
///
/// - **String literals**: `"red"`, `"10px"`, `"center"`
/// - **Number literals**: `10`, `1.5` (converted to string, e.g., `"10"`, `"1.5"`)
/// - **Boolean literals**: `true`, `false` (converted to `"true"`, `"false"`)
///
/// # Limitations
///
/// ⚠️ **This function only handles literal values**. The following are NOT supported:
///
/// - **JavaScript variables**: `const color = "red"; style={{color}}`
/// - **Expressions**: `style={{width: 10 + 20}}`
/// - **Function calls**: `style={{color: getColor()}}`
/// - **Template literals**: ```style={{width: `${width}px`}}```
/// - **Object spread**: `style={{...baseStyles, color: "red"}}`
/// - **Computed property names**: `style={{[propName]: value}}`
///
/// Unsupported values are silently skipped (the property is omitted from output).
///
/// # Property Name Conversion
///
/// Property names are automatically converted from camelCase to kebab-case:
/// - `backgroundColor` → `background-color`
/// - `fontSize` → `font-size`
/// - `marginTop` → `margin-top`
///
/// # Returns
///
/// CSS string with properties joined by `"; "` (semicolon + space).
/// Example: `"color: red; font-size: 12px"`
pub fn convert_object_to_css(obj_lit: &ObjectExpression) -> String {
    let mut css_parts = Vec::new();

    for prop in &obj_lit.properties {
        if let ObjectPropertyKind::ObjectProperty(obj_prop) = prop {
            // Extract property name
            let prop_name = match &obj_prop.key {
                PropertyKey::StaticIdentifier(ident) => ident.name.to_string(),
                PropertyKey::StringLiteral(s) => s.value.to_string(),
                _ => continue,
            };

            // Convert camelCase to kebab-case (e.g., fontSize -> font-size)
            let css_prop_name = camel_to_kebab(&prop_name);

            // Extract property value
            let prop_value = match &obj_prop.value {
                Expression::StringLiteral(s) => s.value.to_string(),
                Expression::NumericLiteral(n) => n.value.to_string(),
                Expression::BooleanLiteral(b) => b.value.to_string(),
                _ => continue,
            };

            css_parts.push(format!("{}: {}", css_prop_name, prop_value));
        }
    }

    css_parts.join("; ")
}
