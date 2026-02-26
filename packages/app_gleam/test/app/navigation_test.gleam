// ABOUTME: Tests for navigation Msg transitions — view switching, help, settings tabs.
// ABOUTME: Covers ShowSettings, ShowMain, OpenHelp, CloseHelp, SwitchTab.

import app/model.{
  type Model, GeneralTab, Importing, Main, Model, PageTab, Settings,
}
import app/update
import gleeunit/should
import gleam/option.{None}
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
// View switching
// ---------------------------------------------------------------------------

pub fn show_settings_test() {
  initial_model()
  |> do_update(model.ShowSettings)
  |> fn(m) { m.view }
  |> should.equal(Settings)
}

pub fn show_main_test() {
  Model(..initial_model(), view: Settings)
  |> do_update(model.ShowMain)
  |> fn(m) { m.view }
  |> should.equal(Main)
}

pub fn show_main_clears_reset_confirm_test() {
  Model(..initial_model(), view: Settings, reset_confirm: True)
  |> do_update(model.ShowMain)
  |> fn(m) { m.reset_confirm }
  |> should.be_false
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

pub fn open_help_test() {
  initial_model()
  |> do_update(model.OpenHelp)
  |> fn(m) { m.help_open }
  |> should.be_true
}

pub fn close_help_test() {
  Model(..initial_model(), help_open: True)
  |> do_update(model.CloseHelp)
  |> fn(m) { m.help_open }
  |> should.be_false
}

// ---------------------------------------------------------------------------
// Settings tabs
// ---------------------------------------------------------------------------

pub fn switch_tab_general_test() {
  initial_model()
  |> do_update(model.SwitchTab(GeneralTab))
  |> fn(m) { m.settings_tab }
  |> should.equal(GeneralTab)
}

pub fn switch_tab_page_test() {
  Model(..initial_model(), settings_tab: GeneralTab)
  |> do_update(model.SwitchTab(PageTab))
  |> fn(m) { m.settings_tab }
  |> should.equal(PageTab)
}

// ---------------------------------------------------------------------------
// Drag-drop UI state (Importing drop-zone visual)
// ---------------------------------------------------------------------------

pub fn dragged_over_sets_flag_test() {
  initial_model()
  |> do_update(model.DraggedOver)
  |> fn(m) { m.converter_state }
  |> should.equal(Importing(validation_error: None, drag_over: True))
}

pub fn drag_left_clears_flag_test() {
  Model(..initial_model(), converter_state: Importing(None, True))
  |> do_update(model.DragLeft)
  |> fn(m) { m.converter_state }
  |> should.equal(Importing(validation_error: None, drag_over: False))
}
