//! Layout Engine module
//!
//! This module calculates absolute positions and dimensions for TSX elements,
//! converting the parsed TSX document into positioned LayoutBox structures
//! ready for PDF rendering.
//!
//! # Architecture
//! - Section 13.1: Performance targets and monitoring
//!
//! # Module Organization
//! - `error`: Error types
//! - `pagination`: Multi-page layout
//! - `taffy_adapter`: Taffy CSS layout engine integration
//! - `text_layout`: Text width calculation and hyphenation support

// Module declarations
mod error;
mod pagination;
mod text_layout;

// Direct TSX → Layout pipeline
mod direct_layout;

// Re-export public API
pub use error::LayoutError;
pub use text_layout::{wrap_text_with_config, TextLayoutConfig};

// Direct layout API
pub use direct_layout::calculate_layout_direct;

// Re-export layout types from shared layout-types crate
pub use layout_types::{
    BoxContent, ElementType, LayoutBox, LayoutStructure, Page, Spacing, StyleDeclaration,
};

// Tests for the direct_layout module are in the tests/ directory
