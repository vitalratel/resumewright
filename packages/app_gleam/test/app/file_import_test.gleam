// ABOUTME: Tests for file import Msg transitions — file read, TSX validation, ready state.
// ABOUTME: Covers FileReadComplete, TsxValidationResult, FileCleared, ExportClicked.

import app/model.{
  type Model, Converting, ImportedFile, Importing, Model, Ready,
}
import app/update
import gleeunit/should
import gleam/option.{None, Some}
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

fn test_file() {
  ImportedFile(
    name: "resume.tsx",
    size: 1024,
    content: "import React from 'react'\nexport default function CV() { return <div /> }",
  )
}

// ---------------------------------------------------------------------------
// File read results
// ---------------------------------------------------------------------------

pub fn file_read_error_shows_validation_error_test() {
  initial_model()
  |> do_update(model.FileReadComplete(Error("read failed"), "resume.tsx", 100))
  |> fn(m) { m.converter_state }
  |> should.equal(Importing(
    validation_error: Some("read failed"),
    drag_over: False,
  ))
}

pub fn file_read_ok_stores_pending_file_test() {
  let content =
    "import React from 'react'\nexport default function CV() { return <div /> }"
  initial_model()
  |> do_update(model.FileReadComplete(Ok(content), "resume.tsx", 512))
  |> fn(m) { m.pending_file }
  |> should.equal(Some(ImportedFile("resume.tsx", 512, content)))
}

// ---------------------------------------------------------------------------
// TSX validation
// ---------------------------------------------------------------------------

pub fn tsx_validation_true_transitions_to_ready_test() {
  let file = test_file()
  Model(..initial_model(), pending_file: Some(file))
  |> do_update(model.TsxValidationResult(True))
  |> fn(m) { m.converter_state }
  |> should.equal(Ready(file))
}

pub fn tsx_validation_true_clears_pending_file_test() {
  Model(..initial_model(), pending_file: Some(test_file()))
  |> do_update(model.TsxValidationResult(True))
  |> fn(m) { m.pending_file }
  |> should.equal(None)
}

pub fn tsx_validation_false_shows_error_test() {
  Model(..initial_model(), pending_file: Some(test_file()))
  |> do_update(model.TsxValidationResult(False))
  |> fn(m) {
    case m.converter_state {
      Importing(Some(_), False) -> True
      _ -> False
    }
  }
  |> should.be_true
}

pub fn tsx_validation_false_clears_pending_file_test() {
  Model(..initial_model(), pending_file: Some(test_file()))
  |> do_update(model.TsxValidationResult(False))
  |> fn(m) { m.pending_file }
  |> should.equal(None)
}

pub fn tsx_validation_no_pending_file_is_noop_test() {
  let m = initial_model()
  do_update(m, model.TsxValidationResult(True))
  |> fn(new_m) { new_m.converter_state }
  |> should.equal(m.converter_state)
}

// ---------------------------------------------------------------------------
// Ready state
// ---------------------------------------------------------------------------

pub fn file_cleared_from_ready_test() {
  Model(..initial_model(), converter_state: Ready(test_file()))
  |> do_update(model.FileCleared)
  |> fn(m) { m.converter_state }
  |> should.equal(Importing(validation_error: None, drag_over: False))
}

pub fn export_clicked_transitions_to_converting_test() {
  Model(..initial_model(), converter_state: Ready(test_file()))
  |> do_update(model.ExportClicked)
  |> fn(m) {
    case m.converter_state {
      Converting(_, _) -> True
      _ -> False
    }
  }
  |> should.be_true
}

pub fn export_clicked_preserves_file_test() {
  let file = test_file()
  Model(..initial_model(), converter_state: Ready(file))
  |> do_update(model.ExportClicked)
  |> fn(m) {
    case m.converter_state {
      Converting(f, _) -> f == file
      _ -> False
    }
  }
  |> should.be_true
}

pub fn export_clicked_initialises_empty_progress_test() {
  Model(..initial_model(), converter_state: Ready(test_file()))
  |> do_update(model.ExportClicked)
  |> fn(m) {
    case m.converter_state {
      Converting(_, p) -> p.percentage == 0
      _ -> False
    }
  }
  |> should.be_true
}
