//! Layout rendering module for converting layout structures to PDF content
//!
//! This module provides functions to render positioned layout boxes into PDF
//! content streams with proper text, colors, and styling.

use crate::content_builder::ContentBuilder;
use crate::css_parser::{Color, StyleDeclaration};
use crate::encoding::encode_as_cidfont_hex;
use crate::error::PDFError;
use crate::font_resolver::get_font_name;
use crate::fonts::estimate_text_width;
use crate::layout_analyzer::estimate_content_size;
use crate::pdf_operators::{
    render_background, render_border_bottom, render_list_bullet, render_text_decoration,
};
use crate::text_utils::{apply_text_transform, calculate_text_alignment_offset};

// Import shared layout types from layout-types crate
pub use layout_types::{BoxContent, ElementType, LayoutBox, LayoutStructure, Page};
use layout_types::{FontStyle, FontWeight, TextDecoration, TextLine};
use layout_types::{DEFAULT_FONT_SIZE, DEFAULT_LINE_HEIGHT_RATIO};

// Re-export extracted functions for backward compatibility
pub use crate::layout_analyzer::extract_all_text_from_layout;

// PDF Rendering Constants
// These constants define physical measurements and rendering parameters

/// Default page margin from bottom edge in points (0.5 inches at 72pt/inch)
const DEFAULT_PAGE_MARGIN: f64 = 36.0;

/// Line height ratio threshold for applying leading corrections
/// Values > 1.3 indicate significant line-height that needs adjustment
const LINE_HEIGHT_ADJUSTMENT_THRESHOLD: f64 = 1.3;

/// Leading correction factor to improve vertical text positioning accuracy
/// Applied as 95% of calculated leading to account for font metrics variations
const LEADING_CORRECTION_FACTOR: f64 = 0.95;

/// Page number text color (RGB components, 0.3 = 70% gray)
const PAGE_NUMBER_GRAY: f64 = 0.3;

/// Render layout structure to PDF content stream
///
/// For multi-page layouts, this renders the first page only (for backward compatibility).
/// Use `render_page_to_content` for rendering specific pages.
///
/// # Arguments
/// * `layout` - The layout structure with positioned boxes
///
/// # Returns
/// A string containing PDF content stream commands
pub fn render_layout_to_content(layout: &LayoutStructure) -> Result<String, PDFError> {
    // Render first page only (for backward compatibility with single-page layouts)
    layout
        .pages
        .first()
        .ok_or_else(|| PDFError::RenderError("Layout has no pages".to_string()))
        .and_then(|page| render_page_to_content(page, layout.page_height))
}

/// Debug flag to render page content boundaries
/// Set to true to visualize margins and content area
const DEBUG_PAGE_BORDERS: bool = false;

/// Render a single page to PDF content stream
///
/// # Arguments
/// * `page` - The page with positioned boxes
/// * `page_height` - Height of the page in points
///
/// # Returns
/// A string containing PDF content stream commands for this page
pub fn render_page_to_content(page: &Page, page_height: f64) -> Result<String, PDFError> {
    // Pre-allocate string buffer based on estimated content size
    let estimated_size = estimate_content_size(page);
    let mut content = String::with_capacity(estimated_size);

    // Debug: render page content boundaries
    if DEBUG_PAGE_BORDERS {
        render_debug_page_borders(page, page_height, &mut content)?;
    }

    // Render all boxes on this page
    for layout_box in &page.boxes {
        render_box_to_content(layout_box, page_height, &mut content)?;
    }

    // Add page number on pages 2+ (AC6)
    // Position: bottom-center, 0.5" from bottom
    if page.page_number > 1 {
        // Note: page_width should come from LayoutStructure but Page doesn't store it
        // Using standard letter width (612pt) as fallback until Page struct is updated
        let page_width = 612.0;
        render_page_number(page.page_number, page_height, page_width, &mut content)?;
    }

    Ok(content)
}

