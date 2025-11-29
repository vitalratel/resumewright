//! Content builder abstraction for PDF content streams
//!
//! This module provides a trait-based abstraction for building PDF content streams,
//! allowing for better testability and flexibility in how content is generated.

/// Trait for building PDF content streams
///
/// This trait abstracts the construction of PDF content stream operators,
/// allowing different implementations for production (String) and testing (Mock).
///
/// # Examples
///
/// ```
/// use pdf_generator::content_builder::ContentBuilder;
///
/// let mut content = String::new();
/// content.push_operator("BT");
/// content.push_operator("ET");
/// ```
pub trait ContentBuilder {
    /// Push a raw PDF operator or command to the content stream
    ///
    /// # Arguments
    ///
    /// * `op` - The PDF operator string (e.g., "BT", "ET", "0.5 w")
    fn push_operator(&mut self, op: &str);

    /// Push a formatted PDF operator with arguments
    ///
    /// This is a convenience method that handles formatting.
    ///
    /// # Arguments
    ///
    /// * `fmt_args` - Formatted string arguments
    fn push_formatted(&mut self, fmt_args: std::fmt::Arguments<'_>);

    /// Begin a text block (BT operator)
    fn begin_text(&mut self) {
        self.push_operator("BT\n");
    }

    /// End a text block (ET operator)
    fn end_text(&mut self) {
        self.push_operator("ET\n");
    }

    /// Set font and size (Tf operator)
    ///
    /// # Arguments
    ///
    /// * `font_name` - PDF font resource name (e.g., "Helvetica")
    /// * `size` - Font size in points
    fn set_font(&mut self, font_name: &str, size: f64) {
        self.push_formatted(format_args!("/{} {} Tf\n", font_name, size));
    }

    /// Set text position (Td operator)
    ///
    /// # Arguments
    ///
    /// * `x` - X coordinate in points
    /// * `y` - Y coordinate in points
    fn set_text_position(&mut self, x: f64, y: f64) {
        self.push_formatted(format_args!("{} {} Td\n", x, y));
    }

    /// Show text (Tj operator with hex-encoded string)
    ///
    /// # Arguments
    ///
    /// * `hex_text` - Hex-encoded text string
    fn show_text_hex(&mut self, hex_text: &str) {
        self.push_formatted(format_args!("<{}> Tj\n", hex_text));
    }

    /// Set fill color RGB (rg operator)
    ///
    /// # Arguments
    ///
    /// * `r` - Red component (0.0-1.0)
    /// * `g` - Green component (0.0-1.0)
    /// * `b` - Blue component (0.0-1.0)
    fn set_fill_color_rgb(&mut self, r: f64, g: f64, b: f64) {
        self.push_formatted(format_args!("{} {} {} rg\n", r, g, b));
    }

    /// Set stroke color RGB (RG operator)
    ///
    /// # Arguments
    ///
    /// * `r` - Red component (0.0-1.0)
    /// * `g` - Green component (0.0-1.0)
    /// * `b` - Blue component (0.0-1.0)
    fn set_stroke_color_rgb(&mut self, r: f64, g: f64, b: f64) {
        self.push_formatted(format_args!("{} {} {} RG\n", r, g, b));
    }

    /// Set line width (w operator)
    ///
    /// # Arguments
    ///
    /// * `width` - Line width in points
    fn set_line_width(&mut self, width: f64) {
        self.push_formatted(format_args!("{} w\n", width));
    }

    /// Set line dash pattern (d operator)
    ///
    /// # Arguments
    ///
    /// * `pattern` - Dash pattern array (e.g., "[3 2]" for dashed)
    /// * `phase` - Dash phase offset
    fn set_dash_pattern(&mut self, pattern: &str, phase: i32) {
        self.push_formatted(format_args!("{} {} d\n", pattern, phase));
    }

    /// Move to position (m operator)
    ///
    /// # Arguments
    ///
    /// * `x` - X coordinate
    /// * `y` - Y coordinate
    fn move_to(&mut self, x: f64, y: f64) {
        self.push_formatted(format_args!("{} {} m\n", x, y));
    }

    /// Line to position (l operator)
    ///
    /// # Arguments
    ///
    /// * `x` - X coordinate
    /// * `y` - Y coordinate
    fn line_to(&mut self, x: f64, y: f64) {
        self.push_formatted(format_args!("{} {} l\n", x, y));
    }

    /// Stroke path (S operator)
    fn stroke(&mut self) {
        self.push_operator("S\n");
    }

    /// Fill path (f operator)
    fn fill(&mut self) {
        self.push_operator("f\n");
    }

    /// Draw rectangle (re operator)
    ///
    /// # Arguments
    ///
    /// * `x` - X coordinate of lower-left corner
    /// * `y` - Y coordinate of lower-left corner
    /// * `width` - Rectangle width
    /// * `height` - Rectangle height
    fn rectangle(&mut self, x: f64, y: f64, width: f64, height: f64) {
        self.push_formatted(format_args!("{} {} {} {} re\n", x, y, width, height));
    }

    /// Draw Bézier curve (c operator)
    ///
    /// # Arguments
    ///
    /// * `x1`, `y1` - First control point
    /// * `x2`, `y2` - Second control point
    /// * `x3`, `y3` - End point
    fn curve_to(&mut self, x1: f64, y1: f64, x2: f64, y2: f64, x3: f64, y3: f64) {
        self.push_formatted(format_args!(
            "{} {} {} {} {} {} c\n",
            x1, y1, x2, y2, x3, y3
        ));
    }
}

/// Implementation of ContentBuilder for String
///
/// This is the production implementation that builds actual PDF content streams.
impl ContentBuilder for String {
    fn push_operator(&mut self, op: &str) {
        self.push_str(op);
    }

