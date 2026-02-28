// ABOUTME: Message routing for background service worker — validateTsx and startConversion.
// ABOUTME: Decodes Chrome runtime messages and dispatches to conversion pipeline.

import background/conversion
import ffi/background as ffi
import gleam/dynamic.{type Dynamic}
import gleam/dynamic/decode
import gleam/javascript/promise.{type Promise}
import gleam/json
import shared/codecs

pub fn setup() -> Nil {
  ffi.on_request(handle_message)
}

fn handle_message(msg_type: String, data: Dynamic) -> Promise(String) {
  case msg_type {
    "validateTsx" -> handle_validate(data)
    "startConversion" -> handle_conversion(data)
    _ ->
      promise.resolve(json.to_string(json.object([#("ok", json.bool(True))])))
  }
}

// ---------------------------------------------------------------------------
// validateTsx
// ---------------------------------------------------------------------------

fn handle_validate(data: Dynamic) -> Promise(String) {
  let tsx_decoder = {
    use tsx <- decode.field("tsx", decode.string)
    decode.success(tsx)
  }
  case decode.run(data, tsx_decoder) {
    Error(_) ->
      promise.resolve(
        json.to_string(json.object([#("valid", json.bool(False))])),
      )
    Ok(tsx) -> {
      use is_valid <- promise.await(ffi.wasm_validate(tsx))
      promise.resolve(
        json.to_string(json.object([#("valid", json.bool(is_valid))])),
      )
    }
  }
}

// ---------------------------------------------------------------------------
// startConversion
// ---------------------------------------------------------------------------

fn handle_conversion(data: Dynamic) -> Promise(String) {
  case ffi.wasm_is_initialized() {
    False ->
      promise.resolve(
        json.to_string(
          json.object([
            #("success", json.bool(False)),
            #(
              "error",
              json.string(
                "PDF generation engine is still loading. Please wait and try again.",
              ),
            ),
          ]),
        ),
      )
    True ->
      case decode.run(data, codecs.conversion_request_decoder()) {
        Error(_) ->
          promise.resolve(
            json.to_string(
              json.object([
                #("success", json.bool(False)),
                #("error", json.string("Invalid conversion request payload.")),
              ]),
            ),
          )
        Ok(request) -> {
          let job_id = ffi.uuid()
          // Fire-and-forget: result is broadcast, not returned in the response
          let _ = conversion.run_with_error(job_id, request)
          promise.resolve(
            json.to_string(json.object([#("success", json.bool(True))])),
          )
        }
      }
  }
}
