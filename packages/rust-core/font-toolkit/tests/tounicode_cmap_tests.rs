//! Unit Tests for ToUnicode CMap Generation
//!
//! Tests the ToUnicode CMap implementation for Identity-H encoding.
//! With Identity-H, CIDs are Unicode codepoints, so ToUnicode maps CID → Unicode
//! (effectively an identity mapping). This enables text extraction, copy/paste,
//! screen readers, and search.

use font_toolkit::embedding::embed_truetype_font;
use lopdf::Document;
use ttf_parser::Face;

// Test fixture fonts - embedded at compile time
const ROBOTO_REGULAR_TTF: &[u8] =
    include_bytes!("../../../../test-fixtures/fonts/Roboto-Regular.ttf");
const OPENSANS_BOLD_TTF: &[u8] =
    include_bytes!("../../../../test-fixtures/fonts/OpenSans-Bold.ttf");

/// Extracts ToUnicode CMap content from an embedded font
///
/// Helper function that embeds a font and retrieves the generated ToUnicode CMap stream.
fn extract_tounicode_cmap(font_bytes: &[u8], font_name: &str) -> String {
    let mut doc = Document::with_version("1.7");

    let embedded = embed_truetype_font(&mut doc, font_bytes, font_name, 400, false)
        .expect("Font embedding should succeed");

    // Find ToUnicode CMap stream in document
    // The Type 0 font dictionary contains a /ToUnicode reference
    let font_obj = doc
        .get_object(embedded.font_id)
        .expect("Font object should exist");

    let font_dict = font_obj.as_dict().expect("Font should be dictionary");

    let tounicode_ref = font_dict
        .get(b"ToUnicode")
        .expect("ToUnicode should exist")
        .as_reference()
        .expect("ToUnicode should be reference");

    let tounicode_obj = doc
        .get_object(tounicode_ref)
        .expect("ToUnicode object should exist");

    let tounicode_stream = tounicode_obj
        .as_stream()
        .expect("ToUnicode should be stream");

    // Decompress the CMap content
    let compressed_data = &tounicode_stream.content;

    use flate2::read::ZlibDecoder;
    use std::io::Read;

    let mut decoder = ZlibDecoder::new(&compressed_data[..]);
    let mut cmap_content = String::new();
    decoder
        .read_to_string(&mut cmap_content)
        .expect("Decompression should succeed");

    cmap_content
}

#[test]
fn test_cmap_header_structure() {
    let cmap = extract_tounicode_cmap(ROBOTO_REGULAR_TTF, "Roboto");

    // Verify required CMap header elements
    assert!(
        cmap.contains("/CIDInit /ProcSet findresource begin"),
        "CMap should start with CIDInit"
    );
    assert!(cmap.contains("begincmap"), "CMap should have begincmap");
    assert!(
        cmap.contains("/CIDSystemInfo"),
        "CMap should define CIDSystemInfo"
    );
    assert!(
        cmap.contains("/Registry (Adobe)"),
        "Registry should be Adobe"
    );
    assert!(
        cmap.contains("/Ordering (UCS)"),
        "Ordering should be UCS (Unicode)"
    );
    assert!(cmap.contains("/Supplement 0"), "Supplement should be 0");
    assert!(
        cmap.contains("/CMapName /Adobe-Identity-UCS"),
        "CMapName should be defined"
    );
    assert!(cmap.contains("/CMapType 2"), "CMapType should be 2");
}

#[test]
fn test_cmap_codespace_range() {
    let cmap = extract_tounicode_cmap(ROBOTO_REGULAR_TTF, "Roboto");

    // Verify codespace range (CID range, which equals Unicode range for Identity-H)
    assert!(
        cmap.contains("1 begincodespacerange"),
        "Should define codespace range"
    );
    assert!(
        cmap.contains("<0000> <FFFF>"),
        "Codespace should be 0000-FFFF"
    );
    assert!(
        cmap.contains("endcodespacerange"),
        "Should end codespace range"
    );
}

#[test]
fn test_cmap_contains_character_mappings() {
    let cmap = extract_tounicode_cmap(ROBOTO_REGULAR_TTF, "Roboto");

    // Verify bfchar section exists (individual character mappings)
    assert!(
        cmap.contains("beginbfchar"),
        "CMap should have beginbfchar section"
    );
    assert!(cmap.contains("endbfchar"), "CMap should end bfchar section");

    // Count should be > 0 (format: "N beginbfchar" where N is the count)
    let beginbfchar_line = cmap
        .lines()
        .find(|line| line.contains("beginbfchar"))
        .expect("Should find beginbfchar line");

    // Extract the count (first token before "beginbfchar")
    let count_str = beginbfchar_line
        .split_whitespace()
        .next()
        .expect("Should have count before beginbfchar");

    let count: usize = count_str.parse().expect("Count should be a valid number");

    assert!(count > 0, "Should have at least one character mapping");
    assert!(
        count > 50,
        "Should have many character mappings (>50 for typical font)"
    );
}

