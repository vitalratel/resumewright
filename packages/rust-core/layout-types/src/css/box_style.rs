//! Box model styling properties

use serde::{Deserialize, Serialize};

use crate::primitives::{BorderStyle, Color, Spacing};

/// Box model styling properties
///
/// Groups all box-model CSS properties (dimensions, spacing, borders)
/// for better organization and token efficiency.
///
/// # Example
/// ```
/// use layout_types::{BoxStyle, Spacing};
///
/// let mut box_style = BoxStyle::default();
/// box_style.padding = Some(Spacing::uniform(8.0));
/// box_style.width = Some(200.0);
/// ```
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BoxStyle {
    pub margin: Option<Spacing>,
    pub padding: Option<Spacing>,
    pub width: Option<f64>,
    pub height: Option<f64>,
    pub max_width: Option<f64>,
    pub max_height: Option<f64>,
    pub border_top: Option<BorderStyle>,
    pub border_right: Option<BorderStyle>,
    pub border_bottom: Option<BorderStyle>,
    pub border_left: Option<BorderStyle>,
    pub background_color: Option<Color>,
    pub opacity: Option<f64>,       // 0.0-1.0
    pub border_radius: Option<f64>, // In PDF points
}

impl BoxStyle {
    /// Create a new box style with all None values
    pub fn new() -> Self {
        Self {
            margin: None,
            padding: None,
            width: None,
            height: None,
            max_width: None,
            max_height: None,
            border_top: None,
            border_right: None,
            border_bottom: None,
            border_left: None,
            background_color: None,
            opacity: None,
            border_radius: None,
        }
    }

    /// Set margin using a Spacing value
    ///
    /// # Example
    /// ```
    /// use layout_types::{BoxStyle, Spacing};
    ///
    /// let box_style = BoxStyle::new()
    ///     .with_margin(Spacing::uniform(10.0));
    /// ```
    pub fn with_margin(mut self, spacing: Spacing) -> Self {
        self.margin = Some(spacing);
        self
    }

    /// Set uniform margin on all sides
    ///
    /// # Example
    /// ```
    /// use layout_types::BoxStyle;
    ///
    /// let box_style = BoxStyle::new()
    ///     .with_uniform_margin(10.0);
    /// ```
    pub fn with_uniform_margin(mut self, value: f64) -> Self {
        self.margin = Some(Spacing::uniform(value));
        self
    }

    /// Set padding using a Spacing value
    ///
    /// # Example
    /// ```
    /// use layout_types::{BoxStyle, Spacing};
    ///
    /// let box_style = BoxStyle::new()
    ///     .with_padding(Spacing::uniform(8.0));
    /// ```
    pub fn with_padding(mut self, spacing: Spacing) -> Self {
        self.padding = Some(spacing);
        self
    }

    /// Set uniform padding on all sides
    ///
    /// # Example
    /// ```
    /// use layout_types::BoxStyle;
    ///
    /// let box_style = BoxStyle::new()
    ///     .with_uniform_padding(8.0);
    /// ```
    pub fn with_uniform_padding(mut self, value: f64) -> Self {
        self.padding = Some(Spacing::uniform(value));
        self
    }
}

impl Default for BoxStyle {
    fn default() -> Self {
        Self {
            margin: Some(Spacing::ZERO),
            padding: Some(Spacing::ZERO),
            width: None,
            height: None,
            max_width: None,
            max_height: None,
            border_top: None,
            border_right: None,
            border_bottom: None,
            border_left: None,
            background_color: None,
            opacity: None,
            border_radius: None,
        }
    }
}
