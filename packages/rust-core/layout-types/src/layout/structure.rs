//! Layout structure types for multi-page documents

use serde::{Deserialize, Serialize};

use crate::css::StyleDeclaration;

// ============================================================================
// Element Type
// ============================================================================

/// HTML element type for semantic identification
///
/// Represents the type of HTML element to enable type-safe element comparisons
/// and semantic rendering decisions in the PDF generator.
///
/// # Example
/// ```
/// use layout_types::ElementType;
///
/// let element = ElementType::Paragraph;
/// match element {
///     ElementType::ListItem => { /* render bullet */ }
///     ElementType::Paragraph => { /* render paragraph */ }
///     _ => {}
/// }
/// ```
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum ElementType {
    // Text elements
    Paragraph,
    Span,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Heading5,
    Heading6,

    // List elements
    UnorderedList,
    OrderedList,
    ListItem,

    // Container elements
    Div,
    Section,
    Article,
    Header,
    Footer,
    Main,

    // Inline elements
    Strong,
    Em,
    Code,
    Link,

    // Other elements
    Image,
    Break,
}

impl ElementType {
    /// Check if this element type is a heading (h1-h6)
    pub fn is_heading(&self) -> bool {
        matches!(
            self,
            Self::Heading1
                | Self::Heading2
                | Self::Heading3
                | Self::Heading4
                | Self::Heading5
                | Self::Heading6
        )
    }

    /// Check if this is a section-level heading (h1-h2)
    ///
    /// Section headings define major document sections and receive special
    /// orphan prevention treatment to keep them with their content.
    pub fn is_section_heading(&self) -> bool {
        matches!(self, Self::Heading1 | Self::Heading2)
    }

    /// Check if this is a sub-heading (h3-h6)
    ///
    /// Sub-headings are within a section and don't trigger cascading page breaks.
    pub fn is_sub_heading(&self) -> bool {
        matches!(
            self,
            Self::Heading3 | Self::Heading4 | Self::Heading5 | Self::Heading6
        )
    }
}

// ============================================================================
// Layout Box
// ============================================================================

/// Positioned layout box for PDF rendering
///
/// Represents a rectangular region in the PDF with specific positioning,
/// dimensions, content, and styling.
///
/// All position and dimension values are in PDF points (1/72 inch).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutBox {
    /// X coordinate (horizontal position from left) in PDF points
    pub x: f64,
    /// Y coordinate (vertical position from top) in PDF points
    pub y: f64,
    /// Box width in PDF points
    pub width: f64,
    /// Box height in PDF points
    pub height: f64,
    /// Content contained within the box
    pub content: BoxContent,
    /// Style properties for rendering
    pub style: StyleDeclaration,
    /// Optional HTML element type for semantic rendering decisions
    pub element_type: Option<ElementType>,
}

/// Content within a layout box
///
/// Represents what is displayed inside a layout box.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BoxContent {
    /// Text content to be rendered (wrapped into lines for proper display)
    Text(Vec<String>),
    /// Container with nested child boxes
    Container(Vec<LayoutBox>),
    /// Empty box with no content
    Empty,
}

// ============================================================================
// Page & Document Structure
// ============================================================================

/// Single page with positioned layout elements
///
/// Represents one page in a multi-page document layout.
///
/// Page dimensions are stored at the document level in [`LayoutStructure`].
///
/// # Example
/// ```
/// use layout_types::Page;
///
/// let page1 = Page::new(1, vec![/* layout elements */]);
/// let page2 = Page::new(2, vec![/* layout elements */]);
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Page {
    /// Page number (1-indexed)
    pub page_number: usize,
    /// Layout boxes for this page only
    pub boxes: Vec<LayoutBox>,
}

impl Page {
    /// Create a new page with the given page number and boxes
    pub fn new(page_number: usize, boxes: Vec<LayoutBox>) -> Self {
        Self { page_number, boxes }
    }
}

/// Complete layout structure supporting multi-page documents
///
/// # Example
/// ```
/// use layout_types::{LayoutStructure, Page};
/// let page = Page::new(1, vec![/* boxes for page 1 */]);
/// let layout = LayoutStructure {
///     page_width: 612.0,
///     page_height: 792.0,
///     pages: vec![page],
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutStructure {
    pub page_width: f64,
    pub page_height: f64,
    /// Pages in the document (for multi-page support)
    pub pages: Vec<Page>,
}
