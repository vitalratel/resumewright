//! ABOUTME: TrueType Font Optimizer
//! ABOUTME: Strips hinting tables for smaller PDF output

/// Tables to strip for PDF embedding (hinting not used in PDF)
const HINTING_TABLES: &[&[u8; 4]] = &[
    b"cvt ", // Control Value Table
    b"fpgm", // Font Program
    b"prep", // Control Value Program
    b"gasp", // Grid-fitting and Scan-conversion Procedure (optional)
];

/// Strips hinting tables from a TrueType font to reduce size
///
/// PDF viewers don't use TrueType hinting, so these tables can be safely
/// removed for PDF embedding. This typically saves 10-15% per font.
///
/// # Tables Removed
/// - `cvt ` - Control Value Table (hinting)
/// - `fpgm` - Font Program (hinting)
/// - `prep` - Control Value Program (hinting)
/// - `gasp` - Grid-fitting (optional, not needed for PDF)
///
/// # Arguments
/// * `font_bytes` - TrueType font data
///
/// # Returns
/// Optimized font bytes with hinting tables removed, or original if parsing fails
pub fn strip_hinting_tables(font_bytes: &[u8]) -> Vec<u8> {
    match strip_tables_internal(font_bytes, HINTING_TABLES) {
        Ok(optimized) => optimized,
        Err(_) => font_bytes.to_vec(),
    }
}

/// Table entry from the TrueType table directory
struct TableEntry {
    tag: [u8; 4],
    checksum: u32,
    offset: u32,
    length: u32,
}

/// Internal implementation that can return errors for testing
fn strip_tables_internal(
    font_bytes: &[u8],
    tables_to_remove: &[&[u8; 4]],
) -> Result<Vec<u8>, &'static str> {
    if font_bytes.len() < 12 {
        return Err("Font too small for offset table");
    }

    // Parse offset table
    let sfnt_version = &font_bytes[0..4];
    if sfnt_version != [0x00, 0x01, 0x00, 0x00] && sfnt_version != b"OTTO" {
        return Err("Not a TrueType or OpenType font");
    }

    let num_tables = u16::from_be_bytes([font_bytes[4], font_bytes[5]]) as usize;

    if font_bytes.len() < 12 + num_tables * 16 {
        return Err("Font too small for table directory");
    }

    // Parse table directory
    let mut tables: Vec<TableEntry> = Vec::with_capacity(num_tables);

    for i in 0..num_tables {
        let entry_offset = 12 + i * 16;
        let tag: [u8; 4] = font_bytes[entry_offset..entry_offset + 4]
            .try_into()
            .unwrap();
        let checksum = u32::from_be_bytes(
            font_bytes[entry_offset + 4..entry_offset + 8]
                .try_into()
                .unwrap(),
        );
        let offset = u32::from_be_bytes(
            font_bytes[entry_offset + 8..entry_offset + 12]
                .try_into()
                .unwrap(),
        );
        let length = u32::from_be_bytes(
            font_bytes[entry_offset + 12..entry_offset + 16]
                .try_into()
                .unwrap(),
        );

        tables.push(TableEntry {
            tag,
            checksum,
            offset,
            length,
        });
    }

    // Filter out tables we want to remove
    let kept_tables: Vec<&TableEntry> = tables
        .iter()
        .filter(|t| !tables_to_remove.iter().any(|remove| **remove == t.tag))
        .collect();

    if kept_tables.len() == tables.len() {
        // No tables removed, return original
        return Ok(font_bytes.to_vec());
    }

    // Calculate new table count and search parameters
    let new_num_tables = kept_tables.len() as u16;
    let (search_range, entry_selector, range_shift) = calc_search_params(new_num_tables);

    // Calculate new offsets
    let header_size = 12 + kept_tables.len() * 16;
    let mut current_offset = header_size as u32;

    // Align to 4 bytes
    fn align4(n: u32) -> u32 {
        (n + 3) & !3
    }

    // Build new font
    let mut output = Vec::new();

    // Write offset table
    output.extend_from_slice(sfnt_version);
    output.extend_from_slice(&new_num_tables.to_be_bytes());
    output.extend_from_slice(&search_range.to_be_bytes());
    output.extend_from_slice(&entry_selector.to_be_bytes());
    output.extend_from_slice(&range_shift.to_be_bytes());

    // Calculate offsets for all tables first
    let mut new_offsets: Vec<u32> = Vec::new();
    for table in &kept_tables {
        new_offsets.push(current_offset);
        current_offset = align4(current_offset + table.length);
    }

    // Write table directory
    for (i, table) in kept_tables.iter().enumerate() {
        output.extend_from_slice(&table.tag);
        output.extend_from_slice(&table.checksum.to_be_bytes());
        output.extend_from_slice(&new_offsets[i].to_be_bytes());
        output.extend_from_slice(&table.length.to_be_bytes());
    }

    // Write table data
    for table in &kept_tables {
        let start = table.offset as usize;
        let end = start + table.length as usize;

        if end > font_bytes.len() {
            return Err("Table extends beyond font data");
        }

        output.extend_from_slice(&font_bytes[start..end]);

        // Pad to 4-byte alignment
        let padding = (4 - (table.length % 4)) % 4;
        output.resize(output.len() + padding as usize, 0);
    }

    // Update head table checksum adjustment
    update_head_checksum(&mut output, &kept_tables, &new_offsets);

    Ok(output)
}

