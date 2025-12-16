//! PDF Generator - Modular implementation following Single Responsibility Principle
//!
//! This module provides the main PDFGenerator struct which coordinates PDF document
//! generation through specialized sub-components.

use crate::config::PDFConfig;
use crate::encoding::escape_pdf_string;
use crate::error::PDFError;
use crate::layout_renderer::LayoutStructure;
use lopdf::{dictionary, Object};
use std::collections::HashSet;

// Import modular components
use crate::document_core::PDFDocumentCore;
use crate::font_registry::PDFFontRegistry;
use crate::page_manager::PDFPageManager;

/// PDF document generator with support for multi-page layouts and custom fonts.
///
/// This generator follows the Single Responsibility Principle by delegating to
/// specialized sub-components:
/// - `PDFDocumentCore`: Document lifecycle, metadata, and finalization
/// - `PDFPageManager`: Page creation, navigation, and tracking
/// - `PDFFontRegistry`: Font collection, registration, and embedding
///
/// # Architecture
///
/// The generator uses composition over inheritance, with each component handling
/// a single responsibility. This makes the codebase more maintainable, testable,
/// and easier to reason about.
///
/// # Examples
///
/// ## Basic Usage
///
/// ```no_run
/// use pdf_generator::{PDFGenerator, PDFConfig};
///
/// // Create generator with default configuration
/// let config = PDFConfig::default();
/// let mut generator = PDFGenerator::new(config).unwrap();
///
/// // Add text content
/// generator.add_text("Hello, World!", 100.0, 700.0, 12.0).unwrap();
///
/// // Generate PDF bytes
/// let pdf_bytes = generator.finalize().unwrap();
/// ```
///
/// ## Advanced Usage with Layout Rendering
///
/// ```no_run
/// use pdf_generator::{PDFGenerator, PDFConfig, PageSize, Margin, LayoutStructure};
///
/// // Custom configuration
/// let config = PDFConfig {
///     page_size: PageSize::A4,
///     margin: Margin::from_inches(1.0),
///     title: Some("My Resume".to_string()),
///     author: Some("John Doe".to_string()),
///     ..Default::default()
/// };
///
/// let mut generator = PDFGenerator::new(config).unwrap();
///
/// // Render a complete layout structure (from layout-engine)
/// # let layout = LayoutStructure { pages: vec![], page_height: 792.0, page_width: 612.0 };
/// generator.render_layout(&layout).unwrap();
///
/// // Finalize and get PDF bytes
/// let pdf_bytes = generator.finalize().unwrap();
/// ```
///
/// ## Multi-page Documents
///
/// ```no_run
/// use pdf_generator::{PDFGenerator, PDFConfig};
///
/// let mut generator = PDFGenerator::new(PDFConfig::default()).unwrap();
///
/// // Add content to first page
/// generator.add_text("Page 1", 100.0, 700.0, 14.0).unwrap();
///
/// // Add second page
/// generator.add_page().unwrap();
/// generator.add_text("Page 2", 100.0, 700.0, 14.0).unwrap();
///
/// let pdf_bytes = generator.finalize().unwrap();
/// ```
pub struct PDFGenerator {
    document_core: PDFDocumentCore,
    page_manager: PDFPageManager,
    font_registry: PDFFontRegistry,
    config: PDFConfig,
}

