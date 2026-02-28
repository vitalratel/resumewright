// ABOUTME: Lustre side effects for the converter UI — file I/O, messaging, storage, countdown.
// ABOUTME: All Effect-returning functions; pure state machine logic lives in app/update.

import app/model
import app/validation
import ffi/app as app_ffi
import gleam/dynamic/decode
import gleam/float
import gleam/json
import gleam/option.{None}
import lustre/effect.{type Effect}
import plinth/browser/file.{type File}
import shared/codecs
import shared/types

// ---------------------------------------------------------------------------
// File import
// ---------------------------------------------------------------------------

/// Reads a file after running quick checks (extension, MIME, size).
/// Dispatches FileReadComplete with the text content or a user-facing error.
pub fn read_file(file: File) -> Effect(model.Msg) {
  use dispatch <- effect.from
  let name = app_ffi.file_name(file)
  let size = app_ffi.file_size(file)
  let mime = app_ffi.file_type(file)
  let quick_check =
    validation.check_extension(name)
    |> and_then(fn() { validation.check_mime(mime) })
    |> and_then(fn() { validation.check_size(size) })
  case quick_check {
    Error(msg) -> dispatch(model.FileReadComplete(Error(msg), name, size))
    Ok(Nil) ->
      app_ffi.read_file_as_text(file, fn(result) {
        dispatch(model.FileReadComplete(result, name, size))
      })
  }
}

fn and_then(
  r: Result(Nil, String),
  next: fn() -> Result(Nil, String),
) -> Result(Nil, String) {
  case r {
    Error(e) -> Error(e)
    Ok(Nil) -> next()
  }
}

// ---------------------------------------------------------------------------
// TSX validation
// ---------------------------------------------------------------------------

/// Sends TSX content to the background for WASM validation.
/// Falls back to True (allow through) if the background is unavailable.
pub fn validate_tsx(content: String) -> Effect(model.Msg) {
  use dispatch <- effect.from
  let data_json = "{\"tsx\":" <> app_ffi.json_encode_string(content) <> "}"
  app_ffi.send_message_typed("validateTsx", data_json, fn(response) {
    let valid = case app_ffi.decode_bool_field(response, "valid") {
      Ok(v) -> v
      Error(_) -> True
    }
    dispatch(model.TsxValidationResult(valid))
  })
}

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

/// Sends a startConversion message to the background service worker.
/// The background broadcasts progress/complete/error; register_listener handles those.
pub fn start_conversion(file: model.ImportedFile) -> Effect(model.Msg) {
  use dispatch <- effect.from
  let data_json =
    "{\"tsx\":"
    <> app_ffi.json_encode_string(file.content)
    <> ",\"fileName\":"
    <> app_ffi.json_encode_string(file.name)
    <> "}"
  app_ffi.send_message_typed("startConversion", data_json, fn(response) {
    case app_ffi.decode_bool_field(response, "success") {
      Ok(True) -> Nil
      _ ->
        dispatch(model.GotError(types.ConversionError(
          code: "CONVERSION_START_FAILED",
          message: "We couldn't start converting your CV. This might be a temporary issue.",
          suggestions: ["Try converting again", "Reload the extension and try again"],
          recoverable: True,
          technical_details: None,
        )))
    }
  })
}

// ---------------------------------------------------------------------------
// Countdown
// ---------------------------------------------------------------------------

pub fn start_countdown() -> Effect(model.Msg) {
  use dispatch <- effect.from
  app_ffi.start_countdown(fn() { dispatch(model.CountdownTick) })
}

