// ABOUTME: Tests for the margins settings view — preview renders, values reflected in HTML.
// ABOUTME: Verifies that different margin values produce different rendered output.

import gleam/string
import gleeunit/should
import lustre/element
import shared/types.{
  type Settings, Auto, ConversionConfig, Letter, Margin,
  Settings as SharedSettings,
}
import view/settings/margins

fn default_config() {
  ConversionConfig(
    page_size: Letter,
    margin: Margin(top: 0.5, right: 0.5, bottom: 0.5, left: 0.5),
    font_size: 11,
    font_family: "Helvetica",
    compress: True,
    ats_optimization: False,
    include_metadata: True,
  )
}

fn default_settings() -> Settings {
  SharedSettings(
    theme: Auto,
    default_config: default_config(),
    settings_version: 1,
    last_updated: 0,
  )
}

// ---------------------------------------------------------------------------
// Preview reflects margin values
// ---------------------------------------------------------------------------

pub fn margins_preview_changes_with_different_margins_test() {
  let narrow =
    SharedSettings(
      ..default_settings(),
      default_config: ConversionConfig(
        ..default_config(),
        margin: Margin(top: 0.25, right: 0.25, bottom: 0.25, left: 0.25),
      ),
    )
  let wide =
    SharedSettings(
      ..default_settings(),
      default_config: ConversionConfig(
        ..default_config(),
        margin: Margin(top: 1.5, right: 1.5, bottom: 1.5, left: 1.5),
      ),
    )

  let html_narrow = element.to_string(margins.view(narrow))
  let html_wide = element.to_string(margins.view(wide))

  should.not_equal(html_narrow, html_wide)
}

pub fn margins_top_label_reflects_value_test() {
  let settings =
    SharedSettings(
      ..default_settings(),
      default_config: ConversionConfig(
        ..default_config(),
        margin: Margin(top: 1.0, right: 0.25, bottom: 0.25, left: 0.25),
      ),
    )

  margins.view(settings)
  |> element.to_string
  |> string.contains("1.00")
  |> should.be_true
}
