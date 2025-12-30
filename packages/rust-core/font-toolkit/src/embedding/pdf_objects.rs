//! ABOUTME: PDF object creation for font embedding
//! ABOUTME: FontFile2, FontDescriptor, Type0 Font, and PostScript name generation

use lopdf::{dictionary, Document, Object, ObjectId, Stream};
use std::sync::atomic::{AtomicU64, Ordering};
use ttf_parser::Face;

use super::compression::compress_bytes;
use super::constants::{
    DEFAULT_STEM_V, FONT_FLAGS_SYMBOLIC, HASH_MULTIPLIER_1, HASH_MULTIPLIER_2, STEM_V_MAX,
    STEM_V_MIN, SUBSET_PREFIX_LENGTH, WEIGHT_BOLD_MIN, WEIGHT_LIGHT_MAX, WEIGHT_MEDIUM_MAX,
    WEIGHT_REGULAR_MAX,
};
use super::EmbedError;

/// Creates FontFile2 stream (compressed TrueType bytes)
pub fn create_font_file_stream(
    doc: &mut Document,
    font_bytes: &[u8],
) -> Result<ObjectId, EmbedError> {
    let compressed = compress_bytes(font_bytes);

    let stream = Stream::new(
        dictionary! {
            "Length" => compressed.len() as i64,
            "Length1" => font_bytes.len() as i64, // Uncompressed size
            "Filter" => "FlateDecode",
        },
        compressed,
    );

    Ok(doc.add_object(stream))
}

/// Creates FontDescriptor dictionary
///
/// # Arguments
/// * `doc` - PDF document
/// * `font_name` - PostScript font name (may include subset prefix)
/// * `face` - Parsed font face for extracting metrics
/// * `font_file_id` - Reference to FontFile2 stream
/// * `cid_set_id` - Optional reference to CIDSet stream (required for PDF/A-1b subsetted fonts)
pub fn create_font_descriptor(
    doc: &mut Document,
    font_name: &str,
    face: &Face,
    font_file_id: ObjectId,
    cid_set_id: Option<ObjectId>,
) -> Result<ObjectId, EmbedError> {
    let bbox = face.global_bounding_box();
    let ascent = face.ascender();
    let descent = face.descender();
    let cap_height = face.capital_height().unwrap_or(ascent);
    let italic_angle = face.italic_angle();
    let stem_v = calculate_stem_v(face);

    let mut descriptor = dictionary! {
        "Type" => "FontDescriptor",
        "FontName" => Object::Name(font_name.as_bytes().to_vec()),
        "Flags" => FONT_FLAGS_SYMBOLIC,
        "FontBBox" => Object::Array(vec![
            Object::Integer(bbox.x_min as i64),
            Object::Integer(bbox.y_min as i64),
            Object::Integer(bbox.x_max as i64),
            Object::Integer(bbox.y_max as i64),
        ]),
        "ItalicAngle" => Object::Real(italic_angle),
        "Ascent" => Object::Integer(ascent as i64),
        "Descent" => Object::Integer(descent as i64),
        "CapHeight" => Object::Integer(cap_height as i64),
        "StemV" => Object::Integer(stem_v),
        "FontFile2" => Object::Reference(font_file_id),
    };

    // Add CIDSet for PDF/A-1b compliance (required for subsetted CIDFonts)
    if let Some(cid_set) = cid_set_id {
        descriptor.set("CIDSet", Object::Reference(cid_set));
    }

    Ok(doc.add_object(descriptor))
}

/// Creates Type 0 Font dictionary (top-level composite font)
pub fn create_type0_font(
    doc: &mut Document,
    font_name: &str,
    cid_font_id: ObjectId,
    to_unicode_id: ObjectId,
) -> Result<ObjectId, EmbedError> {
    let type0_font = dictionary! {
        "Type" => "Font",
        "Subtype" => "Type0",
        "BaseFont" => Object::Name(font_name.as_bytes().to_vec()),
        "Encoding" => "Identity-H",
        "DescendantFonts" => Object::Array(vec![Object::Reference(cid_font_id)]),
        "ToUnicode" => Object::Reference(to_unicode_id),
    };

    Ok(doc.add_object(type0_font))
}

