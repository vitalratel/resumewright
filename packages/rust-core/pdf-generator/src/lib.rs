//! PDF generation crate for ResumeWright.
//!
//! This crate provides the final stage in the TSX→PDF conversion pipeline,
//! transforming structured layout data into ATS-compatible PDF documents.
//!
//! # Overview
//!
//! The `pdf-generator` crate handles:
//! - **PDF document creation** using the lopdf library
//! - **Font management** including Standard 14 Type1 fonts and Google Fonts embedding
//! - **Multi-page layout rendering** with automatic page creation
//! - **ATS compatibility validation** ensuring proper parsing by applicant tracking systems
//! - **Content stream generation** from positioned layout boxes
//!
//! # Architecture
//!
//! The crate is organized into focused modules:
//!
//! - `generator` - Core PDF document generation ([`PDFGenerator`])
//! - `layout_renderer` - Converts layout structures to PDF content streams
//! - `css_parser` - Parses inline CSS styles for box rendering
//! - `ats` - ATS validation module (report types, scoring, validation rules)
//! - `config` - PDF configuration types ([`PDFConfig`], [`PageSize`], [`Margin`])
//! - `error` - Error types ([`PDFError`])
//!
//! # Key Types
//!
//! - [`PDFGenerator`] - Main entry point for PDF generation
//! - [`PDFConfig`] - Configuration for page size, margins, and metadata
//! - [`PDFError`] - Comprehensive error type covering all failure modes
//! - [`ATSValidationReport`] - ATS compatibility scoring and recommendations
//!
//! # Usage Example
//!
//! ## Basic PDF Generation
//!
//! ```no_run
//! use pdf_generator::{PDFGenerator, PDFConfig, PageSize, Margin};
//!
//! // Create generator with custom configuration
//! let config = PDFConfig {
//!     page_size: PageSize::A4,
//!     margin: Margin::from_inches(1.0),
//!     title: Some("John Doe - Resume".to_string()),
//!     author: Some("John Doe".to_string()),
//!     ..Default::default()
//! };
//!
//! let mut generator = PDFGenerator::new(config).unwrap();
//!
//! // Add simple text content
//! generator.add_text("John Doe", 100.0, 700.0, 24.0).unwrap();
//! generator.add_text("Software Engineer", 100.0, 670.0, 14.0).unwrap();
//!
//! // Finalize and get PDF bytes
//! let pdf_bytes = generator.finalize().unwrap();
//!
//! // Save to file or send to user
//! std::fs::write("resume.pdf", &pdf_bytes).unwrap();
//! ```
//!
//! ## Layout Rendering (Production Use Case)
//!
//! ```no_run
//! use pdf_generator::{PDFGenerator, PDFConfig, LayoutStructure};
//!
//! // Get layout from layout-engine crate
//! # let layout = LayoutStructure {
//! #     pages: vec![],
//! #     page_height: 792.0,
//! #     page_width: 612.0,
//! # };
//!
//! let config = PDFConfig::default();
//! let mut generator = PDFGenerator::new(config).unwrap();
//!
//! // Render complete structured layout
//! generator.render_layout(&layout).unwrap();
//!
//! let pdf_bytes = generator.finalize().unwrap();
//! ```
//!
//! ## ATS Validation
//!
//! ```no_run
//! use pdf_generator::{validate_ats_compatibility, LayoutStructure};
//! use cv_domain::CVMetadata;
//!
//! # let layout = LayoutStructure {
//! #     pages: vec![],
//! #     page_height: 792.0,
//! #     page_width: 612.0,
//! # };
//! # let metadata = CVMetadata {
//! #     name: Some("John Doe".to_string()),
//! #     title: None,
//! #     email: Some("john@example.com".to_string()),
//! #     phone: None,
//! #     location: None,
//! #     website: None,
//! #     layout_type: cv_domain::LayoutType::SingleColumn,
//! #     estimated_pages: 1,
//! #     component_count: 10,
//! #     has_contact_info: true,
//! #     has_clear_sections: true,
//! #     font_complexity: cv_domain::FontComplexity::Simple,
//! # };
//!
//! // Validate ATS compatibility
//! let report = validate_ats_compatibility(&layout, &metadata, true, None);
//!
//! println!("ATS Score: {}/10.0", report.score);
//! println!("Text embedded: {}", report.text_embedded);
//! println!("Fonts embedded: {}", report.fonts_embedded);
//! ```
//!
//! # Integration with Pipeline
//!
//! This crate integrates with the broader ResumeWright pipeline:
//!
//! ```text
//! tsx-parser → react-renderer → layout-engine → pdf-generator → PDF bytes
//!     ↓              ↓                ↓                ↓
//!   AST          Virtual DOM      Layout IR      PDF structure
//! ```
//!
//! **Input:** [`LayoutStructure`] from `layout-engine`
//! - Positioned boxes with CSS styling
//! - Multi-page layout with automatic breaks
//! - Font family and styling information
//!
//! **Output:** PDF bytes (`Vec<u8>`)
//! - Valid PDF 1.7 document
//! - Embedded fonts (Google Fonts support)
//! - ATS-compatible structure
//! - Metadata (title, author, keywords)
//!
//! # ATS Compatibility
//!
//! The crate ensures ATS (Applicant Tracking System) compatibility through:
//!
//! - **Text-based rendering** - All content as searchable text (no images for critical data)
//! - **Standard fonts** - Embedded TrueType fonts with proper encoding
//! - **Logical structure** - Proper reading order for content extraction
//! - **Validation scoring** - Automated checks for common ATS issues
//!
//! ATS validation checks:
//! - Contact information presence (name, email, phone)
//! - Professional experience entries
//! - Education history
//! - Skills section
//! - Font compatibility
//! - Layout complexity
//!
//! # Performance Characteristics
//!
//! - **Single-page CV:** <5 seconds (high-end devices), <8 seconds (low-end devices)
//! - **Multi-page CV:** <10 seconds (high-end devices), <15 seconds (low-end devices)
//! - **Font subsetting:** 50-90% size reduction for embedded fonts
//! - **Memory usage:** Entire PDF held in memory during generation
//!
//! # Error Handling
//!
//! All public APIs return `Result<T, PDFError>` with comprehensive error variants:
//!
//! - `InitError` - PDF document initialization failures
//! - `FontError` - Font registration or embedding issues
//! - `RenderError` - Content rendering problems
//! - `SaveError` - PDF serialization failures
//! - `ConfigError` - Invalid configuration parameters
//!
//! Errors implement standard traits (`Debug`, `Display`, `Error`) and are
//! serializable for WASM boundary crossing via serde.
//!
//! # Feature Flags
//!
//! Currently, this crate has no optional feature flags. All functionality is
//! included by default.

