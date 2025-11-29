//! Content area calculation for PDF layout
//!
//! This module calculates the usable content area within a PDF page,
//! accounting for page margins and optional TSX layout constraints.

use cv_domain::TSXLayoutConfig;
use pdf_generator::config::PDFConfig;

/// Content area dimensions and position
///
/// Represents the rectangular area where content can be rendered,
/// accounting for page margins and optional TSX padding/max-width constraints.
#[derive(Debug, Clone, Copy)]
pub struct ContentArea {
    /// X offset from page origin (left edge)
    pub x: f64,
    /// Y offset from page origin (top edge)
    pub y: f64,
    /// Usable width for content
    pub width: f64,
    /// Usable height for content
    pub height: f64,
}

/// Calculate content area dimensions from PDF and TSX layout configs
///
/// This function computes the usable content area within a PDF page, handling
/// two scenarios:
///
/// 1. **With max_width constraint**: Centers content horizontally within a max-width
///    container, applying TSX padding to create insets.
/// 2. **Without max_width**: Uses full page width minus PDF margins.
///
/// # Arguments
///
/// * `page_width` - Total page width in points
/// * `page_height` - Total page height in points
/// * `pdf_config` - PDF configuration (page margins)
/// * `layout_config` - TSX layout configuration (optional max-width and padding)
///
/// # Returns
///
/// ContentArea with x, y, width, and height for the usable content region.
pub fn calculate_content_area(
    page_width: f64,
    page_height: f64,
    pdf_config: &PDFConfig,
    layout_config: &TSXLayoutConfig,
) -> ContentArea {
    if let Some(max_container_width) = layout_config.max_width {
        // Scenario 1: TSX layout with max-width constraint
        calculate_content_area_with_max_width(
            page_width,
            page_height,
            pdf_config,
            layout_config,
            max_container_width,
        )
    } else {
        // Scenario 2: Full-width layout (traditional PDF margins only)
        calculate_content_area_full_width(page_width, page_height, pdf_config)
    }
}

/// Calculate content area when max-width constraint is specified
///
/// Centers the content horizontally within a max-width container,
/// applying TSX padding to create insets from the container edges.
fn calculate_content_area_with_max_width(
    page_width: f64,
    page_height: f64,
    pdf_config: &PDFConfig,
    layout_config: &TSXLayoutConfig,
    max_container_width: f64,
) -> ContentArea {
    // Container cannot exceed page width
    let effective_container_width = max_container_width.min(page_width);
    let tsx_padding = &layout_config.padding;

    // Calculate actual content width after subtracting horizontal padding
    let width = effective_container_width - tsx_padding.left - tsx_padding.right;

    // Center container horizontally if it's narrower than page
    let horizontal_margin = (page_width - effective_container_width).max(0.0) / 2.0;

    // Content starts at: horizontal_margin + left_padding
    let x = horizontal_margin + tsx_padding.left;

    // Content starts at: top_margin + top_padding
    let y = pdf_config.margin.top + tsx_padding.top;

    // Available height: page_height - vertical_margins - vertical_padding
    let height = page_height
        - pdf_config.margin.top
        - pdf_config.margin.bottom
        - tsx_padding.top
        - tsx_padding.bottom;

    ContentArea {
        x,
        y,
        width,
        height,
    }
}

