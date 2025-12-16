//! ATS Validation Rules
//!
//! Field detection and validation rules for ATS compatibility checking.

use super::report::{ATSValidationReport, FieldsPlaced};
use crate::layout_renderer::{BoxContent, ElementType, LayoutBox, LayoutStructure};
use cv_domain::CVMetadata;

/// Validate ATS compatibility during PDF generation
///
/// This function analyzes the layout structure and CV metadata to determine
/// ATS compatibility without needing to extract text from the generated PDF.
///
/// # Arguments
/// * `layout` - The layout structure that will be rendered to PDF
/// * `metadata` - CV metadata extracted from the original TSX
/// * `fonts_embedded` - Whether fonts will be embedded in the PDF
/// * `weights` - Optional custom weights for ATS scoring (uses defaults if None)
///
/// # Returns
/// An ATS validation report with score and detailed findings
pub fn validate_ats_compatibility(
    layout: &LayoutStructure,
    metadata: &CVMetadata,
    fonts_embedded: bool,
    weights: Option<&super::report::ATSWeights>,
) -> ATSValidationReport {
    let mut report = ATSValidationReport::new();

    // Use provided weights or defaults
    let default_weights = super::report::ATSWeights::default();
    let scoring_weights = weights.unwrap_or(&default_weights);

    // Track what fields are placed in the layout
    report.fields_placed = analyze_fields_placed(layout, metadata);

    // Check if text is embedded (we always use text, never images for CV content)
    report.text_embedded = check_text_embedded(layout);

    // Check fonts embedding
    report.fonts_embedded = fonts_embedded;

    // Check document structure
    report.proper_structure = check_document_structure(layout);

    // Calculate overall ATS score with configurable weights
    report.score = super::scorer::calculate_ats_score(
        &report.fields_placed,
        report.text_embedded,
        report.fonts_embedded,
        report.proper_structure,
        scoring_weights,
    );

    // Generate warnings and errors
    generate_warnings_and_errors(&mut report, metadata);

    report
}

/// Analyze which fields from CVMetadata are actually placed in the layout
pub fn analyze_fields_placed(layout: &LayoutStructure, metadata: &CVMetadata) -> FieldsPlaced {
    let mut fields = FieldsPlaced::new();

    // Collect all text content from layout
    let all_text = collect_all_text_from_layout(layout);

    // Check if name appears in the layout (case-insensitive)
    if let Some(ref name) = metadata.name {
        let name_lower = name.to_lowercase();
        let text_lower = all_text.to_lowercase();
        if text_lower.contains(&name_lower) {
            fields.name = true;
        }
    }

    // Check if email appears in the layout
    if let Some(ref email) = metadata.email {
        if all_text.contains(email) {
            fields.email = true;
        }
    }

    // Check if phone appears in the layout
    if let Some(ref phone) = metadata.phone {
        // Normalize phone number for comparison (remove formatting)
        let normalized_phone = phone.chars().filter(|c| c.is_numeric()).collect::<String>();
        let normalized_text = all_text
            .chars()
            .filter(|c| c.is_numeric())
            .collect::<String>();

        if normalized_text.contains(&normalized_phone) {
            fields.phone = true;
        }
    }

    // Check for section headings (h2, h3 elements indicate experience, education, etc.)
    fields.has_section_headings = check_has_headings(layout);

    // Count actual experience and education entries from layout structure
    // Instead of counting section headings, we look for patterns that indicate entries
    let all_text = collect_all_text_from_layout(layout);

    fields.experience_count = count_experience_entries(&all_text);
    fields.education_count = count_education_entries(&all_text);
    fields.skills_count = if has_skills_section(&all_text) { 5 } else { 0 };

    fields
}

/// Collect all text content from layout structure
pub fn collect_all_text_from_layout(layout: &LayoutStructure) -> String {
    let mut all_text = String::new();

    for page in &layout.pages {
        for layout_box in &page.boxes {
            collect_text_from_box(layout_box, &mut all_text);
        }
    }

    all_text
}

