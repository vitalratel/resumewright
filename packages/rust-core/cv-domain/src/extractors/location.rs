//! Location extraction
//!
//! Responsible for detecting and extracting location information from text.

/// Extract location from text using regex.
///
/// Looks for patterns like `"City, State"` or `"City, Country"`.
pub fn extract_location_from_text(text: &str) -> Option<String> {
    regex_utils::LOCATION
        .find(text)
        .map(|m| m.as_str().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_location_city_state() {
        let text = "Location: San Francisco, CA";
        let result = extract_location_from_text(text);
        assert_eq!(result, Some("San Francisco, CA".to_string()));
    }

    #[test]
    fn test_extract_location_city_country() {
        let text = "Based in London, UK";
        let result = extract_location_from_text(text);
        assert_eq!(result, Some("London, UK".to_string()));
    }

    #[test]
    fn test_extract_location_with_state_full() {
        let text = "Living in Austin, Texas";
        let result = extract_location_from_text(text);
        assert_eq!(result, Some("Austin, Texas".to_string()));
    }

    #[test]
    fn test_extract_location_no_match() {
        let text = "No location information available";
        let result = extract_location_from_text(text);
        assert_eq!(result, None);
    }

    #[test]
    fn test_extract_location_empty_string() {
        let result = extract_location_from_text("");
        assert_eq!(result, None);
    }
}
