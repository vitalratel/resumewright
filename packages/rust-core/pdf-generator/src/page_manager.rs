//! Page management for PDF documents
//!
//! This module handles page creation, navigation, and tracking for PDF documents.

use crate::error::PDFError;
use lopdf::{dictionary, Document, Object, Stream};
use std::collections::HashMap;

/// Manages pages in a PDF document
pub struct PDFPageManager {
    /// Current active page ID
    current_page_id: (u32, u16),
    /// Total page count
    page_count: u32,
    /// Page IDs for bookmark generation (maps page number to object ID)
    page_ids: HashMap<usize, (u32, u16)>,
    /// Pages tree object ID
    pages_id: (u32, u16),
}

impl PDFPageManager {
    /// Create a new page manager with an initial page
    pub fn new(
        doc: &mut Document,
        pages_id: (u32, u16),
        width: f64,
        height: f64,
    ) -> Result<Self, PDFError> {
        let page_id = add_page(doc, pages_id, width, height)?;

        let mut page_ids = HashMap::new();
        page_ids.insert(1, page_id);

        Ok(Self {
            current_page_id: page_id,
            page_count: 1,
            page_ids,
            pages_id,
        })
    }

    /// Add a new page to the document
    pub fn add_page(
        &mut self,
        doc: &mut Document,
        width: f64,
        height: f64,
    ) -> Result<(), PDFError> {
        let page_id = add_page(doc, self.pages_id, width, height)?;
        self.current_page_id = page_id;
        self.page_count += 1;
        self.page_ids.insert(self.page_count as usize, page_id);
        Ok(())
    }

    /// Get the current page ID
    pub fn current_page_id(&self) -> (u32, u16) {
        self.current_page_id
    }

    /// Get the total page count
    pub fn page_count(&self) -> u32 {
        self.page_count
    }

    /// Get page ID for a specific page number
    pub fn get_page_id(&self, page_number: usize) -> Option<(u32, u16)> {
        self.page_ids.get(&page_number).copied()
    }

    /// Get all page IDs
    pub fn page_ids(&self) -> &HashMap<usize, (u32, u16)> {
        &self.page_ids
    }

    /// Update page count in the document
    pub fn finalize(&self, doc: &mut Document) -> Result<(), PDFError> {
        if let Ok(Object::Dictionary(ref mut pages_dict)) = doc.get_object_mut(self.pages_id) {
            pages_dict.set("Count", self.page_count as i64);
        }
        Ok(())
    }
}

/// Ensures the Resources dictionary includes an explicit ColorSpace entry.
fn ensure_color_space(resources: &mut lopdf::Dictionary) {
    let colorspace_dict = dictionary! {
        "DefaultRGB" => "DeviceRGB",
    };
    resources.set("ColorSpace", colorspace_dict);
}

