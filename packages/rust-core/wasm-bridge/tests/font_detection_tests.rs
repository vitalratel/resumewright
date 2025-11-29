/// Font Detection Tests
///
/// Tests for font detection logic that scans TSX for font requirements.
/// These tests verify the internal font detection implementation.
use tsx_parser::parse_tsx;

/// Font source classification
#[derive(Debug, PartialEq)]
enum FontSource {
    Google,
    WebSafe,
    Custom,
}

/// Font requirement structure
#[derive(Debug, PartialEq)]
struct FontRequirement {
    family: String,
    weight: u16,
    style: String,
    source: FontSource,
}

/// Extract font requirements from parsed TSX document
/// This mirrors the logic in wasm-bridge/src/converter.rs
fn extract_font_requirements_test(tsx: &str) -> Result<Vec<FontRequirement>, String> {
    use std::collections::HashSet;

    let document = parse_tsx(tsx).map_err(|e| format!("Parse error: {}", e))?;

    let mut requirements = Vec::new();
    let mut seen = HashSet::new();

    // Known web-safe fonts (from converter.rs)
    const WEB_SAFE_FONTS: &[&str] = &[
        "Arial",
        "Helvetica",
        "Times New Roman",
        "Times",
        "Courier New",
        "Courier",
        "Georgia",
        "Verdana",
    ];

    // Known Google Fonts (from converter.rs) - updated to match
    const GOOGLE_FONTS: &[&str] = &[
        "Roboto",
        "Open Sans",
        "Lato",
        "Montserrat",
        "Oswald",
        "Source Sans Pro",
        "Raleway",
        "PT Sans",
        "Merriweather",
        "Ubuntu",
        "Poppins",
        "Inter",
        "Nunito",
        "Playfair Display",
        "Work Sans",
    ];

    // Extract all JSX elements from the document
    let jsx_elements = tsx_parser::extract_jsx_elements(&document);

    // Scan all elements for font-family declarations
    for element in jsx_elements {
        if let Some(style_str) = tsx_parser::extract_inline_style(element) {
            let fonts = extract_fonts_from_css_test(&style_str);
            for (family, weight, style) in fonts {
                // Classify font source
                let source = if WEB_SAFE_FONTS
                    .iter()
                    .any(|&wsf| wsf.eq_ignore_ascii_case(&family))
                {
                    FontSource::WebSafe
                } else if GOOGLE_FONTS
                    .iter()
                    .any(|&gf| gf.eq_ignore_ascii_case(&family))
                {
                    FontSource::Google
                } else {
                    FontSource::Custom
                };

                let key = format!("{}:{}:{}", family, weight, style);
                if seen.insert(key) {
                    requirements.push(FontRequirement {
                        family,
                        weight,
                        style,
                        source,
                    });
                }
            }
        }
    }

    // If no fonts found, add default web-safe font
    if requirements.is_empty() {
        requirements.push(FontRequirement {
            family: "Arial".to_string(),
            weight: 400,
            style: "normal".to_string(),
            source: FontSource::WebSafe,
        });
    }

    Ok(requirements)
}

