//! CSS property parsing module
//!
//! Parses inline CSS style attributes into structured StyleDeclaration objects.
//! Handles individual CSS properties and their values, delegating to specialized
//! parsers for colors and unit conversions.

use super::color::parse_color;
use super::converter::css_to_points;
use crate::css_parser::CSSParseError;
use layout_types::{
    BorderLineStyle, BorderStyle, Display, FlexDirection, FontStyle, FontWeight, JustifyContent,
    Spacing, StyleDeclaration, TextAlign, TextTransform, DEFAULT_FONT_SIZE,
};

/// Parse inline style attribute to StyleDeclaration
///
/// This function takes a CSS style attribute string (e.g., "color: red; font-size: 16px")
/// and parses it into a structured StyleDeclaration.
///
/// # Arguments
/// * `style_attr` - The inline style attribute string
///
/// # Returns
/// A StyleDeclaration with parsed values, or an error if parsing fails
pub fn parse_inline_styles(style_attr: &str) -> Result<StyleDeclaration, CSSParseError> {
    let mut decl = StyleDeclaration::default();

    if style_attr.trim().is_empty() {
        return Ok(decl);
    }

    // Split by semicolons and parse each declaration
    for declaration in style_attr.split(';') {
        let declaration = declaration.trim();
        if declaration.is_empty() {
            continue;
        }

        // Split into property and value
        let parts: Vec<&str> = declaration.splitn(2, ':').collect();
        if parts.len() != 2 {
            continue; // Skip malformed declarations
        }

        let property = parts[0].trim().to_lowercase();
        let value = parts[1].trim();

        // Parse based on property name with error recovery
        // Skip invalid property values instead of failing the entire style string
        match property.as_str() {
            "font-family" => {
                decl.text.font_family = Some(parse_font_family(value));
            }
            "font-size" => {
                if let Ok(size) = css_to_points(value) {
                    decl.text.font_size = Some(size);
                }
                // Skip invalid values, keep previous or default
            }
            "font-weight" => {
                decl.text.font_weight = Some(parse_font_weight(value));
            }
            "font-style" => {
                decl.text.font_style = Some(parse_font_style(value));
            }
            "color" => {
                if let Ok(color) = parse_color(value) {
                    decl.text.color = Some(color);
                }
                // Skip invalid colors
            }
            "background-color" => {
                if let Ok(color) = parse_color(value) {
                    decl.box_model.background_color = Some(color);
                }
                // Skip invalid colors
            }
            "text-align" => {
                decl.text.text_align = Some(parse_text_align(value));
            }
            "line-height" => {
                if let Ok(height) = parse_line_height(value, decl.text.font_size) {
                    decl.text.line_height = Some(height);
                }
                // Skip invalid values
            }
            "letter-spacing" => {
                if let Ok(spacing) = css_to_points(value) {
                    decl.text.letter_spacing = Some(spacing);
                }
                // Skip invalid values
            }
            "margin" => {
                if let Ok(margin) = parse_spacing(value) {
                    decl.box_model.margin = Some(margin);
                }
                // Skip invalid values
            }
            "padding" => {
                if let Ok(padding) = parse_spacing(value) {
                    decl.box_model.padding = Some(padding);
                }
                // Skip invalid values
            }
            "width" => {
                if let Ok(width) = css_to_points(value) {
                    decl.box_model.width = Some(width);
                }
                // Skip invalid values
            }
            "height" => {
                if let Ok(height) = css_to_points(value) {
                    decl.box_model.height = Some(height);
                }
                // Skip invalid values
            }
            "max-width" => {
                if let Ok(max_width) = css_to_points(value) {
                    decl.box_model.max_width = Some(max_width);
                }
                // Skip invalid values
            }
            "max-height" => {
                if let Ok(max_height) = css_to_points(value) {
                    decl.box_model.max_height = Some(max_height);
                }
                // Skip invalid values
            }
            "display" => {
                decl.flex.display = Some(parse_display(value));
            }
            "flex" => {
                decl.flex.flex = Some(parse_flex(value)?);
            }
            "flex-shrink" => {
                if let Ok(v) = value.trim().parse::<f64>() {
                    decl.flex.flex_shrink = Some(v);
                }
            }
            "flex-direction" => {
                decl.flex.flex_direction = Some(parse_flex_direction(value));
            }
            "border-bottom" => {
                decl.box_model.border_bottom = Some(parse_border_bottom(value)?);
            }
            // Individual border-bottom properties
            "border-bottom-width" => {
                let mut border = decl.box_model.border_bottom.take().unwrap_or_default();
                if let Ok(width) = css_to_points(value) {
                    border.width = width;
                    decl.box_model.border_bottom = Some(border);
                }
            }
            "border-bottom-color" => {
                let mut border = decl.box_model.border_bottom.take().unwrap_or_default();
                if let Ok(color) = parse_color(value) {
                    border.color = color;
                    decl.box_model.border_bottom = Some(border);
                }
            }
            "border-bottom-style" => {
                let mut border = decl.box_model.border_bottom.take().unwrap_or_default();
                border.style = parse_border_style(value);
                decl.box_model.border_bottom = Some(border);
            }
            // Individual border-top properties
            "border-top" => {
                decl.box_model.border_top = Some(parse_border_bottom(value)?);
            }
            "border-top-width" => {
                let mut border = decl.box_model.border_top.take().unwrap_or_default();
                if let Ok(width) = css_to_points(value) {
                    border.width = width;
                    decl.box_model.border_top = Some(border);
                }
            }
            "border-top-color" => {
                let mut border = decl.box_model.border_top.take().unwrap_or_default();
                if let Ok(color) = parse_color(value) {
                    border.color = color;
                    decl.box_model.border_top = Some(border);
                }
            }
            "border-top-style" => {
                let mut border = decl.box_model.border_top.take().unwrap_or_default();
                border.style = parse_border_style(value);
                decl.box_model.border_top = Some(border);
            }
            // Individual border-left properties
            "border-left" => {
                decl.box_model.border_left = Some(parse_border_bottom(value)?);
            }
            "border-left-width" => {
                let mut border = decl.box_model.border_left.take().unwrap_or_default();
                if let Ok(width) = css_to_points(value) {
                    border.width = width;
                    decl.box_model.border_left = Some(border);
                }
            }
            "border-left-color" => {
                let mut border = decl.box_model.border_left.take().unwrap_or_default();
                if let Ok(color) = parse_color(value) {
                    border.color = color;
                    decl.box_model.border_left = Some(border);
                }
            }
            "border-left-style" => {
                let mut border = decl.box_model.border_left.take().unwrap_or_default();
                border.style = parse_border_style(value);
                decl.box_model.border_left = Some(border);
            }
            // Individual border-right properties
            "border-right" => {
                decl.box_model.border_right = Some(parse_border_bottom(value)?);
            }
            "border-right-width" => {
                let mut border = decl.box_model.border_right.take().unwrap_or_default();
                if let Ok(width) = css_to_points(value) {
                    border.width = width;
                    decl.box_model.border_right = Some(border);
                }
            }
            "border-right-color" => {
                let mut border = decl.box_model.border_right.take().unwrap_or_default();
                if let Ok(color) = parse_color(value) {
                    border.color = color;
                    decl.box_model.border_right = Some(border);
                }
            }
            "border-right-style" => {
                let mut border = decl.box_model.border_right.take().unwrap_or_default();
                border.style = parse_border_style(value);
                decl.box_model.border_right = Some(border);
            }
            "border-color" => {
                // Apply color only to borders that already exist (have width set)
                // Don't create new borders - that would cause unwanted borders on all sides
                if let Ok(color) = parse_color(value) {
                    if let Some(mut border_top) = decl.box_model.border_top.take() {
                        border_top.color = color;
                        decl.box_model.border_top = Some(border_top);
                    }

                    if let Some(mut border_right) = decl.box_model.border_right.take() {
                        border_right.color = color;
                        decl.box_model.border_right = Some(border_right);
                    }

                    if let Some(mut border_bottom) = decl.box_model.border_bottom.take() {
                        border_bottom.color = color;
                        decl.box_model.border_bottom = Some(border_bottom);
                    }

                    if let Some(mut border_left) = decl.box_model.border_left.take() {
                        border_left.color = color;
                        decl.box_model.border_left = Some(border_left);
                    }
                }
            }
            "text-transform" => {
                decl.text.text_transform = Some(parse_text_transform(value));
            }
            "justify-content" => {
                decl.flex.justify_content = Some(parse_justify_content(value));
            }
            // Specific margin properties
            "margin-top" => {
                let mut margin = decl.box_model.margin.unwrap_or_default();
                margin.top = css_to_points(value)?;
                decl.box_model.margin = Some(margin);
            }
            "margin-right" => {
                let mut margin = decl.box_model.margin.unwrap_or_default();
                margin.right = css_to_points(value)?;
                decl.box_model.margin = Some(margin);
            }
            "margin-bottom" => {
                let mut margin = decl.box_model.margin.unwrap_or_default();
                margin.bottom = css_to_points(value)?;
                decl.box_model.margin = Some(margin);
            }
            "margin-left" => {
                let mut margin = decl.box_model.margin.unwrap_or_default();
                margin.left = css_to_points(value)?;
                decl.box_model.margin = Some(margin);
            }
            // Specific padding properties
            "padding-top" => {
                let mut padding = decl.box_model.padding.unwrap_or_default();
                padding.top = css_to_points(value)?;
                decl.box_model.padding = Some(padding);
            }
            "padding-right" => {
                let mut padding = decl.box_model.padding.unwrap_or_default();
                padding.right = css_to_points(value)?;
                decl.box_model.padding = Some(padding);
            }
            "padding-bottom" => {
                let mut padding = decl.box_model.padding.unwrap_or_default();
                padding.bottom = css_to_points(value)?;
                decl.box_model.padding = Some(padding);
            }
            "padding-left" => {
                let mut padding = decl.box_model.padding.unwrap_or_default();
                padding.left = css_to_points(value)?;
                decl.box_model.padding = Some(padding);
            }
            "gap" => {
                if let Ok(gap_value) = css_to_points(value) {
                    decl.flex.gap = Some(gap_value);
                    // When gap is set, apply to both row and column if not explicitly set
                    if decl.flex.row_gap.is_none() {
                        decl.flex.row_gap = Some(gap_value);
                    }
                    if decl.flex.column_gap.is_none() {
                        decl.flex.column_gap = Some(gap_value);
                    }
                }
            }
            "row-gap" => {
                if let Ok(gap_value) = css_to_points(value) {
                    decl.flex.row_gap = Some(gap_value);
                }
            }
            "column-gap" => {
                if let Ok(gap_value) = css_to_points(value) {
                    decl.flex.column_gap = Some(gap_value);
                }
            }
            _ => {
                // Ignore unknown properties
            }
        }
    }

    Ok(decl)
}