pub fn close_tab() -> Effect(model.Msg) {
  use _ <- effect.from
  app_ffi.close_tab()
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/// Loads settings from chrome.storage.sync, dispatching SettingsLoaded on success.
pub fn load_settings() -> Effect(model.Msg) {
  use dispatch <- effect.from
  app_ffi.storage_sync_get_string("resumewright-settings", fn(result) {
    case result {
      Ok(json_str) ->
        case codecs.parse_settings(json_str) {
          Ok(settings) -> dispatch(model.SettingsLoaded(settings))
          Error(_) -> Nil
        }
      Error(_) -> Nil
    }
  })
}

pub fn save_settings(settings: types.Settings) -> Effect(model.Msg) {
  use _ <- effect.from
  app_ffi.storage_sync_set_json(
    "resumewright-settings",
    codecs.settings_to_json(settings),
  )
}

pub fn apply_theme(theme_str: String) -> Effect(model.Msg) {
  use _ <- effect.from
  app_ffi.apply_theme(theme_str)
}

/// Sets the margin preview overlay position via CSS custom properties.
/// Uses style.setProperty() to bypass the extension's style-src CSP restriction.
pub fn apply_margin_preview(margin: types.Margin) -> Effect(model.Msg) {
  use _ <- effect.from
  app_ffi.apply_margin_preview(
    margin_to_pct(margin.top),
    margin_to_pct(margin.right),
    margin_to_pct(margin.bottom),
    margin_to_pct(margin.left),
  )
}

/// Sets the progress bar width via a CSS custom property.
/// Uses style.setProperty() to bypass the extension's style-src CSP restriction.
pub fn apply_progress_pct(pct: Int) -> Effect(model.Msg) {
  use _ <- effect.from
  app_ffi.apply_progress_pct(pct)
}

fn margin_to_pct(v: Float) -> String {
  // Map 0.25"–1.5" linearly to 8%–40% for the preview box
  let pct = 8.0 +. { v -. 0.25 } /. 1.25 *. 32.0
  float.to_string(pct) <> "%"
}

// ---------------------------------------------------------------------------
// Background broadcast listener
// ---------------------------------------------------------------------------

/// Registers a document-level keydown listener for keyboard shortcuts.
pub fn register_keyboard_handler() -> Effect(model.Msg) {
  use dispatch <- effect.from
  app_ffi.add_keydown_listener(fn(key, ctrl) {
    dispatch(model.KeyDown(key, ctrl))
  })
}

/// Registers a chrome.runtime.onMessage listener for background broadcasts.
/// Decodes conversionProgress / conversionComplete / conversionError and dispatches.
pub fn register_listener() -> Effect(model.Msg) {
  use dispatch <- effect.from
  app_ffi.on_message_typed(fn(msg_type, data) {
    case msg_type {
      "conversionProgress" ->
        case json.parse(app_ffi.json_stringify(data), progress_decoder()) {
          Ok(#(stage, pct, op)) -> dispatch(model.GotProgress(stage, pct, op))
          Error(_) -> Nil
        }
      "conversionComplete" ->
        case json.parse(app_ffi.json_stringify(data), complete_decoder()) {
          Ok(#(filename, file_size, duration)) ->
            dispatch(model.GotComplete(filename, file_size, duration))
          Error(_) -> Nil
        }
      "conversionError" ->
        case
          json.parse(app_ffi.json_stringify(data), codecs.error_payload_decoder())
        {
          Ok(payload) -> dispatch(model.GotError(payload.error))
          Error(_) -> Nil
        }
      _ -> Nil
    }
  })
}

// ---------------------------------------------------------------------------
// Clipboard
// ---------------------------------------------------------------------------

pub fn copy_to_clipboard(text: String) -> Effect(model.Msg) {
  use _ <- effect.from
  app_ffi.write_to_clipboard(text)
}

// ---------------------------------------------------------------------------
// Private decoders for broadcast payloads
// ---------------------------------------------------------------------------

fn progress_decoder() -> decode.Decoder(#(String, Int, String)) {
  use progress <- decode.field("progress", {
    use stage <- decode.field("stage", decode.string)
    use pct <- decode.field("percentage", decode.int)
    use op <- decode.field("currentOperation", decode.string)
    decode.success(#(stage, pct, op))
  })
  decode.success(progress)
}

fn complete_decoder() -> decode.Decoder(#(String, Int, Int)) {
  use filename <- decode.field("filename", decode.string)
  use file_size <- decode.field("fileSize", decode.int)
  use duration <- decode.field("duration", decode.int)
  decode.success(#(filename, file_size, duration))
}
