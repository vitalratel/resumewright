//! URL/Website extraction
//!
//! Responsible for detecting and extracting URLs/websites from text.

/// Extract website/URL from text using regex.
///
/// # Supported Formats
///
/// - Full URLs: `https://example.com`, `http://example.org/path`
/// - Short URLs: `www.example.com`, `www.example.com/path`
/// - Domain-only: `example.com`, `github.io`, `company.co`
///
/// # Limitations
///
/// - **Limited TLD support** - Only detects: .com, .org, .net, .io, .dev, .co
/// - **Misses newer TLDs** - Does not detect .app, .tech, .ai, .xyz, etc.
/// - **Misses country TLDs** - Does not detect .uk, .ca, .au, .de, etc.
/// - **No URL validation** - Does not verify URL structure or reachability
/// - **Trailing punctuation** - Strips trailing non-alphanumeric chars (may remove valid paths)
///
/// This is intentionally conservative to avoid false positives. For comprehensive
/// URL detection, consider using a dedicated URL parsing library.
///
/// # Returns
///
/// First URL-like pattern found, or `None` if no valid pattern detected.
/// Skips domain matches that are part of email addresses.
pub fn extract_website_from_text(text: &str) -> Option<String> {
    for m in regex_utils::URL.find_iter(text) {
        let start = m.start();
        let url = m
            .as_str()
            .trim_end_matches(|c: char| !c.is_alphanumeric() && c != '/')
            .to_string();

        // Skip if this match is preceded by @ (part of email address)
        if start > 0 {
            let prev_char = text[..start].chars().last();
            if prev_char == Some('@') {
                continue;
            }
        }

        return Some(url);
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_website_full_url() {
        let text = "Visit https://example.com for more info";
        let result = extract_website_from_text(text);
        assert_eq!(result, Some("https://example.com".to_string()));
    }

    #[test]
    fn test_extract_website_www_format() {
        let text = "Check out www.portfolio.com";
        let result = extract_website_from_text(text);
        assert_eq!(result, Some("www.portfolio.com".to_string()));
    }

    #[test]
    fn test_extract_website_domain_only() {
        let text = "Portfolio: github.io/username";
        let result = extract_website_from_text(text);
        assert_eq!(result, Some("github.io/username".to_string()));
    }

    #[test]
    fn test_extract_website_with_path() {
        let text = "Website: https://example.com/portfolio/projects";
        let result = extract_website_from_text(text);
        assert_eq!(
            result,
            Some("https://example.com/portfolio/projects".to_string())
        );
    }

    #[test]
    fn test_extract_website_strips_trailing_punctuation() {
        let text = "Visit example.com.";
        let result = extract_website_from_text(text);
        assert_eq!(result, Some("example.com".to_string()));
    }

    #[test]
    fn test_extract_website_no_match() {
        let text = "No website available";
        let result = extract_website_from_text(text);
        assert_eq!(result, None);
    }

    #[test]
    fn test_extract_website_empty_string() {
        let result = extract_website_from_text("");
        assert_eq!(result, None);
    }

    #[test]
    fn test_extract_website_skips_email_domain() {
        // Should skip example.com because it's part of email, and find johndoe.com
        let text = "Contact: john@example.com Website: johndoe.com";
        let result = extract_website_from_text(text);
        assert_eq!(result, Some("johndoe.com".to_string()));
    }

    #[test]
    fn test_extract_website_email_only() {
        // Should return None when only email domain exists
        let text = "Email me at john@example.com";
        let result = extract_website_from_text(text);
        assert_eq!(result, None);
    }
}
