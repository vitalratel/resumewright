//! WASM-compatible regex patterns
//!
//! Centralizes all regex patterns used across the codebase, using ASCII-only
//! character classes to avoid the unicode-perl feature (~200KB WASM savings).

use once_cell::sync::Lazy;
use regex::Regex;

// =============================================================================
// Phone Number Patterns
// =============================================================================

/// US/Canada phone: (555) 123-4567, +1-555-123-4567, 555.123.4567
pub static PHONE_US_CANADA: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(\+1[-. \t]?)?\(?[0-9]{3}\)?[-. \t]?[0-9]{3}[-. \t]?[0-9]{4}")
        .expect("US/Canada phone regex should be valid")
});

/// UK phone: +44 20 7123 4567, +44 7700 900123
pub static PHONE_UK: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\+44[- \t]?[0-9]{2,4}[- \t]?[0-9]{3,4}[- \t]?[0-9]{4}")
        .expect("UK phone regex should be valid")
});

/// Germany phone: +49 30 12345678, +49 151 12345678
pub static PHONE_GERMANY: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\+49[-. \t]?[0-9]{2,4}[-. \t]?[0-9]{6,9}")
        .expect("Germany phone regex should be valid")
});

/// France phone: +33 1 42 86 82 00
pub static PHONE_FRANCE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r"\+33[-. \t]?[0-9]{1}[-. \t]?[0-9]{2}[-. \t]?[0-9]{2}[-. \t]?[0-9]{2}[-. \t]?[0-9]{2}",
    )
    .expect("France phone regex should be valid")
});

/// India phone: +91 98765 43210
pub static PHONE_INDIA: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\+91[- \t]?[0-9]{2,5}[- \t]?[0-9]{4,5}[- \t]?[0-9]{4}")
        .expect("India phone regex should be valid")
});

/// China phone: +86 138 0013 8000
pub static PHONE_CHINA: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\+86[- \t]?[0-9]{2,3}[- \t]?[0-9]{4}[- \t]?[0-9]{4}")
        .expect("China phone regex should be valid")
});

/// E.164 format: +[1-9] followed by 1-14 digits
pub static PHONE_E164: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"\+[1-9][0-9]{1,14}").expect("E.164 phone regex should be valid"));

/// Generic international: +CountryCode followed by digits with separators
pub static PHONE_INTERNATIONAL: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\+[0-9]{1,3}[-. \t]?(?:[0-9][-. \t]?){6,14}[0-9]")
        .expect("Generic international phone regex should be valid")
});

/// All phone patterns in priority order (country-specific first, then generic)
pub static PHONE_PATTERNS: Lazy<Vec<&'static Regex>> = Lazy::new(|| {
    vec![
        &*PHONE_US_CANADA,
        &*PHONE_UK,
        &*PHONE_GERMANY,
        &*PHONE_FRANCE,
        &*PHONE_INDIA,
        &*PHONE_CHINA,
        &*PHONE_E164,
        &*PHONE_INTERNATIONAL,
    ]
});

// =============================================================================
// Email Pattern
// =============================================================================

/// Email pattern for extraction (validated separately with email-address crate)
pub static EMAIL: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?-u:\b)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?-u:\b)")
        .expect("Email pattern regex should be valid")
});

// =============================================================================
// Location Pattern
// =============================================================================

/// Location: "City, State" or "City, Country"
pub static LOCATION: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?-u:\b)([A-Z][a-z]+([ ]+[A-Z][a-z]+)*),[ ]*([A-Z]{2}|[A-Z][a-z]+)(?-u:\b)")
        .expect("Location regex should be valid")
});

// =============================================================================
// URL Pattern
// =============================================================================

/// URL/website pattern
/// Note: Uses [^ \t\n\r] instead of [^\s] for WASM compatibility
pub static URL: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"https?://[^ \t\n\r]+|www\.[^ \t\n\r]+|[a-zA-Z0-9-]+\.(com|org|net|io|dev|co)(/[^ \t\n\r]*)?")
        .expect("URL regex should be valid")
});

// =============================================================================
// CSS Patterns
// =============================================================================

/// Font-family CSS property
pub static FONT_FAMILY: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"font-family[ \t]*:[ \t]*([^;]+)").expect("Font family regex should be valid")
});

// =============================================================================
// Date/Experience Patterns (for ATS analysis)
// =============================================================================