#[test]
fn test_cmap_maps_basic_latin() {
    let cmap = extract_tounicode_cmap(ROBOTO_REGULAR_TTF, "Roboto");

    // Parse font to verify characters exist
    let face = Face::parse(ROBOTO_REGULAR_TTF, 0).unwrap();

    // Test common ASCII characters
    // With Identity-H encoding, CID = Unicode, so mapping is <Unicode> <Unicode>
    let test_chars = vec![
        ('A', 0x0041),
        ('B', 0x0042),
        ('a', 0x0061),
        ('b', 0x0062),
        ('0', 0x0030),
        ('1', 0x0031),
        (' ', 0x0020), // space
        ('.', 0x002E), // period
        (',', 0x002C), // comma
    ];

    for (ch, unicode) in test_chars {
        // Verify character exists in font
        assert!(
            face.glyph_index(ch).is_some(),
            "Font should have glyph for '{}'",
            ch
        );

        // CMap should contain identity mapping: <Unicode> <Unicode>
        let unicode_hex = format!("{:04X}", unicode);
        let mapping = format!("<{}> <{}>", unicode_hex, unicode_hex);

        assert!(
            cmap.contains(&mapping),
            "CMap should contain identity mapping for '{}' (U+{:04X}): {}",
            ch,
            unicode,
            mapping
        );
    }
}

#[test]
fn test_cmap_maps_accented_characters() {
    let cmap = extract_tounicode_cmap(ROBOTO_REGULAR_TTF, "Roboto");
    let face = Face::parse(ROBOTO_REGULAR_TTF, 0).unwrap();

    // Test Latin-1 Supplement and Latin Extended characters (common in CVs)
    // With Identity-H encoding, CID = Unicode
    let test_chars = vec![
        ('é', 0x00E9), // Latin-1: e with acute
        ('ñ', 0x00F1), // Latin-1: n with tilde
        ('ü', 0x00FC), // Latin-1: u with diaeresis
        ('ç', 0x00E7), // Latin-1: c with cedilla
    ];

    for (ch, unicode) in test_chars {
        if face.glyph_index(ch).is_some() {
            // Identity mapping: <Unicode> <Unicode>
            let unicode_hex = format!("{:04X}", unicode);
            let mapping = format!("<{}> <{}>", unicode_hex, unicode_hex);

            assert!(
                cmap.contains(&mapping),
                "CMap should contain identity mapping for '{}' (U+{:04X})",
                ch,
                unicode
            );
        }
    }
}

#[test]
fn test_cmap_maps_punctuation() {
    let cmap = extract_tounicode_cmap(ROBOTO_REGULAR_TTF, "Roboto");
    let face = Face::parse(ROBOTO_REGULAR_TTF, 0).unwrap();

    // Test various punctuation marks common in CVs
    // With Identity-H encoding, CID = Unicode
    let test_chars = vec![
        ('-', 0x002D),        // hyphen-minus
        ('–', 0x2013),        // en dash
        ('—', 0x2014),        // em dash
        ('\u{2019}', 0x2019), // right single quotation mark
        ('"', 0x201C),        // left double quotation mark
        ('"', 0x201D),        // right double quotation mark
        ('•', 0x2022),        // bullet
    ];

    let mut found_count = 0;
    for (ch, unicode) in test_chars {
        if face.glyph_index(ch).is_some() {
            // Identity mapping: <Unicode> <Unicode>
            let unicode_hex = format!("{:04X}", unicode);
            let mapping = format!("<{}> <{}>", unicode_hex, unicode_hex);

            // Note: Not all fonts have all these characters
            if cmap.contains(&mapping) {
                found_count += 1;
            }
        }
    }

    // At least some punctuation should be mapped (hyphen-minus is guaranteed)
    assert!(
        found_count > 0,
        "CMap should contain at least one punctuation mapping"
    );
}

#[test]
fn test_cmap_footer_structure() {
    let cmap = extract_tounicode_cmap(ROBOTO_REGULAR_TTF, "Roboto");

    // Verify required CMap footer elements
    assert!(cmap.contains("endcmap"), "CMap should have endcmap");
    assert!(
        cmap.contains("CMapName currentdict /CMap defineresource pop"),
        "CMap should define resource"
    );
    assert!(
        cmap.trim().ends_with("end\nend") || cmap.trim().ends_with("end end"),
        "CMap should end with 'end end'"
    );
}

#[test]
fn test_cmap_deterministic_output() {
    // Generate CMap twice and verify identical output (sorted by glyph ID)
    let cmap1 = extract_tounicode_cmap(ROBOTO_REGULAR_TTF, "Roboto");
    let cmap2 = extract_tounicode_cmap(ROBOTO_REGULAR_TTF, "Roboto");

    assert_eq!(cmap1, cmap2, "CMap generation should be deterministic");
}

