//! TSX to PDF Converter for WASM
//!
//! This module implements the full conversion pipeline from TSX source code to PDF bytes.
//! Pipeline stages:
//! 1. Parse TSX (10%)
//! 2. Extract metadata (20%)
//! 3. Extract layout config (40%)
//! 4. Calculate layout (60%)
//! 5. Generate PDF (80%)
//! 6. Complete (100%)

use wasm_bindgen::prelude::*;

// Import conversion macros
use crate::{from_js, to_js};

use cv_domain::{extract_metadata, extract_tsx_layout_config_from_document};
use layout_engine::calculate_layout_direct;
use pdf_generator::PDFConfig;
use tsx_parser::parse_tsx;

// Import from refactored modules
use crate::error::create_error;

/// Debug logging macro - only logs when debug-logging feature is enabled
#[cfg(feature = "debug-logging")]
macro_rules! debug_log {
    ($($arg:tt)*) => {
        web_sys::console::log_1(&format!($($arg)*).into());
    };
}

#[cfg(not(feature = "debug-logging"))]
macro_rules! debug_log {
    ($($arg:tt)*) => {};
}

// ConversionError is now in crate::error module

/// Font source type
#[wasm_bindgen]
#[derive(Clone, Copy, Debug, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FontSource {
    Google,
    Custom,
    #[serde(rename = "websafe")]
    WebSafe,
}

// FontRequirement struct is now in crate::font_detection module (re-exported)

/// Font data for embedding in PDF
///
/// Represents a single font file (TrueType/OpenType) to be embedded.
/// Font bytes can be in TTF, OTF, WOFF, or WOFF2 format. WOFF/WOFF2 fonts
/// will be automatically decompressed using `decompress_woff_font()` or
/// `decompress_woff2_font()` before use.
///
/// # Fields
/// * `family` - Font family name (e.g., "Roboto")
/// * `weight` - Font weight (100-900, typically 400 for normal, 700 for bold)
/// * `is_italic` - Whether this is an italic variant
/// * `bytes` - Raw font file bytes (TTF/OTF/WOFF/WOFF2)
///
/// # TypeScript Example
/// ```typescript
/// const fontData = new FontData("Roboto", 400, false, fontBytes);
/// ```
#[wasm_bindgen]
#[derive(Clone)]
pub struct FontData {
    family: String,
    weight: u16,
    is_italic: bool,
    bytes: Vec<u8>,
}

