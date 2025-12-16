//! Embedded Standard Fonts for PDF/A Compliance
//!
//! PDF/A-1b requires ALL fonts to be embedded, including the Standard 14 fonts
//! (Helvetica, Times, Courier, etc.) that are normally present in PDF readers.
//!
//! This module provides Inter fonts embedded directly in the binary for PDF/A
//! compliance. Inter is a typeface designed for computer screens with a tall
//! x-height for excellent readability.
//!
//! # Font Mapping
//!
//! - Helvetica → Inter Regular
//! - Helvetica-Bold → Inter Bold
//! - Helvetica-Oblique → Inter Italic
//! - Helvetica-BoldOblique → Inter Bold Italic
//!
//! # License
//!
//! Inter: SIL Open Font License 1.1
//! Source: https://github.com/rsms/inter

use crate::error::PDFError;
use font_toolkit::embedding::embed_truetype_font;
use layout_types::{FontStyle, FontWeight};

/// Inter Regular
const INTER_REGULAR: &[u8] = include_bytes!("../fonts/Inter-Regular.ttf");

/// Inter Bold
const INTER_BOLD: &[u8] = include_bytes!("../fonts/Inter-Bold.ttf");

/// Inter Italic
const INTER_ITALIC: &[u8] = include_bytes!("../fonts/Inter-Italic.ttf");

/// Inter Bold Italic
const INTER_BOLD_ITALIC: &[u8] = include_bytes!("../fonts/Inter-BoldItalic.ttf");

/// Embeds a Standard 14 font replacement for PDF/A compliance.
///
/// For PDF/A-1b, even the Standard 14 fonts must be embedded. This function
/// embeds Inter fonts based on the requested weight and style.
///
/// # Arguments
///
/// * `doc` - Mutable reference to the PDF document
/// * `weight` - Font weight (Normal, Bold)
/// * `style` - Font style (Normal, Italic)
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
/// let font_id = embed_standard_font(&mut doc, FontWeight::Bold, FontStyle::Normal).unwrap();
/// ```
pub fn embed_standard_font(
    doc: &mut lopdf::Document,
    weight: FontWeight,
    style: FontStyle,
) -> Result<(u32, u16), PDFError> {
    // Select appropriate Inter variant
    // Bolder maps to Bold, Lighter maps to Normal (no actual Lighter variant)
    // Oblique maps to Italic (Inter doesn't have separate oblique)
    let (font_bytes, family_name) = match (weight, style) {
        (FontWeight::Bold | FontWeight::Bolder, FontStyle::Italic | FontStyle::Oblique) => {
            (INTER_BOLD_ITALIC, "Inter-BoldItalic")
        }
        (FontWeight::Bold | FontWeight::Bolder, FontStyle::Normal) => (INTER_BOLD, "Inter-Bold"),
        (FontWeight::Normal | FontWeight::Lighter, FontStyle::Italic | FontStyle::Oblique) => {
            (INTER_ITALIC, "Inter-Italic")
        }
        (FontWeight::Normal | FontWeight::Lighter, FontStyle::Normal) => (INTER_REGULAR, "Inter"),
    };

    // Convert weight/style for embedding
    let is_italic = matches!(style, FontStyle::Italic | FontStyle::Oblique);
    let weight_value = match weight {
        FontWeight::Bold | FontWeight::Bolder => 700,
        FontWeight::Lighter => 300,
        FontWeight::Normal => 400,
    };

    // Embed the full TrueType font
    let embedded = embed_truetype_font(doc, font_bytes, family_name, weight_value, is_italic)
        .map_err(|e| PDFError::FontError(format!("Failed to embed standard font: {}", e)))?;

    Ok(embedded.font_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use lopdf::Document;

    #[test]
    fn test_embed_standard_font_regular() {
        let mut doc = Document::with_version("1.4");
        let result = embed_standard_font(&mut doc, FontWeight::Normal, FontStyle::Normal);
        assert!(result.is_ok());
    }

    #[test]
    fn test_embed_standard_font_bold() {
        let mut doc = Document::with_version("1.4");
        let result = embed_standard_font(&mut doc, FontWeight::Bold, FontStyle::Normal);
        assert!(result.is_ok());
    }

    #[test]
    fn test_embed_standard_font_italic() {
        let mut doc = Document::with_version("1.4");
        let result = embed_standard_font(&mut doc, FontWeight::Normal, FontStyle::Italic);
        assert!(result.is_ok());
    }

    #[test]
    fn test_embed_standard_font_bold_italic() {
        let mut doc = Document::with_version("1.4");
        let result = embed_standard_font(&mut doc, FontWeight::Bold, FontStyle::Italic);
        assert!(result.is_ok());
    }
}
