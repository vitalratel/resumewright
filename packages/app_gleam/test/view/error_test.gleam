// ABOUTME: View tests for the error state — error message, suggestions, action buttons.
// ABOUTME: Uses lustre/dev/query to assert structure without a real DOM.

import app/model
import gleam/option.{None, Some}
import gleeunit/should
import lustre/dev/query
import shared/types.{ConversionError}
import view/error as error_view

fn test_error() {
  ConversionError(
    code: "PDF_GENERATION_FAILED",
    message: "Something went wrong",
    suggestions: ["Try again"],
    recoverable: True,
    technical_details: None,
  )
}

fn test_file() {
  model.ImportedFile(name: "resume.tsx", size: 1024, content: "")
}

pub fn error_shows_message_test() {
  error_view.view(test_error(), None)
  |> query.find(matching: query.element(query.text("Something went wrong")))
  |> should.be_ok
}

pub fn error_shows_suggestion_test() {
  error_view.view(test_error(), None)
  |> query.find(matching: query.element(query.text("Try again")))
  |> should.be_ok
}

pub fn error_shows_import_different_button_test() {
  error_view.view(test_error(), None)
  |> query.find(matching: query.element(query.text("Import Different")))
  |> should.be_ok
}

pub fn error_shows_retry_when_file_present_test() {
  error_view.view(test_error(), Some(test_file()))
  |> query.find(matching: query.element(query.text("Retry")))
  |> should.be_ok
}

pub fn error_hides_retry_when_no_file_test() {
  error_view.view(test_error(), None)
  |> query.find(matching: query.element(
    query.text("Retry") |> query.and(query.attribute("hidden", "")),
  ))
  |> should.be_ok
}
