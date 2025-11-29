//! PDF rendering utilities for converting PDF documents to PNG images.
//!
//! This module provides functionality to render PDF pages to PNG format using
//! the pdfium-render library, which is significantly faster than JavaScript-based
//! solutions for testing environments.
//!
//! **Note:** This module is intended for testing environments only and requires
//! the pdfium shared library (`libpdfium.so` on Linux) to be available at runtime.

use image::{ImageBuffer, Rgba};
use pdfium_render::prelude::*;
use std::path::Path;
use thiserror::Error;

/// Initializes the Pdfium library by binding to the system library.
///
/// # Returns
///
/// A `Pdfium` instance ready for use
///
/// # Errors
///
/// Returns `PDFRenderError::PdfiumBindError` if the system library cannot be loaded
fn initialize_pdfium() -> Result<Pdfium, PDFRenderError> {
    Ok(Pdfium::new(
        Pdfium::bind_to_system_library()
            .or_else(|_| Pdfium::bind_to_system_library())
            .map_err(|e| PDFRenderError::PdfiumBindError(format!("{:?}", e)))?,
    ))
}

/// Loads a PDF document from a file path.
///
/// # Arguments
///
/// * `pdfium` - Initialized Pdfium instance
/// * `pdf_path` - Path to the PDF file to load
///
/// # Returns
///
/// A loaded `PdfDocument` ready for rendering
///
/// # Errors
///
/// Returns errors if the file cannot be read or the PDF cannot be parsed
fn load_pdf_document<'a, P: AsRef<Path>>(
    pdfium: &'a Pdfium,
    pdf_path: P,
) -> Result<PdfDocument<'a>, PDFRenderError> {
    let pdf_bytes = std::fs::read(pdf_path.as_ref())
        .map_err(|e| PDFRenderError::ReadError(format!("{:?}", e)))?;

    pdfium
        .load_pdf_from_byte_vec(pdf_bytes, None)
        .map_err(|e| PDFRenderError::LoadError(format!("{:?}", e)))
}

/// Creates a PDF render configuration from the given page and config settings.
///
/// # Arguments
///
/// * `page` - The PDF page to render
/// * `config` - User-provided render configuration (scale, max dimensions)
///
/// # Returns
///
/// A `PdfRenderConfig` ready to be used with `page.render_with_config()`
fn create_render_config(page: &PdfPage, config: &RenderConfig) -> PdfRenderConfig {
    let mut render_config =
        PdfRenderConfig::new().set_target_width((page.width().value * config.scale) as i32);

    if let Some(max_width) = config.max_width {
        render_config = render_config.set_maximum_width(max_width as i32);
    }

    if let Some(max_height) = config.max_height {
        render_config = render_config.set_maximum_height(max_height as i32);
    }

    render_config
}

/// Errors that can occur during PDF rendering
#[derive(Debug, Error)]
pub enum PDFRenderError {
    #[error("Failed to bind to Pdfium library: {0}")]
    PdfiumBindError(String),

    #[error("Failed to read PDF file: {0}")]
    ReadError(String),

    #[error("Failed to load PDF: {0}")]
    LoadError(String),

    #[error("Failed to render page {page}: {error}")]
    RenderError { page: usize, error: String },

    #[error("Failed to save PNG for page {page}: {error}")]
    SaveError { page: usize, error: String },

    #[error("Failed to create output directory: {0}")]
    CreateDirError(String),

    #[error("Invalid PNG path")]
    InvalidPath,

    #[error("Failed to get page {0}")]
    PageAccessError(usize),
}

/// Configuration for PDF rendering
#[derive(Debug, Clone)]
pub struct RenderConfig {
    /// Scale factor for rendering (default: 2.0 for high quality)
    pub scale: f32,
    /// Maximum width in pixels (optional)
    pub max_width: Option<u32>,
    /// Maximum height in pixels (optional)
    pub max_height: Option<u32>,
}

impl Default for RenderConfig {
    fn default() -> Self {
        Self {
            scale: 2.0,
            max_width: None,
            max_height: None,
        }
    }
}