/// Add a page to the document
fn add_page(
    doc: &mut Document,
    pages_id: (u32, u16),
    width: f64,
    height: f64,
) -> Result<(u32, u16), PDFError> {
    let content_id = doc.add_object(Stream::new(dictionary! {}, vec![]));

    let mut resources = dictionary! {};
    ensure_color_space(&mut resources);

    let page_id = doc.add_object(dictionary! {
        "Type" => "Page",
        "Parent" => pages_id,
        "MediaBox" => vec![0.into(), 0.into(), width.into(), height.into()],
        "Contents" => content_id,
        "Resources" => resources,
    });

    if let Ok(Object::Dictionary(ref mut pages_dict)) = doc.get_object_mut(pages_id) {
        let mut kids = pages_dict
            .get(b"Kids")
            .and_then(|obj| obj.as_array())
            .cloned()
            .unwrap_or_default();
        kids.push(Object::Reference(page_id));
        pages_dict.set("Kids", kids);
    }

    Ok(page_id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_creates_initial_page() {
        let mut doc = Document::with_version("1.7");
        let pages_id = doc.new_object_id();
        let pages_dict = dictionary! {
            "Type" => "Pages",
            "Kids" => vec![],
            "Count" => 0,
        };
        doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

        let result = PDFPageManager::new(&mut doc, pages_id, 612.0, 792.0);
        assert!(result.is_ok());

        let manager = result.unwrap();
        assert_eq!(manager.page_count(), 1);
    }

    #[test]
    fn test_add_page_increments_count() {
        let mut doc = Document::with_version("1.7");
        let pages_id = doc.new_object_id();
        let pages_dict = dictionary! {
            "Type" => "Pages",
            "Kids" => vec![],
            "Count" => 0,
        };
        doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

        let mut manager = PDFPageManager::new(&mut doc, pages_id, 612.0, 792.0).unwrap();
        assert_eq!(manager.page_count(), 1);

        manager.add_page(&mut doc, 612.0, 792.0).unwrap();
        assert_eq!(manager.page_count(), 2);

        manager.add_page(&mut doc, 612.0, 792.0).unwrap();
        assert_eq!(manager.page_count(), 3);
    }

    #[test]
    fn test_current_page_id_updates() {
        let mut doc = Document::with_version("1.7");
        let pages_id = doc.new_object_id();
        let pages_dict = dictionary! {
            "Type" => "Pages",
            "Kids" => vec![],
            "Count" => 0,
        };
        doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

        let mut manager = PDFPageManager::new(&mut doc, pages_id, 612.0, 792.0).unwrap();
        let first_page_id = manager.current_page_id();

        manager.add_page(&mut doc, 612.0, 792.0).unwrap();
        let second_page_id = manager.current_page_id();

        assert_ne!(first_page_id, second_page_id);
    }

    #[test]
    fn test_get_page_id_by_number() {
        let mut doc = Document::with_version("1.7");
        let pages_id = doc.new_object_id();
        let pages_dict = dictionary! {
            "Type" => "Pages",
            "Kids" => vec![],
            "Count" => 0,
        };
        doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

        let mut manager = PDFPageManager::new(&mut doc, pages_id, 612.0, 792.0).unwrap();
        manager.add_page(&mut doc, 612.0, 792.0).unwrap();

        assert!(manager.get_page_id(1).is_some());
        assert!(manager.get_page_id(2).is_some());
        assert!(manager.get_page_id(3).is_none());
    }

    #[test]
    fn test_page_ids_returns_all_pages() {
        let mut doc = Document::with_version("1.7");
        let pages_id = doc.new_object_id();
        let pages_dict = dictionary! {
            "Type" => "Pages",
            "Kids" => vec![],
            "Count" => 0,
        };
        doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

        let mut manager = PDFPageManager::new(&mut doc, pages_id, 612.0, 792.0).unwrap();
        manager.add_page(&mut doc, 612.0, 792.0).unwrap();
        manager.add_page(&mut doc, 612.0, 792.0).unwrap();

        let all_page_ids = manager.page_ids();
        assert_eq!(all_page_ids.len(), 3);
    }

    #[test]
    fn test_finalize_updates_page_count() {
        let mut doc = Document::with_version("1.7");
        let pages_id = doc.new_object_id();
        let pages_dict = dictionary! {
            "Type" => "Pages",
            "Kids" => vec![],
            "Count" => 0,
        };
        doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

        let mut manager = PDFPageManager::new(&mut doc, pages_id, 612.0, 792.0).unwrap();
        manager.add_page(&mut doc, 612.0, 792.0).unwrap();

        let result = manager.finalize(&mut doc);
        assert!(result.is_ok());

        // Verify count was updated
        if let Ok(Object::Dictionary(pages_dict)) = doc.get_object(pages_id) {
            let count = pages_dict
                .get(b"Count")
                .and_then(|obj| obj.as_i64())
                .unwrap_or(0);
            assert_eq!(count, 2);
        }
    }

    #[test]
    fn test_add_page_creates_valid_page_object() {
        let mut doc = Document::with_version("1.7");
        let pages_id = doc.new_object_id();
        let pages_dict = dictionary! {
            "Type" => "Pages",
            "Kids" => vec![],
            "Count" => 0,
        };
        doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

        let manager = PDFPageManager::new(&mut doc, pages_id, 612.0, 792.0).unwrap();
        let page_id = manager.current_page_id();

        // Verify page object exists and has required fields
        let page_obj = doc.get_object(page_id);
        assert!(page_obj.is_ok());

        if let Ok(Object::Dictionary(page_dict)) = page_obj {
            assert!(page_dict.has(b"Type"));
            assert!(page_dict.has(b"Parent"));
            assert!(page_dict.has(b"MediaBox"));
            assert!(page_dict.has(b"Contents"));
            assert!(page_dict.has(b"Resources"));
        }
    }

    #[test]
    fn test_ensure_color_space_adds_default_rgb() {
        let mut resources = dictionary! {};
        ensure_color_space(&mut resources);

        assert!(resources.has(b"ColorSpace"));
    }
}
