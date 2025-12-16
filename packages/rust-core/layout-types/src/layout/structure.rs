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

    /// Check if this heading needs orphan prevention during pagination.
    ///
    /// Returns true for H1-H3 headings which should stay with their following
    /// content to avoid orphaned headers at page bottoms.
    /// - H1/H2: Major section headings
    /// - H3: Sub-section headings (e.g., job titles in resumes)
    ///
    /// H4-H6 are minor headings and don't trigger orphan prevention.
    pub fn needs_orphan_prevention(&self) -> bool {
        matches!(self, Self::Heading1 | Self::Heading2 | Self::Heading3)
    }

    /// Check if this heading needs look-ahead orphan prevention.
    ///
    /// Look-ahead prevention moves a heading to the next page if its immediate
    /// following content doesn't fit. This is only for major section headings
    /// (H1/H2) because they define logical sections that should stay together.
    ///
    /// H3+ headings don't use look-ahead because they're sub-headings within
    /// a section - moving them based on NEXT section's content would orphan
    /// their parent H2 section heading.
    pub fn needs_lookahead_orphan_prevention(&self) -> bool {
        matches!(self, Self::Heading1 | Self::Heading2)
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
    /// Each line is a vector of styled text segments allowing inline formatting.
    Text(Vec<TextLine>),
    /// Container with nested child boxes
    Container(Vec<LayoutBox>),
    /// Empty box with no content
    Empty,
}

/// A single line of text with optional styled segments
///
/// Supports both simple text (single segment) and rich text (multiple segments
/// with different styles like bold/italic spans within a line).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TextLine {
    /// Styled segments that make up this line
    pub segments: Vec<super::TextSegment>,
}

impl TextLine {
    /// Create a simple text line with a single unstyled segment
    pub fn simple(text: String) -> Self {
        Self {
            segments: vec![super::TextSegment {
                text,
                font_weight: None,
                font_style: None,
                font_size: None,
                text_decoration: None,
                color: None,
            }],
        }
    }

    /// Create a text line from styled segments
    pub fn from_segments(segments: Vec<super::TextSegment>) -> Self {
        Self { segments }
    }

    /// Get the plain text content of this line (without styling)
    pub fn plain_text(&self) -> String {
        self.segments.iter().map(|s| s.text.as_str()).collect()
    }

    /// Check if this line is empty
    pub fn is_empty(&self) -> bool {
        self.segments.is_empty() || self.segments.iter().all(|s| s.text.is_empty())
    }
}

impl From<String> for TextLine {
    fn from(text: String) -> Self {
        Self::simple(text)
    }
}

impl From<&str> for TextLine {
    fn from(text: &str) -> Self {
        Self::simple(text.to_string())
    }
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
