//! Font registration and management for PDF generation
//!
//! This module handles font collection, validation, and registration for PDF documents.
//! It supports both Standard 14 Type1 fonts and embedded TrueType fonts (including Google Fonts).

use crate::error::PDFError;
use crate::layout_renderer::{BoxContent, LayoutBox, LayoutStructure};
use font_toolkit::embedding::embed_truetype_font;
use font_toolkit::mapper::{is_google_font, map_web_safe_font, select_font_variant};
use font_toolkit::strip_hinting_tables;
#[cfg(feature = "advanced-fonts")]
use font_toolkit::subsetter::subset_font_core;
use layout_types::{FontStyle, FontWeight};
use lopdf::{dictionary, Document, Object};
use std::collections::{HashMap, HashSet};

/// Internal type describing how a font should be registered
struct FontRegistration {
    name: String,
    registration_type: FontRegistrationType,
}

/// Type of font registration to perform
enum FontRegistrationType {
    /// Embed a Google Font (TrueType)
    GoogleFont {
        family: String,
        weight: u16,
        is_italic: bool,
    },
    /// Use Standard 14 Type1 font
    Type1 { base_font: String },
}

/// Manages font collection and registration for PDF documents
pub struct PDFFontRegistry {
    /// Google Fonts font bytes cache
    /// Key format: "family:weight:is_italic" (e.g., "Roboto:400:false")
    font_bytes: HashMap<String, Vec<u8>>,
    /// Text content for font subsetting (all text that will be rendered)
    text_content: String,
}

impl PDFFontRegistry {
    /// Create a new empty font registry
    pub fn new() -> Self {
        Self {
            font_bytes: HashMap::new(),
            text_content: String::new(),
        }
    }

    /// Sets cached Google Fonts font bytes for embedding
    pub fn set_font_bytes(&mut self, font_bytes: HashMap<String, Vec<u8>>) {
        self.font_bytes = font_bytes;
    }

    /// Sets the text content for font subsetting
    ///
    /// Call this before `register_fonts()` with all text that will be rendered.
    /// The subsetter will only include glyphs for characters in this text.
    pub fn set_text_content(&mut self, text: String) {
        self.text_content = text;
    }

    /// Collect unique fonts used in a layout structure
    pub fn collect_fonts_from_layout(layout: &LayoutStructure) -> HashSet<String> {
        let mut fonts = HashSet::new();

        fn collect_from_boxes(boxes: &[LayoutBox], fonts: &mut HashSet<String>) {
            for layout_box in boxes {
                let font_family = layout_box
                    .style
                    .text
                    .font_family
                    .as_deref()
                    .unwrap_or("Helvetica");
                let font_weight = layout_box
                    .style
                    .text
                    .font_weight
                    .unwrap_or(FontWeight::Normal);
                let font_style = layout_box
                    .style
                    .text
                    .font_style
                    .unwrap_or(FontStyle::Normal);

                let base_font = map_web_safe_font(font_family);
                // Convert layout-types enums to font-toolkit enums
                let toolkit_weight = match font_weight {
                    FontWeight::Normal => font_toolkit::FontWeight::Normal,
                    FontWeight::Bold => font_toolkit::FontWeight::Bold,
                    FontWeight::Lighter => font_toolkit::FontWeight::Lighter,
                    FontWeight::Bolder => font_toolkit::FontWeight::Bolder,
                };
                let toolkit_style = match font_style {
                    FontStyle::Normal => font_toolkit::FontStyle::Normal,
                    FontStyle::Italic => font_toolkit::FontStyle::Italic,
                    FontStyle::Oblique => font_toolkit::FontStyle::Oblique,
                };
                let font_variant = select_font_variant(base_font, toolkit_weight, toolkit_style);
                fonts.insert(font_variant.to_string());

                if let BoxContent::Container(ref children) = layout_box.content {
                    collect_from_boxes(children, fonts);
                }
            }
        }

        for page in &layout.pages {
            collect_from_boxes(&page.boxes, &mut fonts);
        }

        fonts.insert("Helvetica".to_string());
        fonts
    }

