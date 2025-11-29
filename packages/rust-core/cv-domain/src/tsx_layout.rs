//! TSX Layout Configuration Extraction
//!
//! This module extracts layout configuration from the TSX root element's className,
//! making the TSX the single source of truth for layout dimensions and spacing.

use serde::{Deserialize, Serialize};
use tsx_parser::{
    extract_jsx_elements, JSXAttributeItem, JSXAttributeName, JSXAttributeValue, TsxDocument,
};

/// Layout configuration extracted from TSX root element
///
/// This configuration is extracted from Tailwind CSS classes on the root element
/// and passed through the rendering pipeline to ensure PDF output matches TSX design.
///
/// # Example
/// ```
/// use cv_domain::{TSXLayoutConfig, Spacing};
///
/// let config = TSXLayoutConfig {
///     max_width: Some(896.0),  // max-w-4xl in points
///     padding: Spacing {
///         top: 32.0,    // p-8 = 32pt
///         right: 32.0,
///         bottom: 32.0,
///         left: 32.0,
///     },
///     background_color: Some("#ffffff".to_string()),
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct TSXLayoutConfig {
    /// Maximum container width in points (from max-w-* classes)
    /// None means full width
    pub max_width: Option<f64>,

    /// Padding in points (from p-*, px-*, py-*, pt-*, pr-*, pb-*, pl-* classes)
    pub padding: Spacing,

    /// Background color (from bg-* classes)
    pub background_color: Option<String>,
}

/// Spacing values for padding/margins
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct Spacing {
    pub top: f64,
    pub right: f64,
    pub bottom: f64,
    pub left: f64,
}

impl Spacing {
    /// Create uniform spacing (all sides equal)
    pub fn uniform(value: f64) -> Self {
        Self {
            top: value,
            right: value,
            bottom: value,
            left: value,
        }
    }

    /// Create symmetric spacing (vertical and horizontal)
    pub fn symmetric(vertical: f64, horizontal: f64) -> Self {
        Self {
            top: vertical,
            right: horizontal,
            bottom: vertical,
            left: horizontal,
        }
    }

    /// Create zero spacing
    pub fn zero() -> Self {
        Self::uniform(0.0)
    }
}

/// Tailwind spacing scale in pixels (converted to points at 96 DPI → 72 DPI)
/// Reference: https://tailwindcss.com/docs/customizing-spacing
const TAILWIND_SPACING: &[(u32, f64)] = &[
    (0, 0.0),   // p-0
    (1, 3.0),   // p-1 = 4px = 3pt
    (2, 6.0),   // p-2 = 8px = 6pt
    (3, 9.0),   // p-3 = 12px = 9pt
    (4, 12.0),  // p-4 = 16px = 12pt
    (5, 15.0),  // p-5 = 20px = 15pt
    (6, 18.0),  // p-6 = 24px = 18pt
    (7, 21.0),  // p-7 = 28px = 21pt
    (8, 24.0),  // p-8 = 32px = 24pt
    (9, 27.0),  // p-9 = 36px = 27pt
    (10, 30.0), // p-10 = 40px = 30pt
    (11, 33.0), // p-11 = 44px = 33pt
    (12, 36.0), // p-12 = 48px = 36pt
];

/// Tailwind max-width scale in pixels (converted to points)
/// Reference: https://tailwindcss.com/docs/max-width
const TAILWIND_MAX_WIDTH: &[(&str, f64)] = &[
    ("xs", 240.0),  // 320px = 240pt
    ("sm", 288.0),  // 384px = 288pt
    ("md", 336.0),  // 448px = 336pt
    ("lg", 384.0),  // 512px = 384pt
    ("xl", 432.0),  // 576px = 432pt
    ("2xl", 504.0), // 672px = 504pt
    ("3xl", 576.0), // 768px = 576pt
    ("4xl", 672.0), // 896px = 672pt
    ("5xl", 768.0), // 1024px = 768pt
    ("6xl", 864.0), // 1152px = 864pt
    ("7xl", 960.0), // 1280px = 960pt
];

/// Parse Tailwind spacing class (p-8, px-4, py-2, etc.)
fn parse_spacing_value(num: u32) -> Option<f64> {
    TAILWIND_SPACING
        .iter()
        .find(|(n, _)| *n == num)
        .map(|(_, pts)| *pts)
}

/// Parse Tailwind max-width class (max-w-4xl, max-w-lg, etc.)
fn parse_max_width(size: &str) -> Option<f64> {
    TAILWIND_MAX_WIDTH
        .iter()
        .find(|(name, _)| *name == size)
        .map(|(_, pts)| *pts)
}

/// Extract TSX layout configuration from TSX document
///
/// Extracts layout configuration from the root JSX element's className attribute.
/// This makes the TSX the single source of truth for layout dimensions.
///
/// # Example
/// ```no_run
/// use cv_domain::extract_tsx_layout_config_from_document;
/// use tsx_parser::parse_tsx;
///
/// let tsx = r#"<div className="max-w-4xl p-8 bg-white">Content</div>"#;
/// let document = parse_tsx(tsx)?;
/// let config = extract_tsx_layout_config_from_document(&document);
/// # Ok::<(), Box<dyn std::error::Error>>(())
/// ```
pub fn extract_tsx_layout_config_from_document(document: &TsxDocument) -> TSXLayoutConfig {
    let elements = extract_jsx_elements(document);

    if elements.is_empty() {
        return TSXLayoutConfig::default();
    }

    // Extract className from root element
    let root_element = elements[0];

    for attr in &root_element.opening_element.attributes {
        if let JSXAttributeItem::Attribute(jsx_attr) = attr {
            // Check if this is the className attribute
            if let JSXAttributeName::Identifier(ident) = &jsx_attr.name {
                if ident.name.as_str() == "className" {
                    // Extract the className value
                    if let Some(JSXAttributeValue::StringLiteral(class_str)) = &jsx_attr.value {
                        return parse_class_names(class_str.value.as_ref());
                    }
                }
            }
        }
    }

    TSXLayoutConfig::default()
}