#[wasm_bindgen]
impl FontData {
    #[wasm_bindgen(constructor)]
    pub fn new(family: String, weight: u16, is_italic: bool, bytes: Vec<u8>) -> Self {
        Self {
            family,
            weight,
            is_italic,
            bytes,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn family(&self) -> String {
        self.family.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn weight(&self) -> u16 {
        self.weight
    }

    #[wasm_bindgen(getter)]
    pub fn is_italic(&self) -> bool {
        self.is_italic
    }
}

// Non-WASM getter for internal use (not exposed to JavaScript)
impl FontData {
    /// Get font bytes (internal use only, not exposed to WASM)
    pub(crate) fn bytes_internal(&self) -> &[u8] {
        &self.bytes
    }
}

/// Collection of fonts for embedding
///
/// Holds multiple font files from Google Fonts or other sources.
/// Pass to `convert_tsx_to_pdf()` to embed fonts in the generated PDF.
///
/// # TypeScript Example
/// ```typescript
/// const collection = new FontCollection();
/// for (const req of fontRequirements) {
///   const fontBytes = await fetchFontBytes(req);
///   collection.add(new FontData(req.family, req.weight, req.isItalic, fontBytes));
/// }
/// const pdf = await converter.convert_tsx_to_pdf(tsx, config, collection);
/// ```
#[wasm_bindgen]
pub struct FontCollection {
    fonts: Vec<FontData>,
}

#[wasm_bindgen]
impl FontCollection {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self { fonts: Vec::new() }
    }

    #[wasm_bindgen]
    pub fn add(&mut self, font: FontData) {
        self.fonts.push(font);
    }
}

// Non-WASM getter for internal use (not exposed to JavaScript)
impl FontCollection {
    /// Get fonts vector (internal use only, not exposed to WASM)
    pub(crate) fn fonts_internal(&self) -> &[FontData] {
        &self.fonts
    }
}

impl Default for FontCollection {
    fn default() -> Self {
        Self::new()
    }
}

/// Main TSX to PDF conversion interface
///
/// Primary API for converting Claude.ai-generated CV/resume TSX code into ATS-compatible PDFs.
///
/// **Methods:**
/// 1. `detect_fonts(tsx)` - Scan TSX for font requirements
/// 2. `convert_tsx_to_pdf(tsx, config, fonts?, callback?)` - Full conversion pipeline
/// 3. `validate_ats_compatibility(tsx, config)` - ATS validation without generating PDF
///
/// # TypeScript Example
/// ```typescript
/// // Create converter instance
/// const converter = new TsxToPdfConverter();
///
/// // Two-step font loading (recommended)
/// const fontReqs = await converter.detect_fonts(tsxCode);
/// const fontCollection = await fetchGoogleFonts(fontReqs);
/// const pdfBytes = await converter.convert_tsx_to_pdf(tsxCode, config, fontCollection);
///
/// // Or single-step (uses web-safe fonts only)
/// const pdfBytes = await converter.convert_tsx_to_pdf(tsxCode, config);
/// ```
#[wasm_bindgen]
pub struct TsxToPdfConverter;

impl Default for TsxToPdfConverter {
    fn default() -> Self {
        Self::new()
    }
}

#[wasm_bindgen]
impl TsxToPdfConverter {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self
    }

    /// Detect font requirements from TSX code (Step 1 of two-step font loading)
    ///
    /// Analyzes TSX to find font-family declarations. Returns fonts classified as:
    /// - `google` - Google Fonts (Roboto, Open Sans, etc.)
    /// - `websafe` - System fonts (Arial, Times, Georgia)
    /// - `custom` - Other fonts requiring user-provided files
    ///
    /// # Example
    /// ```typescript
    /// const fontReqs = await converter.detect_fonts(tsxCode);
    /// // [{ family: "Roboto", weight: 400, style: "normal", source: "google" }]
    /// const googleFonts = fontReqs.filter(f => f.source === "google");
    /// ```
    #[wasm_bindgen]
    pub fn detect_fonts(&self, tsx: &str) -> Result<String, JsValue> {
        debug_log!("[FontDetect] Scanning TSX for font requirements");

        // Parse TSX to extract font-family declarations
        let document =
            parse_tsx(tsx).map_err(|e| JsValue::from_str(&format!("TSX parse error: {}", e)))?;

        // Use FontProcessor to detect fonts
        let font_processor = crate::font_processor::FontProcessor::new();
        font_processor
            .detect_fonts(&document)
            .map_err(|e| JsValue::from_str(&e))
    }

    /// Convert TSX code to PDF bytes
    ///
    /// Transforms TSX into an ATS-compatible PDF. Optionally accepts pre-fetched fonts
    /// from [`detect_fonts`] and a progress callback for UI updates.
    ///
    /// # Arguments
    /// * `tsx` - TSX source code (max 5MB)
    /// * `config` - PDF configuration (page size, margins, metadata)
    /// * `fonts` - Optional [`FontCollection`] with Google Fonts
    /// * `progress_callback` - Optional `(stage: string, percentage: number) => void`
    ///
    /// # Example
    /// ```typescript
    /// const pdfBytes = await converter.convert_tsx_to_pdf(
    ///   tsxCode,
    ///   { paperSize: 'A4', margins: 20 },
    ///   fontCollection,
    ///   (stage, pct) => console.log(`${stage}: ${pct}%`)
    /// );
    /// const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    /// ```
    ///
    /// # Progress Stages
    /// `parsing` (10%) → `extracting-metadata` (20%) → `extracting-layout` (40%)
    /// → `laying-out` (60%) → `generating-pdf` (80%) → `completed` (100%)
    #[wasm_bindgen]
    pub fn convert_tsx_to_pdf(
        &self,
        tsx: &str,
        config: JsValue,
        fonts: Option<FontCollection>,
        progress_callback: Option<js_sys::Function>,
    ) -> Result<Vec<u8>, JsValue> {
        // Parse config from JsValue
        let pdf_config: PDFConfig = from_js!(config, "INVALID_CONFIG", "parsing");

        // Build font bytes map from FontCollection using FontProcessor
        let font_bytes_map = if let Some(font_collection) = fonts {
            let font_processor = crate::font_processor::FontProcessor::new();
            font_processor
                .build_font_collection(&font_collection)
                .map_err(|e| self.create_error("INVALID_FONT_DATA", &e, "font-validation", true))?
        } else {
            std::collections::HashMap::new()
        };

        // Execute pipeline using PipelineOrchestrator
        let orchestrator =
            crate::pipeline_orchestrator::PipelineOrchestrator::new(progress_callback);
        orchestrator.execute_pipeline(tsx, pdf_config, font_bytes_map)
    }

    /// Create structured error object (delegates to error module)
    fn create_error(&self, code: &str, message: &str, stage: &str, recoverable: bool) -> JsValue {
        create_error(code, message, stage, recoverable)
    }

    /// Validate ATS compatibility without generating PDF
    ///
    /// Returns a score (0.0-1.0) based on layout simplicity, font embedding,
    /// text extractability, and section structure. Passing score: ≥0.9 (90%).
    /// Faster than full conversion since it skips PDF rendering.
    ///
    /// # Example
    /// ```typescript
    /// const report = await converter.validate_ats_compatibility(tsxCode, config);
    /// console.log(`Score: ${(report.score * 100).toFixed(1)}%`);
    /// if (report.passes()) {
    ///   const pdfBytes = await converter.convert_tsx_to_pdf(tsxCode, config);
    /// }
    /// ```
    #[wasm_bindgen]
    pub fn validate_ats_compatibility(
        &self,
        tsx: &str,
        config: JsValue,
    ) -> Result<JsValue, JsValue> {
        debug_log!("[ATS] Starting ATS compatibility validation");

        // Parse config
        let pdf_config: PDFConfig = from_js!(config, "INVALID_CONFIG", "validation");

        // Parse TSX
        let document = parse_tsx(tsx).map_err(|e| {
            self.create_error(
                "TSX_PARSE_ERROR",
                &format!("TSX parse error: {}", e),
                "validation",
                true,
            )
        })?;

        // Extract metadata
        let metadata = extract_metadata(&document).map_err(|e| {
            self.create_error(
                "INVALID_METADATA",
                &format!("Failed to extract CV metadata: {}", e),
                "validation",
                true,
            )
        })?;

        // Extract layout config
        let layout_config = extract_tsx_layout_config_from_document(&document);

        // Calculate layout directly with accurate PDF font metrics
        let measurer = pdf_generator::fonts::PDFTextMeasurer;
        let layout =
            calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer)
                .map_err(|e| {
                self.create_error(
                    "PDF_LAYOUT_ERROR",
                    &format!("PDF layout calculation failed: {}", e),
                    "validation",
                    true,
                )
            })?;

        // Perform ATS validation
        // Note: fonts_embedded = true for MVP (we always embed Standard 14 fonts)
        let fonts_embedded = true;
        let report = pdf_generator::validate_ats_compatibility(
            &layout,
            &metadata,
            fonts_embedded,
            pdf_config.ats_weights.as_ref(),
        );

        debug_log!(
            "[ATS] Validation complete. Score: {:.1}%",
            report.score * 100.0
        );
        debug_log!("[ATS] Passes (>=90%): {}", report.passes());

        // Serialize to JsValue
        Ok(to_js!(report))
    }
}