/// Render debug borders showing actual content area boundaries
///
/// Infers content boundaries from the boxes on the page to show where
/// content actually starts (accounting for both PDF margins and TSX padding).
fn render_debug_page_borders<C: ContentBuilder>(
    page: &Page,
    page_height: f64,
    content: &mut C,
) -> Result<(), PDFError> {
    // Infer actual content boundaries from boxes on the page
    let (content_x, content_y_top, content_width, content_y_bottom) = if page.boxes.is_empty() {
        // Fallback to default margins if no boxes
        (24.0, 24.0, 564.0, page_height - 24.0)
    } else {
        // Find bounding box of all content
        let min_x = page.boxes.iter().map(|b| b.x).fold(f64::INFINITY, f64::min);
        let min_y = page.boxes.iter().map(|b| b.y).fold(f64::INFINITY, f64::min);
        let max_x = page.boxes.iter().map(|b| b.x + b.width).fold(0.0, f64::max);
        let max_y = page
            .boxes
            .iter()
            .map(|b| b.y + b.height)
            .fold(0.0, f64::max);

        (min_x, min_y, max_x - min_x, max_y)
    };

    // Convert layout coordinates (top-left origin) to PDF coordinates (bottom-left origin)
    let pdf_top = page_height - content_y_top;
    let pdf_bottom = page_height - content_y_bottom;
    let content_height = pdf_top - pdf_bottom;

    // Draw red rectangle for actual content area boundary
    content.set_stroke_color_rgb(1.0, 0.0, 0.0); // Red
    content.set_line_width(0.5);
    content.rectangle(content_x, pdf_bottom, content_width, content_height);
    content.stroke();

    // Draw blue line at top of content (where first box starts)
    content.set_stroke_color_rgb(0.0, 0.0, 1.0); // Blue
    content.move_to(content_x, pdf_top);
    content.line_to(content_x + content_width, pdf_top);
    content.stroke();

    // Draw green line at bottom of content (where last box ends)
    content.set_stroke_color_rgb(0.0, 0.5, 0.0); // Green
    content.move_to(content_x, pdf_bottom);
    content.line_to(content_x + content_width, pdf_bottom);
    content.stroke();

    // Add page info text showing actual content area
    content.set_fill_color_rgb(0.5, 0.5, 0.5); // Gray
    content.begin_text();
    content.set_font("Helvetica", 8.0);
    content.set_text_position(content_x, page_height - 15.0);
    let info = format!(
        "Page {} | Content: {:.0}x{:.0}pt | Top margin: {:.0}pt",
        page.page_number, content_width, content_height, content_y_top
    );
    content.show_text_hex(&encode_as_cidfont_hex(&info));
    content.end_text();

    Ok(())
}

/// Render page number at bottom center of page (for pages 2+)
fn render_page_number<C: ContentBuilder>(
    page_number: usize,
    _page_height: f64,
    page_width: f64,
    content: &mut C,
) -> Result<(), PDFError> {
    let font_size = 10.0;
    let margin_bottom = DEFAULT_PAGE_MARGIN;

    // Format: "Page X" or just "X" - using just the number for cleaner look
    let page_text = format!("{}", page_number);
    let font_name = "Helvetica";

    // Estimate text width for centering
    let text_width = estimate_text_width(&page_text, font_size, font_name);
    let x = (page_width - text_width) / 2.0;
    let y = margin_bottom;

    // Set gray color for page numbers (70% gray)
    content.set_fill_color_rgb(PAGE_NUMBER_GRAY, PAGE_NUMBER_GRAY, PAGE_NUMBER_GRAY);

    // Render page number using ContentBuilder methods
    content.begin_text();
    content.set_font(font_name, font_size);
    content.set_text_position(x, y);

    // For PDF/A-1b, Helvetica/Times/Courier are embedded as Inter CIDFont Type 2
    // Use hex encoding for all text (CIDFont Type 2 with Identity-H encoding)
    content.show_text_hex(&encode_as_cidfont_hex(&page_text));

    content.end_text();

    Ok(())
}