pub mod ats; // ATS validation module (SRP refactor - organized submodules)
pub mod bookmarks;
pub mod color_utils; // RGB to PDF color conversion utilities
pub mod config;
pub mod content_builder; // PDF content stream builder abstraction
pub mod css; // CSS parsing submodules (parser, converter, color)
pub mod css_parser; // Re-exports from css submodules
mod document_core; // Document lifecycle management (SRP refactor)
pub mod encoding; // Text encoding utilities for PDF content streams
pub mod error;
mod font_registry; // Font collection and registration (SRP refactor)
pub mod font_resolver; // Font name resolution based on style
pub mod fonts; // Font metrics and text width estimation
pub mod generator;
pub mod layout_analyzer; // Text extraction and size estimation from layouts
pub mod layout_renderer;
mod page_manager; // Page creation and tracking (SRP refactor)
mod pdf_operators; // PDF content stream operators for rendering
pub mod pdfa; // PDF/A compliance support
pub mod standard_fonts; // Embedded Standard 14 fonts for PDF/A
pub mod text_utils; // Text transformation and alignment utilities
mod timestamp; // PDF timestamp generation without chrono

pub use ats::{validate_ats_compatibility, ATSValidationReport, ATSWeights, FieldsPlaced};
pub use config::{Margin, PDFConfig, PDFStandard, PageSize};
pub use css_parser::{
    css_to_points, parse_color, parse_inline_styles, CSSParseError, Color, FontStyle, FontWeight,
    Spacing, StyleDeclaration, TextAlign,
};
pub use error::PDFError;
pub use generator::PDFGenerator;
pub use layout_renderer::{
    render_layout_to_content, render_page_to_content, BoxContent, LayoutBox, LayoutStructure, Page,
};
