# Font Toolkit Architecture

**Version:** 1.1  
**Last Updated:** 2025-11-10  
**Crate:** `font-toolkit` (packages/rust-core/font-toolkit)

## Overview

The **font-toolkit** crate provides font processing for ResumeWright's PDF generation pipeline, handling the complete workflow from web fonts to embedded PDF fonts.

### Key Responsibilities

- **Font Mapping:** CSS font families → PDF Standard 14 fonts / Google Fonts
- **Font Embedding:** TrueType fonts → PDF CIDFont structures with ToUnicode CMaps
- **Font Subsetting:** Reduce font file sizes by 60-90% (feature-gated)
- **Format Conversion:** WOFF/WOFF2 → TrueType decompression

### WASM Size Impact

- **Without subsetting:** 2.87 MB uncompressed, 1.43 MB gzipped
- **With subsetting:** 3.59 MB uncompressed (+720KB), 1.43 MB gzipped
- **Browser limits:** Chrome 2GB, Firefox 200MB (we're at <0.2% of Firefox limit)
- **Conclusion:** Enable `advanced-fonts` by default (gzipped size unchanged, PDF size reduced 90%)

---

## Module Organization

### Structure

```
font-toolkit/
├── src/
│   ├── lib.rs           # Public API and module declarations
│   ├── mapper.rs        # Font mapping and selection
│   ├── embedding.rs     # PDF font embedding (CIDFont)
│   ├── subsetter.rs     # Font subsetting (feature: advanced-fonts)
│   ├── woff.rs          # WOFF decompression
│   ├── woff2.rs         # WOFF2 decompression
│   └── truetype.rs      # TrueType utilities
├── tests/               # Integration and unit tests
├── benches/             # Performance benchmarks
└── ARCHITECTURE.md      # This document
```

### Module Dependencies

```
mapper.rs → lib.rs (FontWeight, FontStyle)
embedding.rs → truetype.rs (extract_glyph_widths)
subsetter.rs → (no internal deps)
woff.rs → (no internal deps)
woff2.rs → (no internal deps)
truetype.rs → (no internal deps)
```

---

## Module Details

### 1. `mapper.rs` - Font Mapping & Selection

Maps CSS font families to PDF-compatible fonts.

**Public API:**
```rust
pub fn is_google_font(family: &str) -> bool
pub fn map_web_safe_font(font_family: &str) -> &'static str
pub fn select_font_from_fallback_chain(
    fallback_chain: &str,
    available_fonts: &HashSet<String>
) -> String
pub fn select_font_variant(
    base_font: &str,
    weight: FontWeight,
    style: FontStyle
) -> String
```

**Logic:**
1. Parse fallback chain: `"Roboto, Arial, sans-serif"`
2. Check Google Fonts registry (50 fonts, ~98% coverage)
3. Map web-safe fonts: Arial → Helvetica, Times → Times-Roman
4. Select variant: bold (700+), italic, bold-italic

**Google Fonts Registry:**
- Tier 1 (1-10): ~90% coverage (Roboto, Open Sans, Lato, Montserrat...)
- Tier 2 (11-30): ~95% coverage (Inter, Noto Sans, Ubuntu...)
- Tier 3 (31-50): ~98% coverage (Manrope, Outfit, Space Grotesk...)

**PDF Standard 14 Fonts:**
```
Helvetica, Helvetica-Bold, Helvetica-Oblique, Helvetica-BoldOblique
Times-Roman, Times-Bold, Times-Italic, Times-BoldItalic
Courier, Courier-Bold, Courier-Oblique, Courier-BoldOblique
Symbol, ZapfDingbats
```

### 2. `embedding.rs` - PDF Font Embedding

Embeds TrueType fonts into PDF as CIDFont structures.

**Public API:**
```rust
pub fn embed_truetype_font(
    doc: &mut Document,
    font_bytes: &[u8],
    font_name: &str,
    weight: u16,
    is_italic: bool
) -> Result<EmbeddedFont, EmbedError>
```

**PDF Structure Created:**
```
Type 0 Font
  ├─ BaseFont: /FontName-Weight[-Italic]
  ├─ Encoding: Identity-H
  ├─ ToUnicode: CMap stream
  └─ DescendantFonts: [CIDFont Type 2]
      └─ FontDescriptor
          └─ FontFile2: TrueType stream (FlateDecode)
```

**Pipeline:**
1. Parse font with ttf-parser
2. Generate PostScript name (e.g., `Roboto-Bold`)
3. Create FontFile2 stream (compressed TrueType)
4. Create FontDescriptor (metrics: bbox, ascent, descent)
5. Create CIDFont (Type 2, TrueType-based)
6. Create ToUnicode CMap (glyph → Unicode mapping)
7. Create Type 0 Font (top-level object)

### 3. `subsetter.rs` - Font Subsetting

Reduces font file sizes by extracting only used glyphs.

**Public API:**
```rust
pub fn subset_font_core(
    font_bytes: &[u8],
    face: Option<&Face>,
    text: &str,
    return_metrics: bool,
) -> Result<(Vec<u8>, Option<SubsetMetrics>), SubsetError>
```

**Strategy:**
1. Collect glyphs: Parse CV text → glyph IDs (via cmap table)
2. Handle composites: Recursively include glyph dependencies
3. Rebuild tables: glyf, loca, hmtx, cmap
4. Validate: Parse with ttf-parser, verify mappings

**Performance:**
- Size reduction: 60-90% (200-500KB → 10-30KB)
- Subsetting time: <500ms per font
- Memory usage: <10MB per font

### 4. `woff.rs` - WOFF Decompression

Decompresses WOFF to TrueType.

**Public API:**
```rust
pub fn decompress_woff(woff_bytes: &[u8]) -> Result<Vec<u8>, WoffError>
pub fn decompress_woff_with_limit(woff_bytes: &[u8], max_size: Option<usize>) -> Result<Vec<u8>, WoffError>
```

**Algorithm:**
1. Validate magic number: `0x774F4646` ("wOFF")
2. Parse header: flavor, numTables, totalSfntSize
3. Decompress each table with zlib (flate2)
4. Rebuild TrueType structure with checksums
5. Validate output with ttf-parser

**Safety:** Max font size 10 MB (prevents zip bombs)

### 5. `woff2.rs` - WOFF2 Decompression

Decompresses WOFF2 to TrueType (Brotli compression, 30% smaller than WOFF).

**Public API:**
```rust
pub fn decompress_woff2(woff2_bytes: &[u8]) -> Result<Vec<u8>, Woff2Error>
pub fn decompress_woff2_with_limit(woff2_bytes: &[u8], max_size: Option<usize>) -> Result<Vec<u8>, Woff2Error>
```

Uses `woff2-patched` crate (Typst's fork with transformation support).

### 6. `truetype.rs` - TrueType Utilities

**Public API:**
```rust
pub fn extract_glyph_widths(face: &Face) -> Vec<u16>
```

Extracts advance widths for all glyphs in font (used by embedding).

---

## Font Processing Pipeline

### Complete Workflow

```
TSX CV (Claude) → Font Detection (mapper.rs) → Font Loading (Google Fonts API)
  → Decompression (woff2.rs/woff.rs) → Subsetting (subsetter.rs, optional)
  → Embedding (embedding.rs) → PDF Document
```

### Decision Tree

```
Font specified in TSX
  ├─ Is Google Font? → Download WOFF2 → Decompress
  ├─ Web-safe font? → Map to Standard 14 → Skip embedding
  ├─ WOFF/WOFF2? → Decompress to TrueType
  ├─ Enable subsetting? → Extract used glyphs
  └─ Embed in PDF (CIDFont + ToUnicode CMap)
```

---

## CMap Generation Algorithm

### Purpose

ToUnicode CMaps enable text extraction, copy/paste, screen readers, and PDF search.

### Algorithm: `generate_full_cmap()`

1. **Build reverse mapping:** Scan Unicode range U+0020-U+FFFF, query font's cmap table, store glyph ID → Unicode
2. **Sort by glyph ID** (deterministic output)
3. **Generate PostScript CMap:**
   ```postscript
   /CIDInit /ProcSet findresource begin
   begincmap
   /CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) >> def
   N beginbfchar
   <GID> <Unicode>  # For each glyph
   endbfchar
   endcmap
   ```
4. **Compress with FlateDecode**

### Performance Optimizations

- Pre-allocate String capacity: `estimated_size = 200 + (mappings.len() * 20) + 70`
- Avoid allocations in loop: Use `write!` macro instead of `format!`
- Scan only necessary ranges (U+0020-U+024F covers Latin)

**Performance:** <10ms for Latin fonts, ~2-5KB compressed

---

## Feature Flags

### `advanced-fonts` Feature

**Default:** Enabled

**Impact:**
- WASM size: +720KB uncompressed (+25%)
- Gzipped: ~0 KB difference (compression negates most)
- PDF per font: -90% size reduction (200-500KB → 10-30KB)

**Cargo.toml:**
```toml
[features]
default = ["advanced-fonts"]
advanced-fonts = ["dep:subsetter"]
```

**Build:**
```bash
# With subsetting (default)
cargo build --release

# Without subsetting
cargo build --release --no-default-features
```

---

## Dependencies

### Core Dependencies

```toml
ttf-parser = "0.24"          # TrueType parsing
subsetter = "0.2"            # Font subsetting (Typst, optional)
woff2-patched = "0.4.0"      # WOFF2 decompression (Typst fork)
flate2 = "1.0"               # WOFF decompression (zlib)
lopdf = { workspace = true } # PDF manipulation
thiserror = { workspace = true }
```

**Why Typst's crates?**
- `woff2-patched`: Original doesn't support transformations
- `subsetter`: Production-ready, handles composites/checksums/validation

---

## Testing Strategy

### Unit Tests (28 tests)

**Coverage:**
- Font mapping (web-safe, Google Fonts, variants)
- PostScript name generation
- Compression (font bytes, CMap)
- WOFF/WOFF2 decompression
- Subsetting with metrics

### Integration Tests (8 test files)

- `embedder_tests.rs` - Font embedding
- `font_fallback_tests.rs` - Fallback chains
- `integration_real_fonts.rs` - Real font workflows
- `integration_tests.rs` - Full pipelines (feature-gated)
- `subsetter_tests.rs` - Subsetting
- `tounicode_cmap_tests.rs` - CMap generation
- `woff2_integration_test.rs` - WOFF2 decompression

**Run:**
```bash
cargo test --package font-toolkit
cargo test --package font-toolkit --features advanced-fonts
```

### Benchmarks

**Location:** `benches/font_toolkit_bench.rs`

**Metrics:**
- WOFF/WOFF2 decompression time
- Font subsetting time
- Font embedding time
- Full pipeline (decompress → subset → embed)

**Targets:**
- Full pipeline: <500ms (high-end), <800ms (low-end)
- Subsetting: <200ms
- WOFF2 decompression: <100ms
- Embedding: <50ms

**Run:**
```bash
cargo bench --package font-toolkit --features advanced-fonts
```

---

## Code Examples

### Basic Font Embedding

```rust
use font_toolkit::embedding::embed_truetype_font;
use lopdf::Document;

let mut doc = Document::new();
let font_bytes = std::fs::read("fonts/Roboto-Regular.ttf")?;

let embedded = embed_truetype_font(
    &mut doc,
    &font_bytes,
    "Roboto",
    400,    // weight
    false,  // is_italic
)?;

println!("Font embedded as {}", embedded.resource_name);
```

### Subsetting Workflow

```rust
use font_toolkit::subsetter::subset_font_core;

let font_bytes = std::fs::read("fonts/Roboto-Regular.ttf")?;
let cv_text = "John Doe\nSoftware Engineer\nSkills: Rust, TypeScript";

// Subset font with metrics
let (subset_bytes, metrics_opt) = subset_font_core(&font_bytes, None, cv_text, true)?;
let metrics = metrics_opt.unwrap();

println!("Original: {} KB → Subset: {} KB ({:.1}% reduction)",
    metrics.original_size / 1024,
    metrics.subset_size / 1024,
    metrics.size_reduction_pct
);
// Output: Original: 168 KB → Subset: 12 KB (92.9% reduction)
```

### Format Detection

```rust
use font_toolkit::{decompress_woff, decompress_woff2};

fn process_font(font_bytes: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let magic = u32::from_be_bytes([font_bytes[0], font_bytes[1], font_bytes[2], font_bytes[3]]);
    
    match magic {
        0x774F4646 => Ok(decompress_woff(font_bytes)?),      // WOFF
        0x774F4632 => Ok(decompress_woff2(font_bytes)?),     // WOFF2
        0x00010000 | 0x74727565 => Ok(font_bytes.to_vec()), // TrueType
        _ => Err("Unknown font format".into())
    }
}
```

### Font Mapping Chain

```rust
use font_toolkit::mapper::{select_font_from_fallback_chain, select_font_variant};
use font_toolkit::{FontWeight, FontStyle};
use std::collections::HashSet;

let mut available_fonts = HashSet::new();
available_fonts.insert("Roboto".to_string());

let base_font = select_font_from_fallback_chain(
    "Inter, Roboto, Arial, sans-serif",
    &available_fonts,
);
// Returns: "Roboto"

let pdf_font = select_font_variant(&base_font, FontWeight::Bold, FontStyle::Italic);
// Returns: "Roboto-BoldItalic"
```

---

## Performance Considerations

### Hot Path Optimizations

**CMap Generation:**
- Pre-allocate String capacity
- Use `write!` macro (no allocations in loops)
- Scan only necessary Unicode ranges

**Subsetting:**
- Reuse Face parsing across operations
- Use HashSet for O(1) glyph lookups

**Compression:**
- Use `flate2::Compression::default()` (level 6)
- Higher levels don't significantly reduce size

### Memory Management

- **Buffers:** Reuse `Vec<u8>` where possible
- **Strings:** Use `String::with_capacity()` for known sizes
- **Face parsing:** Parse once, use multiple times

---

## Error Handling

### Error Types

```rust
// embedding.rs
#[derive(Debug, thiserror::Error)]
pub enum EmbedError {
    #[error("Failed to parse font: {0}")]
    ParseError(String),
    #[error("Failed to extract font metrics: {0}")]
    MetricsError(String),
    #[error("Failed to create PDF object: {0}")]
    PDFError(String),
}

// subsetter.rs
#[derive(Debug, thiserror::Error)]
pub enum SubsetError {
    #[error("Failed to parse font: {0}")]
    InvalidFont(String),
    #[error("Subsetting failed: {0}")]
    SubsetFailed(String),
}

// woff.rs / woff2.rs
#[derive(Debug, thiserror::Error)]
pub enum WoffError {
    #[error("Invalid WOFF format: {0}")]
    InvalidFormat(String),
    #[error("Decompression failed: {0}")]
    DecompressionFailed(String),
}
```

### Graceful Fallbacks

```rust
// If subsetting fails, use full font
let font_bytes = match subset_font_core(&ttf_bytes, None, cv_text, false) {
    Ok((subset, _)) => subset,
    Err(e) => {
        eprintln!("Subsetting failed: {}, using full font", e);
        ttf_bytes.to_vec()
    }
};
```

---

## Related Documentation

- **Rust conventions:** `memory-bank://resumewright/rust-conventions.md`
- **Architecture summary:** `memory-bank://resumewright/architecture-summary.md`
- **Related crates:** layout-types (FontWeight, FontStyle), pdf-generator (uses embedded fonts), layout-engine (determines fonts to load)

---

**End of Architecture Documentation**
