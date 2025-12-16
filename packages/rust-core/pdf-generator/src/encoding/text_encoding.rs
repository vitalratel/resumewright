//! Text encoding utilities for PDF content streams
//!
//! Provides encoding functions for both legacy PDF literal strings and
//! modern CIDFont Type 2 fonts with Identity-H encoding.

/// Escape special characters in PDF strings per PDF specification
///
/// Escapes: backslash, parentheses, newline, carriage return, tab, and control characters
///
/// # Arguments
/// * `s` - The string to escape
///
/// # Returns
/// Escaped string ready for use in PDF literal string operators like `(text) Tj`
///
/// # Note
/// This function is for legacy PDF literal strings only (e.g., Standard 14 fonts).
/// For CIDFont Type 2 fonts (Inter), use [`encode_as_cidfont_hex`] instead.
///
/// # Examples
/// ```
/// use pdf_generator::encoding::escape_pdf_string;
///
/// assert_eq!(escape_pdf_string("Hello"), "Hello");
/// assert_eq!(escape_pdf_string("Hello (world)"), "Hello \\(world\\)");
/// assert_eq!(escape_pdf_string("C:\\path"), "C:\\\\path");
/// ```
pub fn escape_pdf_string(s: &str) -> String {
    s.chars()
        .flat_map(|c| match c {
            '\\' => vec!['\\', '\\'],
            '(' => vec!['\\', '('],
            ')' => vec!['\\', ')'],
            '\n' => vec!['\\', 'n'],
            '\r' => vec!['\\', 'r'],
            '\t' => vec!['\\', 't'],
            c if c.is_control() => {
                // Escape control characters as octal (\ddd)
                format!("\\{:03o}", c as u8).chars().collect()
            }
            c => vec![c],
        })
        .collect()
}

/// Encode text as hex-encoded CIDs for CIDFont Type 2 with Identity-H encoding
///
/// Converts Unicode characters to 2-byte hex CID values as required by CIDFont Type 2
/// fonts (e.g., Inter with Identity-H encoding).
///
/// # Arguments
/// * `text` - The text to encode
///
/// # Returns
/// Hex-encoded string (without angle brackets) ready for use in `<hex> Tj` operators
///
/// # Examples
/// ```
/// use pdf_generator::encoding::encode_as_cidfont_hex;
///
/// let encoded = encode_as_cidfont_hex("John");
/// // Returns: "004A006F0068006E"
/// // Usage in PDF: <004A006F0068006E> Tj
/// assert_eq!(encoded, "004A006F0068006E");
/// ```
///
/// # Technical Background
/// CIDFont Type 2 fonts with Identity-H encoding require each Unicode character
/// to be encoded as a 2-byte (4-hex-digit) CID value. This prevents multi-byte
/// UTF-8 characters from being misinterpreted as invalid high GID values.
///
/// See PDF Reference 1.7, Section 9.7.4 "CIDFonts" for details.
pub fn encode_as_cidfont_hex(text: &str) -> String {
    text.chars()
        .map(|c| format!("{:04X}", c as u32))
        .collect::<String>()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_escape_pdf_string() {
        assert_eq!(escape_pdf_string("Hello"), "Hello");
        assert_eq!(escape_pdf_string("Hello (world)"), "Hello \\(world\\)");
        assert_eq!(escape_pdf_string("C:\\path"), "C:\\\\path");
    }

    #[test]
    fn test_escape_pdf_string_newlines() {
        assert_eq!(escape_pdf_string("Line1\nLine2"), "Line1\\nLine2");
        assert_eq!(escape_pdf_string("Hello\r\nWorld"), "Hello\\r\\nWorld");
    }

    #[test]
    fn test_escape_pdf_string_tabs() {
        assert_eq!(escape_pdf_string("Col1\tCol2"), "Col1\\tCol2");
    }

    #[test]
    fn test_escape_pdf_string_control_chars() {
        // Test bell character (ASCII 7)
        let text_with_bell = format!("Hello{}World", '\x07');
        let escaped = escape_pdf_string(&text_with_bell);
        assert!(escaped.contains("\\007"));
    }

    #[test]
    fn test_encode_as_cidfont_hex_basic() {
        assert_eq!(encode_as_cidfont_hex("A"), "0041");
        assert_eq!(encode_as_cidfont_hex("John"), "004A006F0068006E");
    }

    #[test]
    fn test_encode_as_cidfont_hex_unicode() {
        // Test Unicode character (emoji 🔥 = U+1F525 = 0x1F525)
        // :04X pads to minimum 4 digits, 0x1F525 is already 5 digits so no padding needed
        assert_eq!(encode_as_cidfont_hex("🔥"), "1F525");
    }

    #[test]
    fn test_encode_as_cidfont_hex_special_chars() {
        // Special characters that would need escaping in literal strings
        // ( = 0x28, t = 0x74, e = 0x65, s = 0x73, ) = 0x29
        assert_eq!(encode_as_cidfont_hex("(test)"), "002800740065007300740029");
    }
}