// Month abbreviations pattern (case-insensitive without unicode-case feature)
const MONTH_PATTERN: &str = "[Jj][Aa][Nn]|[Ff][Ee][Bb]|[Mm][Aa][Rr]|[Aa][Pp][Rr]|[Mm][Aa][Yy]|[Jj][Uu][Nn]|[Jj][Uu][Ll]|[Aa][Uu][Gg]|[Ss][Ee][Pp]|[Oo][Cc][Tt]|[Nn][Oo][Vv]|[Dd][Ee][Cc]";

/// Month name dates: "Jan 2020 - Dec 2023", "May 2023 – Present"
pub static DATE_MONTH_NAME: Lazy<Regex> = Lazy::new(|| {
    let pattern = format!(
        r"(?:{MONTH})[a-zA-Z]*[ \t]+[0-9]{{4}}[ \t]*[-–—][ \t]*(?:(?:{MONTH})[a-zA-Z]*[ \t]+[0-9]{{4}}|[Pp][Rr][Ee][Ss][Ee][Nn][Tt]|[Cc][Uu][Rr][Rr][Ee][Nn][Tt])",
        MONTH = MONTH_PATTERN
    );
    Regex::new(&pattern).expect("Month name date regex should be valid")
});

/// Numeric dates: "1/2020 - 5/2023", "01/2020 - Present"
pub static DATE_NUMERIC: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?-u:\b)[0-9]{1,2}/[0-9]{4}[ \t]*[-–—][ \t]*(?:[0-9]{1,2}/[0-9]{4}|[Pp][Rr][Ee][Ss][Ee][Nn][Tt]|[Cc][Uu][Rr][Rr][Ee][Nn][Tt])")
        .expect("Numeric date regex should be valid")
});

/// ISO dates: "2020-01 - 2023-05"
pub static DATE_ISO: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?-u:\b)[0-9]{4}-[0-9]{2}[ \t]*[-–—][ \t]*(?:[0-9]{4}-[0-9]{2}|[Pp][Rr][Ee][Ss][Ee][Nn][Tt]|[Cc][Uu][Rr][Rr][Ee][Nn][Tt])")
        .expect("ISO date regex should be valid")
});

/// Year ranges: "2018-2020", "2020 - Present"
pub static DATE_YEAR_RANGE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?-u:\b)[0-9]{4}[ \t]*[-–—][ \t]*(?:[0-9]{4}|[Pp][Rr][Ee][Ss][Ee][Nn][Tt]|[Cc][Uu][Rr][Rr][Ee][Nn][Tt])(?-u:\b)")
        .expect("Year range regex should be valid")
});

// =============================================================================
// Education Patterns (for ATS analysis)
// =============================================================================

/// Traditional degrees: Bachelor, Master, PhD, BS, MS, MBA, etc.
pub static DEGREE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r"(?-u:\b)([Bb][Aa][Cc][Hh][Ee][Ll][Oo][Rr]|[Mm][Aa][Ss][Tt][Ee][Rr]|[Pp][Hh][Dd]|[Dd][Oo][Cc][Tt][Oo][Rr][Aa][Tt][Ee]|[Bb][Ss](?-u:\b)|[Mm][Ss](?-u:\b)|[Mm][Bb][Aa]|[Bb][Aa](?-u:\b)|[Mm][Aa](?-u:\b)|[Aa][Ss][Ss][Oo][Cc][Ii][Aa][Tt][Ee])"
    ).expect("Degree regex should be valid")
});

/// High school education
pub static HIGH_SCHOOL: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r"(?-u:\b)([Hh][Ii][Gg][Hh][ \t]+[Ss][Cc][Hh][Oo][Oo][Ll](?:[ \t]+[Dd][Ii][Pp][Ll][Oo][Mm][Aa])?|[Gg][Ee][Dd](?-u:\b)|[Ss][Ee][Cc][Oo][Nn][Dd][Aa][Rr][Yy][ \t]+(?:[Ee][Dd][Uu][Cc][Aa][Tt][Ii][Oo][Nn]|[Ss][Cc][Hh][Oo][Oo][Ll]))"
    ).expect("High school regex should be valid")
});

