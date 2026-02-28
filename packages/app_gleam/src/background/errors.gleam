// ABOUTME: Error code classification and ConversionError construction for background.
// ABOUTME: Maps raw exception messages to user-friendly errors with suggestions.

import gleam/option.{type Option, None}
import gleam/string
import shared/types.{type ConversionError, ConversionError}

/// Builds a ConversionError by classifying the raw error message.
pub fn from_message(raw_message: String) -> ConversionError {
  let code = classify(raw_message)
  details(code, None)
}

/// Builds a ConversionError with a stack trace in technical_details.
pub fn from_message_with_stack(
  raw_message: String,
  stack: String,
) -> ConversionError {
  let code = classify(raw_message)
  let truncated = case string.length(stack) > 500 {
    True -> string.slice(stack, at_index: 0, length: 500)
    False -> stack
  }
  details(code, option.Some(truncated))
}

fn classify(message: String) -> String {
  let lower = string.lowercase(message)
  let is_parse =
    string.contains(lower, "parse") || string.contains(lower, "syntax")
  let is_wasm =
    string.contains(lower, "wasm") || string.contains(lower, "webassembly")
  let is_memory =
    string.contains(lower, "memory") || string.contains(lower, "heap")
  let is_timeout = string.contains(lower, "timeout")
  let is_font = string.contains(lower, "font")
  let is_layout = string.contains(lower, "layout")
  case is_parse, is_wasm, is_memory, is_timeout, is_font, is_layout {
    True, _, _, _, _, _ -> "TSX_PARSE_ERROR"
    _, True, _, _, _, _ -> "WASM_EXECUTION_ERROR"
    _, _, True, _, _, _ -> "MEMORY_LIMIT_EXCEEDED"
    _, _, _, True, _, _ -> "CONVERSION_TIMEOUT"
    _, _, _, _, True, _ -> "FONT_LOAD_ERROR"
    _, _, _, _, _, True -> "PDF_LAYOUT_ERROR"
    _, _, _, _, _, _ -> "PDF_GENERATION_FAILED"
  }
}

fn details(code: String, technical_details: Option(String)) -> ConversionError {
  case code {
    "TSX_PARSE_ERROR" ->
      ConversionError(
        code: "TSX_PARSE_ERROR",
        message: "Invalid CV file format",
        suggestions: [
          "Check the line number below to see where the error is",
          "Ask Claude to regenerate your CV",
          "Copy the CV code again from Claude carefully",
        ],
        recoverable: True,
        technical_details:,
      )
    "WASM_EXECUTION_ERROR" ->
      ConversionError(
        code: "WASM_EXECUTION_ERROR",
        message: "Conversion failed unexpectedly",
        suggestions: [
          "Click \"Try Again\" to retry the conversion",
          "Refresh the page and try again",
          "Contact support if this error keeps appearing",
        ],
        recoverable: True,
        technical_details:,
      )
    "MEMORY_LIMIT_EXCEEDED" ->
      ConversionError(
        code: "MEMORY_LIMIT_EXCEEDED",
        message: "CV file is too large",
        suggestions: [
          "Reduce CV length by removing or shortening sections",
          "Simplify formatting",
          "Close other browser tabs to free up resources",
        ],
        recoverable: False,
        technical_details:,
      )
    "CONVERSION_TIMEOUT" ->
      ConversionError(
        code: "CONVERSION_TIMEOUT",
        message: "Conversion took too long",
        suggestions: [
          "Try a simpler, shorter CV",
          "Remove complex formatting",
          "Close other browser tabs to free up resources",
        ],
        recoverable: True,
        technical_details:,
      )
    "FONT_LOAD_ERROR" ->
      ConversionError(
        code: "FONT_LOAD_ERROR",
        message: "Couldn't load fonts",
        suggestions: [
          "Check your internet connection",
          "Try using a standard font instead of custom fonts",
          "Refresh the page and try again",
        ],
        recoverable: True,
        technical_details:,
      )
    "PDF_LAYOUT_ERROR" ->
      ConversionError(
        code: "PDF_LAYOUT_ERROR",
        message: "We couldn't fit your content on the page",
        suggestions: [
          "Increase the page margins in Settings",
          "Use a larger page size",
          "Reduce the font size in Settings",
        ],
        recoverable: True,
        technical_details:,
      )
    _ ->
      ConversionError(
        code: "PDF_GENERATION_FAILED",
        message: "Couldn't create your PDF",
        suggestions: [
          "Try simplifying your CV by removing some sections",
          "Try a different page size in Settings",
          "Contact support if you need help",
        ],
        recoverable: True,
        technical_details:,
      )
  }
}
