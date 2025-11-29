//! Text encoding utilities for PDF content streams
//!
//! This module provides encoding functions for converting text to PDF-compatible formats:
//! - Legacy PDF literal strings (Standard 14 fonts)
//! - CIDFont Type 2 hex encoding (embedded fonts with Identity-H encoding)

mod text_encoding;

pub use text_encoding::{encode_as_cidfont_hex, escape_pdf_string};
