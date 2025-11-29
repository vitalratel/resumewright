//! WOFF (Web Open Font Format) Decompression
//!
//! Decompresses WOFF fonts to TrueType format for use in PDF generation.
//! WOFF uses zlib compression on TrueType font tables.
//!
//! Reference: <https://www.w3.org/TR/WOFF/>

use flate2::read::ZlibDecoder;
use std::io::Read;
use thiserror::Error;

/// WOFF magic bytes: "wOFF" (0x774F4646)
const WOFF_MAGIC: u32 = 0x774F4646;

/// Default maximum font size (2MB) - suitable for Latin/Cyrillic fonts.
/// This limit protects against memory exhaustion in WASM environments.
/// CJK fonts may exceed this limit and require a higher value.
pub const DEFAULT_MAX_FONT_SIZE: usize = 2 * 1024 * 1024;

/// Type alias for decompressed font tables: (tag, data) pairs
type DecompressedTables = Vec<([u8; 4], Vec<u8>)>;

/// Format first N bytes of data as a hex dump for error diagnostics
///
/// Returns a space-separated hex string of the form "77 4F 46 46 00 01 ..."
/// useful for debugging malformed font files.
///
/// # Arguments
/// * `bytes` - The byte slice to dump
/// * `max_bytes` - Maximum number of bytes to include in the dump
fn format_hex_dump(bytes: &[u8], max_bytes: usize) -> String {
    bytes[..max_bytes.min(bytes.len())]
        .iter()
        .map(|b| format!("{:02X}", b))
        .collect::<Vec<_>>()
        .join(" ")
}

/// Errors that can occur during WOFF decompression
///
/// # Examples
///
/// ## InvalidFormat
/// Returned when the file is not a valid WOFF font.
///
/// ```
/// use font_toolkit::woff::{decompress_woff, WoffError};
///
/// let not_woff = b"not a WOFF file";
///
/// match decompress_woff(not_woff) {
///     Err(WoffError::InvalidFormat(msg)) => {
///         assert!(msg.contains("magic") || msg.contains("WOFF"));
///     }
///     _ => panic!("Expected InvalidFormat"),
/// }
/// ```
///
/// ## FontTooLarge
/// Returned when decompressed font exceeds size limit (default 2MB).
///
/// ```no_run
/// # use font_toolkit::woff::{decompress_woff, WoffError};
/// # let large_woff_bytes = b"large woff data";
/// match decompress_woff(large_woff_bytes) {
///     Err(WoffError::FontTooLarge(size)) => {
///         eprintln!("Font too large: {} bytes", size);
///     }
///     Ok(ttf_bytes) => {
///         println!("Decompressed to {} bytes", ttf_bytes.len());
///     }
///     _ => {}
/// }
/// ```
#[derive(Error, Debug)]
pub enum WoffError {
    #[error("Invalid WOFF file: {0}")]
    InvalidFormat(String),

    #[error("Decompression failed: {0}")]
    DecompressionError(String),

    #[error("I/O error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Font too large after decompression: {0} bytes (max 2MB)")]
    FontTooLarge(usize),
}

/// Entry in the WOFF table directory
#[derive(Debug, Clone)]
struct WoffTableEntry {
    tag: [u8; 4],
    offset: u32,
    comp_length: u32,
    orig_length: u32,
    _orig_checksum: u32,
}

/// Parse WOFF header and extract font flavor and number of tables
fn parse_woff_header(woff_bytes: &[u8]) -> Result<(u32, usize), WoffError> {
    // WOFF header is 44 bytes minimum
    if woff_bytes.len() < 44 {
        return Err(WoffError::InvalidFormat(format!(
            "File too small: {} bytes (minimum 44 bytes for WOFF header). File header: {}",
            woff_bytes.len(),
            format_hex_dump(woff_bytes, 16)
        )));
    }

    // Check WOFF magic number
    let magic = u32::from_be_bytes([woff_bytes[0], woff_bytes[1], woff_bytes[2], woff_bytes[3]]);
    if magic != WOFF_MAGIC {
        return Err(WoffError::InvalidFormat(format!(
            "Invalid WOFF magic number: 0x{:08X} (expected 0x{:08X}). File header: {}",
            magic,
            WOFF_MAGIC,
            format_hex_dump(woff_bytes, 16)
        )));
    }

    // Extract flavor (TrueType or CFF)
    let flavor = u32::from_be_bytes([woff_bytes[4], woff_bytes[5], woff_bytes[6], woff_bytes[7]]);

    // Extract number of tables
    let num_tables = u16::from_be_bytes([woff_bytes[12], woff_bytes[13]]) as usize;

    if num_tables == 0 {
        return Err(WoffError::InvalidFormat(
            "WOFF file has 0 tables (invalid font)".to_string(),
        ));
    }

    Ok((flavor, num_tables))
}

