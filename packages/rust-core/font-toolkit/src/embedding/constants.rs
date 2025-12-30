//! ABOUTME: Constants for PDF font embedding
//! ABOUTME: Weight thresholds, hash constants, and PDF structure sizes

/// Font weight threshold for Light style (≤300)
pub const WEIGHT_LIGHT_MAX: u16 = 300;

/// Font weight threshold for Regular style (≤500)
pub const WEIGHT_REGULAR_MAX: u16 = 500;

/// Font weight threshold for Medium style (≤600)
pub const WEIGHT_MEDIUM_MAX: u16 = 600;

/// Font weight threshold for Bold style (≥600)
pub const WEIGHT_BOLD_MIN: u16 = 600;

/// Hash multiplier for subset prefix generation (Knuth's multiplicative hash)
pub const HASH_MULTIPLIER_1: u64 = 0x517cc1b727220a95;

/// Hash multiplier for subset prefix mixing (golden ratio based)
pub const HASH_MULTIPLIER_2: u64 = 0x9e3779b97f4a7c15;

/// Number of letters in subset prefix (PDF convention: 6 uppercase letters)
pub const SUBSET_PREFIX_LENGTH: usize = 6;

/// CIDSet bitmap size in bytes (covers BMP: 65536 bits = 8192 bytes)
pub const CID_SET_SIZE_BYTES: usize = 8192;

/// Maximum Unicode codepoint in BMP (Basic Multilingual Plane)
pub const BMP_MAX_CODEPOINT: u32 = 0xFFFF;

/// CIDToGIDMap stream size (2 bytes per CID for full BMP)
pub const CID_TO_GID_MAP_SIZE: usize = 0x10000 * 2;

/// Default StemV value when measurement fails
pub const DEFAULT_STEM_V: i64 = 80;

/// Minimum allowed StemV value
pub const STEM_V_MIN: i64 = 50;

/// Maximum allowed StemV value
pub const STEM_V_MAX: i64 = 200;

/// Default glyph width when not found
pub const DEFAULT_GLYPH_WIDTH: u16 = 1000;

/// PDF FontDescriptor Flags: Symbolic font (non-standard encoding)
pub const FONT_FLAGS_SYMBOLIC: i32 = 32;
