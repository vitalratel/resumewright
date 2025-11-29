//! TrueType Font Table Parsing
//!
//! Parses TrueType font tables to extract glyph metrics for PDF embedding.

use ttf_parser::{Face, GlyphId};

/// Extracts glyph widths scaled to PDF's 1000-unit text space
///
/// Returns a vector where the index is the glyph ID and the value is the
/// advance width scaled to PDF's coordinate system. These scaled widths
/// are used in the PDF CIDFont's W (widths) array.
///
/// # Arguments
/// * `face` - Parsed TrueType font face
///
/// # Returns
/// Vector of advance widths scaled to PDF's 1000-unit text space
///
/// # PDF/A-1b Compliance (ISO 19005-1:2005 Clause 6.3.6)
/// The PDF specification (ISO 32000-1 Section 9.7.4.3) requires that CIDFont
/// W array widths be expressed in a coordinate system where **1000 units equal
/// 1 unit in text space**. This is NOT the same as font units from the hmtx table.
///
/// TrueType fonts define glyphs in their own coordinate system with a scale
/// specified by units_per_em (from the 'head' table). Common values:
/// - 1000 units per em (some fonts)
/// - 1024 units per em (some fonts)
/// - 2048 units per em (most modern fonts like Roboto, DejaVu)
///
/// # Scaling Formula
/// ```text
/// pdf_width = (font_width * 1000) / units_per_em
/// ```
///
/// # Example
/// For Roboto Regular (units_per_em = 2048):
/// - Glyph 'a' has advance width = 1138 (font units)
/// - Scaled width = (1138 * 1000) / 2048 = 555
/// - W array contains: [... 68 68 555 ...] where 68 is the glyph ID for 'a'
///
/// Without this scaling, VeraPDF reports errors like:
/// "Glyph width 555.664062 in embedded font ≠ dictionary value 1138"
///
/// # Performance
/// Extracts and scales widths for all glyphs in a single pass. For typical
/// fonts with 500-2000 glyphs, this completes in <1ms.
pub fn extract_glyph_widths(face: &Face) -> Vec<u16> {
    let num_glyphs = face.number_of_glyphs();
    let units_per_em = face.units_per_em() as u32;
    let mut widths = Vec::with_capacity(num_glyphs as usize);

    for glyph_id in 0..num_glyphs {
        let advance = face.glyph_hor_advance(GlyphId(glyph_id)).unwrap_or(0); // Use 0 for missing glyphs (should never happen in valid fonts)

        // Scale from font units to PDF's 1000-unit text space
        // Use u32 for intermediate calculation to avoid overflow
        let scaled = ((advance as u32 * 1000) / units_per_em) as u16;

        widths.push(scaled);
    }

    widths
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_glyph_widths() {
        // Test with a real font from the test fixtures
        let test_font = include_bytes!("../../../../test-fixtures/fonts/Roboto-Regular.ttf");
        let face = Face::parse(test_font, 0).expect("Failed to parse test font");

        let widths = extract_glyph_widths(&face);

        // Basic validation
        assert!(!widths.is_empty(), "Widths should not be empty");
        assert_eq!(widths.len(), face.number_of_glyphs() as usize);

        // Most glyphs should have non-zero widths (glyph 0 is typically .notdef with 0 width)
        let non_zero = widths.iter().filter(|&&w| w > 0).count();
        assert!(
            non_zero > widths.len() / 2,
            "Most glyphs should have non-zero widths"
        );

        // Verify widths are scaled to PDF's 1000-unit text space
        // Roboto Regular has units_per_em = 2048
        assert_eq!(
            face.units_per_em(),
            2048,
            "Test assumes Roboto has units_per_em=2048"
        );

        // Check specific glyphs have correctly scaled widths
        // Space character
        let space_glyph = face.glyph_index(' ').unwrap();
        let space_width = widths[space_glyph.0 as usize];
        let space_advance = face.glyph_hor_advance(space_glyph).unwrap();
        let expected_space = (space_advance as u32 * 1000 / 2048) as u16;
        assert_eq!(
            space_width, expected_space,
            "Space width should be scaled correctly"
        );
        assert!(
            space_width > 0 && space_width < 1000,
            "Space should have realistic width"
        );

        // Check 'a' character (commonly around 555 after scaling from 1138)
        if let Some(a_glyph) = face.glyph_index('a') {
            let a_width = widths[a_glyph.0 as usize];
            let a_advance = face.glyph_hor_advance(a_glyph).unwrap();
            let expected_a = (a_advance as u32 * 1000 / 2048) as u16;
            assert_eq!(a_width, expected_a, "'a' width should be scaled correctly");
        }
    }

    #[test]
    fn test_width_scaling_debug() {
        // Debug test to verify width scaling is working correctly
        let font_data = include_bytes!("../../../../test-fixtures/fonts/Roboto-Regular.ttf");
        let face = Face::parse(font_data, 0).unwrap();

        println!("\n=== Roboto Regular Width Scaling Test ===");
        println!("units_per_em: {}", face.units_per_em());

        // Test glyph 'a'
        if let Some(a_gid) = face.glyph_index('a') {
            let raw_width = face.glyph_hor_advance(a_gid).unwrap();
            let scaled_width = ((raw_width as u32 * 1000) / face.units_per_em() as u32) as u16;

            println!("Glyph 'a' (GID {}):", a_gid.0);
            println!("  Raw width (font units): {}", raw_width);
            println!("  Scaled width (PDF units): {}", scaled_width);
            println!(
                "  Formula: ({} * 1000) / {} = {}",
                raw_width,
                face.units_per_em(),
                scaled_width
            );

            // Now test our extract_glyph_widths function
            let widths = extract_glyph_widths(&face);
            let our_width = widths[a_gid.0 as usize];
            println!("\nOur extract_glyph_widths result for 'a': {}", our_width);

            // Verify they match
            assert_eq!(our_width, scaled_width, "Scaled width should match");
        }
    }
}