    fn push_formatted(&mut self, fmt_args: std::fmt::Arguments<'_>) {
        use std::fmt::Write;
        let _ = write!(self, "{}", fmt_args);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_string_push_operator() {
        let mut content = String::new();
        content.push_operator("BT\n");
        content.push_operator("ET\n");
        assert_eq!(content, "BT\nET\n");
    }

    #[test]
    fn test_string_begin_end_text() {
        let mut content = String::new();
        content.begin_text();
        content.end_text();
        assert_eq!(content, "BT\nET\n");
    }

    #[test]
    fn test_string_set_font() {
        let mut content = String::new();
        content.set_font("Helvetica", 12.0);
        assert_eq!(content, "/Helvetica 12 Tf\n");
    }

    #[test]
    fn test_string_set_text_position() {
        let mut content = String::new();
        content.set_text_position(100.0, 200.0);
        assert_eq!(content, "100 200 Td\n");
    }

    #[test]
    fn test_string_show_text_hex() {
        let mut content = String::new();
        content.show_text_hex("0048656C6C6F");
        assert_eq!(content, "<0048656C6C6F> Tj\n");
    }

    #[test]
    fn test_string_set_fill_color() {
        let mut content = String::new();
        content.set_fill_color_rgb(1.0, 0.0, 0.0);
        assert_eq!(content, "1 0 0 rg\n");
    }

    #[test]
    fn test_string_set_stroke_color() {
        let mut content = String::new();
        content.set_stroke_color_rgb(0.0, 1.0, 0.0);
        assert_eq!(content, "0 1 0 RG\n");
    }

    #[test]
    fn test_string_set_line_width() {
        let mut content = String::new();
        content.set_line_width(2.5);
        assert_eq!(content, "2.5 w\n");
    }

    #[test]
    fn test_string_set_dash_pattern() {
        let mut content = String::new();
        content.set_dash_pattern("[3 2]", 0);
        assert_eq!(content, "[3 2] 0 d\n");
    }

    #[test]
    fn test_string_move_to() {
        let mut content = String::new();
        content.move_to(50.0, 75.0);
        assert_eq!(content, "50 75 m\n");
    }

    #[test]
    fn test_string_line_to() {
        let mut content = String::new();
        content.line_to(100.0, 150.0);
        assert_eq!(content, "100 150 l\n");
    }

    #[test]
    fn test_string_stroke() {
        let mut content = String::new();
        content.stroke();
        assert_eq!(content, "S\n");
    }

    #[test]
    fn test_string_fill() {
        let mut content = String::new();
        content.fill();
        assert_eq!(content, "f\n");
    }

    #[test]
    fn test_string_rectangle() {
        let mut content = String::new();
        content.rectangle(10.0, 20.0, 100.0, 50.0);
        assert_eq!(content, "10 20 100 50 re\n");
    }

    #[test]
    fn test_string_curve_to() {
        let mut content = String::new();
        content.curve_to(1.0, 2.0, 3.0, 4.0, 5.0, 6.0);
        assert_eq!(content, "1 2 3 4 5 6 c\n");
    }

    #[test]
    fn test_complete_text_rendering_workflow() {
        let mut content = String::new();
        content.set_fill_color_rgb(0.0, 0.0, 0.0);
        content.begin_text();
        content.set_font("Helvetica", 12.0);
        content.set_text_position(100.0, 700.0);
        content.show_text_hex("48656C6C6F");
        content.end_text();

        assert!(content.contains("0 0 0 rg"));
        assert!(content.contains("BT"));
        assert!(content.contains("/Helvetica 12 Tf"));
        assert!(content.contains("100 700 Td"));
        assert!(content.contains("<48656C6C6F> Tj"));
        assert!(content.contains("ET"));
    }
}