/// Generates a 6-character uppercase subset prefix
///
/// PDF convention for subsetted fonts is to prefix the font name with
/// 6 random uppercase letters followed by '+' (e.g., "ABCDEF+FontName").
///
/// Uses a counter and hash mixing to generate unique prefixes without
/// requiring system time (which isn't available in WASM).
pub fn generate_subset_prefix() -> String {
    static COUNTER: AtomicU64 = AtomicU64::new(0);

    let count = COUNTER.fetch_add(1, Ordering::Relaxed);

    // Hash mixing for better distribution
    let mut n = count.wrapping_mul(HASH_MULTIPLIER_1);
    n ^= n >> 32;
    n = n.wrapping_mul(HASH_MULTIPLIER_2);

    // Generate uppercase letters (A-Z)
    let mut prefix = String::with_capacity(SUBSET_PREFIX_LENGTH);
    for _ in 0..SUBSET_PREFIX_LENGTH {
        let letter = (n % 26) as u8 + b'A';
        prefix.push(letter as char);
        n /= 26;
    }

    prefix
}

/// Generates PostScript-compatible font name
///
/// Examples:
/// - Roboto, 400, false → "Roboto-Regular"
/// - Roboto, 700, false → "Roboto-Bold"
/// - Open Sans, 400, true → "OpenSans-Italic"
pub fn generate_postscript_name(family: &str, weight: u16, is_italic: bool) -> String {
    // Remove spaces from family name (PostScript doesn't allow spaces)
    let family_no_spaces = family.replace(' ', "");

    let weight_suffix = match weight {
        w if w <= WEIGHT_LIGHT_MAX => "Light",
        w if w <= WEIGHT_REGULAR_MAX => "Regular",
        w if w <= WEIGHT_MEDIUM_MAX => "Medium",
        _ => "Bold",
    };

    if is_italic {
        if weight >= WEIGHT_BOLD_MIN {
            format!("{}-BoldItalic", family_no_spaces)
        } else {
            format!("{}-Italic", family_no_spaces)
        }
    } else if weight >= WEIGHT_BOLD_MIN {
        format!("{}-Bold", family_no_spaces)
    } else {
        format!("{}-{}", family_no_spaces, weight_suffix)
    }
}

/// Calculates StemV (vertical stem width) from font metrics
///
/// Measures the width of typical vertical stems by examining
/// characters like 'I' or 'l'. Falls back to default if measurement fails.
fn calculate_stem_v(face: &Face) -> i64 {
    // Try 'I' (capital i) as it has a clear vertical stem
    if let Some(glyph_id) = face.glyph_index('I') {
        if let Some(bbox) = face.glyph_bounding_box(glyph_id) {
            let width = bbox.x_max - bbox.x_min;
            return (width as i64).clamp(STEM_V_MIN, STEM_V_MAX);
        }
    }

    // Try lowercase 'l' as alternative
    if let Some(glyph_id) = face.glyph_index('l') {
        if let Some(bbox) = face.glyph_bounding_box(glyph_id) {
            let width = bbox.x_max - bbox.x_min;
            return (width as i64).clamp(STEM_V_MIN, STEM_V_MAX);
        }
    }

    DEFAULT_STEM_V
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_postscript_name() {
        assert_eq!(
            generate_postscript_name("Roboto", 400, false),
            "Roboto-Regular"
        );
        assert_eq!(
            generate_postscript_name("Roboto", 700, false),
            "Roboto-Bold"
        );
        assert_eq!(
            generate_postscript_name("Roboto", 400, true),
            "Roboto-Italic"
        );
        assert_eq!(
            generate_postscript_name("Roboto", 700, true),
            "Roboto-BoldItalic"
        );
        assert_eq!(
            generate_postscript_name("Open Sans", 400, false),
            "OpenSans-Regular"
        );
    }

    #[test]
    fn test_generate_subset_prefix_length() {
        let prefix = generate_subset_prefix();
        assert_eq!(prefix.len(), 6);
        assert!(prefix.chars().all(|c| c.is_ascii_uppercase()));
    }

    #[test]
    fn test_generate_subset_prefix_unique() {
        let prefix1 = generate_subset_prefix();
        let prefix2 = generate_subset_prefix();
        assert_ne!(prefix1, prefix2);
    }

    #[test]
    fn test_calculate_stem_v() {
        const ROBOTO_TTF: &[u8] =
            include_bytes!("../../../../../test-fixtures/fonts/Roboto-Regular.ttf");
        let face = Face::parse(ROBOTO_TTF, 0).unwrap();

        let stem_v = calculate_stem_v(&face);

        assert!(
            (STEM_V_MIN..=STEM_V_MAX).contains(&stem_v),
            "StemV should be in range [{}, {}], got {}",
            STEM_V_MIN,
            STEM_V_MAX,
            stem_v
        );
    }
}
