//! ABOUTME: TrueType Font Embedding for PDF
//! ABOUTME: Embeds TrueType fonts as CIDFont (Type 0 Composite Font) following ISO 32000-2

mod cid_font;
mod cid_mapping;
mod compression;
mod constants;
mod pdf_objects;
mod to_unicode;

use lopdf::{Document, ObjectId};
use std::collections::BTreeMap;
use ttf_parser::Face;

pub use cid_mapping::CidToGidMap;

/// Font embedding errors
#[derive(Debug, thiserror::Error)]
pub enum EmbedError {
    #[error("Failed to parse font: {0}")]
    ParseError(String),

    #[error("Failed to extract font metrics: {0}")]
    MetricsError(String),

    #[error("Failed to create PDF object: {0}")]
    PDFError(String),

    #[error("Font embedding not supported for this font type")]
    UnsupportedFont,
}

/// Embedded font information
pub struct EmbeddedFont {
    /// PDF resource name (e.g., "/F3", "/F4")
    pub resource_name: String,

    /// Font object ID in PDF
    pub font_id: ObjectId,

    /// Font family name
    pub family: String,

    /// Font weight
    pub weight: u16,

    /// Font style
    pub is_italic: bool,
}

/// Embeds a TrueType font into a PDF document as a CIDFont
///
/// # Arguments
/// * `doc` - PDF document to embed font into
/// * `font_bytes` - TrueType font file bytes
/// * `font_name` - Font family name (e.g., "Roboto", "Open Sans")
/// * `weight` - Font weight (400, 700, etc.)
/// * `is_italic` - Whether font is italic
/// * `cid_mapping` - Optional CID→GID mapping for subsetted fonts
///   - `None`: Full font - mapping built from font's cmap table
///   - `Some(mapping)`: Subsetted font - uses provided mapping, adds subset prefix
///
/// # Returns
/// Embedded font information with PDF resource name
///
/// # PDF Structure Created
/// ```text
/// Type 0 Font (top-level)
///   |- BaseFont: /FontName-Weight[-Italic]
///   |- Encoding: Identity-H
///   |- ToUnicode: CMap stream
///   +- DescendantFonts: [CIDFont]
///       +- CIDFont Type 2 (TrueType)
///           |- CIDSystemInfo: {Adobe, Identity, 0}
///           +- FontDescriptor
///               |- FontName, Flags, FontBBox, etc.
///               +- FontFile2: TrueType stream
/// ```
///
/// # Examples
///
/// ## Embedding a full font
/// ```no_run
/// use font_toolkit::embedding::embed_truetype_font;
/// use lopdf::Document;
///
/// let font_bytes = std::fs::read("font.ttf").unwrap();
/// let mut doc = Document::with_version("1.7");
///
/// let embedded = embed_truetype_font(
///     &mut doc,
///     &font_bytes,
///     "Roboto",
///     400,
///     false,
///     None,  // Build mapping from font
/// ).unwrap();
/// ```
///
/// ## Embedding a subsetted font
/// ```no_run
/// use font_toolkit::embedding::embed_truetype_font;
/// use font_toolkit::subset_font_core;
/// use lopdf::Document;
///
/// let font_bytes = std::fs::read("font.ttf").unwrap();
/// let mut doc = Document::with_version("1.7");
///
/// // Subset the font first
/// let (subset_bytes, metrics) = subset_font_core(&font_bytes, None, "Hello", true).unwrap();
/// let mapping = metrics.unwrap().cid_to_new_gid;
///
/// let embedded = embed_truetype_font(
///     &mut doc,
///     &subset_bytes,
///     "Roboto",
///     400,
///     false,
///     Some(&mapping),  // Use subsetter's mapping
/// ).unwrap();
/// ```
pub fn embed_truetype_font(
    doc: &mut Document,
    font_bytes: &[u8],
    font_name: &str,
    weight: u16,
    is_italic: bool,
    cid_mapping: Option<&BTreeMap<u32, u16>>,
) -> Result<EmbeddedFont, EmbedError> {
    // Parse font to extract metrics
    let face =
        Face::parse(font_bytes, 0).map_err(|e| EmbedError::ParseError(format!("{:?}", e)))?;

    // Determine if this is a subsetted font
    let is_subsetted = cid_mapping.is_some();

    // Get or build CID→GID mapping
    // For subsetted fonts: MUST use subsetter's mapping because subset font's cmap is minimal
    // For full fonts: build from font's cmap table
    let owned_mapping;
    let cid_to_gid = match cid_mapping {
        Some(mapping) => mapping,
        None => {
            owned_mapping = cid_mapping::build_cid_mapping_from_font(&face);
            &owned_mapping
        }
    };

    // Generate PostScript font name
    let base_ps_name = pdf_objects::generate_postscript_name(font_name, weight, is_italic);

    // Add subset prefix if font is subsetted (e.g., "ABCDEF+FontName")
    let ps_font_name = if is_subsetted {
        format!("{}+{}", pdf_objects::generate_subset_prefix(), base_ps_name)
    } else {
        base_ps_name
    };

    // Create FontFile2 stream (compressed TrueType)
    let font_file_id = pdf_objects::create_font_file_stream(doc, font_bytes)?;

    // Create CIDSet stream for subsetted fonts (required by PDF/A-1b clause 6.3.5)
    // Uses the same cid_to_gid mapping as CIDToGIDMap for consistency.
    let cid_set_id = if is_subsetted {
        Some(cid_font::create_cid_set_stream(doc, cid_to_gid)?)
    } else {
        None
    };

    // Create FontDescriptor
    let font_descriptor_id =
        pdf_objects::create_font_descriptor(doc, &ps_font_name, &face, font_file_id, cid_set_id)?;

    // Create ToUnicode CMap (for text extraction)
    let to_unicode_id = to_unicode::create_to_unicode_cmap(doc, cid_to_gid)?;

    // Create CIDFont (DescendantFont)
    let cid_font_id =
        cid_font::create_cid_font(doc, &ps_font_name, font_descriptor_id, &face, cid_to_gid)?;

    // Create Type 0 Font (top-level)
    let font_id = pdf_objects::create_type0_font(doc, &ps_font_name, cid_font_id, to_unicode_id)?;

    // Generate unique resource name
    let resource_name = format!("/F{}", doc.objects.len());

    Ok(EmbeddedFont {
        resource_name,
        font_id,
        family: font_name.to_string(),
        weight,
        is_italic,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    const ROBOTO_TTF: &[u8] =
        include_bytes!("../../../../../test-fixtures/fonts/Roboto-Regular.ttf");

    #[test]
    fn test_embed_full_font() {
        let mut doc = Document::with_version("1.7");
        let result = embed_truetype_font(&mut doc, ROBOTO_TTF, "Roboto", 400, false, None);
        assert!(result.is_ok());

        let embedded = result.unwrap();
        assert_eq!(embedded.family, "Roboto");
        assert_eq!(embedded.weight, 400);
        assert!(!embedded.is_italic);
    }

    #[test]
    fn test_embed_with_custom_mapping() {
        let mut doc = Document::with_version("1.7");

        // Create a simple mapping
        let mut mapping = BTreeMap::new();
        mapping.insert(0x41, 1u16); // 'A'
        mapping.insert(0x42, 2u16); // 'B'

        let result =
            embed_truetype_font(&mut doc, ROBOTO_TTF, "Roboto", 400, false, Some(&mapping));
        assert!(result.is_ok());
    }

    #[test]
    fn test_embed_invalid_font() {
        let mut doc = Document::with_version("1.7");
        let result = embed_truetype_font(&mut doc, b"not a font", "Test", 400, false, None);
        assert!(matches!(result, Err(EmbedError::ParseError(_))));
    }
}
