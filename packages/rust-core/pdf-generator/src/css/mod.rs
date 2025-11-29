//! CSS processing module - organized into focused submodules
//!
//! This module is split into three focused components for token efficiency:
//! - `parser`: CSS property parsing and inline style processing
//! - `converter`: CSS unit conversion to PDF points
//! - `color`: Color parsing (hex, RGB, named colors)
//!
//! Module split rationale :
//! Original css_parser.rs was 619 LOC, making it the largest module and
//! violating token-efficiency patterns. Splitting into 3 focused modules
//! (200-350 LOC each) improves AI navigation and follows the pattern
//! established by tsx-parser and layout-engine refactorings.

pub mod color;
pub mod converter;
pub mod parser;

// Re-export main parsing functions for backward compatibility
pub use color::parse_color;
pub use converter::css_to_points;
pub use parser::parse_inline_styles;
