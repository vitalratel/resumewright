//! Pipeline Orchestrator Module
//!
//! This module orchestrates the TSX to PDF conversion pipeline.
//! Extracted from converter.rs as part of SRP refactoring (Phase 2).
//!
//! Responsibilities:
//! - Pipeline stage execution (Parse → Extract → Render → Layout → Generate)
//! - Progress tracking integration
//! - Error handling and metadata enrichment
//! - Timing and performance logging

use serde_json::json;
use wasm_bindgen::prelude::*;

use cv_domain::{extract_metadata, extract_tsx_layout_config_from_document, CVMetadata};
use layout_engine::{calculate_layout_direct, LayoutStructure};
use pdf_generator::{PDFConfig, PDFGenerator};
use tsx_parser::{parse_tsx, ParseError, TsxDocument};

use crate::debug_log;
use crate::error::{create_error, create_error_with_metadata};
use crate::progress::{ProgressTracker, Stage};
use crate::validation::enrich_pdf_config_with_metadata;

/// Pipeline orchestrator for managing the conversion pipeline
pub struct PipelineOrchestrator {
    progress: ProgressTracker,
}

impl PipelineOrchestrator {
    /// Create a new pipeline orchestrator
    ///
    /// # Arguments
    /// * `progress_callback` - Optional JavaScript progress callback function
    pub fn new(progress_callback: Option<js_sys::Function>) -> Self {
        Self {
            progress: ProgressTracker::new(progress_callback),
        }
    }

    /// Execute the full conversion pipeline
    ///
    /// # Arguments
    /// * `tsx` - TSX source code
    /// * `config` - PDF configuration
    /// * `font_bytes_map` - HashMap of font keys to font bytes
    ///
    /// # Returns
    /// PDF bytes or error with stage information
    pub fn execute_pipeline(
        &self,
        tsx: &str,
        config: PDFConfig,
        font_bytes_map: std::collections::HashMap<String, Vec<u8>>,
    ) -> Result<Vec<u8>, JsValue> {
        let start_time = js_sys::Date::now();

        // Check TSX size limit
        self.check_tsx_size(tsx)?;

        // Stage 1: Parse TSX (10%)
        let (document, _parse_time) = self.parse_tsx_stage(tsx)?;

        // Stage 2: Extract metadata (20%)
        let (metadata, _extract_time) = self.extract_metadata_stage(&document)?;

        // Enrich config with metadata
        let config = enrich_pdf_config_with_metadata(config, &metadata);

        // Stage 3: Extract layout config (30%)
        let (layout_config, _extract_layout_time) = self.extract_layout_config_stage(&document)?;

        // Stage 4: Calculate layout directly (60%)
        let (layout, _layout_time) =
            self.calculate_layout_direct_stage(&document, &metadata, &layout_config, &config)?;

        // Stage 5: Generate PDF (80%)
        let (pdf_bytes, _pdf_time) = self.generate_pdf_stage(&layout, config, font_bytes_map)?;

        // Stage 6: Complete (100%)
        self.progress.report_stage(Stage::Completed)?;

        let _total_time = js_sys::Date::now() - start_time;
        debug_log!("⏱️  TOTAL: {:.2}ms", _total_time);
        debug_log!("📊 Performance Breakdown: Parse={:.0}% Metadata={:.0}% ExtractLayout={:.0}% Layout={:.0}% PDF={:.0}%",
            (_parse_time / _total_time * 100.0),
            (_extract_time / _total_time * 100.0),
            (_extract_layout_time / _total_time * 100.0),
            (_layout_time / _total_time * 100.0),
            (_pdf_time / _total_time * 100.0)
        );

        Ok(pdf_bytes)
    }

    /// Execute a pipeline stage with automatic progress reporting and timing
    ///
    /// This generic helper encapsulates the common pattern for all pipeline stages:
    /// 1. Report stage to progress tracker
    /// 2. Start timing
    /// 3. Execute operation
    /// 4. Log elapsed time
    /// 5. Return result with timing
    ///
    /// # Type Parameters
    /// * `F` - Closure type that returns `Result<T, JsValue>`
    /// * `T` - Result type from the stage operation
    ///
    /// # Arguments
    /// * `stage` - Pipeline stage enum for progress reporting
    /// * `label` - Human-readable label for debug logging
    /// * `operation` - Closure that performs the actual stage work
    ///
    /// # Returns
    /// Tuple of (result, elapsed_time_ms) or error
    fn with_stage<F, T>(
        &self,
        stage: Stage,
        #[allow(unused_variables)] label: &str,
        operation: F,
    ) -> Result<(T, f64), JsValue>
    where
        F: FnOnce() -> Result<T, JsValue>,
    {
        self.progress.report_stage(stage)?;
        let stage_start = js_sys::Date::now();

        let result = operation()?;

        let elapsed = js_sys::Date::now() - stage_start;
        debug_log!("⏱️  {}: {:.2}ms", label, elapsed);

        Ok((result, elapsed))
    }

    /// Check TSX size limit (5MB)
    fn check_tsx_size(&self, tsx: &str) -> Result<(), JsValue> {
        const MAX_TSX_SIZE: usize = 5 * 1024 * 1024; // 5 MB limit
        let tsx_size = tsx.len();

        if tsx_size > MAX_TSX_SIZE {
            let metadata = json!({
                "fileSize": tsx_size,
                "maxSize": MAX_TSX_SIZE,
            });
            return Err(create_error_with_metadata(
                "MEMORY_LIMIT_EXCEEDED",
                &format!(
                    "CV is too large ({} bytes, maximum {} bytes)",
                    tsx_size, MAX_TSX_SIZE
                ),
                "parsing",
                false,
                Some(metadata),
            ));
        }

        Ok(())
    }