/// Parse font-family CSS property
fn parse_font_family(value: &str) -> String {
    // Remove quotes and take first font family
    let font = value
        .split(',')
        .next()
        .unwrap_or("Helvetica")
        .trim()
        .trim_matches(|c| c == '"' || c == '\'');

    font.to_string()
}

/// Parse font-weight CSS property
fn parse_font_weight(value: &str) -> FontWeight {
    match value.trim().to_lowercase().as_str() {
        // Bold weights: 600-900
        "bold" | "600" | "700" | "800" | "900" => FontWeight::Bold,
        // Light weights: 100-300
        "lighter" | "100" | "200" | "300" => FontWeight::Lighter,
        "bolder" => FontWeight::Bolder,
        // Normal: 400-500 and default
        _ => FontWeight::Normal,
    }
}

/// Parse font-style CSS property
fn parse_font_style(value: &str) -> FontStyle {
    match value.trim().to_lowercase().as_str() {
        "italic" => FontStyle::Italic,
        "oblique" => FontStyle::Oblique,
        _ => FontStyle::Normal,
    }
}

/// Parse border-style CSS property
fn parse_border_style(value: &str) -> BorderLineStyle {
    match value.trim().to_lowercase().as_str() {
        "solid" => BorderLineStyle::Solid,
        "dashed" => BorderLineStyle::Dashed,
        "dotted" => BorderLineStyle::Dotted,
        "none" => BorderLineStyle::None,
        _ => BorderLineStyle::Solid,
    }
}

