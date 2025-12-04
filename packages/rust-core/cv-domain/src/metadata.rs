//! CV metadata extraction and analysis
//!
//! This module contains the CVMetadata struct and the main extraction logic.

use serde::{Deserialize, Serialize};
use thiserror::Error;
use tsx_parser::{extract_jsx_elements, TsxDocument};

use crate::analysis::{
    detect_clear_sections, detect_font_complexity, detect_layout_type, estimate_page_count,
};
use crate::extractors::{
    collect_all_text, extract_email_from_text, extract_location_from_text,
    extract_name_from_elements, extract_phone_from_text, extract_title_from_elements,
    extract_website_from_text,
};

/// Metadata extracted from a CV/resume TSX document.
///
/// This struct contains structured information parsed from the CV,
/// including personal details, document characteristics, and ATS optimization hints.
///
/// # Example
///
/// ```no_run
/// use cv_domain::extract_metadata;
/// use tsx_parser::parse_tsx;
///
/// let tsx = r#"<div><h1>John Doe</h1><p>john@example.com</p></div>"#;
/// let doc = parse_tsx(tsx)?;
/// let metadata = extract_metadata(&doc)?;
/// assert_eq!(metadata.name, Some("John Doe".to_string()));
/// # Ok::<(), Box<dyn std::error::Error>>(())
/// ```
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CVMetadata {
    // Personal Information
    /// Candidate's full name extracted from h1/h2 tags or styled divs.
    /// Returns `None` if name extraction heuristics fail.
    pub name: Option<String>,

    /// Professional title or headline (e.g., "Software Engineer").
    /// Extracted from the first paragraph or span after the name heading.
    pub title: Option<String>,

    /// Email address extracted via regex pattern matching.
    /// Returns `None` if no valid email format is detected.
    pub email: Option<String>,

    /// Phone number in common formats (US/International).
    /// Returns `None` if no phone pattern is detected.
    pub phone: Option<String>,

    /// Location in "City, State" or "City, Country" format.
    /// Returns `None` if no location pattern is detected.
    pub location: Option<String>,

    /// Website URL (http/https, www, or common TLDs).
    /// Returns `None` if no URL pattern is detected.
    pub website: Option<String>,

    // Document Characteristics
    /// Detected layout structure of the CV.
    /// Based on heuristics analyzing component count and structure.
    pub layout_type: LayoutType,

    /// Estimated number of pages when rendered to PDF.
    /// Calculated based on content length and layout type.
    pub estimated_pages: usize,

    /// Total count of JSX elements/components in the document.
    pub component_count: usize,

    // ATS Optimization Hints
    /// Whether contact information (email OR phone) was detected.
    /// Critical for ATS (Applicant Tracking System) compatibility.
    pub has_contact_info: bool,

    /// Whether the CV has clear section headings (h2/h3 tags).
    /// Important for ATS parsing and document structure.
    pub has_clear_sections: bool,

    /// Font complexity level based on unique font families used.
    /// Simpler fonts improve ATS compatibility.
    pub font_complexity: FontComplexity,
}

impl CVMetadata {
    /// Checks if this CV meets basic ATS (Applicant Tracking System) requirements.
    ///
    /// ATS systems require at minimum:
    /// - Contact information (email OR phone)
    /// - Clear section structure
    ///
    /// # Returns
    ///
    /// `true` if the CV has both contact info and clear sections, `false` otherwise.
    pub fn is_ats_friendly(&self) -> bool {
        self.has_contact_info && self.has_clear_sections
    }

