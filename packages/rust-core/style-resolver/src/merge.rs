//! Style merging utilities
//!
//! Implements CSS cascade rules for merging style declarations.

use layout_types::{BoxStyle, FlexStyle, TextStyle};
use pdf_generator::css_parser::StyleDeclaration;

/// Merge two style declarations with explicit styles taking precedence
///
/// This implements CSS cascade behavior where explicitly set properties override
/// inherited ones. If a property is set in `explicit`, it takes precedence.
/// Otherwise, the `inherited` value is used.
///
/// This function is used to merge inherited styles with Tailwind-derived styles.
///
/// # Arguments
/// * `inherited` - Inherited styles from parent (lower specificity)
/// * `explicit` - Explicitly set styles from Tailwind classes (higher specificity)
///
/// # Returns
/// Merged StyleDeclaration with explicit taking precedence
///
/// # Example
/// ```rust
/// use style_resolver::merge_inherited_styles;
/// use pdf_generator::css_parser::StyleDeclaration;
///
/// let mut inherited = StyleDeclaration::default();
/// inherited.text.font_size = Some(16.0);
/// inherited.text.color = Some(layout_types::Color { r: 0, g: 0, b: 0, a: 1.0 });
///
/// // Create explicit with ONLY font_size set (use pt for PDF points)
/// let explicit = pdf_generator::css_parser::parse_inline_styles("font-size: 18pt").unwrap();
///
/// let merged = merge_inherited_styles(inherited, explicit);
/// assert_eq!(merged.text.font_size, Some(18.0));  // Explicit wins
/// assert_eq!(merged.text.color, Some(layout_types::Color { r: 0, g: 0, b: 0, a: 1.0 })); // Inherited kept
/// ```
pub fn merge_inherited_styles(
    inherited: StyleDeclaration,
    explicit: StyleDeclaration,
) -> StyleDeclaration {
    StyleDeclaration {
        // Use explicit values if set, otherwise inherit
        text: TextStyle {
            font_family: explicit.text.font_family.or(inherited.text.font_family),
            font_size: explicit.text.font_size.or(inherited.text.font_size),
            font_weight: explicit.text.font_weight.or(inherited.text.font_weight),
            font_style: explicit.text.font_style.or(inherited.text.font_style),
            color: explicit.text.color.or(inherited.text.color),
            text_align: explicit.text.text_align.or(inherited.text.text_align),
            line_height: explicit.text.line_height.or(inherited.text.line_height),
            letter_spacing: explicit
                .text
                .letter_spacing
                .or(inherited.text.letter_spacing),
            text_transform: explicit
                .text
                .text_transform
                .or(inherited.text.text_transform),
            text_decoration: explicit
                .text
                .text_decoration
                .or(inherited.text.text_decoration),
            vertical_align: explicit.text.vertical_align,
            white_space: explicit.text.white_space,
        },
        // Layout properties are not inherited
        box_model: BoxStyle {
            margin: explicit.box_model.margin,
            padding: explicit.box_model.padding,
            border_top: explicit.box_model.border_top,
            border_right: explicit.box_model.border_right,
            border_bottom: explicit.box_model.border_bottom,
            border_left: explicit.box_model.border_left,
            background_color: explicit.box_model.background_color,
            width: explicit.box_model.width,
            height: explicit.box_model.height,
            max_width: explicit.box_model.max_width,
            max_height: explicit.box_model.max_height,
            border_radius: explicit.box_model.border_radius,
            opacity: explicit.box_model.opacity,
        },
        flex: FlexStyle {
            display: explicit.flex.display,
            flex: explicit.flex.flex,
            flex_shrink: explicit.flex.flex_shrink,
            flex_direction: explicit.flex.flex_direction,
            justify_content: explicit.flex.justify_content,
            align_items: explicit.flex.align_items,
            gap: explicit.flex.gap,
            row_gap: explicit.flex.row_gap,
            column_gap: explicit.flex.column_gap,
        },
    }
}

