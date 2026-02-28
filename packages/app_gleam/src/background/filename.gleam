// ABOUTME: PDF filename generation from CV metadata — sanitization and date formatting.
// ABOUTME: Produces cross-platform safe filenames: "John_Doe_Resume_YYYY-MM-DD.pdf".

import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string

/// Generates a PDF filename. date must be "YYYY-MM-DD" format.
pub fn generate(name: Option(String), date: String) -> String {
  let safe = case name {
    None -> "Resume"
    Some(n) -> sanitize(n)
  }
  case safe == "Resume" {
    True -> "Resume_" <> date <> ".pdf"
    False -> safe <> "_Resume_" <> date <> ".pdf"
  }
}

/// Sanitizes a name for safe use in a filename.
/// Rules: spaces→underscores, remove forbidden chars, trim/collapse underscores, truncate.
pub fn sanitize(name: String) -> String {
  let trimmed = string.trim(name)
  case string.is_empty(trimmed) {
    True -> "Resume"
    False -> {
      // Replace spaces with underscores
      let s = string.replace(in: trimmed, each: " ", with: "_")
      // Remove forbidden characters — keep only alphanumeric, underscore, hyphen
      let safe_chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-"
      let s =
        s
        |> string.to_graphemes
        |> list.filter(fn(c) { string.contains(safe_chars, c) })
        |> string.concat
      // Remove leading/trailing underscores or hyphens
      let s = string.trim_start(s) |> string.trim_end
      let s = drop_leading_separators(s)
      let s = drop_trailing_separators(s)
      // Collapse multiple underscores
      let s = collapse_underscores(s)
      // Truncate to 100 characters
      let s = case string.length(s) > 100 {
        True -> string.slice(s, at_index: 0, length: 100)
        False -> s
      }
      case string.is_empty(s) {
        True -> "Resume"
        False -> s
      }
    }
  }
}

fn drop_leading_separators(s: String) -> String {
  case s {
    "" -> ""
    _ ->
      case string.starts_with(s, "_") || string.starts_with(s, "-") {
        True -> drop_leading_separators(string.drop_start(s, 1))
        False -> s
      }
  }
}

fn drop_trailing_separators(s: String) -> String {
  case s {
    "" -> ""
    _ ->
      case string.ends_with(s, "_") || string.ends_with(s, "-") {
        True -> drop_trailing_separators(string.drop_end(s, 1))
        False -> s
      }
  }
}

fn collapse_underscores(s: String) -> String {
  case string.contains(s, "__") {
    False -> s
    True -> collapse_underscores(string.replace(in: s, each: "__", with: "_"))
  }
}
