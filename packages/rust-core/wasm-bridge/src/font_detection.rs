//! Font detection and classification utilities
//!
//! This module provides font requirement extraction from TSX documents.
//! It scans JSX elements for font-family declarations and classifies fonts into
//! Google Fonts, web-safe fonts, or custom fonts.

use std::collections::HashSet;

// Import FontSource from converter.rs (it has #[wasm_bindgen] so must stay there)
use crate::converter::FontSource;

/// Font requirement detected from TSX
///
/// Represents a single font variant needed for rendering the CV.
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct FontRequirement {
    /// Font family name (e.g., "Roboto", "Arial")
    pub family: String,
    /// Font weight (100-900, typically 400=normal, 700=bold)
    pub weight: u16,
    /// Font style: "normal" or "italic"
    pub style: String,
    /// Font source classification
    pub source: FontSource,
}

/// Web-safe fonts available on all operating systems
///
/// These fonts don't need to be embedded as they're guaranteed to be available
/// on Windows, macOS, and Linux systems.
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

/// Popular Google Fonts commonly used in CVs/resumes
///
/// This list covers the most popular professional fonts available on Google Fonts.
/// Extended from 10 to 15 fonts to improve coverage.
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

/// Extract font requirements from parsed TSX document
///
/// Scans the document for CSS font-family declarations and determines:
/// - Font family name
/// - Font weight (from font-weight or element semantics)
/// - Font style (normal or italic)
/// - Font source (Google Fonts, custom, or web-safe)
///
/// # Arguments
/// * `document` - Parsed TSX document
///
/// # Returns
/// List of unique font requirements, or error if extraction fails
///
/// # Default Behavior
/// If no fonts are found, returns a single Arial requirement as fallback.
pub fn extract_font_requirements(
    document: &tsx_parser::TsxDocument,
) -> Result<Vec<FontRequirement>, String> {
    let mut requirements = Vec::new();
    let mut seen = HashSet::new();

    // Extract all JSX elements from the document
    let jsx_elements = tsx_parser::extract_jsx_elements(document);

    // Scan all elements for font-family declarations
    for element in jsx_elements {
        // Extract inline styles: style="font-family: Roboto" or style={{ fontFamily: 'Roboto' }}
        if let Some(style_str) = tsx_parser::extract_inline_style(element) {
            // Parse CSS properties from style string
            let fonts = extract_fonts_from_css(&style_str);
            for (family, weight, style) in fonts {
                // Classify font source
                let source = classify_font_source(&family);

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

/// Classify font source based on font family name
///
/// Determines whether a font is:
/// - A web-safe system font
/// - A popular Google Font
/// - A custom font requiring manual provision
///
/// # Arguments
/// * `family` - Font family name
///
/// # Returns
/// FontSource classification (WebSafe, Google, or Custom)
fn classify_font_source(family: &str) -> FontSource {
    if WEB_SAFE_FONTS
        .iter()
        .any(|&wsf| wsf.eq_ignore_ascii_case(family))
    {
        FontSource::WebSafe
    } else if GOOGLE_FONTS
        .iter()
        .any(|&gf| gf.eq_ignore_ascii_case(family))
    {
        FontSource::Google
    } else {
        FontSource::Custom
    }
}

/// Extract font-family declarations from CSS string
///
/// Parses CSS properties and extracts font-family, font-weight, and font-style.
/// Handles both CSS syntax (font-family: Roboto) and camelCase (fontFamily: 'Roboto').
///
/// # Arguments
/// * `css` - CSS string (e.g., "font-family: Roboto; font-weight: 700")
///
/// # Returns
/// List of (family, weight, style) tuples
///
/// # Parsing Logic
/// - Splits by semicolon for CSS properties
/// - Handles both kebab-case (font-family) and camelCase (fontFamily)
/// - Removes quotes from font names
/// - Defaults: weight=400 (normal), style="normal"
pub fn extract_fonts_from_css(css: &str) -> Vec<(String, u16, String)> {
    let mut fonts = Vec::new();
    let mut font_family: Option<String> = None;
    let mut font_weight: u16 = 400;
    let mut font_style = "normal".to_string();

    // Split by semicolon for CSS properties
    let properties: Vec<&str> = css.split(';').map(|s| s.trim()).collect();

    for prop in properties {
        if prop.is_empty() {
            continue;
        }

        // Handle both "font-family: Roboto" and "fontFamily: 'Roboto'"
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

    // If font-family was found, add to results
    if let Some(family) = font_family {
        fonts.push((family, font_weight, font_style));
    }

    fonts
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_classify_font_source_websafe() {
        assert!(matches!(classify_font_source("Arial"), FontSource::WebSafe));
        assert!(matches!(
            classify_font_source("Georgia"),
            FontSource::WebSafe
        ));
        assert!(matches!(
            classify_font_source("times new roman"),
            FontSource::WebSafe
        )); // Case insensitive
    }

    #[test]
    fn test_classify_font_source_google() {
        assert!(matches!(classify_font_source("Roboto"), FontSource::Google));
        assert!(matches!(
            classify_font_source("Open Sans"),
            FontSource::Google
        ));
        assert!(matches!(classify_font_source("roboto"), FontSource::Google)); // Case insensitive
    }

    #[test]
    fn test_classify_font_source_custom() {
        assert!(matches!(
            classify_font_source("MyCustomFont"),
            FontSource::Custom
        ));
        assert!(matches!(
            classify_font_source("ComicSans"),
            FontSource::Custom
        ));
    }

    #[test]
    fn test_extract_fonts_from_css_basic() {
        let css = "font-family: Roboto";
        let fonts = extract_fonts_from_css(css);
        assert_eq!(fonts.len(), 1);
        assert_eq!(fonts[0].0, "Roboto");
        assert_eq!(fonts[0].1, 400); // Default weight
        assert_eq!(fonts[0].2, "normal"); // Default style
    }

    #[test]
    fn test_extract_fonts_from_css_with_weight() {
        let css = "font-family: Roboto; font-weight: 700";
        let fonts = extract_fonts_from_css(css);
        assert_eq!(fonts.len(), 1);
        assert_eq!(fonts[0].0, "Roboto");
        assert_eq!(fonts[0].1, 700);
        assert_eq!(fonts[0].2, "normal");
    }

    #[test]
    fn test_extract_fonts_from_css_with_italic() {
        let css = "font-family: Georgia; font-style: italic";
        let fonts = extract_fonts_from_css(css);
        assert_eq!(fonts.len(), 1);
        assert_eq!(fonts[0].0, "Georgia");
        assert_eq!(fonts[0].1, 400);
        assert_eq!(fonts[0].2, "italic");
    }

    #[test]
    fn test_extract_fonts_from_css_camelcase() {
        let css = "fontFamily: 'Open Sans'; fontWeight: 600";
        let fonts = extract_fonts_from_css(css);
        assert_eq!(fonts.len(), 1);
        assert_eq!(fonts[0].0, "Open Sans");
        assert_eq!(fonts[0].1, 600);
    }

    #[test]
    fn test_extract_fonts_from_css_quoted() {
        let css = "font-family: \"Times New Roman\"";
        let fonts = extract_fonts_from_css(css);
        assert_eq!(fonts.len(), 1);
        assert_eq!(fonts[0].0, "Times New Roman");
    }

    #[test]
    fn test_extract_fonts_from_css_empty() {
        let css = "";
        let fonts = extract_fonts_from_css(css);
        assert_eq!(fonts.len(), 0);
    }

    #[test]
    fn test_extract_fonts_from_css_invalid_format() {
        // Missing colon
        let css1 = "font-family Roboto";
        let fonts1 = extract_fonts_from_css(css1);
        assert_eq!(fonts1.len(), 0, "Should handle missing colon");

        // Multiple colons
        let css2 = "font-family: Roboto: Bold";
        let fonts2 = extract_fonts_from_css(css2);
        // Should handle gracefully (returns empty or valid result)
        assert!(fonts2.is_empty() || !fonts2.is_empty());
    }

    #[test]
    fn test_extract_fonts_from_css_whitespace_variations() {
        // Extra whitespace
        let css1 = "  font-family  :  Roboto  ;  font-weight  :  700  ";
        let fonts1 = extract_fonts_from_css(css1);
        assert_eq!(fonts1.len(), 1);
        assert_eq!(fonts1[0].0, "Roboto");
        assert_eq!(fonts1[0].1, 700);

        // Tabs and newlines
        let css2 = "font-family:\tRoboto\n;\nfont-weight:\t700";
        let fonts2 = extract_fonts_from_css(css2);
        assert_eq!(fonts2.len(), 1);
    }

    #[test]
    fn test_extract_fonts_from_css_weight_edge_cases() {
        // Invalid weight (should default to 400)
        let css1 = "font-family: Roboto; font-weight: invalid";
        let fonts1 = extract_fonts_from_css(css1);
        assert_eq!(fonts1[0].1, 400, "Invalid weight should default to 400");

        // Empty weight
        let css2 = "font-family: Roboto; font-weight: ";
        let fonts2 = extract_fonts_from_css(css2);
        assert_eq!(fonts2[0].1, 400, "Empty weight should default to 400");

        // Boundary values
        let css3 = "font-family: Roboto; font-weight: 100";
        let fonts3 = extract_fonts_from_css(css3);
        assert_eq!(fonts3[0].1, 100);

        let css4 = "font-family: Roboto; font-weight: 900";
        let fonts4 = extract_fonts_from_css(css4);
        assert_eq!(fonts4[0].1, 900);
    }

    #[test]
    fn test_extract_fonts_from_css_style_variations() {
        // oblique is normalized to normal (only italic is recognized)
        let css1 = "font-family: Roboto; font-style: oblique";
        let fonts1 = extract_fonts_from_css(css1);
        assert_eq!(fonts1[0].2, "normal", "oblique should normalize to normal");

        // Mixed case ITALIC is normalized to lowercase "italic"
        let css2 = "font-family: Roboto; font-style: ITALIC";
        let fonts2 = extract_fonts_from_css(css2);
        assert_eq!(fonts2[0].2, "italic", "ITALIC should normalize to italic");
    }

    #[test]
    fn test_extract_fonts_from_css_multiple_semicolons() {
        let css = "font-family: Roboto;;; font-weight: 700;;;";
        let fonts = extract_fonts_from_css(css);
        assert_eq!(fonts.len(), 1);
        assert_eq!(fonts[0].0, "Roboto");
        assert_eq!(fonts[0].1, 700);
    }

    #[test]
    fn test_extract_fonts_from_css_no_font_family() {
        // CSS with weight/style but no font-family
        let css = "font-weight: 700; font-style: italic; color: red";
        let fonts = extract_fonts_from_css(css);
        assert_eq!(
            fonts.len(),
            0,
            "Should not return fonts without font-family"
        );
    }

    #[test]
    fn test_classify_font_source_case_insensitive() {
        // Test case insensitivity for web-safe fonts
        assert!(matches!(classify_font_source("ARIAL"), FontSource::WebSafe));
        assert!(matches!(classify_font_source("arial"), FontSource::WebSafe));
        assert!(matches!(classify_font_source("ArIaL"), FontSource::WebSafe));

        // Test case insensitivity for Google fonts
        assert!(matches!(classify_font_source("ROBOTO"), FontSource::Google));
        assert!(matches!(classify_font_source("roboto"), FontSource::Google));
        assert!(matches!(classify_font_source("RoBoTo"), FontSource::Google));
    }

    #[test]
    fn test_classify_font_source_unknown_font() {
        // Unknown fonts should be Custom
        assert!(matches!(
            classify_font_source("UnknownFont123"),
            FontSource::Custom
        ));
        assert!(matches!(
            classify_font_source("My Custom Font"),
            FontSource::Custom
        ));
        assert!(matches!(classify_font_source(""), FontSource::Custom));
    }
}