/// Render a single layout box to PDF content
fn render_box_to_content<C: ContentBuilder>(
    layout_box: &LayoutBox,
    page_height: f64,
    content: &mut C,
) -> Result<(), PDFError> {
    match &layout_box.content {
        BoxContent::Text(text) => {
            render_text_box(layout_box, text, page_height, content)?;

            // Render border bottom if set (text boxes can have borders too,
            // especially when flattened from containers during pagination)
            if let Some(ref border) = layout_box.style.box_model.border_bottom {
                render_border_bottom(layout_box, border, page_height, content)?;
            }
        }
        BoxContent::Container(children) => {
            // Render background color if set
            if let Some(bg_color) = layout_box.style.box_model.background_color {
                render_background(layout_box, bg_color, page_height, content)?;
            }

            // Render bullet for list items
            if matches!(layout_box.element_type, Some(ElementType::ListItem)) {
                render_list_bullet(layout_box, page_height, content)?;
            }

            // Render children
            for child in children {
                render_box_to_content(child, page_height, content)?;
            }

            // Render border bottom if set
            if let Some(ref border) = layout_box.style.box_model.border_bottom {
                render_border_bottom(layout_box, border, page_height, content)?;
            }
        }
        BoxContent::Empty => {
            // Empty boxes may still have borders to render (from flattened containers)
            if let Some(ref border) = layout_box.style.box_model.border_bottom {
                render_border_bottom(layout_box, border, page_height, content)?;
            }
        }
    }

    Ok(())
}

/// Text style parameters extracted from StyleDeclaration
///
/// This struct consolidates all styling information needed for text rendering,
/// reducing the complexity of render_text_box by separating concerns.
struct TextStyleParams {
    font_size: f64,
    line_height: f64,
    leading: f64,
    color: Color,
    font_name: &'static str,
}

/// Calculate text style parameters from a StyleDeclaration
///
/// Extracts and computes all styling values needed for text rendering:
/// - Font size and line height with defaults
/// - Leading adjustment based on line-height ratio
/// - Color with black default
/// - Font name based on family, weight, and style
///
/// # Arguments
///
/// * `style` - The CSS style declaration to extract parameters from
///
/// # Returns
///
/// A `TextStyleParams` struct containing all computed values
fn calculate_text_style_params(style: &StyleDeclaration) -> TextStyleParams {
    // Get font size and line-height
    let font_size = style.text.font_size.unwrap_or(DEFAULT_FONT_SIZE);
    let line_height = style
        .text
        .line_height
        .unwrap_or(font_size * DEFAULT_LINE_HEIGHT_RATIO);

    // Get color
    let color = style.text.color.unwrap_or(Color {
        r: 0,
        g: 0,
        b: 0,
        a: 1.0,
    });

    // Calculate vertical offset: text should be positioned accounting for line-height
    // Only apply leading for elements with significantly large line-height
    // This helps single-column layouts without breaking flexbox two-column layouts
    let line_height_ratio = line_height / font_size;
    let leading = if line_height_ratio > LINE_HEIGHT_ADJUSTMENT_THRESHOLD {
        ((line_height - font_size) / 2.0) * LEADING_CORRECTION_FACTOR
    } else {
        0.0 // No adjustment for default/small line-heights
    };

    // Determine font name based on style
    let font_name = get_font_name(style);

    TextStyleParams {
        font_size,
        line_height,
        leading,
        color,
        font_name,
    }
}

