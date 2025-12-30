//! Embedded Standard Fonts for PDF/A Compliance
//!
//! PDF/A-1b requires ALL fonts to be embedded, including the Standard 14 fonts
//! (Helvetica, Times, Courier, etc.) that are normally present in PDF readers.
//!
//! This module provides Karla fonts embedded directly in the binary for PDF/A
//! compliance. Karla is a grotesque sans-serif with excellent readability.
//!
//! # Font Mapping
//!
//! - Helvetica → Karla Regular
//! - Helvetica-Bold → Karla Bold
//! - Helvetica-Oblique → Karla Italic
//! - Helvetica-BoldOblique → Karla Bold Italic
//!
//! # License
//!
//! Karla: SIL Open Font License 1.1
//! Source: https://github.com/googlefonts/karla

use crate::error::PDFError;
use font_toolkit::embedding::embed_truetype_font;
use font_toolkit::strip_hinting_tables;
#[cfg(feature = "advanced-fonts")]
use font_toolkit::subsetter::subset_font_core;
use layout_types::{FontStyle, FontWeight};

/// Karla Regular
const KARLA_REGULAR: &[u8] = include_bytes!("../fonts/Karla-Regular.ttf");

/// Karla Bold
const KARLA_BOLD: &[u8] = include_bytes!("../fonts/Karla-Bold.ttf");

/// Karla Italic
const KARLA_ITALIC: &[u8] = include_bytes!("../fonts/Karla-Italic.ttf");

/// Karla Bold Italic
const KARLA_BOLD_ITALIC: &[u8] = include_bytes!("../fonts/Karla-BoldItalic.ttf");

/// Embeds a Standard 14 font replacement for PDF/A compliance.
///
/// For PDF/A-1b, even the Standard 14 fonts must be embedded. This function
/// embeds Karla fonts based on the requested weight and style.
///
/// # Arguments
///
/// * `doc` - Mutable reference to the PDF document
/// * `weight` - Font weight (Normal, Bold)
/// * `style` - Font style (Normal, Italic)
/// * `text_content` - Text content for font subsetting (only glyphs used will be embedded)
///
/// # Returns
///
/// Object ID of the embedded font for use in PDF content streams
///
/// # Examples
///
/// ```no_run
/// use pdf_generator::standard_fonts::embed_standard_font;
/// use layout_types::{FontWeight, FontStyle};
/// use lopdf::Document;
///
/// let mut doc = Document::with_version("1.4");
/// let font_id = embed_standard_font(&mut doc, FontWeight::Bold, FontStyle::Normal, "Hello").unwrap();
/// ```
pub fn embed_standard_font(
    doc: &mut lopdf::Document,
    weight: FontWeight,
    style: FontStyle,
    #[cfg_attr(not(feature = "advanced-fonts"), allow(unused_variables))] text_content: &str,
) -> Result<(u32, u16), PDFError> {
    // Select appropriate Karla variant
    // Bolder maps to Bold, Lighter maps to Normal (no actual Lighter variant)
    // Oblique maps to Italic (Karla doesn't have separate oblique)
    let (font_bytes, family_name) = match (weight, style) {
        (FontWeight::Bold | FontWeight::Bolder, FontStyle::Italic | FontStyle::Oblique) => {
            (KARLA_BOLD_ITALIC, "Karla-BoldItalic")
        }
        (FontWeight::Bold | FontWeight::Bolder, FontStyle::Normal) => (KARLA_BOLD, "Karla-Bold"),
        (FontWeight::Normal | FontWeight::Lighter, FontStyle::Italic | FontStyle::Oblique) => {
            (KARLA_ITALIC, "Karla-Italic")
        }
        (FontWeight::Normal | FontWeight::Lighter, FontStyle::Normal) => (KARLA_REGULAR, "Karla"),
    };

    // Convert weight/style for embedding
    let is_italic = matches!(style, FontStyle::Italic | FontStyle::Oblique);
    let weight_value = match weight {
        FontWeight::Bold | FontWeight::Bolder => 700,
        FontWeight::Lighter => 300,
        FontWeight::Normal => 400,
    };

    // Subset the font if advanced-fonts feature is enabled
    #[cfg(feature = "advanced-fonts")]
    let (final_bytes, cid_to_new_gid): (Vec<u8>, std::collections::BTreeMap<u32, u16>) =
        match subset_font_core(font_bytes, None, text_content, true) {
            Ok((bytes, Some(metrics))) => {
                eprintln!(
                    "[PDF] Subsetted {}: {} bytes -> {} bytes ({:.1}% reduction)",
                    family_name,
                    font_bytes.len(),
                    bytes.len(),
                    (1.0 - bytes.len() as f64 / font_bytes.len() as f64) * 100.0
                );
                (bytes, metrics.cid_to_new_gid)
            }
            Ok((bytes, None)) => {
                // Metrics should always be returned when return_metrics=true, but handle anyway
                eprintln!(
                    "WARNING: Subsetting succeeded but no metrics for {}. Using empty mapping.",
                    family_name
                );
                (bytes, std::collections::BTreeMap::new())
            }
            Err(e) => {
                eprintln!(
                    "WARNING: Font subsetting failed for {}: {}. Using full font.",
                    family_name, e
                );
                (font_bytes.to_vec(), std::collections::BTreeMap::new())
            }
        };

    #[cfg(not(feature = "advanced-fonts"))]
    let final_bytes: Vec<u8> = font_bytes.to_vec();

    // Strip hinting tables (not needed for PDF, saves ~30-60% per font)
    let optimized_bytes = strip_hinting_tables(&final_bytes);

    // Embed the font
    #[cfg(feature = "advanced-fonts")]
    let embedded = embed_truetype_font(
        doc,
        &optimized_bytes,
        family_name,
        weight_value,
        is_italic,
        Some(&cid_to_new_gid),
    )
    .map_err(|e| PDFError::FontError(format!("Failed to embed standard font: {}", e)))?;

    #[cfg(not(feature = "advanced-fonts"))]
    let embedded = embed_truetype_font(
        doc,
        &optimized_bytes,
        family_name,
        weight_value,
        is_italic,
        None,
    )
    .map_err(|e| PDFError::FontError(format!("Failed to embed standard font: {}", e)))?;

    Ok(embedded.font_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use lopdf::Document;

    const TEST_TEXT: &str = "Hello World";

    #[test]
    fn test_embed_standard_font_regular() {
        let mut doc = Document::with_version("1.4");
        let result =
            embed_standard_font(&mut doc, FontWeight::Normal, FontStyle::Normal, TEST_TEXT);
        assert!(result.is_ok());
    }

    #[test]
    fn test_embed_standard_font_bold() {
        let mut doc = Document::with_version("1.4");
        let result = embed_standard_font(&mut doc, FontWeight::Bold, FontStyle::Normal, TEST_TEXT);
        assert!(result.is_ok());
    }

    #[test]
    fn test_embed_standard_font_italic() {
        let mut doc = Document::with_version("1.4");
        let result =
            embed_standard_font(&mut doc, FontWeight::Normal, FontStyle::Italic, TEST_TEXT);
        assert!(result.is_ok());
    }

    #[test]
    fn test_embed_standard_font_bold_italic() {
        let mut doc = Document::with_version("1.4");
        let result = embed_standard_font(&mut doc, FontWeight::Bold, FontStyle::Italic, TEST_TEXT);
        assert!(result.is_ok());
    }
}
