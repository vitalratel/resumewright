//! Page break decision logic
//!
//! Determines when to break pages based on:
//! - Box overflow (box doesn't fit)
//! - Orphan prevention (headings without following content)

use layout_types::ElementType;

/// Reason for a page break decision
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PageBreakReason {
    /// No break needed - box fits on current page
    NoBreak,
    /// Break needed because box would overflow the page
    Overflow,
    /// Break needed to prevent orphaned heading (heading fits but insufficient space for content)
    OrphanPrevention,
}

/// Minimum space that should be available after a heading
///
/// Set to allow at least one line of content after the heading:
/// - At least 1 line of text (~15pt)
/// - Some margin (~10pt)
///
/// A value of 30pt is aggressive but allows maximum space utilization
/// while still preventing completely isolated headings.
pub const MIN_SPACE_AFTER_HEADING: f64 = 30.0;

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
/// * `PageBreakReason::NoBreak` if the box can be placed on the current page
/// * `PageBreakReason::Overflow` if the box would exceed the page bottom
/// * `PageBreakReason::OrphanPrevention` if this heading would be orphaned
pub fn should_break_page_for_box(
    _current_y: f64,
    _box_height: f64,
    box_would_end_at: f64,
    page_bottom: f64,
    element_type: Option<ElementType>,
) -> PageBreakReason {
    // Check if this is a heading that would be orphaned
    if let Some(et) = element_type {
        if et.is_heading() {
            // Calculate remaining space after this heading
            let space_after_heading = page_bottom - box_would_end_at;

            // If the heading fits but leaves insufficient space for content, break
            if box_would_end_at <= page_bottom && space_after_heading <= MIN_SPACE_AFTER_HEADING {
                return PageBreakReason::OrphanPrevention;
            }
        }
    }

    // Break if box would overflow page
    if box_would_end_at > page_bottom {
        PageBreakReason::Overflow
    } else {
        PageBreakReason::NoBreak
    }
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
        assert_eq!(
            result,
            PageBreakReason::Overflow,
            "Should break when box overflows page"
        );
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
        assert_eq!(
            result,
            PageBreakReason::NoBreak,
            "Should not break when box fits"
        );
    }

    #[test]
    fn test_heading_orphan_prevention() {
        // With 30pt threshold, 25pt remaining should trigger orphan prevention
        let result = should_break_page_for_box(
            685.0, // current_y
            40.0,  // heading height
            725.0, // box_would_end_at
            750.0, // page_bottom (25pt remaining < 30pt threshold)
            Some(ElementType::Heading2),
        );
        assert_eq!(
            result,
            PageBreakReason::OrphanPrevention,
            "Should break to prevent heading orphan (25pt < 30pt threshold)"
        );
    }

    #[test]
    fn test_heading_with_sufficient_space() {
        // With 30pt threshold, 40pt remaining should NOT trigger orphan prevention
        let result = should_break_page_for_box(
            670.0, // current_y
            40.0,  // heading height
            710.0, // box_would_end_at
            750.0, // page_bottom (40pt remaining > 30pt threshold)
            Some(ElementType::Heading2),
        );
        assert_eq!(
            result,
            PageBreakReason::NoBreak,
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
            // 25pt remaining < 30pt threshold should trigger for all headings
            let result = should_break_page_for_box(685.0, 40.0, 725.0, 750.0, Some(*heading_type));
            assert_eq!(
                result,
                PageBreakReason::OrphanPrevention,
                "{:?} should trigger orphan prevention",
                heading_type
            );
        }
    }
}