    /// Calculate ATS (Applicant Tracking System) compatibility score
    ///
    /// ## Scoring Algorithm
    ///
    /// The score is calculated from 0-100 based on multiple factors that affect
    /// how well automated resume parsing systems can extract and understand CV content.
    ///
    /// ### Name Identification (20 points)
    /// - **Criterion:** Name detected in h1/h2 heading or styled div
    /// - **Why it matters:** ATS systems require candidate identification
    /// - **Points:** +20 if `name` field is `Some`
    ///
    /// ### Email Contact (20 points)
    /// - **Criterion:** Valid email address found in content
    /// - **Why it matters:** Primary contact method for recruiters and ATS notifications
    /// - **Points:** +20 if `email` field is `Some`
    /// - **Pattern:** Standard email format (user@domain.tld)
    ///
    /// ### Phone Contact (20 points)
    /// - **Criterion:** Phone number detected in US/International format
    /// - **Why it matters:** Alternative contact method, important for many ATS systems
    /// - **Points:** +20 if `phone` field is `Some`
    /// - **Formats:** (555) 123-4567, +1-555-123-4567, 555.123.4567
    ///
    /// ### Clear Section Structure (20 points)
    /// - **Criterion:** 2+ section headings (h2/h3 tags) detected
    /// - **Why it matters:** ATS systems parse CVs by sections (Experience, Education, Skills)
    /// - **Points:** +20 if `has_clear_sections` is `true`
    /// - **Detection:** Counts h2 and h3 heading elements
    ///
    /// ### Simple Font Usage (20 points)
    /// - **Criterion:** 0-2 unique font families used
    /// - **Why it matters:** Complex fonts can cause text extraction errors in ATS parsers
    /// - **Points:** +20 if `font_complexity` is `FontComplexity::Simple`
    /// - **Detection:** Analyzes inline style font-family declarations
    ///
    /// ## Score Interpretation
    ///
    /// | Score Range | Rating | Meaning |
    /// |------------|---------|----------|
    /// | **80-100** | Excellent | Highly ATS-compatible, minimal parsing issues expected |
    /// | **60-79**  | Good | Generally compatible, minor improvements possible |
    /// | **40-59**  | Fair | Needs improvement, may have parsing issues |
    /// | **0-39**   | Poor | Major compatibility issues, likely to fail ATS parsing |
    ///
    /// ## Recommendations
    ///
    /// - **80+:** CV should parse successfully in most ATS systems
    /// - **60-79:** Consider adding missing contact info or improving section structure
    /// - **Below 60:** Use `ats_suggestions()` to identify specific issues to fix
    ///
    /// ## Limitations
    ///
    /// This scoring is **heuristic-based** and has known limitations:
    /// - Does not validate actual ATS parsing success (would require ATS API integration)
    /// - Does not penalize complex layouts, graphics, or tables (common ATS issues)
    /// - Treats all factors equally (real ATS systems may weight differently)
    /// - Does not check for keywords, job-specific content, or semantic relevance
    ///
    /// # Returns
    ///
    /// A score from 0 (poor ATS compatibility) to 100 (excellent ATS compatibility).
    ///
    /// # Example
    ///
    /// ```no_run
    /// # use cv_domain::extract_metadata;
    /// # use tsx_parser::parse_tsx;
    /// # let tsx = "<div><h1>John Doe</h1></div>";
    /// # let doc = parse_tsx(tsx)?;
    /// let metadata = extract_metadata(&doc)?;
    /// let score = metadata.ats_score();
    ///
    /// match score {
    ///     80..=100 => println!("Excellent ATS compatibility!"),
    ///     60..=79 => println!("Good - consider minor improvements"),
    ///     40..=59 => println!("Fair - needs improvement"),
    ///     _ => println!("Poor - major issues detected"),
    /// }
    /// # Ok::<(), Box<dyn std::error::Error>>(())
    /// ```
    pub fn ats_score(&self) -> u8 {
        let mut score = 0;

        // Name is critical for identification
        if self.name.is_some() {
            score += 20;
        }

        // Email is the most common contact method
        if self.email.is_some() {
            score += 20;
        }

        // Phone provides alternative contact
        if self.phone.is_some() {
            score += 20;
        }

        // Clear sections help ATS parse structure
        if self.has_clear_sections {
            score += 20;
        }

        // Simple fonts improve parsing accuracy
        if matches!(self.font_complexity, FontComplexity::Simple) {
            score += 20;
        }

        score
    }

    /// Returns a human-readable summary of missing ATS requirements.
    ///
    /// Useful for providing feedback to users about how to improve their CV.
    ///
    /// # Returns
    ///
    /// A vector of strings describing missing elements, or empty vec if all requirements met.
    pub fn ats_suggestions(&self) -> Vec<String> {
        let mut suggestions = Vec::new();

        if self.name.is_none() {
            suggestions.push("Add a clear name heading (h1 or h2 tag)".to_string());
        }

        if self.email.is_none() && self.phone.is_none() {
            suggestions.push("Add contact information (email or phone number)".to_string());
        }

        if !self.has_clear_sections {
            suggestions.push("Use clear section headings (h2 or h3 tags)".to_string());
        }

        if matches!(self.font_complexity, FontComplexity::Complex) {
            suggestions.push("Reduce font variety for better ATS compatibility".to_string());
        }

        suggestions
    }
}