impl PDFGenerator {
    /// Creates a new PDF generator with the specified configuration.
    ///
    /// This initializes a new PDF document with:
    /// - PDF version 1.7
    /// - Document catalog and pages tree
    /// - Metadata from the provided configuration
    /// - One initial blank page
    ///
    /// # Arguments
    ///
    /// * `config` - PDF configuration including page size, margins, and metadata
    ///
    /// # Returns
    ///
    /// * `Ok(PDFGenerator)` - A new generator ready for content
    /// * `Err(PDFError)` - If initialization fails
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use pdf_generator::{PDFGenerator, PDFConfig, PageSize};
    ///
    /// let config = PDFConfig {
    ///     page_size: PageSize::Letter,
    ///     title: Some("My Document".to_string()),
    ///     ..Default::default()
    /// };
    ///
    /// let generator = PDFGenerator::new(config).unwrap();
    /// ```
    pub fn new(config: PDFConfig) -> Result<Self, PDFError> {
        let mut document_core = PDFDocumentCore::new(config.clone())?;

        // Create pages tree
        let pages_id = document_core.doc.new_object_id();
        let pages_dict = dictionary! {
            "Type" => "Pages",
            "Kids" => vec![],
            "Count" => 0,
        };
        document_core
            .doc
            .objects
            .insert(pages_id, Object::Dictionary(pages_dict));

        // Initialize document with pages tree
        document_core.initialize(pages_id)?;

        // Create page manager with first page
        let (width, height) = config.page_size.dimensions();
        let page_manager = PDFPageManager::new(&mut document_core.doc, pages_id, width, height)?;

        // Create font registry
        let font_registry = PDFFontRegistry::new();

        Ok(Self {
            document_core,
            page_manager,
            font_registry,
            config,
        })
    }

    /// Sets cached Google Fonts font bytes for embedding in the PDF.
    ///
    /// This method provides pre-downloaded Google Fonts data to avoid fetching
    /// fonts during PDF generation. The font cache is used when rendering layouts
    /// that reference Google Fonts.
    ///
    /// # Arguments
    ///
    /// * `font_bytes` - HashMap where keys are "family:weight:is_italic" format
    ///   (e.g., "Roboto:400:false") and values are TrueType font file bytes
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use pdf_generator::{PDFGenerator, PDFConfig};
    /// use std::collections::HashMap;
    ///
    /// let mut generator = PDFGenerator::new(PDFConfig::default()).unwrap();
    ///
    /// let mut fonts = HashMap::new();
    /// // fonts.insert("Roboto:400:false".to_string(), roboto_bytes);
    /// generator.set_font_bytes(fonts);
    /// ```
    pub fn set_font_bytes(&mut self, font_bytes: std::collections::HashMap<String, Vec<u8>>) {
        self.font_registry.set_font_bytes(font_bytes);
    }

    /// Adds a new blank page to the document.
    ///
    /// The new page will have the same dimensions as specified in the configuration.
    /// The page becomes the current page for subsequent content operations.
    ///
    /// # Returns
    ///
    /// * `Ok(())` - Page added successfully
    /// * `Err(PDFError)` - If page creation fails
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use pdf_generator::{PDFGenerator, PDFConfig};
    ///
    /// let mut generator = PDFGenerator::new(PDFConfig::default()).unwrap();
    ///
    /// // Add text to first page
    /// generator.add_text("Page 1", 100.0, 700.0, 14.0).unwrap();
    ///
    /// // Create second page
    /// generator.add_page().unwrap();
    /// generator.add_text("Page 2", 100.0, 700.0, 14.0).unwrap();
    /// ```
    pub fn add_page(&mut self) -> Result<(), PDFError> {
        let (width, height) = self.config.page_size.dimensions();
        self.page_manager
            .add_page(&mut self.document_core.doc, width, height)
    }

    /// Renders a complete layout structure to the PDF.
    ///
    /// This is the primary method for generating CVs/resumes from the layout engine.
    /// It processes all pages in the layout, registers fonts, and generates PDF content.
    ///
    /// # Arguments
    ///
    /// * `layout` - The layout structure from the layout-engine crate
    ///
    /// # Returns
    ///
    /// * `Ok(())` - Layout rendered successfully
    /// * `Err(PDFError)` - If rendering fails
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use pdf_generator::{PDFGenerator, PDFConfig, LayoutStructure};
    ///
    /// // Get layout from layout-engine crate
    /// # let layout = LayoutStructure {
    /// #     pages: vec![],
    /// #     page_height: 792.0,
    /// #     page_width: 612.0,
    /// # };
    ///
    /// let config = PDFConfig::default();
    /// let mut generator = PDFGenerator::new(config).unwrap();
    ///
    /// // Render complete structured layout
    /// generator.render_layout(&layout).unwrap();
    ///
    /// let pdf_bytes = generator.finalize().unwrap();
    /// ```
    pub fn render_layout(&mut self, layout: &LayoutStructure) -> Result<(), PDFError> {
        self.render_layout_with_progress(layout, None::<&fn(f32)>)
    }

