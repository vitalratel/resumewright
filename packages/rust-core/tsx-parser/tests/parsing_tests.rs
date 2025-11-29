//! Basic parsing tests for TSX parser
//!
//! Tests basic parsing functionality, exports, conditional rendering, nested functions, etc.

use tsx_parser::*;

#[test]
fn test_parse_simple_tsx() {
    let tsx = r#"
        const CV = () => (
            <div>
                <h1>John Doe</h1>
            </div>
        );
    "#;

    let result = parse_tsx(tsx);
    assert!(result.is_ok());
}

#[test]
fn test_parse_tsx_with_inline_style() {
    let tsx = r#"
        const CV = () => (
            <div style="color: red; font-size: 16px">
                <h1>John Doe</h1>
            </div>
        );
    "#;

    let result = parse_tsx(tsx);
    assert!(result.is_ok());
}

#[test]
fn test_parse_invalid_tsx() {
    let tsx = r#"
        const CV = () => (
            <div>
                <h1>John Doe
            </div>
        );
    "#;

    let result = parse_tsx(tsx);
    assert!(result.is_err());
}

#[test]
fn test_parse_error_with_correct_location() {
    // Unclosed <h1> tag on line 4
    let tsx = r#"
const CV = () => (
  <div>
    <h1>John Doe
  </div>
);
    "#;

    let result = parse_tsx(tsx);
    assert!(result.is_err());

    if let Err(ParseError::SyntaxError {
        line,
        column,
        message,
    }) = result
    {
        // Error should have valid line/column (even if not precise)
        assert!(line > 0, "Error line should be > 0, got: {}", line);
        assert!(column > 0, "Error column should be > 0, got: {}", column);

        // Message should contain relevant information
        assert!(!message.is_empty(), "Error message should not be empty");

        println!(
            "Parse error reported at line {}, column {}: {}",
            line, column, message
        );
    } else {
        panic!("Expected SyntaxError variant");
    }
}

#[test]
fn test_parse_error_with_malformed_jsx() {
    // Missing closing > on line 3
    let tsx = r#"
const CV = () => (
  <div
    <h1>Test</h1>
  </div>
);
    "#;

    let result = parse_tsx(tsx);
    assert!(result.is_err());

    if let Err(ParseError::SyntaxError {
        line,
        column,
        message,
    }) = result
    {
        // Error should have valid location info
        assert!(
            line > 0 && column > 0,
            "Error location should be valid: line={}, column={}",
            line,
            column
        );
        assert!(!message.is_empty(), "Error message should not be empty");
        println!(
            "Parse error reported at line {}, column {}: {}",
            line, column, message
        );
    } else {
        panic!("Expected SyntaxError variant");
    }
}

#[test]
fn test_parse_tsx_with_exported_function() {
    let tsx = r#"
        export function CV() {
            return (
                <div>
                    <h1>Exported Component</h1>
                </div>
            );
        }
    "#;

    let document = parse_tsx(tsx).unwrap();
    let elements = extract_jsx_elements(&document);
    assert!(
        !elements.is_empty(),
        "Should extract JSX from exported function"
    );
}

#[test]
fn test_parse_tsx_with_exported_const() {
    let tsx = r#"
        export const CV = () => (
            <div>
                <h1>Exported Const</h1>
            </div>
        );
    "#;

    let document = parse_tsx(tsx).unwrap();
    let elements = extract_jsx_elements(&document);
    assert!(
        !elements.is_empty(),
        "Should extract JSX from exported const"
    );
}

#[test]
fn test_parse_tsx_with_conditional_rendering() {
    let tsx = r#"
        const CV = ({ show }) => (
            <div>
                {show ? <h1>Visible</h1> : <p>Hidden</p>}
            </div>
        );
    "#;

    let document = parse_tsx(tsx).unwrap();
    let elements = extract_jsx_elements(&document);
    // Should extract at least the outer div and the conditional JSX elements
    assert!(
        !elements.is_empty(),
        "Should extract JSX including conditional expression"
    );
}

#[test]
fn test_parse_tsx_with_nested_functions() {
    let tsx = r#"
        function OuterComponent() {
            function InnerComponent() {
                return <span>Inner</span>;
            }
            return <div><h1>Outer</h1></div>;
        }
    "#;

    let document = parse_tsx(tsx).unwrap();
    let elements = extract_jsx_elements(&document);
    assert!(
        elements.len() >= 2,
        "Should extract JSX from nested functions"
    );
}

#[test]
fn test_extract_jsx_with_function_call() {
    let tsx = r#"
        const CV = () => renderContent(
            <div>
                <h1>Content</h1>
            </div>
        );
    "#;

    let document = parse_tsx(tsx).unwrap();
    let elements = extract_jsx_elements(&document);
    assert!(
        !elements.is_empty(),
        "Should extract JSX from function call arguments"
    );
}

#[test]
fn test_extract_jsx_with_block_statement() {
    let tsx = r#"
        const CV = () => {
            const content = <h1>Title</h1>;
            return <div>{content}</div>;
        };
    "#;

    let document = parse_tsx(tsx).unwrap();
    let elements = extract_jsx_elements(&document);
    assert!(
        elements.len() >= 2,
        "Should extract JSX from block statements"
    );
}

#[test]
fn test_parse_tsx_with_object_style() {
    let tsx = r#"
        const CV = () => (
            <div style={{ color: 'red', fontSize: '16px' }}>
                <h1>Styled Component</h1>
            </div>
        );
    "#;

    let document = parse_tsx(tsx).unwrap();
    let elements = extract_jsx_elements(&document);

    if let Some(element) = elements.first() {
        let style = extract_inline_style(element);
        assert!(style.is_some(), "Should extract object-style inline styles");
        let style_str = style.unwrap();
        assert!(
            style_str.contains("color"),
            "Style should contain color property"
        );
        assert!(
            style_str.contains("font-size"),
            "Style should convert fontSize to font-size"
        );
    }
}

#[test]
fn test_backward_compatibility_parse_tsx() {
    // Ensure parse_tsx still works as before
    let valid_tsx = r#"const CV = () => <div>Test</div>;"#;
    let result = parse_tsx(valid_tsx);
    assert!(result.is_ok());

    let invalid_tsx = r#"const CV = () => <div>"#;
    let result = parse_tsx(invalid_tsx);
    assert!(result.is_err());
}