/// CV layout structure types.
///
/// Detected using heuristics based on component count and structure.
/// Used to estimate page count and guide rendering decisions.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum LayoutType {
    /// Traditional single-column layout (most common).
    SingleColumn,

    /// Two-column layout with content split left/right.
    TwoColumn,

    /// Academic CV format (typically longer, dense content).
    Academic,

    /// Portfolio-style layout (visual-heavy, custom sections).
    Portfolio,

    /// Custom or complex layout not matching standard patterns.
    Custom,
}

/// Font complexity level based on number of unique font families.
///
/// Simpler font usage improves ATS compatibility and rendering performance.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum FontComplexity {
    /// 1-2 unique font families used.
    Simple,

    /// 3-4 unique font families used.
    Moderate,

    /// 5 or more unique font families used.
    Complex,
}

/// Errors that can occur during metadata extraction.
#[derive(Debug, Error)]
pub enum ExtractionError {
    /// Metadata extraction failed with the given reason.
    #[error("Failed to extract metadata: {0}")]
    ExtractionFailed(String),
}

/// Extract CV metadata from parsed TSX document.
///
/// This function analyzes the TSX document structure to extract personal information,
/// detect layout characteristics, and provide ATS optimization hints.
///
/// # Arguments
///
/// * `document` - The parsed TSX document to analyze
///
/// # Returns
///
/// Returns `Ok(CVMetadata)` with extracted information. Currently never returns `Err`
/// as extraction failures result in `None` values in optional fields rather than errors.
///
/// # Example
///
/// ```no_run
/// use cv_domain::extract_metadata;
/// use tsx_parser::parse_tsx;
///
/// let tsx = r#"
///     <div>
///         <h1>John Doe</h1>
///         <p>john@example.com | (555) 123-4567</p>
///         <h2>Experience</h2>
///         <p>Software Engineer at Tech Co</p>
///     </div>
/// "#;
/// let doc = parse_tsx(tsx)?;
/// let metadata = extract_metadata(&doc)?;
///
/// assert_eq!(metadata.name, Some("John Doe".to_string()));
/// assert_eq!(metadata.email, Some("john@example.com".to_string()));
/// assert!(metadata.has_contact_info);
/// # Ok::<(), Box<dyn std::error::Error>>(())
/// ```
pub fn extract_metadata(document: &TsxDocument) -> Result<CVMetadata, ExtractionError> {
    let elements = extract_jsx_elements(document);

    let mut metadata = CVMetadata {
        name: None,
        title: None,
        email: None,
        phone: None,
        location: None,
        website: None,
        layout_type: LayoutType::SingleColumn,
        estimated_pages: 1,
        component_count: elements.len(),
        has_contact_info: false,
        has_clear_sections: false,
        font_complexity: FontComplexity::Simple,
    };

    // Extract name from first <h1> or large heading
    metadata.name = extract_name_from_elements(&elements);

    // Extract title from first paragraph after the name
    metadata.title = extract_title_from_elements(&elements, metadata.name.as_deref());

    // Extract contact information (email, phone patterns)
    let all_text = collect_all_text(&elements);
    metadata.email = extract_email_from_text(&all_text);
    metadata.phone = extract_phone_from_text(&all_text);
    metadata.location = extract_location_from_text(&all_text);
    metadata.website = extract_website_from_text(&all_text);

    // Detect layout type from component structure
    metadata.layout_type = detect_layout_type(&elements);

    // Estimate page count based on content length
    let content_length = document.source.len();
    metadata.estimated_pages = estimate_page_count(content_length, metadata.layout_type);

    // Set ATS hints
    metadata.has_contact_info = metadata.email.is_some() || metadata.phone.is_some();
    metadata.has_clear_sections = detect_clear_sections(&elements);
    metadata.font_complexity = detect_font_complexity(document);

    Ok(metadata)
}
