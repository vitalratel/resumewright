//! ATS Compatibility Validation Module
//!
//! This module provides ATS (Applicant Tracking System) compatibility validation
//! during PDF generation. It tracks content placement rather than extracting text
//! after generation, providing privacy-first validation.
//!
//! # Module Organization
//! - `report` - Report types (ATSValidationReport, FieldsPlaced, ATSWeights)
//! - `scorer` - Scoring logic for ATS compatibility
//! - `rules` - Validation rules and field detection

pub mod report;
pub mod rules;
pub mod scorer;

// Re-export public API
pub use report::{ATSValidationReport, ATSWeights, FieldsPlaced};
pub use rules::validate_ats_compatibility;
