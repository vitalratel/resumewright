//! Core PDF document management
//!
//! This module handles PDF document initialization, metadata, and finalization.

use crate::bookmarks::{create_bookmark_tree, extract_bookmarks};
use crate::config::{PDFConfig, PDFStandard};
use crate::error::PDFError;
use crate::layout_renderer::LayoutStructure;
use crate::pdfa;
use crate::timestamp::current_pdf_timestamp;
use lopdf::{dictionary, Document, Object};
use std::collections::HashMap;

/// Core PDF document wrapper with metadata management
pub struct PDFDocumentCore {
    /// The lopdf Document
    pub doc: Document,
    /// Configuration
    config: PDFConfig,
    /// Layout structure for bookmark extraction
    layout: Option<LayoutStructure>,
    /// Text content for font subsetting
    text_content: String,
}

impl PDFDocumentCore {
    /// Create a new PDF document with configuration
    pub fn new(config: PDFConfig) -> Result<Self, PDFError> {
        let mut doc = Document::with_version("1.7");

        if config.standard == PDFStandard::PDFA1b {
            pdfa::use_traditional_xref_table(&mut doc);
        }

        Ok(Self {
            doc,
            config,
            layout: None,
            text_content: String::new(),
        })
    }

    /// Set the text content for font subsetting
    pub fn set_text_content(&mut self, text: String) {
        self.text_content = text;
    }

    /// Initialize document catalog and metadata
    pub fn initialize(&mut self, pages_id: (u32, u16)) -> Result<(u32, u16), PDFError> {
        let catalog_id = self.doc.new_object_id();

        let catalog = dictionary! {
            "Type" => "Catalog",
            "Pages" => pages_id,
        };
        self.doc
            .objects
            .insert(catalog_id, Object::Dictionary(catalog));
        self.doc.trailer.set("Root", catalog_id);

        self.set_metadata()?;

        let pages_dict = dictionary! {
            "Type" => "Pages",
            "Kids" => vec![],
            "Count" => 0,
        };
        self.doc
            .objects
            .insert(pages_id, Object::Dictionary(pages_dict));

        Ok(catalog_id)
    }

    /// Set PDF metadata in Info dictionary
    fn set_metadata(&mut self) -> Result<(), PDFError> {
        let info_id = self.doc.new_object_id();
        let mut info_dict = dictionary! {};

        if let Some(ref title) = self.config.title {
            info_dict.set(
                "Title",
                Object::String(title.as_bytes().to_vec(), lopdf::StringFormat::Literal),
            );
        }

        if let Some(ref author) = self.config.author {
            info_dict.set(
                "Author",
                Object::String(author.as_bytes().to_vec(), lopdf::StringFormat::Literal),
            );
        }

        if let Some(ref subject) = self.config.subject {
            info_dict.set(
                "Subject",
                Object::String(subject.as_bytes().to_vec(), lopdf::StringFormat::Literal),
            );
        }

        if let Some(ref keywords) = self.config.keywords {
            info_dict.set(
                "Keywords",
                Object::String(keywords.as_bytes().to_vec(), lopdf::StringFormat::Literal),
            );
        }

        if let Some(ref creator) = self.config.creator {
            info_dict.set(
                "Creator",
                Object::String(creator.as_bytes().to_vec(), lopdf::StringFormat::Literal),
            );
        }

        info_dict.set(
            "Producer",
            Object::String(
                b"lopdf + ResumeWright".to_vec(),
                lopdf::StringFormat::Literal,
            ),
        );

        let date_str = current_pdf_timestamp();
        info_dict.set(
            "CreationDate",
            Object::String(date_str.as_bytes().to_vec(), lopdf::StringFormat::Literal),
        );

        self.doc
            .objects
            .insert(info_id, Object::Dictionary(info_dict));
        self.doc.trailer.set("Info", info_id);

        Ok(())
    }

    /// Store layout for bookmark generation
    pub fn set_layout(&mut self, layout: LayoutStructure) {
        self.layout = Some(layout);
    }

    /// Add bookmarks to the document
    pub fn add_bookmarks(&mut self, page_ids: &HashMap<usize, (u32, u16)>) -> Result<(), PDFError> {
        if !self.config.generate_bookmarks {
            return Ok(());
        }

        if let Some(ref layout) = self.layout {
            let bookmark_infos = extract_bookmarks(layout, page_ids);

            if !bookmark_infos.is_empty() {
                let bookmark_tree = create_bookmark_tree(&bookmark_infos);

                for (bookmark, parent_idx) in bookmark_tree {
                    self.doc.add_bookmark(bookmark, parent_idx);
                }

                if let Some(outline_id) = self.doc.build_outline() {
                    let catalog_id = self
                        .doc
                        .trailer
                        .get(b"Root")
                        .and_then(|obj| obj.as_reference())
                        .ok();

                    if let Some(catalog_id) = catalog_id {
                        if let Ok(Object::Dictionary(ref mut catalog)) =
                            self.doc.get_object_mut(catalog_id)
                        {
                            catalog.set("Outlines", Object::Reference(outline_id));
                        }
                    }
                }
            }
        }

        Ok(())
    }

