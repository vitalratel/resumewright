//! CV layout detection and ATS analysis
//!
//! This module contains functions for analyzing CV structure, detecting layout types,
//! estimating page counts, and evaluating font complexity.

use tsx_parser::{JSXElement, TsxDocument};

use crate::metadata::{FontComplexity, LayoutType};

// Page estimation constants (characters per page by layout type)

/// Average characters per page for single-column layouts
const CHARS_PER_PAGE_SINGLE: usize = 3000;

/// Average characters per page for two-column layouts (more dense)
const CHARS_PER_PAGE_TWO_COL: usize = 4000;

/// Average characters per page for academic CV layouts (typically denser)
const CHARS_PER_PAGE_ACADEMIC: usize = 2500;

/// Average characters per page for portfolio layouts
const CHARS_PER_PAGE_PORTFOLIO: usize = 3500;

/// Default characters per page for custom/unknown layouts
const CHARS_PER_PAGE_CUSTOM: usize = 3000;

// Section detection thresholds

/// Minimum number of h2/h3 headings to indicate clear sections
const MIN_SECTION_HEADINGS: usize = 2;

/// Minimum number of section tags to suggest two-column layout
const MIN_SECTIONS_FOR_TWO_COL: usize = 2;

/// Minimum number of div elements to suggest custom/complex layout
const MIN_DIVS_FOR_CUSTOM: usize = 10;

/// Detect layout type from component structure.
///
/// # Algorithm
///
/// Uses simple heuristics based on element counts:
/// - 2+ `<section>` tags → `TwoColumn`
/// - 10+ `<div>` tags → `Custom`
/// - Otherwise → `SingleColumn`
///
/// # Limitations
///
/// This detection is **highly simplistic** and has known issues:
/// - **No CSS analysis** - Does not inspect `display`, `grid`, `flex`, or `float` properties
/// - **False positives** - Single-column CVs with multiple sections are misclassified as two-column
/// - **Unreachable variants** - `Academic` and `Portfolio` layouts are never detected
/// - **Arbitrary thresholds** - The 2-section and 10-div thresholds have no empirical basis
///
/// **Recommendation:** For production use, implement CSS property analysis in the layout-engine
/// crate which has access to computed styles. This function provides a rough estimate only.
///
/// # Returns
///
/// Best-guess layout type based on structural heuristics.
pub(crate) fn detect_layout_type(elements: &[&JSXElement]) -> LayoutType {
    // Simple heuristic: look for grid/flex patterns
    // In a real implementation, we'd analyze the structure more deeply

    // Count divs and sections
    let div_count = elements
        .iter()
        .filter(|e| tsx_parser::extract_element_name(e) == "div")
        .count();
    let section_count = elements
        .iter()
        .filter(|e| tsx_parser::extract_element_name(e) == "section")
        .count();

    // If we have multiple sections at the same level, it might be two-column
    if section_count >= MIN_SECTIONS_FOR_TWO_COL {
        LayoutType::TwoColumn
    } else if div_count > MIN_DIVS_FOR_CUSTOM {
        // Complex structure might indicate portfolio or academic
        LayoutType::Custom
    } else {
        LayoutType::SingleColumn
    }
}

/// Estimate page count based on content length and layout
pub(crate) fn estimate_page_count(content_length: usize, layout: LayoutType) -> usize {
    let chars_per_page = match layout {
        LayoutType::SingleColumn => CHARS_PER_PAGE_SINGLE,
        LayoutType::TwoColumn => CHARS_PER_PAGE_TWO_COL,
        LayoutType::Academic => CHARS_PER_PAGE_ACADEMIC,
        LayoutType::Portfolio => CHARS_PER_PAGE_PORTFOLIO,
        LayoutType::Custom => CHARS_PER_PAGE_CUSTOM,
    };

    (content_length / chars_per_page).max(1)
}

/// Detect if CV has clear section headings
pub(crate) fn detect_clear_sections(elements: &[&JSXElement]) -> bool {
    // Count heading elements (h2, h3) that likely indicate sections
    let heading_count = elements
        .iter()
        .filter(|e| {
            let tag = tsx_parser::extract_element_name(e);
            tag == "h2" || tag == "h3"
        })
        .count();

    // Check if we have enough headings to indicate clear sections
    heading_count >= MIN_SECTION_HEADINGS
}

/// Detect font complexity from inline styles in document.
///
/// # How It Works
///
/// Scans the TSX source for `font-family` CSS properties in inline styles.
/// Extracts unique font names and counts them to determine complexity level.
///
/// # Limitations
///
/// - **Only analyzes inline styles** - Does not parse `<style>` tags or external CSS
/// - **Counts font-family declarations** - Not font variations (weight, style, size)
/// - **Extracts first font from stacks** - Ignores fallback fonts in comma-separated lists
/// - **No web font analysis** - Does not distinguish between system fonts and custom fonts
/// - **Case-insensitive** - "Arial" and "arial" count as the same font
///
/// For comprehensive font analysis, use the layout-engine's CSS parser which has
/// full access to computed styles and can analyze all font properties.
///
/// # Returns
///
/// - `FontComplexity::Simple`: 0-2 unique fonts (best for ATS)
/// - `FontComplexity::Moderate`: 3-4 unique fonts (acceptable)
/// - `FontComplexity::Complex`: 5+ unique fonts (may reduce ATS compatibility)
pub(crate) fn detect_font_complexity(document: &TsxDocument) -> FontComplexity {
    use std::collections::HashSet;

    let mut fonts = HashSet::new();

    for cap in regex_utils::FONT_FAMILY.captures_iter(&document.source) {
        if let Some(font) = cap.get(1) {
            // Extract first font from comma-separated list
            let first_font = font
                .as_str()
                .split(',')
                .next()
                .unwrap_or("")
                .trim()
                .trim_matches(|c| c == '"' || c == '\'');

            if !first_font.is_empty() {
                fonts.insert(first_font.to_lowercase());
            }
        }
    }

    match fonts.len() {
        0..=2 => FontComplexity::Simple,
        3..=4 => FontComplexity::Moderate,
        _ => FontComplexity::Complex,
    }
}
