//! ABOUTME: CID to GID mapping construction
//! ABOUTME: Builds character-to-glyph mappings by scanning font cmap tables

use std::collections::BTreeMap;
use ttf_parser::Face;

use super::constants::BMP_MAX_CODEPOINT;

/// CID to GID mapping type (Unicode codepoint → glyph ID)
pub type CidToGidMap = BTreeMap<u32, u16>;

/// Builds a CID→GID mapping by scanning the font's cmap table
///
/// For Identity-H encoding, CID = Unicode codepoint. This function scans
/// the font's character map to build a mapping from Unicode codepoints
/// to glyph IDs.
///
/// # Arguments
/// * `face` - Parsed TrueType font face
///
/// # Returns
/// BTreeMap mapping Unicode codepoints to glyph IDs
pub fn build_cid_mapping_from_font(face: &Face) -> CidToGidMap {
    let mut mapping = BTreeMap::new();

    // GID 0 (.notdef) maps to CID 0
    mapping.insert(0u32, 0u16);

    // Scan Unicode BMP range
    for codepoint in 0x0001..=BMP_MAX_CODEPOINT {
        if let Some(ch) = char::from_u32(codepoint) {
            if let Some(glyph_id) = face.glyph_index(ch) {
                mapping.insert(codepoint, glyph_id.0);
            }
        }
    }

    mapping
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_cid_mapping_includes_notdef() {
        const ROBOTO_TTF: &[u8] =
            include_bytes!("../../../../../test-fixtures/fonts/Roboto-Regular.ttf");
        let face = Face::parse(ROBOTO_TTF, 0).unwrap();

        let mapping = build_cid_mapping_from_font(&face);

        // .notdef (CID 0) should always be present
        assert!(mapping.contains_key(&0));
        assert_eq!(mapping.get(&0), Some(&0));
    }

    #[test]
    fn test_build_cid_mapping_includes_ascii() {
        const ROBOTO_TTF: &[u8] =
            include_bytes!("../../../../../test-fixtures/fonts/Roboto-Regular.ttf");
        let face = Face::parse(ROBOTO_TTF, 0).unwrap();

        let mapping = build_cid_mapping_from_font(&face);

        // Basic ASCII characters should be present
        assert!(mapping.contains_key(&0x41)); // 'A'
        assert!(mapping.contains_key(&0x61)); // 'a'
        assert!(mapping.contains_key(&0x30)); // '0'
        assert!(mapping.contains_key(&0x20)); // space
    }
}
