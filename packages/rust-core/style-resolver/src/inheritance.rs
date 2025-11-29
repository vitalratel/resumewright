//! CSS style inheritance
//!
//! Implements CSS inheritance rules for text properties.

use layout_types::{BoxStyle, FlexStyle, TextStyle};
use pdf_generator::css_parser::StyleDeclaration;

/// Inherit text-specific styles from parent element
///
/// Creates a new StyleDeclaration with only inherited CSS properties (font, color, text).
/// Non-inherited properties like margin, padding, and layout are set to defaults.
///
/// # CSS Inheritance Rules
///
/// **Inherited properties** (passed from parent to child):
/// - `font-family`, `font-size`, `font-weight`, `font-style`
/// - `color`
/// - `text-align`, `text-decoration`, `text-transform`
/// - `line-height`, `letter-spacing`
///
/// **Non-inherited properties** (NOT passed to children):
/// - `margin`, `padding`, `border`
/// - `width`, `height`, `max-width`, `max-height`
/// - `display`, `flex`, `flex-direction`
/// - `background-color`, `opacity`
///
/// # Arguments
/// * `parent` - Parent element's StyleDeclaration
///
/// # Returns
/// New StyleDeclaration with only inherited properties set
///
/// # Example
/// ```rust
/// use style_resolver::inherit_text_styles;
/// use pdf_generator::css_parser::StyleDeclaration;
/// use layout_types::{TextStyle, BoxStyle, Spacing};
///
/// let mut parent = StyleDeclaration::default();
/// parent.text.font_size = Some(16.0);
/// parent.text.font_weight = Some(layout_types::FontWeight::Bold);
/// parent.text.color = Some(layout_types::Color { r: 0, g: 0, b: 0, a: 1.0 });
/// parent.box_model.margin = Some(Spacing::uniform(10.0)); // NOT inherited
///
/// let inherited = inherit_text_styles(&parent);
/// assert_eq!(inherited.text.font_size, Some(16.0));     // Inherited
/// assert_eq!(inherited.text.font_weight, Some(layout_types::FontWeight::Bold));    // Inherited
/// assert_eq!(inherited.text.color, Some(layout_types::Color { r: 0, g: 0, b: 0, a: 1.0 }));    // Inherited
/// assert!(inherited.box_model.margin.is_none() || inherited.box_model.margin == Some(Spacing::uniform(0.0)));  // NOT inherited
/// ```
pub fn inherit_text_styles(parent: &StyleDeclaration) -> StyleDeclaration {
    StyleDeclaration {
        text: TextStyle {
            // Inherited properties (CSS inheritance)
            font_family: parent.text.font_family.clone(),
            font_size: parent.text.font_size,
            font_weight: parent.text.font_weight,
            font_style: parent.text.font_style,
            color: parent.text.color,
            text_align: parent.text.text_align,
            line_height: parent.text.line_height,
            letter_spacing: parent.text.letter_spacing,
            text_transform: parent.text.text_transform,
            text_decoration: parent.text.text_decoration,
            vertical_align: None,
            white_space: None,
        },
        box_model: BoxStyle::default(),
        // Non-inherited properties default to None/0
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
    }
}

