//! Text utilities for PDF rendering
//!
//! This module provides utilities for text processing including transformation
//! and alignment calculations.

use crate::css_parser::{StyleDeclaration, TextAlign, TextTransform};
use std::borrow::Cow;

/// Apply text transformation (uppercase, lowercase, capitalize)
///
/// Returns a `Cow<str>` to avoid unnecessary allocations when no transform is applied.
///
/// # Arguments
///
/// * `text` - The text to transform
/// * `style` - The style declaration containing the text transform property
///
/// # Returns
///
/// A `Cow<str>` containing the transformed text (borrowed if no transform, owned if transformed)
pub fn apply_text_transform<'a>(text: &'a str, style: &StyleDeclaration) -> Cow<'a, str> {
    match style.text.text_transform {
        Some(TextTransform::Uppercase) => Cow::Owned(text.to_uppercase()),
        Some(TextTransform::Lowercase) => Cow::Owned(text.to_lowercase()),
        Some(TextTransform::Capitalize) => {
            // Capitalize first letter of each word
            let capitalized = text
                .split_whitespace()
                .map(|word| {
                    let mut chars = word.chars();
                    match chars.next() {
                        None => String::new(),
                        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                    }
                })
                .collect::<Vec<String>>()
                .join(" ");
            Cow::Owned(capitalized)
        }
        Some(TextTransform::None) | None => Cow::Borrowed(text),
    }
}

/// Calculate x offset for text alignment
///
/// # Arguments
///
/// * `style` - The style declaration containing text alignment
/// * `available_width` - The available width for the text
/// * `text_width` - The actual width of the text
///
/// # Returns
///
/// The x-offset to apply for proper alignment
pub fn calculate_text_alignment_offset(
    style: &StyleDeclaration,
    available_width: f64,
    text_width: f64,
) -> f64 {
    match style.text.text_align {
        Some(TextAlign::Center) => (available_width - text_width) / 2.0,
        Some(TextAlign::Right) => available_width - text_width,
        Some(TextAlign::Left) | None => 0.0,
        Some(TextAlign::Justify) => 0.0, // Not implemented for MVP
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_apply_text_transform_uppercase() {
        let mut style = StyleDeclaration::default();
        style.text.text_transform = Some(TextTransform::Uppercase);

        let result = apply_text_transform("hello world", &style);
        assert_eq!(result, "HELLO WORLD");
    }

    #[test]
    fn test_apply_text_transform_lowercase() {
        let mut style = StyleDeclaration::default();
        style.text.text_transform = Some(TextTransform::Lowercase);

        let result = apply_text_transform("Hello WORLD", &style);
        assert_eq!(result, "hello world");
    }

    #[test]
    fn test_apply_text_transform_capitalize() {
        let mut style = StyleDeclaration::default();
        style.text.text_transform = Some(TextTransform::Capitalize);

        let result = apply_text_transform("hello world test", &style);
        assert_eq!(result, "Hello World Test");
    }

    #[test]
    fn test_apply_text_transform_capitalize_single_word() {
        let mut style = StyleDeclaration::default();
        style.text.text_transform = Some(TextTransform::Capitalize);

        let result = apply_text_transform("hello", &style);
        assert_eq!(result, "Hello");
    }

    #[test]
    fn test_apply_text_transform_none() {
        let mut style = StyleDeclaration::default();
        style.text.text_transform = Some(TextTransform::None);

        let result = apply_text_transform("Hello World", &style);
        assert_eq!(result, "Hello World");
    }

    #[test]
    fn test_apply_text_transform_default() {
        let style = StyleDeclaration::default();

        let result = apply_text_transform("Hello World", &style);
        assert_eq!(result, "Hello World");
    }

    #[test]
    fn test_calculate_text_alignment_offset_left() {
        let mut style = StyleDeclaration::default();
        style.text.text_align = Some(TextAlign::Left);

        let offset = calculate_text_alignment_offset(&style, 200.0, 100.0);
        assert_eq!(offset, 0.0);
    }

    #[test]
    fn test_calculate_text_alignment_offset_center() {
        let mut style = StyleDeclaration::default();
        style.text.text_align = Some(TextAlign::Center);

        let offset = calculate_text_alignment_offset(&style, 200.0, 100.0);
        assert_eq!(offset, 50.0); // (200 - 100) / 2
    }

    #[test]
    fn test_calculate_text_alignment_offset_right() {
        let mut style = StyleDeclaration::default();
        style.text.text_align = Some(TextAlign::Right);

        let offset = calculate_text_alignment_offset(&style, 300.0, 150.0);
        assert_eq!(offset, 150.0); // 300 - 150
    }

    #[test]
    fn test_calculate_text_alignment_offset_none() {
        let style = StyleDeclaration::default();

        let offset = calculate_text_alignment_offset(&style, 200.0, 100.0);
        assert_eq!(offset, 0.0); // Defaults to left
    }

    #[test]
    fn test_calculate_text_alignment_offset_justify() {
        let mut style = StyleDeclaration::default();
        style.text.text_align = Some(TextAlign::Justify);

        let offset = calculate_text_alignment_offset(&style, 200.0, 100.0);
        assert_eq!(offset, 0.0); // Justify not implemented, defaults to left
    }
}