#[test]
fn test_cmap_different_fonts() {
    // Verify different fonts produce different CMaps
    let roboto_cmap = extract_tounicode_cmap(ROBOTO_REGULAR_TTF, "Roboto");
    let opensans_cmap = extract_tounicode_cmap(OPENSANS_BOLD_TTF, "Open Sans");

    // CMaps should differ (different fonts have different glyph sets)
    assert_ne!(
        roboto_cmap, opensans_cmap,
        "Different fonts should produce different CMaps"
    );

    // Both should have valid structure
    assert!(
        roboto_cmap.contains("beginbfchar"),
        "Roboto CMap should have mappings"
    );
    assert!(
        opensans_cmap.contains("beginbfchar"),
        "Open Sans CMap should have mappings"
    );
}

#[test]
fn test_cmap_handles_space_character() {
    let cmap = extract_tounicode_cmap(ROBOTO_REGULAR_TTF, "Roboto");
    let face = Face::parse(ROBOTO_REGULAR_TTF, 0).unwrap();

    // Space character is critical for text extraction
    assert!(
        face.glyph_index(' ').is_some(),
        "Font should have space character"
    );

    // With Identity-H, space mapping is <0020> <0020>
    let mapping = "<0020> <0020>";

    assert!(
        cmap.contains(mapping),
        "CMap must contain identity mapping for space character (U+0020)"
    );
}

#[test]
fn test_cmap_includes_all_supported_codepoints() {
    let face = Face::parse(ROBOTO_REGULAR_TTF, 0).unwrap();
    let cmap = extract_tounicode_cmap(ROBOTO_REGULAR_TTF, "Roboto");

    // With Identity-H encoding, each Unicode codepoint that has a glyph
    // gets its own identity mapping. Even if multiple Unicode codepoints
    // map to the same glyph, each gets its own CMap entry.

    // Test that both hyphen-minus and hyphen have mappings if they exist in the font
    let hyphen_minus_exists = face.glyph_index('\u{002D}').is_some();
    let hyphen_exists = face.glyph_index('\u{2010}').is_some();

    if hyphen_minus_exists {
        assert!(
            cmap.contains("<002D> <002D>"),
            "Should have identity mapping for hyphen-minus (U+002D)"
        );
    }

    if hyphen_exists {
        assert!(
            cmap.contains("<2010> <2010>"),
            "Should have identity mapping for hyphen (U+2010)"
        );
    }
}

#[test]
fn test_cmap_performance() {
    // Verify CMap generation completes in reasonable time
    use std::time::Instant;

    let start = Instant::now();
    let _cmap = extract_tounicode_cmap(ROBOTO_REGULAR_TTF, "Roboto");
    let duration = start.elapsed();

    // CMap generation should complete in reasonable time
    // Note: Includes full font parsing, embedding, and compression
    // Debug builds: ~1-2s, Release builds: <50ms
    // Coverage instrumentation: ~5-10s
    // Use 10s threshold to account for debug builds, coverage instrumentation, and system load
    assert!(
        duration.as_millis() < 10000,
        "CMap generation should be fast (<10s), took {:?}",
        duration
    );
}

#[test]
fn test_cmap_coverage_ratio() {
    let cmap = extract_tounicode_cmap(ROBOTO_REGULAR_TTF, "Roboto");
    let face = Face::parse(ROBOTO_REGULAR_TTF, 0).unwrap();

    // Count mappings in CMap
    let mapping_count = cmap
        .lines()
        .find(|line| line.contains("beginbfchar"))
        .and_then(|line| line.split_whitespace().next())
        .and_then(|s| s.parse::<usize>().ok())
        .expect("Should find mapping count");

    let total_glyphs = face.number_of_glyphs();

    // With Identity-H encoding, we map Unicode codepoints (not glyphs).
    // The mapping count may exceed glyph count since multiple Unicode
    // codepoints can map to the same glyph.
    // For Latin fonts, we expect at least 500 Unicode codepoints mapped.
    assert!(
        mapping_count >= 500,
        "CMap should have at least 500 Unicode mappings for a Latin font, got {}",
        mapping_count
    );

    // Sanity check: shouldn't exceed BMP range we scan (0x0020-0xFFFF)
    assert!(
        mapping_count <= 0xFFFF - 0x0020 + 1,
        "CMap mappings ({}) shouldn't exceed scanned Unicode range",
        mapping_count
    );

    // Most glyphs should have at least one Unicode mapping
    // (mapping_count >= total_glyphs is possible due to many-to-one mappings)
    assert!(
        mapping_count as f32 >= total_glyphs as f32 * 0.5,
        "CMap should map at least half as many codepoints as there are glyphs ({}/{})",
        mapping_count,
        total_glyphs
    );
}
