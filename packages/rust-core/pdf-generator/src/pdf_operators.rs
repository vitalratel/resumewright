//! PDF operator builders for rendering visual elements
//!
//! This module provides low-level functions that generate PDF content stream
//! operators for rendering backgrounds, borders, decorations, and list bullets.
//! Each function appends PDF commands to a mutable string buffer.

use crate::content_builder::ContentBuilder;
use crate::css_parser::{BorderLineStyle, BorderStyle, Color};
use crate::error::PDFError;
use layout_types::{LayoutBox, TextDecoration};

// PDF Rendering Constants

/// Border and decoration line width in points
const DEFAULT_LINE_WIDTH: f64 = 0.5;

/// Underline vertical offset ratio (relative to font size)
/// Positions underline below the text baseline
const UNDERLINE_OFFSET_RATIO: f64 = 0.1;

/// Strikethrough vertical offset ratio (relative to font size)
/// Positions strikethrough line through the middle of text
const STRIKETHROUGH_OFFSET_RATIO: f64 = 0.3;

/// Bézier curve control point constant for circle approximation (kappa)
/// Mathematical constant for approximating a circle with 4 cubic Bézier curves
/// Derivation: 4/3 * tan(π/8) ≈ 0.5522847498
const BEZIER_CIRCLE_KAPPA: f64 = 0.5522847498;

/// Horizontal offset for list bullets in points (distance to the left of list item)
const BULLET_OFFSET_POINTS: f64 = 8.0;

/// Line height ratio threshold for applying leading corrections
/// Values > 1.3 indicate significant line-height that needs adjustment
const LINE_HEIGHT_ADJUSTMENT_THRESHOLD: f64 = 1.3;

/// Leading correction factor to improve vertical text positioning accuracy
/// Applied as 95% of calculated leading to account for font metrics variations
const LEADING_CORRECTION_FACTOR: f64 = 0.95;

/// Render background rectangle
///
/// Appends PDF operators to draw a filled rectangle with the specified color.
///
/// # Arguments
///
/// * `layout_box` - The box defining position and dimensions
/// * `color` - Fill color for the background
/// * `page_height` - Height of the page (for coordinate conversion)
/// * `content` - Mutable string buffer to append PDF operators to
pub fn render_background<C: ContentBuilder>(
    layout_box: &LayoutBox,
    color: Color,
    page_height: f64,
    content: &mut C,
) -> Result<(), PDFError> {
    // Convert coordinates
    let pdf_y = page_height - layout_box.y - layout_box.height;

    // Set fill color using ContentBuilder
    content.set_fill_color_rgb(
        color.r as f64 / 255.0,
        color.g as f64 / 255.0,
        color.b as f64 / 255.0,
    );

    // Draw filled rectangle
    content.rectangle(layout_box.x, pdf_y, layout_box.width, layout_box.height);
    content.fill();

    Ok(())
}

/// Render border bottom line
///
/// Appends PDF operators to draw a border line at the bottom of a box.
/// Supports solid, dashed, and dotted line styles.
///
/// # Arguments
///
/// * `layout_box` - The box defining position and dimensions
/// * `border` - Border style specification (width, style, color)
/// * `page_height` - Height of the page (for coordinate conversion)
/// * `content` - Mutable string buffer to append PDF operators to
pub fn render_border_bottom<C: ContentBuilder>(
    layout_box: &LayoutBox,
    border: &BorderStyle,
    page_height: f64,
    content: &mut C,
) -> Result<(), PDFError> {
    // Skip if border style is None
    if matches!(border.style, BorderLineStyle::None) {
        return Ok(());
    }

    // Convert coordinates (border is at the bottom of the box)
    let pdf_y = page_height - layout_box.y - layout_box.height;
    let x_start = layout_box.x;
    let x_end = layout_box.x + layout_box.width;

    // Set stroke color using ContentBuilder
    content.set_stroke_color_rgb(
        border.color.r as f64 / 255.0,
        border.color.g as f64 / 255.0,
        border.color.b as f64 / 255.0,
    );

    // Set line width with scaling to maintain visual distinction
    // border-b (1px) = 0.75pt → scale to ~1pt for visibility
    // border-b-2 (2px) = 1.5pt → scale to ~2.5pt for clear distinction
    let effective_width = if border.width <= 1.0 {
        (border.width * 1.33).max(1.0)
    } else {
        // Thicker borders: scale up to maintain distinction from thin borders
        border.width * 1.67
    };
    content.set_line_width(effective_width);

    // Set line dash pattern based on style
    match border.style {
        BorderLineStyle::Dashed => content.set_dash_pattern("[3 2]", 0), // 3 on, 2 off
        BorderLineStyle::Dotted => content.set_dash_pattern("[1 1]", 0), // 1 on, 1 off
        BorderLineStyle::Solid | BorderLineStyle::None => content.set_dash_pattern("[]", 0), // Solid line
    }

    // Draw line using ContentBuilder
    content.move_to(x_start, pdf_y);
    content.line_to(x_end, pdf_y);
    content.stroke();

    Ok(())
}

