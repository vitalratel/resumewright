//! ABOUTME: CIDFont and CIDSet creation for PDF embedding
//! ABOUTME: Creates CIDFont Type 2 dictionaries and CIDSet streams for PDF/A compliance

use lopdf::{dictionary, Document, Object, ObjectId, Stream};
use std::collections::BTreeMap;
use ttf_parser::Face;

use super::compression::compress_bytes;
use super::constants::{CID_SET_SIZE_BYTES, CID_TO_GID_MAP_SIZE, DEFAULT_GLYPH_WIDTH};
use super::EmbedError;
use crate::truetype::extract_glyph_widths;

/// Creates CIDFont dictionary (DescendantFont)
///
/// Uses the CID→GID mapping to build CIDToGIDMap and W (widths) arrays.
/// Works correctly for both full fonts and subsetted fonts.
///
/// # Arguments
/// * `doc` - PDF document
/// * `font_name` - PostScript font name (may include subset prefix)
/// * `font_descriptor_id` - Reference to FontDescriptor
/// * `face` - Parsed font face for extracting glyph widths
/// * `cid_to_gid` - CID to GID mapping
///
/// # Returns
/// Object ID of the CIDFont dictionary
pub fn create_cid_font(
    doc: &mut Document,
    font_name: &str,
    font_descriptor_id: ObjectId,
    face: &Face,
    cid_to_gid: &BTreeMap<u32, u16>,
) -> Result<ObjectId, EmbedError> {
    // Extract glyph widths from font (indexed by GID)
    let widths = extract_glyph_widths(face);

    // Use .notdef width (GID 0) as default width
    let default_width = widths.first().copied().unwrap_or(DEFAULT_GLYPH_WIDTH) as i64;

    // Build W array and CIDToGIDMap
    let (w_array, cid_to_gid_map_id) = build_cid_font_data(doc, cid_to_gid, &widths)?;

    let mut cid_font = dictionary! {
        "Type" => "Font",
        "Subtype" => "CIDFontType2",
        "BaseFont" => Object::Name(font_name.as_bytes().to_vec()),
        "CIDSystemInfo" => dictionary! {
            "Registry" => Object::string_literal("Adobe"),
            "Ordering" => Object::string_literal("Identity"),
            "Supplement" => 0,
        },
        "FontDescriptor" => Object::Reference(font_descriptor_id),
        "DW" => default_width,
        "CIDToGIDMap" => Object::Reference(cid_to_gid_map_id),
    };

    // Add W array
    cid_font.set(
        "W",
        Object::Array(w_array.into_iter().map(Object::Integer).collect()),
    );

    Ok(doc.add_object(cid_font))
}

/// Creates CIDSet stream for PDF/A-1b compliance (clause 6.3.5)
///
/// CIDSet is a bitmap where each bit indicates whether a CID is present in the font.
/// For Identity-H encoding, CID = Unicode codepoint.
///
/// # Arguments
/// * `doc` - PDF document
/// * `cid_to_gid` - CID to GID mapping (keys determine which bits are set)
///
/// # Returns
/// Object ID of the CIDSet stream
pub fn create_cid_set_stream(
    doc: &mut Document,
    cid_to_gid: &BTreeMap<u32, u16>,
) -> Result<ObjectId, EmbedError> {
    let mut cid_set = vec![0u8; CID_SET_SIZE_BYTES];

    // CID 0 (.notdef) is always present (bit 7 of byte 0)
    cid_set[0] |= 0x80;

    // Set bits for all CIDs in the mapping
    for &cid in cid_to_gid.keys() {
        if cid < 0x10000 {
            let byte_index = (cid / 8) as usize;
            let bit_index = 7 - (cid % 8) as u8; // High-order bit first
            if byte_index < cid_set.len() {
                cid_set[byte_index] |= 1 << bit_index;
            }
        }
    }

    let compressed = compress_bytes(&cid_set);

    let stream = Stream::new(
        dictionary! {
            "Length" => compressed.len() as i64,
            "Filter" => "FlateDecode",
        },
        compressed,
    );

    Ok(doc.add_object(stream))
}

/// Builds CIDToGIDMap stream and W (widths) array for CIDFont
///
/// For Identity-H encoding, CIDs are Unicode codepoints. This creates:
/// 1. CIDToGIDMap stream - maps CID → GID
/// 2. W array - maps CID ranges to widths
fn build_cid_font_data(
    doc: &mut Document,
    cid_to_gid: &BTreeMap<u32, u16>,
    glyph_widths: &[u16],
) -> Result<(Vec<i64>, ObjectId), EmbedError> {
    // Create CIDToGIDMap stream (2 bytes per CID for full BMP range)
    let mut cid_to_gid_data = vec![0u8; CID_TO_GID_MAP_SIZE];

    for (&cid, &gid) in cid_to_gid {
        if cid < 0x10000 {
            let offset = (cid as usize) * 2;
            // Big-endian 16-bit GID
            cid_to_gid_data[offset] = (gid >> 8) as u8;
            cid_to_gid_data[offset + 1] = (gid & 0xFF) as u8;
        }
    }

    let compressed = compress_bytes(&cid_to_gid_data);

    let cid_to_gid_stream = Stream::new(
        dictionary! {
            "Length" => compressed.len() as i64,
            "Filter" => "FlateDecode",
        },
        compressed,
    );

    let cid_to_gid_map_id = doc.add_object(cid_to_gid_stream);

    // Build W array
    let w_array = build_width_array(cid_to_gid, glyph_widths);

    Ok((w_array, cid_to_gid_map_id))
}

/// Builds the W (widths) array for CIDFont
///
/// Groups consecutive CIDs with the same width into ranges for efficiency.
fn build_width_array(cid_to_gid: &BTreeMap<u32, u16>, glyph_widths: &[u16]) -> Vec<i64> {
    let mut entries: Vec<(u32, u16)> = cid_to_gid
        .iter()
        .filter_map(|(&cid, &gid)| {
            let gid_idx = gid as usize;
            if gid_idx < glyph_widths.len() {
                Some((cid, glyph_widths[gid_idx]))
            } else {
                None
            }
        })
        .collect();

    entries.sort_by_key(|(cid, _)| *cid);

    let mut w_array = Vec::new();
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

    w_array
}
