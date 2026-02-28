// ABOUTME: FFI declarations for converter frontend — file I/O, messaging, storage, theme.
// ABOUTME: All @external bindings for the converter app; implemented in app_ffi.mjs.

import gleam/dynamic.{type Dynamic}
import gleam/option.{type Option}
import plinth/browser/file.{type File}

/// Opaque handle to an arbitrary JavaScript object (response payloads, etc.).
pub type JsDynamic

// ---------------------------------------------------------------------------
// File metadata
// ---------------------------------------------------------------------------

@external(javascript, "./app_ffi.mjs", "file_name")
pub fn file_name(file: File) -> String

@external(javascript, "./app_ffi.mjs", "file_size")
pub fn file_size(file: File) -> Int

@external(javascript, "./app_ffi.mjs", "file_type")
pub fn file_type(file: File) -> String

// ---------------------------------------------------------------------------
// File reading
// ---------------------------------------------------------------------------

@external(javascript, "./app_ffi.mjs", "read_file_as_text")
pub fn read_file_as_text(
  file: File,
  callback: fn(Result(String, String)) -> Nil,
) -> Nil

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

/// Sends a typed message to the background service worker.
/// Unwraps response.res before calling back (background wraps all responses in { res: ... }).
@external(javascript, "./app_ffi.mjs", "send_message_typed")
pub fn send_message_typed(
  msg_type: String,
  data_json: String,
  callback: fn(JsDynamic) -> Nil,
) -> Nil

/// Registers a listener for background broadcast messages.
@external(javascript, "./app_ffi.mjs", "on_message_typed")
pub fn on_message_typed(handler: fn(String, JsDynamic) -> Nil) -> Nil

// ---------------------------------------------------------------------------
// Decoding / encoding
// ---------------------------------------------------------------------------

@external(javascript, "./app_ffi.mjs", "decode_bool_field")
pub fn decode_bool_field(obj: JsDynamic, field: String) -> Result(Bool, Nil)

@external(javascript, "./app_ffi.mjs", "json_encode_string")
pub fn json_encode_string(s: String) -> String

@external(javascript, "./app_ffi.mjs", "json_stringify")
pub fn json_stringify(obj: JsDynamic) -> String

// ---------------------------------------------------------------------------
// Countdown
// ---------------------------------------------------------------------------

@external(javascript, "./app_ffi.mjs", "start_countdown")
pub fn start_countdown(on_tick: fn() -> Nil) -> Nil

@external(javascript, "./app_ffi.mjs", "stop_countdown")
pub fn stop_countdown() -> Nil

// ---------------------------------------------------------------------------
// Tab
// ---------------------------------------------------------------------------

@external(javascript, "./app_ffi.mjs", "close_tab")
pub fn close_tab() -> Nil

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

@external(javascript, "./app_ffi.mjs", "storage_sync_get_string")
pub fn storage_sync_get_string(
  key: String,
  callback: fn(Result(String, Nil)) -> Nil,
) -> Nil

@external(javascript, "./app_ffi.mjs", "storage_sync_set_json")
pub fn storage_sync_set_json(key: String, json: String) -> Nil

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

@external(javascript, "./app_ffi.mjs", "apply_theme")
pub fn apply_theme(theme: String) -> Nil

// ---------------------------------------------------------------------------
// Clipboard
// ---------------------------------------------------------------------------

@external(javascript, "./app_ffi.mjs", "write_to_clipboard")
pub fn write_to_clipboard(text: String) -> Nil

// ---------------------------------------------------------------------------
// Event file extraction
// ---------------------------------------------------------------------------

/// Extracts the first file from a drag-drop event's dataTransfer.files list.
@external(javascript, "./app_ffi.mjs", "file_from_drop_event")
pub fn file_from_drop_event(event: Dynamic) -> Option(File)

/// Extracts the first file from a file input's change event target.files list.
@external(javascript, "./app_ffi.mjs", "file_from_input_event")
pub fn file_from_input_event(event: Dynamic) -> Option(File)

// ---------------------------------------------------------------------------
// Keyboard shortcuts
// ---------------------------------------------------------------------------

@external(javascript, "./app_ffi.mjs", "add_keydown_listener")
pub fn add_keydown_listener(handler: fn(String, Bool) -> Nil) -> Nil

// ---------------------------------------------------------------------------
// Extension metadata
// ---------------------------------------------------------------------------

@external(javascript, "./app_ffi.mjs", "get_version")
pub fn get_version() -> String