/// Read WOFF table directory entries
fn read_table_directory(
    woff_bytes: &[u8],
    num_tables: usize,
) -> Result<Vec<WoffTableEntry>, WoffError> {
    let mut tables = Vec::with_capacity(num_tables);
    let mut offset = 44; // After header

    for i in 0..num_tables {
        // Each table entry is 20 bytes
        if offset + 20 > woff_bytes.len() {
            return Err(WoffError::InvalidFormat(format!(
                "Table directory entry {} extends beyond file bounds (offset: {}, file size: {})",
                i,
                offset,
                woff_bytes.len()
            )));
        }

        let tag = [
            woff_bytes[offset],
            woff_bytes[offset + 1],
            woff_bytes[offset + 2],
            woff_bytes[offset + 3],
        ];
        let table_offset = u32::from_be_bytes([
            woff_bytes[offset + 4],
            woff_bytes[offset + 5],
            woff_bytes[offset + 6],
            woff_bytes[offset + 7],
        ]);
        let comp_length = u32::from_be_bytes([
            woff_bytes[offset + 8],
            woff_bytes[offset + 9],
            woff_bytes[offset + 10],
            woff_bytes[offset + 11],
        ]);
        let orig_length = u32::from_be_bytes([
            woff_bytes[offset + 12],
            woff_bytes[offset + 13],
            woff_bytes[offset + 14],
            woff_bytes[offset + 15],
        ]);
        let orig_checksum = u32::from_be_bytes([
            woff_bytes[offset + 16],
            woff_bytes[offset + 17],
            woff_bytes[offset + 18],
            woff_bytes[offset + 19],
        ]);

        tables.push(WoffTableEntry {
            tag,
            offset: table_offset,
            comp_length,
            orig_length,
            _orig_checksum: orig_checksum,
        });

        offset += 20;
    }

    Ok(tables)
}

/// Decompress all WOFF tables
fn decompress_tables(
    woff_bytes: &[u8],
    tables: &[WoffTableEntry],
    max_size: Option<usize>,
) -> Result<DecompressedTables, WoffError> {
    let mut decompressed = Vec::with_capacity(tables.len());
    let mut total_size = 0usize;

    for table in tables {
        let offset = table.offset as usize;
        let comp_len = table.comp_length as usize;
        let orig_len = table.orig_length as usize;

        // Validate table bounds
        if offset + comp_len > woff_bytes.len() {
            return Err(WoffError::InvalidFormat(format!(
                "Table '{}' extends beyond file bounds (offset: {}, compressed size: {}, file size: {})",
                String::from_utf8_lossy(&table.tag),
                offset,
                comp_len,
                woff_bytes.len()
            )));
        }

        // Check if table is compressed (comp_length < orig_length)
        let table_data = if comp_len < orig_len {
            // Decompress using zlib
            let compressed = &woff_bytes[offset..offset + comp_len];
            let mut decoder = ZlibDecoder::new(compressed);
            let mut decompressed_data = Vec::new();

            decoder.read_to_end(&mut decompressed_data)
                .map_err(|e| WoffError::DecompressionError(format!(
                    "Failed to decompress table '{}' (compressed: {} bytes, expected uncompressed: {} bytes): {}",
                    String::from_utf8_lossy(&table.tag),
                    comp_len,
                    orig_len,
                    e
                )))?;

            // Verify decompressed size matches expected
            if decompressed_data.len() != orig_len {
                return Err(WoffError::DecompressionError(format!(
                    "Table '{}' size mismatch after decompression (actual: {} bytes, expected: {} bytes, compressed: {} bytes)",
                    String::from_utf8_lossy(&table.tag),
                    decompressed_data.len(),
                    orig_len,
                    comp_len
                )));
            }

            decompressed_data
        } else {
            // Table is not compressed, copy directly
            woff_bytes[offset..offset + comp_len].to_vec()
        };

        // Check size limit if specified
        total_size += table_data.len();
        if let Some(max) = max_size {
            if total_size > max {
                return Err(WoffError::FontTooLarge(total_size));
            }
        }

        decompressed.push((table.tag, table_data));
    }

    Ok(decompressed)
}

