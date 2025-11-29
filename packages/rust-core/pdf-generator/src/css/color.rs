//! CSS color parsing module
//!
//! Handles parsing of CSS color values in various formats:
//! - Hex colors: #RGB, #RRGGBB, #RRGGBBAA
//! - RGB/RGBA: rgb(r, g, b), rgba(r, g, b, a)
//! - Named colors: black, white, red, etc.

use crate::css_parser::CSSParseError;
use layout_types::Color;

/// Parse CSS color to Color struct
///
/// Supports the following formats:
/// - Hex: #RGB, #RRGGBB, #RRGGBBAA
/// - RGB: rgb(r, g, b)
/// - RGBA: rgba(r, g, b, a)
/// - Named colors: black, white, red, green, blue, gray, etc.
pub fn parse_color(color_str: &str) -> Result<Color, CSSParseError> {
    let trimmed = color_str.trim();

    // Handle hex colors: #RGB, #RRGGBB, #RRGGBBAA
    if trimmed.starts_with('#') {
        return parse_hex_color(trimmed);
    }

    // Handle rgb(), rgba()
    if trimmed.starts_with("rgb") {
        return parse_rgb_color(trimmed);
    }

    // Handle named colors
    parse_named_color(trimmed)
}

/// Parse hex color
fn parse_hex_color(hex_str: &str) -> Result<Color, CSSParseError> {
    let hex = hex_str.trim_start_matches('#');

    match hex.len() {
        3 => {
            // #RGB → #RRGGBB
            let r = u8::from_str_radix(&hex[0..1].repeat(2), 16)
                .map_err(|_| CSSParseError::InvalidColor(hex_str.to_string()))?;
            let g = u8::from_str_radix(&hex[1..2].repeat(2), 16)
                .map_err(|_| CSSParseError::InvalidColor(hex_str.to_string()))?;
            let b = u8::from_str_radix(&hex[2..3].repeat(2), 16)
                .map_err(|_| CSSParseError::InvalidColor(hex_str.to_string()))?;
            Ok(Color { r, g, b, a: 1.0 })
        }
        6 => {
            // #RRGGBB
            let r = u8::from_str_radix(&hex[0..2], 16)
                .map_err(|_| CSSParseError::InvalidColor(hex_str.to_string()))?;
            let g = u8::from_str_radix(&hex[2..4], 16)
                .map_err(|_| CSSParseError::InvalidColor(hex_str.to_string()))?;
            let b = u8::from_str_radix(&hex[4..6], 16)
                .map_err(|_| CSSParseError::InvalidColor(hex_str.to_string()))?;
            Ok(Color { r, g, b, a: 1.0 })
        }
        8 => {
            // #RRGGBBAA
            let r = u8::from_str_radix(&hex[0..2], 16)
                .map_err(|_| CSSParseError::InvalidColor(hex_str.to_string()))?;
            let g = u8::from_str_radix(&hex[2..4], 16)
                .map_err(|_| CSSParseError::InvalidColor(hex_str.to_string()))?;
            let b = u8::from_str_radix(&hex[4..6], 16)
                .map_err(|_| CSSParseError::InvalidColor(hex_str.to_string()))?;
            let a = u8::from_str_radix(&hex[6..8], 16)
                .map_err(|_| CSSParseError::InvalidColor(hex_str.to_string()))?;
            Ok(Color {
                r,
                g,
                b,
                a: a as f32 / 255.0,
            })
        }
        _ => Err(CSSParseError::InvalidColor(hex_str.to_string())),
    }
}

/// Parse rgb() or rgba() color
fn parse_rgb_color(rgb_str: &str) -> Result<Color, CSSParseError> {
    // Extract content between parentheses
    let start = rgb_str
        .find('(')
        .ok_or_else(|| CSSParseError::InvalidColor(rgb_str.to_string()))?;
    let end = rgb_str
        .find(')')
        .ok_or_else(|| CSSParseError::InvalidColor(rgb_str.to_string()))?;
    let content = &rgb_str[start + 1..end];

    // Split by commas
    let values: Vec<&str> = content.split(',').map(|s| s.trim()).collect();

    match values.len() {
        3 => {
            // rgb(r, g, b)
            let r = parse_color_component(values[0])?;
            let g = parse_color_component(values[1])?;
            let b = parse_color_component(values[2])?;
            Ok(Color { r, g, b, a: 1.0 })
        }
        4 => {
            // rgba(r, g, b, a)
            let r = parse_color_component(values[0])?;
            let g = parse_color_component(values[1])?;
            let b = parse_color_component(values[2])?;
            let a = values[3]
                .parse::<f32>()
                .map_err(|_| CSSParseError::InvalidColor(rgb_str.to_string()))?;
            Ok(Color { r, g, b, a })
        }
        _ => Err(CSSParseError::InvalidColor(rgb_str.to_string())),
    }
}