/// Render a text box to PDF content with styled segments
fn render_text_box<C: ContentBuilder>(
    layout_box: &LayoutBox,
    lines: &[TextLine],
    page_height: f64,
    content: &mut C,
) -> Result<(), PDFError> {
    let style = &layout_box.style;

    // Extract base style parameters from box style
    let TextStyleParams {
        font_size: base_font_size,
        line_height,
        leading,
        color: base_color,
        font_name: _base_font_name,
    } = calculate_text_style_params(style);

    // Render bullet for list items (before text)
    if matches!(layout_box.element_type, Some(ElementType::ListItem)) {
        render_list_bullet(layout_box, page_height, content)?;
    }

    // Render each line separately
    for (line_index, line) in lines.iter().enumerate() {
        // Convert coordinates (PDF origin is bottom-left, we use top-left)
        let pdf_y = page_height
            - layout_box.y
            - leading
            - base_font_size
            - (line_index as f64 * line_height);

        // Calculate total line width for alignment
        let total_line_width: f64 = line
            .segments
            .iter()
            .map(|seg| {
                let seg_font_size = seg.font_size.unwrap_or(base_font_size);
                let seg_font_name = get_segment_font_name(
                    style,
                    seg.font_weight.or(style.text.font_weight),
                    seg.font_style.or(style.text.font_style),
                );
                estimate_text_width(&seg.text, seg_font_size, seg_font_name)
            })
            .sum();

        let x_offset = calculate_text_alignment_offset(style, layout_box.width, total_line_width);
        let mut current_x = layout_box.x + x_offset;

        // Render each segment with its own style
        for segment in &line.segments {
            let seg_font_size = segment.font_size.unwrap_or(base_font_size);
            let seg_font_weight = segment.font_weight.or(style.text.font_weight);
            let seg_font_style = segment.font_style.or(style.text.font_style);
            let seg_font_name = get_segment_font_name(style, seg_font_weight, seg_font_style);

            // Use segment color or fall back to base color
            let seg_color = segment.color.as_ref().map_or_else(
                || base_color,
                |c| Color {
                    r: c.r,
                    g: c.g,
                    b: c.b,
                    a: c.a,
                },
            );

            // Apply text transform
            let transformed_text = apply_text_transform(&segment.text, style);
            let seg_width = estimate_text_width(&transformed_text, seg_font_size, seg_font_name);

            // Set color for this segment
            content.set_fill_color_rgb(
                seg_color.r as f64 / 255.0,
                seg_color.g as f64 / 255.0,
                seg_color.b as f64 / 255.0,
            );

            // Render text segment
            content.begin_text();
            content.set_font(seg_font_name, seg_font_size);
            content.set_text_position(current_x, pdf_y);
            content.show_text_hex(&encode_as_cidfont_hex(&transformed_text));
            content.end_text();

            // Render text decoration for this segment
            let seg_decoration = segment.text_decoration.or(style.text.text_decoration);
            if let Some(decoration) = seg_decoration {
                if decoration != TextDecoration::None {
                    render_text_decoration(
                        decoration,
                        current_x,
                        pdf_y,
                        seg_width,
                        seg_font_size,
                        &seg_color,
                        content,
                    )?;
                }
            }

            // Advance x position for next segment
            current_x += seg_width;
        }
    }

    Ok(())
}