/// Apply inherited properties to a style, keeping explicit properties
///
/// This function merges inherited properties from a parent with explicitly set
/// properties in a child style. Explicit properties always take precedence.
///
/// # Arguments
/// * `child_style` - Child element's explicitly set styles
/// * `parent` - Parent element's StyleDeclaration (for inheritance)
///
/// # Returns
/// Merged StyleDeclaration with inheritance applied
///
/// # Example
/// ```rust
/// use style_resolver::apply_inherited_properties;
/// use pdf_generator::css_parser::StyleDeclaration;
///
/// let mut parent = StyleDeclaration::default();
/// parent.text.font_size = Some(16.0);
/// parent.text.color = Some(layout_types::Color { r: 0, g: 0, b: 0, a: 1.0 });
///
/// let mut child = StyleDeclaration::default();
/// child.text.font_size = Some(14.0); // Explicit - overrides inherited 16.0
/// // child.text.color is None - will inherit from parent
///
/// let result = apply_inherited_properties(child, &parent);
/// assert_eq!(result.text.font_size, Some(14.0));  // Explicit wins
/// assert_eq!(result.text.color, Some(layout_types::Color { r: 0, g: 0, b: 0, a: 1.0 })); // Inherited
/// ```
pub fn apply_inherited_properties(
    child_style: StyleDeclaration,
    parent: &StyleDeclaration,
) -> StyleDeclaration {
    let inherited = inherit_text_styles(parent);

    StyleDeclaration {
        // Use child's explicit values if set, otherwise inherit from parent
        text: TextStyle {
            font_family: child_style.text.font_family.or(inherited.text.font_family),
            font_size: child_style.text.font_size.or(inherited.text.font_size),
            font_weight: child_style.text.font_weight.or(inherited.text.font_weight),
            font_style: child_style.text.font_style.or(inherited.text.font_style),
            color: child_style.text.color.or(inherited.text.color),
            text_align: child_style.text.text_align.or(inherited.text.text_align),
            line_height: child_style.text.line_height.or(inherited.text.line_height),
            letter_spacing: child_style
                .text
                .letter_spacing
                .or(inherited.text.letter_spacing),
            text_transform: child_style
                .text
                .text_transform
                .or(inherited.text.text_transform),
            text_decoration: child_style
                .text
                .text_decoration
                .or(inherited.text.text_decoration),
            vertical_align: child_style.text.vertical_align,
            white_space: child_style.text.white_space,
        },
        // Non-inherited properties come only from child
        box_model: BoxStyle {
            margin: child_style.box_model.margin,
            padding: child_style.box_model.padding,
            border_top: child_style.box_model.border_top,
            border_right: child_style.box_model.border_right,
            border_bottom: child_style.box_model.border_bottom,
            border_left: child_style.box_model.border_left,
            background_color: child_style.box_model.background_color,
            width: child_style.box_model.width,
            height: child_style.box_model.height,
            max_width: child_style.box_model.max_width,
            max_height: child_style.box_model.max_height,
            border_radius: child_style.box_model.border_radius,
            opacity: child_style.box_model.opacity,
        },
        flex: FlexStyle {
            display: child_style.flex.display,
            flex: child_style.flex.flex,
            flex_shrink: child_style.flex.flex_shrink,
            flex_direction: child_style.flex.flex_direction,
            justify_content: child_style.flex.justify_content,
            align_items: child_style.flex.align_items,
            gap: child_style.flex.gap,
            row_gap: child_style.flex.row_gap,
            column_gap: child_style.flex.column_gap,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use layout_types::{Color, FontWeight, Spacing};

    #[test]
    fn test_inherit_text_styles() {
        let mut parent = StyleDeclaration::default();
        parent.text.font_size = Some(16.0);
        parent.text.font_weight = Some(FontWeight::Bold);
        parent.text.color = Some(Color {
            r: 255,
            g: 0,
            b: 0,
            a: 1.0,
        });
        parent.box_model.margin = Some(Spacing::uniform(10.0));
        parent.box_model.padding = Some(Spacing::uniform(5.0));

        let inherited = inherit_text_styles(&parent);

        // Text properties should be inherited
        assert_eq!(inherited.text.font_size, Some(16.0));
        assert_eq!(inherited.text.font_weight, Some(FontWeight::Bold));
        assert_eq!(
            inherited.text.color,
            Some(Color {
                r: 255,
                g: 0,
                b: 0,
                a: 1.0
            })
        );

        // Layout properties should NOT be inherited (but may have defaults)
        // The parent had Some values, but inherited should not copy layout properties
        assert!(
            inherited.box_model.margin.is_none()
                || inherited.box_model.margin == Some(Spacing::uniform(0.0))
        );
        assert!(
            inherited.box_model.padding.is_none()
                || inherited.box_model.padding == Some(Spacing::uniform(0.0))
        );
    }

    #[test]
    fn test_apply_inherited_properties_explicit_wins() {
        let mut parent = StyleDeclaration::default();
        parent.text.font_size = Some(16.0);
        parent.text.color = Some(Color {
            r: 0,
            g: 0,
            b: 0,
            a: 1.0,
        });

        let mut child = StyleDeclaration::default();
        child.text.font_size = Some(14.0); // Explicit

        let result = apply_inherited_properties(child, &parent);
        assert_eq!(result.text.font_size, Some(14.0)); // Explicit wins
        assert_eq!(
            result.text.color,
            Some(Color {
                r: 0,
                g: 0,
                b: 0,
                a: 1.0
            })
        ); // Inherited
    }

    #[test]
    fn test_apply_inherited_properties_all_inherited() {
        let mut parent = StyleDeclaration::default();
        parent.text.font_size = Some(16.0);
        parent.text.font_weight = Some(FontWeight::Bold);
        parent.text.color = Some(Color {
            r: 0,
            g: 0,
            b: 0,
            a: 1.0,
        });

        // Create empty child with defaults (all None)
        let child = StyleDeclaration::new();

        let result = apply_inherited_properties(child, &parent);
        assert_eq!(result.text.font_size, Some(16.0));
        assert_eq!(result.text.font_weight, Some(FontWeight::Bold));
        assert_eq!(
            result.text.color,
            Some(Color {
                r: 0,
                g: 0,
                b: 0,
                a: 1.0
            })
        );
    }
}