/// Parse Tailwind CSS class names into layout configuration
///
/// # Supported Classes
/// - `max-w-{size}` - Maximum width (xs, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl)
/// - `p-{n}` - Uniform padding (0-12)
/// - `px-{n}` - Horizontal padding
/// - `py-{n}` - Vertical padding
/// - `pt-{n}`, `pr-{n}`, `pb-{n}`, `pl-{n}` - Individual side padding
/// - `bg-{color}` - Background color
///
/// # Example
/// ```
/// use cv_domain::parse_class_names;
///
/// let classes = "max-w-4xl mx-auto p-8 bg-white";
/// let config = parse_class_names(classes);
///
/// assert_eq!(config.max_width, Some(672.0)); // 896px = 672pt
/// assert_eq!(config.padding.top, 24.0);       // p-8 = 32px = 24pt
/// ```
pub fn parse_class_names(class_names: &str) -> TSXLayoutConfig {
    let mut config = TSXLayoutConfig::default();
    let classes: Vec<&str> = class_names.split_whitespace().collect();

    for class in classes {
        // Parse max-w-{size}
        if let Some(size) = class.strip_prefix("max-w-") {
            config.max_width = parse_max_width(size);
        }

        // Parse padding classes
        if let Some(num_str) = class.strip_prefix("p-") {
            if let Ok(num) = num_str.parse::<u32>() {
                if let Some(value) = parse_spacing_value(num) {
                    config.padding = Spacing::uniform(value);
                }
            }
        } else if let Some(num_str) = class.strip_prefix("px-") {
            if let Ok(num) = num_str.parse::<u32>() {
                if let Some(value) = parse_spacing_value(num) {
                    config.padding.left = value;
                    config.padding.right = value;
                }
            }
        } else if let Some(num_str) = class.strip_prefix("py-") {
            if let Ok(num) = num_str.parse::<u32>() {
                if let Some(value) = parse_spacing_value(num) {
                    config.padding.top = value;
                    config.padding.bottom = value;
                }
            }
        } else if let Some(num_str) = class.strip_prefix("pt-") {
            if let Ok(num) = num_str.parse::<u32>() {
                if let Some(value) = parse_spacing_value(num) {
                    config.padding.top = value;
                }
            }
        } else if let Some(num_str) = class.strip_prefix("pr-") {
            if let Ok(num) = num_str.parse::<u32>() {
                if let Some(value) = parse_spacing_value(num) {
                    config.padding.right = value;
                }
            }
        } else if let Some(num_str) = class.strip_prefix("pb-") {
            if let Ok(num) = num_str.parse::<u32>() {
                if let Some(value) = parse_spacing_value(num) {
                    config.padding.bottom = value;
                }
            }
        } else if let Some(num_str) = class.strip_prefix("pl-") {
            if let Ok(num) = num_str.parse::<u32>() {
                if let Some(value) = parse_spacing_value(num) {
                    config.padding.left = value;
                }
            }
        }

        // Parse bg-{color} (simplified - just detect bg-white for now)
        if class.starts_with("bg-") {
            let color = class.strip_prefix("bg-").unwrap();
            config.background_color = Some(color.to_string());
        }
    }

    config
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_max_w_4xl() {
        let config = parse_class_names("max-w-4xl");
        assert_eq!(config.max_width, Some(672.0)); // 896px = 672pt at 96 DPI
    }

    #[test]
    fn test_extract_uniform_padding() {
        let config = parse_class_names("p-8");
        assert_eq!(config.padding.top, 24.0);
        assert_eq!(config.padding.right, 24.0);
        assert_eq!(config.padding.bottom, 24.0);
        assert_eq!(config.padding.left, 24.0);
    }

    #[test]
    fn test_extract_horizontal_vertical_padding() {
        let config = parse_class_names("px-4 py-2");
        assert_eq!(config.padding.left, 12.0); // px-4 = 16px = 12pt
        assert_eq!(config.padding.right, 12.0);
        assert_eq!(config.padding.top, 6.0); // py-2 = 8px = 6pt
        assert_eq!(config.padding.bottom, 6.0);
    }

    #[test]
    fn test_extract_individual_padding() {
        let config = parse_class_names("pt-1 pr-2 pb-3 pl-4");
        assert_eq!(config.padding.top, 3.0); // pt-1 = 4px = 3pt
        assert_eq!(config.padding.right, 6.0); // pr-2 = 8px = 6pt
        assert_eq!(config.padding.bottom, 9.0); // pb-3 = 12px = 9pt
        assert_eq!(config.padding.left, 12.0); // pl-4 = 16px = 12pt
    }

    #[test]
    fn test_extract_background_color() {
        let config = parse_class_names("bg-white");
        assert_eq!(config.background_color, Some("white".to_string()));
    }

    #[test]
    fn test_extract_full_config() {
        let config = parse_class_names("max-w-4xl mx-auto p-8 bg-white");
        assert_eq!(config.max_width, Some(672.0));
        assert_eq!(config.padding, Spacing::uniform(24.0));
        assert_eq!(config.background_color, Some("white".to_string()));
    }

    #[test]
    fn test_spacing_helpers() {
        let uniform = Spacing::uniform(10.0);
        assert_eq!(uniform.top, 10.0);
        assert_eq!(uniform.right, 10.0);

        let symmetric = Spacing::symmetric(5.0, 10.0);
        assert_eq!(symmetric.top, 5.0);
        assert_eq!(symmetric.left, 10.0);
    }
}