/// Get font name for a segment based on its weight and style
fn get_segment_font_name(
    base_style: &StyleDeclaration,
    font_weight: Option<FontWeight>,
    font_style: Option<FontStyle>,
) -> &'static str {
    // Create a temporary style with the segment's font properties
    let mut temp_style = base_style.clone();
    temp_style.text.font_weight = font_weight;
    temp_style.text.font_style = font_style;
    get_font_name(&temp_style)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::css_parser::{FontStyle, FontWeight};
    use layout_types::TextLine;

    #[test]
    fn test_get_font_name_normal() {
        let style = StyleDeclaration::default();
        assert_eq!(get_font_name(&style), "Helvetica");
    }

    #[test]
    fn test_get_font_name_bold() {
        let mut style = StyleDeclaration::default();
        style.text.font_weight = Some(FontWeight::Bold);

        assert_eq!(get_font_name(&style), "Helvetica-Bold");
    }

    #[test]
    fn test_get_font_name_italic() {
        let mut style = StyleDeclaration::default();
        style.text.font_style = Some(FontStyle::Italic);
        assert_eq!(get_font_name(&style), "Helvetica-Oblique");
    }

    #[test]
    fn test_get_font_name_bold_italic() {
        let mut style = StyleDeclaration::default();
        style.text.font_weight = Some(FontWeight::Bold);
        style.text.font_style = Some(FontStyle::Italic);

        assert_eq!(get_font_name(&style), "Helvetica-BoldOblique");
    }

    #[test]
    fn test_calculate_text_style_params_defaults() {
        let style = StyleDeclaration::default();
        let params = calculate_text_style_params(&style);

        assert_eq!(params.font_size, DEFAULT_FONT_SIZE);
        assert_eq!(
            params.line_height,
            DEFAULT_FONT_SIZE * DEFAULT_LINE_HEIGHT_RATIO
        );
        assert_eq!(params.leading, 0.0); // Ratio 1.2 < 1.3 threshold
        assert_eq!(params.color.r, 0);
        assert_eq!(params.color.g, 0);
        assert_eq!(params.color.b, 0);
        assert_eq!(params.font_name, "Helvetica");
    }

    #[test]
    fn test_calculate_text_style_params_with_large_line_height() {
        let mut style = StyleDeclaration::default();
        style.text.font_size = Some(10.0);
        style.text.line_height = Some(20.0); // Ratio 2.0 > 1.3 threshold
        let params = calculate_text_style_params(&style);

        assert_eq!(params.font_size, 10.0);
        assert_eq!(params.line_height, 20.0);
        // Leading = ((20.0 - 10.0) / 2.0) * 0.95 = 4.75
        assert!((params.leading - 4.75).abs() < 0.01);
    }

    #[test]
    fn test_calculate_text_style_params_custom_color() {
        let mut style = StyleDeclaration::default();
        style.text.color = Some(Color {
            r: 255,
            g: 0,
            b: 0,
            a: 1.0,
        });

        let params = calculate_text_style_params(&style);

        assert_eq!(params.color.r, 255);
        assert_eq!(params.color.g, 0);
        assert_eq!(params.color.b, 0);
    }

    #[test]
    fn test_render_simple_text() {
        let layout_box = LayoutBox {
            x: 10.0,
            y: 10.0,
            width: 100.0,
            height: 12.0,
            content: BoxContent::Text(vec![TextLine::from("Hello World")]),
            style: StyleDeclaration::default(),
            element_type: None,
        };

        let page = Page::new(1, vec![layout_box]);

        let layout = LayoutStructure {
            page_width: 612.0,
            page_height: 792.0,
            pages: vec![page],
        };

        let content = render_layout_to_content(&layout).unwrap();
        // Text should be hex-encoded for CIDFont Type 2
        // "Hello World" -> <00480065006C006C006F00200057006F0072006C0064>
        assert!(content.contains("<00480065006C006C006F00200057006F0072006C0064>"));
        assert!(content.contains("BT"));
        assert!(content.contains("ET"));
    }
}

#[cfg(test)]
mod integration_tests {
    use super::*;
    use layout_types::TextLine;

    /// Integration test: Verify text box generates correct PDF operators
    #[test]
    fn test_render_text_box_generates_correct_operators() {
        let mut style = StyleDeclaration::default();
        style.text.font_size = Some(12.0);
        style.text.color = Some(Color {
            r: 0,
            g: 0,
            b: 0,
            a: 1.0,
        });
        let layout_box = LayoutBox {
            x: 50.0,
            y: 100.0,
            width: 200.0,
            height: 20.0,
            content: BoxContent::Text(vec![TextLine::from("Test Text")]),
            style,
            element_type: None,
        };

        let mut content = String::new();
        let lines = vec![TextLine::from("Test Text")];
        render_text_box(&layout_box, &lines, 792.0, &mut content).unwrap();

        // Verify essential PDF operators are present
        assert!(content.contains("rg"), "Should set fill color");
        assert!(content.contains("BT"), "Should begin text block");
        assert!(content.contains("Tf"), "Should set font");
        assert!(content.contains("Td"), "Should set text position");
        assert!(content.contains("Tj"), "Should show text");
        assert!(content.contains("ET"), "Should end text block");
    }