    /// Stage 1: Parse TSX
    fn parse_tsx_stage(&self, tsx: &str) -> Result<(TsxDocument, f64), JsValue> {
        self.with_stage(Stage::Parsing, "Parse TSX", || {
            parse_tsx(tsx).map_err(|e| self.handle_parse_error(e))
        })
    }

    /// Stage 2: Extract metadata
    fn extract_metadata_stage(&self, document: &TsxDocument) -> Result<(CVMetadata, f64), JsValue> {
        self.with_stage(Stage::ExtractingMetadata, "Extract Metadata", || {
            extract_metadata(document).map_err(|e| {
                create_error(
                    "INVALID_METADATA",
                    &format!("Failed to extract CV metadata: {}", e),
                    "extracting-metadata",
                    true,
                )
            })
        })
    }

    /// Stage 3: Extract layout config
    fn extract_layout_config_stage(
        &self,
        document: &TsxDocument,
    ) -> Result<(cv_domain::TSXLayoutConfig, f64), JsValue> {
        self.with_stage(Stage::ExtractingLayout, "Extract Layout Config", || {
            let config = extract_tsx_layout_config_from_document(document);
            Ok(config)
        })
    }

    /// Stage 4: Calculate layout directly from TSX
    fn calculate_layout_direct_stage(
        &self,
        document: &TsxDocument,
        metadata: &CVMetadata,
        layout_config: &cv_domain::TSXLayoutConfig,
        config: &PDFConfig,
    ) -> Result<(LayoutStructure, f64), JsValue> {
        self.with_stage(Stage::LayingOut, "Calculate Layout", || {
            let measurer = pdf_generator::fonts::PDFTextMeasurer;
            calculate_layout_direct(document, metadata, layout_config, config, &measurer).map_err(
                |e| {
                    create_error(
                        "PDF_LAYOUT_ERROR",
                        &format!("PDF layout calculation failed: {}", e),
                        "laying-out",
                        true,
                    )
                },
            )
        })
    }

    /// Stage 5: Generate PDF
    fn generate_pdf_stage(
        &self,
        layout: &LayoutStructure,
        config: PDFConfig,
        font_bytes_map: std::collections::HashMap<String, Vec<u8>>,
    ) -> Result<(Vec<u8>, f64), JsValue> {
        self.with_stage(Stage::GeneratingPdf, "Generate PDF", || {
            let mut generator = PDFGenerator::new(config.clone()).map_err(|e| {
                create_error(
                    "PDF_GENERATION_FAILED",
                    &format!("Failed to initialize PDF generator: {}", e),
                    "generating-pdf",
                    true,
                )
            })?;

            // Pass font bytes to generator
            generator.set_font_bytes(font_bytes_map);

            // Use progress tracker for per-page progress
            generator
                .render_layout_with_progress(
                    layout,
                    Some(&|progress_percent: f32| {
                        // Calculate sub-progress within GeneratingPdf stage (60-80%)
                        let sub_progress = (progress_percent / 100.0) as f64;
                        let _ = self
                            .progress
                            .report_percentage(Stage::GeneratingPdf, sub_progress);
                    }),
                )
                .map_err(|e| {
                    create_error(
                        "PDF_GENERATION_FAILED",
                        &format!("Failed to render PDF content: {}", e),
                        "generating-pdf",
                        true,
                    )
                })?;

            generator.finalize().map_err(|e| {
                create_error(
                    "PDF_GENERATION_FAILED",
                    &format!("Failed to finalize PDF: {}", e),
                    "generating-pdf",
                    true,
                )
            })
        })
    }

    /// Handle parse errors with detailed metadata
    fn handle_parse_error(&self, e: ParseError) -> JsValue {
        match e {
            ParseError::SyntaxError {
                line,
                column,
                ref message,
            } => {
                let metadata = json!({
                    "line": line,
                    "column": column,
                });
                create_error_with_metadata(
                    "TSX_PARSE_ERROR",
                    &format!(
                        "Parse error at line {}, column {}: {}",
                        line, column, message
                    ),
                    "parsing",
                    true,
                    Some(metadata),
                )
            }
            ParseError::InvalidStructure { ref message } => {
                create_error("INVALID_TSX_STRUCTURE", message, "parsing", false)
            }
            _ => create_error(
                "TSX_PARSE_ERROR",
                &format!("TSX parse error: {}", e),
                "parsing",
                true,
            ),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pipeline_orchestrator_creation() {
        let orchestrator = PipelineOrchestrator::new(None);
        // Verify it was created successfully
        assert!(std::mem::size_of_val(&orchestrator) > 0);
    }

    #[test]
    fn test_check_tsx_size_within_limit() {
        let orchestrator = PipelineOrchestrator::new(None);
        let small_tsx = "const x = 1;";
        assert!(orchestrator.check_tsx_size(small_tsx).is_ok());
    }

    // This test is disabled for non-WASM targets since it uses js_sys::Date
    // The actual functionality is tested in integration tests
    #[cfg(target_arch = "wasm32")]
    #[test]
    fn test_check_tsx_size_exceeds_limit() {
        let orchestrator = PipelineOrchestrator::new(None);
        // Create a string larger than 5MB
        let large_tsx = "x".repeat(6 * 1024 * 1024);
        let result = orchestrator.check_tsx_size(&large_tsx);
        assert!(result.is_err());
    }
}
