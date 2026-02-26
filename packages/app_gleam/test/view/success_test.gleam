// ABOUTME: View tests for the success state — filename, countdown, action buttons.
// ABOUTME: Uses lustre/dev/query to assert structure without a real DOM.

import gleeunit/should
import lustre/dev/query
import view/success

pub fn success_shows_filename_test() {
  success.view("John_Doe_Resume.pdf", 204_800, 1500, 20, False)
  |> query.find(matching: query.element(query.text("John_Doe_Resume.pdf")))
  |> should.be_ok
}

pub fn success_shows_countdown_test() {
  success.view("file.pdf", 1000, 500, 15, False)
  |> query.find(matching: query.element(query.text("15")))
  |> should.be_ok
}

pub fn success_shows_convert_another_test() {
  success.view("file.pdf", 1000, 500, 20, False)
  |> query.find(matching: query.element(query.text("Convert another")))
  |> should.be_ok
}

pub fn success_has_pdf_ready_heading_test() {
  success.view("file.pdf", 1000, 500, 20, False)
  |> query.find(matching: query.element(query.text("PDF Ready")))
  |> should.be_ok
}