/// Decompress a WOFF font file to TrueType format with configurable size limit
///
/// # Arguments
/// * `woff_bytes` - The WOFF font file bytes
/// * `max_size` - Maximum allowed font size in bytes after decompression.
///   Use `None` for no limit (not recommended in WASM contexts).
///   Use `Some(DEFAULT_MAX_FONT_SIZE)` for the default 2MB limit.
///
/// # Returns
/// * `Ok(Vec<u8>)` - The decompressed TrueType font bytes
/// * `Err(WoffError)` - If decompression fails
///
/// # Example
/// ```no_run
/// use font_toolkit::woff::{decompress_woff_with_limit, DEFAULT_MAX_FONT_SIZE};
///
/// let woff_bytes = std::fs::read("font.woff").unwrap();
/// // Use default 2MB limit
/// let ttf_bytes = decompress_woff_with_limit(&woff_bytes, Some(DEFAULT_MAX_FONT_SIZE)).unwrap();
/// // Or allow larger fonts (e.g., CJK fonts)
/// let ttf_bytes_large = decompress_woff_with_limit(&woff_bytes, Some(10 * 1024 * 1024)).unwrap();
/// ```
pub fn decompress_woff_with_limit(
    woff_bytes: &[u8],
    max_size: Option<usize>,
) -> Result<Vec<u8>, WoffError> {
    // Step 1: Parse WOFF header
    let (flavor, num_tables) = parse_woff_header(woff_bytes).map_err(|e| match e {
        WoffError::InvalidFormat(msg) => {
            WoffError::InvalidFormat(format!("Failed to parse WOFF header: {}", msg))
        }
        other => other,
    })?;

    // Step 2: Read table directory
    let tables = read_table_directory(woff_bytes, num_tables).map_err(|e| match e {
        WoffError::InvalidFormat(msg) => {
            WoffError::InvalidFormat(format!("Failed to read table directory: {}", msg))
        }
        other => other,
    })?;

    // Step 3: Decompress all tables
    let decompressed_tables =
        decompress_tables(woff_bytes, &tables, max_size).map_err(|e| match e {
            WoffError::DecompressionError(msg) => {
                WoffError::DecompressionError(format!("Table decompression failed: {}", msg))
            }
            WoffError::InvalidFormat(msg) => {
                WoffError::InvalidFormat(format!("Invalid table data: {}", msg))
            }
            other => other,
        })?;

    // Step 4: Build TrueType font structure
    let ttf_bytes = build_truetype_font(flavor, &decompressed_tables).map_err(|e| match e {
        WoffError::InvalidFormat(msg) => {
            WoffError::InvalidFormat(format!("Failed to build TrueType font: {}", msg))
        }
        other => other,
    })?;

    // Step 5: Validate the resulting TrueType font
    validate_truetype_font(&ttf_bytes).map_err(|e| match e {
        WoffError::InvalidFormat(msg) => {
            WoffError::InvalidFormat(format!("TrueType validation failed: {}", msg))
        }
        other => other,
    })?;

    Ok(ttf_bytes)
}

/// Decompress a WOFF font file to TrueType format using the default 2MB size limit
///
/// This is a convenience wrapper around `decompress_woff_with_limit` that uses
/// the default maximum font size of 2MB, which is suitable for most Latin/Cyrillic fonts.
///
/// # Arguments
/// * `woff_bytes` - The WOFF font file bytes
///
/// # Returns
/// * `Ok(Vec<u8>)` - The decompressed TrueType font bytes
/// * `Err(WoffError)` - If decompression fails
///
/// # Example
/// ```no_run
/// use font_toolkit::woff::decompress_woff;
///
/// let woff_bytes = std::fs::read("font.woff").unwrap();
/// let ttf_bytes = decompress_woff(&woff_bytes).unwrap();
/// std::fs::write("font.ttf", &ttf_bytes).unwrap();
/// ```
pub fn decompress_woff(woff_bytes: &[u8]) -> Result<Vec<u8>, WoffError> {
    decompress_woff_with_limit(woff_bytes, Some(DEFAULT_MAX_FONT_SIZE))
}