    /// Integration test: Verify container box with background calls pdf_operators
    #[test]
    fn test_render_container_with_background() {
        let mut style = StyleDeclaration::default();
        style.box_model.background_color = Some(Color {
            r: 255,
            g: 255,
            b: 0,
            a: 1.0,
        });
        let layout_box = LayoutBox {
            x: 10.0,
            y: 20.0,
            width: 100.0,
            height: 50.0,
            content: BoxContent::Container(vec![]),
            style,
            element_type: None,
        };

        let mut content = String::new();
        render_box_to_content(&layout_box, 792.0, &mut content).unwrap();

        // Verify background rendering operators
        assert!(content.contains("rg"), "Should set fill color");
        assert!(content.contains("re"), "Should draw rectangle");
        assert!(content.contains("f"), "Should fill rectangle");
    }

    /// Integration test: Verify list item bullet rendering
    #[test]
    fn test_render_list_item_with_bullet() {
        let mut style = StyleDeclaration::default();
        style.text.font_size = Some(12.0);
        style.text.color = Some(Color {
            r: 0,
            g: 0,
            b: 0,
            a: 1.0,
        });
        let layout_box = LayoutBox {
            x: 50.0,
            y: 100.0,
            width: 200.0,
            height: 20.0,
            content: BoxContent::Container(vec![]),
            style,
            element_type: Some(ElementType::ListItem),
        };

        let mut content = String::new();
        render_box_to_content(&layout_box, 792.0, &mut content).unwrap();

        // Verify bullet rendering (uses Bézier curves)
        assert!(
            content.contains(
                "m
"
            ),
            "Should have move command for bullet"
        );
        assert!(
            content.contains(
                "c
"
            ),
            "Should have curve commands for bullet"
        );
        assert!(
            content.contains(
                "f
"
            ),
            "Should fill bullet circle"
        );
    }

    /// Integration test: Verify text decoration rendering
    #[test]
    fn test_render_text_with_underline() {
        use layout_types::TextDecoration;
        let mut style = StyleDeclaration::default();
        style.text.font_size = Some(12.0);
        style.text.text_decoration = Some(TextDecoration::Underline);
        let layout_box = LayoutBox {
            x: 50.0,
            y: 100.0,
            width: 200.0,
            height: 20.0,
            content: BoxContent::Text(vec![TextLine::from("Underlined")]),
            style,
            element_type: None,
        };

        let mut content = String::new();
        let lines = vec![TextLine::from("Underlined")];
        render_text_box(&layout_box, &lines, 792.0, &mut content).unwrap();

        // Verify underline operators
        assert!(content.contains("RG"), "Should set stroke color");
        assert!(content.contains("w"), "Should set line width");
        assert!(content.contains("l"), "Should draw line");
        assert!(content.contains("S"), "Should stroke line");
    }

    /// Integration test: Verify border rendering
    #[test]
    fn test_render_container_with_border() {
        use crate::css_parser::{BorderLineStyle, BorderStyle};
        let mut style = StyleDeclaration::default();
        style.box_model.border_bottom = Some(BorderStyle {
            width: 2.0,
            style: BorderLineStyle::Solid,
            color: Color {
                r: 0,
                g: 0,
                b: 0,
                a: 1.0,
            },
        });
        let layout_box = LayoutBox {
            x: 10.0,
            y: 20.0,
            width: 100.0,
            height: 50.0,
            content: BoxContent::Container(vec![]),
            style,
            element_type: None,
        };

        let mut content = String::new();
        render_box_to_content(&layout_box, 792.0, &mut content).unwrap();

        // Verify border operators
        assert!(content.contains("RG"), "Should set stroke color");
        assert!(content.contains("w"), "Should set line width");
        assert!(content.contains("[] 0 d"), "Should set solid dash pattern");
        assert!(content.contains("m"), "Should move to start");
        assert!(content.contains("l"), "Should draw line");
        assert!(content.contains("S"), "Should stroke line");
    }

