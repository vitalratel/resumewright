//! ATS Validation Report Types
//!
//! Data structures for ATS compatibility validation reports.

use serde::{Deserialize, Serialize};

/// ATS validation report generated during PDF creation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(target_arch = "wasm32", derive(tsify::Tsify))]
#[cfg_attr(target_arch = "wasm32", tsify(into_wasm_abi, from_wasm_abi))]
pub struct ATSValidationReport {
    /// Overall ATS compatibility score (0.0 to 1.0)
    pub score: f64,

    /// Whether text is embedded (not flattened images)
    pub text_embedded: bool,

    /// Whether fonts are properly embedded
    pub fonts_embedded: bool,

    /// Whether document has proper structure (headings, sections)
    pub proper_structure: bool,

    /// Fields that were successfully placed in the PDF
    pub fields_placed: FieldsPlaced,

    /// Warnings about potential ATS compatibility issues
    pub warnings: Vec<String>,

    /// Critical errors that prevent ATS parsing
    pub errors: Vec<String>,
}

/// Fields that were placed in the PDF during generation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(target_arch = "wasm32", derive(tsify::Tsify))]
#[cfg_attr(target_arch = "wasm32", tsify(into_wasm_abi, from_wasm_abi))]
pub struct FieldsPlaced {
    /// Name was placed in PDF
    pub name: bool,

    /// Email was placed in PDF
    pub email: bool,

    /// Phone was placed in PDF
    pub phone: bool,

    /// Number of experience entries placed
    pub experience_count: usize,

    /// Number of education entries placed
    pub education_count: usize,

    /// Number of skills placed
    pub skills_count: usize,

    /// Document has section headings (h2, h3)
    pub has_section_headings: bool,
}

/// Configurable weights for ATS scoring components
///
/// Allows customization of how different resume elements contribute to the overall
/// ATS compatibility score. Weights should sum to 1.0 for intuitive percentage-based scoring.
///
/// # Default Weights (Industry Standard)
/// - Name: 10% - Critical for ATS identification
/// - Email: 10% - Critical for contact
/// - Phone: 5% - Recommended contact info
/// - Experience: 30% - Primary content (6% per entry, max 5)
/// - Education: 20% - Important background (10% per entry, max 2)
/// - Skills: 10% - Keyword matching
/// - Text Embedded: 5% - Technical requirement
/// - Fonts Embedded: 5% - Technical requirement
/// - Structure: 5% - Accessibility and parsing
///
/// # Examples
///
/// ```
/// use pdf_generator::ATSWeights;
///
/// // Use default industry-standard weights
/// let weights = ATSWeights::default();
///
/// // Emphasize experience over education
/// let custom = ATSWeights {
///     experience: 0.40,  // 40%
///     education: 0.10,   // 10%
///     ..Default::default()
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(target_arch = "wasm32", derive(tsify::Tsify))]
#[cfg_attr(target_arch = "wasm32", tsify(into_wasm_abi, from_wasm_abi))]
pub struct ATSWeights {
    /// Weight for name presence (default: 0.10 = 10%)
    pub name: f64,

    /// Weight for email presence (default: 0.10 = 10%)
    pub email: f64,

    /// Weight for phone presence (default: 0.05 = 5%)
    pub phone: f64,

    /// Weight for experience entries (default: 0.30 = 30%)
    /// Applied as: (experience_count * 0.06).min(0.30)
    pub experience: f64,

    /// Weight for education entries (default: 0.20 = 20%)
    /// Applied as: (education_count * 0.10).min(0.20)
    pub education: f64,

    /// Weight for skills section (default: 0.10 = 10%)
    pub skills: f64,

    /// Weight for text embedding (default: 0.05 = 5%)
    pub text_embedded: f64,

    /// Weight for font embedding (default: 0.05 = 5%)
    pub fonts_embedded: f64,

    /// Weight for proper document structure (default: 0.05 = 5%)
    pub structure: f64,
}

impl ATSValidationReport {
    /// Create a new ATS validation report
    pub fn new() -> Self {
        Self {
            score: 0.0,
            text_embedded: false,
            fonts_embedded: false,
            proper_structure: false,
            fields_placed: FieldsPlaced::new(),
            warnings: Vec::new(),
            errors: Vec::new(),
        }
    }

    /// Check if the report indicates passing ATS compatibility (>= 90% score)
    pub fn passes(&self) -> bool {
        self.score >= 0.9
    }
}

impl Default for ATSValidationReport {
    fn default() -> Self {
        Self::new()
    }
}

impl FieldsPlaced {
    /// Create new FieldsPlaced with all fields set to false/0
    pub fn new() -> Self {
        Self {
            name: false,
            email: false,
            phone: false,
            experience_count: 0,
            education_count: 0,
            skills_count: 0,
            has_section_headings: false,
        }
    }
}

impl Default for FieldsPlaced {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for ATSWeights {
    fn default() -> Self {
        Self {
            name: 0.10,
            email: 0.10,
            phone: 0.05,
            experience: 0.30,
            education: 0.20,
            skills: 0.10,
            text_embedded: 0.05,
            fonts_embedded: 0.05,
            structure: 0.05,
        }
    }
}

impl ATSWeights {
    /// Validate that weights sum to approximately 1.0
    ///
    /// Returns true if the sum of all weights is within 0.01 of 1.0,
    /// allowing for minor floating-point rounding errors.
    ///
    /// # Examples
    ///
    /// ```
    /// use pdf_generator::ATSWeights;
    ///
    /// let weights = ATSWeights::default();
    /// assert!(weights.is_valid());
    ///
    /// let invalid = ATSWeights {
    ///     name: 0.5,
    ///     email: 0.5,
    ///     ..Default::default()
    /// };
    /// assert!(!invalid.is_valid());
    /// ```
    pub fn is_valid(&self) -> bool {
        let sum = self.name
            + self.email
            + self.phone
            + self.experience
            + self.education
            + self.skills
            + self.text_embedded
            + self.fonts_embedded
            + self.structure;

        (sum - 1.0).abs() < 0.01
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ats_weights_default_valid() {
        let weights = ATSWeights::default();
        assert!(weights.is_valid());
    }

    #[test]
    fn test_ats_weights_custom_valid() {
        let weights = ATSWeights {
            name: 0.15,
            email: 0.15,
            phone: 0.05,
            experience: 0.30,
            education: 0.15,
            skills: 0.10,
            text_embedded: 0.05,
            fonts_embedded: 0.03,
            structure: 0.02,
        };
        assert!(weights.is_valid());
    }

    #[test]
    fn test_ats_weights_invalid() {
        let weights = ATSWeights {
            name: 0.50, // Total will exceed 1.0
            email: 0.50,
            phone: 0.05,
            experience: 0.30,
            education: 0.20,
            skills: 0.10,
            text_embedded: 0.05,
            fonts_embedded: 0.05,
            structure: 0.05,
        };
        assert!(!weights.is_valid());
    }
}