    /// Register fonts on a PDF document page
    pub fn register_fonts(
        &self,
        doc: &mut Document,
        page_id: (u32, u16),
        fonts: &HashSet<String>,
    ) -> Result<(), PDFError> {
        let font_registrations: Vec<FontRegistration> = fonts
            .iter()
            .map(|font_name| self.prepare_font_registration(font_name))
            .collect::<Result<Vec<_>, _>>()?;

        for registration in font_registrations {
            self.apply_font_registration(doc, page_id, registration)?;
        }

        Ok(())
    }

    /// Prepare font registration data without mutating document
    fn prepare_font_registration(&self, font_name: &str) -> Result<FontRegistration, PDFError> {
        let family = font_name.split('-').next().unwrap_or(font_name);

        if is_google_font(family) {
            let (weight, is_italic) = Self::parse_font_variant(font_name);
            let key = format!("{}:{}:{}", family, weight, is_italic);

            if self.font_bytes.contains_key(&key) {
                return Ok(FontRegistration {
                    name: font_name.to_string(),
                    registration_type: FontRegistrationType::GoogleFont {
                        family: family.to_string(),
                        weight,
                        is_italic,
                    },
                });
            }

            eprintln!("WARNING: Google Font '{}' detected but not available. Falling back to Standard 14.", family);
        }

        Ok(FontRegistration {
            name: font_name.to_string(),
            registration_type: FontRegistrationType::Type1 {
                base_font: font_name.to_string(),
            },
        })
    }

    /// Apply a font registration to the document
    fn apply_font_registration(
        &self,
        doc: &mut Document,
        page_id: (u32, u16),
        registration: FontRegistration,
    ) -> Result<(), PDFError> {
        match registration.registration_type {
            FontRegistrationType::GoogleFont {
                family,
                weight,
                is_italic,
            } => {
                if let Some(embedded) = self.try_embed_google_font(doc, &family, weight, is_italic)
                {
                    eprintln!(
                        "[PDF] Using embedded Google Font: {} as {}",
                        family, embedded.resource_name
                    );

                    if let Err(e) = Self::add_font_to_page_resources(
                        doc,
                        page_id,
                        &embedded.resource_name,
                        embedded.font_id,
                    ) {
                        eprintln!("WARNING: Failed to add embedded font to page: {}. Falling back to Standard 14.", e);
                        Self::register_type1_font(
                            doc,
                            page_id,
                            &registration.name,
                            &registration.name,
                        )?;
                    }
                } else {
                    Self::register_type1_font(
                        doc,
                        page_id,
                        &registration.name,
                        &registration.name,
                    )?;
                }
            }
            FontRegistrationType::Type1 { base_font } => {
                Self::register_type1_font(doc, page_id, &registration.name, &base_font)?;
            }
        }

        Ok(())
    }

    /// Parse font variant name to extract weight and italic style
    fn parse_font_variant(variant: &str) -> (u16, bool) {
        let is_italic = variant.contains("Italic");
        let weight = if variant.contains("Bold") {
            700
        } else if variant.contains("Light") {
            300
        } else if variant.contains("Medium") {
            500
        } else {
            400
        };
        (weight, is_italic)
    }

