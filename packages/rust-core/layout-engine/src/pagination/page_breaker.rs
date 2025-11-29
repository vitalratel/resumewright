//! Page break decision logic
//!
//! Determines when to break pages based on:
//! - Box overflow (box doesn't fit)
//! - Orphan prevention (headings without following content)

use layout_types::ElementType;

/// Minimum space that should be available after a heading
///
/// Set to allow enough content to justify keeping heading on current page:
/// - Company name/subtitle (~15pt)
/// - Some margin spacing (~15pt)
/// - At least 2 bullet points (~80pt)
///
/// A value of 120pt ensures headings have substantial content following them.
const MIN_SPACE_AFTER_HEADING: f64 = 120.0;

/// Determine if a page break should occur before placing this box
///
/// This implements two pagination rules:
/// 1. **Overflow prevention**: Break if the box would exceed the page bottom
/// 2. **Orphan prevention**: Break if this is a heading that would be orphaned
///
/// # Arguments
/// * `_current_y` - Current Y position (unused but kept for future features)
/// * `_box_height` - Box height (unused but kept for future features)
/// * `box_would_end_at` - Absolute Y where box would end
/// * `page_bottom` - Absolute Y of page's content bottom
/// * `element_type` - Type of element (for orphan detection)
///
/// # Returns
/// * `true` if a page break should occur before this box
/// * `false` if the box can be placed on the current page
pub fn should_break_page_for_box(
    _current_y: f64,
    _box_height: f64,
    box_would_end_at: f64,
    page_bottom: f64,
    element_type: Option<ElementType>,
) -> bool {
    // Check if this is a heading that would be orphaned
    if let Some(et) = element_type {
        if et.is_heading() {
            // Calculate remaining space after this heading
            let space_after_heading = page_bottom - box_would_end_at;

            // If the heading fits but leaves insufficient space for content, break
            if box_would_end_at <= page_bottom && space_after_heading <= MIN_SPACE_AFTER_HEADING {
                return true;
            }
        }
    }

    // Break if box would overflow page
    box_would_end_at > page_bottom
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_should_break_when_box_overflows() {
        let result = should_break_page_for_box(
            100.0, // current_y
            700.0, // box_height
            800.0, // box_would_end_at
            750.0, // page_bottom
            None,
        );
        assert!(result, "Should break when box overflows page");
    }

    #[test]
    fn test_should_not_break_when_box_fits() {
        let result = should_break_page_for_box(
            100.0, // current_y
            600.0, // box_height
            700.0, // box_would_end_at
            750.0, // page_bottom
            None,
        );
        assert!(!result, "Should not break when box fits");
    }

    #[test]
    fn test_heading_orphan_prevention() {
        // With 120pt threshold, 100pt remaining should trigger orphan prevention
        let result = should_break_page_for_box(
            610.0, // current_y
            40.0,  // heading height
            650.0, // box_would_end_at
            750.0, // page_bottom (100pt remaining < 120pt threshold)
            Some(ElementType::Heading2),
        );
        assert!(
            result,
            "Should break to prevent heading orphan (100pt < 120pt threshold)"
        );
    }

    #[test]
    fn test_heading_with_sufficient_space() {
        // With 120pt threshold, 150pt remaining should NOT trigger orphan prevention
        let result = should_break_page_for_box(
            560.0, // current_y
            40.0,  // heading height
            600.0, // box_would_end_at
            750.0, // page_bottom (150pt remaining > 120pt threshold)
            Some(ElementType::Heading2),
        );
        assert!(
            !result,
            "Should not break when heading has sufficient following space"
        );
    }

    #[test]
    fn test_all_heading_levels_trigger_orphan_prevention() {
        for heading_type in &[
            ElementType::Heading1,
            ElementType::Heading2,
            ElementType::Heading3,
            ElementType::Heading4,
            ElementType::Heading5,
            ElementType::Heading6,
        ] {
            // 100pt remaining < 120pt threshold should trigger for all headings
            let result = should_break_page_for_box(610.0, 40.0, 650.0, 750.0, Some(*heading_type));
            assert!(
                result,
                "{:?} should trigger orphan prevention",
                heading_type
            );
        }
    }
}