/// Calculate searchRange, entrySelector, rangeShift for table directory
fn calc_search_params(num_tables: u16) -> (u16, u16, u16) {
    let mut entry_selector = 0u16;
    let mut search_range = 1u16;

    while search_range * 2 <= num_tables {
        search_range *= 2;
        entry_selector += 1;
    }
    search_range *= 16;

    let range_shift = num_tables * 16 - search_range;

    (search_range, entry_selector, range_shift)
}

/// Calculate TrueType checksum for a block of data
fn calc_checksum(data: &[u8]) -> u32 {
    let mut sum: u32 = 0;
    let mut i = 0;

    while i + 4 <= data.len() {
        sum = sum.wrapping_add(u32::from_be_bytes([
            data[i],
            data[i + 1],
            data[i + 2],
            data[i + 3],
        ]));
        i += 4;
    }

    // Handle remaining bytes (pad with zeros)
    if i < data.len() {
        let mut last = [0u8; 4];
        for (j, byte) in data[i..].iter().enumerate() {
            last[j] = *byte;
        }
        sum = sum.wrapping_add(u32::from_be_bytes(last));
    }

    sum
}

/// Update the checkSumAdjustment field in the head table
fn update_head_checksum(output: &mut [u8], kept_tables: &[&TableEntry], new_offsets: &[u32]) {
    // Find head table
    let head_idx = kept_tables.iter().position(|t| &t.tag == b"head");

    if let Some(idx) = head_idx {
        let head_offset = new_offsets[idx] as usize;

        // Zero out the checkSumAdjustment field (offset 8 in head table)
        if head_offset + 12 <= output.len() {
            output[head_offset + 8] = 0;
            output[head_offset + 9] = 0;
            output[head_offset + 10] = 0;
            output[head_offset + 11] = 0;
        }

        // Calculate checksum of entire font
        let font_checksum = calc_checksum(output);

        // checkSumAdjustment = 0xB1B0AFBA - checksum
        let adjustment = 0xB1B0AFBAu32.wrapping_sub(font_checksum);

        // Write adjustment back
        if head_offset + 12 <= output.len() {
            let bytes = adjustment.to_be_bytes();
            output[head_offset + 8] = bytes[0];
            output[head_offset + 9] = bytes[1];
            output[head_offset + 10] = bytes[2];
            output[head_offset + 11] = bytes[3];
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const ROBOTO_TTF: &[u8] = include_bytes!("../../../../test-fixtures/fonts/Roboto-Regular.ttf");
    const KARLA_REGULAR: &[u8] = include_bytes!("../../pdf-generator/fonts/Karla-Regular.ttf");

    #[test]
    fn test_strip_hinting_tables() {
        let optimized = strip_hinting_tables(ROBOTO_TTF);

        // Should be smaller
        assert!(
            optimized.len() < ROBOTO_TTF.len(),
            "Optimized font should be smaller: {} < {}",
            optimized.len(),
            ROBOTO_TTF.len()
        );

        // Should still be valid TrueType
        let face = ttf_parser::Face::parse(&optimized, 0);
        assert!(face.is_ok(), "Optimized font should be valid TrueType");

        let face = face.unwrap();
        assert!(face.number_of_glyphs() > 0);

        let saved = ROBOTO_TTF.len() - optimized.len();
        println!("Stripped hinting from full font: saved {} bytes", saved);
    }

    #[test]
    fn test_strip_from_subset() {
        #[cfg(feature = "advanced-fonts")]
        {
            use crate::subset_font_core;

            let text = "Hello World";
            let (subset, _) = subset_font_core(ROBOTO_TTF, None, text, false).unwrap();

            let optimized = strip_hinting_tables(&subset);

            let saved = subset.len() - optimized.len();
            println!("Subset: {} bytes", subset.len());
            println!("Optimized: {} bytes", optimized.len());
            println!(
                "Saved: {} bytes ({:.1}%)",
                saved,
                saved as f64 / subset.len() as f64 * 100.0
            );

            assert!(
                optimized.len() < subset.len(),
                "Optimized should be smaller"
            );

            let face = ttf_parser::Face::parse(&optimized, 0);
            assert!(face.is_ok(), "Optimized font should still be valid");
        }
    }

    #[test]
    fn test_strip_karla_font() {
        let original_len = KARLA_REGULAR.len();
        let optimized = strip_hinting_tables(KARLA_REGULAR);
        let saved = original_len.saturating_sub(optimized.len());

        println!("Karla original: {} bytes", original_len);
        println!("Karla optimized: {} bytes", optimized.len());
        println!(
            "Saved: {} bytes ({:.1}%)",
            saved,
            saved as f64 / original_len as f64 * 100.0
        );

        let face = ttf_parser::Face::parse(&optimized, 0);
        assert!(face.is_ok(), "Optimized font should still be valid");
    }

    #[test]
    fn test_invalid_font() {
        let invalid = b"not a font";
        let result = strip_hinting_tables(invalid);

        // Should return original on error
        assert_eq!(result, invalid);
    }

    #[test]
    fn test_calc_search_params() {
        let (sr, es, rs) = calc_search_params(11);
        assert_eq!(sr, 128); // 8 * 16
        assert_eq!(es, 3); // log2(8)
        assert_eq!(rs, 48); // 11*16 - 128
    }

    #[test]
    fn test_calc_checksum() {
        let data = [0x00, 0x01, 0x00, 0x00]; // 0x00010000
        assert_eq!(calc_checksum(&data), 0x00010000);

        let data2 = [0x01, 0x02, 0x03];
        assert_eq!(calc_checksum(&data2), 0x01020300);
    }
}
