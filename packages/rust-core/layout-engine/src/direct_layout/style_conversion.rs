//! Style conversion from StyleDeclaration to Taffy Style
//!
//! This module handles the conversion of layout-types::StyleDeclaration to
//! Taffy's Style type, which is used for CSS layout calculations.

use layout_types::{AlignItems, Display, FlexDirection, JustifyContent, StyleDeclaration};
use taffy::prelude::*;

/// Block-level container tags that should fill available width by default
const BLOCK_CONTAINER_TAGS: &[&str] = &[
    "div", "section", "article", "header", "footer", "main", "nav", "aside",
];

/// Convert StyleDeclaration to Taffy's Style
///
/// Maps ResumeWright's StyleDeclaration (which combines Tailwind classes and inline styles)
/// to Taffy's Style structure for CSS layout calculations.
///
/// # Arguments
///
/// * `style` - The source StyleDeclaration to convert
/// * `tag` - Optional HTML tag name (used for default width behavior)
///
/// # Returns
///
/// A Taffy Style ready for layout calculations
pub fn convert_style_to_taffy(style: &StyleDeclaration, tag: Option<&str>) -> Style {
    Style {
        // Display mode
        display: convert_display_mode(style.flex.display),

        // Flexbox direction
        flex_direction: convert_flex_direction(style.flex.flex_direction),

        // Flex properties
        flex_grow: style.flex.flex.unwrap_or(0.0) as f32,
        flex_shrink: style.flex.flex_shrink.unwrap_or(1.0) as f32,
        flex_basis: Dimension::auto(),

        // Justify content (main axis alignment)
        justify_content: style.flex.justify_content.and_then(convert_justify_content),

        // Align items (cross axis alignment)
        align_items: style.flex.align_items.and_then(convert_align_items),

        // Sizing
        size: Size {
            width: convert_width(style.box_model.width, tag),
            height: style
                .box_model
                .height
                .map(|h| Dimension::length(h as f32))
                .unwrap_or(Dimension::auto()),
        },

        // Max sizing constraints
        max_size: Size {
            width: style
                .box_model
                .max_width
                .map(|w| Dimension::length(w as f32))
                .unwrap_or(Dimension::auto()),
            height: style
                .box_model
                .max_height
                .map(|h| Dimension::length(h as f32))
                .unwrap_or(Dimension::auto()),
        },

        // Box model - Margin
        margin: style
            .box_model
            .margin
            .map(|m| Rect {
                left: LengthPercentageAuto::length(m.left as f32),
                right: LengthPercentageAuto::length(m.right as f32),
                top: LengthPercentageAuto::length(m.top as f32),
                bottom: LengthPercentageAuto::length(m.bottom as f32),
            })
            .unwrap_or(Rect::zero()),

        // Box model - Padding
        padding: style
            .box_model
            .padding
            .map(|p| Rect {
                left: LengthPercentage::length(p.left as f32),
                right: LengthPercentage::length(p.right as f32),
                top: LengthPercentage::length(p.top as f32),
                bottom: LengthPercentage::length(p.bottom as f32),
            })
            .unwrap_or(Rect::zero()),

        // Box model - Border
        border: Rect {
            left: LengthPercentage::length(
                style
                    .box_model
                    .border_left
                    .as_ref()
                    .map(|b| b.width as f32)
                    .unwrap_or(0.0),
            ),
            right: LengthPercentage::length(
                style
                    .box_model
                    .border_right
                    .as_ref()
                    .map(|b| b.width as f32)
                    .unwrap_or(0.0),
            ),
            top: LengthPercentage::length(
                style
                    .box_model
                    .border_top
                    .as_ref()
                    .map(|b| b.width as f32)
                    .unwrap_or(0.0),
            ),
            bottom: LengthPercentage::length(
                style
                    .box_model
                    .border_bottom
                    .as_ref()
                    .map(|b| b.width as f32)
                    .unwrap_or(0.0),
            ),
        },

        // Gap properties for flexbox/grid layouts
        gap: Size {
            width: LengthPercentage::length(
                style.flex.column_gap.or(style.flex.gap).unwrap_or(0.0) as f32,
            ),
            height: LengthPercentage::length(
                style.flex.row_gap.or(style.flex.gap).unwrap_or(0.0) as f32
            ),
        },

        ..Default::default()
    }
}