/// Merge style declarations with overrides taking precedence
///
/// This function merges a base style with override styles (typically from inline CSS).
/// Any property set in `overrides` will replace the corresponding property in `base`.
///
/// This implements the highest specificity level in the CSS cascade - inline styles
/// override everything else.
///
/// # Arguments
/// * `base` - Base styles (e.g., from Tailwind classes or inheritance)
/// * `overrides` - Override styles (e.g., from inline style attribute)
///
/// # Returns
/// New StyleDeclaration with overrides applied
///
/// # Example
/// ```rust
/// use style_resolver::merge_style_overrides;
/// use pdf_generator::css_parser::StyleDeclaration;
///
/// // This function is used internally - see resolve_element_styles for usage
/// # let base = pdf_generator::css_parser::StyleDeclaration::default();
/// # let overrides = pdf_generator::css_parser::StyleDeclaration::default();
/// # let _merged = merge_style_overrides(base, overrides);
/// ```
pub fn merge_style_overrides(
    mut base: StyleDeclaration,
    overrides: StyleDeclaration,
) -> StyleDeclaration {
    // Override each property if present in overrides
    if overrides.text.color.is_some() {
        base.text.color = overrides.text.color;
    }
    if overrides.text.font_size.is_some() {
        base.text.font_size = overrides.text.font_size;
    }
    if overrides.text.font_weight.is_some() {
        base.text.font_weight = overrides.text.font_weight;
    }
    if overrides.text.font_style.is_some() {
        base.text.font_style = overrides.text.font_style;
    }
    if overrides.text.font_family.is_some() {
        base.text.font_family = overrides.text.font_family;
    }
    if overrides.text.text_decoration.is_some() {
        base.text.text_decoration = overrides.text.text_decoration;
    }
    if overrides.text.text_align.is_some() {
        base.text.text_align = overrides.text.text_align;
    }
    if overrides.text.text_transform.is_some() {
        base.text.text_transform = overrides.text.text_transform;
    }
    if overrides.text.line_height.is_some() {
        base.text.line_height = overrides.text.line_height;
    }
    if overrides.text.letter_spacing.is_some() {
        base.text.letter_spacing = overrides.text.letter_spacing;
    }
    if overrides.box_model.margin.is_some() {
        base.box_model.margin = overrides.box_model.margin;
    }
    if overrides.box_model.padding.is_some() {
        base.box_model.padding = overrides.box_model.padding;
    }
    if overrides.box_model.border_top.is_some() {
        base.box_model.border_top = overrides.box_model.border_top;
    }
    if overrides.box_model.border_right.is_some() {
        base.box_model.border_right = overrides.box_model.border_right;
    }
    if overrides.box_model.border_bottom.is_some() {
        base.box_model.border_bottom = overrides.box_model.border_bottom;
    }
    if overrides.box_model.border_left.is_some() {
        base.box_model.border_left = overrides.box_model.border_left;
    }
    if overrides.box_model.background_color.is_some() {
        base.box_model.background_color = overrides.box_model.background_color;
    }
    if overrides.flex.display.is_some() {
        base.flex.display = overrides.flex.display;
    }
    if overrides.box_model.width.is_some() {
        base.box_model.width = overrides.box_model.width;
    }
    if overrides.box_model.height.is_some() {
        base.box_model.height = overrides.box_model.height;
    }
    if overrides.box_model.max_width.is_some() {
        base.box_model.max_width = overrides.box_model.max_width;
    }
    if overrides.box_model.max_height.is_some() {
        base.box_model.max_height = overrides.box_model.max_height;
    }
    if overrides.text.white_space.is_some() {
        base.text.white_space = overrides.text.white_space;
    }
    if overrides.flex.flex.is_some() {
        base.flex.flex = overrides.flex.flex;
    }
    if overrides.flex.flex_direction.is_some() {
        base.flex.flex_direction = overrides.flex.flex_direction;
    }
    if overrides.flex.justify_content.is_some() {
        base.flex.justify_content = overrides.flex.justify_content;
    }
    if overrides.flex.align_items.is_some() {
        base.flex.align_items = overrides.flex.align_items;
    }
    if overrides.box_model.opacity.is_some() {
        base.box_model.opacity = overrides.box_model.opacity;
    }
    if overrides.box_model.border_radius.is_some() {
        base.box_model.border_radius = overrides.box_model.border_radius;
    }
    if overrides.text.vertical_align.is_some() {
        base.text.vertical_align = overrides.text.vertical_align;
    }
    if overrides.flex.gap.is_some() {
        base.flex.gap = overrides.flex.gap;
    }
    if overrides.flex.row_gap.is_some() {
        base.flex.row_gap = overrides.flex.row_gap;
    }
    if overrides.flex.column_gap.is_some() {
        base.flex.column_gap = overrides.flex.column_gap;
    }

    base
}