/// Recursively collect text from a layout box and its children
fn collect_text_from_box(layout_box: &LayoutBox, all_text: &mut String) {
    match &layout_box.content {
        BoxContent::Text(lines) => {
            // Join wrapped lines with spaces
            let text: String = lines
                .iter()
                .map(|l| l.plain_text())
                .collect::<Vec<_>>()
                .join(" ");
            all_text.push_str(&text);
            all_text.push(' ');
        }
        BoxContent::Container(children) => {
            for child in children {
                collect_text_from_box(child, all_text);
            }
        }
        BoxContent::Empty => {}
    }
}

/// Check if layout uses text (not images)
///
/// For our PDF generator, we always use text, so this always returns true.
/// This check exists for completeness and future-proofing.
fn check_text_embedded(_layout: &LayoutStructure) -> bool {
    // We always render text as actual text, never as flattened images
    true
}

/// Check if document has proper structure (headings for sections)
fn check_document_structure(layout: &LayoutStructure) -> bool {
    // A properly structured document should have at least 2 heading elements (h2/h3)
    // indicating separate sections like "Experience", "Education", etc.
    count_headings(layout) >= 2
}

/// Check if layout contains heading elements
fn check_has_headings(layout: &LayoutStructure) -> bool {
    count_headings(layout) > 0
}

/// Count heading elements (h2, h3) in the layout
fn count_headings(layout: &LayoutStructure) -> usize {
    let mut count = 0;

    for page in &layout.pages {
        for layout_box in &page.boxes {
            count += count_headings_in_box(layout_box);
        }
    }

    count
}

/// Recursively count heading elements in a layout box
fn count_headings_in_box(layout_box: &LayoutBox) -> usize {
    let mut count = 0;

    // Check if this box is a heading
    if matches!(
        layout_box.element_type,
        Some(ElementType::Heading2 | ElementType::Heading3)
    ) {
        count += 1;
    }

    // Recursively check children
    if let BoxContent::Container(ref children) = layout_box.content {
        for child in children {
            count += count_headings_in_box(child);
        }
    }

    count
}

/// Count experience entries by detecting date range patterns
///
/// Experience entries typically have patterns like:
/// - "2020 - Present", "2020-Present", "Jan 2020 - Dec 2023"
/// - "May 2023 – August 2025" (em dash)
/// - Multiple occurrences indicate multiple jobs
pub fn count_experience_entries(text: &str) -> usize {
    // Pattern 1: Month name dates (English) - most common format
    let month_name_count = regex_utils::DATE_MONTH_NAME.find_iter(text).count();

    // Pattern 2: Numeric dates (MM/YYYY or M/YYYY format)
    let numeric_date_count = regex_utils::DATE_NUMERIC.find_iter(text).count();

    // Pattern 3: ISO-style dates (YYYY-MM format)
    let iso_date_count = regex_utils::DATE_ISO.find_iter(text).count();

    // Pattern 4: Year-only ranges with context (to distinguish from education)
    let mut year_range_count = 0;

    // Only count year ranges if they appear near job-related context
    for year_match in regex_utils::DATE_YEAR_RANGE.find_iter(text) {
        let start = year_match.start().saturating_sub(50);
        let end = (year_match.end() + 50).min(text.len());
        let context = &text[start..end];

        // Check for job-related keywords in context
        let has_job_context = context.to_lowercase().contains("engineer")
            || context.to_lowercase().contains("developer")
            || context.to_lowercase().contains("manager")
            || context.to_lowercase().contains("analyst")
            || context.to_lowercase().contains("consultant")
            || context.to_lowercase().contains("director")
            || context.to_lowercase().contains("specialist")
            || context.to_lowercase().contains("coordinator")
            || context.to_lowercase().contains("lead")
            || context.to_lowercase().contains("senior")
            || context.to_lowercase().contains("junior");

        if has_job_context {
            year_range_count += 1;
        }
    }

    // Use the maximum count from all patterns (CV likely uses one consistent format)
    let max_count = month_name_count
        .max(numeric_date_count)
        .max(iso_date_count)
        .max(year_range_count);

    // Cap at reasonable maximum
    max_count.min(10)
}

