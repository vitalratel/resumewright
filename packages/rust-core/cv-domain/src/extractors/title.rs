//! Job title extraction from CV elements
//!
//! Responsible for detecting and extracting professional titles/headlines from JSX elements.

use tsx_parser::{extract_element_name, extract_text_content, JSXElement};

/// Maximum reasonable length for a job title in characters
const MAX_TITLE_LENGTH: usize = 80;

/// Minimum length for a valid job title
const MIN_TITLE_LENGTH: usize = 3;

/// Maximum word count for a job title
const MAX_TITLE_WORDS: usize = 8;

/// Extract job title from elements following the name heading.
///
/// The title is typically found in:
/// 1. The first `<p>` tag after an `<h1>` or `<h2>` containing the name
/// 2. A styled `<div>` or `<span>` immediately after the name
///
/// # Arguments
/// * `elements` - Slice of JSX elements to search
/// * `name` - The extracted name (used to skip the name element)
///
/// # Returns
/// * `Some(String)` - The extracted job title
/// * `None` - If no valid title was found
pub fn extract_title_from_elements(elements: &[&JSXElement], name: Option<&str>) -> Option<String> {
    let mut found_name = name.is_none(); // If no name provided, start looking immediately

    for element in elements {
        let tag = extract_element_name(element);
        let texts = extract_text_content(element);
        let text = texts.first().map(|s| s.trim()).unwrap_or("");

        // Skip empty elements
        if text.is_empty() {
            continue;
        }

        // Check if this element contains the name - if so, skip it and start looking for title
        if !found_name {
            if let Some(name_str) = name {
                if text.contains(name_str) || name_str.contains(text) {
                    found_name = true;
                    continue;
                }
            }
            // Also mark as found if we see an h1/h2 (likely the name heading)
            if tag == "h1" || tag == "h2" {
                found_name = true;
                continue;
            }
        }

        // After finding the name, look for the title in the next suitable element
        // Title is typically in <p>, <span>, or styled <div>
        if found_name && matches!(tag.as_str(), "p" | "span" | "div") && looks_like_title(text) {
            return Some(text.to_string());
        }
    }

    None
}

/// Check if text looks like a job title (heuristic).
///
/// Valid titles:
/// - "Software Engineer"
/// - "Senior Product Manager"
/// - "Full-Stack Developer | 5+ Years Experience"
/// - "CEO & Founder"
///
/// Invalid (not titles):
/// - Email addresses
/// - Phone numbers
/// - Long paragraphs
/// - Section headings like "Experience" or "Education"
fn looks_like_title(text: &str) -> bool {
    // Length checks
    if text.len() < MIN_TITLE_LENGTH || text.len() > MAX_TITLE_LENGTH {
        return false;
    }

    // Word count check
    let word_count = text.split_whitespace().count();
    if word_count > MAX_TITLE_WORDS {
        return false;
    }

    // Skip if it looks like contact info
    if text.contains('@') || text.contains("http") || text.contains("www.") {
        return false;
    }

    // Skip if it looks like a phone number (mostly digits)
    let digit_count = text.chars().filter(|c| c.is_ascii_digit()).count();
    if digit_count > 5 {
        return false;
    }

    // Skip common section headings
    let lower = text.to_lowercase();
    let section_headings = [
        "experience",
        "education",
        "skills",
        "projects",
        "work history",
        "employment",
        "certifications",
        "awards",
        "publications",
        "references",
        "summary",
        "objective",
        "about me",
        "contact",
    ];
    if section_headings.iter().any(|h| lower == *h) {
        return false;
    }

    // Should have at least some alphabetic characters
    let alpha_count = text.chars().filter(|c| c.is_alphabetic()).count();
    alpha_count >= 3
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_looks_like_title_valid() {
        let valid_titles = [
            "Software Engineer",
            "Senior Product Manager",
            "Full-Stack Developer",
            "CEO & Founder",
            "Data Scientist | ML Engineer",
            "Junior Developer",
            "Développeur Senior", // French
        ];

        for title in valid_titles {
            assert!(looks_like_title(title), "Should accept: {}", title);
        }
    }

    #[test]
    fn test_looks_like_title_invalid() {
        let invalid = [
            "john@example.com",
            "+1-555-123-4567",
            "https://github.com/johndoe",
            "Experience",
            "Education",
            "This is a very long paragraph that describes my work history in great detail and should not be considered a job title",
            "AB", // Too short
        ];

        for text in invalid {
            assert!(!looks_like_title(text), "Should reject: {}", text);
        }
    }
}
