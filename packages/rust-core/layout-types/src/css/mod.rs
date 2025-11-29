//! CSS style types and enums

pub mod box_style;
pub mod flex_style;
pub mod style;
pub mod text_style;

pub use box_style::BoxStyle;
pub use flex_style::FlexStyle;
pub use style::StyleDeclaration;
pub use text_style::TextStyle;

use serde::{Deserialize, Serialize};

// ============================================================================
// Font Types
// ============================================================================

/// CSS font-weight values for PDF text rendering
///
/// Maps to standard CSS font-weight numeric values for controlling text boldness.
///
/// # CSS Compatibility
/// - `Normal`: CSS 400 (default text weight)
/// - `Bold`: CSS 700 (bold text)
/// - `Lighter`: CSS 300 (light text)
/// - `Bolder`: CSS 900 (extra bold text)
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum FontWeight {
    /// Normal weight (CSS 400)
    Normal,
    /// Bold weight (CSS 700)
    Bold,
    /// Lighter weight (CSS 300)
    Lighter,
    /// Bolder weight (CSS 900)
    Bolder,
}

/// CSS font-style values for text rendering
///
/// Controls whether text is displayed in normal, italic, or oblique style.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum FontStyle {
    /// Normal upright text
    Normal,
    /// Italic text (uses italic font variant)
    Italic,
    /// Oblique text (slanted normal font)
    Oblique,
}

// ============================================================================
// Text Types
// ============================================================================

/// CSS text-align property for horizontal text alignment
///
/// Controls how text content is horizontally aligned within its container.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum TextAlign {
    /// Align text to the left edge (default for LTR)
    Left,
    /// Align text to the right edge
    Right,
    /// Center text horizontally
    Center,
    /// Stretch text to fill width (full justification)
    Justify,
}

/// CSS text-transform property
///
/// Controls capitalization of text.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum TextTransform {
    /// No transformation
    None,
    /// Transform to uppercase
    Uppercase,
    /// Transform to lowercase
    Lowercase,
    /// Capitalize first letter of each word
    Capitalize,
}

/// CSS text-decoration property
///
/// Controls decorative lines on text.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum TextDecoration {
    /// No decoration
    None,
    /// Underline text
    Underline,
    /// Strike through text
    Strikethrough,
    /// Both underline and strikethrough
    UnderlineStrikethrough,
}

/// CSS vertical-align property
///
/// Controls vertical alignment of inline or table-cell elements.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum VerticalAlign {
    /// Align to top of container
    Top,
    /// Align to vertical middle of container
    Middle,
    /// Align to bottom of container
    Bottom,
    /// Align to baseline of parent
    Baseline,
}

/// CSS white-space property
///
/// Controls how white space and line breaks are handled in text.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum WhiteSpace {
    /// Sequences of white space collapse, text wraps when necessary
    Normal,
    /// Sequences of white space collapse, text never wraps
    Nowrap,
    /// White space preserved, text only breaks on explicit newlines
    Pre,
    /// White space preserved, text wraps when necessary
    PreWrap,
}

// ============================================================================
// Display & Layout Types
// ============================================================================

/// CSS display property for box layout type
///
/// Determines how an element is laid out within its parent container.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum Display {
    /// Block-level element (full width, stacks vertically)
    Block,
    /// Flexbox container (enables flex layout for children)
    Flex,
    /// Inline element (flows with text)
    Inline,
    /// Inline element with block-like properties
    InlineBlock,
}

/// CSS flex-direction property
///
/// Defines the direction flex items are placed in the flex container.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum FlexDirection {
    /// Flex items laid out horizontally (left to right)
    Row,
    /// Flex items laid out vertically (top to bottom)
    Column,
    /// Flex items laid out horizontally (right to left)
    RowReverse,
    /// Flex items laid out vertically (bottom to top)
    ColumnReverse,
}

/// CSS justify-content property
///
/// Defines how flex items are distributed along the main axis.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum JustifyContent {
    /// Items packed toward start of flex direction
    FlexStart,
    /// Items packed toward end of flex direction
    FlexEnd,
    /// Items centered along the main axis
    Center,
    /// Items evenly distributed with space between them
    SpaceBetween,
    /// Items evenly distributed with space around them
    SpaceAround,
    /// Items evenly distributed with equal space around them
    SpaceEvenly,
}

/// CSS align-items property
///
/// Defines how flex items are aligned along the cross axis.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum AlignItems {
    /// Items aligned to start of cross axis
    FlexStart,
    /// Items aligned to end of cross axis
    FlexEnd,
    /// Items centered along cross axis
    Center,
    /// Items aligned along their baselines
    Baseline,
    /// Items stretched to fill container
    Stretch,
}