    /// Renders a complete layout structure with progress reporting.
    ///
    /// Similar to `render_layout()` but with optional progress callback for UI updates.
    /// The callback receives a float between 0.0 and 100.0 indicating completion percentage.
    ///
    /// # Arguments
    ///
    /// * `layout` - The layout structure from the layout-engine crate
    /// * `progress_callback` - Optional callback function for progress updates
    ///
    /// # Returns
    ///
    /// * `Ok(())` - Layout rendered successfully
    /// * `Err(PDFError)` - If rendering fails
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use pdf_generator::{PDFGenerator, PDFConfig, LayoutStructure};
    ///
    /// # let layout = LayoutStructure {
    /// #     pages: vec![],
    /// #     page_height: 792.0,
    /// #     page_width: 612.0,
    /// # };
    ///
    /// let mut generator = PDFGenerator::new(PDFConfig::default()).unwrap();
    ///
    /// // Render with progress reporting
    /// generator.render_layout_with_progress(&layout, Some(&|progress| {
    ///     println!("Rendering: {:.1}%", progress);
    /// })).unwrap();
    /// ```
    pub fn render_layout_with_progress<F>(
        &mut self,
        layout: &LayoutStructure,
        progress_callback: Option<&F>,
    ) -> Result<(), PDFError>
    where
        F: Fn(f32),
    {
        // Store layout for bookmark extraction
        self.document_core.set_layout(layout.clone());

        // Collect fonts needed
        let fonts = PDFFontRegistry::collect_fonts_from_layout(layout);

        // Register fonts on all pages
        for page_num in 1..=layout.pages.len() {
            if let Some(page_id) = self.page_manager.get_page_id(page_num) {
                self.font_registry
                    .register_fonts(&mut self.document_core.doc, page_id, &fonts)?;
            }
        }

        // Render each page
        let total_pages = layout.pages.len();
        for (page_idx, page) in layout.pages.iter().enumerate() {
            // Add new page if needed (skip first page as it's created in new())
            if page_idx > 0 {
                self.add_page()?;
            }

            // Render page content
            let page_id = self.page_manager.current_page_id();
            let content = crate::layout_renderer::render_page_to_content(page, layout.page_height)?;

            // Update page content stream
            let content_id = {
                let page_obj = self
                    .document_core
                    .doc
                    .get_object(page_id)
                    .map_err(|e| PDFError::RenderError(format!("Failed to get page: {}", e)))?;
                if let Object::Dictionary(page_dict) = page_obj {
                    page_dict
                        .get(b"Contents")
                        .and_then(|obj| obj.as_reference())
                        .ok()
                } else {
                    None
                }
            };

            if let Some(content_id) = content_id {
                let content_obj = self
                    .document_core
                    .doc
                    .get_object_mut(content_id)
                    .map_err(|e| PDFError::RenderError(format!("Failed to get content: {}", e)))?;
                if let Object::Stream(ref mut stream) = content_obj {
                    stream.set_plain_content(content.as_bytes().to_vec());
                }
            }

            // Report progress
            if let Some(callback) = progress_callback {
                let progress = ((page_idx + 1) as f32 / total_pages as f32) * 100.0;
                callback(progress);
            }
        }

        // Add bookmarks if enabled
        self.document_core
            .add_bookmarks(self.page_manager.page_ids())?;

        Ok(())
    }