/// Renders a PDF file to PNG images, one per page.
///
/// # Arguments
///
/// * `pdf_path` - Path to the PDF file to render
/// * `output_dir` - Directory where PNG files will be saved
/// * `base_filename` - Base name for output files (e.g., "page" -> "page-1.png", "page-2.png")
/// * `config` - Rendering configuration (scale, max dimensions)
///
/// # Returns
///
/// A vector of paths to the generated PNG files
///
/// # Errors
///
/// Returns `PDFRenderError` if:
/// - The PDF file cannot be loaded
/// - Pdfium library is not available
/// - PNG files cannot be written
///
/// # Example
///
/// ```no_run
/// # #[cfg(feature = "pdfium")]
/// # {
/// use pdf_test_utils::{pdf_to_pngs, RenderConfig};
///
/// let png_paths = pdf_to_pngs(
///     "input.pdf",
///     "./output",
///     "page",
///     RenderConfig::default(),
/// ).unwrap();
/// println!("Generated {} PNG files", png_paths.len());
/// # }
/// ```
pub fn pdf_to_pngs<P: AsRef<Path>>(
    pdf_path: P,
    output_dir: P,
    base_filename: &str,
    config: RenderConfig,
) -> Result<Vec<String>, PDFRenderError> {
    // Initialize Pdfium library and load document
    let pdfium = initialize_pdfium()?;
    let document = load_pdf_document(&pdfium, pdf_path.as_ref())?;

    let page_count = document.pages().len();
    let mut png_paths = Vec::with_capacity(page_count as usize);

    // Create output directory if it doesn't exist
    std::fs::create_dir_all(output_dir.as_ref())
        .map_err(|e| PDFRenderError::CreateDirError(e.to_string()))?;

    // Render each page
    for (index, page) in document.pages().iter().enumerate() {
        let page_num = index + 1;

        // Configure rendering options
        let render_config = create_render_config(&page, &config);

        // Render page to bitmap
        let bitmap =
            page.render_with_config(&render_config)
                .map_err(|e| PDFRenderError::RenderError {
                    page: page_num,
                    error: format!("{:?}", e),
                })?;

        // Convert to image::DynamicImage and save as PNG
        let dynamic_image = bitmap.as_image();
        let rgb_image = dynamic_image.to_rgba8();

        let png_path = output_dir
            .as_ref()
            .join(format!("{}-{}.png", base_filename, page_num));

        rgb_image
            .save(&png_path)
            .map_err(|e| PDFRenderError::SaveError {
                page: page_num,
                error: e.to_string(),
            })?;

        png_paths.push(
            png_path
                .to_str()
                .ok_or(PDFRenderError::InvalidPath)?
                .to_string(),
        );
    }

    Ok(png_paths)
}

/// Renders a single page of a PDF to a PNG image buffer.
///
/// This is a lower-level function that returns the raw image data instead of
/// saving to a file. Useful for in-memory processing.
///
/// # Arguments
///
/// * `pdf_path` - Path to the PDF file
/// * `page_index` - Zero-based page index (0 = first page)
/// * `config` - Rendering configuration
///
/// # Returns
///
/// An `ImageBuffer` containing the rendered page as RGBA pixels
pub fn pdf_page_to_image<P: AsRef<Path>>(
    pdf_path: P,
    page_index: usize,
    config: RenderConfig,
) -> Result<ImageBuffer<Rgba<u8>, Vec<u8>>, PDFRenderError> {
    // Initialize Pdfium library and load document
    let pdfium = initialize_pdfium()?;
    let document = load_pdf_document(&pdfium, pdf_path.as_ref())?;

    // Get the requested page
    let page = document
        .pages()
        .get(page_index as u16)
        .map_err(|_| PDFRenderError::PageAccessError(page_index))?;

    // Configure rendering
    let render_config = create_render_config(&page, &config);

    // Render and convert to image buffer
    let bitmap =
        page.render_with_config(&render_config)
            .map_err(|e| PDFRenderError::RenderError {
                page: page_index,
                error: format!("{:?}", e),
            })?;

    let dynamic_image = bitmap.as_image();
    Ok(dynamic_image.to_rgba8())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    // Pdfium is installed and PDFs exist in test-fixtures/pdf-output/
    fn test_pdf_to_pngs() {
        // Test PDF rendering with existing test fixtures
        let test_pdf = PathBuf::from("../../../../test-fixtures/pdf-output/01-web-safe-fonts.pdf");
        let output_dir = PathBuf::from("/tmp/pdf-render-test");

        if test_pdf.exists() {
            let result = pdf_to_pngs(&test_pdf, &output_dir, "test-page", RenderConfig::default());

            match result {
                Ok(paths) => {
                    assert!(!paths.is_empty());
                    println!("Generated {} PNG files", paths.len());
                }
                Err(e) => {
                    panic!("PDF rendering failed: {:?}", e);
                }
            }
        }
    }
}
