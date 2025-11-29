//! Character width tables for Standard 14 PDF fonts
//!
//! These tables provide normalized character widths (relative to font size)
//! for accurate text measurement in PDF rendering.

/// Get normalized character width for a given character and font family.
///
/// # Arguments
/// * `ch` - The character to measure
/// * `font_name` - PDF font name (e.g., "Helvetica", "Times-Roman", "Courier-Bold")
///
/// # Returns
/// Normalized width as a ratio of font size (e.g., 0.56 means 56% of font size)
pub fn get_char_width(ch: char, font_name: &str) -> f64 {
    if font_name.starts_with("Courier") {
        courier_width(ch)
    } else if font_name.starts_with("Times") {
        times_width(ch)
    } else {
        // Helvetica (and default for unknown fonts like Google Fonts)
        helvetica_width(ch)
    }
}

/// Courier character widths (monospaced font)
///
/// All characters have the same width in Courier.
fn courier_width(_ch: char) -> f64 {
    0.60
}

/// Times-Roman character widths (proportional serif font)
///
/// Based on Adobe Font Metrics for Times-Roman.
fn times_width(ch: char) -> f64 {
    match ch {
        // Narrow characters
        'i' | 'j' | 'l' | '!' | '|' | '.' | ',' | ':' | ';' | '\'' => 0.25,
        'I' | 'f' | 't' | 'r' => 0.35,

        // Medium-narrow characters
        ' ' => 0.25,
        'c' | 's' | 'z' => 0.44,
        'J' => 0.33,

        // Average width characters (most lowercase)
        'a' | 'b' | 'd' | 'e' | 'g' | 'h' | 'k' | 'n' | 'o' | 'p' | 'q' | 'u' | 'v' | 'x' | 'y' => {
            0.50
        }

        // Wide lowercase
        'm' => 0.83,
        'w' => 0.72,

        // Average uppercase
        'A' | 'B' | 'E' | 'F' | 'K' | 'L' | 'P' | 'R' | 'S' | 'T' | 'X' | 'Y' | 'Z' => 0.67,
        'C' | 'D' | 'G' | 'H' | 'N' | 'O' | 'Q' | 'U' | 'V' => 0.72,

        // Wide uppercase
        'M' | 'W' => 0.89,

        // Numbers (proportional in Times)
        '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' => 0.50,

        // Common punctuation
        '-' => 0.33,
        '(' | ')' | '[' | ']' | '{' | '}' => 0.33,
        '/' | '\\' => 0.28,
        '+' | '=' => 0.56,
        '<' | '>' => 0.56,
        '@' => 0.83,
        '#' | '$' | '%' | '&' | '*' => 0.50,

        // Default for other characters
        _ => 0.50,
    }
}

/// Helvetica character widths (proportional sans-serif font)
///
/// Based on Adobe Font Metrics for Helvetica.
/// Also used as fallback for unknown fonts (e.g., embedded Google Fonts).
fn helvetica_width(ch: char) -> f64 {
    match ch {
        // Narrow characters
        'i' | 'j' | 'l' | '!' | '|' | '.' | ',' | ':' | ';' | '\'' => 0.28,
        'I' | 'f' | 't' | 'r' => 0.33,

        // Space (narrow)
        ' ' => 0.28,

        // Medium-narrow characters
        'c' | 's' | 'z' | 'J' => 0.50,

        // Average width characters (most lowercase)
        'a' | 'b' | 'd' | 'e' | 'g' | 'h' | 'k' | 'n' | 'o' | 'p' | 'q' | 'u' | 'v' | 'x' | 'y' => {
            0.56
        }

        // Wide lowercase
        'm' | 'w' => 0.83,

        // Average uppercase
        'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'K' | 'L' | 'N' | 'O' | 'P' | 'Q' | 'R'
        | 'S' | 'T' | 'U' | 'V' | 'X' | 'Y' | 'Z' => 0.67,

        // Wide uppercase
        'M' | 'W' => 0.83,

        // Numbers
        '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' => 0.56,

        // Common punctuation
        '-' | '(' | ')' | '[' | ']' | '{' | '}' => 0.33,
        '/' | '\\' => 0.28,
        '+' | '=' | '<' | '>' => 0.58,
        '@' | '#' | '$' | '%' | '&' | '*' => 0.67,

        // Default for other characters
        _ => 0.56,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_courier_is_monospaced() {
        let narrow = get_char_width('i', "Courier");
        let wide = get_char_width('W', "Courier");
        assert_eq!(narrow, wide);
        assert_eq!(narrow, 0.60);
    }

    #[test]
    fn test_helvetica_is_proportional() {
        let narrow = get_char_width('i', "Helvetica");
        let wide = get_char_width('W', "Helvetica");
        assert!(wide > narrow);
    }

    #[test]
    fn test_times_is_proportional() {
        let narrow = get_char_width('i', "Times-Roman");
        let wide = get_char_width('M', "Times-Roman");
        assert!(wide > narrow);
    }

    #[test]
    fn test_unknown_font_uses_helvetica() {
        let width_unknown = get_char_width('a', "Roboto-Regular");
        let width_helvetica = get_char_width('a', "Helvetica");
        assert_eq!(width_unknown, width_helvetica);
    }
}