    /// Adds text to the current page at the specified position.
    ///
    /// This is a low-level method for adding simple text. For complex layouts,
    /// use `render_layout()` instead.
    ///
    /// # Arguments
    ///
    /// * `text` - The text string to render
    /// * `x` - Horizontal position in points from left edge
    /// * `y` - Vertical position in points from bottom edge
    /// * `font_size` - Font size in points
    ///
    /// # Returns
    ///
    /// * `Ok(())` - Text added successfully
    /// * `Err(PDFError)` - If text rendering fails
    ///
    /// # Coordinate System
    ///
    /// PDF uses a bottom-left origin coordinate system:
    /// - (0, 0) is the bottom-left corner
    /// - X increases to the right
    /// - Y increases upward
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use pdf_generator::{PDFGenerator, PDFConfig};
    ///
    /// let mut generator = PDFGenerator::new(PDFConfig::default()).unwrap();
    ///
    /// // Add text at 100pt from left, 700pt from bottom
    /// generator.add_text("Hello, World!", 100.0, 700.0, 12.0).unwrap();
    ///
    /// // Add more text
    /// generator.add_text("Welcome to PDF generation", 100.0, 680.0, 10.0).unwrap();
    ///
    /// let pdf_bytes = generator.finalize().unwrap();
    /// ```
    pub fn add_text(&mut self, text: &str, x: f64, y: f64, font_size: f64) -> Result<(), PDFError> {
        // Ensure Helvetica is registered (default font)
        let mut fonts = HashSet::new();
        fonts.insert("Helvetica".to_string());

        let page_id = self.page_manager.current_page_id();
        self.font_registry
            .register_fonts(&mut self.document_core.doc, page_id, &fonts)?;

        // Get content ID from page
        let content_id = {
            let page_obj = self
                .document_core
                .doc
                .get_object(page_id)
                .map_err(|e| PDFError::RenderError(format!("Failed to get page: {}", e)))?;
            if let Object::Dictionary(page_dict) = page_obj {
                page_dict
                    .get(b"Contents")
                    .and_then(|obj| obj.as_reference())
                    .ok()
            } else {
                None
            }
        };

        if let Some(content_id) = content_id {
            // Get existing content
            let existing = {
                let content_obj =
                    self.document_core.doc.get_object(content_id).map_err(|e| {
                        PDFError::RenderError(format!("Failed to get content: {}", e))
                    })?;
                if let Object::Stream(ref stream) = content_obj {
                    String::from_utf8_lossy(&stream.content).to_string()
                } else {
                    String::new()
                }
            };

            // Append new text operation
            let escaped = escape_pdf_string(text);
            let mut new_content = existing;
            if !new_content.is_empty() {
                new_content.push('\n');
            }
            new_content.push_str(&format!(
                "BT\n/F1 {} Tf\n{} {} Td\n({}) Tj\nET",
                font_size, x, y, escaped
            ));

            // Update content stream
            let content_obj = self
                .document_core
                .doc
                .get_object_mut(content_id)
                .map_err(|e| PDFError::RenderError(format!("Failed to get content: {}", e)))?;
            if let Object::Stream(ref mut stream) = content_obj {
                stream.set_plain_content(new_content.as_bytes().to_vec());
            }
        }

        Ok(())
    }

