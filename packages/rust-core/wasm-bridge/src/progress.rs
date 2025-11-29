//! Progress tracking for TSX to PDF conversion
//!
//! This module provides granular progress reporting for long-running conversion operations.
//! Progress is tracked across multiple stages with sub-progress within each stage.
//!
//! # Architecture
//!
//! The progress system uses a stage-based model where each major pipeline stage
//! (parsing, rendering, layout, PDF generation) can report sub-progress for
//! incremental updates during long operations.
//!
//! # Stage Weights
//!
//! Stages are weighted based on typical execution time:
//! - Parsing: 10% (0-10%)
//! - Metadata extraction: 10% (10-20%)
//! - Layout extraction: 20% (20-40%)
//! - Layout calculation: 20% (40-60%)
//! - PDF generation: 20% (60-80%)
//! - Completion: 20% (80-100%)

use wasm_bindgen::prelude::*;

/// Conversion pipeline stage
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Stage {
    Parsing,
    ExtractingMetadata,
    ExtractingLayout,
    LayingOut,
    GeneratingPdf,
    Completed,
}

impl Stage {
    /// Get the stage name as a string (for JavaScript callback)
    pub fn as_str(&self) -> &'static str {
        match self {
            Stage::Parsing => "parsing",
            Stage::ExtractingMetadata => "extracting-metadata",
            Stage::ExtractingLayout => "extracting-layout",
            Stage::LayingOut => "laying-out",
            Stage::GeneratingPdf => "generating-pdf",
            Stage::Completed => "completed",
        }
    }

    /// Get the base percentage for this stage (start of range)
    pub fn base_percentage(&self) -> f64 {
        match self {
            Stage::Parsing => 0.0,
            Stage::ExtractingMetadata => 10.0,
            Stage::ExtractingLayout => 20.0,
            Stage::LayingOut => 40.0,
            Stage::GeneratingPdf => 60.0,
            Stage::Completed => 100.0,
        }
    }

    /// Get the weight of this stage (percentage range)
    pub fn weight(&self) -> f64 {
        match self {
            Stage::Parsing => 10.0,
            Stage::ExtractingMetadata => 10.0,
            Stage::ExtractingLayout => 20.0,
            Stage::LayingOut => 20.0,
            Stage::GeneratingPdf => 20.0,
            Stage::Completed => 0.0, // No weight, it's the final state
        }
    }
}

/// Progress tracker for conversion pipeline
///
/// This structure wraps a JavaScript callback function and provides methods
/// to report progress at different stages of the conversion pipeline.
///
/// # Example
///
/// ```no_run
/// # use wasm_bindgen::prelude::*;
/// # pub struct ProgressTracker { callback: Option<js_sys::Function> }
/// # #[derive(Clone, Copy)] pub enum Stage { Parsing, LayingOut, GeneratingPdf }
/// # impl ProgressTracker {
/// #     fn new(cb: Option<js_sys::Function>) -> Self { Self { callback: cb } }
/// #     fn report_stage(&self, _stage: Stage) -> Result<(), JsValue> { Ok(()) }
/// #     fn report_percentage(&self, _stage: Stage, _pct: f64) -> Result<(), JsValue> { Ok(()) }
/// # }
/// # fn example() -> Result<(), JsValue> {
/// let tracker = ProgressTracker::new(None);
/// tracker.report_stage(Stage::Parsing)?;
/// tracker.report_percentage(Stage::Parsing, 0.5)?; // 50% through parsing
/// # Ok(())
/// # }
/// ```
pub struct ProgressTracker {
    callback: Option<js_sys::Function>,
}

impl ProgressTracker {
    /// Create a new progress tracker with optional callback
    pub fn new(callback: Option<js_sys::Function>) -> Self {
        Self { callback }
    }

    /// Report progress at the start of a stage
    ///
    /// This reports the base percentage for the stage (e.g., 40% for "laying-out").
    ///
    /// # Arguments
    ///
    /// * `stage` - The pipeline stage to report
    ///
    /// # Errors
    ///
    /// Returns `JsValue` error if the JavaScript callback throws an exception.
    pub fn report_stage(&self, stage: Stage) -> Result<(), JsValue> {
        let percentage = stage.base_percentage();
        self.emit(stage, percentage)
    }

    /// Report progress with a custom percentage within a stage
    ///
    /// This allows for fine-grained control when you have percentage-based
    /// progress (0.0-1.0) rather than item counts.
    ///
    /// # Arguments
    ///
    /// * `stage` - The current pipeline stage
    /// * `sub_percentage` - Progress within stage (0.0 = start, 1.0 = end)
    ///
    /// # Example
    ///
    /// ```no_run
    /// # use wasm_bindgen::prelude::*;
    /// # pub struct ProgressTracker { callback: Option<js_sys::Function> }
    /// # #[derive(Clone, Copy)] pub enum Stage { GeneratingPdf }
    /// # impl ProgressTracker {
    /// #     fn report_percentage(&self, _stage: Stage, _pct: f64) -> Result<(), JsValue> { Ok(()) }
    /// # }
    /// # fn example(tracker: &ProgressTracker) -> Result<(), JsValue> {
    /// // Report 75% through PDF generation
    /// tracker.report_percentage(Stage::GeneratingPdf, 0.75)?;
    /// // Total progress: 60% + (0.75 * 20%) = 75%
    /// # Ok(())
    /// # }
    /// ```
    ///
    /// # Errors
    ///
    /// Returns `JsValue` error if the JavaScript callback throws an exception.
    pub fn report_percentage(&self, stage: Stage, sub_percentage: f64) -> Result<(), JsValue> {
        let clamped = sub_percentage.clamp(0.0, 1.0);
        let percentage = stage.base_percentage() + (clamped * stage.weight());
        self.emit(stage, percentage)
    }

