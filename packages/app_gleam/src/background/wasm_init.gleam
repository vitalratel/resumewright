// ABOUTME: WASM initialization with exponential backoff retry (max 3 attempts).
// ABOUTME: Persists init status to chrome.storage.local for diagnostic purposes.

import ffi/background as ffi
import gleam/int
import gleam/javascript/promise.{type Promise}

const max_attempts = 3

const base_delay_ms = 1000

const max_delay_ms = 5000

/// Initializes WASM with exponential backoff retry.
/// Stores status in chrome.storage.local: wasmStatus and wasmInitError.
pub fn initialize() -> Promise(Result(Nil, String)) {
  use _ <- promise.await(ffi.storage_local_set("wasmStatus", "initializing"))
  attempt(1)
}

fn attempt(n: Int) -> Promise(Result(Nil, String)) {
  use result <- promise.await(ffi.wasm_init())
  case result {
    Ok(Nil) -> {
      let _ = ffi.storage_local_set("wasmStatus", "success")
      let _ = ffi.storage_local_set("wasmInitError", "")
      promise.resolve(Ok(Nil))
    }
    Error(msg) ->
      case n >= max_attempts {
        True -> {
          let _ = ffi.storage_local_set("wasmStatus", "failed")
          let _ = ffi.storage_local_set("wasmInitError", msg)
          promise.resolve(Error(msg))
        }
        False -> {
          let delay = int.min(base_delay_ms * pow2(n - 1), max_delay_ms)
          use _ <- promise.await(ffi.sleep_ms(delay))
          attempt(n + 1)
        }
      }
  }
}

fn pow2(n: Int) -> Int {
  case n {
    0 -> 1
    _ -> 2 * pow2(n - 1)
  }
}
