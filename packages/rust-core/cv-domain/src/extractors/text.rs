//! Text collection utilities
//!
//! Responsible for collecting all text content from JSX elements.

use tsx_parser::{extract_text_content, JSXElement};

/// Collect all text content from elements.
///
/// Pre-allocates string capacity to reduce allocations during concatenation.
pub fn collect_all_text(elements: &[&JSXElement]) -> String {
    // Estimate ~100 characters per element average
    // This reduces allocations from ~10+ to typically 1-2 for normal CVs
    let mut all_text = String::with_capacity(elements.len() * 100);

    for element in elements {
        let texts = extract_text_content(element);
        for text in texts {
            all_text.push_str(&text);
            all_text.push(' ');
        }
    }
    all_text
}

#[cfg(test)]
mod tests {
    // No tests currently - collect_all_text is tested indirectly through other extractors
}
