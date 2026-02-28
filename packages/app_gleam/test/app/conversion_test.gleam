// ABOUTME: Tests for conversion flow Msg transitions — progress, complete, error, retry, countdown.
// ABOUTME: Covers Converting/Success/Errored state transitions.

import app/model.{
  type Model, Converting, Errored, ImportedFile, Importing, Model, Progress,
  Success,
}
import app/update
import gleam/option.{None, Some}
import gleeunit/should
import shared/types.{
  ConversionConfig, ConversionError, Letter, Margin, Settings as SharedSettings,
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

fn test_error() {
  ConversionError(
    code: "PDF_GENERATION_FAILED",
    message: "Something went wrong",
    suggestions: ["Try again"],
    recoverable: True,
    technical_details: None,
  )
}

fn in_converting() {
  Model(
    ..initial_model(),
    converter_state: Converting(test_file(), Progress("", 0, "")),
  )
}

// ---------------------------------------------------------------------------
// Converting state
// ---------------------------------------------------------------------------

pub fn cancel_from_converting_returns_to_importing_test() {
  in_converting()
  |> do_update(model.CancelClicked)
  |> fn(m) { m.converter_state }
  |> should.equal(Importing(validation_error: None, drag_over: False))
}

pub fn got_progress_updates_percentage_test() {
  in_converting()
  |> do_update(model.GotProgress("Parsing TSX", 30, "Parsing"))
  |> fn(m) {
    case m.converter_state {
      Converting(_, p) -> p.percentage == 30
      _ -> False
    }
  }
  |> should.be_true
}

pub fn got_progress_ignored_outside_converting_test() {
  let m = initial_model()
  do_update(m, model.GotProgress("Parsing TSX", 30, "Parsing"))
  |> fn(new_m) { new_m.converter_state }
  |> should.equal(m.converter_state)
}

pub fn got_complete_transitions_to_success_test() {
  in_converting()
  |> do_update(model.GotComplete(
    "John_Doe_Resume_2024-01-01.pdf",
    204_800,
    1500,
  ))
  |> fn(m) {
    case m.converter_state {
      Success("John_Doe_Resume_2024-01-01.pdf", 204_800, 1500, 20, False) ->
        True
      _ -> False
    }
  }
  |> should.be_true
}

pub fn got_error_transitions_to_errored_test() {
  let err = test_error()
  in_converting()
  |> do_update(model.GotError(err))
  |> fn(m) {
    case m.converter_state {
      Errored(e, Some(_)) -> e.code == err.code
      _ -> False
    }
  }
  |> should.be_true
}

// ---------------------------------------------------------------------------
// Success / countdown
// ---------------------------------------------------------------------------

pub fn countdown_tick_decrements_test() {
  Model(
    ..initial_model(),
    converter_state: Success("file.pdf", 1000, 2000, 15, False),
  )
  |> do_update(model.CountdownTick)
  |> fn(m) {
    case m.converter_state {
      Success(_, _, _, 14, False) -> True
      _ -> False
    }
  }
  |> should.be_true
}

pub fn countdown_tick_paused_does_not_decrement_test() {
  Model(
    ..initial_model(),
    converter_state: Success("file.pdf", 1000, 2000, 15, True),
  )
  |> do_update(model.CountdownTick)
  |> fn(m) {
    case m.converter_state {
      Success(_, _, _, 15, True) -> True
      _ -> False
    }
  }
  |> should.be_true
}

pub fn pause_countdown_toggles_paused_test() {
  Model(
    ..initial_model(),
    converter_state: Success("file.pdf", 1000, 2000, 10, False),
  )
  |> do_update(model.PauseCountdownClicked)
  |> fn(m) {
    case m.converter_state {
      Success(_, _, _, 10, True) -> True
      _ -> False
    }
  }
  |> should.be_true
}

pub fn resume_countdown_toggles_paused_test() {
  Model(
    ..initial_model(),
    converter_state: Success("file.pdf", 1000, 2000, 10, True),
  )
  |> do_update(model.PauseCountdownClicked)
  |> fn(m) {
    case m.converter_state {
      Success(_, _, _, 10, False) -> True
      _ -> False
    }
  }
  |> should.be_true
}

pub fn convert_another_returns_to_importing_test() {
  Model(
    ..initial_model(),
    converter_state: Success("file.pdf", 1000, 2000, 5, False),
  )
  |> do_update(model.ConvertAnotherClicked)
  |> fn(m) { m.converter_state }
  |> should.equal(Importing(validation_error: None, drag_over: False))
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

pub fn import_different_returns_to_importing_test() {
  Model(
    ..initial_model(),
    converter_state: Errored(test_error(), Some(test_file())),
  )
  |> do_update(model.ImportDifferentClicked)
  |> fn(m) { m.converter_state }
  |> should.equal(Importing(validation_error: None, drag_over: False))
}

pub fn retry_from_recoverable_error_transitions_to_converting_test() {
  let file = test_file()
  Model(..initial_model(), converter_state: Errored(test_error(), Some(file)))
  |> do_update(model.RetryClicked)
  |> fn(m) {
    case m.converter_state {
      Converting(f, _) -> f == file
      _ -> False
    }
  }
  |> should.be_true
}

pub fn retry_without_file_stays_in_importing_test() {
  Model(..initial_model(), converter_state: Errored(test_error(), None))
  |> do_update(model.RetryClicked)
  |> fn(m) {
    case m.converter_state {
      Importing(_, _) -> True
      _ -> False
    }
  }
  |> should.be_true
}