/// Calculate content area using full page width (no max-width constraint)
///
/// Uses traditional PDF margin-based layout where content fills the
/// entire page width between left and right margins.
fn calculate_content_area_full_width(
    page_width: f64,
    page_height: f64,
    pdf_config: &PDFConfig,
) -> ContentArea {
    ContentArea {
        x: pdf_config.margin.left,
        y: pdf_config.margin.top,
        width: page_width - pdf_config.margin.left - pdf_config.margin.right,
        height: page_height - pdf_config.margin.top - pdf_config.margin.bottom,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use cv_domain::Spacing;
    use pdf_generator::config::{Margin, PageSize};

    fn create_test_pdf_config() -> PDFConfig {
        PDFConfig {
            page_size: PageSize::Letter,
            margin: Margin {
                top: 72.0,    // 1 inch
                bottom: 72.0, // 1 inch
                left: 72.0,   // 1 inch
                right: 72.0,  // 1 inch
            },
            ..Default::default()
        }
    }

    fn create_test_tsx_layout_no_max_width() -> TSXLayoutConfig {
        TSXLayoutConfig {
            max_width: None,
            padding: Spacing {
                top: 0.0,
                right: 0.0,
                bottom: 0.0,
                left: 0.0,
            },
            background_color: None,
        }
    }

    fn create_test_tsx_layout_with_max_width() -> TSXLayoutConfig {
        TSXLayoutConfig {
            max_width: Some(500.0),
            padding: Spacing {
                top: 20.0,
                right: 30.0,
                bottom: 20.0,
                left: 30.0,
            },
            background_color: None,
        }
    }

    #[test]
    fn test_full_width_layout() {
        let pdf_config = create_test_pdf_config();
        let layout_config = create_test_tsx_layout_no_max_width();

        let content = calculate_content_area(612.0, 792.0, &pdf_config, &layout_config);

        // Letter size: 612pt wide, 792pt tall
        // With 72pt margins on all sides:
        assert_eq!(content.x, 72.0);
        assert_eq!(content.y, 72.0);
        assert_eq!(content.width, 468.0); // 612 - 72 - 72
        assert_eq!(content.height, 648.0); // 792 - 72 - 72
    }

    #[test]
    fn test_max_width_layout_centered() {
        let pdf_config = create_test_pdf_config();
        let layout_config = create_test_tsx_layout_with_max_width();

        let content = calculate_content_area(612.0, 792.0, &pdf_config, &layout_config);

        // Container: 500pt wide, centered on 612pt page
        // Horizontal margin: (612 - 500) / 2 = 56pt
        // Content x: 56 + 30 (left padding) = 86pt
        assert_eq!(content.x, 86.0);

        // Content y: 72 (top margin) + 20 (top padding) = 92pt
        assert_eq!(content.y, 92.0);

        // Content width: 500 - 30 (left padding) - 30 (right padding) = 440pt
        assert_eq!(content.width, 440.0);

        // Content height: 792 - 72 (top) - 72 (bottom) - 20 (top pad) - 20 (bottom pad) = 608pt
        assert_eq!(content.height, 608.0);
    }

    #[test]
    fn test_max_width_exceeds_page_width() {
        let pdf_config = create_test_pdf_config();
        let mut layout_config = create_test_tsx_layout_with_max_width();
        layout_config.max_width = Some(800.0); // Larger than page width

        let content = calculate_content_area(612.0, 792.0, &pdf_config, &layout_config);

        // Effective container width: min(800, 612) = 612pt
        // No centering needed (container equals page width)
        // Horizontal margin: (612 - 612) / 2 = 0pt
        // Content x: 0 + 30 (left padding) = 30pt
        assert_eq!(content.x, 30.0);

        // Content width: 612 - 30 - 30 = 552pt
        assert_eq!(content.width, 552.0);
    }

    #[test]
    fn test_zero_margins() {
        let mut pdf_config = create_test_pdf_config();
        pdf_config.margin = Margin {
            top: 0.0,
            bottom: 0.0,
            left: 0.0,
            right: 0.0,
        };
        let layout_config = create_test_tsx_layout_no_max_width();

        let content = calculate_content_area(612.0, 792.0, &pdf_config, &layout_config);

        // Full page size with no margins
        assert_eq!(content.x, 0.0);
        assert_eq!(content.y, 0.0);
        assert_eq!(content.width, 612.0);
        assert_eq!(content.height, 792.0);
    }

    #[test]
    fn test_content_area_with_zero_padding() {
        let pdf_config = create_test_pdf_config();
        let mut layout_config = create_test_tsx_layout_with_max_width();
        layout_config.padding = Spacing {
            top: 0.0,
            right: 0.0,
            bottom: 0.0,
            left: 0.0,
        };

        let content = calculate_content_area(612.0, 792.0, &pdf_config, &layout_config);

        // Container: 500pt centered on 612pt page
        // Horizontal margin: 56pt
        // No padding, so x starts at horizontal margin
        assert_eq!(content.x, 56.0);
        assert_eq!(content.y, 72.0); // Just top margin
        assert_eq!(content.width, 500.0); // Full container width
        assert_eq!(content.height, 648.0); // page_height - top_margin - bottom_margin
    }

    #[test]
    fn test_small_page_size() {
        let mut pdf_config = create_test_pdf_config();
        pdf_config.margin = Margin {
            top: 10.0,
            bottom: 10.0,
            left: 10.0,
            right: 10.0,
        };
        let layout_config = create_test_tsx_layout_no_max_width();

        // Small custom page size
        let content = calculate_content_area(200.0, 300.0, &pdf_config, &layout_config);

        assert_eq!(content.x, 10.0);
        assert_eq!(content.y, 10.0);
        assert_eq!(content.width, 180.0); // 200 - 10 - 10
        assert_eq!(content.height, 280.0); // 300 - 10 - 10
    }
}
