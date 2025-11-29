//! PDF Testing Utilities
//!
//! This crate provides utilities for testing PDF output, including rendering
//! PDFs to images for visual regression testing.
//!
//! **Platform Support:** This crate is **native-only** and cannot be compiled
//! for WASM targets due to its dependency on `pdfium-render`.
//!
//! # Overview
//!
//! The `pdf-test-utils` crate provides PDF-to-PNG rendering capabilities for
//! testing environments. It uses the `pdfium-render` library to convert PDF
//! pages to PNG images, enabling visual regression testing and automated
//! verification of PDF output.
//!
//! # Key Features
//!
//! - **Fast PDF rendering** - Uses native Pdfium library for high-performance rendering
//! - **Configurable output** - Control scale, dimensions, and quality
//! - **Batch processing** - Render all pages or individual pages
//! - **In-memory processing** - Get raw image buffers without saving to disk
//!
//! # System Requirements
//!
//! **IMPORTANT:** This crate requires the pdfium shared library to be installed:
//!
//! - **Linux**: Install `libpdfium.so` (via package manager or manual download)
//! - **macOS**: Install `libpdfium.dylib`
//! - **Windows**: Install `pdfium.dll`
//!
//! If pdfium is not found, you will get: "Failed to bind to Pdfium library"
//!
//! See <https://github.com/ajrcarey/pdfium-render> for installation instructions.
//!
//! # Example Usage
//!
//! ## Rendering PDF to PNG Files
//!
//! ```no_run
//! use pdf_test_utils::{pdf_to_pngs, RenderConfig};
//!
//! let config = RenderConfig {
//!     scale: 2.0,
//!     max_width: Some(1200),
//!     max_height: Some(1600),
//! };
//!
//! let png_paths = pdf_to_pngs(
//!     "input.pdf",
//!     "./output",
//!     "page",
//!     config,
//! )?;
//!
//! println!("Generated {} PNG files", png_paths.len());
//! # Ok::<(), pdf_test_utils::PDFRenderError>(())
//! ```
//!
//! ## Rendering Single Page to Memory
//!
//! ```no_run
//! use pdf_test_utils::{pdf_page_to_image, RenderConfig};
//!
//! let image_buffer = pdf_page_to_image(
//!     "input.pdf",
//!     0,  // First page (zero-indexed)
//!     RenderConfig::default(),
//! )?;
//!
//! // Process image buffer in memory
//! println!("Image size: {}x{}", image_buffer.width(), image_buffer.height());
//! # Ok::<(), pdf_test_utils::PDFRenderError>(())
//! ```
//!
//! # Integration with Testing
//!
//! This crate is designed to integrate with the ResumeWright testing pipeline:
//!
//! ```text
//! pdf-generator → PDF bytes → pdf-test-utils → PNG images → Visual regression
//! ```
//!
//! It is used by:
//! - The `pdf-to-png` CLI tool for command-line PDF conversion
//! - Integration tests that verify PDF output visually
//! - Visual regression testing frameworks (Playwright, etc.)
//!
//! # Error Handling
//!
//! All public APIs return `Result<T, PDFRenderError>` with comprehensive error variants:
//!
//! - `PdfiumBindError` - Failed to load Pdfium library
//! - `ReadError` - Failed to read PDF file
//! - `LoadError` - Failed to parse PDF document
//! - `RenderError` - Failed to render page to bitmap
//! - `SaveError` - Failed to save PNG file
//! - `CreateDirError` - Failed to create output directory
//!
//! # Performance Characteristics
//!
//! - **Single page rendering:** ~50-100ms (depends on page complexity and scale)
//! - **Multi-page rendering:** ~50-100ms per page
//! - **Memory usage:** ~10-30MB per rendered page (at 2x scale)
//!
//! Rendering is significantly faster than JavaScript-based PDF rendering,
//! making it ideal for CI/CD pipelines and automated testing.

mod pdf_renderer;

pub use pdf_renderer::{pdf_page_to_image, pdf_to_pngs, PDFRenderError, RenderConfig};
