//! Error types for the layout engine

use thiserror::Error;

/// Errors that can occur during layout calculation
#[derive(Debug, Error)]
pub enum LayoutError {
    /// Layout calculation failed with a specific reason
    #[error("Layout calculation failed: {0}")]
    CalculationFailed(String),

    /// Content exceeds page bounds
    #[error("Content exceeds page bounds: {0}")]
    ContentOverflow(String),
}