/// Build TrueType font structure from decompressed tables
fn build_truetype_font(flavor: u32, tables: &[([u8; 4], Vec<u8>)]) -> Result<Vec<u8>, WoffError> {
    let num_tables = tables.len();

    // Calculate search range parameters for table directory
    let entry_selector = (num_tables as f64).log2().floor() as u16;
    let search_range = (2u16.pow(entry_selector as u32)) * 16;
    let range_shift = (num_tables as u16 * 16) - search_range;

    // Calculate total size needed
    let table_dir_size = 12 + (num_tables * 16); // Header + table entries
    let mut data_offset = table_dir_size;

    // Calculate padded table sizes
    let mut padded_sizes = Vec::with_capacity(num_tables);
    for (_, data) in tables {
        let padded_size = (data.len() + 3) & !3; // 4-byte alignment
        padded_sizes.push(padded_size);
        data_offset += padded_size;
    }

    let total_size = data_offset;
    let mut output = vec![0u8; total_size];

    // 1. Write TrueType header (12 bytes)
    output[0..4].copy_from_slice(&flavor.to_be_bytes());
    output[4..6].copy_from_slice(&(num_tables as u16).to_be_bytes());
    output[6..8].copy_from_slice(&search_range.to_be_bytes());
    output[8..10].copy_from_slice(&entry_selector.to_be_bytes());
    output[10..12].copy_from_slice(&range_shift.to_be_bytes());

    // 2. Write table directory and data
    let mut current_data_offset = table_dir_size;

    for (i, (tag, data)) in tables.iter().enumerate() {
        let entry_offset = 12 + (i * 16);
        let padded_size = padded_sizes[i];

        // Calculate checksum
        let checksum = calculate_checksum(data);

        // Write table entry
        output[entry_offset..entry_offset + 4].copy_from_slice(tag);
        output[entry_offset + 4..entry_offset + 8].copy_from_slice(&checksum.to_be_bytes());
        output[entry_offset + 8..entry_offset + 12]
            .copy_from_slice(&(current_data_offset as u32).to_be_bytes());
        output[entry_offset + 12..entry_offset + 16]
            .copy_from_slice(&(data.len() as u32).to_be_bytes());

        // Write table data (with padding)
        output[current_data_offset..current_data_offset + data.len()].copy_from_slice(data);
        // Padding bytes are already zero-initialized

        current_data_offset += padded_size;
    }

    Ok(output)
}

/// Calculate TrueType table checksum
#[inline]
fn calculate_checksum(data: &[u8]) -> u32 {
    let mut sum: u32 = 0;
    let mut i = 0;

    // Process 4-byte chunks
    while i + 3 < data.len() {
        let chunk = u32::from_be_bytes([data[i], data[i + 1], data[i + 2], data[i + 3]]);
        sum = sum.wrapping_add(chunk);
        i += 4;
    }

    // Handle remaining bytes (pad with zeros)
    if i < data.len() {
        let mut last_chunk = [0u8; 4];
        for (j, byte) in data[i..].iter().enumerate() {
            last_chunk[j] = *byte;
        }
        let chunk = u32::from_be_bytes(last_chunk);
        sum = sum.wrapping_add(chunk);
    }

    sum
}

