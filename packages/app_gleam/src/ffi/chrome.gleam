// ABOUTME: @external declarations for Chrome extension APIs unavailable in Gleam libraries.
// ABOUTME: Runtime behaviour requires Chrome extension context; tested via E2E.

import gleam/dynamic.{type Dynamic}
import gleam/javascript/promise.{type Promise}

@external(javascript, "./chrome_ffi.mjs", "storage_sync_get")
pub fn storage_sync_get(key: String) -> Promise(Result(Dynamic, Nil))

@external(javascript, "./chrome_ffi.mjs", "storage_sync_set")
pub fn storage_sync_set(key: String, value: Dynamic) -> Promise(Nil)

@external(javascript, "./chrome_ffi.mjs", "storage_local_get")
pub fn storage_local_get(key: String) -> Promise(Result(Dynamic, Nil))

@external(javascript, "./chrome_ffi.mjs", "send_message")
pub fn send_message(msg: Dynamic) -> Promise(Dynamic)

@external(javascript, "./chrome_ffi.mjs", "on_message")
pub fn on_message(handler: fn(Dynamic) -> Nil) -> Nil

@external(javascript, "./chrome_ffi.mjs", "download_blob")
pub fn download_blob(bytes: BitArray, filename: String) -> Promise(Nil)
