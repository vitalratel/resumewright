//! Feature extraction tests for TSX parser
//!
//! Tests extraction of JSX elements, inline styles, class names, text content, and attributes.

use tsx_parser::*;

#[test]
fn test_extract_jsx_elements() {
    let tsx = r#"
        const CV = () => (
            <div>
                <h1>John Doe</h1>
                <p>Software Engineer</p>
            </div>
        );
    "#;

    let document = parse_tsx(tsx).unwrap();
    let elements = extract_jsx_elements(&document);
    assert!(!elements.is_empty()); // At least the root div
}

#[test]
fn test_extract_inline_style() {
    let tsx = r#"
        const CV = () => (
            <div style="color: red">
                <h1>John Doe</h1>
            </div>
        );
    "#;

    let document = parse_tsx(tsx).unwrap();
    let elements = extract_jsx_elements(&document);

    if let Some(element) = elements.first() {
        let style = extract_inline_style(element);
        assert!(style.is_some());
        assert_eq!(style.unwrap(), "color: red");
    }
}

#[test]
fn test_extract_class_name() {
    let tsx = r#"
        const CV = () => (
            <div className="container">
                <h1>John Doe</h1>
            </div>
        );
    "#;

    let document = parse_tsx(tsx).unwrap();
    let elements = extract_jsx_elements(&document);

    if let Some(element) = elements.first() {
        let class_name = extract_class_name(element);
        assert!(class_name.is_some());
        assert_eq!(class_name.unwrap(), "container");
    }
}

#[test]
fn test_extract_element_name() {
    let tsx = r#"
        const CV = () => (
            <div>
                <h1>John Doe</h1>
            </div>
        );
    "#;

    let document = parse_tsx(tsx).unwrap();
    let elements = extract_jsx_elements(&document);

    if let Some(element) = elements.first() {
        let name = extract_element_name(element);
        assert_eq!(name, "div");
    }
}

#[test]
fn test_extract_text_content() {
    let tsx = r#"
        const CV = () => (
            <div>
                <h1>John Doe</h1>
            </div>
        );
    "#;

    let document = parse_tsx(tsx).unwrap();
    let elements = extract_jsx_elements(&document);

    // Find the h1 element
    for element in elements {
        if extract_element_name(element) == "h1" {
            let texts = extract_text_content(element);
            assert!(!texts.is_empty());
            assert!(texts[0].contains("John Doe"));
        }
    }
}

#[test]
fn test_get_attribute_value() {
    let tsx = r#"
        const CV = () => (
            <div id="main" data-test="value">
                <h1>John Doe</h1>
            </div>
        );
    "#;

    let document = parse_tsx(tsx).unwrap();
    let elements = extract_jsx_elements(&document);

    if let Some(element) = elements.first() {
        let id = get_attribute_value(element, "id");
        assert_eq!(id, Some("main".to_string()));

        let data_test = get_attribute_value(element, "data-test");
        assert_eq!(data_test, Some("value".to_string()));
    }
}

#[test]
fn test_get_attribute_value_missing() {
    let tsx = r#"
        const CV = () => (
            <div>
                <h1>No Attributes</h1>
            </div>
        );
    "#;

    let document = parse_tsx(tsx).unwrap();
    let elements = extract_jsx_elements(&document);

    if let Some(element) = elements.first() {
        let missing = get_attribute_value(element, "nonexistent");
        assert_eq!(missing, None, "Should return None for missing attributes");
    }
}

#[test]
fn test_extract_inline_style_missing() {
    let tsx = r#"
        const CV = () => (
            <div className="test">
                <h1>No Style</h1>
            </div>
        );
    "#;

    let document = parse_tsx(tsx).unwrap();
    let elements = extract_jsx_elements(&document);

    if let Some(element) = elements.first() {
        let style = extract_inline_style(element);
        assert_eq!(style, None, "Should return None when no style attribute");
    }
}

#[test]
fn test_extract_class_name_missing() {
    let tsx = r#"
        const CV = () => (
            <div id="test">
                <h1>No ClassName</h1>
            </div>
        );
    "#;

    let document = parse_tsx(tsx).unwrap();
    let elements = extract_jsx_elements(&document);

    if let Some(element) = elements.first() {
        let class_name = extract_class_name(element);
        assert_eq!(class_name, None, "Should return None when no className");
    }
}