/// Count education entries by detecting degree patterns
///
/// Education entries typically contain:
/// - Traditional degrees: "Bachelor", "Master", "PhD", "BS", "MS", "MBA"
/// - High school: "High School Diploma", "GED", "Secondary Education"
/// - Vocational: "Certificate", "Certification", "Diploma"
/// - Each occurrence likely indicates a separate degree/qualification
pub fn count_education_entries(text: &str) -> usize {
    // Pattern 1: Traditional college/university degrees
    let degree_count = regex_utils::DEGREE.find_iter(text).count();

    // Pattern 2: High school education
    let high_school_count = regex_utils::HIGH_SCHOOL.find_iter(text).count();

    // Pattern 3: Certificates and certifications
    let cert_count = regex_utils::CERTIFICATE.find_iter(text).count();

    // Pattern 4: Vocational/trade qualifications
    let vocational_count = regex_utils::VOCATIONAL.find_iter(text).count();

    // Sum all education entries
    let total_count = degree_count + high_school_count + cert_count + vocational_count;

    // If we found any education entries, return that count
    if total_count > 0 {
        return total_count.min(5);
    }

    // Fallback: Look for EDUCATION section heading
    // This handles cases with non-standard degree names
    if regex_utils::EDUCATION_SECTION.is_match(text) {
        // Education section exists, but no recognized degree keywords
        // Conservative assumption: 1 entry (handles non-standard degrees)
        return 1;
    }

    // No education section found
    0
}

/// Check if the CV has a skills section
///
/// Looks for common skills section headings
pub fn has_skills_section(text: &str) -> bool {
    regex_utils::SKILLS_SECTION.is_match(text)
}

