//! ATS Scoring Logic
//!
//! Calculate ATS compatibility scores from validation results.

use super::report::{ATSWeights, FieldsPlaced};

/// Calculate ATS compatibility score using configurable weights
///
/// Real ATS systems don't give universal scores - they parse fields and match keywords
/// to specific job descriptions. We can only validate that fields are extractable.
///
/// # Scoring Method
/// - Each component is weighted according to the provided `ATSWeights`
/// - Experience and education are scaled: (count * per_entry_weight).min(max_weight)
/// - All other fields contribute their full weight if present
/// - Final score is sum of all weighted components (0.0 to 1.0)
///
/// # Arguments
/// * `fields` - Which CV fields are present in the PDF
/// * `text_embedded` - Whether text is embedded (not images)
/// * `fonts_embedded` - Whether fonts are properly embedded
/// * `proper_structure` - Whether document has proper structure
/// * `weights` - Configurable weights for each scoring component
///
/// # Returns
/// Score from 0.0 (ATS incompatible) to 1.0 (fully ATS compatible)
pub fn calculate_ats_score(
    fields: &FieldsPlaced,
    text_embedded: bool,
    fonts_embedded: bool,
    proper_structure: bool,
    weights: &ATSWeights,
) -> f64 {
    let mut score = 0.0;

    // Name: weighted (critical for ATS)
    if fields.name {
        score += weights.name;
    }

    // Email: weighted (critical for contact)
    if fields.email {
        score += weights.email;
    }

    // Phone: weighted (recommended)
    if fields.phone {
        score += weights.phone;
    }

    // Experience: binary check (ATS compatibility = can extract ANY experience)
    // ATS compatibility means "can the system parse experience entries", not "how many entries"
    // A CV with 1 experience entry that's parseable should score 100% on experience extraction
    if fields.experience_count > 0 {
        score += weights.experience;
    }

    // Education: binary check (ATS compatibility = can extract ANY education)
    // ATS compatibility means "can the system parse education entries", not "how many degrees"
    // A CV with 1 degree that's parseable should score 100% on education extraction
    if fields.education_count > 0 {
        score += weights.education;
    }

    // Skills: weighted (presence check)
    if fields.skills_count > 0 {
        score += weights.skills;
    }

    // Text embedded: weighted (not flattened images)
    if text_embedded {
        score += weights.text_embedded;
    }

    // Fonts embedded: weighted (properly embedded)
    if fonts_embedded {
        score += weights.fonts_embedded;
    }

    // Proper structure: weighted (headings for sections)
    if proper_structure {
        score += weights.structure;
    }

    score
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ats_score_perfect_cv() {
        let fields = FieldsPlaced {
            name: true,
            email: true,
            phone: true,
            experience_count: 5, // Need 5 for full 30 points
            education_count: 2,
            skills_count: 10,
            has_section_headings: true,
        };

        let score = calculate_ats_score(&fields, true, true, true, &ATSWeights::default());

        // Should be 100/100 = 1.0
        assert_eq!(score, 1.0);
    }

    #[test]
    fn test_ats_score_minimal_cv() {
        let fields = FieldsPlaced {
            name: true,
            email: true,
            phone: false,
            experience_count: 0,
            education_count: 0,
            skills_count: 0,
            has_section_headings: false,
        };

        let score = calculate_ats_score(&fields, true, true, false, &ATSWeights::default());

        // Name (10) + Email (10) + Text (5) + Fonts (5) = 30/100 = 0.30
        assert_eq!(score, 0.30);
    }

    #[test]
    fn test_ats_score_no_contact() {
        let fields = FieldsPlaced {
            name: false,
            email: false,
            phone: false,
            experience_count: 5,
            education_count: 2,
            skills_count: 10,
            has_section_headings: true,
        };

        let score = calculate_ats_score(&fields, true, true, true, &ATSWeights::default());

        // Exp (30) + Edu (20) + Skills (10) + Text (5) + Fonts (5) + Structure (5) = 75/100 = 0.75
        assert!(
            (score - 0.75).abs() < 0.0001,
            "Expected ~0.75, got {}",
            score
        );
    }

    #[test]
    fn test_custom_ats_weights() {
        let fields = FieldsPlaced {
            name: true,
            email: true,
            phone: true,
            experience_count: 5,
            education_count: 2,
            skills_count: 10,
            has_section_headings: true,
        };

        // Custom weights emphasizing experience (40%) over education (10%)
        let custom_weights = ATSWeights {
            name: 0.10,
            email: 0.10,
            phone: 0.05,
            experience: 0.40, // Increased from 30%
            education: 0.10,  // Decreased from 20%
            skills: 0.10,
            text_embedded: 0.05,
            fonts_embedded: 0.05,
            structure: 0.05,
        };

        let score = calculate_ats_score(&fields, true, true, true, &custom_weights);

        // Should still be 1.0 (all fields present)
        assert_eq!(score, 1.0);
    }

    #[test]
    fn test_custom_weights_partial_cv() {
        let fields = FieldsPlaced {
            name: true,
            email: true,
            phone: false,
            experience_count: 3, // Partial experience (3/5)
            education_count: 0,  // No education
            skills_count: 0,
            has_section_headings: true,
        };

        // Custom weights emphasizing experience (40%)
        let custom_weights = ATSWeights {
            name: 0.10,
            email: 0.10,
            phone: 0.05,
            experience: 0.40, // 40%
            education: 0.10,
            skills: 0.10,
            text_embedded: 0.05,
            fonts_embedded: 0.05,
            structure: 0.05,
        };

        let score = calculate_ats_score(&fields, true, true, true, &custom_weights);

        // Experience scoring is binary: if experience_count > 0, full weight applies
        // Name (0.10) + Email (0.10) + Experience (0.40) [binary: 3 > 0]
        // + Text (0.05) + Fonts (0.05) + Structure (0.05) = 0.75
        assert!((score - 0.75).abs() < 0.01);
    }
}
