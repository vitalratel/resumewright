//! Helper utility functions

/// Convert camelCase to kebab-case
/// Examples: fontSize -> font-size, backgroundColor -> background-color
pub fn camel_to_kebab(s: &str) -> String {
    // Pre-allocate capacity: input length + estimated uppercase letters
    let uppercase_count = s.chars().filter(|c| c.is_uppercase()).count();
    let mut result = String::with_capacity(s.len() + uppercase_count);

    for c in s.chars() {
        if c.is_uppercase() {
            if !result.is_empty() {
                result.push('-');
            }
            result.push(c.to_ascii_lowercase());
        } else {
            result.push(c);
        }
    }

    result
}
