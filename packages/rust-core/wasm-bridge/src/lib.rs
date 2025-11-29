//! # WASM Bridge for TSX to PDF Conversion
//!
//! **The primary WASM interface** for ResumeWright's browser extension, providing JavaScript bindings
//! for converting Claude.ai-generated TSX resume/CV code into professional, ATS-compatible PDF files.
//!
//! ## Overview
//!
//! This crate orchestrates the complete conversion pipeline:
//! 1. **TSX Parsing** - Parse TypeScript/JSX using SWC parser ([`tsx-parser`])
//! 2. **Metadata Extraction** - Extract CV data (name, title, sections) ([`cv-domain`])
//! 3. **Style Resolution** - Resolve CSS styles and compute text metrics ([`style-resolver`])
//! 4. **Layout Calculation** - Compute box model and page breaks directly from TSX ([`layout-engine`])
//! 5. **PDF Generation** - Render layout to PDF bytes ([`pdf-generator`])
//!
//! All processing happens **client-side in the browser** with zero backend dependencies,
//! ensuring complete privacy and offline functionality.
//!
//! ## Public API
//!
//! ### Main Converter Interface
//!
//! ```rust,no_run
//! use wasm_bindgen::prelude::*;
//!
//! # #[wasm_bindgen]
//! # pub struct TsxToPdfConverter;
//! # #[wasm_bindgen]
//! # impl TsxToPdfConverter {
//! #     #[wasm_bindgen(constructor)]
//! #     pub fn new() -> Self { Self }
//! # }
//! // Create converter instance
//! let converter = TsxToPdfConverter::new();
//!
//! // Detect font requirements (Step 1 of two-step API)
//! // let font_reqs = converter.detect_fonts(tsx)?;
//!
//! // Convert TSX to PDF with fonts and progress tracking (Step 2)
//! // let pdf_bytes = converter.convert_tsx_to_pdf(tsx, config, fonts, callback)?;
//!
//! // Validate ATS compatibility without generating PDF
//! // let ats_report = converter.validate_ats_compatibility(tsx, config)?;
//! ```
//!
//! ### TypeScript Usage Example
//!
//! ```typescript
//! import init, { TsxToPdfConverter } from './wasm-bridge';
//!
//! // Initialize WASM module
//! await init();
//!
//! const converter = new TsxToPdfConverter();
//!
//! // Two-step font loading (recommended)
//! const fontReqs = await converter.detect_fonts(tsxCode);
//! const fontCollection = await fetchGoogleFonts(fontReqs);
//! const pdfBytes = await converter.convert_tsx_to_pdf(
//!   tsxCode,
//!   { paperSize: 'A4', margins: 20 },
//!   fontCollection,
//!   (stage, percentage) => console.log(`${stage}: ${percentage}%`)
//! );
//!
//! // Download PDF
//! const blob = new Blob([pdfBytes], { type: 'application/pdf' });
//! const url = URL.createObjectURL(blob);
//! ```
//!
//! ## Font Handling (Two-Step API)
//!
//! The crate supports a two-step Google Fonts loading workflow:
//!
//! 1. **Detect fonts** from TSX using [`TsxToPdfConverter::detect_fonts()`]
//! 2. **Fetch fonts** from Google Fonts API (TypeScript layer)
//! 3. **Convert with fonts** using [`TsxToPdfConverter::convert_tsx_to_pdf()`]
//!
//! This approach:
//! - Keeps the extension ToS-compliant (no network requests from WASM)
//! - Allows progress tracking during font fetching
//! - Enables font caching in the TypeScript layer
//!
//! ### Font Decompression
//!
//! WOFF and WOFF2 fonts are automatically decompressed to TrueType:
//! - [`decompress_woff_font()`] - WOFF → TTF decompression
//! - [`decompress_woff2_font()`] - WOFF2 → TTF decompression
//! - [`detect_font_format()`] - Detect font format without decompression
//!
//! ## Error Handling
//!
//! All public functions return `Result<T, JsValue>` where errors are structured objects:
//!
//! ```typescript
//! interface ConversionError {
//!   stage: string;            // Pipeline stage (parsing, rendering, generating-pdf, etc.)
//!   code: string;             // Error code (TSX_PARSE_ERROR, PDF_GENERATION_FAILED, etc.)
//!   message: string;          // User-friendly message
//!   technicalDetails: string; // Technical details for debugging
//!   recoverable: boolean;     // Whether user can retry with changes
//!   suggestions: string[];    // Actionable steps to fix the issue
//!   category: string;         // SYNTAX, SIZE, NETWORK, SYSTEM, UNKNOWN
//!   metadata?: object;        // Optional error metadata (line/column, file size, etc.)
//! }
//! ```
//!
//! ## Performance Characteristics
//!
//! ### Bundle Size
//! - Target: <1MB WASM binary
//! - Optimization: `opt-level = "z"`, LTO enabled, debug symbols stripped
//!
//! ### Execution Time (Target)
//! - **High-end devices**: <5s single-page, <10s multi-page
//! - **Low-end devices**: <8s single-page, <15s multi-page
//!
//! ### Memory Usage
//! - Peak memory: ~2x TSX size (parsing + layout tree)
//! - Max TSX size: 5MB (enforced at runtime)
//!
//! ## Feature Flags
//!
//! - `console_error_panic_hook` (default) - Better panic messages in browser console
//! - `debug-logging` - Enable debug logging (disabled in production)
//!
//! ## Browser Compatibility
//!
//! Requires WebAssembly support:
//! - Chrome 57+
//! - Firefox 52+
//! - Safari 11+
//! - Edge 79+ (Chromium)
//!
//! ## Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────┐
//! │                       Browser Extension                      │
//! │  ┌────────────┐  ┌──────────────┐  ┌────────────────────┐  │
//! │  │   Popup    │  │   Content    │  │   Background       │  │
//! │  │  (React)   │  │   Script     │  │  Service Worker    │  │
//! │  └──────┬─────┘  └──────┬───────┘  └────────┬───────────┘  │
//! │         │                 │                    │              │
//! │         └─────────────────┴────────────────────┘              │
//! │                           │                                   │
//! └───────────────────────────┼───────────────────────────────────┘
//!                             │
//!                             ▼
//!                   ┌─────────────────┐
//!                   │  WASM Bridge    │  ← You are here
//!                   │  (this crate)   │
//!                   └────────┬────────┘
//!                            │
//!         ┏━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
//!         ▼                  ▼                  ▼                ▼
//!   ┌──────────┐      ┌─────────────┐   ┌──────────┐   ┌──────────────┐
//!   │TSX Parser│─────▶│Style        │──▶│Layout    │──▶│PDF Generator │
//!   │          │      │Resolver     │   │Engine    │   │              │
//!   └──────────┘      └─────────────┘   └──────────┘   └──────────────┘
//! ```
//!
//! ## See Also
//!
//! - [`TsxToPdfConverter`] - Main conversion interface
//! - [`FontCollection`] - Font data container
//! - [`FontData`] - Individual font file
//! - [`decompress_woff_font()`] - WOFF decompression
//! - [`decompress_woff2_font()`] - WOFF2 decompression

// Core modules
mod converter;
mod error;
mod font_bridge;
mod font_detection;
mod metadata_bridge;
mod validation;

mod font_processor;
mod pipeline_orchestrator;

// Type conversion macros
#[macro_use]
mod macros;
mod progress;

pub use converter::{FontCollection, FontData, TsxToPdfConverter};
pub use font_bridge::{decompress_woff2_font, decompress_woff_font, detect_font_format};
pub use metadata_bridge::{extract_cv_metadata, CVMetadata, FontComplexity, LayoutType};

// WASM initialization
use wasm_bindgen::prelude::*;

/// Initialize the WASM module
///
/// This function is automatically called when the WASM module is loaded.
/// It sets up the panic hook for better error messages in the browser console.
///
/// # TypeScript Example
///
/// ```typescript
/// import init from './wasm-bridge';
///
/// // Automatically calls this function
/// await init();
/// ```
#[wasm_bindgen(start)]
pub fn init() {
    // Initialize WASM module
    // Set panic hook for better error messages in browser console
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}