    /// Finalizes the PDF document and returns the bytes.
    ///
    /// This method completes the PDF generation process by:
    /// - Updating the page count in the pages tree
    /// - Adding PDF/A compliance if configured
    /// - Serializing the document to bytes
    ///
    /// The generator is consumed by this operation.
    ///
    /// # Returns
    ///
    /// * `Ok(Vec<u8>)` - PDF document as bytes
    /// * `Err(PDFError)` - If finalization or serialization fails
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use pdf_generator::{PDFGenerator, PDFConfig};
    ///
    /// let mut generator = PDFGenerator::new(PDFConfig::default()).unwrap();
    /// generator.add_text("Final document", 100.0, 700.0, 12.0).unwrap();
    ///
    /// // Finalize and get bytes
    /// let pdf_bytes = generator.finalize().unwrap();
    ///
    /// // Save to file
    /// std::fs::write("output.pdf", &pdf_bytes).unwrap();
    /// ```
    pub fn finalize(mut self) -> Result<Vec<u8>, PDFError> {
        // Update page count in pages tree
        self.page_manager.finalize(&mut self.document_core.doc)?;

        // Finalize document (adds PDF/A compliance, etc.)
        let page_count = self.page_manager.page_count();
        self.document_core.finalize(page_count)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::css_parser::StyleDeclaration;
    use crate::layout_renderer::{BoxContent, LayoutBox, LayoutStructure, Page};
    use crate::{Margin, PDFConfig, PageSize};
    use layout_types::TextLine;
    use std::cell::Cell;

    #[test]
    fn test_new_with_default_config() {
        let config = PDFConfig::default();
        let result = PDFGenerator::new(config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_new_with_custom_config() {
        let config = PDFConfig {
            page_size: PageSize::A4,
            margin: Margin::from_inches(1.0),
            title: Some("Test".to_string()),
            author: Some("Author".to_string()),
            ..Default::default()
        };
        let result = PDFGenerator::new(config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_set_font_bytes() {
        use std::collections::HashMap;
        let mut generator = PDFGenerator::new(PDFConfig::default()).unwrap();
        let mut fonts = HashMap::new();
        fonts.insert("Roboto:400:false".to_string(), vec![]);
        generator.set_font_bytes(fonts);
    }

    #[test]
    fn test_add_page() {
        let mut generator = PDFGenerator::new(PDFConfig::default()).unwrap();
        let result = generator.add_page();
        assert!(result.is_ok());
    }

    #[test]
    fn test_add_text() {
        let mut generator = PDFGenerator::new(PDFConfig::default()).unwrap();
        let result = generator.add_text("Test", 100.0, 700.0, 12.0);
        assert!(result.is_ok());
    }

    #[test]
    fn test_finalize() {
        let mut generator = PDFGenerator::new(PDFConfig::default()).unwrap();
        generator.add_text("Test", 100.0, 700.0, 12.0).unwrap();
        let result = generator.finalize();
        assert!(result.is_ok());
        let pdf_bytes = result.unwrap();
        assert!(!pdf_bytes.is_empty());
        assert!(pdf_bytes.starts_with(b"%PDF"));
    }

    #[test]
    fn test_render_layout_empty() {
        let mut generator = PDFGenerator::new(PDFConfig::default()).unwrap();
        let layout = LayoutStructure {
            pages: vec![],
            page_height: 792.0,
            page_width: 612.0,
        };
        let result = generator.render_layout(&layout);
        assert!(result.is_ok());
    }

    #[test]
    fn test_render_layout_simple() {
        let mut generator = PDFGenerator::new(PDFConfig::default()).unwrap();
        let layout = LayoutStructure {
            pages: vec![Page {
                page_number: 1,
                boxes: vec![LayoutBox {
                    x: 100.0,
                    y: 100.0,
                    width: 200.0,
                    height: 50.0,
                    content: BoxContent::Text(vec![TextLine::from("Test")]),
                    style: StyleDeclaration::default(),
                    element_type: None,
                }],
            }],
            page_width: 612.0,
            page_height: 792.0,
        };
        let result = generator.render_layout(&layout);
        assert!(result.is_ok());
    }

    #[test]
    fn test_render_layout_with_progress() {
        let mut generator = PDFGenerator::new(PDFConfig::default()).unwrap();
        let layout = LayoutStructure {
            pages: vec![Page {
                page_number: 1,
                boxes: vec![],
            }],
            page_height: 792.0,
            page_width: 612.0,
        };
        let progress_called = Cell::new(false);
        let result = generator.render_layout_with_progress(
            &layout,
            Some(&|_| {
                progress_called.set(true);
            }),
        );
        assert!(result.is_ok());
        assert!(progress_called.get());
    }

    #[test]
    fn test_multi_page_workflow() {
        let mut generator = PDFGenerator::new(PDFConfig::default()).unwrap();
        generator.add_text("Page 1", 100.0, 700.0, 12.0).unwrap();
        generator.add_page().unwrap();
        generator.add_text("Page 2", 100.0, 700.0, 12.0).unwrap();
        let pdf_bytes = generator.finalize().unwrap();
        assert!(pdf_bytes.len() > 100);
    }

    #[test]
    fn test_metadata_in_output() {
        let config = PDFConfig {
            title: Some("Test Title".to_string()),
            author: Some("Test Author".to_string()),
            ..Default::default()
        };
        let mut generator = PDFGenerator::new(config).unwrap();
        generator.add_text("Test", 100.0, 700.0, 12.0).unwrap();
        let pdf_bytes = generator.finalize().unwrap();
        let pdf_str = String::from_utf8_lossy(&pdf_bytes);
        assert!(pdf_str.contains("Test Title"));
        assert!(pdf_str.contains("Test Author"));
    }
}
