//! Tailwind CSS class parsing
//!
//! Converts Tailwind utility classes into StyleDeclaration objects.

use pdf_generator::css_parser::StyleDeclaration;
use tailwind_css::TailwindBuilder;

/// Convert Tailwind CSS classes to StyleDeclaration
///
/// Parses Tailwind utility classes and converts them into a StyleDeclaration
/// suitable for PDF generation.
///
/// # Arguments
/// * `class_name` - Space-separated Tailwind utility classes
///
/// # Returns
/// StyleDeclaration with properties derived from Tailwind classes
///
/// # Supported Classes
/// - **Typography**: `text-{size}`, `font-{weight}`, `font-{style}`, `text-{color}`
/// - **Spacing**: `p-{size}`, `m-{size}`, `px-{size}`, `py-{size}`, etc.
/// - **Layout**: `flex`, `block`, `inline`, `grid`
/// - **Flexbox**: `flex-{direction}`, `justify-{content}`, `items-{align}`
/// - **Colors**: `bg-{color}`, `text-{color}`, `border-{color}`
/// - **Borders**: `border`, `border-{width}`, `rounded-{size}`
///
/// # Example
/// ```rust
/// use style_resolver::resolve_tailwind_classes;
///
/// let style = resolve_tailwind_classes("text-lg font-bold text-blue-600 p-4");
///
/// assert_eq!(style.font_size, Some(11.25));
/// assert_eq!(style.font_weight, Some(layout_types::FontWeight::Bold));
/// // ... padding and color properties also set
/// ```
pub fn resolve_tailwind_classes(class_name: &str) -> StyleDeclaration {
    let mut tailwind = TailwindBuilder::default();

    // Parse Tailwind classes to inline CSS
    let mut style = if let Ok((_rest, tailwind_css)) = tailwind.inline(class_name) {
        // Parse the generated CSS into StyleDeclaration
        if let Ok(s) = pdf_generator::css_parser::parse_inline_styles(&tailwind_css) {
            s
        } else {
            StyleDeclaration::default()
        }
    } else {
        StyleDeclaration::default()
    };

    // Apply special handling for classes that don't convert correctly
    handle_special_tailwind_classes(class_name, &mut style);

    style
}

#[cfg(test)]
mod tests {
    use super::*;
    use layout_types::FontWeight;

    #[test]
    fn test_text_size_classes() {
        let style = resolve_tailwind_classes("text-sm");
        assert_eq!(style.text.font_size, Some(8.75));

        let style = resolve_tailwind_classes("text-base");
        assert_eq!(style.text.font_size, Some(10.0));

        let style = resolve_tailwind_classes("text-lg");
        assert_eq!(style.text.font_size, Some(11.25));

        let style = resolve_tailwind_classes("text-xl");
        assert_eq!(style.text.font_size, Some(12.5));
    }

    #[test]
    fn test_font_weight_classes() {
        let style = resolve_tailwind_classes("font-normal");
        assert_eq!(style.text.font_weight, Some(FontWeight::Normal));

        let style = resolve_tailwind_classes("font-bold");
        assert_eq!(style.text.font_weight, Some(FontWeight::Bold));

        let style = resolve_tailwind_classes("font-light");
        assert_eq!(style.text.font_weight, Some(FontWeight::Lighter));
    }

    #[test]
    fn test_multiple_classes() {
        let style = resolve_tailwind_classes("text-lg font-bold");
        assert_eq!(style.text.font_size, Some(11.25));
        assert_eq!(style.text.font_weight, Some(FontWeight::Bold));
    }

    #[test]
    fn test_empty_string() {
        let style = resolve_tailwind_classes("");
        // Returns StyleDeclaration with defaults from pdf_generator
        assert_eq!(style.text.font_size, Some(10.0));
    }

    #[test]
    fn test_border_classes() {
        let style = resolve_tailwind_classes("border-b border-gray-400");
        println!(
            "border-b border-gray-400: {:?}",
            style.box_model.border_bottom
        );
        assert!(
            style.box_model.border_bottom.is_some(),
            "border_bottom should be set"
        );
    }

    #[test]
    fn test_leading_relaxed() {
        let style = resolve_tailwind_classes("leading-relaxed");
        println!("leading-relaxed: line_height={:?}", style.text.line_height);
        assert!(
            style.text.line_height.is_some(),
            "line_height should be set for leading-relaxed"
        );
    }