#[cfg(test)]
mod tests {
    use super::*;
    use layout_types::{BoxStyle, Color, FlexStyle, FontWeight, Spacing, TextStyle};

    #[test]
    fn test_merge_inherited_styles() {
        let mut inherited = StyleDeclaration::default();
        inherited.text.font_size = Some(16.0);
        inherited.text.color = Some(Color {
            r: 0,
            g: 0,
            b: 0,
            a: 1.0,
        });

        let mut explicit = StyleDeclaration::default();
        explicit.text.font_size = Some(18.0);

        let merged = merge_inherited_styles(inherited, explicit);
        assert_eq!(merged.text.font_size, Some(18.0));
        assert_eq!(
            merged.text.color,
            Some(Color {
                r: 0,
                g: 0,
                b: 0,
                a: 1.0
            })
        );
    }

    #[test]
    fn test_merge_style_overrides() {
        let mut base = StyleDeclaration::default();
        base.text.font_size = Some(18.0);
        base.text.font_weight = Some(FontWeight::Bold);
        base.text.color = Some(Color {
            r: 0,
            g: 0,
            b: 255,
            a: 1.0,
        });

        // Create overrides with ONLY the color set (no defaults)
        let overrides = StyleDeclaration {
            text: TextStyle {
                font_family: None,
                font_size: None,
                font_weight: None,
                font_style: None,
                color: Some(Color {
                    r: 255,
                    g: 0,
                    b: 0,
                    a: 1.0,
                }),
                text_align: None,
                text_transform: None,
                text_decoration: None,
                line_height: None,
                letter_spacing: None,
                vertical_align: None,
                white_space: None,
            },
            box_model: BoxStyle {
                margin: None,
                padding: None,
                width: None,
                height: None,
                max_width: None,
                max_height: None,
                border_top: None,
                border_right: None,
                border_bottom: None,
                border_left: None,
                opacity: None,
                border_radius: None,
                background_color: None,
            },
            flex: FlexStyle {
                display: None,
                flex: None,
                flex_shrink: None,
                flex_direction: None,
                justify_content: None,
                align_items: None,
                gap: None,
                row_gap: None,
                column_gap: None,
            },
        };

        let merged = merge_style_overrides(base, overrides);
        assert_eq!(merged.text.font_size, Some(18.0));
        assert_eq!(merged.text.font_weight, Some(FontWeight::Bold));
        assert_eq!(
            merged.text.color,
            Some(Color {
                r: 255,
                g: 0,
                b: 0,
                a: 1.0
            })
        );
    }

    #[test]
    fn test_merge_all_properties_from_overrides() {
        let mut base = StyleDeclaration::default();
        base.text.font_size = Some(16.0);

        let mut overrides = StyleDeclaration::default();
        overrides.text.font_size = Some(20.0);
        overrides.text.font_weight = Some(FontWeight::Bold);
        overrides.text.color = Some(Color {
            r: 255,
            g: 0,
            b: 0,
            a: 1.0,
        });
        overrides.box_model.margin = Some(Spacing::uniform(10.0));

        let merged = merge_style_overrides(base, overrides);
        assert_eq!(merged.text.font_size, Some(20.0));
        assert_eq!(merged.text.font_weight, Some(FontWeight::Bold));
        assert_eq!(
            merged.text.color,
            Some(Color {
                r: 255,
                g: 0,
                b: 0,
                a: 1.0
            })
        );
        assert_eq!(merged.box_model.margin, Some(Spacing::uniform(10.0)));
    }
}