    /// Try to embed a Google Font
    fn try_embed_google_font(
        &self,
        doc: &mut Document,
        family: &str,
        weight: u16,
        is_italic: bool,
    ) -> Option<font_toolkit::embedding::EmbeddedFont> {
        let key = format!("{}:{}:{}", family, weight, is_italic);
        let font_bytes = self.font_bytes.get(&key)?;

        eprintln!(
            "[PDF] Found font bytes for {}, attempting to subset and embed...",
            key
        );

        #[cfg(feature = "advanced-fonts")]
        let (subsetted_bytes, cid_to_new_gid): (
            Vec<u8>,
            std::collections::BTreeMap<u32, u16>,
        ) = match subset_font_core(font_bytes, None, &self.text_content, true) {
            Ok((bytes, Some(metrics))) => {
                eprintln!(
                    "[PDF] Subsetted {}: {} bytes -> {} bytes ({:.1}% reduction)",
                    family,
                    font_bytes.len(),
                    bytes.len(),
                    (1.0 - bytes.len() as f64 / font_bytes.len() as f64) * 100.0
                );
                (bytes, metrics.cid_to_new_gid)
            }
            Ok((bytes, None)) => {
                eprintln!(
                    "WARNING: Subsetting succeeded but no metrics for {}. Using empty mapping.",
                    family
                );
                (bytes, std::collections::BTreeMap::new())
            }
            Err(e) => {
                eprintln!(
                    "WARNING: Font subsetting failed for {}: {}. Using full font.",
                    family, e
                );
                (font_bytes.clone(), std::collections::BTreeMap::new())
            }
        };

        #[cfg(not(feature = "advanced-fonts"))]
        let subsetted_bytes = {
            eprintln!(
                "[PDF] Using full font for {} (subsetting disabled, ~1 MB WASM savings)",
                family
            );
            font_bytes.clone()
        };

        // Strip hinting tables (not needed for PDF, saves ~14% per font)
        let optimized_bytes = strip_hinting_tables(&subsetted_bytes);
        if optimized_bytes.len() < subsetted_bytes.len() {
            eprintln!(
                "[PDF] Stripped hinting tables: {} -> {} bytes ({:.1}% reduction)",
                subsetted_bytes.len(),
                optimized_bytes.len(),
                (1.0 - optimized_bytes.len() as f64 / subsetted_bytes.len() as f64) * 100.0
            );
        }

        // Embed the font (with mapping if subsetted)
        #[cfg(feature = "advanced-fonts")]
        let embed_result = embed_truetype_font(
            doc,
            &optimized_bytes,
            family,
            weight,
            is_italic,
            Some(&cid_to_new_gid),
        );

        #[cfg(not(feature = "advanced-fonts"))]
        let embed_result =
            embed_truetype_font(doc, &optimized_bytes, family, weight, is_italic, None);

        match embed_result {
            Ok(embedded) => {
                eprintln!(
                    "[PDF] Successfully embedded {}: {} bytes",
                    family,
                    optimized_bytes.len()
                );
                Some(embedded)
            }
            Err(e) => {
                eprintln!("WARNING: Font embedding failed for {}: {}", family, e);
                None
            }
        }
    }

    /// Register a Standard 14 Type1 font
    fn register_type1_font(
        doc: &mut Document,
        page_id: (u32, u16),
        name: &str,
        base_font: &str,
    ) -> Result<(), PDFError> {
        let font_id = doc.add_object(dictionary! {
            "Type" => "Font",
            "Subtype" => "Type1",
            "BaseFont" => base_font,
        });

        Self::add_font_to_page_resources(doc, page_id, name, font_id)
    }

    /// Add a font to a page's resources
    fn add_font_to_page_resources(
        doc: &mut Document,
        page_id: (u32, u16),
        name: &str,
        font_id: (u32, u16),
    ) -> Result<(), PDFError> {
        let page_obj = doc
            .get_object_mut(page_id)
            .map_err(|e| PDFError::FontError(format!("Failed to get page: {}", e)))?;

        if let Object::Dictionary(ref mut page_dict) = page_obj {
            let resources = match page_dict.get(b"Resources") {
                Ok(Object::Dictionary(_)) => page_dict
                    .get_mut(b"Resources")
                    .and_then(|obj| obj.as_dict_mut())
                    .map_err(|e| PDFError::FontError(format!("Invalid resources: {}", e)))?,
                _ => {
                    page_dict.set("Resources", dictionary! {});
                    page_dict
                        .get_mut(b"Resources")
                        .and_then(|obj| obj.as_dict_mut())
                        .map_err(|e| {
                            PDFError::FontError(format!("Failed to create resources: {}", e))
                        })?
                }
            };

            let fonts_dict = match resources.get(b"Font") {
                Ok(Object::Dictionary(_)) => resources
                    .get_mut(b"Font")
                    .and_then(|obj| obj.as_dict_mut())
                    .map_err(|e| PDFError::FontError(format!("Invalid fonts: {}", e)))?,
                _ => {
                    resources.set("Font", dictionary! {});
                    resources
                        .get_mut(b"Font")
                        .and_then(|obj| obj.as_dict_mut())
                        .map_err(|e| {
                            PDFError::FontError(format!("Failed to create fonts: {}", e))
                        })?
                }
            };

            fonts_dict.set(name, Object::Reference(font_id));
            Ok(())
        } else {
            Err(PDFError::FontError("Page is not a dictionary".to_string()))
        }
    }
}