/// Parse line-height CSS property
/// Supports: unitless (multiplier), px, pt, em, rem, %
fn parse_line_height(value: &str, font_size: Option<f64>) -> Result<f64, CSSParseError> {
    let trimmed = value.trim();
    let current_font_size = font_size.unwrap_or(DEFAULT_FONT_SIZE);

    // Check if unitless (multiplier)
    if let Ok(multiplier) = trimmed.parse::<f64>() {
        // Unitless line-height is a multiplier of font-size
        return Ok(multiplier * current_font_size);
    }

    // Otherwise parse as length with units
    css_to_points(value)
}

/// Parse text-align CSS property
fn parse_text_align(value: &str) -> TextAlign {
    match value.trim().to_lowercase().as_str() {
        "right" => TextAlign::Right,
        "center" => TextAlign::Center,
        "justify" => TextAlign::Justify,
        _ => TextAlign::Left,
    }
}

/// Parse display CSS property
fn parse_display(value: &str) -> Display {
    match value.trim().to_lowercase().as_str() {
        "flex" => Display::Flex,
        "inline" => Display::Inline,
        "inline-block" => Display::InlineBlock,
        _ => Display::Block,
    }
}

/// Parse flex property (flex-grow value)
fn parse_flex(value: &str) -> Result<f64, CSSParseError> {
    value
        .trim()
        .parse::<f64>()
        .map_err(|_| CSSParseError::InvalidValue(value.to_string()))
}

