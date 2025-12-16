//! Layout analysis utilities
//!
//! This module provides utilities for analyzing layout structures,
//! including text extraction and size estimation.

use layout_types::{BoxContent, LayoutBox, LayoutStructure, Page};

/// Extract all text content from a layout structure for font subsetting.
///
/// This function recursively walks through all boxes in all pages and collects
/// all text content. The resulting string is used for font subsetting to include
/// only the glyphs actually used in the document.
///
/// # Arguments
///
/// * `layout` - The layout structure to extract text from
///
/// # Returns
///
/// A string containing all text from the layout (may contain duplicates)
///
/// # Examples
///
/// ```
/// use pdf_generator::layout_analyzer::extract_all_text_from_layout;
/// use layout_types::{LayoutStructure, Page, LayoutBox, BoxContent, StyleDeclaration, TextLine};
///
/// let layout = LayoutStructure {
///     pages: vec![Page {
///         page_number: 1,
///         boxes: vec![LayoutBox {
///             x: 0.0,
///             y: 0.0,
///             width: 100.0,
///             height: 20.0,
///             content: BoxContent::Text(vec![TextLine::from("Hello")]),
///             style: StyleDeclaration::default(),
///             element_type: None,
///         }],
///     }],
///     page_height: 792.0,
///     page_width: 612.0,
/// };
///
/// let text = extract_all_text_from_layout(&layout);
/// assert!(text.contains("Hello"));
/// ```
pub fn extract_all_text_from_layout(layout: &LayoutStructure) -> String {
    let mut all_text = String::new();

    fn collect_text_from_boxes(boxes: &[LayoutBox], text: &mut String) {
        for layout_box in boxes {
            match &layout_box.content {
                BoxContent::Text(lines) => {
                    for line in lines {
                        text.push_str(&line.plain_text());
                        text.push(' ');
                    }
                }
                BoxContent::Container(children) => {
                    collect_text_from_boxes(children, text);
                }
                BoxContent::Empty => {}
            }
        }
    }

    for page in &layout.pages {
        collect_text_from_boxes(&page.boxes, &mut all_text);
    }

    all_text
}

/// Estimates the size in bytes of the PDF content stream for a page.
///
/// This provides a conservative estimate to pre-allocate string buffers,
/// reducing memory reallocations during rendering.
///
/// # Arguments
///
/// * `page` - The page with positioned boxes
///
/// # Returns
///
/// Estimated size in bytes (conservative upper bound)
///
/// # Estimation Strategy
///
/// - ~100 bytes per layout box (accounts for text operators, coordinates, styling)
/// - ~50 bytes for page number rendering (if applicable)
/// - Deliberately conservative to avoid excessive reallocations
pub fn estimate_content_size(page: &Page) -> usize {
    let mut estimate = 0;

    // Count all boxes recursively
    fn count_boxes(layout_box: &LayoutBox) -> usize {
        let mut count = 1; // Current box
        if let BoxContent::Container(children) = &layout_box.content {
            for child in children {
                count += count_boxes(child);
            }
        }
        count
    }

    for layout_box in &page.boxes {
        estimate += count_boxes(layout_box) * 100; // ~100 bytes per box
    }

    // Add space for page number if needed
    if page.page_number > 1 {
        estimate += 50;
    }

    estimate
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::css_parser::StyleDeclaration;
    use layout_types::TextLine;

    #[test]
    fn test_extract_all_text_from_layout_empty() {
        let layout = LayoutStructure {
            pages: vec![],
            page_height: 792.0,
            page_width: 612.0,
        };

        let text = extract_all_text_from_layout(&layout);
        assert!(text.is_empty());
    }

    #[test]
    fn test_extract_all_text_from_layout_single_text() {
        let layout = LayoutStructure {
            pages: vec![Page {
                page_number: 1,
                boxes: vec![LayoutBox {
                    x: 0.0,
                    y: 0.0,
                    width: 100.0,
                    height: 20.0,
                    content: BoxContent::Text(vec![TextLine::from("Hello World")]),
                    style: StyleDeclaration::default(),
                    element_type: None,
                }],
            }],
            page_height: 792.0,
            page_width: 612.0,
        };

        let text = extract_all_text_from_layout(&layout);
        assert!(text.contains("Hello World"));
    }

    #[test]
    fn test_extract_all_text_from_layout_nested() {
        let layout = LayoutStructure {
            pages: vec![Page {
                page_number: 1,
                boxes: vec![LayoutBox {
                    x: 0.0,
                    y: 0.0,
                    width: 200.0,
                    height: 100.0,
                    content: BoxContent::Container(vec![
                        LayoutBox {
                            x: 10.0,
                            y: 10.0,
                            width: 100.0,
                            height: 20.0,
                            content: BoxContent::Text(vec![TextLine::from("First")]),
                            style: StyleDeclaration::default(),
                            element_type: None,
                        },
                        LayoutBox {
                            x: 10.0,
                            y: 40.0,
                            width: 100.0,
                            height: 20.0,
                            content: BoxContent::Text(vec![TextLine::from("Second")]),
                            style: StyleDeclaration::default(),
                            element_type: None,
                        },
                    ]),
                    style: StyleDeclaration::default(),
                    element_type: None,
                }],
            }],
            page_height: 792.0,
            page_width: 612.0,
        };

        let text = extract_all_text_from_layout(&layout);
        assert!(text.contains("First"));
        assert!(text.contains("Second"));
    }

    #[test]
    fn test_estimate_content_size_empty() {
        let page = Page {
            page_number: 1,
            boxes: vec![],
        };

        let size = estimate_content_size(&page);
        assert_eq!(size, 0);
    }

    #[test]
    fn test_estimate_content_size_single_box() {
        let page = Page {
            page_number: 1,
            boxes: vec![LayoutBox {
                x: 0.0,
                y: 0.0,
                width: 100.0,
                height: 20.0,
                content: BoxContent::Empty,
                style: StyleDeclaration::default(),
                element_type: None,
            }],
        };

        let size = estimate_content_size(&page);
        assert_eq!(size, 100); // 1 box * 100 bytes
    }

    #[test]
    fn test_estimate_content_size_with_page_number() {
        let page = Page {
            page_number: 2, // Page 2+ gets page number
            boxes: vec![LayoutBox {
                x: 0.0,
                y: 0.0,
                width: 100.0,
                height: 20.0,
                content: BoxContent::Empty,
                style: StyleDeclaration::default(),
                element_type: None,
            }],
        };

        let size = estimate_content_size(&page);
        assert_eq!(size, 150); // 100 + 50 for page number
    }

    #[test]
    fn test_estimate_content_size_nested() {
        let page = Page {
            page_number: 1,
            boxes: vec![LayoutBox {
                x: 0.0,
                y: 0.0,
                width: 200.0,
                height: 100.0,
                content: BoxContent::Container(vec![
                    LayoutBox {
                        x: 10.0,
                        y: 10.0,
                        width: 100.0,
                        height: 20.0,
                        content: BoxContent::Empty,
                        style: StyleDeclaration::default(),
                        element_type: None,
                    },
                    LayoutBox {
                        x: 10.0,
                        y: 40.0,
                        width: 100.0,
                        height: 20.0,
                        content: BoxContent::Empty,
                        style: StyleDeclaration::default(),
                        element_type: None,
                    },
                ]),
                style: StyleDeclaration::default(),
                element_type: None,
            }],
        };

        let size = estimate_content_size(&page);
        assert_eq!(size, 300); // 3 boxes (1 parent + 2 children) * 100 bytes
    }
}
