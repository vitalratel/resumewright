//! JSX element extraction and attribute parsing
//!
//! This module provides functionality for extracting JSX elements from the AST
//! and parsing their attributes. Each submodule focuses on a specific responsibility
//! following the Single Responsibility Principle (SRP).

pub mod attributes;
pub mod css;
pub mod traversal;

// Re-export public API for backward compatibility
pub use attributes::{
    extract_class_name, extract_element_name, extract_inline_style, extract_text_content,
    get_attribute_names, get_attribute_value,
};
pub use traversal::extract_jsx_elements;
