// ABOUTME: View tests for the importing state — drop zone, validation error, browse button.
// ABOUTME: Uses lustre/dev/query to assert structure without a real DOM.

import gleam/option.{None, Some}
import gleeunit/should
import lustre/dev/query
import view/importing

// ---------------------------------------------------------------------------
// Drop zone present
// ---------------------------------------------------------------------------

pub fn importing_renders_drop_zone_test() {
  importing.view(None, False)
  |> query.find(matching: query.element(query.attribute("role", "region")))
  |> should.be_ok
}

// ---------------------------------------------------------------------------
// Validation error
// ---------------------------------------------------------------------------

pub fn importing_no_error_hides_error_div_test() {
  importing.view(None, False)
  |> query.find(matching: query.element(
    query.id("validation-error") |> query.and(query.attribute("hidden", "")),
  ))
  |> should.be_ok
}

pub fn importing_with_error_shows_error_div_test() {
  importing.view(Some("Bad file"), False)
  |> query.find(matching: query.element(query.id("validation-error")))
  |> should.be_ok
}

pub fn importing_error_text_is_rendered_test() {
  importing.view(Some("Bad file"), False)
  |> query.find(matching: query.element(query.text("Bad file")))
  |> should.be_ok
}

// ---------------------------------------------------------------------------
// File input
// ---------------------------------------------------------------------------

pub fn importing_renders_file_input_test() {
  importing.view(None, False)
  |> query.find(matching: query.element(
    query.tag("input") |> query.and(query.attribute("type", "file")),
  ))
  |> should.be_ok
}
