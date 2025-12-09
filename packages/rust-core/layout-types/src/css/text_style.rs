//! Text styling properties

use serde::{Deserialize, Serialize};

use super::{
    FontStyle, FontWeight, TextAlign, TextDecoration, TextTransform, VerticalAlign, WhiteSpace,
};
use crate::primitives::Color;

/// Default font family for PDF rendering
pub const DEFAULT_FONT_FAMILY: &str = "Helvetica";
/// Default font size in PDF points (1rem = 16px × 0.75 = 12pt per W3C standard)
pub const DEFAULT_FONT_SIZE: f64 = 12.0;
/// Default line height ratio (multiplier of font size)
pub const DEFAULT_LINE_HEIGHT_RATIO: f64 = 1.2;

/// Text styling properties
///
/// Groups all text-related CSS properties (fonts, colors, alignment, spacing)
/// for better organization and token efficiency.
///
/// # Example
/// ```
/// use layout_types::{TextStyle, Color};
///
/// let mut text = TextStyle::default();
/// text.font_size = Some(14.0);
/// text.color = Some(Color::rgb(0, 0, 255));
/// ```
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TextStyle {
    pub font_family: Option<String>,
    pub font_size: Option<f64>, // In PDF points
    pub font_weight: Option<FontWeight>,
    pub font_style: Option<FontStyle>,
    pub color: Option<Color>,
    pub text_align: Option<TextAlign>,
    pub text_transform: Option<TextTransform>,
    pub text_decoration: Option<TextDecoration>,
    pub line_height: Option<f64>,
    pub letter_spacing: Option<f64>,
    pub vertical_align: Option<VerticalAlign>,
    pub white_space: Option<WhiteSpace>,
}

impl TextStyle {
    /// Create a new text style with all None values
    pub fn new() -> Self {
        Self {
            font_family: None,
            font_size: None,
            font_weight: None,
            font_style: None,
            color: None,
            text_align: None,
            text_transform: None,
            text_decoration: None,
            line_height: None,
            letter_spacing: None,
            vertical_align: None,
            white_space: None,
        }
    }
}

impl Default for TextStyle {
    fn default() -> Self {
        Self {
            font_family: Some(DEFAULT_FONT_FAMILY.to_string()),
            font_size: Some(DEFAULT_FONT_SIZE),
            font_weight: Some(FontWeight::Normal),
            font_style: Some(FontStyle::Normal),
            color: Some(Color::BLACK),
            text_align: Some(TextAlign::Left),
            text_transform: None,
            text_decoration: None,
            line_height: Some(DEFAULT_FONT_SIZE * DEFAULT_LINE_HEIGHT_RATIO),
            letter_spacing: Some(0.0),
            vertical_align: None,
            white_space: None,
        }
    }
}
