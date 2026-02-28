// ABOUTME: @external declarations for background service worker — WASM, messaging, lifecycle.
// ABOUTME: Runtime-only; all implementations are in background_ffi.mjs.

import gleam/dynamic.{type Dynamic}
import gleam/javascript/promise.{type Promise}

// ---------------------------------------------------------------------------
// WASM lifecycle
// ---------------------------------------------------------------------------

@external(javascript, "./background_ffi.mjs", "wasm_init")
pub fn wasm_init() -> Promise(Result(Nil, String))

@external(javascript, "./background_ffi.mjs", "wasm_validate")
pub fn wasm_validate(tsx: String) -> Promise(Bool)

/// Converts TSX to PDF and downloads it via chrome.downloads.
/// Returns #(file_size_bytes, duration_ms).
@external(javascript, "./background_ffi.mjs", "wasm_convert_and_download")
pub fn wasm_convert_and_download(
  tsx: String,
  config_json: String,
  job_id: String,
  on_progress: fn(String, Int) -> Nil,
  filename: String,
) -> Promise(#(Int, Int))

@external(javascript, "./background_ffi.mjs", "wasm_is_initialized")
pub fn wasm_is_initialized() -> Bool

// ---------------------------------------------------------------------------
// Storage (local — for WASM status)
// ---------------------------------------------------------------------------

@external(javascript, "./background_ffi.mjs", "storage_local_set")
pub fn storage_local_set(key: String, value: String) -> Promise(Nil)

@external(javascript, "./background_ffi.mjs", "storage_local_get_string")
pub fn storage_local_get_string(key: String) -> Promise(Result(String, Nil))

// ---------------------------------------------------------------------------
// Messaging — request/response + broadcasts
// ---------------------------------------------------------------------------

/// Registers a chrome.runtime.onMessage listener.
/// handler returns a JSON string which is parsed and sent back as { res: parsed }.
@external(javascript, "./background_ffi.mjs", "on_request")
pub fn on_request(handler: fn(String, Dynamic) -> Promise(String)) -> Nil

/// Broadcasts a message to all extension pages using the @webext-core/messaging wire format.
/// payload_json is a JSON string that becomes the `data` field.
@external(javascript, "./background_ffi.mjs", "broadcast")
pub fn broadcast(msg_type: String, payload_json: String) -> Promise(Nil)

// ---------------------------------------------------------------------------
// Extension lifecycle
// ---------------------------------------------------------------------------

@external(javascript, "./background_ffi.mjs", "on_installed")
pub fn on_installed(handler: fn(String) -> Nil) -> Nil

@external(javascript, "./background_ffi.mjs", "on_startup")
pub fn on_startup(handler: fn() -> Nil) -> Nil

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

@external(javascript, "./background_ffi.mjs", "uuid")
pub fn uuid() -> String

@external(javascript, "./background_ffi.mjs", "now_ms")
pub fn now_ms() -> Int

@external(javascript, "./background_ffi.mjs", "sleep_ms")
pub fn sleep_ms(ms: Int) -> Promise(Nil)

@external(javascript, "./background_ffi.mjs", "current_date_string")
pub fn current_date_string() -> String
