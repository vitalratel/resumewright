//! Unified CSS style declaration

use serde::{Deserialize, Serialize};

use super::{BoxStyle, FlexStyle, TextStyle};
use crate::primitives::Spacing;

/// CSS style declaration for layout elements
///
/// Represents parsed CSS properties that can be applied to layout boxes.
/// Organized into logical groups (text, box model, flex) for better
/// maintainability and token efficiency.
///
/// # Example
/// ```
/// use layout_types::{StyleDeclaration, Color, Spacing};
///
/// let mut style = StyleDeclaration::default();
/// style.text.font_size = Some(14.0);
/// style.text.color = Some(Color::rgb(0, 0, 255));
/// style.box_model.padding = Some(Spacing::uniform(8.0));
/// ```
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
pub struct StyleDeclaration {
    /// Text styling properties (fonts, colors, alignment)
    pub text: TextStyle,
    /// Box model properties (dimensions, spacing, borders)
    pub box_model: BoxStyle,
    /// Flexbox layout properties
    pub flex: FlexStyle,
}

impl StyleDeclaration {
    /// Create a new style declaration with all None values
    ///
    /// Use this when you want to specify only specific properties
    /// without inheriting any defaults.
    pub fn new() -> Self {
        Self {
            text: TextStyle::new(),
            box_model: BoxStyle::new(),
            flex: FlexStyle::new(),
        }
    }

    /// Set margin using a Spacing value
    ///
    /// # Example
    /// ```
    /// use layout_types::{StyleDeclaration, Spacing};
    ///
    /// let style = StyleDeclaration::new()
    ///     .with_margin(Spacing::uniform(10.0));
    /// ```
    pub fn with_margin(mut self, spacing: Spacing) -> Self {
        self.box_model.margin = Some(spacing);
        self
    }

    /// Set uniform margin on all sides
    ///
    /// # Example
    /// ```
    /// use layout_types::StyleDeclaration;
    ///
    /// let style = StyleDeclaration::new()
    ///     .with_uniform_margin(10.0);
    /// ```
    pub fn with_uniform_margin(mut self, value: f64) -> Self {
        self.box_model.margin = Some(Spacing::uniform(value));
        self
    }

    /// Set padding using a Spacing value
    ///
    /// # Example
    /// ```
    /// use layout_types::{StyleDeclaration, Spacing};
    ///
    /// let style = StyleDeclaration::new()
    ///     .with_padding(Spacing::uniform(8.0));
    /// ```
    pub fn with_padding(mut self, spacing: Spacing) -> Self {
        self.box_model.padding = Some(spacing);
        self
    }

    /// Set uniform padding on all sides
    ///
    /// # Example
    /// ```
    /// use layout_types::StyleDeclaration;
    ///
    /// let style = StyleDeclaration::new()
    ///     .with_uniform_padding(8.0);
    /// ```
    pub fn with_uniform_padding(mut self, value: f64) -> Self {
        self.box_model.padding = Some(Spacing::uniform(value));
        self
    }
}