    /// Integration test: Verify multi-line text rendering
    #[test]
    fn test_render_multi_line_text() {
        let lines = vec![
            TextLine::from("Line 1"),
            TextLine::from("Line 2"),
            TextLine::from("Line 3"),
        ];
        let mut style = StyleDeclaration::default();
        style.text.font_size = Some(12.0);
        style.text.line_height = Some(20.0);
        let layout_box = LayoutBox {
            x: 50.0,
            y: 100.0,
            width: 200.0,
            height: 60.0,
            content: BoxContent::Text(lines.clone()),
            style,
            element_type: None,
        };

        let mut content = String::new();
        render_text_box(&layout_box, &lines, 792.0, &mut content).unwrap();

        // Verify multiple text blocks (one per line)
        assert_eq!(
            content.matches("BT").count(),
            3,
            "Should have 3 text blocks"
        );
        assert_eq!(content.matches("ET").count(), 3, "Should end 3 text blocks");
        assert_eq!(
            content.matches("Tj").count(),
            3,
            "Should show 3 text strings"
        );
    }

    /// Integration test: Verify page number rendering
    #[test]
    fn test_render_page_with_page_number() {
        let layout_box = LayoutBox {
            x: 10.0,
            y: 10.0,
            width: 100.0,
            height: 20.0,
            content: BoxContent::Text(vec![TextLine::from("Content")]),
            style: StyleDeclaration::default(),
            element_type: None,
        };

        let page = Page::new(2, vec![layout_box]); // Page 2 should have page number

        let content = render_page_to_content(&page, 792.0).unwrap();

        // Verify page number operators
        assert!(content.contains("rg"), "Should set page number color");
        assert!(
            content.contains("BT"),
            "Should have text block for page number"
        );
        assert!(
            content.contains("Helvetica"),
            "Should use Helvetica for page number"
        );
    }

    /// Integration test: Verify empty content handling
    #[test]
    fn test_render_empty_box() {
        let layout_box = LayoutBox {
            x: 10.0,
            y: 20.0,
            width: 100.0,
            height: 50.0,
            content: BoxContent::Empty,
            style: StyleDeclaration::default(),
            element_type: None,
        };

        let mut content = String::new();
        let result = render_box_to_content(&layout_box, 792.0, &mut content);

        assert!(result.is_ok(), "Should handle empty content without error");
        assert!(content.is_empty(), "Empty box should produce no output");
    }

    /// Integration test: Verify empty box with border renders
    #[test]
    fn test_render_empty_box_with_border() {
        use crate::css_parser::{BorderLineStyle, BorderStyle, Color};

        let mut style = StyleDeclaration::default();
        style.box_model.border_bottom = Some(BorderStyle {
            width: 1.0,
            style: BorderLineStyle::Solid,
            color: Color {
                r: 156,
                g: 163,
                b: 175,
                a: 1.0,
            },
        });

        let layout_box = LayoutBox {
            x: 24.0,
            y: 572.0,
            width: 564.0,
            height: 0.0,
            content: BoxContent::Empty,
            style,
            element_type: None,
        };

        let mut content = String::new();
        let result = render_box_to_content(&layout_box, 792.0, &mut content);

        assert!(
            result.is_ok(),
            "Should render empty box with border without error"
        );
        assert!(
            !content.is_empty(),
            "Empty box with border should produce output"
        );
        assert!(content.contains(" RG"), "Should set stroke color");
        assert!(content.contains(" w"), "Should set line width");
        assert!(content.contains(" m"), "Should have move-to");
        assert!(content.contains(" l"), "Should have line-to");
        assert!(content.contains("S\n"), "Should stroke the line");
    }
}
