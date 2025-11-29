//! TrueType Font Embedding for PDF
//! Embed TrueType fonts as CIDFont (Type 0 Composite Font)
//!
//! Implements PDF font embedding following ISO 32000-2 (PDF 2.0) specification.
//! Creates Type 0 fonts with CIDFont Type 2 (TrueType) and ToUnicode CMap.

use lopdf::{dictionary, Document, Object, ObjectId, Stream};
use ttf_parser::Face;

use crate::truetype::extract_glyph_widths;

/// Font embedding errors
///
/// # Examples
///
/// ## ParseError
/// Returned when the font file cannot be parsed as a valid TrueType font.
///
/// ```
/// use font_toolkit::embedding::{embed_truetype_font, EmbedError};
/// use lopdf::Document;
///
/// let invalid_font = b"not a valid font file";
/// let mut doc = Document::with_version("1.7");
///
/// match embed_truetype_font(&mut doc, invalid_font, "Test", 400, false) {
///     Err(EmbedError::ParseError(_msg)) => {
///         // Expected: ParseError for invalid font data
///     }
///     _ => panic!("Expected ParseError"),
/// }
/// ```
///
/// ## MetricsError
/// Returned when font metrics cannot be extracted (rare, typically indicates corrupted font).
///
/// ```no_run
/// # use font_toolkit::embedding::{embed_truetype_font, EmbedError};
/// # use lopdf::Document;
/// # let mut doc = Document::with_version("1.7");
/// # let corrupted_font = b"corrupted font data";
/// // This error is rare and difficult to trigger in tests
/// match embed_truetype_font(&mut doc, corrupted_font, "Test", 400, false) {
///     Err(EmbedError::MetricsError(msg)) => {
///         eprintln!("Failed to extract metrics: {}", msg);
///     }
///     _ => {}
/// }
/// ```
///
/// ## PDFError
/// Returned when PDF object creation fails (typically indicates lopdf library issue).
///
/// ```no_run
/// # use font_toolkit::embedding::{embed_truetype_font, EmbedError};
/// # use lopdf::Document;
/// # let mut doc = Document::with_version("1.7");
/// # let valid_font = b"valid font data";
/// // This error is internal and rarely exposed to users
/// match embed_truetype_font(&mut doc, valid_font, "Test", 400, false) {
///     Err(EmbedError::PDFError(msg)) => {
///         eprintln!("PDF creation failed: {}", msg);
///     }
///     Ok(embedded) => {
///         println!("Font embedded as {}", embedded.resource_name);
///     }
///     _ => {}
/// }
/// ```
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
pub fn embed_truetype_font(
    doc: &mut Document,
    font_bytes: &[u8],
    font_name: &str,
    weight: u16,
    is_italic: bool,
) -> Result<EmbeddedFont, EmbedError> {
    // Parse font to extract metrics
    let face =
        Face::parse(font_bytes, 0).map_err(|e| EmbedError::ParseError(format!("{:?}", e)))?;

    // Generate PostScript font name
    let ps_font_name = generate_postscript_name(font_name, weight, is_italic);

    // Create FontFile2 stream (compressed TrueType)
    let font_file_id = create_font_file_stream(doc, font_bytes)?;

    // Create FontDescriptor
    let font_descriptor_id = create_font_descriptor(doc, &ps_font_name, &face, font_file_id)?;

    // Create ToUnicode CMap (for text extraction)
    let to_unicode_id = create_to_unicode_cmap(doc, &face)?;

    // Create CIDFont (DescendantFont)
    let cid_font_id = create_cid_font(doc, &ps_font_name, font_descriptor_id, &face)?;

    // Create Type 0 Font (top-level)
    let font_id = create_type0_font(doc, &ps_font_name, cid_font_id, to_unicode_id)?;

    // Generate unique resource name (will be added to page resources later)
    let resource_name = format!("/F{}", doc.objects.len());

    Ok(EmbeddedFont {
        resource_name,
        font_id,
        family: font_name.to_string(),
        weight,
        is_italic,
    })
}

