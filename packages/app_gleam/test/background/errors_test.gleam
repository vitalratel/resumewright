// ABOUTME: Tests for error code classification and ConversionError construction.
// ABOUTME: Covers all error code patterns, recoverability, and suggestion presence.

import background/errors
import shared/types.{ConversionError}

// ---------------------------------------------------------------------------
// Error code classification
// ---------------------------------------------------------------------------

pub fn classify_parse_test() {
  let err = errors.from_message("parse error at line 10")
  assert err.code == "TSX_PARSE_ERROR"
}

pub fn classify_syntax_test() {
  let err = errors.from_message("syntax error: unexpected token")
  assert err.code == "TSX_PARSE_ERROR"
}

pub fn classify_wasm_test() {
  let err = errors.from_message("WASM execution failed")
  assert err.code == "WASM_EXECUTION_ERROR"
}

pub fn classify_webassembly_test() {
  let err = errors.from_message("WebAssembly.instantiate failed")
  assert err.code == "WASM_EXECUTION_ERROR"
}

pub fn classify_memory_test() {
  let err = errors.from_message("memory limit exceeded")
  assert err.code == "MEMORY_LIMIT_EXCEEDED"
}

pub fn classify_heap_test() {
  let err = errors.from_message("heap out of space")
  assert err.code == "MEMORY_LIMIT_EXCEEDED"
}

pub fn classify_timeout_test() {
  let err = errors.from_message("operation timeout after 20s")
  assert err.code == "CONVERSION_TIMEOUT"
}

pub fn classify_font_test() {
  let err = errors.from_message("font load failed: Roboto not found")
  assert err.code == "FONT_LOAD_ERROR"
}

pub fn classify_layout_test() {
  let err = errors.from_message("layout overflow detected")
  assert err.code == "PDF_LAYOUT_ERROR"
}

pub fn classify_unknown_test() {
  let err = errors.from_message("something completely unexpected")
  assert err.code == "PDF_GENERATION_FAILED"
}

// ---------------------------------------------------------------------------
// Recoverability
// ---------------------------------------------------------------------------

pub fn parse_error_is_recoverable_test() {
  let err = errors.from_message("parse error")
  assert err.recoverable == True
}

pub fn wasm_error_is_recoverable_test() {
  let err = errors.from_message("WASM failed")
  assert err.recoverable == True
}

pub fn memory_error_is_not_recoverable_test() {
  let err = errors.from_message("memory overflow")
  assert err.recoverable == False
}

pub fn timeout_error_is_recoverable_test() {
  let err = errors.from_message("timeout")
  assert err.recoverable == True
}

// ---------------------------------------------------------------------------
// Error structure
// ---------------------------------------------------------------------------

pub fn error_has_message_test() {
  let err = errors.from_message("parse error")
  assert err.message != ""
}

pub fn error_has_suggestions_test() {
  let err = errors.from_message("parse error")
  assert err.suggestions != []
}

pub fn error_code_matches_test() {
  let err = errors.from_message("font missing")
  assert err.code == "FONT_LOAD_ERROR"
}

// ---------------------------------------------------------------------------
// Struct equality
// ---------------------------------------------------------------------------

pub fn error_is_conversion_error_test() {
  let err = errors.from_message("parse error")
  let ConversionError(code: c, ..) = err
  assert c == "TSX_PARSE_ERROR"
}
