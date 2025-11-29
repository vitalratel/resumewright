//! Font metrics and text width estimation for PDF rendering
//!
//! This module provides accurate text measurement for Standard 14 PDF fonts
//! (Helvetica, Times-Roman, Courier) with character width tables based on
//! Adobe Font Metrics.

mod estimator;
mod width_tables;

pub use estimator::{estimate_text_width, PDFTextMeasurer};