/// Convert display mode from StyleDeclaration to Taffy
fn convert_display_mode(display: Option<Display>) -> taffy::Display {
    match display {
        Some(Display::Flex) => taffy::Display::Flex,
        Some(Display::Block) | None => taffy::Display::Block,
        Some(Display::Inline) => taffy::Display::Block, // Treat inline as block for now
        Some(Display::InlineBlock) => taffy::Display::Block,
    }
}

/// Convert flex direction from StyleDeclaration to Taffy
fn convert_flex_direction(flex_direction: Option<FlexDirection>) -> taffy::FlexDirection {
    match flex_direction {
        Some(FlexDirection::Row) => taffy::FlexDirection::Row,
        Some(FlexDirection::Column) => taffy::FlexDirection::Column,
        Some(FlexDirection::RowReverse) => taffy::FlexDirection::RowReverse,
        Some(FlexDirection::ColumnReverse) => taffy::FlexDirection::ColumnReverse,
        None => taffy::FlexDirection::Row, // Default
    }
}

/// Convert justify content from StyleDeclaration to Taffy
fn convert_justify_content(jc: JustifyContent) -> Option<taffy::JustifyContent> {
    Some(match jc {
        JustifyContent::FlexStart => taffy::JustifyContent::FlexStart,
        JustifyContent::FlexEnd => taffy::JustifyContent::FlexEnd,
        JustifyContent::Center => taffy::JustifyContent::Center,
        JustifyContent::SpaceBetween => taffy::JustifyContent::SpaceBetween,
        JustifyContent::SpaceAround => taffy::JustifyContent::SpaceAround,
        JustifyContent::SpaceEvenly => taffy::JustifyContent::SpaceEvenly,
    })
}

/// Convert align items from StyleDeclaration to Taffy
fn convert_align_items(ai: AlignItems) -> Option<taffy::AlignItems> {
    Some(match ai {
        AlignItems::FlexStart => taffy::AlignItems::FlexStart,
        AlignItems::FlexEnd => taffy::AlignItems::FlexEnd,
        AlignItems::Center => taffy::AlignItems::Center,
        AlignItems::Baseline => taffy::AlignItems::Baseline,
        AlignItems::Stretch => taffy::AlignItems::Stretch,
    })
}

/// Convert width with smart defaults for block containers
///
/// Block-level container elements (div, section, etc.) without an explicit width
/// will default to 100% (fill available space). Other elements default to auto.
fn convert_width(width: Option<f64>, tag: Option<&str>) -> Dimension {
    width
        .map(|w| Dimension::length(w as f32))
        .unwrap_or_else(|| {
            // For block-level container elements without explicit width, use 100% to fill available space
            if let Some(tag_name) = tag {
                if BLOCK_CONTAINER_TAGS.contains(&tag_name) {
                    return Dimension::percent(1.0);
                }
            }
            Dimension::auto()
        })
}

#[cfg(test)]
mod tests {
    use super::*;
    use layout_types::Spacing;

    #[test]
    fn test_convert_display_mode_flex() {
        let mut style = StyleDeclaration::default();
        style.flex.display = Some(Display::Flex);

        let taffy_style = convert_style_to_taffy(&style, None);
        assert!(matches!(taffy_style.display, taffy::Display::Flex));
    }

    #[test]
    fn test_convert_display_mode_block() {
        let mut style = StyleDeclaration::default();
        style.flex.display = Some(Display::Block);

        let taffy_style = convert_style_to_taffy(&style, None);
        assert!(matches!(taffy_style.display, taffy::Display::Block));
    }

    #[test]
    fn test_convert_display_mode_default() {
        let style = StyleDeclaration::default();

        let taffy_style = convert_style_to_taffy(&style, None);
        assert!(matches!(taffy_style.display, taffy::Display::Block));
    }