/// Generate warnings and errors based on validation results
pub fn generate_warnings_and_errors(report: &mut ATSValidationReport, metadata: &CVMetadata) {
    // Critical errors (prevent ATS parsing)
    if !report.text_embedded {
        report
            .errors
            .push("PDF uses flattened images instead of text - ATS cannot parse".to_string());
    }

    if !report.fields_placed.name {
        if metadata.name.is_some() {
            report
                .errors
                .push("Name not found in PDF layout (expected from metadata)".to_string());
        } else {
            report
                .errors
                .push("Name not provided in CV data".to_string());
        }
    }

    if !report.fields_placed.email {
        if metadata.email.is_some() {
            report
                .errors
                .push("Email not found in PDF layout (expected from metadata)".to_string());
        } else {
            report.warnings.push(
                "Email not provided in CV data - ATS may not be able to contact candidate"
                    .to_string(),
            );
        }
    }

    // Warnings (reduce ATS compatibility but not critical)
    if !report.fonts_embedded {
        report
            .warnings
            .push("Fonts not fully embedded - may cause parsing issues in some ATS".to_string());
    }

    if !report.proper_structure {
        report.warnings.push(
            "No clear section headings detected - ATS may struggle to categorize information"
                .to_string(),
        );
    }

    if !report.fields_placed.phone {
        report.warnings.push(
            "Phone number not found in layout - consider including contact phone".to_string(),
        );
    }

    if report.fields_placed.experience_count == 0 {
        report
            .warnings
            .push("No experience entries detected - ATS may not find work history".to_string());
    }

    if report.fields_placed.education_count == 0 {
        report.warnings.push(
            "No education entries detected - ATS may not find educational background".to_string(),
        );
    }

    if report.fields_placed.skills_count == 0 {
        report
            .warnings
            .push("No skills detected - ATS keyword matching may be limited".to_string());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::css_parser::StyleDeclaration;
    use cv_domain::{FontComplexity, LayoutType};
    use layout_types::{BoxContent, LayoutBox, Page, TextLine};

    #[test]
    fn test_collect_text_from_layout() {
        let layout = LayoutStructure {
            page_width: 612.0,
            page_height: 792.0,
            pages: vec![Page {
                page_number: 1,
                boxes: vec![
                    LayoutBox {
                        x: 0.0,
                        y: 0.0,
                        width: 100.0,
                        height: 20.0,
                        content: BoxContent::Text(vec![TextLine::from("Jane Smith")]),
                        style: StyleDeclaration::default(),
                        element_type: Some(ElementType::Heading1),
                    },
                    LayoutBox {
                        x: 0.0,
                        y: 20.0,
                        width: 100.0,
                        height: 15.0,
                        content: BoxContent::Text(vec![TextLine::from("jane@example.com")]),
                        style: StyleDeclaration::default(),
                        element_type: Some(ElementType::Paragraph),
                    },
                    LayoutBox {
                        x: 0.0,
                        y: 35.0,
                        width: 100.0,
                        height: 15.0,
                        content: BoxContent::Text(vec![TextLine::from("+1-555-123-4567")]),
                        style: StyleDeclaration::default(),
                        element_type: Some(ElementType::Paragraph),
                    },
                    LayoutBox {
                        x: 0.0,
                        y: 50.0,
                        width: 100.0,
                        height: 20.0,
                        content: BoxContent::Text(vec![TextLine::from("Experience")]),
                        style: StyleDeclaration::default(),
                        element_type: Some(ElementType::Heading2),
                    },
                    LayoutBox {
                        x: 0.0,
                        y: 70.0,
                        width: 100.0,
                        height: 15.0,
                        content: BoxContent::Text(vec![TextLine::from(
                            "Senior Software Engineer - May 2020 - Present",
                        )]),
                        style: StyleDeclaration::default(),
                        element_type: Some(ElementType::Paragraph),
                    },
                    LayoutBox {
                        x: 0.0,
                        y: 85.0,
                        width: 100.0,
                        height: 15.0,
                        content: BoxContent::Text(vec![TextLine::from(
                            "Software Engineer - January 2018 - April 2020",
                        )]),
                        style: StyleDeclaration::default(),
                        element_type: Some(ElementType::Paragraph),
                    },
                    LayoutBox {
                        x: 0.0,
                        y: 100.0,
                        width: 100.0,
                        height: 15.0,
                        content: BoxContent::Text(vec![TextLine::from(
                            "Junior Developer - March 2016 - December 2017",
                        )]),
                        style: StyleDeclaration::default(),
                        element_type: Some(ElementType::Paragraph),
                    },
                    LayoutBox {
                        x: 0.0,
                        y: 115.0,
                        width: 100.0,
                        height: 15.0,
                        content: BoxContent::Text(vec![TextLine::from(
                            "Intern - June 2015 - February 2016",
                        )]),
                        style: StyleDeclaration::default(),
                        element_type: Some(ElementType::Paragraph),
                    },
                    LayoutBox {
                        x: 0.0,
                        y: 130.0,
                        width: 100.0,
                        height: 15.0,
                        content: BoxContent::Text(vec![TextLine::from(
                            "Teaching Assistant - September 2014 - May 2015",
                        )]),
                        style: StyleDeclaration::default(),
                        element_type: Some(ElementType::Paragraph),
                    },
                    LayoutBox {
                        x: 0.0,
                        y: 150.0,
                        width: 100.0,
                        height: 20.0,
                        content: BoxContent::Text(vec![TextLine::from("Education")]),
                        style: StyleDeclaration::default(),
                        element_type: Some(ElementType::Heading2),
                    },
                    LayoutBox {
                        x: 0.0,
                        y: 170.0,
                        width: 100.0,
                        height: 15.0,
                        content: BoxContent::Text(vec![TextLine::from(
                            "Bachelor of Science in Computer Science",
                        )]),
                        style: StyleDeclaration::default(),
                        element_type: Some(ElementType::Paragraph),
                    },
                    LayoutBox {
                        x: 0.0,
                        y: 200.0,
                        width: 100.0,
                        height: 20.0,
                        content: BoxContent::Text(vec![TextLine::from("Skills")]),
                        style: StyleDeclaration::default(),
                        element_type: Some(ElementType::Heading2),
                    },
                    LayoutBox {
                        x: 0.0,
                        y: 220.0,
                        width: 100.0,
                        height: 15.0,
                        content: BoxContent::Text(vec![TextLine::from(
                            "Python, JavaScript, Rust, React",
                        )]),
                        style: StyleDeclaration::default(),
                        element_type: Some(ElementType::Paragraph),
                    },
                ],
            }],
        };

        let metadata = CVMetadata {
            name: Some("Jane Smith".to_string()),
            title: Some("Software Engineer".to_string()),
            email: Some("jane@example.com".to_string()),
            phone: Some("+1-555-123-4567".to_string()),
            location: None,
            website: None,
            layout_type: LayoutType::SingleColumn,
            estimated_pages: 1,
            component_count: 10,
            has_contact_info: true,
            has_clear_sections: true,
            font_complexity: FontComplexity::Simple,
        };

        let report = validate_ats_compatibility(&layout, &metadata, true, None);

        assert!(report.fields_placed.name);
        assert!(report.fields_placed.email);
        assert!(report.text_embedded);
        assert!(report.fonts_embedded);
        assert!(report.proper_structure);
        assert!(report.score >= 0.9); // Should pass 90% threshold
    }

    #[test]
    fn test_validate_ats_with_custom_weights() {
        let layout = LayoutStructure {
            page_width: 612.0,
            page_height: 792.0,
            pages: vec![Page {
                page_number: 1,
                boxes: vec![
                    LayoutBox {
                        x: 0.0,
                        y: 0.0,
                        width: 100.0,
                        height: 20.0,
                        content: BoxContent::Text(vec![TextLine::from("John Doe")]),
                        style: StyleDeclaration::default(),
                        element_type: Some(ElementType::Heading1),
                    },
                    LayoutBox {
                        x: 0.0,
                        y: 20.0,
                        width: 100.0,
                        height: 15.0,
                        content: BoxContent::Text(vec![TextLine::from("john@example.com")]),
                        style: StyleDeclaration::default(),
                        element_type: Some(ElementType::Paragraph),
                    },
                ],
            }],
        };

        let metadata = CVMetadata {
            name: Some("John Doe".to_string()),
            title: Some("Software Engineer".to_string()),
            email: Some("john@example.com".to_string()),
            phone: None,
            location: None,
            website: None,
            layout_type: LayoutType::SingleColumn,
            estimated_pages: 1,
            component_count: 2,
            has_contact_info: true,
            has_clear_sections: false,
            font_complexity: FontComplexity::Simple,
        };

        // Custom weights emphasizing contact info
        use crate::ats::report::ATSWeights;
        let custom_weights = ATSWeights {
            name: 0.25,
            email: 0.25,
            phone: 0.10,
            experience: 0.15,
            education: 0.10,
            skills: 0.05,
            text_embedded: 0.05,
            fonts_embedded: 0.03,
            structure: 0.02,
        };

        let report = validate_ats_compatibility(&layout, &metadata, true, Some(&custom_weights));

        assert!(report.fields_placed.name);
        assert!(report.fields_placed.email);
        assert!(report.text_embedded);
        assert!(report.fonts_embedded);

        // Score should reflect custom weights: name (0.25) + email (0.25) + text (0.05) + fonts (0.03) = 0.58
        assert!((report.score - 0.58).abs() < 0.01);
    }
}
