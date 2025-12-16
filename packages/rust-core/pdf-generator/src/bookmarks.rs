//! PDF bookmark/outline generation from layout structure
//!
//! This module extracts section headings from the layout structure and generates
//! PDF bookmarks (outline entries) for easy navigation in PDF viewers.

use crate::layout_renderer::{BoxContent, ElementType, LayoutBox, LayoutStructure};
use lopdf::{Bookmark, ObjectId};

/// Information about a bookmark to be created
#[derive(Debug, Clone)]
pub struct BookmarkInfo {
    /// Bookmark title (heading text)
    pub title: String,
    /// Page number (1-indexed) where this bookmark points
    pub page_number: usize,
    /// Page object ID in the PDF
    pub page_id: ObjectId,
    /// Nesting level (1 = h1, 2 = h2, 3 = h3, etc.)
    pub level: usize,
}

/// Extract bookmarks from a layout structure
///
/// Scans all pages for heading elements (h1, h2, h3) and creates bookmark entries
/// that link to the page where each heading appears.
///
/// # Arguments
///
/// * `layout` - The complete layout structure with all pages
/// * `page_ids` - Map of page numbers (1-indexed) to PDF object IDs
///
/// # Returns
///
/// A vector of bookmark information, sorted by page number and appearance order
///
/// # Example
///
/// ```no_run
/// use pdf_generator::bookmarks::extract_bookmarks;
/// use layout_types::LayoutStructure;
/// use std::collections::HashMap;
///
/// # let layout = LayoutStructure { pages: vec![], page_width: 612.0, page_height: 792.0 };
/// # let page_ids = HashMap::new();
/// let bookmarks = extract_bookmarks(&layout, &page_ids);
/// println!("Found {} bookmarks", bookmarks.len());
/// ```
pub fn extract_bookmarks(
    layout: &LayoutStructure,
    page_ids: &std::collections::HashMap<usize, ObjectId>,
) -> Vec<BookmarkInfo> {
    let mut bookmarks = Vec::new();

    // Scan each page for heading elements
    for page in &layout.pages {
        let page_id = match page_ids.get(&page.page_number) {
            Some(id) => *id,
            None => continue, // Skip if page ID not found
        };

        // Extract headings from this page
        for layout_box in &page.boxes {
            extract_headings_from_box(layout_box, page.page_number, page_id, &mut bookmarks);
        }
    }

    bookmarks
}

/// Recursively extract headings from a layout box and its children
fn extract_headings_from_box(
    layout_box: &LayoutBox,
    page_number: usize,
    page_id: ObjectId,
    bookmarks: &mut Vec<BookmarkInfo>,
) {
    // Check if this box is a heading element
    if let Some(element_type) = layout_box.element_type {
        let level = match element_type {
            ElementType::Heading1 => Some(1),
            ElementType::Heading2 => Some(2),
            ElementType::Heading3 => Some(3),
            ElementType::Heading4 => Some(4),
            ElementType::Heading5 => Some(5),
            ElementType::Heading6 => Some(6),
            _ => None,
        };

        if let Some(level) = level {
            // Extract text from heading
            if let Some(title) = extract_text_from_box(layout_box) {
                if !title.trim().is_empty() {
                    bookmarks.push(BookmarkInfo {
                        title: title.trim().to_string(),
                        page_number,
                        page_id,
                        level,
                    });
                }
            }
        }
    }

    // Recursively process children
    if let BoxContent::Container(children) = &layout_box.content {
        for child in children {
            extract_headings_from_box(child, page_number, page_id, bookmarks);
        }
    }
}

/// Extract text content from a layout box (including nested text)
fn extract_text_from_box(layout_box: &LayoutBox) -> Option<String> {
    match &layout_box.content {
        BoxContent::Text(lines) => {
            let text: String = lines
                .iter()
                .map(|l| l.plain_text())
                .collect::<Vec<_>>()
                .join(" ");
            Some(text)
        }
        BoxContent::Container(children) => {
            let mut result = String::new();
            for child in children {
                if let Some(text) = extract_text_from_box(child) {
                    if !result.is_empty() {
                        result.push(' ');
                    }
                    result.push_str(&text);
                }
            }
            if result.is_empty() {
                None
            } else {
                Some(result)
            }
        }
        BoxContent::Empty => None,
    }
}

