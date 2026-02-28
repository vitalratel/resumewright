// ABOUTME: Service worker entry point — registers lifecycle handlers, messaging, and WASM init.
// ABOUTME: Setup is synchronous; WASM init runs async and non-blocking.

import background/message_handler
import background/wasm_init
import ffi/background as ffi
import ffi/chrome
import gleam/javascript/promise

pub fn main() -> Nil {
  // Register lifecycle listeners immediately (before any async work)
  setup_lifecycle()

  // Register message handlers synchronously — service workers can be terminated
  // at any time, so handlers must be registered before any async operation
  message_handler.setup()

  // Initialize WASM asynchronously (non-blocking)
  let _ =
    promise.await(wasm_init.initialize(), fn(result) {
      case result {
        Ok(Nil) -> promise.resolve(Nil)
        Error(_msg) -> promise.resolve(Nil)
      }
    })

  Nil
}

fn setup_lifecycle() -> Nil {
  ffi.on_installed(fn(reason) {
    case reason {
      "install" -> {
        // First-time install: load default settings to ensure they exist
        let _ =
          promise.await(
            chrome.storage_sync_get("resumewright-settings"),
            fn(result) {
              case result {
                Ok(_) -> promise.resolve(Nil)
                Error(_) -> {
                  // Settings not yet stored — they'll be initialised on first use
                  promise.resolve(Nil)
                }
              }
            },
          )
        Nil
      }
      _ -> Nil
    }
  })
  ffi.on_startup(fn() { Nil })
  Nil
}
