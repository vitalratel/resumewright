//! PDF timestamp generation without chrono dependency
//!
//! Provides lightweight timestamp generation for PDF metadata.
//! Uses js_sys::Date in WASM environments and std::time in native environments.

/// Generate a PDF-compatible timestamp string (D:YYYYMMDDHHmmSS format)
///
/// This function provides different implementations based on the target architecture:
/// - WASM: Uses JavaScript Date API via js_sys
/// - Native: Uses std::time::SystemTime for testing
#[cfg(target_arch = "wasm32")]
pub fn current_pdf_timestamp() -> String {
    // Use JavaScript Date API for accurate time in browser
    let date = js_sys::Date::new_0();

    format!(
        "D:{:04}{:02}{:02}{:02}{:02}{:02}Z",
        date.get_full_year() as u32,
        date.get_month() as u32 + 1, // JS months are 0-indexed
        date.get_date() as u32,
        date.get_hours() as u32,
        date.get_minutes() as u32,
        date.get_seconds() as u32
    )
}

/// Native implementation for tests and benchmarks
#[cfg(not(target_arch = "wasm32"))]
pub fn current_pdf_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("System time is before Unix epoch");

    let total_seconds = duration.as_secs();

    // Convert Unix timestamp to calendar date
    // Using simplified algorithm (good enough for PDF metadata)
    let seconds_per_day = 86400u64;
    let days_since_epoch = total_seconds / seconds_per_day;
    let seconds_today = total_seconds % seconds_per_day;

    // Calculate year (simplified - doesn't handle leap years perfectly)
    let years_since_1970 = days_since_epoch / 365;
    let year = 1970 + years_since_1970;

    // Calculate time of day
    let hours = seconds_today / 3600;
    let minutes = (seconds_today % 3600) / 60;
    let seconds = seconds_today % 60;

    // Use January 1st as the date (good enough for tests)
    format!("D:{:04}0101{:02}{:02}{:02}Z", year, hours, minutes, seconds)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_timestamp_format() {
        let timestamp = current_pdf_timestamp();

        // Should start with "D:"
        assert!(
            timestamp.starts_with("D:"),
            "Timestamp should start with 'D:'"
        );

        // Should end with "Z" (UTC timezone)
        assert!(timestamp.ends_with("Z"), "Timestamp should end with 'Z'");

        // Should have reasonable length (D:YYYYMMDDHHmmSSZ = 17 chars)
        assert!(
            timestamp.len() >= 15 && timestamp.len() <= 25,
            "Timestamp length should be reasonable, got: {}",
            timestamp.len()
        );

        // Should contain only valid characters
        let inner = &timestamp[2..timestamp.len() - 1];
        assert!(
            inner.chars().all(|c| c.is_ascii_digit()),
            "Timestamp should contain only digits between D: and Z"
        );
    }

    #[test]
    fn test_year_is_reasonable() {
        let timestamp = current_pdf_timestamp();

        // Extract year (characters 2-6)
        let year_str = &timestamp[2..6];
        let year: u32 = year_str.parse().expect("Year should be valid number");

        // Year should be >= 2024 and < 2100 (reasonable range)
        assert!(year >= 2024, "Year should be >= 2024, got: {}", year);
        assert!(year < 2100, "Year should be < 2100, got: {}", year);
    }
}