/// Create lopdf Bookmark objects from bookmark info
///
/// Converts BookmarkInfo entries into lopdf Bookmark objects with proper
/// parent-child relationships for nested headings.
///
/// # Arguments
///
/// * `bookmarks` - Vector of bookmark information
///
/// # Returns
///
/// Vector of (Bookmark, parent_index) tuples where parent_index is None for
/// root bookmarks or Some(index) for nested bookmarks
///
/// # Bookmark Hierarchy
///
/// - h1 headings are root-level bookmarks
/// - h2 headings are children of the most recent h1
/// - h3 headings are children of the most recent h2
/// - And so on...
pub fn create_bookmark_tree(bookmarks: &[BookmarkInfo]) -> Vec<(Bookmark, Option<u32>)> {
    let mut result = Vec::new();
    // Track the bookmark index for each level (level 1 = index 0, level 2 = index 1, etc.)
    let mut level_to_bookmark_idx: Vec<Option<usize>> = vec![None; 7]; // Support up to h6

    for info in bookmarks {
        // Create the lopdf Bookmark
        // Bookmark::new(title, color [RGB 0-1], flags, page_object_id)
        // Color: [0.0, 0.0, 1.0] = blue (standard bookmark color)
        // Flags: 0 = no special flags
        let bookmark = Bookmark::new(
            info.title.clone(),
            [0.0, 0.0, 1.0], // Blue color
            0,               // No flags
            info.page_id,
        );

        // Determine parent based on nesting level
        let parent_idx = if info.level == 1 {
            // h1 is always root level
            None
        } else {
            // Find parent: look for most recent heading with level < current level
            // Search backwards from level-1 to level 1
            (1..info.level)
                .rev()
                .find_map(|parent_level| {
                    level_to_bookmark_idx
                        .get(parent_level - 1)
                        .and_then(|&idx| idx)
                })
                .map(|idx| idx as u32)
        };

        let current_idx = result.len();
        result.push((bookmark, parent_idx));

        // Update tracking: clear all deeper levels and set current level
        if info.level > 0 && info.level <= 6 {
            level_to_bookmark_idx[info.level - 1] = Some(current_idx);
            // Clear deeper levels
            for item in level_to_bookmark_idx
                .iter_mut()
                .skip(info.level)
                .take(6 - info.level)
            {
                *item = None;
            }
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use layout_types::{Page, StyleDeclaration, TextLine};

    fn create_heading_box(element: &str, text: &str) -> LayoutBox {
        LayoutBox {
            x: 0.0,
            y: 0.0,
            width: 100.0,
            height: 20.0,
            content: BoxContent::Text(vec![TextLine::from(text)]),
            style: StyleDeclaration::new(),
            element_type: Some(match element {
                "h1" => ElementType::Heading1,
                "h2" => ElementType::Heading2,
                "h3" => ElementType::Heading3,
                "h4" => ElementType::Heading4,
                "h5" => ElementType::Heading5,
                "h6" => ElementType::Heading6,
                _ => ElementType::Div,
            }),
        }
    }

    fn create_container_box(element: Option<&str>, children: Vec<LayoutBox>) -> LayoutBox {
        LayoutBox {
            x: 0.0,
            y: 0.0,
            width: 100.0,
            height: 100.0,
            content: BoxContent::Container(children),
            style: StyleDeclaration::new(),
            element_type: element.map(|e| match e {
                "h1" => ElementType::Heading1,
                "h2" => ElementType::Heading2,
                _ => ElementType::Div,
            }),
        }
    }

    #[test]
    fn test_extract_text_from_box() {
        let text_box = create_heading_box("h1", "Summary");
        assert_eq!(
            extract_text_from_box(&text_box),
            Some("Summary".to_string())
        );

        let container_box = create_container_box(
            Some("h2"),
            vec![
                create_heading_box("span", "Professional"),
                create_heading_box("span", "Experience"),
            ],
        );
        assert_eq!(
            extract_text_from_box(&container_box),
            Some("Professional Experience".to_string())
        );

        let empty_box = LayoutBox {
            x: 0.0,
            y: 0.0,
            width: 10.0,
            height: 10.0,
            content: BoxContent::Empty,
            style: StyleDeclaration::new(),
            element_type: None,
        };
        assert_eq!(extract_text_from_box(&empty_box), None);
    }

    #[test]
    fn test_extract_bookmarks() {
        use std::collections::HashMap;

        let page1 = Page {
            page_number: 1,
            boxes: vec![
                create_heading_box("h1", "John Doe"),
                create_heading_box("h2", "Summary"),
                create_heading_box("p", "Not a heading"),
            ],
        };

        let page2 = Page {
            page_number: 2,
            boxes: vec![
                create_heading_box("h2", "Experience"),
                create_heading_box("h3", "Software Engineer"),
            ],
        };

        let layout = LayoutStructure {
            page_width: 612.0,
            page_height: 792.0,
            pages: vec![page1, page2],
        };

        let mut page_ids = HashMap::new();
        page_ids.insert(1, (1, 0));
        page_ids.insert(2, (2, 0));

        let bookmarks = extract_bookmarks(&layout, &page_ids);

        assert_eq!(bookmarks.len(), 4);
        assert_eq!(bookmarks[0].title, "John Doe");
        assert_eq!(bookmarks[0].level, 1);
        assert_eq!(bookmarks[0].page_number, 1);

        assert_eq!(bookmarks[1].title, "Summary");
        assert_eq!(bookmarks[1].level, 2);

        assert_eq!(bookmarks[2].title, "Experience");
        assert_eq!(bookmarks[2].page_number, 2);

        assert_eq!(bookmarks[3].title, "Software Engineer");
        assert_eq!(bookmarks[3].level, 3);
    }

    #[test]
    fn test_create_bookmark_tree_flat() {
        let bookmarks = vec![
            BookmarkInfo {
                title: "Summary".to_string(),
                page_number: 1,
                page_id: (1, 0),
                level: 1,
            },
            BookmarkInfo {
                title: "Experience".to_string(),
                page_number: 1,
                page_id: (1, 0),
                level: 1,
            },
        ];

        let tree = create_bookmark_tree(&bookmarks);
        assert_eq!(tree.len(), 2);
        assert_eq!(tree[0].1, None); // First is root
        assert_eq!(tree[1].1, None); // Second is also root
    }

    #[test]
    fn test_create_bookmark_tree_nested() {
        let bookmarks = vec![
            BookmarkInfo {
                title: "Summary".to_string(),
                page_number: 1,
                page_id: (1, 0),
                level: 1,
            },
            BookmarkInfo {
                title: "Overview".to_string(),
                page_number: 1,
                page_id: (1, 0),
                level: 2,
            },
            BookmarkInfo {
                title: "Experience".to_string(),
                page_number: 2,
                page_id: (2, 0),
                level: 1,
            },
            BookmarkInfo {
                title: "Job 1".to_string(),
                page_number: 2,
                page_id: (2, 0),
                level: 2,
            },
            BookmarkInfo {
                title: "Responsibilities".to_string(),
                page_number: 2,
                page_id: (2, 0),
                level: 3,
            },
        ];

        let tree = create_bookmark_tree(&bookmarks);
        assert_eq!(tree.len(), 5);

        // Summary (h1) - root
        assert_eq!(tree[0].1, None);

        // Overview (h2) - child of Summary
        assert_eq!(tree[1].1, Some(0));

        // Experience (h1) - root
        assert_eq!(tree[2].1, None);

        // Job 1 (h2) - child of Experience
        assert_eq!(tree[3].1, Some(2));

        // Responsibilities (h3) - child of Job 1
        assert_eq!(tree[4].1, Some(3));
    }

    #[test]
    fn test_empty_bookmarks() {
        let bookmarks: Vec<BookmarkInfo> = vec![];
        let tree = create_bookmark_tree(&bookmarks);
        assert_eq!(tree.len(), 0);
    }

    #[test]
    fn test_whitespace_trimming() {
        let box1 = create_heading_box("h1", "  Trimmed  ");
        assert_eq!(
            extract_text_from_box(&box1),
            Some("  Trimmed  ".to_string())
        );

        // The trimming happens in extract_headings_from_box, not extract_text_from_box
    }
}
