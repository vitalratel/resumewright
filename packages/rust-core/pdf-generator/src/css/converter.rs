//! CSS unit conversion module
//!
//! Converts CSS length units to PDF points (72 points = 1 inch).
//! Supports px, pt, em, rem, %, and unitless values.

use crate::css_parser::CSSParseError;

/// Convert CSS length value to PDF points (72 points = 1 inch)
///
/// Supports the following units:
/// - px: pixels (1px = 0.75pt at 96 DPI)
/// - pt: points (1:1 conversion)
/// - em: relative to font size (1em = 10pt default)
/// - rem: relative to root font size (1rem = 10pt default)
/// - %: percentage (converted based on context, default 10pt base)
/// - unitless: treated as pixels
pub fn css_to_points(value: &str) -> Result<f64, CSSParseError> {
    let trimmed = value.trim();

    if trimmed.ends_with("px") {
        let num = trimmed
            .trim_end_matches("px")
            .parse::<f64>()
            .map_err(|_| CSSParseError::InvalidValue(value.to_string()))?;
        Ok(num * 0.75) // 1px = 0.75pt (assuming 96 DPI)
    } else if trimmed.ends_with("pt") {
        let num = trimmed
            .trim_end_matches("pt")
            .parse::<f64>()
            .map_err(|_| CSSParseError::InvalidValue(value.to_string()))?;
        Ok(num)
    } else if trimmed.ends_with("rem") {
        // Check rem before em (since rem ends with em)
        let num = trimmed
            .trim_end_matches("rem")
            .parse::<f64>()
            .map_err(|_| CSSParseError::InvalidValue(value.to_string()))?;
        Ok(num * 10.0) // 1rem = 10pt (default font size)
    } else if trimmed.ends_with("em") {
        let num = trimmed
            .trim_end_matches("em")
            .parse::<f64>()
            .map_err(|_| CSSParseError::InvalidValue(value.to_string()))?;
        Ok(num * 10.0) // 1em = 10pt (default font size)
    } else if trimmed.ends_with('%') {
        let num = trimmed
            .trim_end_matches('%')
            .parse::<f64>()
            .map_err(|_| CSSParseError::InvalidValue(value.to_string()))?;
        Ok(num * 10.0 / 100.0) // Assume 100% = 10pt base
    } else {
        // Assume pixels if no unit
        let num = trimmed
            .parse::<f64>()
            .map_err(|_| CSSParseError::InvalidValue(value.to_string()))?;
        Ok(num * 0.75)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_css_to_points_px() {
        assert_eq!(css_to_points("16px").unwrap(), 12.0);
    }

    #[test]
    fn test_css_to_points_pt() {
        assert_eq!(css_to_points("12pt").unwrap(), 12.0);
    }

    #[test]
    fn test_css_to_points_em() {
        assert_eq!(css_to_points("1.5em").unwrap(), 15.0);
    }

    #[test]
    fn test_css_to_points_rem() {
        assert_eq!(css_to_points("2rem").unwrap(), 20.0);
    }

    #[test]
    fn test_css_to_points_percentage() {
        assert_eq!(css_to_points("50%").unwrap(), 5.0);
    }

    #[test]
    fn test_css_to_points_unitless() {
        assert_eq!(css_to_points("16").unwrap(), 12.0); // Treated as px
    }

    #[test]
    fn test_css_to_points_invalid_px() {
        let result = css_to_points("abcpx");
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            CSSParseError::InvalidValue(_)
        ));
    }

    #[test]
    fn test_css_to_points_invalid_pt() {
        let result = css_to_points("xyzpt");
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            CSSParseError::InvalidValue(_)
        ));
    }

    #[test]
    fn test_css_to_points_invalid_em() {
        let result = css_to_points("invalidem");
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            CSSParseError::InvalidValue(_)
        ));
    }

    #[test]
    fn test_css_to_points_invalid_rem() {
        let result = css_to_points("badrem");
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            CSSParseError::InvalidValue(_)
        ));
    }

    #[test]
    fn test_css_to_points_invalid_percentage() {
        let result = css_to_points("abc%");
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            CSSParseError::InvalidValue(_)
        ));
    }

    #[test]
    fn test_css_to_points_invalid_unitless() {
        let result = css_to_points("notanumber");
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            CSSParseError::InvalidValue(_)
        ));
    }

    #[test]
    fn test_css_to_points_empty_string() {
        let result = css_to_points("");
        assert!(result.is_err());
    }
}