/// Parse a single color component (0-255 or percentage)
fn parse_color_component(value: &str) -> Result<u8, CSSParseError> {
    if value.ends_with('%') {
        let percentage = value
            .trim_end_matches('%')
            .parse::<f32>()
            .map_err(|_| CSSParseError::InvalidColor(value.to_string()))?;
        Ok((percentage * 2.55).round() as u8)
    } else {
        value
            .parse::<u8>()
            .map_err(|_| CSSParseError::InvalidColor(value.to_string()))
    }
}

/// Parse named colors
fn parse_named_color(name: &str) -> Result<Color, CSSParseError> {
    match name.to_lowercase().as_str() {
        "black" => Ok(Color {
            r: 0,
            g: 0,
            b: 0,
            a: 1.0,
        }),
        "white" => Ok(Color {
            r: 255,
            g: 255,
            b: 255,
            a: 1.0,
        }),
        "red" => Ok(Color {
            r: 255,
            g: 0,
            b: 0,
            a: 1.0,
        }),
        "green" => Ok(Color {
            r: 0,
            g: 128,
            b: 0,
            a: 1.0,
        }),
        "blue" => Ok(Color {
            r: 0,
            g: 0,
            b: 255,
            a: 1.0,
        }),
        "yellow" => Ok(Color {
            r: 255,
            g: 255,
            b: 0,
            a: 1.0,
        }),
        "cyan" => Ok(Color {
            r: 0,
            g: 255,
            b: 255,
            a: 1.0,
        }),
        "magenta" => Ok(Color {
            r: 255,
            g: 0,
            b: 255,
            a: 1.0,
        }),
        "gray" | "grey" => Ok(Color {
            r: 128,
            g: 128,
            b: 128,
            a: 1.0,
        }),
        "silver" => Ok(Color {
            r: 192,
            g: 192,
            b: 192,
            a: 1.0,
        }),
        "maroon" => Ok(Color {
            r: 128,
            g: 0,
            b: 0,
            a: 1.0,
        }),
        "olive" => Ok(Color {
            r: 128,
            g: 128,
            b: 0,
            a: 1.0,
        }),
        "lime" => Ok(Color {
            r: 0,
            g: 255,
            b: 0,
            a: 1.0,
        }),
        "aqua" => Ok(Color {
            r: 0,
            g: 255,
            b: 255,
            a: 1.0,
        }),
        "teal" => Ok(Color {
            r: 0,
            g: 128,
            b: 128,
            a: 1.0,
        }),
        "navy" => Ok(Color {
            r: 0,
            g: 0,
            b: 128,
            a: 1.0,
        }),
        "fuchsia" => Ok(Color {
            r: 255,
            g: 0,
            b: 255,
            a: 1.0,
        }),
        "purple" => Ok(Color {
            r: 128,
            g: 0,
            b: 128,
            a: 1.0,
        }),
        "orange" => Ok(Color {
            r: 255,
            g: 165,
            b: 0,
            a: 1.0,
        }),
        _ => Err(CSSParseError::InvalidColor(name.to_string())),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_hex_color_3_digit() {
        let color = parse_color("#f00").unwrap();
        assert_eq!(
            color,
            Color {
                r: 255,
                g: 0,
                b: 0,
                a: 1.0
            }
        );
    }

    #[test]
    fn test_parse_hex_color_6_digit() {
        let color = parse_color("#ff0000").unwrap();
        assert_eq!(
            color,
            Color {
                r: 255,
                g: 0,
                b: 0,
                a: 1.0
            }
        );
    }

    #[test]
    fn test_parse_hex_color_8_digit() {
        let color = parse_color("#ff000080").unwrap();
        assert_eq!(
            color,
            Color {
                r: 255,
                g: 0,
                b: 0,
                a: 0.5019608
            }
        );
    }

    #[test]
    fn test_parse_rgb_color() {
        let color = parse_color("rgb(255, 0, 0)").unwrap();
        assert_eq!(
            color,
            Color {
                r: 255,
                g: 0,
                b: 0,
                a: 1.0
            }
        );
    }

    #[test]
    fn test_parse_named_color() {
        let color = parse_color("red").unwrap();
        assert_eq!(
            color,
            Color {
                r: 255,
                g: 0,
                b: 0,
                a: 1.0
            }
        );
    }

    // Error path tests
    #[test]
    fn test_parse_hex_color_invalid_length() {
        let result = parse_color("#12345");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_hex_color_invalid_chars() {
        let result = parse_color("#gggggg");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_rgb_color_missing_parentheses() {
        let result = parse_color("rgb 255, 0, 0");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_rgb_color_wrong_component_count() {
        let result = parse_color("rgb(255, 0)");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_rgb_color_invalid_component() {
        let result = parse_color("rgb(256, 0, 0)");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_rgba_color_invalid_alpha() {
        let result = parse_color("rgba(255, 0, 0, invalid)");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_named_color_invalid() {
        let result = parse_color("invalid_color_name");
        assert!(result.is_err());
    }

    // Additional valid tests for coverage
    #[test]
    fn test_parse_rgba_color() {
        let color = parse_color("rgba(255, 128, 0, 0.5)").unwrap();
        assert_eq!(color.r, 255);
        assert_eq!(color.g, 128);
        assert_eq!(color.b, 0);
        assert_eq!(color.a, 0.5);
    }

    #[test]
    fn test_parse_rgb_with_percentages() {
        let color = parse_color("rgb(100%, 50%, 0%)").unwrap();
        assert_eq!(color.r, 255);
        assert_eq!(color.g, 128); // 50% * 2.55 = 127.5 rounded to 128
        assert_eq!(color.b, 0);
    }

    #[test]
    fn test_parse_color_component_percentage() {
        let result = parse_color_component("50%").unwrap();
        assert_eq!(result, 128); // 50% * 2.55 = 127.5 → 128 (rounded)
    }

    #[test]
    fn test_parse_color_component_invalid_percentage() {
        let result = parse_color_component("invalid%");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_named_color_case_insensitive() {
        let color1 = parse_color("RED").unwrap();
        let color2 = parse_color("Red").unwrap();
        let color3 = parse_color("red").unwrap();
        assert_eq!(color1, color2);
        assert_eq!(color2, color3);
    }

    #[test]
    fn test_parse_all_named_colors() {
        // Test all supported named colors
        assert!(parse_color("black").is_ok());
        assert!(parse_color("white").is_ok());
        assert!(parse_color("red").is_ok());
        assert!(parse_color("green").is_ok());
        assert!(parse_color("blue").is_ok());
        assert!(parse_color("yellow").is_ok());
        assert!(parse_color("cyan").is_ok());
        assert!(parse_color("magenta").is_ok());
        assert!(parse_color("gray").is_ok());
        assert!(parse_color("grey").is_ok()); // British spelling
        assert!(parse_color("silver").is_ok());
        assert!(parse_color("maroon").is_ok());
        assert!(parse_color("olive").is_ok());
        assert!(parse_color("lime").is_ok());
        assert!(parse_color("aqua").is_ok());
        assert!(parse_color("teal").is_ok());
        assert!(parse_color("navy").is_ok());
        assert!(parse_color("fuchsia").is_ok());
        assert!(parse_color("purple").is_ok());
        assert!(parse_color("orange").is_ok());
    }

    #[test]
    fn test_parse_hex_with_whitespace() {
        let color = parse_color("  #ff0000  ").unwrap();
        assert_eq!(
            color,
            Color {
                r: 255,
                g: 0,
                b: 0,
                a: 1.0
            }
        );
    }

    #[test]
    fn test_parse_hex_3_digit_edge_cases() {
        // Test #000 (black)
        let color = parse_color("#000").unwrap();
        assert_eq!(
            color,
            Color {
                r: 0,
                g: 0,
                b: 0,
                a: 1.0
            }
        );

        // Test #fff (white)
        let color = parse_color("#fff").unwrap();
        assert_eq!(
            color,
            Color {
                r: 255,
                g: 255,
                b: 255,
                a: 1.0
            }
        );
    }

    #[test]
    fn test_parse_rgba_with_alpha_0() {
        let color = parse_color("rgba(255, 0, 0, 0)").unwrap();
        assert_eq!(color.a, 0.0);
    }

    #[test]
    fn test_parse_rgba_with_alpha_1() {
        let color = parse_color("rgba(255, 0, 0, 1)").unwrap();
        assert_eq!(color.a, 1.0);
    }
}
