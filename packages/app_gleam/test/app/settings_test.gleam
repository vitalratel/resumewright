// ABOUTME: Tests for settings Msg transitions — page size, margins, theme, reset, load.
// ABOUTME: Covers PageSizeChanged, MarginChanged, ThemeChanged, Reset*, SettingsLoaded.

import app/model.{type Model, Model}
import app/update
import gleeunit/should
import shared/types.{
  ConversionConfig, Letter, Margin, Settings as SharedSettings,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

fn default_settings() {
  SharedSettings(
    theme: types.Auto,
    default_config: default_config(),
    settings_version: 1,
    last_updated: 0,
  )
}

fn initial_model() {
  model.initial(default_settings(), "0.2.0")
}

fn do_update(m: Model, msg: model.Msg) -> Model {
  let #(new_model, _) = update.update(m, msg)
  new_model
}

// ---------------------------------------------------------------------------
// Page size
// ---------------------------------------------------------------------------

pub fn page_size_changed_updates_settings_test() {
  initial_model()
  |> do_update(model.PageSizeChanged("A4"))
  |> fn(m) { m.settings.default_config.page_size }
  |> should.equal(types.A4)
}

pub fn page_size_unknown_is_ignored_test() {
  let m = initial_model()
  do_update(m, model.PageSizeChanged("A3"))
  |> fn(new_m) { new_m.settings.default_config.page_size }
  |> should.equal(m.settings.default_config.page_size)
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

pub fn theme_light_updates_settings_test() {
  initial_model()
  |> do_update(model.ThemeChanged("light"))
  |> fn(m) { m.settings.theme }
  |> should.equal(types.Light)
}

pub fn theme_dark_updates_settings_test() {
  initial_model()
  |> do_update(model.ThemeChanged("dark"))
  |> fn(m) { m.settings.theme }
  |> should.equal(types.Dark)
}

pub fn theme_auto_updates_settings_test() {
  Model(
    ..initial_model(),
    settings: SharedSettings(..default_settings(), theme: types.Light),
  )
  |> do_update(model.ThemeChanged("auto"))
  |> fn(m) { m.settings.theme }
  |> should.equal(types.Auto)
}

pub fn theme_unknown_is_ignored_test() {
  let m = initial_model()
  do_update(m, model.ThemeChanged("sepia"))
  |> fn(new_m) { new_m.settings.theme }
  |> should.equal(m.settings.theme)
}

// ---------------------------------------------------------------------------
// Margins
// ---------------------------------------------------------------------------

pub fn margin_top_changed_test() {
  initial_model()
  |> do_update(model.MarginChanged("top", 0.75))
  |> fn(m) { m.settings.default_config.margin.top }
  |> should.equal(0.75)
}

pub fn margin_left_changed_test() {
  initial_model()
  |> do_update(model.MarginChanged("left", 1.0))
  |> fn(m) { m.settings.default_config.margin.left }
  |> should.equal(1.0)
}

pub fn margin_unknown_side_is_noop_test() {
  let m = initial_model()
  do_update(m, model.MarginChanged("diagonal", 1.0))
  |> fn(new_m) { new_m.settings.default_config.margin }
  |> should.equal(m.settings.default_config.margin)
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

pub fn reset_requested_shows_confirm_test() {
  initial_model()
  |> do_update(model.ResetRequested)
  |> fn(m) { m.reset_confirm }
  |> should.be_true
}

pub fn reset_cancelled_hides_confirm_test() {
  Model(..initial_model(), reset_confirm: True)
  |> do_update(model.ResetCancelled)
  |> fn(m) { m.reset_confirm }
  |> should.be_false
}

pub fn reset_confirmed_restores_defaults_test() {
  let custom =
    SharedSettings(
      ..default_settings(),
      theme: types.Dark,
      default_config: ConversionConfig(..default_config(), page_size: types.A4),
    )
  Model(..initial_model(), settings: custom, reset_confirm: True)
  |> do_update(model.ResetConfirmed)
  |> fn(m) {
    m.settings.theme == types.Auto
    && m.settings.default_config.page_size == Letter
  }
  |> should.be_true
}

pub fn reset_confirmed_hides_confirm_dialog_test() {
  Model(..initial_model(), reset_confirm: True)
  |> do_update(model.ResetConfirmed)
  |> fn(m) { m.reset_confirm }
  |> should.be_false
}

// ---------------------------------------------------------------------------
// Settings loaded
// ---------------------------------------------------------------------------

pub fn settings_loaded_updates_model_test() {
  let new_settings = SharedSettings(..default_settings(), theme: types.Dark)
  initial_model()
  |> do_update(model.SettingsLoaded(new_settings))
  |> fn(m) { m.settings.theme }
  |> should.equal(types.Dark)
}
