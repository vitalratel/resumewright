// ABOUTME: View tests for the converting state — progress bar, cancel button.
// ABOUTME: Uses lustre/dev/query to assert structure without a real DOM.

import app/model
import gleeunit/should
import lustre/dev/query
import view/converting

fn test_file() {
  model.ImportedFile(name: "resume.tsx", size: 1024, content: "")
}

pub fn converting_renders_progress_bar_test() {
  converting.view(test_file(), model.Progress("Parsing", 30, "Parsing TSX"))
  |> query.find(matching: query.element(query.attribute("role", "progressbar")))
  |> should.be_ok
}

pub fn converting_shows_percentage_test() {
  converting.view(test_file(), model.Progress("Parsing", 42, "Parsing TSX"))
  |> query.find(matching: query.element(query.text("42%")))
  |> should.be_ok
}

pub fn converting_shows_filename_test() {
  converting.view(test_file(), model.Progress("", 0, ""))
  |> query.find(matching: query.element(query.text("resume.tsx")))
  |> should.be_ok
}

pub fn converting_has_cancel_button_test() {
  converting.view(test_file(), model.Progress("", 0, ""))
  |> query.find(matching: query.element(query.text("Cancel")))
  |> should.be_ok
}
