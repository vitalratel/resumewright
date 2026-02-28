// ABOUTME: View tests for the ready state — file card, export button, settings summary.
// ABOUTME: Uses lustre/dev/query to assert structure without a real DOM.

import app/model
import gleeunit/should
import lustre/dev/query
import shared/types.{ConversionConfig, Letter, Margin}
import view/ready

fn test_file() {
  model.ImportedFile(name: "resume.tsx", size: 1024, content: "")
}

fn test_settings() {
  types.Settings(
    theme: types.Auto,
    default_config: ConversionConfig(
      page_size: Letter,
      margin: Margin(top: 0.5, right: 0.5, bottom: 0.5, left: 0.5),
      font_size: 11,
      font_family: "Helvetica",
      compress: True,
      ats_optimization: False,
      include_metadata: True,
    ),
    settings_version: 1,
    last_updated: 0,
  )
}

// ---------------------------------------------------------------------------
// File info
// ---------------------------------------------------------------------------

pub fn ready_shows_filename_test() {
  ready.view(test_file(), test_settings())
  |> query.find(matching: query.element(query.text("resume.tsx")))
  |> should.be_ok
}

// ---------------------------------------------------------------------------
// Export button
// ---------------------------------------------------------------------------

pub fn ready_has_export_button_test() {
  ready.view(test_file(), test_settings())
  |> query.find(
    matching: query.element(query.attribute("data-testid", "export-button")),
  )
  |> should.be_ok
}
