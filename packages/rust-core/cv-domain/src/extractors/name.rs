//! Name extraction from CV elements
//!
//! Responsible for detecting and extracting person names from JSX elements.

use tsx_parser::{extract_text_content, JSXElement};

// Heuristic thresholds for name detection

/// Maximum reasonable length for a person's name in characters
const MAX_NAME_LENGTH: usize = 100;

/// Minimum word count for a valid name (allows single names)
const MIN_NAME_WORDS: usize = 1;

/// Maximum word count for a valid name (includes suffixes like Jr., III, PhD)
const MAX_NAME_WORDS: usize = 6;

/// Minimum ratio of name-like characters (alphabetic + ' - .) to total characters
/// Set to 0.85 to reduce false positives while supporting Unicode names
const NAME_CHAR_RATIO: f32 = 0.85;

/// Extract name from the first heading element or large-font div
pub fn extract_name_from_elements(elements: &[&JSXElement]) -> Option<String> {
    // First pass: look for h1/h2 tags (traditional approach)
    for element in elements {
        let tag = tsx_parser::extract_element_name(element);
        if tag == "h1" || tag == "h2" {
            let texts = extract_text_content(element);
            if let Some(text) = texts.first() {
                let trimmed = text.trim();
                if !trimmed.is_empty() && trimmed.len() < MAX_NAME_LENGTH {
                    return Some(trimmed.to_string());
                }
            }
        }
    }

    // Second pass: if no h1/h2 found, look for div with style attribute
    // This handles modern templates that use styled divs instead of semantic headings
    for element in elements {
        let tag = tsx_parser::extract_element_name(element);
        if tag == "div" {
            let texts = extract_text_content(element);
            if let Some(text) = texts.first() {
                let trimmed = text.trim();
                // Check if this looks like a name (short, mostly letters)
                // and has a style attribute (indicating it's likely styled large)
                if !trimmed.is_empty()
                    && trimmed.len() < MAX_NAME_LENGTH
                    && looks_like_name(trimmed)
                    && has_style_attribute(element)
                {
                    return Some(trimmed.to_string());
                }
            }
        }
    }

    None
}

/// Check if text looks like a person's name (heuristic).
///
/// Supports:
/// - International names with Unicode characters (José, García, O'Brien)
/// - Suffixes (Jr., III, PhD, Esq.)
/// - Hyphenated names (Mary-Jane, Smith-Jones)
/// - Names with apostrophes (O'Connor, D'Angelo)
/// - 1-6 words (covers most names including suffixes)
///
/// # Limitations
///
/// - May not detect single-word names in some edge cases
/// - Assumes Western name format (may need adjustment for other cultures)
fn looks_like_name(text: &str) -> bool {
    let word_count = text.split_whitespace().count();

    // Check word count is within valid range
    if !(MIN_NAME_WORDS..=MAX_NAME_WORDS).contains(&word_count) {
        return false;
    }

    // Count alphabetic + common name characters (', -, .)
    // This supports Unicode alphabetic chars (accented letters, non-Latin scripts)
    let name_chars = text
        .chars()
        .filter(|c| c.is_alphabetic() || matches!(c, '\'' | '-' | '.' | ' '))
        .count();

    let total_chars = text.chars().count();

    // Check ratio of name-like characters
    total_chars > 0 && (name_chars as f32 / total_chars as f32) >= NAME_CHAR_RATIO
}

/// Check if element has a style attribute
fn has_style_attribute(element: &JSXElement) -> bool {
    use tsx_parser::{JSXAttributeItem, JSXAttributeName};

    for attr in &element.opening_element.attributes {
        if let JSXAttributeItem::Attribute(jsx_attr) = attr {
            if let JSXAttributeName::Identifier(ident) = &jsx_attr.name {
                if ident.name.as_str() == "style" {
                    return true;
                }
            }
        }
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_looks_like_name_valid_names() {
        // Arrange: Various valid name formats
        let valid_names = vec![
            "John Doe",
            "Mary Jane Smith",
            "José García",
            "O'Brien",
            "Mary-Jane",
            "John Doe Jr.",
        ];

        for name in valid_names {
            // Act & Assert
            assert!(looks_like_name(name), "Should accept valid name: {}", name);
        }
    }

    #[test]
    fn test_looks_like_name_invalid_names() {
        // Arrange: Invalid name patterns
        let invalid_names = vec![
            "123 Main Street", // Too many numbers (low name char ratio < 0.85)
            "Product Manager position with 10 years experience", // Too many words (>6)
        ];

        for name in invalid_names {
            // Act & Assert
            assert!(
                !looks_like_name(name),
                "Should reject invalid name: {}",
                name
            );
        }
    }

    #[test]
    fn test_looks_like_name_single_letter() {
        // Single letter names are technically valid in some cultures (e.g., "A")
        // The function allows them (MIN_NAME_WORDS = 1)
        assert!(looks_like_name("A"));
    }
}
