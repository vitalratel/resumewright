// ABOUTME: Tests for PDF filename generation and sanitization.
// ABOUTME: Covers name sanitization rules, None fallback, and date formatting.

import background/filename
import gleam/option.{None, Some}
import gleam/string

// ---------------------------------------------------------------------------
// generate — full filename with date
// ---------------------------------------------------------------------------

pub fn generate_with_name_test() {
  assert filename.generate(Some("John Doe"), "2025-10-17")
    == "John_Doe_Resume_2025-10-17.pdf"
}

pub fn generate_no_name_test() {
  assert filename.generate(None, "2025-10-17") == "Resume_2025-10-17.pdf"
}

pub fn generate_empty_name_test() {
  assert filename.generate(Some(""), "2025-10-17") == "Resume_2025-10-17.pdf"
}

pub fn generate_whitespace_name_test() {
  assert filename.generate(Some("   "), "2025-10-17") == "Resume_2025-10-17.pdf"
}

pub fn generate_resume_fallback_no_duplication_test() {
  // If sanitize produces "Resume" as the only output, don't write "Resume_Resume_..."
  assert filename.generate(Some("@#$%"), "2025-01-01") == "Resume_2025-01-01.pdf"
}

// ---------------------------------------------------------------------------
// sanitize — individual sanitization rules
// ---------------------------------------------------------------------------

pub fn sanitize_spaces_to_underscores_test() {
  assert filename.sanitize("John Doe") == "John_Doe"
}

pub fn sanitize_multiple_spaces_test() {
  assert filename.sanitize("John  Doe") == "John_Doe"
}

pub fn sanitize_removes_angle_brackets_test() {
  assert filename.sanitize("Resume<Draft>") == "ResumeDraft"
}

pub fn sanitize_removes_colons_test() {
  assert filename.sanitize("Resume: Final") == "Resume_Final"
}

pub fn sanitize_removes_slashes_test() {
  assert filename.sanitize("John/Doe") == "JohnDoe"
}

pub fn sanitize_removes_question_mark_test() {
  assert filename.sanitize("Resume?") == "Resume"
}

pub fn sanitize_trims_leading_underscores_test() {
  assert filename.sanitize("_John") == "John"
}

pub fn sanitize_trims_trailing_underscores_test() {
  assert filename.sanitize("John_") == "John"
}

pub fn sanitize_collapses_multiple_underscores_test() {
  assert filename.sanitize("John__Doe") == "John_Doe"
}

pub fn sanitize_empty_string_fallback_test() {
  assert filename.sanitize("") == "Resume"
}

pub fn sanitize_all_special_chars_fallback_test() {
  assert filename.sanitize("@#$%^&*") == "Resume"
}

pub fn sanitize_preserves_hyphens_test() {
  assert filename.sanitize("Mary-Jane Watson") == "Mary-Jane_Watson"
}

pub fn sanitize_truncates_long_name_test() {
  // 110 character name should be truncated to 100
  let long_name =
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
  let result = filename.sanitize(long_name)
  assert string.length(result) <= 100
}