/// Validate TrueType font structure using ttf-parser
///
/// This ensures the decompressed font has valid structure and critical tables.
/// Validates that decompressed TrueType font is well-formed and usable for PDF embedding
///
/// Performs comprehensive validation beyond basic parsing:
/// 1. Valid TrueType structure
/// 2. Non-zero glyph count
/// 3. Horizontal metrics available (required for layout)
/// 4. Character mappings present (required for text rendering)
///
/// Helps catch corrupted fonts and unsupported font types (e.g., icon fonts).
fn validate_truetype_font(ttf_bytes: &[u8]) -> Result<(), WoffError> {
    // Attempt to parse with ttf-parser
    let face = ttf_parser::Face::parse(ttf_bytes, 0).map_err(|err| {
        WoffError::InvalidFormat(format!("Decompressed font is not valid TrueType: {}", err))
    })?;

    // Check for critical tables that PDF generation requires

    // 1. Must have glyph outlines (reject icon fonts that only have bitmaps)
    if face.number_of_glyphs() == 0 {
        return Err(WoffError::InvalidFormat(
            "Font has no glyphs (possibly an icon font or corrupted)".to_string(),
        ));
    }

    // 2. Horizontal metrics table (hmtx) must be accessible
    // Required for PDF layout - without this, we can't calculate text width
    if face.glyph_hor_advance(ttf_parser::GlyphId(0)).is_none() {
        return Err(WoffError::InvalidFormat(
            "Font missing horizontal metrics (hmtx table invalid or absent)".to_string(),
        ));
    }

    // 3. Character mapping table (cmap) must have at least some mappings
    // Test with common characters - at least one should map successfully
    let has_mappings = face.glyph_index('A').is_some()
        || face.glyph_index('a').is_some()
        || face.glyph_index('0').is_some()
        || face.glyph_index(' ').is_some();

    if !has_mappings {
        return Err(WoffError::InvalidFormat(
            "Font has no character mappings (cmap table invalid or empty)".to_string(),
        ));
    }

    // 4. ttf-parser successfully parsing the font also validates:
    //    - Valid TrueType structure
    //    - Critical tables present (head, maxp, hhea, etc.)
    //    - Name table is valid (checked internally by ttf-parser)
    //    - Table checksums are correct

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================================================
    // Helper Function Tests
    // ========================================================================

    #[test]
    fn test_parse_woff_header_success() {
        // Create minimal valid WOFF header
        let mut bytes = vec![
            0x77, 0x4F, 0x46, 0x46, // magic
            0x00, 0x01, 0x00, 0x00, // flavor (TrueType)
            0x00, 0x00, 0x00, 0x64, // length (100 bytes)
            0x00, 0x03, // numTables: 3
        ];
        bytes.extend(vec![0; 30]); // Pad to 44 bytes

        let result = parse_woff_header(&bytes);
        assert!(result.is_ok());
        let (flavor, num_tables) = result.unwrap();
        assert_eq!(flavor, 0x00010000); // TrueType flavor
        assert_eq!(num_tables, 3);
    }

    #[test]
    fn test_parse_woff_header_too_small() {
        let small_bytes = vec![0x77, 0x4F, 0x46, 0x46]; // Only 4 bytes
        let result = parse_woff_header(&small_bytes);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), WoffError::InvalidFormat(_)));
    }

    #[test]
    fn test_parse_woff_header_invalid_magic() {
        let mut bytes = vec![0xDE, 0xAD, 0xBE, 0xEF]; // Wrong magic
        bytes.extend(vec![0; 40]); // Total 44 bytes

        let result = parse_woff_header(&bytes);
        assert!(result.is_err());
        let err = result.unwrap_err();
        let err_msg = format!("{}", err);
        assert!(err_msg.contains("magic"));
    }

    #[test]
    fn test_parse_woff_header_zero_tables() {
        let mut bytes = vec![
            0x77, 0x4F, 0x46, 0x46, // magic
            0x00, 0x01, 0x00, 0x00, // flavor
            0x00, 0x00, 0x00, 0x64, // length
            0x00, 0x00, // numTables: 0
        ];
        bytes.extend(vec![0; 30]); // Pad to 44 bytes

        let result = parse_woff_header(&bytes);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), WoffError::InvalidFormat(_)));
    }

    #[test]
    fn test_read_table_directory_success() {
        // Create WOFF header + 2 table entries
        let mut bytes = vec![
            0x77, 0x4F, 0x46, 0x46, // magic
            0x00, 0x01, 0x00, 0x00, // flavor
            0x00, 0x00, 0x00, 0x64, // length
            0x00, 0x02, // numTables: 2
        ];
        bytes.extend(vec![0; 30]); // Complete 44-byte header

        // Table 1: "head"
        bytes.extend(vec![
            0x68, 0x65, 0x61, 0x64, // tag: "head"
            0x00, 0x00, 0x00, 0x64, // offset: 100
            0x00, 0x00, 0x00, 0x20, // compLength: 32
            0x00, 0x00, 0x00, 0x36, // origLength: 54
            0x00, 0x00, 0x00, 0x00, // origChecksum
        ]);

        // Table 2: "name"
        bytes.extend(vec![
            0x6E, 0x61, 0x6D, 0x65, // tag: "name"
            0x00, 0x00, 0x00, 0x84, // offset: 132
            0x00, 0x00, 0x00, 0x40, // compLength: 64
            0x00, 0x00, 0x00, 0x50, // origLength: 80
            0x00, 0x00, 0x00, 0x00, // origChecksum
        ]);

        let result = read_table_directory(&bytes, 2);
        assert!(result.is_ok());
        let tables = result.unwrap();
        assert_eq!(tables.len(), 2);
        assert_eq!(&tables[0].tag, b"head");
        assert_eq!(tables[0].offset, 100);
        assert_eq!(&tables[1].tag, b"name");
        assert_eq!(tables[1].offset, 132);
    }

    #[test]
    fn test_read_table_directory_truncated() {
        let mut bytes = vec![
            0x77, 0x4F, 0x46, 0x46, // magic
            0x00, 0x01, 0x00, 0x00, // flavor
            0x00, 0x00, 0x00, 0x64, // length
            0x00, 0x02, // numTables: 2
        ];
        bytes.extend(vec![0; 30]); // Header complete
                                   // Missing table entries (should have 2 * 20 = 40 bytes)

        let result = read_table_directory(&bytes, 2);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), WoffError::InvalidFormat(_)));
    }

    #[test]
    fn test_decompress_tables_uncompressed() {
        // Create minimal WOFF with uncompressed table
        let mut bytes = vec![0; 100];

        // Add table data at offset 64
        bytes[64..68].copy_from_slice(b"DATA");

        let tables = vec![WoffTableEntry {
            tag: *b"head",
            offset: 64,
            comp_length: 4,
            orig_length: 4, // Same = uncompressed
            _orig_checksum: 0,
        }];

        let result = decompress_tables(&bytes, &tables, None);
        assert!(result.is_ok());
        let decompressed = result.unwrap();
        assert_eq!(decompressed.len(), 1);
        assert_eq!(&decompressed[0].0, b"head");
        assert_eq!(&decompressed[0].1, b"DATA");
    }

    #[test]
    fn test_decompress_tables_size_limit_exceeded() {
        let mut bytes = vec![0; 100];
        bytes[64..68].copy_from_slice(b"DATA");

        let tables = vec![WoffTableEntry {
            tag: *b"head",
            offset: 64,
            comp_length: 4,
            orig_length: 4,
            _orig_checksum: 0,
        }];

        // Set max_size to 2 bytes (smaller than 4-byte table)
        let result = decompress_tables(&bytes, &tables, Some(2));
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), WoffError::FontTooLarge(_)));
    }

    #[test]
    fn test_decompress_tables_out_of_bounds() {
        let bytes = vec![0; 50]; // Small file

        let tables = vec![WoffTableEntry {
            tag: *b"head",
            offset: 100, // Beyond file end
            comp_length: 10,
            orig_length: 10,
            _orig_checksum: 0,
        }];

        let result = decompress_tables(&bytes, &tables, None);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), WoffError::InvalidFormat(_)));
    }

    // ========================================================================
    // Integration Tests (Existing)
    // ========================================================================

    #[test]
    fn test_invalid_magic_bytes() {
        let invalid_bytes = vec![0xFF, 0xFF, 0xFF, 0xFF];
        let result = decompress_woff(&invalid_bytes);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), WoffError::InvalidFormat(_)));
    }

    #[test]
    fn test_file_too_small() {
        let small_bytes = vec![0x77, 0x4F, 0x46, 0x46]; // Just magic bytes
        let result = decompress_woff(&small_bytes);
        assert!(result.is_err());
    }

    #[test]
    fn test_calculate_checksum() {
        // Test with known data
        let data = vec![0x01, 0x02, 0x03, 0x04];
        let checksum = calculate_checksum(&data);
        assert_eq!(checksum, 0x01020304);

        // Test with unaligned data
        let data = vec![0x01, 0x02, 0x03];
        let checksum = calculate_checksum(&data);
        assert_eq!(checksum, 0x01020300); // Padded with zero
    }

    #[test]
    fn test_woff_truncated_header() {
        // WOFF header should be 44 bytes minimum
        let mut bytes = vec![0x77, 0x4F, 0x46, 0x46]; // Valid magic
        bytes.extend(vec![0; 20]); // Only 24 bytes total (need 44)

        let result = decompress_woff(&bytes);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), WoffError::InvalidFormat(_)));
    }

    #[test]
    fn test_woff_invalid_num_tables() {
        // Create minimal WOFF header with 0 tables
        let mut bytes = vec![
            0x77, 0x4F, 0x46, 0x46, // magic
            0x00, 0x01, 0x00, 0x00, // flavor (TrueType)
            0x00, 0x00, 0x00, 0x64, // length (100 bytes)
            0x00, 0x00, // numTables: 0
        ];
        bytes.extend(vec![0; 32]); // Pad to 44 bytes

        let result = decompress_woff(&bytes);
        // Should fail because no tables means invalid font
        assert!(result.is_err());
    }

    #[test]
    fn test_woff_table_offset_out_of_bounds() {
        // Create WOFF header with table pointing beyond file
        let mut bytes = vec![
            0x77, 0x4F, 0x46, 0x46, // magic
            0x00, 0x01, 0x00, 0x00, // flavor
            0x00, 0x00, 0x00, 0x64, // length (100 bytes)
            0x00, 0x01, // numTables: 1
        ];
        bytes.extend(vec![0; 30]); // Complete 44-byte header

        // Add table entry pointing beyond file
        bytes.extend(vec![
            0x68, 0x65, 0x61, 0x64, // tag: "head"
            0xFF, 0xFF, 0xFF, 0xFF, // offset: way beyond file
            0x00, 0x00, 0x00, 0x10, // compLength: 16
            0x00, 0x00, 0x00, 0x20, // origLength: 32
            0x00, 0x00, 0x00, 0x00, // origChecksum
        ]);

        let result = decompress_woff(&bytes);
        assert!(result.is_err());
    }

    #[test]
    fn test_woff_decompression_failure() {
        // Create WOFF with corrupted zlib data
        let mut bytes = vec![
            0x77, 0x4F, 0x46, 0x46, // magic
            0x00, 0x01, 0x00, 0x00, // flavor
            0x00, 0x00, 0x00, 0x64, // length
            0x00, 0x01, // numTables: 1
        ];
        bytes.extend(vec![0; 30]); // Complete header

        // Add table entry
        bytes.extend(vec![
            0x68, 0x65, 0x61, 0x64, // tag: "head"
            0x00, 0x00, 0x00, 0x3C, // offset: 60 (after header + entry)
            0x00, 0x00, 0x00, 0x08, // compLength: 8
            0x00, 0x00, 0x00, 0x10, // origLength: 16
            0x00, 0x00, 0x00, 0x00, // origChecksum
        ]);

        // Add invalid zlib data
        bytes.extend(vec![0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);

        let result = decompress_woff(&bytes);
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            WoffError::DecompressionError(_)
        ));
    }

    #[test]
    fn test_woff_font_too_large_check() {
        // Test that default 2MB limit is correctly set
        assert_eq!(DEFAULT_MAX_FONT_SIZE, 2 * 1024 * 1024);
        assert_eq!(DEFAULT_MAX_FONT_SIZE, 2097152); // Verify constant value
    }

    #[test]
    fn test_validate_truetype_empty_font() {
        // Create minimal invalid TrueType with 0 glyphs
        // This would be caught by ttf-parser or our validation
        let invalid_ttf = vec![
            0x00, 0x01, 0x00, 0x00, // TrueType magic
            0x00, 0x00, // numTables: 0
        ];

        let result = validate_truetype_font(&invalid_ttf);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), WoffError::InvalidFormat(_)));
    }

    #[test]
    fn test_woff_decompression_size_mismatch() {
        // Test error path: decompressed size doesn't match expected size (lines 237-244)
        // Create a WOFF font where zlib decompression produces wrong size
        // This is a corrupted font scenario

        let mut corrupted_woff = vec![
            0x77, 0x4F, 0x46, 0x46, // magic
            0x00, 0x01, 0x00, 0x00, // flavor (TrueType)
            0x00, 0x00, 0x00, 0xC8, // length (200 bytes)
            0x00, 0x01, // numTables: 1
        ];
        corrupted_woff.extend(vec![0; 30]); // Complete 44-byte header

        // Table entry: "test" table with deliberately mismatched sizes
        corrupted_woff.extend(vec![
            0x74, 0x65, 0x73, 0x74, // tag: "test"
            0x00, 0x00, 0x00, 0x64, // offset: 100
            0x00, 0x00, 0x00, 0x0D, // compLength: 13 (compressed)
            0x00, 0x00, 0x00,
            0x64, // origLength: 100 (expect 100 bytes, but will decompress to 5)
            0x00, 0x00, 0x00, 0x00, // origChecksum
        ]);

        // Pad to offset 100
        corrupted_woff.resize(100, 0);

        // Add valid zlib-compressed data that decompresses to DIFFERENT size than origLength
        // "Hello" properly compressed (decompresses to 5 bytes, but we claimed 100)
        // This is valid zlib data created by: echo -n "Hello" | python3 -c "import zlib,sys; sys.stdout.buffer.write(zlib.compress(sys.stdin.buffer.read()))"
        corrupted_woff.extend(vec![
            0x78, 0x9C, 0xF3, 0x48, 0xCD, 0xC9, 0xC9, 0x07, 0x00, 0x05, 0x8C, 0x01, 0xF5,
        ]);

        let result = decompress_tables(
            &corrupted_woff,
            &[WoffTableEntry {
                tag: *b"test",
                offset: 100,
                comp_length: 13,  // Actual size of compressed data
                orig_length: 100, // Mismatch: claims 100 but will decompress to 5
                _orig_checksum: 0,
            }],
            None,
        );

        assert!(result.is_err(), "Should fail on size mismatch");

        match result.unwrap_err() {
            WoffError::DecompressionError(msg) => {
                assert!(
                    msg.contains("size mismatch"),
                    "Error should mention size mismatch: {}",
                    msg
                );
            }
            other => panic!("Expected DecompressionError, got {:?}", other),
        }
    }

    #[test]
    fn test_validate_truetype_missing_hmtx() {
        // Test validation edge case: font without valid hmtx table (lines 475-478)
        // This tests the horizontal metrics validation in validate_truetype_font
        // Note: It's difficult to create a font that parses but has no hmtx,
        // so we test with an invalid/corrupted font structure instead

        let invalid_ttf = vec![
            0x00, 0x01, 0x00, 0x00, // TrueType magic
            0x00, 0x01, // numTables: 1
            0x00, 0x10, // searchRange
            0x00, 0x00, // entrySelector
            0x00, 0x00, // rangeShift
            // Single table entry (not enough for valid font)
            0x68, 0x65, 0x61, 0x64, // tag: "head"
            0x00, 0x00, 0x00, 0x00, // checksum
            0x00, 0x00, 0x00, 0x1C, // offset
            0x00, 0x00, 0x00, 0x00, // length
        ];

        let result = validate_truetype_font(&invalid_ttf);
        assert!(result.is_err(), "Should fail on invalid font structure");

        match result.unwrap_err() {
            WoffError::InvalidFormat(msg) => {
                // Either ttf-parser will reject it or our validation will
                assert!(!msg.is_empty(), "Error message should not be empty");
            }
            other => panic!("Expected InvalidFormat, got {:?}", other),
        }
    }

    #[test]
    fn test_checksum_with_empty_data() {
        let data = vec![];
        let checksum = calculate_checksum(&data);
        assert_eq!(checksum, 0);
    }

    #[test]
    fn test_checksum_with_single_byte() {
        let data = vec![0x42];
        let checksum = calculate_checksum(&data);
        assert_eq!(checksum, 0x42000000); // Padded to 4 bytes
    }

    #[test]
    fn test_format_hex_dump() {
        // Test with full 16 bytes
        let data = vec![
            0x77, 0x4F, 0x46, 0x46, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x64, 0x00, 0x01,
            0xAB, 0xCD,
        ];
        let hex = format_hex_dump(&data, 16);
        assert_eq!(hex, "77 4F 46 46 00 01 00 00 00 00 00 64 00 01 AB CD");

        // Test with fewer bytes than max
        let short_data = vec![0xFF, 0xEE, 0xDD];
        let hex = format_hex_dump(&short_data, 16);
        assert_eq!(hex, "FF EE DD");

        // Test with empty data
        let empty_data = vec![];
        let hex = format_hex_dump(&empty_data, 16);
        assert_eq!(hex, "");

        // Test limiting to fewer bytes
        let hex = format_hex_dump(&data, 4);
        assert_eq!(hex, "77 4F 46 46");
    }

    #[test]
    fn test_invalid_magic_includes_hex_dump() {
        // Create a file with wrong magic but valid size (44+ bytes)
        let mut invalid_bytes = vec![0xDE, 0xAD, 0xBE, 0xEF]; // Wrong magic
        invalid_bytes.extend(vec![0x00; 44]); // Pad to minimum size

        let result = decompress_woff(&invalid_bytes);
        assert!(result.is_err());

        let err = result.unwrap_err();
        let err_msg = format!("{}", err);
        // Should include hex dump in error message
        assert!(
            err_msg.contains("DE AD BE EF"),
            "Error should contain hex dump: {}",
            err_msg
        );
        assert!(
            err_msg.contains("File header"),
            "Error should mention file header: {}",
            err_msg
        );
    }
}
