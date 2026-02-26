// ABOUTME: Client-side TSX file validation — extension, size, MIME, and content checks.
// ABOUTME: Pure functions; all checks run before the async WASM validation step.

import gleam/list
import gleam/string

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const max_file_size = 1_048_576

// 1 MB

const accepted_extensions = [".tsx", ".ts", ".jsx", ".js"]

const accepted_mimes = [
  "text/plain", "text/typescript", "text/tsx", "application/typescript",
  "application/x-tiled-tsx", "",
]

// ---------------------------------------------------------------------------
// Extension
// ---------------------------------------------------------------------------

pub fn check_extension(filename: String) -> Result(Nil, String) {
  let lower = string.lowercase(filename)
  let accepted =
    list.any(accepted_extensions, fn(ext) { string.ends_with(lower, ext) })
  case accepted {
    True -> Ok(Nil)
    False ->
      Error(
        "This file type isn't supported. Please select your CV file from Claude (it should end in .tsx)",
      )
  }
}

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

pub fn check_size(size: Int) -> Result(Nil, String) {
  case size {
    0 ->
      Error(
        "This file appears to be empty. Please make sure you exported your CV correctly from Claude.",
      )
    s if s > max_file_size ->
      Error(
        "This file is too big. CV files from Claude are usually under 1MB. Try simplifying your CV or exporting it again.",
      )
    _ -> Ok(Nil)
  }
}

// ---------------------------------------------------------------------------
// MIME type
// ---------------------------------------------------------------------------

pub fn check_mime(mime: String) -> Result(Nil, String) {
  case list.contains(accepted_mimes, mime) {
    True -> Ok(Nil)
    False ->
      Error(
        "This doesn't appear to be a valid TSX file. The file type is \""
        <> mime
        <> "\". Please make sure you're selecting the correct file from Claude.",
      )
  }
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

pub fn check_content(content: String) -> Result(Nil, String) {
  case string.is_empty(string.trim(content)) {
    True ->
      Error(
        "This file appears to be empty. Please make sure you exported your CV correctly from Claude.",
      )
    False -> check_react_content(content)
  }
}

fn check_react_content(content: String) -> Result(Nil, String) {
  let has_react =
    string.contains(content, "from 'react'")
    || string.contains(content, "from \"react\"")
  let has_export = string.contains(content, "export default")
  let has_jsx = string.contains(content, "<")

  case has_react && { has_jsx || has_export } {
    False ->
      Error(
        "This file doesn't look like a valid CV from Claude. It should contain React/TSX code. Please make sure you're importing the correct file.",
      )
    True -> Ok(Nil)
  }
}