impl Default for PDFFontRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::css_parser::StyleDeclaration;
    use crate::layout_renderer::{BoxContent, LayoutBox, Page};
    use layout_types::TextLine;

    #[test]
    fn test_new_creates_empty_registry() {
        let registry = PDFFontRegistry::new();
        assert!(registry.font_bytes.is_empty());
    }

    #[test]
    fn test_set_font_bytes() {
        let mut registry = PDFFontRegistry::new();
        let mut fonts = HashMap::new();
        fonts.insert("Roboto:400:false".to_string(), vec![1, 2, 3]);

        registry.set_font_bytes(fonts);
        assert_eq!(registry.font_bytes.len(), 1);
    }

    #[test]
    fn test_collect_fonts_from_layout_empty() {
        let layout = LayoutStructure {
            pages: vec![],
            page_height: 792.0,
            page_width: 612.0,
        };

        let fonts = PDFFontRegistry::collect_fonts_from_layout(&layout);
        // Always includes Helvetica as default font
        assert_eq!(fonts.len(), 1);
        assert!(fonts.contains("Helvetica"));
    }

    #[test]
    fn test_collect_fonts_from_layout_with_helvetica() {
        let mut style = StyleDeclaration::default();
        style.text.font_family = Some("Helvetica".to_string());
        let layout = LayoutStructure {
            pages: vec![Page {
                page_number: 1,
                boxes: vec![LayoutBox {
                    x: 0.0,
                    y: 0.0,
                    width: 100.0,
                    height: 20.0,
                    content: BoxContent::Text(vec![TextLine::from("Test")]),
                    style,
                    element_type: None,
                }],
            }],
            page_height: 792.0,
            page_width: 612.0,
        };

        let fonts = PDFFontRegistry::collect_fonts_from_layout(&layout);
        assert!(fonts.contains("Helvetica"));
    }

    #[test]
    fn test_collect_fonts_deduplicates() {
        let mut style = StyleDeclaration::default();
        style.text.font_family = Some("Helvetica".to_string());
        let layout = LayoutStructure {
            pages: vec![Page {
                page_number: 1,
                boxes: vec![
                    LayoutBox {
                        x: 0.0,
                        y: 0.0,
                        width: 100.0,
                        height: 20.0,
                        content: BoxContent::Text(vec![TextLine::from("Test 1")]),
                        style: style.clone(),
                        element_type: None,
                    },
                    LayoutBox {
                        x: 0.0,
                        y: 25.0,
                        width: 100.0,
                        height: 20.0,
                        content: BoxContent::Text(vec![TextLine::from("Test 2")]),
                        style: style.clone(),
                        element_type: None,
                    },
                ],
            }],
            page_height: 792.0,
            page_width: 612.0,
        };

        let fonts = PDFFontRegistry::collect_fonts_from_layout(&layout);
        assert_eq!(fonts.len(), 1);
        assert!(fonts.contains("Helvetica"));
    }

    #[test]
    fn test_collect_fonts_with_multiple_families() {
        let mut style_helvetica = StyleDeclaration::default();
        style_helvetica.text.font_family = Some("Helvetica".to_string());
        let mut style_courier = StyleDeclaration::default();
        style_courier.text.font_family = Some("Courier".to_string());
        let layout = LayoutStructure {
            pages: vec![Page {
                page_number: 1,
                boxes: vec![
                    LayoutBox {
                        x: 0.0,
                        y: 0.0,
                        width: 100.0,
                        height: 20.0,
                        content: BoxContent::Text(vec![TextLine::from("Test 1")]),
                        style: style_helvetica,
                        element_type: None,
                    },
                    LayoutBox {
                        x: 0.0,
                        y: 25.0,
                        width: 100.0,
                        height: 20.0,
                        content: BoxContent::Text(vec![TextLine::from("Test 2")]),
                        style: style_courier,
                        element_type: None,
                    },
                ],
            }],
            page_height: 792.0,
            page_width: 612.0,
        };

        let fonts = PDFFontRegistry::collect_fonts_from_layout(&layout);
        // Should have both Courier and Helvetica (default)
        assert_eq!(fonts.len(), 2);
        assert!(fonts.contains("Helvetica"));
        assert!(fonts.contains("Courier"));
    }

    #[test]
    fn test_collect_fonts_defaults_to_helvetica() {
        let style = StyleDeclaration::default();
        let layout = LayoutStructure {
            pages: vec![Page {
                page_number: 1,
                boxes: vec![LayoutBox {
                    x: 0.0,
                    y: 0.0,
                    width: 100.0,
                    height: 20.0,
                    content: BoxContent::Text(vec![TextLine::from("Test")]),
                    style,
                    element_type: None,
                }],
            }],
            page_height: 792.0,
            page_width: 612.0,
        };

        let fonts = PDFFontRegistry::collect_fonts_from_layout(&layout);
        // None font_family defaults to Helvetica
        assert_eq!(fonts.len(), 1);
        assert!(fonts.contains("Helvetica"));
    }

    #[test]
    fn test_register_fonts_with_empty_set() {
        let mut doc = Document::with_version("1.7");
        let page_id = doc.new_object_id();
        let page_dict = dictionary! {
            "Type" => "Page",
            "Resources" => dictionary!{},
        };
        doc.objects.insert(page_id, Object::Dictionary(page_dict));

        let registry = PDFFontRegistry::new();
        let fonts = HashSet::new();

        let result = registry.register_fonts(&mut doc, page_id, &fonts);
        assert!(result.is_ok());
    }

    #[test]
    fn test_default_creates_new_registry() {
        let registry = PDFFontRegistry::default();
        assert!(registry.font_bytes.is_empty());
    }

    // parse_font_variant tests
    #[test]
    fn test_parse_font_variant_regular() {
        let (weight, is_italic) = PDFFontRegistry::parse_font_variant("Roboto-Regular");
        assert_eq!(weight, 400);
        assert!(!is_italic);
    }

    #[test]
    fn test_parse_font_variant_bold() {
        let (weight, is_italic) = PDFFontRegistry::parse_font_variant("Roboto-Bold");
        assert_eq!(weight, 700);
        assert!(!is_italic);
    }

    #[test]
    fn test_parse_font_variant_italic() {
        let (weight, is_italic) = PDFFontRegistry::parse_font_variant("Roboto-Italic");
        assert_eq!(weight, 400);
        assert!(is_italic);
    }

    #[test]
    fn test_parse_font_variant_bold_italic() {
        let (weight, is_italic) = PDFFontRegistry::parse_font_variant("Roboto-BoldItalic");
        assert_eq!(weight, 700);
        assert!(is_italic);
    }

    #[test]
    fn test_parse_font_variant_light() {
        let (weight, is_italic) = PDFFontRegistry::parse_font_variant("Roboto-Light");
        assert_eq!(weight, 300);
        assert!(!is_italic);
    }

    #[test]
    fn test_parse_font_variant_medium() {
        let (weight, is_italic) = PDFFontRegistry::parse_font_variant("Roboto-Medium");
        assert_eq!(weight, 500);
        assert!(!is_italic);
    }

    #[test]
    fn test_parse_font_variant_light_italic() {
        let (weight, is_italic) = PDFFontRegistry::parse_font_variant("Roboto-LightItalic");
        assert_eq!(weight, 300);
        assert!(is_italic);
    }

    // prepare_font_registration tests
    #[test]
    fn test_prepare_font_registration_standard_font() {
        let registry = PDFFontRegistry::new();
        let result = registry.prepare_font_registration("Helvetica");
        assert!(result.is_ok());

        let registration = result.unwrap();
        assert_eq!(registration.name, "Helvetica");
        assert!(matches!(
            registration.registration_type,
            FontRegistrationType::Type1 { .. }
        ));
    }

    #[test]
    fn test_prepare_font_registration_times() {
        let registry = PDFFontRegistry::new();
        let result = registry.prepare_font_registration("Times-Roman");
        assert!(result.is_ok());

        let registration = result.unwrap();
        assert!(matches!(
            registration.registration_type,
            FontRegistrationType::Type1 { .. }
        ));
    }

    #[test]
    fn test_prepare_font_registration_google_font_without_bytes() {
        let registry = PDFFontRegistry::new();
        // Roboto is a Google Font, but no bytes provided - should fallback to Type1
        let result = registry.prepare_font_registration("Roboto-Regular");
        assert!(result.is_ok());

        let registration = result.unwrap();
        // Should fallback to Type1 when font bytes not available
        assert!(matches!(
            registration.registration_type,
            FontRegistrationType::Type1 { .. }
        ));
    }

    #[test]
    fn test_prepare_font_registration_google_font_with_bytes() {
        let mut registry = PDFFontRegistry::new();
        let mut fonts = HashMap::new();
        fonts.insert("Roboto:400:false".to_string(), vec![1, 2, 3]);
        registry.set_font_bytes(fonts);

        let result = registry.prepare_font_registration("Roboto-Regular");
        assert!(result.is_ok());

        let registration = result.unwrap();
        assert_eq!(registration.name, "Roboto-Regular");
        assert!(matches!(
            registration.registration_type,
            FontRegistrationType::GoogleFont { .. }
        ));

        if let FontRegistrationType::GoogleFont {
            family,
            weight,
            is_italic,
        } = registration.registration_type
        {
            assert_eq!(family, "Roboto");
            assert_eq!(weight, 400);
            assert!(!is_italic);
        }
    }

    // register_type1_font tests
    #[test]
    fn test_register_type1_font() {
        let mut doc = Document::with_version("1.7");
        let page_dict = dictionary! {
            "Type" => "Page",
        };
        let page_id = doc.add_object(page_dict);

        let result =
            PDFFontRegistry::register_type1_font(&mut doc, page_id, "Helvetica", "Helvetica");
        assert!(result.is_ok());

        // Verify font was added to page resources
        let page_obj = doc.get_dictionary(page_id).unwrap();
        let resources = page_obj.get(b"Resources").unwrap().as_dict().unwrap();
        let fonts = resources.get(b"Font").unwrap().as_dict().unwrap();
        assert!(fonts.get(b"Helvetica").is_ok());
    }

    // add_font_to_page_resources tests
    #[test]
    fn test_add_font_to_page_resources_creates_resources() {
        let mut doc = Document::with_version("1.7");
        let page_dict = dictionary! {
            "Type" => "Page",
        };
        let page_id = doc.add_object(page_dict);

        let font_dict = dictionary! {
            "Type" => "Font",
            "Subtype" => "Type1",
            "BaseFont" => "Helvetica",
        };
        let font_id = doc.add_object(font_dict);

        let result =
            PDFFontRegistry::add_font_to_page_resources(&mut doc, page_id, "TestFont", font_id);
        assert!(result.is_ok());

        // Verify Resources and Font dictionaries were created
        let page_obj = doc.get_dictionary(page_id).unwrap();
        assert!(page_obj.get(b"Resources").is_ok());
        let resources = page_obj.get(b"Resources").unwrap().as_dict().unwrap();
        assert!(resources.get(b"Font").is_ok());
        let fonts = resources.get(b"Font").unwrap().as_dict().unwrap();
        assert!(fonts.get(b"TestFont").is_ok());
    }

    #[test]
    fn test_add_font_to_page_resources_with_existing_resources() {
        let mut doc = Document::with_version("1.7");
        let page_dict = dictionary! {
            "Type" => "Page",
            "Resources" => dictionary! {
                "Font" => dictionary! {
                    "ExistingFont" => Object::Reference((10, 0)),
                },
            },
        };
        let page_id = doc.add_object(page_dict);

        let font_dict = dictionary! {
            "Type" => "Font",
            "Subtype" => "Type1",
            "BaseFont" => "Times-Roman",
        };
        let font_id = doc.add_object(font_dict);

        let result =
            PDFFontRegistry::add_font_to_page_resources(&mut doc, page_id, "NewFont", font_id);
        assert!(result.is_ok());

        // Verify both fonts are present
        let page_obj = doc.get_dictionary(page_id).unwrap();
        let resources = page_obj.get(b"Resources").unwrap().as_dict().unwrap();
        let fonts = resources.get(b"Font").unwrap().as_dict().unwrap();
        assert!(fonts.get(b"ExistingFont").is_ok());
        assert!(fonts.get(b"NewFont").is_ok());
    }

    // register_fonts integration tests
    #[test]
    fn test_register_fonts_with_standard_fonts() {
        let mut doc = Document::with_version("1.7");
        let page_dict = dictionary! {
            "Type" => "Page",
        };
        let page_id = doc.add_object(page_dict);

        let registry = PDFFontRegistry::new();
        let mut fonts = HashSet::new();
        fonts.insert("Helvetica".to_string());
        fonts.insert("Times-Roman".to_string());
        fonts.insert("Courier".to_string());

        let result = registry.register_fonts(&mut doc, page_id, &fonts);
        assert!(result.is_ok());

        // Verify all fonts were registered
        let page_obj = doc.get_dictionary(page_id).unwrap();
        let resources = page_obj.get(b"Resources").unwrap().as_dict().unwrap();
        let font_dict = resources.get(b"Font").unwrap().as_dict().unwrap();
        assert!(font_dict.get(b"Helvetica").is_ok());
        assert!(font_dict.get(b"Times-Roman").is_ok());
        assert!(font_dict.get(b"Courier").is_ok());
    }

    #[test]
    fn test_collect_fonts_with_nested_containers() {
        let mut style = StyleDeclaration::default();
        style.text.font_family = Some("Times".to_string());
        let layout = LayoutStructure {
            pages: vec![Page {
                page_number: 1,
                boxes: vec![LayoutBox {
                    x: 0.0,
                    y: 0.0,
                    width: 200.0,
                    height: 100.0,
                    content: BoxContent::Container(vec![LayoutBox {
                        x: 10.0,
                        y: 10.0,
                        width: 180.0,
                        height: 20.0,
                        content: BoxContent::Text(vec![TextLine::from("Nested text")]),
                        style,
                        element_type: None,
                    }]),
                    style: StyleDeclaration::default(),
                    element_type: None,
                }],
            }],
            page_height: 792.0,
            page_width: 612.0,
        };

        let fonts = PDFFontRegistry::collect_fonts_from_layout(&layout);
        assert!(fonts.contains("Times-Roman")); // map_web_safe_font maps "Times" to "Times-Roman"
        assert!(fonts.contains("Helvetica")); // Always includes default
    }

    #[test]
    fn test_collect_fonts_with_font_weights() {
        use layout_types::{FontStyle, FontWeight};
        let mut style_bold = StyleDeclaration::default();
        style_bold.text.font_family = Some("Helvetica".to_string());
        style_bold.text.font_weight = Some(FontWeight::Bold);
        let mut style_italic = StyleDeclaration::default();
        style_italic.text.font_family = Some("Helvetica".to_string());
        style_italic.text.font_style = Some(FontStyle::Italic);
        let layout = LayoutStructure {
            pages: vec![Page {
                page_number: 1,
                boxes: vec![
                    LayoutBox {
                        x: 0.0,
                        y: 0.0,
                        width: 100.0,
                        height: 20.0,
                        content: BoxContent::Text(vec![TextLine::from("Bold text")]),
                        style: style_bold,
                        element_type: None,
                    },
                    LayoutBox {
                        x: 0.0,
                        y: 25.0,
                        width: 100.0,
                        height: 20.0,
                        content: BoxContent::Text(vec![TextLine::from("Italic text")]),
                        style: style_italic,
                        element_type: None,
                    },
                ],
            }],
            page_height: 792.0,
            page_width: 612.0,
        };

        let fonts = PDFFontRegistry::collect_fonts_from_layout(&layout);
        assert!(fonts.contains("Helvetica-Bold"));
        assert!(fonts.contains("Helvetica-Oblique"));
    }
}
