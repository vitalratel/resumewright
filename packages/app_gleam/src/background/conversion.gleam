// ABOUTME: Conversion pipeline — loads config, runs WASM, downloads PDF, broadcasts updates.
// ABOUTME: Handles the full startConversion flow including progress and error broadcasting.

import background/errors
import background/filename
import background/progress
import ffi/background as ffi
import ffi/chrome
import gleam/dynamic/decode
import gleam/javascript/promise.{type Promise}
import gleam/json
import gleam/option.{type Option, None, Some}
import gleam/string
import shared/codecs
import shared/types.{
  type ConversionConfig, type ConversionRequest, ConversionConfig, Letter,
  Margin,
}

// ---------------------------------------------------------------------------
// Default config (used when no settings found in storage)
// ---------------------------------------------------------------------------

fn default_config() -> ConversionConfig {
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

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/// Runs the full conversion pipeline for a startConversion request.
/// Broadcasts progress, conversionComplete, or conversionError messages.
pub fn run(
  job_id: String,
  request: ConversionRequest,
) -> Promise(Result(Nil, String)) {
  use config <- promise.await(load_config(request.config))
  let config_json = json.to_string(codecs.encode_conversion_config_json(config))

  let date = ffi.current_date_string()
  let name_hint = request.file_name |> option.then(extract_name_from_filename)
  let safe_filename = filename.generate(name_hint, date)

  let on_progress = fn(stage: String, pct: Int) {
    let payload =
      json.to_string(
        json.object([
          #("jobId", json.string(job_id)),
          #(
            "progress",
            json.object([
              #("stage", json.string(stage)),
              #("percentage", json.int(pct)),
              #(
                "currentOperation",
                json.string(progress.description_from_string(stage)),
              ),
            ]),
          ),
        ]),
      )
    let _ = ffi.broadcast("conversionProgress", payload)
    Nil
  }

  let tsx = option.unwrap(request.tsx, "")

  use convert_result <- promise.await(
    ffi.wasm_convert_and_download(tsx, config_json, job_id, on_progress, safe_filename),
  )

  let #(file_size, duration) = convert_result

  let complete_payload =
    json.to_string(
      json.object([
        #("jobId", json.string(job_id)),
        #("filename", json.string(safe_filename)),
        #("fileSize", json.int(file_size)),
        #("duration", json.int(duration)),
      ]),
    )
  let _ = ffi.broadcast("conversionComplete", complete_payload)
  promise.resolve(Ok(Nil))
}

/// Wraps run/2 and broadcasts conversionError on failure.
pub fn run_with_error(
  job_id: String,
  request: ConversionRequest,
) -> Promise(Result(Nil, String)) {
  use result <- promise.await(run(job_id, request))
  case result {
    Ok(Nil) -> promise.resolve(Ok(Nil))
    Error(msg) -> {
      let conv_error = errors.from_message(msg)
      let err_payload =
        json.to_string(
          json.object([
            #("jobId", json.string(job_id)),
            #(
              "error",
              json.object([
                #("code", json.string(conv_error.code)),
                #("message", json.string(conv_error.message)),
                #(
                  "suggestions",
                  json.array(conv_error.suggestions, json.string),
                ),
                #("recoverable", json.bool(conv_error.recoverable)),
              ]),
            ),
          ]),
        )
      let _ = ffi.broadcast("conversionError", err_payload)
      promise.resolve(Error(msg))
    }
  }
}

// ---------------------------------------------------------------------------
// Config loading
// ---------------------------------------------------------------------------

fn load_config(
  request_config: Option(ConversionConfig),
) -> Promise(ConversionConfig) {
  case request_config {
    Some(cfg) -> promise.resolve(cfg)
    None -> load_from_storage()
  }
}

fn load_from_storage() -> Promise(ConversionConfig) {
  use result <- promise.await(chrome.storage_sync_get("resumewright-settings"))
  case result {
    Error(_) -> promise.resolve(default_config())
    Ok(raw) ->
      case decode.run(raw, codecs.settings_decoder()) {
        Ok(settings) -> promise.resolve(settings.default_config)
        Error(_) -> promise.resolve(default_config())
      }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Extracts a candidate display name from a file path like "John_Doe_Resume.tsx".
fn extract_name_from_filename(file_name: String) -> Option(String) {
  // Strip extension by dropping everything after the last dot
  let base = case string.contains(file_name, ".") {
    False -> file_name
    True -> {
      let parts = string.split(file_name, on: ".")
      drop_last_element(parts)
      |> string.join(with: ".")
    }
  }
  // Strip common suffixes _Resume / _CV (case-insensitive)
  let lower_base = string.lowercase(base)
  let base = case
    string.ends_with(lower_base, "_resume")
    || string.ends_with(lower_base, "_cv")
  {
    False -> base
    True ->
      case string.ends_with(lower_base, "_resume") {
        True -> string.drop_end(base, 7)
        False -> string.drop_end(base, 3)
      }
  }
  // Replace underscores with spaces
  let name = string.replace(in: base, each: "_", with: " ")
  case string.is_empty(string.trim(name)) {
    True -> None
    False -> Some(name)
  }
}

fn drop_last_element(items: List(String)) -> List(String) {
  case items {
    [] -> []
    [_] -> []
    [head, ..rest] -> [head, ..drop_last_element(rest)]
  }
}
