//! Font Processing Toolkit for ResumeWright
//!
//! Font processing for PDF generation:
//! - Font mapping (web-safe fonts to PDF fonts)
//! - Font embedding (TrueType fonts in PDFs)
//! - Font subsetting (reducing font file sizes)
//! - WOFF/WOFF2 decompression (web font formats to TrueType)
//!
//! # Architecture
//!
//! The toolkit is organized into five main modules:
//!
//! ## `mapper`
//! Maps CSS font families to PDF Standard 14 fonts and identifies Google Fonts.
//! Handles font fallback chains and weight/style variants.
//!
//! ## `embedding`
//! Embeds TrueType fonts into PDF documents as CIDFont (Type 0) structures.
//! Creates complete font descriptors, streams, and ToUnicode CMaps.
//!
//! ## `subsetter`
//! Reduces TrueType font file sizes by extracting only the glyphs used in a document.
//! Achieves 60-90% size reduction while maintaining full font functionality.
//!
//! ## `woff`
//! Decompresses WOFF (Web Open Font Format) files to TrueType format using zlib.
//!
//! ## `woff2`
//! Decompresses WOFF2 files to TrueType format using Brotli compression.
//!
//! # Examples
//!
//! ## Font Mapping
//! ```
//! use font_toolkit::mapper::{select_font_from_fallback_chain, select_font_variant};
//! use font_toolkit::{FontWeight, FontStyle};
//! use std::collections::HashSet;
//!
//! let available_fonts = HashSet::new();
//! let base_font = select_font_from_fallback_chain(
//!     "Roboto, Arial, sans-serif",
//!     &available_fonts
//! );
//!
//! let pdf_font = select_font_variant(
//!     &base_font,
//!     FontWeight::Bold,
//!     FontStyle::Normal
//! );
//! ```
//!
//! ## Font Subsetting
//! ```no_run
//! # #[cfg(feature = "advanced-fonts")]
//! # {
//! use font_toolkit::subsetter::subset_font_core;
//!
//! let font_bytes = std::fs::read("fonts/Roboto-Regular.ttf").unwrap();
//! let cv_text = "John Doe\nSoftware Engineer\n...";
//!
//! let (subset_bytes, _) = subset_font_core(&font_bytes, None, cv_text, false).unwrap();
//! // subset_bytes is typically 60-90% smaller than font_bytes
//! # }
//! ```
//!

//! ## WOFF Decompression
//! ```no_run
//! use font_toolkit::woff::decompress_woff;
//!
//! let woff_bytes = std::fs::read("fonts/Roboto.woff").unwrap();
//! let ttf_bytes = decompress_woff(&woff_bytes).unwrap();
//! // ttf_bytes can now be embedded or subset
//! ```

// Local type definitions (previously from layout-types)
/// Font weight variants
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FontWeight {
    Normal,
    Bold,
    Lighter,
    Bolder,
}

/// Font style variants
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FontStyle {
    Normal,
    Italic,
    Oblique,
}

pub mod embedding;
pub mod mapper;
pub mod optimizer;
#[cfg(feature = "advanced-fonts")]
pub mod subsetter;
pub mod truetype;
pub mod woff;
pub mod woff2;

// Re-export commonly used types for convenience
pub use embedding::{embed_truetype_font, EmbedError, EmbeddedFont};
pub use mapper::{
    is_google_font, map_web_safe_font, select_font_from_fallback_chain, select_font_variant,
    GOOGLE_FONTS,
};
pub use optimizer::strip_hinting_tables;
#[cfg(feature = "advanced-fonts")]
pub use subsetter::{subset_font_core, SubsetError, SubsetMetrics};
pub use woff::{decompress_woff, WoffError};
pub use woff2::{decompress_woff2, Woff2Error};
