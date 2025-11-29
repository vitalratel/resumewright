//! Flexbox layout styling properties

use serde::{Deserialize, Serialize};

use super::{AlignItems, Display, FlexDirection, JustifyContent};

/// Flexbox layout styling properties
///
/// Groups all flexbox-related CSS properties for better organization
/// and token efficiency.
///
/// # Example
/// ```
/// use layout_types::{FlexStyle, Display, FlexDirection, JustifyContent};
///
/// let mut flex = FlexStyle::default();
/// flex.display = Some(Display::Flex);
/// flex.flex_direction = Some(FlexDirection::Column);
/// flex.justify_content = Some(JustifyContent::SpaceBetween);
/// ```
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct FlexStyle {
    pub display: Option<Display>,
    pub flex: Option<f64>,
    pub flex_shrink: Option<f64>,
    pub flex_direction: Option<FlexDirection>,
    pub justify_content: Option<JustifyContent>,
    pub align_items: Option<AlignItems>,
    pub gap: Option<f64>,        // Gap between flex/grid items (in PDF points)
    pub row_gap: Option<f64>,    // Row gap for flex/grid layouts (in PDF points)
    pub column_gap: Option<f64>, // Column gap for flex/grid layouts (in PDF points)
}

impl FlexStyle {
    /// Create a new flex style with all None values
    pub fn new() -> Self {
        Self {
            display: None,
            flex: None,
            flex_shrink: None,
            flex_direction: None,
            justify_content: None,
            align_items: None,
            gap: None,
            row_gap: None,
            column_gap: None,
        }
    }
}

impl Default for FlexStyle {
    fn default() -> Self {
        Self {
            display: Some(Display::Block),
            flex: None,
            flex_shrink: None,
            flex_direction: Some(FlexDirection::Row),
            justify_content: None,
            align_items: None,
            gap: None,
            row_gap: None,
            column_gap: None,
        }
    }
}
