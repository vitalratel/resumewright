// ABOUTME: Type-level tests for Chrome extension API FFI wrappers.
// ABOUTME: Compilation proves type signatures are correct; runtime requires Chrome context.

import ffi/chrome
import gleam/dynamic
import gleam/javascript/promise

// Each test binds the function to a typed variable. If the types are wrong,
// the test file won't compile. Runtime calls are covered by E2E tests.

pub fn storage_sync_get_type_test() {
  let _: fn(String) -> promise.Promise(Result(dynamic.Dynamic, Nil)) =
    chrome.storage_sync_get
  Nil
}

pub fn storage_sync_set_type_test() {
  let _: fn(String, dynamic.Dynamic) -> promise.Promise(Nil) =
    chrome.storage_sync_set
  Nil
}

pub fn storage_local_get_type_test() {
  let _: fn(String) -> promise.Promise(Result(dynamic.Dynamic, Nil)) =
    chrome.storage_local_get
  Nil
}

pub fn send_message_type_test() {
  let _: fn(dynamic.Dynamic) -> promise.Promise(dynamic.Dynamic) =
    chrome.send_message
  Nil
}

pub fn on_message_type_test() {
  let _: fn(fn(dynamic.Dynamic) -> Nil) -> Nil = chrome.on_message
  Nil
}

pub fn download_blob_type_test() {
  let _: fn(BitArray, String) -> promise.Promise(Nil) = chrome.download_blob
  Nil
}
