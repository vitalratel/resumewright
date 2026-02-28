// ABOUTME: Unit tests for client-side TSX file validation logic.
// ABOUTME: Tests extension, size, MIME type, and content checks in isolation.

import app/validation
import gleeunit/should

// ---------------------------------------------------------------------------
// Extension checks
// ---------------------------------------------------------------------------

pub fn extension_tsx_accepted_test() {
  validation.check_extension("resume.tsx")
  |> should.be_ok
}

pub fn extension_ts_accepted_test() {
  validation.check_extension("component.ts")
  |> should.be_ok
}

pub fn extension_jsx_accepted_test() {
  validation.check_extension("App.jsx")
  |> should.be_ok
}

pub fn extension_js_accepted_test() {
  validation.check_extension("index.js")
  |> should.be_ok
}

pub fn extension_pdf_rejected_test() {
  validation.check_extension("resume.pdf")
  |> should.be_error
}

pub fn extension_docx_rejected_test() {
  validation.check_extension("cv.docx")
  |> should.be_error
}

pub fn extension_no_extension_rejected_test() {
  validation.check_extension("noextension")
  |> should.be_error
}

// ---------------------------------------------------------------------------
// Size checks
// ---------------------------------------------------------------------------

pub fn size_small_file_ok_test() {
  validation.check_size(1024)
  |> should.be_ok
}

pub fn size_max_allowed_ok_test() {
  validation.check_size(1_048_576)
  |> should.be_ok
}

pub fn size_over_limit_error_test() {
  validation.check_size(1_048_577)
  |> should.be_error
}

pub fn size_zero_error_test() {
  validation.check_size(0)
  |> should.be_error
}

// ---------------------------------------------------------------------------
// MIME type checks
// ---------------------------------------------------------------------------

pub fn mime_text_plain_ok_test() {
  validation.check_mime("text/plain")
  |> should.be_ok
}

pub fn mime_empty_ok_test() {
  validation.check_mime("")
  |> should.be_ok
}

pub fn mime_typescript_ok_test() {
  validation.check_mime("text/typescript")
  |> should.be_ok
}

pub fn mime_image_rejected_test() {
  validation.check_mime("image/png")
  |> should.be_error
}

pub fn mime_pdf_rejected_test() {
  validation.check_mime("application/pdf")
  |> should.be_error
}

// ---------------------------------------------------------------------------
// Content checks
// ---------------------------------------------------------------------------

pub fn content_empty_error_test() {
  validation.check_content("")
  |> should.be_error
}

pub fn content_whitespace_only_error_test() {
  validation.check_content("   \n\t  ")
  |> should.be_error
}

pub fn content_valid_react_tsx_ok_test() {
  let content =
    "import React from 'react'\nexport default function CV() { return <div>Hello</div> }"
  validation.check_content(content)
  |> should.be_ok
}

pub fn content_missing_react_import_error_test() {
  let content = "export default function CV() { return <div>Hello</div> }"
  validation.check_content(content)
  |> should.be_error
}

pub fn content_react_double_quote_import_ok_test() {
  let content =
    "import React from \"react\"\nexport default function CV() { return <div /> }"
  validation.check_content(content)
  |> should.be_ok
}

pub fn content_has_jsx_with_react_ok_test() {
  let content = "import React from 'react'\nconst x = <div>test</div>"
  validation.check_content(content)
  |> should.be_ok
}
