//! Tailwind CSS class parsing
//!
//! Converts Tailwind utility classes into StyleDeclaration objects.

use layout_types::Spacing;
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
/// assert_eq!(style.text.font_size, Some(13.5)); // 1.125rem × 12pt
/// assert_eq!(style.text.font_weight, Some(layout_types::FontWeight::Bold));
/// // ... padding and color properties also set
/// ```
pub fn resolve_tailwind_classes(class_name: &str) -> StyleDeclaration {
    // Try parsing all classes together first (most efficient)
    let mut tailwind = TailwindBuilder::default();
    let mut style = if let Ok((_rest, tailwind_css)) = tailwind.inline(class_name) {
        pdf_generator::css_parser::parse_inline_styles(&tailwind_css).unwrap_or_default()
    } else {
        // If full parsing fails, parse classes individually and merge
        // This handles cases where some classes (like border-b) fail but others work
        let mut merged_style = StyleDeclaration::default();
        for class in class_name.split_whitespace() {
            let mut tw = TailwindBuilder::default();
            if let Ok((_rest, css)) = tw.inline(class) {
                if let Ok(parsed) = pdf_generator::css_parser::parse_inline_styles(&css) {
                    // Merge parsed properties into merged_style
                    merge_style_properties(&mut merged_style, &parsed);
                }
            }
        }
        merged_style
    };

    // Apply special handling for classes that don't convert correctly
    handle_special_tailwind_classes(class_name, &mut style);

    style
}

