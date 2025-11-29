//! Primitive types for layout system (Color, Spacing, Rect)

mod border;

pub use border::{BorderLineStyle, BorderStyle};

use serde::{Deserialize, Serialize};

use crate::error::ValidationError;

// ============================================================================
// Color
// ============================================================================

/// RGBA color representation for PDF rendering
///
/// All color components use 8-bit precision (0-255 for RGB),
/// with floating-point alpha channel (0.0-1.0 for transparency).
///
/// # Fields
/// - `r`: Red component (0-255)
/// - `g`: Green component (0-255)
/// - `b`: Blue component (0-255)
/// - `a`: Alpha/opacity (0.0 = fully transparent, 1.0 = fully opaque)
///
/// # Example
/// ```
/// # use layout_types::{Color, ValidationError};
/// # fn main() -> Result<(), ValidationError> {
/// // Solid black (const)
/// let black = Color::BLACK;
///
/// // Semi-transparent red (validated)
/// let red_50 = Color::rgba(255, 0, 0, 0.5)?;
///
/// // Alternatively use Color::new()
/// let color = Color::new(128, 128, 128, 0.8)?;
/// # Ok(())
/// # }
/// ```
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: f32,
}

impl Color {
    /// Create a new Color with validated alpha value
    ///
    /// # Errors
    /// Returns `ValidationError::InvalidAlpha` if alpha is not in range [0.0, 1.0]
    pub fn new(r: u8, g: u8, b: u8, a: f32) -> Result<Self, ValidationError> {
        if !(0.0..=1.0).contains(&a) {
            return Err(ValidationError::InvalidAlpha(a));
        }
        Ok(Self { r, g, b, a })
    }

    /// Create an opaque RGB color (alpha = 1.0)
    pub const fn rgb(r: u8, g: u8, b: u8) -> Self {
        Self { r, g, b, a: 1.0 }
    }

    /// Create an RGBA color with validated alpha channel
    ///
    /// # Errors
    /// Returns `ValidationError::InvalidAlpha` if alpha is not in range [0.0, 1.0]
    ///
    /// # Example
    /// ```
    /// # use layout_types::{Color, ValidationError};
    /// // Valid alpha
    /// let color = Color::rgba(255, 0, 0, 0.5)?;
    /// assert_eq!(color.a, 0.5);
    ///
    /// // Invalid alpha
    /// let result = Color::rgba(255, 0, 0, 1.5);
    /// assert!(result.is_err());
    /// # Ok::<(), ValidationError>(())
    /// ```
    pub fn rgba(r: u8, g: u8, b: u8, a: f32) -> Result<Self, ValidationError> {
        if !(0.0..=1.0).contains(&a) {
            return Err(ValidationError::InvalidAlpha(a));
        }
        Ok(Self { r, g, b, a })
    }

    /// Create an RGBA color without validating alpha channel
    ///
    /// # Safety
    /// Caller must ensure alpha is in range [0.0, 1.0].
    /// Invalid alpha values may cause undefined rendering behavior.
    ///
    /// Prefer `rgba()` unless performance-critical and alpha is known valid (e.g., compile-time constants).
    ///
    /// # Example
    /// ```
    /// # use layout_types::Color;
    /// // Safe for compile-time constants
    /// const SEMI_TRANSPARENT: Color = Color::rgba_unchecked(255, 0, 0, 0.5);
    /// ```
    #[inline]
    pub const fn rgba_unchecked(r: u8, g: u8, b: u8, a: f32) -> Self {
        Self { r, g, b, a }
    }

    /// Pure black (opaque)
    pub const BLACK: Self = Self::rgb(0, 0, 0);

    /// Pure white (opaque)
    pub const WHITE: Self = Self::rgb(255, 255, 255);

    /// Transparent (fully transparent black)
    pub const TRANSPARENT: Self = Self::rgba_unchecked(0, 0, 0, 0.0);
}

// ============================================================================
// Spacing
// ============================================================================

/// Box model spacing (margin or padding)
///
/// Defines spacing values for all four sides of a box.
/// All values are in PDF points.
///
/// # Example
/// ```
/// use layout_types::Spacing;
///
/// // Uniform spacing on all sides
/// let padding = Spacing::uniform(10.0);
///
/// // Different vertical and horizontal spacing
/// let margin = Spacing::symmetric(16.0, 8.0);
///
/// // Individual values for each side
/// let custom = Spacing::new(10.0, 20.0, 30.0, 40.0);
/// ```
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Default, PartialEq)]
pub struct Spacing {
    /// Top spacing in PDF points
    pub top: f64,
    /// Right spacing in PDF points
    pub right: f64,
    /// Bottom spacing in PDF points
    pub bottom: f64,
    /// Left spacing in PDF points
    pub left: f64,
}

impl Spacing {
    /// Create uniform spacing on all sides
    pub const fn uniform(value: f64) -> Self {
        Self {
            top: value,
            right: value,
            bottom: value,
            left: value,
        }
    }

    /// Create vertical (top/bottom) and horizontal (left/right) spacing
    pub const fn symmetric(vertical: f64, horizontal: f64) -> Self {
        Self {
            top: vertical,
            right: horizontal,
            bottom: vertical,
            left: horizontal,
        }
    }

    /// Create spacing with individual values for each side
    pub const fn new(top: f64, right: f64, bottom: f64, left: f64) -> Self {
        Self {
            top,
            right,
            bottom,
            left,
        }
    }

    /// Zero spacing on all sides
    pub const ZERO: Self = Self::uniform(0.0);
}

// ============================================================================
// Rect
// ============================================================================

/// Bounding rectangle with position and dimensions
///
/// Represents a positioned rectangle in PDF coordinate space.
/// All values are in PDF points.
///
/// # Example
/// ```
/// use layout_types::Rect;
///
/// let bounds = Rect::new(10.0, 20.0, 100.0, 50.0);
/// assert_eq!(bounds.x, 10.0);
/// assert_eq!(bounds.width, 100.0);
/// ```
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Default, PartialEq)]
pub struct Rect {
    /// X position (left edge) in PDF points
    pub x: f64,
    /// Y position (top edge) in PDF points
    pub y: f64,
    /// Width in PDF points
    pub width: f64,
    /// Height in PDF points
    pub height: f64,
}

impl Rect {
    /// Create a new rectangle with position and dimensions
    pub const fn new(x: f64, y: f64, width: f64, height: f64) -> Self {
        Self {
            x,
            y,
            width,
            height,
        }
    }

    /// Create a rectangle at origin (0, 0) with given dimensions
    pub const fn from_size(width: f64, height: f64) -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            width,
            height,
        }
    }

    /// Zero-sized rectangle at origin
    pub const ZERO: Self = Self::new(0.0, 0.0, 0.0, 0.0);
}
