//! Shared layout and style types for ResumeWright
//!
//! This crate defines the common layout data structures and CSS style types shared between
//! layout-engine (which calculates layouts) and pdf-generator (which renders them).
//!
//! By centralizing these types, we:
//! - Avoid type duplication between crates
//! - Eliminate expensive conversion overhead (previously 100-500ms JSON serialize/deserialize)
//! - Maintain type safety across the layout pipeline
//! - Enable zero-cost sharing of layout data structures
//!
//! # Dimensional Units
//!
//! All dimensional values use `f64` representing PDF points (1/72 inch).
//!
//! # Module Organization
//!
//! The crate is organized into logical modules for token efficiency:
//! - `error` - Validation errors
//! - `primitives` - Color, Spacing, BorderStyle
//! - `css` - StyleDeclaration and all CSS property enums
//! - `layout` - LayoutElement, LayoutBox, Page, LayoutStructure
//! - `text_measurement` - TextMeasurer trait

// Module declarations
mod css;
mod error;
mod layout;
mod primitives;
pub mod text_measurement;

// Re-export all public types for backwards compatibility
pub use css::{
    AlignItems, BoxStyle, Display, FlexDirection, FlexStyle, FontStyle, FontWeight, JustifyContent,
    StyleDeclaration, TextAlign, TextDecoration, TextStyle, TextTransform, VerticalAlign,
    WhiteSpace,
};
pub use error::ValidationError;
pub use layout::{
    BoxContent, ElementType, LayoutBox, LayoutElement, LayoutInfo, LayoutStructure, Page, TextLine,
    TextSegment,
};
pub use primitives::{BorderLineStyle, BorderStyle, Color, Rect, Spacing};
pub use text_measurement::{EstimatedTextMeasurer, TextMeasurer};

// Re-export constants from css module
pub use css::text_style::{DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, DEFAULT_LINE_HEIGHT_RATIO};