/// Merge non-default properties from source into target
fn merge_style_properties(target: &mut StyleDeclaration, source: &StyleDeclaration) {
    use layout_types::{FontWeight, DEFAULT_FONT_SIZE};

    // Text properties - only merge if different from default
    if source.text.font_size.is_some() && source.text.font_size != Some(DEFAULT_FONT_SIZE) {
        target.text.font_size = source.text.font_size;
    }
    // font_weight: merge if not the default Normal
    if source.text.font_weight.is_some() && source.text.font_weight != Some(FontWeight::Normal) {
        target.text.font_weight = source.text.font_weight;
    }
    if source.text.font_style.is_some() {
        target.text.font_style = source.text.font_style;
    }
    if source.text.line_height.is_some() {
        target.text.line_height = source.text.line_height;
    }
    if source.text.color.is_some() {
        target.text.color = source.text.color;
    }
    if source.text.text_align.is_some() {
        target.text.text_align = source.text.text_align;
    }

    // Flex properties
    if source.flex.display.is_some() {
        target.flex.display = source.flex.display;
    }
    if source.flex.flex_direction.is_some() {
        target.flex.flex_direction = source.flex.flex_direction;
    }
    if source.flex.justify_content.is_some() {
        target.flex.justify_content = source.flex.justify_content;
    }
    if source.flex.align_items.is_some() {
        target.flex.align_items = source.flex.align_items;
    }
    if source.flex.gap.is_some() {
        target.flex.gap = source.flex.gap;
    }
    if source.flex.flex_shrink.is_some() {
        target.flex.flex_shrink = source.flex.flex_shrink;
    }

    // Box model properties
    if source.box_model.padding.is_some() {
        target.box_model.padding = source.box_model.padding;
    }
    if source.box_model.margin.is_some() {
        target.box_model.margin = source.box_model.margin;
    }
    if source.box_model.border_bottom.is_some() {
        target.box_model.border_bottom = source.box_model.border_bottom.clone();
    }
    if source.box_model.background_color.is_some() {
        target.box_model.background_color = source.box_model.background_color;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use layout_types::FontWeight;

    #[test]
    fn test_text_size_classes() {
        let style = resolve_tailwind_classes("text-sm");
        assert_eq!(style.text.font_size, Some(10.5)); // 0.875rem × 12pt

        let style = resolve_tailwind_classes("text-base");
        assert_eq!(style.text.font_size, Some(12.0)); // 1rem × 12pt

        let style = resolve_tailwind_classes("text-lg");
        assert_eq!(style.text.font_size, Some(13.5)); // 1.125rem × 12pt

        let style = resolve_tailwind_classes("text-xl");
        assert_eq!(style.text.font_size, Some(15.0)); // 1.25rem × 12pt
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
        assert_eq!(style.text.font_size, Some(13.5)); // 1.125rem × 12pt
        assert_eq!(style.text.font_weight, Some(FontWeight::Bold));
    }

    #[test]
    fn test_empty_string() {
        let style = resolve_tailwind_classes("");
        // Returns StyleDeclaration with defaults from pdf_generator (1rem = 12pt)
        assert_eq!(style.text.font_size, Some(12.0));
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
    fn test_border_b_2_classes() {
        let style = resolve_tailwind_classes("border-b-2 border-gray-800");
        println!(
            "border-b-2 border-gray-800: {:?}",
            style.box_model.border_bottom
        );
        assert!(
            style.box_model.border_bottom.is_some(),
            "border_bottom should be set for border-b-2"
        );
        if let Some(border) = style.box_model.border_bottom {
            // border-b-2 = 2px, should be ~1.5pt (2px * 0.75)
            println!("  width: {}", border.width);
            assert!(
                border.width > 0.75,
                "border-b-2 should be thicker than border-b (0.75pt)"
            );
        }
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
    fn test_shrink_0() {
        let style = resolve_tailwind_classes("shrink-0");
        assert_eq!(
            style.flex.flex_shrink,
            Some(0.0),
            "shrink-0 should set flex_shrink to 0"
        );
    }

    #[test]
    fn test_shrink() {
        let style = resolve_tailwind_classes("shrink");
        assert_eq!(
            style.flex.flex_shrink,
            Some(1.0),
            "shrink should set flex_shrink to 1"
        );
    }

    #[test]
    fn test_space_y() {
        let style = resolve_tailwind_classes("space-y-3");
        println!(
            "space-y-3: display={:?}, flex_direction={:?}, gap={:?}, row_gap={:?}",
            style.flex.display, style.flex.flex_direction, style.flex.gap, style.flex.row_gap
        );
        // space-y translates to flex column with gap
        use pdf_generator::css_parser::{Display, FlexDirection};
        assert_eq!(
            style.flex.display,
            Some(Display::Flex),
            "space-y should set display:flex"
        );
        assert_eq!(
            style.flex.flex_direction,
            Some(FlexDirection::Column),
            "space-y should set flex-direction:column"
        );
        assert_eq!(style.flex.gap, Some(9.0), "space-y-3 should set gap to 9pt");
    }

    #[test]
    fn test_space_y_in_multi_class_string() {
        // space-y-3 in a multi-class string (not at the start)
        let style = resolve_tailwind_classes("text-sm space-y-3");
        println!(
            "text-sm space-y-3: display={:?}, flex_direction={:?}, gap={:?}, row_gap={:?}",
            style.flex.display, style.flex.flex_direction, style.flex.gap, style.flex.row_gap
        );
        use pdf_generator::css_parser::{Display, FlexDirection};
        assert_eq!(
            style.flex.display,
            Some(Display::Flex),
            "space-y should set display:flex even in multi-class string"
        );
        assert_eq!(
            style.flex.flex_direction,
            Some(FlexDirection::Column),
            "space-y should set flex-direction:column"
        );
        assert_eq!(style.flex.gap, Some(9.0), "space-y-3 should set gap to 9pt");
        assert_eq!(
            style.text.font_size,
            Some(10.5), // 0.875rem × 12pt
            "text-sm should also be parsed"
        );
    }

    #[test]
    fn test_margin_bottom() {
        let style = resolve_tailwind_classes("mb-6");
        println!("mb-6: margin={:?}", style.box_model.margin);
        // mb-6 = 1.5rem * 12 = 18pt for section spacing
        assert!(style.box_model.margin.is_some(), "mb-6 should set margin");
        if let Some(margin) = style.box_model.margin {
            assert!(
                (margin.bottom - 18.0).abs() < 0.1,
                "mb-6 should set margin-bottom = 18pt, got {}",
                margin.bottom
            );
        }
    }

    #[test]
    fn test_h2_full_classname() {
        // Full className from h2 element in CV
        let style = resolve_tailwind_classes(
            "text-xl font-bold mb-3 text-gray-800 border-b border-gray-400",
        );

        println!("Full h2 className resolution:");
        println!("  border_bottom: {:?}", style.box_model.border_bottom);
        println!("  font_weight: {:?}", style.text.font_weight);
        println!("  font_size: {:?}", style.text.font_size);
        println!("  line_height: {:?}", style.text.line_height);
        println!("  margin: {:?}", style.box_model.margin);

        assert!(
            style.box_model.border_bottom.is_some(),
            "Should have border_bottom"
        );
        if let Some(border) = style.box_model.border_bottom {
            assert_eq!(border.width, 0.75);
            assert_eq!(border.color.r, 156);
            assert_eq!(border.color.g, 163);
            assert_eq!(border.color.b, 175);
        }
    }
}
#[cfg(test)]
mod test {
    #[test]
    fn test_tailwind_inline_output() {
        use tailwind_css::TailwindBuilder;
        let mut tw = TailwindBuilder::default();

        // Test text-sm
        if let Ok((_rest, css)) = tw.inline("text-sm") {
            println!("TEXT-SM CSS OUTPUT: '{}'", css);
        }

        // Test space-y-3
        let mut tw_space = TailwindBuilder::default();
        if let Ok((_rest, css)) = tw_space.inline("space-y-3") {
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

        // Test mb-6 margin
        let mut tw6 = TailwindBuilder::default();
        if let Ok((_rest, css)) = tw6.inline("mb-6") {
            println!("MB-6 CSS OUTPUT: '{}'", css);
        } else {
            println!("MB-6 FAILED TO PARSE");
        }

        // Test shrink-0 and related classes
        for class in [
            "shrink-0",
            "shrink",
            "flex-shrink-0",
            "flex-shrink",
            "grow-0",
            "grow",
        ] {
            let mut tw = TailwindBuilder::default();
            match tw.inline(class) {
                Ok((_rest, css)) => println!("{} CSS OUTPUT: '{}'", class, css),
                Err(_) => println!("{} FAILED TO PARSE", class),
            }
        }

        // Test border classes
        for class in [
            "border-b",
            "border-gray-400",
            "border-b border-gray-400",
            "border",
            "text-xl",
            "font-bold",
            "text-xl font-bold",
        ] {
            let mut tw = TailwindBuilder::default();
            match tw.inline(class) {
                Ok((_rest, css)) => println!("{} CSS OUTPUT: '{}'", class, css),
                Err(e) => println!("{} FAILED TO PARSE: {:?}", class, e),
            }
        }
    }
}

/// Special handling for Tailwind utilities that don't convert correctly
///
/// Some Tailwind classes like space-y/space-x need special handling because
/// they use CSS selectors that can't be represented in inline styles.
fn handle_special_tailwind_classes(class_name: &str, style: &mut StyleDeclaration) {
    use layout_types::{BorderLineStyle, BorderStyle, Color};
    use pdf_generator::css_parser::{Display, FlexDirection};

    // Track pending border properties across classes
    // e.g., "border-b border-gray-400" needs to combine width from border-b with color from border-gray-400
    let mut pending_border_width: Option<f64> = None;
    let mut pending_border_color: Option<Color> = None;

    // Parse individual classes from the class string
    for class in class_name.split_whitespace() {
        // Handle border-b (border-bottom with default 1px width)
        // tailwind-css library incorrectly parses this as a color
        if class == "border-b" {
            pending_border_width = Some(0.75); // 1px = 0.75pt
        }

        // Handle border-b-{width} (e.g., border-b-2)
        if class.starts_with("border-b-") {
            if let Some(width_str) = class.strip_prefix("border-b-") {
                let width_pt = match width_str {
                    "0" => Some(0.0),
                    "2" => Some(1.5), // 2px = 1.5pt
                    "4" => Some(3.0), // 4px = 3pt
                    "8" => Some(6.0), // 8px = 6pt
                    _ => None,
                };
                if let Some(w) = width_pt {
                    pending_border_width = Some(w);
                }
            }
        }

        // Handle border-{color}-{shade} (e.g., border-gray-400)
        if class.starts_with("border-") && !class.starts_with("border-b") {
            // Parse color from class name
            let color = parse_tailwind_color(class.strip_prefix("border-").unwrap_or(""));
            if let Some(c) = color {
                pending_border_color = Some(c);
            }
        }
        // Handle space-y-* (converts to gap for flex column layouts)
        if class.starts_with("space-y-") {
            if let Some(size_str) = class.strip_prefix("space-y-") {
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
                    // Override default Block display with Flex
                    style.flex.display = Some(Display::Flex);
                    // Set flex-direction to column if not already set
                    if style.flex.flex_direction.is_none()
                        || style.flex.flex_direction == Some(FlexDirection::Row)
                    {
                        style.flex.flex_direction = Some(FlexDirection::Column);
                    }
                }
            }
        }

        // Handle space-x-* (converts to gap for flex row layouts)
        if class.starts_with("space-x-") {
            if let Some(size_str) = class.strip_prefix("space-x-") {
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
                    // Override default Block display with Flex
                    style.flex.display = Some(Display::Flex);
                    // Set flex-direction to row if not already set (or if column)
                    if style.flex.flex_direction.is_none()
                        || style.flex.flex_direction == Some(FlexDirection::Column)
                    {
                        style.flex.flex_direction = Some(FlexDirection::Row);
                    }
                }
            }
        }

        // Apply scaling to section-level margin classes (mb-5, mb-6, mb-8)
        // Smaller margins (mb-1 to mb-4) stay at standard size for tight within-section spacing
        if class.starts_with("mb-") {
            if let Some(size_str) = class.strip_prefix("mb-") {
                let margin_value = match size_str {
                    // Small margins: standard 12pt/rem, no extra scaling
                    "0" => Some(0.0),
                    "1" => Some(3.0),  // 0.25rem * 12
                    "2" => Some(6.0),  // 0.5rem * 12
                    "3" => Some(9.0),  // 0.75rem * 12
                    "4" => Some(12.0), // 1rem * 12
                    // Section-level margins: standard sizing (no extra scaling)
                    "5" => Some(15.0), // 1.25rem * 12
                    "6" => Some(18.0), // 1.5rem * 12
                    "8" => Some(24.0), // 2rem * 12
                    _ => None,
                };
                if let Some(margin) = margin_value {
                    let mut current = style.box_model.margin.unwrap_or_default();
                    current.bottom = margin;
                    style.box_model.margin = Some(current);
                }
            }
        }

        // Padding classes: p-{size}, px-{size}, py-{size}, pt-{size}, pb-{size}, etc.
        // Standard Tailwind spacing scale: 1 = 0.25rem, 2 = 0.5rem, etc.
        let padding_value = |size_str: &str| -> Option<f64> {
            match size_str {
                "0" => Some(0.0),
                "1" => Some(3.0),   // 0.25rem * 12
                "2" => Some(6.0),   // 0.5rem * 12
                "3" => Some(9.0),   // 0.75rem * 12
                "4" => Some(12.0),  // 1rem * 12
                "5" => Some(15.0),  // 1.25rem * 12
                "6" => Some(18.0),  // 1.5rem * 12
                "8" => Some(24.0),  // 2rem * 12
                "10" => Some(30.0), // 2.5rem * 12
                "12" => Some(36.0), // 3rem * 12
                _ => None,
            }
        };

        if class.starts_with("p-")
            && !class.starts_with("pb-")
            && !class.starts_with("pt-")
            && !class.starts_with("pl-")
            && !class.starts_with("pr-")
            && !class.starts_with("px-")
            && !class.starts_with("py-")
        {
            if let Some(size_str) = class.strip_prefix("p-") {
                if let Some(p) = padding_value(size_str) {
                    style.box_model.padding = Some(Spacing::uniform(p));
                }
            }
        }
        if class.starts_with("px-") {
            if let Some(size_str) = class.strip_prefix("px-") {
                if let Some(p) = padding_value(size_str) {
                    let mut current = style.box_model.padding.unwrap_or_default();
                    current.left = p;
                    current.right = p;
                    style.box_model.padding = Some(current);
                }
            }
        }
        if class.starts_with("py-") {
            if let Some(size_str) = class.strip_prefix("py-") {
                if let Some(p) = padding_value(size_str) {
                    let mut current = style.box_model.padding.unwrap_or_default();
                    current.top = p;
                    current.bottom = p;
                    style.box_model.padding = Some(current);
                }
            }
        }
        if class.starts_with("pt-") {
            if let Some(size_str) = class.strip_prefix("pt-") {
                if let Some(p) = padding_value(size_str) {
                    let mut current = style.box_model.padding.unwrap_or_default();
                    current.top = p;
                    style.box_model.padding = Some(current);
                }
            }
        }
        if class.starts_with("pb-") {
            if let Some(size_str) = class.strip_prefix("pb-") {
                if let Some(p) = padding_value(size_str) {
                    let mut current = style.box_model.padding.unwrap_or_default();
                    current.bottom = p;
                    style.box_model.padding = Some(current);
                }
            }
        }
        if class.starts_with("pl-") {
            if let Some(size_str) = class.strip_prefix("pl-") {
                if let Some(p) = padding_value(size_str) {
                    let mut current = style.box_model.padding.unwrap_or_default();
                    current.left = p;
                    style.box_model.padding = Some(current);
                }
            }
        }
        if class.starts_with("pr-") {
            if let Some(size_str) = class.strip_prefix("pr-") {
                if let Some(p) = padding_value(size_str) {
                    let mut current = style.box_model.padding.unwrap_or_default();
                    current.right = p;
                    style.box_model.padding = Some(current);
                }
            }
        }
    }

    // Apply accumulated border properties after processing all classes
    // This handles cases like "border-b border-gray-400" where width and color come from different classes
    if pending_border_width.is_some() || pending_border_color.is_some() {
        let width = pending_border_width.unwrap_or(0.75); // Default to 1px
        let color = pending_border_color.unwrap_or(Color {
            r: 0,
            g: 0,
            b: 0,
            a: 1.0,
        }); // Default to black

        style.box_model.border_bottom = Some(BorderStyle {
            width,
            color,
            style: BorderLineStyle::Solid,
        });
    }
}

/// Parse Tailwind color classes like "gray-400", "blue-600", etc.
fn parse_tailwind_color(color_class: &str) -> Option<layout_types::Color> {
    use layout_types::Color;

    // Format: {color}-{shade}
    let parts: Vec<&str> = color_class.split('-').collect();
    if parts.len() != 2 {
        return None;
    }

    let color_name = parts[0];
    let shade: u32 = parts[1].parse().ok()?;

    // Tailwind color palette (common colors used in CVs)
    // Values from https://tailwindcss.com/docs/customizing-colors
    match (color_name, shade) {
        // Gray
        ("gray", 50) => Some(Color::rgb(249, 250, 251)),
        ("gray", 100) => Some(Color::rgb(243, 244, 246)),
        ("gray", 200) => Some(Color::rgb(229, 231, 235)),
        ("gray", 300) => Some(Color::rgb(209, 213, 219)),
        ("gray", 400) => Some(Color::rgb(156, 163, 175)),
        ("gray", 500) => Some(Color::rgb(107, 114, 128)),
        ("gray", 600) => Some(Color::rgb(75, 85, 99)),
        ("gray", 700) => Some(Color::rgb(55, 65, 81)),
        ("gray", 800) => Some(Color::rgb(31, 41, 55)),
        ("gray", 900) => Some(Color::rgb(17, 24, 39)),
        // Blue
        ("blue", 400) => Some(Color::rgb(96, 165, 250)),
        ("blue", 500) => Some(Color::rgb(59, 130, 246)),
        ("blue", 600) => Some(Color::rgb(37, 99, 235)),
        ("blue", 700) => Some(Color::rgb(29, 78, 216)),
        // Red
        ("red", 400) => Some(Color::rgb(248, 113, 113)),
        ("red", 500) => Some(Color::rgb(239, 68, 68)),
        ("red", 600) => Some(Color::rgb(220, 38, 38)),
        // Green
        ("green", 400) => Some(Color::rgb(74, 222, 128)),
        ("green", 500) => Some(Color::rgb(34, 197, 94)),
        ("green", 600) => Some(Color::rgb(22, 163, 74)),
        // Black/White
        ("black", _) => Some(Color::BLACK),
        ("white", _) => Some(Color::WHITE),
        _ => None,
    }
}