/// Parse flex-direction CSS property
fn parse_flex_direction(value: &str) -> FlexDirection {
    match value.trim().to_lowercase().as_str() {
        "column" => FlexDirection::Column,
        "row-reverse" => FlexDirection::RowReverse,
        "column-reverse" => FlexDirection::ColumnReverse,
        _ => FlexDirection::Row,
    }
}

/// Parse border-bottom CSS property
/// Supports formats: "1px solid #000" or "2px dashed red"
fn parse_border_bottom(value: &str) -> Result<BorderStyle, CSSParseError> {
    let parts: Vec<&str> = value.split_whitespace().collect();

    if parts.is_empty() {
        return Err(CSSParseError::InvalidValue(value.to_string()));
    }

    // Default values
    let mut width = 1.0;
    let mut color = layout_types::Color {
        r: 0,
        g: 0,
        b: 0,
        a: 1.0,
    };
    let mut style = BorderLineStyle::Solid;

    // Parse each part
    for part in parts {
        let lower = part.to_lowercase();

        // Try to parse as width (ends with px, pt, etc.)
        if lower.ends_with("px") || lower.ends_with("pt") || lower.ends_with("em") {
            width = css_to_points(part)?;
        }
        // Try to parse as style
        else if lower == "solid" {
            style = BorderLineStyle::Solid;
        } else if lower == "dashed" {
            style = BorderLineStyle::Dashed;
        } else if lower == "dotted" {
            style = BorderLineStyle::Dotted;
        } else if lower == "none" {
            style = BorderLineStyle::None;
        }
        // Try to parse as color (starts with # or rgb or named color)
        else if part.starts_with('#') || part.starts_with("rgb") || !part.is_empty() {
            if let Ok(parsed_color) = parse_color(part) {
                color = parsed_color;
            }
        }
    }

    Ok(BorderStyle {
        width,
        color,
        style,
    })
}

/// Parse text-transform CSS property
fn parse_text_transform(value: &str) -> TextTransform {
    match value.trim().to_lowercase().as_str() {
        "uppercase" => TextTransform::Uppercase,
        "lowercase" => TextTransform::Lowercase,
        "capitalize" => TextTransform::Capitalize,
        _ => TextTransform::None,
    }
}

/// Parse justify-content CSS property
fn parse_justify_content(value: &str) -> JustifyContent {
    match value.trim().to_lowercase().as_str() {
        "flex-end" | "end" => JustifyContent::FlexEnd,
        "center" => JustifyContent::Center,
        "space-between" | "between" => JustifyContent::SpaceBetween, // tailwind-css outputs 'between'
        "space-around" | "around" => JustifyContent::SpaceAround,
        "space-evenly" | "evenly" => JustifyContent::SpaceEvenly,
        _ => JustifyContent::FlexStart,
    }
}