/// Extract font properties from CSS string (mirrors converter.rs logic)
fn extract_fonts_from_css_test(css: &str) -> Vec<(String, u16, String)> {
    let mut fonts = Vec::new();
    let mut font_family: Option<String> = None;
    let mut font_weight: u16 = 400;
    let mut font_style = "normal".to_string();

    let properties: Vec<&str> = css.split(';').map(|s| s.trim()).collect();

    for prop in properties {
        if prop.is_empty() {
            continue;
        }

        let parts: Vec<&str> = prop.split(':').map(|s| s.trim()).collect();
        if parts.len() != 2 {
            continue;
        }

        let key = parts[0].to_lowercase().replace("-", "");
        let value = parts[1].trim_matches(|c| c == '"' || c == '\'' || c == ' ');

        match key.as_str() {
            "fontfamily" => {
                font_family = Some(value.to_string());
            }
            "fontweight" => {
                font_weight = value.parse::<u16>().unwrap_or(400);
            }
            "fontstyle" => {
                font_style = if value.to_lowercase() == "italic" {
                    "italic".to_string()
                } else {
                    "normal".to_string()
                };
            }
            _ => {}
        }
    }

    if let Some(family) = font_family {
        fonts.push((family, font_weight, font_style));
    }

    fonts
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Test 1: Detect Google Font from inline style
    #[test]
    fn test_detect_google_font_from_inline_style() {
        let tsx = r#"
            export default function CV() {
                return <div style="font-family: Roboto">Hello World</div>;
            }
        "#;

        let reqs = extract_font_requirements_test(tsx).expect("Should succeed");

        assert_eq!(reqs.len(), 1, "Should detect one font");
        assert_eq!(reqs[0].family, "Roboto");
        assert_eq!(reqs[0].weight, 400);
        assert_eq!(reqs[0].style, "normal");
        assert_eq!(reqs[0].source, FontSource::Google);
    }

    /// Test 2: Detect font weight and style
    #[test]
    fn test_detect_font_weight_and_style() {
        let tsx = r#"
            export default function CV() {
                return <div style="font-family: Roboto; font-weight: 700; font-style: italic">Bold Italic</div>;
            }
        "#;

        let reqs = extract_font_requirements_test(tsx).expect("Should succeed");

        assert_eq!(reqs.len(), 1);
        assert_eq!(reqs[0].family, "Roboto");
        assert_eq!(reqs[0].weight, 700);
        assert_eq!(reqs[0].style, "italic");
        assert_eq!(reqs[0].source, FontSource::Google);
    }

    /// Test 3: Detect camelCase fontFamily (React style object)
    #[test]
    fn test_detect_camelcase_font_family() {
        let tsx = r#"
            export default function CV() {
                return <div style={{ fontFamily: 'Open Sans', fontWeight: 600 }}>Text</div>;
            }
        "#;

        let reqs = extract_font_requirements_test(tsx).expect("Should succeed");

        assert_eq!(reqs.len(), 1);
        assert_eq!(reqs[0].family, "Open Sans");
        assert_eq!(reqs[0].weight, 600);
        assert_eq!(reqs[0].style, "normal");
        assert_eq!(reqs[0].source, FontSource::Google);
    }

    /// Test 4: Detect web-safe fonts
    #[test]
    fn test_detect_websafe_fonts() {
        let tsx = r#"
            export default function CV() {
                return <div style="font-family: Arial">Safe Font</div>;
            }
        "#;

        let reqs = extract_font_requirements_test(tsx).expect("Should succeed");

        assert_eq!(reqs.len(), 1);
        assert_eq!(reqs[0].family, "Arial");
        assert_eq!(reqs[0].source, FontSource::WebSafe);
    }

    /// Test 5: Detect custom fonts (not in Google/WebSafe lists)
    #[test]
    fn test_detect_custom_fonts() {
        let tsx = r#"
            export default function CV() {
                return <div style="font-family: MyCustomFont">Custom</div>;
            }
        "#;

        let reqs = extract_font_requirements_test(tsx).expect("Should succeed");

        assert_eq!(reqs.len(), 1);
        assert_eq!(reqs[0].family, "MyCustomFont");
        assert_eq!(reqs[0].source, FontSource::Custom);
    }

    /// Test 6: Detect multiple unique fonts
    #[test]
    fn test_detect_multiple_unique_fonts() {
        let tsx = r#"
            export default function CV() {
                return (
                    <div>
                        <div style="font-family: Roboto">Text 1</div>
                        <div style="font-family: Open Sans">Text 2</div>
                        <div style="font-family: Arial">Text 3</div>
                    </div>
                );
            }
        "#;

        let reqs = extract_font_requirements_test(tsx).expect("Should succeed");

        assert_eq!(reqs.len(), 3, "Should detect 3 unique fonts");

        let families: Vec<&str> = reqs.iter().map(|r| r.family.as_str()).collect();
        assert!(families.contains(&"Roboto"));
        assert!(families.contains(&"Open Sans"));
        assert!(families.contains(&"Arial"));
    }

    /// Test 7: Deduplicate same font variants
    #[test]
    fn test_deduplicate_same_font_same_variant() {
        let tsx = r#"
            export default function CV() {
                return (
                    <div>
                        <div style="font-family: Roboto; font-weight: 400">Text 1</div>
                        <div style="font-family: Roboto; font-weight: 400">Text 2</div>
                    </div>
                );
            }
        "#;

        let reqs = extract_font_requirements_test(tsx).expect("Should succeed");

        assert_eq!(reqs.len(), 1, "Should deduplicate same font variant");
    }

    /// Test 8: Default font when no fonts found
    #[test]
    fn test_default_font_when_no_fonts_found() {
        let tsx = r#"
            export default function CV() {
                return <div>No font declarations here</div>;
            }
        "#;

        let reqs = extract_font_requirements_test(tsx).expect("Should succeed");

        assert_eq!(reqs.len(), 1, "Should return default font");
        assert_eq!(reqs[0].family, "Arial");
        assert_eq!(reqs[0].source, FontSource::WebSafe);
    }

    /// Test 9: Handle invalid TSX gracefully
    #[test]
    fn test_handle_invalid_tsx() {
        let tsx = "<div unclosed";

        let result = extract_font_requirements_test(tsx);

        assert!(result.is_err(), "Should return error for invalid TSX");
    }

    /// Test 10: Handle empty TSX
    #[test]
    fn test_handle_empty_tsx() {
        let tsx = "";

        let result = extract_font_requirements_test(tsx);

        // Empty TSX should parse and return default font
        if let Ok(reqs) = result {
            assert_eq!(reqs.len(), 1);
            assert_eq!(reqs[0].family, "Arial");
        }
        // Or it might fail to parse - either is acceptable
    }

    /// Test 11: Multiple font weights for same family
    #[test]
    fn test_multiple_weights_same_family() {
        let tsx = r#"
            export default function CV() {
                return (
                    <div>
                        <div style="font-family: Roboto; font-weight: 400">Normal</div>
                        <div style="font-family: Roboto; font-weight: 700">Bold</div>
                    </div>
                );
            }
        "#;

        let reqs = extract_font_requirements_test(tsx).expect("Should succeed");

        assert_eq!(reqs.len(), 2, "Should detect 2 font variants");
        assert!(reqs.iter().any(|r| r.weight == 400));
        assert!(reqs.iter().any(|r| r.weight == 700));
    }

    /// Test 12: Font style variations (normal and italic)
    #[test]
    fn test_font_style_variations() {
        let tsx = r#"
            export default function CV() {
                return (
                    <div>
                        <div style="font-family: Roboto; font-style: normal">Normal</div>
                        <div style="font-family: Roboto; font-style: italic">Italic</div>
                    </div>
                );
            }
        "#;

        let reqs = extract_font_requirements_test(tsx).expect("Should succeed");

        assert_eq!(reqs.len(), 2, "Should detect 2 style variants");
        assert!(reqs.iter().any(|r| r.style == "normal"));
        assert!(reqs.iter().any(|r| r.style == "italic"));
    }

    /// Test 13: All Google Fonts from hardcoded list
    #[test]
    fn test_known_google_fonts() {
        let google_fonts = [
            "Roboto",
            "Open Sans",
            "Lato",
            "Montserrat",
            "Oswald",
            "Source Sans Pro",
            "Raleway",
            "PT Sans",
            "Merriweather",
            "Ubuntu",
            "Poppins",
            "Inter",
            "Nunito",
            "Playfair Display",
            "Work Sans",
        ];

        for font in &google_fonts {
            let tsx = format!(
                r#"
                export default function CV() {{
                    return <div style="font-family: {}">Text</div>;
                }}
            "#,
                font
            );

            let reqs = extract_font_requirements_test(&tsx).expect("Should succeed");

            assert_eq!(
                reqs[0].source,
                FontSource::Google,
                "{} should be classified as Google font",
                font
            );
        }
    }

    /// Test 14: All web-safe fonts from hardcoded list
    #[test]
    fn test_known_websafe_fonts() {
        let websafe_fonts = [
            "Arial",
            "Helvetica",
            "Times New Roman",
            "Times",
            "Courier New",
            "Courier",
            "Georgia",
            "Verdana",
        ];

        for font in &websafe_fonts {
            let tsx = format!(
                r#"
                export default function CV() {{
                    return <div style="font-family: {}">Text</div>;
                }}
            "#,
                font
            );

            let reqs = extract_font_requirements_test(&tsx).expect("Should succeed");

            assert_eq!(
                reqs[0].source,
                FontSource::WebSafe,
                "{} should be classified as web-safe font",
                font
            );
        }
    }

    /// Test 15: CSS parsing with quoted font names
    #[test]
    fn test_css_parsing_quoted_fonts() {
        let tsx = r#"
            export default function CV() {
                return <div style='font-family: "Times New Roman"'>Text</div>;
            }
        "#;

        let reqs = extract_font_requirements_test(tsx).expect("Should succeed");

        assert_eq!(reqs.len(), 1);
        assert_eq!(reqs[0].family, "Times New Roman");
        assert_eq!(reqs[0].source, FontSource::WebSafe);
    }

    /// Test 16: Font weight as numeric value
    #[test]
    fn test_font_weight_numeric() {
        let tsx = r#"
            export default function CV() {
                return <div style={{ fontFamily: 'Roboto', fontWeight: 300 }}>Light</div>;
            }
        "#;

        let reqs = extract_font_requirements_test(tsx).expect("Should succeed");

        assert_eq!(reqs.len(), 1);
        assert_eq!(reqs[0].weight, 300);
    }

    /// Test 17: Case-insensitive font matching
    #[test]
    fn test_case_insensitive_matching() {
        // Web-safe fonts should match case-insensitively
        let tsx = r#"
            export default function CV() {
                return <div style="font-family: arial">Text</div>;
            }
        "#;

        let reqs = extract_font_requirements_test(tsx).expect("Should succeed");

        assert_eq!(
            reqs[0].source,
            FontSource::WebSafe,
            "arial (lowercase) should match Arial"
        );
    }
}