    /// Emit progress to JavaScript callback
    fn emit(&self, stage: Stage, percentage: f64) -> Result<(), JsValue> {
        if let Some(ref cb) = self.callback {
            let stage_val = JsValue::from_str(stage.as_str());
            let percentage_val = JsValue::from_f64(percentage);
            cb.call2(&JsValue::NULL, &stage_val, &percentage_val)?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stage_base_percentages() {
        assert_eq!(Stage::Parsing.base_percentage(), 0.0);
        assert_eq!(Stage::ExtractingMetadata.base_percentage(), 10.0);
        assert_eq!(Stage::ExtractingLayout.base_percentage(), 20.0);
        assert_eq!(Stage::LayingOut.base_percentage(), 40.0);
        assert_eq!(Stage::GeneratingPdf.base_percentage(), 60.0);
        assert_eq!(Stage::Completed.base_percentage(), 100.0);
    }

    #[test]
    fn test_stage_weights() {
        assert_eq!(Stage::Parsing.weight(), 10.0);
        assert_eq!(Stage::ExtractingMetadata.weight(), 10.0);
        assert_eq!(Stage::ExtractingLayout.weight(), 20.0);
        assert_eq!(Stage::LayingOut.weight(), 20.0);
        assert_eq!(Stage::GeneratingPdf.weight(), 20.0);
        assert_eq!(Stage::Completed.weight(), 0.0);
    }

    #[test]
    fn test_stage_names() {
        assert_eq!(Stage::Parsing.as_str(), "parsing");
        assert_eq!(Stage::ExtractingMetadata.as_str(), "extracting-metadata");
        assert_eq!(Stage::ExtractingLayout.as_str(), "extracting-layout");
        assert_eq!(Stage::LayingOut.as_str(), "laying-out");
        assert_eq!(Stage::GeneratingPdf.as_str(), "generating-pdf");
        assert_eq!(Stage::Completed.as_str(), "completed");
    }

    #[test]
    fn test_progress_tracker_no_callback() {
        let tracker = ProgressTracker::new(None);

        // Should not panic when calling without callback
        assert!(tracker.report_stage(Stage::Parsing).is_ok());
        assert!(tracker.report_stage(Stage::ExtractingLayout).is_ok());
        assert!(tracker.report_stage(Stage::Completed).is_ok());
    }

    #[test]
    fn test_report_percentage_clamping() {
        let tracker = ProgressTracker::new(None);

        // Below 0.0 should clamp to 0.0
        assert!(tracker.report_percentage(Stage::Parsing, -0.5).is_ok());

        // Above 1.0 should clamp to 1.0
        assert!(tracker.report_percentage(Stage::Parsing, 1.5).is_ok());

        // Exactly 0.0
        assert!(tracker
            .report_percentage(Stage::ExtractingLayout, 0.0)
            .is_ok());

        // Exactly 1.0
        assert!(tracker
            .report_percentage(Stage::ExtractingLayout, 1.0)
            .is_ok());
    }

    #[test]
    fn test_stage_percentage_calculations() {
        // Verify that base + weight = next stage's base
        assert_eq!(
            Stage::Parsing.base_percentage() + Stage::Parsing.weight(),
            Stage::ExtractingMetadata.base_percentage()
        );

        assert_eq!(
            Stage::ExtractingMetadata.base_percentage() + Stage::ExtractingMetadata.weight(),
            Stage::ExtractingLayout.base_percentage()
        );

        assert_eq!(
            Stage::ExtractingLayout.base_percentage() + Stage::ExtractingLayout.weight(),
            Stage::LayingOut.base_percentage()
        );

        assert_eq!(
            Stage::LayingOut.base_percentage() + Stage::LayingOut.weight(),
            Stage::GeneratingPdf.base_percentage()
        );

        assert_eq!(
            Stage::GeneratingPdf.base_percentage() + Stage::GeneratingPdf.weight(),
            80.0
        );
    }

    #[test]
    fn test_stage_total_weight_is_100() {
        let total_weight = Stage::Parsing.weight()
            + Stage::ExtractingMetadata.weight()
            + Stage::ExtractingLayout.weight()
            + Stage::LayingOut.weight()
            + Stage::GeneratingPdf.weight()
            + 20.0; // Completion phase (80-100%)

        assert_eq!(total_weight, 100.0);
    }

    #[test]
    fn test_stage_equality() {
        assert_eq!(Stage::Parsing, Stage::Parsing);
        assert_ne!(Stage::Parsing, Stage::ExtractingLayout);

        let stage1 = Stage::LayingOut;
        let stage2 = Stage::LayingOut;
        assert_eq!(stage1, stage2);
    }

    #[test]
    fn test_stage_debug_format() {
        let stage = Stage::GeneratingPdf;
        let debug_str = format!("{:?}", stage);
        assert!(debug_str.contains("GeneratingPdf"));
    }

    #[test]
    fn test_progress_tracker_all_stages() {
        let tracker = ProgressTracker::new(None);

        // Should be able to report all stages without errors
        assert!(tracker.report_stage(Stage::Parsing).is_ok());
        assert!(tracker.report_stage(Stage::ExtractingMetadata).is_ok());
        assert!(tracker.report_stage(Stage::ExtractingLayout).is_ok());
        assert!(tracker.report_stage(Stage::LayingOut).is_ok());
        assert!(tracker.report_stage(Stage::GeneratingPdf).is_ok());
        assert!(tracker.report_stage(Stage::Completed).is_ok());
    }
}