/// Parse spacing shorthand (margin, padding)
/// Supports: value (all), value value (vertical horizontal),
/// value value value (top horizontal bottom), value value value value (top right bottom left)
fn parse_spacing(value: &str) -> Result<Spacing, CSSParseError> {
    let values: Vec<&str> = value.split_whitespace().collect();

    match values.len() {
        1 => {
            let all = css_to_points(values[0])?;
            Ok(Spacing {
                top: all,
                right: all,
                bottom: all,
                left: all,
            })
        }
        2 => {
            let vertical = css_to_points(values[0])?;
            let horizontal = css_to_points(values[1])?;
            Ok(Spacing {
                top: vertical,
                right: horizontal,
                bottom: vertical,
                left: horizontal,
            })
        }
        3 => {
            let top = css_to_points(values[0])?;
            let horizontal = css_to_points(values[1])?;
            let bottom = css_to_points(values[2])?;
            Ok(Spacing {
                top,
                right: horizontal,
                bottom,
                left: horizontal,
            })
        }
        4 => Ok(Spacing {
            top: css_to_points(values[0])?,
            right: css_to_points(values[1])?,
            bottom: css_to_points(values[2])?,
            left: css_to_points(values[3])?,
        }),
        _ => Err(CSSParseError::InvalidValue(value.to_string())),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_inline_styles_empty() {
        let result = parse_inline_styles("").unwrap();
        assert_eq!(result.text.font_family, Some("Helvetica".to_string()));
    }

    #[test]
    fn test_parse_font_size() {
        let result = parse_inline_styles("font-size: 16px").unwrap();
        assert_eq!(result.text.font_size, Some(12.0)); // 16 * 0.75 = 12
    }

    #[test]
    fn test_parse_color_hex() {
        let result = parse_inline_styles("color: #ff0000").unwrap();
        assert_eq!(
            result.text.color,
            Some(layout_types::Color {
                r: 255,
                g: 0,
                b: 0,
                a: 1.0
            })
        );
    }

    #[test]
    fn test_parse_color_rgb() {
        let result = parse_inline_styles("color: rgb(255, 0, 0)").unwrap();
        assert_eq!(
            result.text.color,
            Some(layout_types::Color {
                r: 255,
                g: 0,
                b: 0,
                a: 1.0
            })
        );
    }

    #[test]
    fn test_parse_color_named() {
        let result = parse_inline_styles("color: red").unwrap();
        assert_eq!(
            result.text.color,
            Some(layout_types::Color {
                r: 255,
                g: 0,
                b: 0,
                a: 1.0
            })
        );
    }

    #[test]
    fn test_parse_margin_shorthand() {
        let result = parse_inline_styles("margin: 10px 20px").unwrap();
        let margin = result.box_model.margin.unwrap();
        assert_eq!(margin.top, 7.5); // 10 * 0.75
        assert_eq!(margin.right, 15.0); // 20 * 0.75
        assert_eq!(margin.bottom, 7.5);
        assert_eq!(margin.left, 15.0);
    }

    #[test]
    fn test_parse_font_weight_bold() {
        let result = parse_inline_styles("font-weight: bold").unwrap();
        assert_eq!(result.text.font_weight, Some(FontWeight::Bold));
    }

    #[test]
    fn test_parse_font_weight_700() {
        let result = parse_inline_styles("font-weight: 700").unwrap();
        assert_eq!(result.text.font_weight, Some(FontWeight::Bold));
    }

    #[test]
    fn test_parse_font_weight_lighter() {
        let result = parse_inline_styles("font-weight: lighter").unwrap();
        assert_eq!(result.text.font_weight, Some(FontWeight::Lighter));
    }

    #[test]
    fn test_parse_font_weight_normal() {
        let result = parse_inline_styles("font-weight: 400").unwrap();
        assert_eq!(result.text.font_weight, Some(FontWeight::Normal));
    }

    #[test]
    fn test_parse_font_weight_600() {
        let result = parse_inline_styles("font-weight: 600").unwrap();
        assert_eq!(result.text.font_weight, Some(FontWeight::Bold));
    }

    #[test]
    fn test_parse_font_style_italic() {
        let result = parse_inline_styles("font-style: italic").unwrap();
        assert_eq!(result.text.font_style, Some(FontStyle::Italic));
    }

    #[test]
    fn test_parse_font_style_oblique() {
        let result = parse_inline_styles("font-style: oblique").unwrap();
        assert_eq!(result.text.font_style, Some(FontStyle::Oblique));
    }

    #[test]
    fn test_parse_font_style_normal() {
        let result = parse_inline_styles("font-style: normal").unwrap();
        assert_eq!(result.text.font_style, Some(FontStyle::Normal));
    }

    #[test]
    fn test_parse_text_align_left() {
        let result = parse_inline_styles("text-align: left").unwrap();
        assert_eq!(result.text.text_align, Some(TextAlign::Left));
    }

    #[test]
    fn test_parse_text_align_center() {
        let result = parse_inline_styles("text-align: center").unwrap();
        assert_eq!(result.text.text_align, Some(TextAlign::Center));
    }

    #[test]
    fn test_parse_text_align_right() {
        let result = parse_inline_styles("text-align: right").unwrap();
        assert_eq!(result.text.text_align, Some(TextAlign::Right));
    }

    #[test]
    fn test_parse_text_align_justify() {
        let result = parse_inline_styles("text-align: justify").unwrap();
        assert_eq!(result.text.text_align, Some(TextAlign::Justify));
    }

    #[test]
    fn test_parse_display_block() {
        let result = parse_inline_styles("display: block").unwrap();
        assert_eq!(result.flex.display, Some(Display::Block));
    }

    #[test]
    fn test_parse_display_flex() {
        let result = parse_inline_styles("display: flex").unwrap();
        assert_eq!(result.flex.display, Some(Display::Flex));
    }

    #[test]
    fn test_parse_display_inline() {
        let result = parse_inline_styles("display: inline").unwrap();
        assert_eq!(result.flex.display, Some(Display::Inline));
    }

    #[test]
    fn test_parse_flex_valid() {
        let result = parse_inline_styles("flex: 1").unwrap();
        assert_eq!(result.flex.flex, Some(1.0));
    }

    #[test]
    fn test_parse_flex_invalid() {
        let result = parse_inline_styles("flex: invalid");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_flex_direction_row() {
        let result = parse_inline_styles("flex-direction: row").unwrap();
        assert_eq!(result.flex.flex_direction, Some(FlexDirection::Row));
    }

    #[test]
    fn test_parse_flex_direction_column() {
        let result = parse_inline_styles("flex-direction: column").unwrap();
        assert_eq!(result.flex.flex_direction, Some(FlexDirection::Column));
    }

    #[test]
    fn test_parse_border_bottom_simple() {
        let result = parse_inline_styles("border-bottom: 1px solid #000").unwrap();
        let border = result.box_model.border_bottom.unwrap();
        assert_eq!(border.width, 0.75); // 1px * 0.75
        assert_eq!(border.style, BorderLineStyle::Solid);
        assert_eq!(border.color.r, 0);
    }

    #[test]
    fn test_parse_border_bottom_dashed() {
        let result = parse_inline_styles("border-bottom: 2px dashed red").unwrap();
        let border = result.box_model.border_bottom.unwrap();
        assert_eq!(border.width, 1.5); // 2px * 0.75
        assert_eq!(border.style, BorderLineStyle::Dashed);
        assert_eq!(border.color.r, 255);
    }

    #[test]
    fn test_parse_border_bottom_invalid() {
        let result = parse_inline_styles("border-bottom:");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_text_transform_uppercase() {
        let result = parse_inline_styles("text-transform: uppercase").unwrap();
        assert_eq!(result.text.text_transform, Some(TextTransform::Uppercase));
    }

    #[test]
    fn test_parse_text_transform_lowercase() {
        let result = parse_inline_styles("text-transform: lowercase").unwrap();
        assert_eq!(result.text.text_transform, Some(TextTransform::Lowercase));
    }

    #[test]
    fn test_parse_text_transform_capitalize() {
        let result = parse_inline_styles("text-transform: capitalize").unwrap();
        assert_eq!(result.text.text_transform, Some(TextTransform::Capitalize));
    }

    #[test]
    fn test_parse_justify_content_flex_start() {
        let result = parse_inline_styles("justify-content: flex-start").unwrap();
        assert_eq!(result.flex.justify_content, Some(JustifyContent::FlexStart));
    }

    #[test]
    fn test_parse_justify_content_center() {
        let result = parse_inline_styles("justify-content: center").unwrap();
        assert_eq!(result.flex.justify_content, Some(JustifyContent::Center));
    }

    #[test]
    fn test_parse_justify_content_space_between() {
        let result = parse_inline_styles("justify-content: space-between").unwrap();
        assert_eq!(
            result.flex.justify_content,
            Some(JustifyContent::SpaceBetween)
        );
    }

    #[test]
    fn test_parse_spacing_one_value() {
        let result = parse_inline_styles("padding: 10px").unwrap();
        let padding = result.box_model.padding.unwrap();
        assert_eq!(padding.top, 7.5);
        assert_eq!(padding.right, 7.5);
        assert_eq!(padding.bottom, 7.5);
        assert_eq!(padding.left, 7.5);
    }

    #[test]
    fn test_parse_spacing_three_values() {
        let result = parse_inline_styles("margin: 10px 20px 30px").unwrap();
        let margin = result.box_model.margin.unwrap();
        assert_eq!(margin.top, 7.5);
        assert_eq!(margin.right, 15.0);
        assert_eq!(margin.bottom, 22.5);
        assert_eq!(margin.left, 15.0);
    }

    #[test]
    fn test_parse_spacing_four_values() {
        let result = parse_inline_styles("padding: 10px 20px 30px 40px").unwrap();
        let padding = result.box_model.padding.unwrap();
        assert_eq!(padding.top, 7.5);
        assert_eq!(padding.right, 15.0);
        assert_eq!(padding.bottom, 22.5);
        assert_eq!(padding.left, 30.0);
    }

    #[test]
    fn test_parse_line_height_unitless() {
        let result = parse_inline_styles("font-size: 16px; line-height: 1.5").unwrap();
        assert_eq!(result.text.line_height, Some(18.0)); // 12.0 * 1.5
    }

    #[test]
    fn test_parse_line_height_pixels() {
        let result = parse_inline_styles("line-height: 24px").unwrap();
        assert_eq!(result.text.line_height, Some(18.0)); // 24 * 0.75
    }

    #[test]
    fn test_parse_background_color() {
        let result = parse_inline_styles("background-color: #00ff00").unwrap();
        assert_eq!(
            result.box_model.background_color,
            Some(layout_types::Color {
                r: 0,
                g: 255,
                b: 0,
                a: 1.0
            })
        );
    }

    #[test]
    fn test_parse_width() {
        let result = parse_inline_styles("width: 100px").unwrap();
        assert_eq!(result.box_model.width, Some(75.0)); // 100 * 0.75
    }

    #[test]
    fn test_parse_height() {
        let result = parse_inline_styles("height: 200px").unwrap();
        assert_eq!(result.box_model.height, Some(150.0)); // 200 * 0.75
    }

    #[test]
    fn test_parse_letter_spacing() {
        let result = parse_inline_styles("letter-spacing: 2px").unwrap();
        assert_eq!(result.text.letter_spacing, Some(1.5)); // 2 * 0.75
    }

    #[test]
    fn test_parse_margin_top() {
        let result = parse_inline_styles("margin-top: 10px").unwrap();
        let margin = result.box_model.margin.unwrap();
        assert_eq!(margin.top, 7.5);
    }

    #[test]
    fn test_parse_padding_bottom() {
        let result = parse_inline_styles("padding-bottom: 15px").unwrap();
        let padding = result.box_model.padding.unwrap();
        assert_eq!(padding.bottom, 11.25);
    }

    #[test]
    fn test_parse_font_family() {
        let result = parse_inline_styles("font-family: 'Roboto', sans-serif").unwrap();
        assert_eq!(result.text.font_family, Some("Roboto".to_string()));
    }

    #[test]
    fn test_parse_multiple_properties() {
        let result =
            parse_inline_styles("color: blue; font-size: 14px; font-weight: bold").unwrap();
        assert_eq!(
            result.text.color,
            Some(layout_types::Color {
                r: 0,
                g: 0,
                b: 255,
                a: 1.0
            })
        );
        assert_eq!(result.text.font_size, Some(10.5)); // 14 * 0.75
        assert_eq!(result.text.font_weight, Some(FontWeight::Bold));
    }

    #[test]
    fn test_parse_border_width_and_color_without_style() {
        // This tests the exact CSS output from tailwind-css for "border-b border-gray-400"
        // tailwind-css outputs: "border-bottom-width:1px;border-color:rgba(156, 163, 175, 1);"
        // It does NOT output border-bottom-style, so we must default to Solid
        let result =
            parse_inline_styles("border-bottom-width:1px;border-color:rgba(156, 163, 175, 1);")
                .unwrap();

        let border = result
            .box_model
            .border_bottom
            .expect("border_bottom should be set");
        assert_eq!(border.width, 0.75); // 1px * 0.75
        assert_eq!(border.style, BorderLineStyle::Solid); // Should default to Solid
        assert_eq!(border.color.r, 156);
        assert_eq!(border.color.g, 163);
        assert_eq!(border.color.b, 175);
        assert_eq!(border.color.a, 1.0);
    }
}
