//! Email extraction and validation
//!
//! Responsible for detecting and extracting email addresses from text.

use email_address::EmailAddress;
use std::str::FromStr;

/// Extract email from text using RFC-compliant validation.
///
/// Uses the `email-address` crate for robust RFC 5322 email validation.
/// This handles edge cases better than regex alone, including:
/// - Quoted strings in local part
/// - Comments in email addresses
/// - International domain names
/// - Proper length validation
///
/// Performs additional validation to filter out test/invalid domains.
pub fn extract_email_from_text(text: &str) -> Option<String> {
    // First, try to parse the entire text as an email (for simple cases)
    if let Ok(email) = EmailAddress::from_str(text.trim()) {
        let email_str = email.to_string();
        return if validate_email(&email_str) {
            Some(email_str)
        } else {
            None
        };
    }

    // If that fails, search for email-like patterns in the text
    // This handles cases where email is embedded in sentences
    regex_utils::EMAIL
        .find_iter(text)
        .filter_map(|m| {
            let candidate = m.as_str();
            // Validate using RFC-compliant parser
            EmailAddress::from_str(candidate)
                .ok()
                .map(|e| e.to_string())
        })
        .find(|email| validate_email(email))
}

/// Validate that an extracted email is actually useful.
///
/// Filters out:
/// - Local/test domains (.local, .test, .localhost)
/// - Emails exceeding RFC 5321 length limit (254 chars)
/// - Emails without proper @ separator
fn validate_email(email: &str) -> bool {
    // RFC 5321 maximum email length
    if email.len() > 254 {
        return false;
    }

    // Must contain @ (regex should guarantee this, but double-check)
    if !email.contains('@') {
        return false;
    }

    // Filter out common test/invalid TLDs
    let invalid_tlds = [".local", ".test", ".localhost", ".invalid", ".example"];
    for tld in &invalid_tlds {
        if email.ends_with(tld) {
            return false;
        }
    }

    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_email_basic() {
        // Arrange
        let text = "Contact me at john.doe@example.com";

        // Act
        let result = extract_email_from_text(text);

        // Assert
        assert_eq!(result, Some("john.doe@example.com".to_string()));
    }

    #[test]
    fn test_extract_email_embedded_in_sentence() {
        let text = "You can reach me via email at jane.smith@company.org for inquiries.";
        let result = extract_email_from_text(text);
        assert_eq!(result, Some("jane.smith@company.org".to_string()));
    }

    #[test]
    fn test_extract_email_with_plus() {
        let text = "Send to john+resume@example.com";
        let result = extract_email_from_text(text);
        assert_eq!(result, Some("john+resume@example.com".to_string()));
    }

    #[test]
    fn test_extract_email_subdomain() {
        let text = "Email: user@mail.company.com";
        let result = extract_email_from_text(text);
        assert_eq!(result, Some("user@mail.company.com".to_string()));
    }

    #[test]
    fn test_extract_email_filters_test_domains() {
        // Arrange: Test/invalid domains that should be filtered
        let test_cases = vec![
            "user@example.local",
            "test@localhost.local",
            "foo@bar.test",
            "user@test.invalid",
        ];

        for email in test_cases {
            // Act
            let result = extract_email_from_text(email);

            // Assert
            assert!(result.is_none(), "Should filter out test domain: {}", email);
        }
    }

    #[test]
    fn test_extract_email_no_match() {
        let text = "No email here, just plain text";
        let result = extract_email_from_text(text);
        assert_eq!(result, None);
    }

    #[test]
    fn test_extract_email_empty_string() {
        let result = extract_email_from_text("");
        assert_eq!(result, None);
    }

    #[test]
    fn test_validate_email_rejects_too_long() {
        // Arrange: Email longer than 254 chars (RFC 5321 limit)
        let long_email = format!("{}@example.com", "a".repeat(250));

        // Act & Assert
        assert!(!validate_email(&long_email));
    }

    #[test]
    fn test_validate_email_requires_at_symbol() {
        assert!(!validate_email("notanemail.com"));
    }
}