/// Render text decoration (underline, strikethrough)
///
/// Appends PDF operators to draw text decoration lines.
/// Supports underline, strikethrough, and combined decorations.
///
/// # Arguments
///
/// * `decoration` - Type of decoration to render
/// * `x` - Starting x coordinate
/// * `y` - Baseline y coordinate
/// * `width` - Width of the text to decorate
/// * `font_size` - Font size (used for positioning calculations)
/// * `color` - Color for the decoration lines
/// * `content` - Mutable string buffer to append PDF operators to
pub fn render_text_decoration<C: ContentBuilder>(
    decoration: TextDecoration,
    x: f64,
    y: f64,
    width: f64,
    font_size: f64,
    color: &Color,
    content: &mut C,
) -> Result<(), PDFError> {
    let line_width = DEFAULT_LINE_WIDTH;

    // Set stroke color using ContentBuilder
    content.set_stroke_color_rgb(
        color.r as f64 / 255.0,
        color.g as f64 / 255.0,
        color.b as f64 / 255.0,
    );

    // Set line width
    content.set_line_width(line_width);

    // Render underline
    if matches!(
        decoration,
        TextDecoration::Underline | TextDecoration::UnderlineStrikethrough
    ) {
        let underline_y = y - font_size * UNDERLINE_OFFSET_RATIO;
        content.move_to(x, underline_y);
        content.line_to(x + width, underline_y);
        content.stroke();
    }

    // Render strikethrough
    if matches!(
        decoration,
        TextDecoration::Strikethrough | TextDecoration::UnderlineStrikethrough
    ) {
        let strike_y = y + font_size * STRIKETHROUGH_OFFSET_RATIO;
        content.move_to(x, strike_y);
        content.line_to(x + width, strike_y);
        content.stroke();
    }

    Ok(())
}