    #[test]
    fn test_space_y() {
        let style = resolve_tailwind_classes("space-y-3");
        println!(
            "space-y-3: gap={:?}, row_gap={:?}",
            style.flex.gap, style.flex.row_gap
        );
        // space-y translates to gap in Tailwind CSS
    }
}
#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_tailwind_inline_output() {
        use tailwind_css::TailwindBuilder;
        let mut tw = TailwindBuilder::default();

        // Test space-y-3
        if let Ok((_rest, css)) = tw.inline("space-y-3") {
            println!("SPACE-Y-3 CSS OUTPUT: '{}'", css);
        }

        // Test justify-between
        let mut tw2 = TailwindBuilder::default();
        if let Ok((_rest, css)) = tw2.inline("justify-between") {
            println!("JUSTIFY-BETWEEN CSS OUTPUT: '{}'", css);
        }

        // Test leading-relaxed with text-base
        let mut tw3 = TailwindBuilder::default();
        if let Ok((_rest, css)) = tw3.inline("text-base leading-relaxed") {
            println!("TEXT-BASE LEADING-RELAXED CSS OUTPUT: '{}'", css);
        }

        // Test font-semibold
        let mut tw4 = TailwindBuilder::default();
        if let Ok((_rest, css)) = tw4.inline("font-semibold") {
            println!("FONT-SEMIBOLD CSS OUTPUT: '{}'", css);
        }

        // Test font-bold for comparison
        let mut tw5 = TailwindBuilder::default();
        if let Ok((_rest, css)) = tw5.inline("font-bold") {
            println!("FONT-BOLD CSS OUTPUT: '{}'", css);
        }
    }
}

/// Special handling for Tailwind utilities that don't convert correctly
///
/// Some Tailwind classes like space-y/space-x need special handling because
/// they use CSS selectors that can't be represented in inline styles.
fn handle_special_tailwind_classes(class_name: &str, style: &mut StyleDeclaration) {
    use pdf_generator::css_parser::{Display, FlexDirection};

    // Handle space-y-* (converts to gap for flex column layouts)
    if class_name.starts_with("space-y-") {
        if let Some(size_str) = class_name.strip_prefix("space-y-") {
            // Convert tailwind size to points
            let gap_value = match size_str {
                "0" => Some(0.0),
                "1" => Some(3.0),  // 0.25rem * 12 = 3pt
                "2" => Some(6.0),  // 0.5rem * 12 = 6pt
                "3" => Some(9.0),  // 0.75rem * 12 = 9pt
                "4" => Some(12.0), // 1rem * 12 = 12pt
                "5" => Some(15.0), // 1.25rem * 12 = 15pt
                "6" => Some(18.0), // 1.5rem * 12 = 18pt
                "8" => Some(24.0), // 2rem * 12 = 24pt
                _ => None,
            };
            if let Some(gap) = gap_value {
                style.flex.gap = Some(gap);
                style.flex.row_gap = Some(gap);
                // space-y requires flex column layout for gap to work
                if style.flex.display.is_none() {
                    style.flex.display = Some(Display::Flex);
                }
                if style.flex.flex_direction.is_none() {
                    style.flex.flex_direction = Some(FlexDirection::Column);
                }
            }
        }
    }

    // Handle space-x-* (converts to gap for flex row layouts)
    if class_name.starts_with("space-x-") {
        if let Some(size_str) = class_name.strip_prefix("space-x-") {
            let gap_value = match size_str {
                "0" => Some(0.0),
                "1" => Some(3.0),
                "2" => Some(6.0),
                "3" => Some(9.0),
                "4" => Some(12.0),
                "5" => Some(15.0),
                "6" => Some(18.0),
                "8" => Some(24.0),
                _ => None,
            };
            if let Some(gap) = gap_value {
                style.flex.gap = Some(gap);
                style.flex.column_gap = Some(gap);
                // space-x requires flex row layout for gap to work
                if style.flex.display.is_none() {
                    style.flex.display = Some(Display::Flex);
                }
                if style.flex.flex_direction.is_none() {
                    style.flex.flex_direction = Some(FlexDirection::Row);
                }
            }
        }
    }
}