    #[test]
    fn test_convert_flex_direction_row() {
        let mut style = StyleDeclaration::default();
        style.flex.flex_direction = Some(FlexDirection::Row);

        let taffy_style = convert_style_to_taffy(&style, None);
        assert!(matches!(
            taffy_style.flex_direction,
            taffy::FlexDirection::Row
        ));
    }

    #[test]
    fn test_convert_flex_direction_column() {
        let mut style = StyleDeclaration::default();
        style.flex.flex_direction = Some(FlexDirection::Column);

        let taffy_style = convert_style_to_taffy(&style, None);
        assert!(matches!(
            taffy_style.flex_direction,
            taffy::FlexDirection::Column
        ));
    }

    #[test]
    fn test_convert_justify_content_space_between() {
        let mut style = StyleDeclaration::default();
        style.flex.justify_content = Some(JustifyContent::SpaceBetween);

        let taffy_style = convert_style_to_taffy(&style, None);
        assert_eq!(
            taffy_style.justify_content,
            Some(taffy::JustifyContent::SpaceBetween)
        );
    }

    #[test]
    fn test_convert_align_items_center() {
        let mut style = StyleDeclaration::default();
        style.flex.align_items = Some(AlignItems::Center);

        let taffy_style = convert_style_to_taffy(&style, None);
        assert_eq!(taffy_style.align_items, Some(taffy::AlignItems::Center));
    }

    #[test]
    fn test_explicit_width() {
        let mut style = StyleDeclaration::default();
        style.box_model.width = Some(200.0);

        let taffy_style = convert_style_to_taffy(&style, None);
        // Verify width was set (Taffy uses opaque types, so we just check it was set)
        assert_eq!(taffy_style.size.width, Dimension::length(200.0));
    }

    #[test]
    fn test_block_container_default_width() {
        let style = StyleDeclaration::default();

        let taffy_style = convert_style_to_taffy(&style, Some("div"));
        assert_eq!(taffy_style.size.width, Dimension::percent(1.0));
    }

    #[test]
    fn test_non_block_container_default_width() {
        let style = StyleDeclaration::default();

        let taffy_style = convert_style_to_taffy(&style, Some("span"));
        assert_eq!(taffy_style.size.width, Dimension::auto());
    }

    #[test]
    fn test_margin_conversion() {
        let mut style = StyleDeclaration::default();
        style.box_model.margin = Some(Spacing {
            top: 10.0,
            right: 20.0,
            bottom: 30.0,
            left: 40.0,
        });

        let taffy_style = convert_style_to_taffy(&style, None);

        // Check that margin values are correctly converted
        assert_eq!(taffy_style.margin.top, LengthPercentageAuto::length(10.0));
        assert_eq!(taffy_style.margin.right, LengthPercentageAuto::length(20.0));
        assert_eq!(
            taffy_style.margin.bottom,
            LengthPercentageAuto::length(30.0)
        );
        assert_eq!(taffy_style.margin.left, LengthPercentageAuto::length(40.0));
    }

    #[test]
    fn test_padding_conversion() {
        let mut style = StyleDeclaration::default();
        style.box_model.padding = Some(Spacing {
            top: 5.0,
            right: 10.0,
            bottom: 15.0,
            left: 20.0,
        });

        let taffy_style = convert_style_to_taffy(&style, None);

        assert_eq!(taffy_style.padding.top, LengthPercentage::length(5.0));
        assert_eq!(taffy_style.padding.right, LengthPercentage::length(10.0));
        assert_eq!(taffy_style.padding.bottom, LengthPercentage::length(15.0));
        assert_eq!(taffy_style.padding.left, LengthPercentage::length(20.0));
    }

    #[test]
    fn test_max_size_constraints() {
        let mut style = StyleDeclaration::default();
        style.box_model.max_width = Some(500.0);
        style.box_model.max_height = Some(300.0);

        let taffy_style = convert_style_to_taffy(&style, None);

        assert_eq!(taffy_style.max_size.width, Dimension::length(500.0));
        assert_eq!(taffy_style.max_size.height, Dimension::length(300.0));
    }
}