/// Render bullet point for list items
///
/// Appends PDF operators to draw a filled circle bullet to the left of a list item.
/// The bullet position and size are calculated based on font size and line height.
///
/// # Arguments
///
/// * `layout_box` - The list item box defining position and style
/// * `page_height` - Height of the page (for coordinate conversion)
/// * `content` - Mutable string buffer to append PDF operators to
pub fn render_list_bullet<C: ContentBuilder>(
    layout_box: &LayoutBox,
    page_height: f64,
    content: &mut C,
) -> Result<(), PDFError> {
    let style = &layout_box.style;

    // Get font size, line-height and color
    let font_size = style.text.font_size.unwrap_or(10.0);
    let line_height = style.text.line_height.unwrap_or(font_size * 1.2);
    let color = style.text.color.unwrap_or(Color {
        r: 0,
        g: 0,
        b: 0,
        a: 1.0,
    });

    // Calculate leading for proper vertical positioning (match text rendering logic)
    let line_height_ratio = line_height / font_size;
    let leading = if line_height_ratio > LINE_HEIGHT_ADJUSTMENT_THRESHOLD {
        ((line_height - font_size) / 2.0) * LEADING_CORRECTION_FACTOR
    } else {
        0.0
    };

    // Calculate bullet position (to the left of the list item)
    let bullet_x = layout_box.x - BULLET_OFFSET_POINTS;
    let bullet_y = page_height - layout_box.y - leading - font_size;

    // Set fill color using ContentBuilder
    content.set_fill_color_rgb(
        color.r as f64 / 255.0,
        color.g as f64 / 255.0,
        color.b as f64 / 255.0,
    );

    // Render bullet as a filled circle
    let bullet_radius = font_size * 0.15;
    let bullet_center_y = bullet_y + font_size * 0.4;

    // Draw filled circle using Bézier curves and ContentBuilder
    // PDF doesn't have a direct circle command, so we approximate with 4 Bézier curves
    let k_r = BEZIER_CIRCLE_KAPPA * bullet_radius;

    content.move_to(bullet_x + bullet_radius, bullet_center_y);
    content.curve_to(
        bullet_x + bullet_radius,
        bullet_center_y + k_r,
        bullet_x + k_r,
        bullet_center_y + bullet_radius,
        bullet_x,
        bullet_center_y + bullet_radius,
    );
    content.curve_to(
        bullet_x - k_r,
        bullet_center_y + bullet_radius,
        bullet_x - bullet_radius,
        bullet_center_y + k_r,
        bullet_x - bullet_radius,
        bullet_center_y,
    );
    content.curve_to(
        bullet_x - bullet_radius,
        bullet_center_y - k_r,
        bullet_x - k_r,
        bullet_center_y - bullet_radius,
        bullet_x,
        bullet_center_y - bullet_radius,
    );
    content.curve_to(
        bullet_x + k_r,
        bullet_center_y - bullet_radius,
        bullet_x + bullet_radius,
        bullet_center_y - k_r,
        bullet_x + bullet_radius,
        bullet_center_y,
    );
    content.fill();

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::css_parser::StyleDeclaration;
    use layout_types::BoxContent;

    #[test]
    fn test_render_background() {
        let layout_box = LayoutBox {
            x: 50.0,
            y: 100.0,
            width: 200.0,
            height: 50.0,
            content: BoxContent::Container(vec![]),
            style: StyleDeclaration::default(),
            element_type: None,
        };

        let mut content = String::new();
        let color = Color {
            r: 255,
            g: 255,
            b: 0,
            a: 1.0,
        }; // Yellow
        let page_height = 792.0;

        let result = render_background(&layout_box, color, page_height, &mut content);

        assert!(result.is_ok());
        // Should contain fill color (1 1 0 rg for yellow)
        assert!(content.contains("1 1 0 rg"));
        // Should contain rectangle and fill commands
        let pdf_y = page_height - layout_box.y - layout_box.height;
        assert!(content.contains(&format!(
            "{} {} {} {} re",
            layout_box.x, pdf_y, layout_box.width, layout_box.height
        )));
        assert!(content.contains("f\n"));
    }

    #[test]
    fn test_render_background_with_gray() {
        let layout_box = LayoutBox {
            x: 0.0,
            y: 0.0,
            width: 100.0,
            height: 100.0,
            content: BoxContent::Container(vec![]),
            style: StyleDeclaration::default(),
            element_type: None,
        };

        let mut content = String::new();
        let color = Color {
            r: 200,
            g: 200,
            b: 200,
            a: 1.0,
        };

        let result = render_background(&layout_box, color, 792.0, &mut content);

        assert!(result.is_ok());
        // Should convert RGB to 0-1 range and contain fill color command
        assert!(content.contains(" rg\n"));
        // Should contain rectangle and fill commands
        assert!(content.contains(" re\n"));
        assert!(content.contains("f\n"));
    }

    #[test]
    fn test_render_border_bottom_solid() {
        let layout_box = LayoutBox {
            x: 100.0,
            y: 200.0,
            width: 300.0,
            height: 50.0,
            content: BoxContent::Container(vec![]),
            style: StyleDeclaration::default(),
            element_type: None,
        };

        let border = BorderStyle {
            width: 2.0,
            style: BorderLineStyle::Solid,
            color: Color {
                r: 0,
                g: 0,
                b: 0,
                a: 1.0,
            },
        };

        let mut content = String::new();
        let page_height = 792.0;

        let result = render_border_bottom(&layout_box, &border, page_height, &mut content);

        assert!(result.is_ok());
        // Should contain stroke color
        assert!(content.contains("0 0 0 RG"));
        // Should contain line width (2.0 * 1.67 = 3.34)
        assert!(content.contains("3.34 w"));
        // Should contain solid dash pattern (empty array)
        assert!(content.contains("[] 0 d"));
        // Should contain line from x_start to x_end
        let pdf_y = page_height - layout_box.y - layout_box.height;
        assert!(content.contains(&format!("{} {} m", layout_box.x, pdf_y)));
        assert!(content.contains(&format!("{} {} l", layout_box.x + layout_box.width, pdf_y)));
        // Should stroke the line
        assert!(content.contains("S\n"));
    }

    #[test]
    fn test_render_border_bottom_dashed() {
        let layout_box = LayoutBox {
            x: 50.0,
            y: 100.0,
            width: 200.0,
            height: 30.0,
            content: BoxContent::Container(vec![]),
            style: StyleDeclaration::default(),
            element_type: None,
        };

        let border = BorderStyle {
            width: 1.5,
            style: BorderLineStyle::Dashed,
            color: Color {
                r: 128,
                g: 128,
                b: 128,
                a: 1.0,
            },
        };

        let mut content = String::new();
        let result = render_border_bottom(&layout_box, &border, 792.0, &mut content);

        assert!(result.is_ok());
        // Should contain dashed pattern [3 2] 0 d
        assert!(content.contains("[3 2] 0 d"));
        // Should contain scaled line width (1.5 * 1.67 = 2.505)
        assert!(content.contains("2.505 w"));
    }

    #[test]
    fn test_render_border_bottom_dotted() {
        let layout_box = LayoutBox {
            x: 25.0,
            y: 75.0,
            width: 150.0,
            height: 20.0,
            content: BoxContent::Container(vec![]),
            style: StyleDeclaration::default(),
            element_type: None,
        };

        let border = BorderStyle {
            width: 1.0,
            style: BorderLineStyle::Dotted,
            color: Color {
                r: 255,
                g: 0,
                b: 0,
                a: 1.0,
            },
        };

        let mut content = String::new();
        let result = render_border_bottom(&layout_box, &border, 792.0, &mut content);

        assert!(result.is_ok());
        // Should contain dotted pattern [1 1] 0 d
        assert!(content.contains("[1 1] 0 d"));
        // Should contain red color
        assert!(content.contains("1 0 0 RG"));
    }

    #[test]
    fn test_render_border_bottom_none() {
        let layout_box = LayoutBox {
            x: 0.0,
            y: 0.0,
            width: 100.0,
            height: 100.0,
            content: BoxContent::Container(vec![]),
            style: StyleDeclaration::default(),
            element_type: None,
        };

        let border = BorderStyle {
            width: 1.0,
            style: BorderLineStyle::None,
            color: Color {
                r: 0,
                g: 0,
                b: 0,
                a: 1.0,
            },
        };

        let mut content = String::new();
        let result = render_border_bottom(&layout_box, &border, 792.0, &mut content);

        assert!(result.is_ok());
        // Should not add any content for BorderLineStyle::None
        assert!(content.is_empty());
    }

    #[test]
    fn test_render_text_decoration_underline() {
        let mut content = String::new();
        let color = Color {
            r: 0,
            g: 0,
            b: 0,
            a: 1.0,
        };

        let result = render_text_decoration(
            TextDecoration::Underline,
            10.0,  // x
            100.0, // y
            50.0,  // width
            12.0,  // font_size
            &color,
            &mut content,
        );

        assert!(result.is_ok());
        // Should contain stroke color (0 0 0 RG for black)
        assert!(content.contains("0 0 0 RG"));
        // Should contain line width
        assert!(content.contains("0.5 w"));
        // Should contain underline positioning (y - font_size * UNDERLINE_OFFSET_RATIO)
        let underline_y = 100.0 - 12.0 * 0.1;
        assert!(content.contains(&format!("{} {} m", 10.0, underline_y)));
        // Should contain line ending
        assert!(content.contains(&format!("{} {} l", 60.0, underline_y)));
        // Should stroke the line
        assert!(content.contains("S\n"));
    }

    #[test]
    fn test_render_text_decoration_strikethrough() {
        let mut content = String::new();
        let color = Color {
            r: 128,
            g: 0,
            b: 0,
            a: 1.0,
        };

        let result = render_text_decoration(
            TextDecoration::Strikethrough,
            20.0,
            200.0,
            80.0,
            14.0,
            &color,
            &mut content,
        );

        assert!(result.is_ok());
        // Should contain stroke color (red)
        assert!(content.contains("RG"));
        // Should contain strikethrough positioning (y + font_size * STRIKETHROUGH_OFFSET_RATIO)
        let strike_y = 200.0 + 14.0 * 0.3;
        assert!(content.contains(&format!("{} {} m", 20.0, strike_y)));
        assert!(content.contains(&format!("{} {} l", 100.0, strike_y)));
    }

    #[test]
    fn test_render_text_decoration_underline_strikethrough() {
        let mut content = String::new();
        let color = Color {
            r: 0,
            g: 0,
            b: 255,
            a: 1.0,
        };

        let result = render_text_decoration(
            TextDecoration::UnderlineStrikethrough,
            15.0,
            150.0,
            60.0,
            10.0,
            &color,
            &mut content,
        );

        assert!(result.is_ok());
        // Should contain both underline and strikethrough
        let underline_y = 150.0 - 10.0 * 0.1;
        let strike_y = 150.0 + 10.0 * 0.3;
        assert!(content.contains(&format!("{} {} m", 15.0, underline_y)));
        assert!(content.contains(&format!("{} {} m", 15.0, strike_y)));
        // Should have 2 stroke commands (one for each line)
        assert_eq!(content.matches("S\n").count(), 2);
    }

    #[test]
    fn test_render_list_bullet() {
        let mut style = StyleDeclaration::default();
        style.text.font_size = Some(12.0);
        style.text.line_height = Some(16.0);
        style.text.color = Some(Color {
            r: 0,
            g: 0,
            b: 0,
            a: 1.0,
        });

        let mut layout_box = LayoutBox {
            x: 50.0,
            y: 100.0,
            width: 200.0,
            height: 20.0,
            content: BoxContent::Text(vec!["List item".to_string()]),
            style,
            element_type: None,
        };
        layout_box.element_type = Some(layout_types::ElementType::ListItem);

        let mut content = String::new();
        let page_height = 792.0;

        let result = render_list_bullet(&layout_box, page_height, &mut content);

        assert!(result.is_ok());
        // Should contain fill color
        assert!(content.contains("0 0 0 rg"));
        // Should contain Bézier curve commands for circle (4 curves)
        assert_eq!(content.matches(" c\n").count(), 4);
        // Should contain fill command
        assert!(content.contains("f\n"));
        // Should contain move command to start circle
        assert!(content.contains(" m\n"));
    }

    #[test]
    fn test_render_list_bullet_with_large_line_height() {
        let mut style = StyleDeclaration::default();
        style.text.font_size = Some(10.0);
        style.text.line_height = Some(20.0); // line_height_ratio = 2.0 > 1.3
        style.text.color = Some(Color {
            r: 50,
            g: 50,
            b: 50,
            a: 1.0,
        });
        let mut layout_box = LayoutBox {
            x: 30.0,
            y: 50.0,
            width: 150.0,
            height: 30.0,
            content: BoxContent::Text(vec!["Item".to_string()]),
            style,
            element_type: None,
        };
        layout_box.element_type = Some(layout_types::ElementType::ListItem);

        let mut content = String::new();
        let result = render_list_bullet(&layout_box, 792.0, &mut content);

        assert!(result.is_ok());
        // Should apply leading correction for large line-height
        // This tests the LINE_HEIGHT_ADJUSTMENT_THRESHOLD path
        assert!(content.contains(" c\n")); // Should still render Bézier curves
    }
}