/// Generates PostScript-compatible font name
///
/// Examples:
/// - Roboto, 400, false → "Roboto-Regular"
/// - Roboto, 700, false → "Roboto-Bold"
/// - Open Sans, 400, true → "OpenSans-Italic"
fn generate_postscript_name(family: &str, weight: u16, is_italic: bool) -> String {
    // Remove spaces from family name (PostScript doesn't allow spaces)
    let family_no_spaces = family.replace(' ', "");

    let weight_suffix = match weight {
        w if w <= 300 => "Light",
        w if w <= 500 => "Regular",
        w if w <= 600 => "Medium",
        _ => "Bold",
    };

    if is_italic {
        if weight >= 600 {
            format!("{}-BoldItalic", family_no_spaces)
        } else {
            format!("{}-Italic", family_no_spaces)
        }
    } else if weight >= 600 {
        format!("{}-Bold", family_no_spaces)
    } else {
        format!("{}-{}", family_no_spaces, weight_suffix)
    }
}

/// Creates FontFile2 stream (compressed TrueType bytes)
fn create_font_file_stream(doc: &mut Document, font_bytes: &[u8]) -> Result<ObjectId, EmbedError> {
    // Compress font bytes with FlateDecode (zlib)
    let compressed = compress_font_bytes(font_bytes);

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
fn create_font_descriptor(
    doc: &mut Document,
    font_name: &str,
    face: &Face,
    font_file_id: ObjectId,
) -> Result<ObjectId, EmbedError> {
    // Extract font metrics
    let bbox = face.global_bounding_box();
    let ascent = face.ascender();
    let descent = face.descender();
    let cap_height = face.capital_height().unwrap_or(ascent);
    let italic_angle = face.italic_angle();

    // StemV: Calculate from typical character width, fallback to 80
    let stem_v = calculate_stem_v(face);

    // Flags: 32 = Symbolic font (non-standard encoding)
    let flags = 32;

    let descriptor = dictionary! {
        "Type" => "FontDescriptor",
        "FontName" => Object::Name(font_name.as_bytes().to_vec()),
        "Flags" => flags,
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

    Ok(doc.add_object(descriptor))
}

/// Creates CIDFont dictionary (DescendantFont)
///
/// # PDF/A-1b Compliance (Clause 6.3.6)
/// Extracts actual glyph widths from the TrueType font's hmtx table and
/// includes them in the W (widths) array. This ensures glyph widths in the
/// embedded font match the font dictionary, as required by ISO 19005-1:2005.
///
/// # CIDFont with Identity-H Encoding
/// For Identity-H encoding, CIDs are Unicode codepoints. We create a
/// CIDToGIDMap stream that maps CIDs to glyph IDs, allowing the font's
/// actual glyph IDs to be used while text uses Unicode codepoints.
fn create_cid_font(
    doc: &mut Document,
    font_name: &str,
    font_descriptor_id: ObjectId,
    face: &Face,
) -> Result<ObjectId, EmbedError> {
    // Extract actual glyph widths from font (hmtx table)
    let widths = extract_glyph_widths(face);

    // Use .notdef width (GID 0) as default width for unmapped CIDs
    // This ensures unmapped CIDs (like control characters) have correct width
    let default_width = widths.first().copied().unwrap_or(1000) as i64;

    // Build W array and CIDToGIDMap for Identity-H encoding
    // W array maps CIDs (Unicode) to widths
    // CIDToGIDMap maps CIDs (Unicode) to glyph IDs
    let (w_array, cid_to_gid_map_id) = build_cid_font_data(doc, face, &widths)?;

    let mut cid_font = dictionary! {
        "Type" => "Font",
        "Subtype" => "CIDFontType2", // TrueType-based CIDFont
        "BaseFont" => Object::Name(font_name.as_bytes().to_vec()),
        "CIDSystemInfo" => dictionary! {
            "Registry" => Object::string_literal("Adobe"),
            "Ordering" => Object::string_literal("Identity"),
            "Supplement" => 0,
        },
        "FontDescriptor" => Object::Reference(font_descriptor_id),
        "DW" => default_width as i64, // Default width for missing glyphs
        "CIDToGIDMap" => Object::Reference(cid_to_gid_map_id), // PDF/A-1b: CID→GID mapping stream
    };

    // Always add W array for PDF/A-1b compliance
    cid_font.set(
        "W",
        Object::Array(w_array.into_iter().map(Object::Integer).collect()),
    );

    Ok(doc.add_object(cid_font))
}

/// Creates Type 0 Font dictionary (top-level)
fn create_type0_font(
    doc: &mut Document,
    font_name: &str,
    cid_font_id: ObjectId,
    to_unicode_id: ObjectId,
) -> Result<ObjectId, EmbedError> {
    let type0_font = dictionary! {
        "Type" => "Font",
        "Subtype" => "Type0",
        "BaseFont" => Object::Name(font_name.as_bytes().to_vec()),
        "Encoding" => "Identity-H", // Horizontal identity mapping
        "DescendantFonts" => Object::Array(vec![Object::Reference(cid_font_id)]),
        "ToUnicode" => Object::Reference(to_unicode_id),
    };

    Ok(doc.add_object(type0_font))
}

/// Creates ToUnicode CMap for text extraction
fn create_to_unicode_cmap(doc: &mut Document, face: &Face) -> Result<ObjectId, EmbedError> {
    // Generate full CMap based on font's character mappings
    let cmap_content = generate_full_cmap(face);
    let compressed = compress_cmap(&cmap_content);

    let stream = Stream::new(
        dictionary! {
            "Length" => compressed.len() as i64,
            "Filter" => "FlateDecode",
        },
        compressed,
    );

    Ok(doc.add_object(stream))
}

/// Generates ToUnicode CMap for Identity-H encoding
///
/// With Identity-H encoding, CIDs in the content stream are Unicode codepoints.
/// The ToUnicode CMap maps CID → Unicode for text extraction. Since CID = Unicode
/// with Identity-H, this is effectively an identity mapping for all characters
/// that exist in the font.
///
/// # Arguments
/// * `face` - Parsed font face (used to determine which Unicode codepoints have glyphs)
///
/// # Returns
/// Complete ToUnicode CMap as PostScript string
///
/// # CMap Structure
/// ```postscript
/// /CIDInit /ProcSet findresource begin
/// 12 dict begin
/// begincmap
/// /CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def
/// /CMapName /Adobe-Identity-UCS def
/// /CMapType 2 def
/// 1 begincodespacerange
/// <0000> <FFFF>
/// endcodespacerange
/// N beginbfchar
/// <CID1> <Unicode1>   (where CID = Unicode for Identity-H)
/// <CID2> <Unicode2>
/// ...
/// endbfchar
/// endcmap
/// CMapName currentdict /CMap defineresource pop
/// end
/// end
/// ```
fn generate_full_cmap(face: &Face) -> String {
    use std::fmt::Write as FmtWrite;

    // Collect all Unicode codepoints that have glyphs in this font
    let mut unicode_codepoints: Vec<u32> = Vec::new();

    for codepoint in 0x0020..=0xFFFF {
        if let Some(ch) = char::from_u32(codepoint) {
            if face.glyph_index(ch).is_some() {
                unicode_codepoints.push(codepoint);
            }
        }
    }

    // Pre-allocate capacity: header (~200) + mappings (20 bytes each) + footer (~70)
    let estimated_size = 200 + (unicode_codepoints.len() * 20) + 70;
    let mut cmap = String::with_capacity(estimated_size);

    // Build CMap header
    cmap.push_str(
        "/CIDInit /ProcSet findresource begin\n\
         12 dict begin\n\
         begincmap\n\
         /CIDSystemInfo\n\
         << /Registry (Adobe)\n\
            /Ordering (UCS)\n\
            /Supplement 0\n\
         >> def\n\
         /CMapName /Adobe-Identity-UCS def\n\
         /CMapType 2 def\n\
         1 begincodespacerange\n\
         <0000> <FFFF>\n\
         endcodespacerange\n",
    );

    // Add character mappings
    // For Identity-H encoding: CID = Unicode, so mapping is <Unicode> <Unicode>
    if !unicode_codepoints.is_empty() {
        let _ = writeln!(&mut cmap, "{} beginbfchar", unicode_codepoints.len());

        for codepoint in unicode_codepoints {
            // Format: <CID_hex> <Unicode_hex>
            // With Identity-H, CID = Unicode, so both values are the same
            let _ = writeln!(&mut cmap, "<{:04X}> <{:04X}>", codepoint, codepoint);
        }

        cmap.push_str("endbfchar\n");
    }

    // CMap footer
    cmap.push_str(
        "endcmap\n\
         CMapName currentdict /CMap defineresource pop\n\
         end\n\
         end",
    );

    cmap
}

/// Calculates StemV (vertical stem width) from font metrics
///
/// Attempts to measure the width of typical vertical stems by examining
/// characters like 'I' or 'l'. Falls back to 80 if measurement fails.
///
/// # Arguments
/// * `face` - Parsed font face
///
/// # Returns
/// Estimated vertical stem width in font units, clamped to range [50, 200]
fn calculate_stem_v(face: &Face) -> i64 {
    // Try to measure width of 'I' (capital i) as it has a clear vertical stem
    if let Some(glyph_id) = face.glyph_index('I') {
        if let Some(bbox) = face.glyph_bounding_box(glyph_id) {
            let width = bbox.x_max - bbox.x_min;
            // Clamp to reasonable range (50-200) and return as i64
            return (width as i64).clamp(50, 200);
        }
    }

    // Try lowercase 'l' as alternative
    if let Some(glyph_id) = face.glyph_index('l') {
        if let Some(bbox) = face.glyph_bounding_box(glyph_id) {
            let width = bbox.x_max - bbox.x_min;
            return (width as i64).clamp(50, 200);
        }
    }

    // Fallback to standard default value
    80
}

/// Compresses font bytes using flate (zlib)
fn compress_font_bytes(data: &[u8]) -> Vec<u8> {
    use flate2::write::ZlibEncoder;
    use flate2::Compression;
    use std::io::Write;

    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
    // Writing to Vec<u8> in memory never fails - only allocation failure is possible
    encoder
        .write_all(data)
        .expect("Writing to Vec<u8> should never fail except on allocation failure");
    encoder
        .finish()
        .expect("Finishing ZlibEncoder with Vec<u8> should never fail except on allocation failure")
}

/// Compresses CMap content using flate (zlib)
fn compress_cmap(content: &str) -> Vec<u8> {
    compress_font_bytes(content.as_bytes())
}

/// Builds W array and CIDToGIDMap for CIDFont with Identity-H encoding
///
/// For Identity-H encoding, CIDs are Unicode codepoints. This function:
/// 1. Scans Unicode codepoints (U+0020 to U+FFFF)
/// 2. Maps each codepoint to its glyph ID using the font's cmap
/// 3. Creates CIDToGIDMap stream (CID → GID mapping)
/// 4. Builds W array with [CID_start, CID_end, width] entries
///
/// # Arguments
/// * `doc` - PDF document (to add CIDToGIDMap stream)
/// * `face` - Parsed font face
/// * `glyph_widths` - Pre-extracted glyph widths (indexed by GID)
///
/// # Returns
/// Tuple of (W array, CIDToGIDMap stream object ID)
///
/// # CIDToGIDMap Stream Format
/// Binary stream where each 2-byte pair maps CID → GID:
/// - Bytes [0-1]: GID for CID 0
/// - Bytes [2-3]: GID for CID 1
/// - ...
/// - Bytes [2*N, 2*N+1]: GID for CID N
///
/// For unmapped CIDs, GID = 0 (.notdef glyph)
fn build_cid_font_data(
    doc: &mut Document,
    face: &Face,
    glyph_widths: &[u16],
) -> Result<(Vec<i64>, ObjectId), EmbedError> {
    use std::collections::BTreeMap;

    // Build map of CID (Unicode) → (GID, width)
    let mut cid_to_gid_width = BTreeMap::new();

    // Scan Unicode range to build CID → GID mapping
    // Use 0x0000-0xFFFF for BMP (Basic Multilingual Plane)
    for codepoint in 0x0000..=0xFFFF {
        if let Some(ch) = char::from_u32(codepoint) {
            if let Some(glyph_id) = face.glyph_index(ch) {
                let gid = glyph_id.0;
                if (gid as usize) < glyph_widths.len() {
                    let width = glyph_widths[gid as usize];
                    cid_to_gid_width.insert(codepoint, (gid, width));
                }
            }
        }
    }

    // Create CIDToGIDMap stream
    // Stream size: 2 bytes per CID, covering 0x0000-0xFFFF (131,072 bytes)
    let mut cid_to_gid_data = vec![0u8; 0x10000 * 2];

    for (cid, (gid, _width)) in &cid_to_gid_width {
        let offset = (*cid as usize) * 2;
        // Big-endian 16-bit GID
        cid_to_gid_data[offset] = (gid >> 8) as u8;
        cid_to_gid_data[offset + 1] = (gid & 0xFF) as u8;
    }

    // Compress CIDToGIDMap
    let compressed = compress_font_bytes(&cid_to_gid_data);

    let cid_to_gid_stream = Stream::new(
        dictionary! {
            "Length" => compressed.len() as i64,
            "Filter" => "FlateDecode",
        },
        compressed,
    );

    let cid_to_gid_map_id = doc.add_object(cid_to_gid_stream);

    // Build W array (CID → width)
    let mut w_array = Vec::new();
    let entries: Vec<(u32, u16)> = cid_to_gid_width
        .iter()
        .map(|(cid, (_gid, width))| (*cid, *width))
        .collect();

    let mut i = 0;
    while i < entries.len() {
        let (start_cid, width) = entries[i];
        let mut end_cid = start_cid;

        // Find consecutive CIDs with same width
        while i + 1 < entries.len() {
            let (next_cid, next_width) = entries[i + 1];

            if next_cid == end_cid + 1 && next_width == width {
                end_cid = next_cid;
                i += 1;
            } else {
                break;
            }
        }

        // Add range: [start_cid, end_cid, width]
        w_array.push(start_cid as i64);
        w_array.push(end_cid as i64);
        w_array.push(width as i64);

        i += 1;
    }

    Ok((w_array, cid_to_gid_map_id))
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
    fn test_compress_font_bytes() {
        let data = b"Hello, World!";
        let compressed = compress_font_bytes(data);
        assert!(compressed.len() < data.len() || compressed.len() < 50);
        assert!(!compressed.is_empty());
    }

    #[test]
    fn test_calculate_stem_v_fallback_paths() {
        // Test with Roboto font which should have both 'I' and 'l'
        const ROBOTO_TTF: &[u8] =
            include_bytes!("../../../../test-fixtures/fonts/Roboto-Regular.ttf");
        let face = Face::parse(ROBOTO_TTF, 0).unwrap();

        let stem_v = calculate_stem_v(&face);

        // Should return value in range [50, 200] or fallback 80
        assert!(
            (50..=200).contains(&stem_v),
            "StemV should be in range [50, 200], got {}",
            stem_v
        );

        // For Roboto Regular, we expect a reasonable stem width
        assert!(stem_v > 0, "StemV should be positive");
    }

    #[test]
    fn test_compress_cmap_wrapper() {
        // Test the compress_cmap wrapper function
        let cmap_content = "/CIDInit /ProcSet findresource begin
12 dict begin
begincmap
endcmap
end
end";
        let compressed = compress_cmap(cmap_content);

        // Should return compressed bytes
        assert!(
            !compressed.is_empty(),
            "Compressed data should not be empty"
        );

        // Compressed should be reasonable size (may be larger for small input due to overhead)
        assert!(!compressed.is_empty(), "Should have some data");
        assert!(
            compressed.len() < cmap_content.len() + 200,
            "Compression overhead should be reasonable"
        );
    }
}