    /// Finalize document and return PDF bytes
    pub fn finalize(mut self, page_count: u32) -> Result<Vec<u8>, PDFError> {
        // Update page count in Info
        if let Ok(info_obj) = self.doc.trailer.get(b"Info") {
            if let Ok(info_id) = info_obj.as_reference() {
                if let Ok(Object::Dictionary(ref mut info_dict)) = self.doc.get_object_mut(info_id)
                {
                    info_dict.set("PageCount", page_count as i64);
                }
            }
        }

        // Apply PDF/A compliance
        if self.config.standard == PDFStandard::PDFA1b {
            pdfa::set_pdfa1_version(&mut self.doc);
            pdfa::apply_pdfa1b_compliance(&mut self.doc, &self.config)?;
            pdfa::add_document_id(&mut self.doc)?;

            // Embed Karla fonts for all pages (PDF/A requires all fonts embedded)
            // This replaces Type1 fonts with embedded TrueType fonts that support Unicode
            // Note: This must be done AFTER font_registry.register_fonts() in generator.rs
            // because we're replacing the Type1 font references with embedded CIDFont Type 2

            // Get all page IDs (we don't have direct access to page_manager here)
            // So we'll need to collect page IDs from the document
            let page_ids: Vec<(u32, u16)> = self
                .doc
                .objects
                .iter()
                .filter_map(|(id, obj)| {
                    if let lopdf::Object::Dictionary(dict) = obj {
                        if dict.get(b"Type").and_then(|o| o.as_name()).ok() == Some(b"Page") {
                            return Some(*id);
                        }
                    }
                    None
                })
                .collect();
            // Embed standard fonts for PDF/A compliance (with subsetting)
            pdfa::embed_standard_fonts_for_pages(&mut self.doc, &page_ids, &self.text_content)?;
        }

        let mut buffer = Vec::new();

        if self.config.compress_content_streams {
            self.doc.compress();
        }

        self.doc
            .save_to(&mut buffer)
            .map_err(|e| PDFError::SaveError(format!("Failed to save PDF: {}", e)))?;

        // Add binary comment for PDF/A compliance (Clause 6.1.2)
        if self.config.standard == PDFStandard::PDFA1b {
            buffer = pdfa::add_binary_comment(buffer);
        }

        Ok(buffer)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::PDFConfig;

    #[test]
    fn test_new_creates_document_with_version() {
        let config = PDFConfig::default();
        let result = PDFDocumentCore::new(config);

        assert!(result.is_ok());
        let doc_core = result.unwrap();
        assert_eq!(doc_core.doc.version, "1.7");
    }

    #[test]
    fn test_new_with_pdfa_standard() {
        let config = PDFConfig {
            standard: PDFStandard::PDFA1b,
            ..Default::default()
        };

        let result = PDFDocumentCore::new(config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_initialize_creates_catalog() {
        let config = PDFConfig::default();
        let mut doc_core = PDFDocumentCore::new(config).unwrap();
        let pages_id = doc_core.doc.new_object_id();

        let result = doc_core.initialize(pages_id);
        assert!(result.is_ok());

        // Verify catalog was created
        let catalog_id = result.unwrap();
        assert!(doc_core.doc.objects.contains_key(&catalog_id));
    }

    #[test]
    fn test_set_metadata_includes_title() {
        let config = PDFConfig {
            title: Some("Test Title".to_string()),
            ..Default::default()
        };

        let mut doc_core = PDFDocumentCore::new(config).unwrap();
        let pages_id = doc_core.doc.new_object_id();
        doc_core.initialize(pages_id).unwrap();

        // Check that Info dictionary exists
        let info_obj = doc_core.doc.trailer.get(b"Info");
        assert!(info_obj.is_ok());
    }

    #[test]
    fn test_set_layout() {
        use crate::layout_renderer::LayoutStructure;

        let config = PDFConfig::default();
        let mut doc_core = PDFDocumentCore::new(config).unwrap();

        let layout = LayoutStructure {
            pages: vec![],
            page_height: 792.0,
            page_width: 612.0,
        };

        doc_core.set_layout(layout);
        assert!(doc_core.layout.is_some());
    }

    #[test]
    fn test_finalize_returns_pdf_bytes() {
        let config = PDFConfig::default();
        let mut doc_core = PDFDocumentCore::new(config).unwrap();
        let pages_id = doc_core.doc.new_object_id();
        doc_core.initialize(pages_id).unwrap();

        let result = doc_core.finalize(1);
        assert!(result.is_ok());

        let pdf_bytes = result.unwrap();
        assert!(!pdf_bytes.is_empty());
        assert!(pdf_bytes.starts_with(b"%PDF"));
    }

    #[test]
    fn test_finalize_with_compression() {
        let config = PDFConfig {
            compress_content_streams: true,
            ..Default::default()
        };

        let mut doc_core = PDFDocumentCore::new(config).unwrap();
        let pages_id = doc_core.doc.new_object_id();
        doc_core.initialize(pages_id).unwrap();

        let result = doc_core.finalize(1);
        assert!(result.is_ok());
    }

    #[test]
    fn test_add_bookmarks_disabled() {
        let config = PDFConfig {
            generate_bookmarks: false,
            ..Default::default()
        };

        let mut doc_core = PDFDocumentCore::new(config).unwrap();
        let result = doc_core.add_bookmarks(&HashMap::new());
        assert!(result.is_ok());
    }
}
