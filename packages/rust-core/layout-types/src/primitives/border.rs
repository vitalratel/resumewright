//! Border style definitions

use serde::{Deserialize, Serialize};

use super::Color;

/// Border style definition for box edges
///
/// Defines the appearance of a border with width, color, and line style.
///
/// # Example
/// ```
/// use layout_types::{BorderStyle, Color, BorderLineStyle};
///
/// // Solid black border
/// let border = BorderStyle::solid(2.0, Color::BLACK);
///
/// // Dashed border
/// let dashed = BorderStyle::dashed(1.0, Color::rgb(128, 128, 128));
/// ```
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct BorderStyle {
    /// Border width in PDF points
    pub width: f64,
    /// Border color
    pub color: Color,
    /// Border line style (solid, dashed, dotted, none)
    pub style: BorderLineStyle,
}

impl BorderStyle {
    /// Create a solid border with the given width and color
    pub fn solid(width: f64, color: Color) -> Self {
        Self {
            width,
            color,
            style: BorderLineStyle::Solid,
        }
    }

    /// Create a dashed border with the given width and color
    pub fn dashed(width: f64, color: Color) -> Self {
        Self {
            width,
            color,
            style: BorderLineStyle::Dashed,
        }
    }

    /// Create a dotted border with the given width and color
    pub fn dotted(width: f64, color: Color) -> Self {
        Self {
            width,
            color,
            style: BorderLineStyle::Dotted,
        }
    }

    /// No border (zero width, transparent)
    pub fn none() -> Self {
        Self {
            width: 0.0,
            color: Color::TRANSPARENT,
            style: BorderLineStyle::None,
        }
    }
}

impl Default for BorderStyle {
    /// Default border: 1px solid black
    fn default() -> Self {
        Self {
            width: 1.0,
            color: Color::BLACK,
            style: BorderLineStyle::Solid,
        }
    }
}

/// Border line style type
///
/// Defines the visual style of a border line.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum BorderLineStyle {
    /// Solid continuous line
    Solid,
    /// Dashed line
    Dashed,
    /// Dotted line
    Dotted,
    /// No border
    None,
}
