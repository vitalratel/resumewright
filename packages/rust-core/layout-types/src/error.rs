//! Error types for layout validation

use thiserror::Error;

/// Validation errors for layout types
#[derive(Debug, Error, Clone, PartialEq)]
pub enum ValidationError {
    #[error("Alpha value must be between 0.0 and 1.0, got {0}")]
    InvalidAlpha(f32),
    #[error("Font size must be positive, got {0}")]
    InvalidFontSize(f64),
    #[error("Dimension must be non-negative, got {0}")]
    NegativeDimension(f64),
}