/// Certificates and certifications
pub static CERTIFICATE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?-u:\b)([Cc][Ee][Rr][Tt][Ii][Ff][Ii][Cc][Aa][Tt][Ee]|[Cc][Ee][Rr][Tt][Ii][Ff][Ii][Cc][Aa][Tt][Ii][Oo][Nn]|[Dd][Ii][Pp][Ll][Oo][Mm][Aa])(?:[ \t]+(?:[Ii][Nn]|[Oo][Ff]|[Ff][Rr][Oo][Mm]))(?-u:\b)")
        .expect("Certificate regex should be valid")
});

/// Vocational/trade qualifications
pub static VOCATIONAL: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?-u:\b)([Tt][Rr][Aa][Dd][Ee][ \t]+[Ss][Cc][Hh][Oo][Oo][Ll]|[Vv][Oo][Cc][Aa][Tt][Ii][Oo][Nn][Aa][Ll][ \t]+(?:[Tt][Rr][Aa][Ii][Nn][Ii][Nn][Gg]|[Ee][Dd][Uu][Cc][Aa][Tt][Ii][Oo][Nn])|[Aa][Pp][Pp][Rr][Ee][Nn][Tt][Ii][Cc][Ee][Ss][Hh][Ii][Pp])")
        .expect("Vocational regex should be valid")
});

/// Education section heading
pub static EDUCATION_SECTION: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r"(?-u:\b)([Ee][Dd][Uu][Cc][Aa][Tt][Ii][Oo][Nn]|[Aa][Cc][Aa][Dd][Ee][Mm][Ii][Cc][ \t]+[Bb][Aa][Cc][Kk][Gg][Rr][Oo][Uu][Nn][Dd]|[Qq][Uu][Aa][Ll][Ii][Ff][Ii][Cc][Aa][Tt][Ii][Oo][Nn][Ss]|[Aa][Cc][Aa][Dd][Ee][Mm][Ii][Cc][ \t]+[Qq][Uu][Aa][Ll][Ii][Ff][Ii][Cc][Aa][Tt][Ii][Oo][Nn][Ss])(?-u:\b)"
    ).expect("Education section regex should be valid")
});

// =============================================================================
// Skills Patterns (for ATS analysis)
// =============================================================================

/// Skills section heading
pub static SKILLS_SECTION: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r"(?-u:\b)([Tt][Ee][Cc][Hh][Nn][Ii][Cc][Aa][Ll][ \t]+[Ss][Kk][Ii][Ll][Ll][Ss]?|[Ss][Kk][Ii][Ll][Ll][Ss]?|[Cc][Oo][Mm][Pp][Ee][Tt][Ee][Nn][Cc](?:[Yy]|[Ii][Ee][Ss])|[Tt][Ee][Cc][Hh][ \t]+[Ss][Tt][Aa][Cc][Kk]|[Cc][Oo][Rr][Ee][ \t]+[Cc][Oo][Mm][Pp][Ee][Tt][Ee][Nn][Cc](?:[Yy]|[Ii][Ee][Ss])|[Tt][Ee][Cc][Hh][Nn][Oo][Ll][Oo][Gg][Ii][Ee][Ss])"
    ).expect("Skills section regex should be valid")
});

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_phone_us_canada() {
        assert!(PHONE_US_CANADA.is_match("(555) 123-4567"));
        assert!(PHONE_US_CANADA.is_match("+1-555-123-4567"));
        assert!(PHONE_US_CANADA.is_match("555.123.4567"));
    }

    #[test]
    fn test_email() {
        assert!(EMAIL.is_match("test@example.com"));
        assert!(EMAIL.is_match("user.name+tag@domain.org"));
    }

    #[test]
    fn test_location() {
        assert!(LOCATION.is_match("San Francisco, CA"));
        assert!(LOCATION.is_match("New York, NY"));
        assert!(LOCATION.is_match("London, UK"));
    }

    #[test]
    fn test_date_patterns() {
        assert!(DATE_MONTH_NAME.is_match("Jan 2020 - Dec 2023"));
        assert!(DATE_MONTH_NAME.is_match("May 2023 – Present"));
        assert!(DATE_NUMERIC.is_match("01/2020 - 05/2023"));
        assert!(DATE_ISO.is_match("2020-01 - 2023-05"));
        assert!(DATE_YEAR_RANGE.is_match("2018-2020"));
    }

    #[test]
    fn test_degree_patterns() {
        assert!(DEGREE.is_match("Bachelor of Science"));
        assert!(DEGREE.is_match("Master's Degree"));
        assert!(DEGREE.is_match("PhD in Computer Science"));
    }
}
