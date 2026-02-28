// ABOUTME: JS implementations for converter frontend FFI — file I/O, messaging, storage, theme.
// ABOUTME: Implements all functions declared in ffi/app.gleam.

import { Ok, Error as GleamError } from "../../prelude.mjs";
import { Some, None } from "../../gleam_stdlib/gleam/option.mjs";

// ---------------------------------------------------------------------------
// File metadata
// ---------------------------------------------------------------------------

export function file_name(file) {
  return file.name;
}

export function file_size(file) {
  return file.size;
}

export function file_type(file) {
  return file.type;
}

// ---------------------------------------------------------------------------
// File reading
// ---------------------------------------------------------------------------

export function read_file_as_text(file, callback) {
  const reader = new FileReader();
  reader.onload = () => {
    callback(new Ok(reader.result));
  };
  reader.onerror = () => {
    callback(new GleamError(reader.error?.message ?? "read error"));
  };
  reader.readAsText(file);
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

// Unwraps response.res before calling back (background wraps responses in { res: ... }).
export function send_message_typed(type, dataJson, callback) {
  try {
    const data = JSON.parse(dataJson);
    chrome.runtime.sendMessage({ type, data }, (response) => {
      void chrome.runtime.lastError;
      callback(response?.res ?? response ?? {});
    });
  } catch {
    callback({});
  }
}

export function on_message_typed(handler) {
  chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message?.type) {
      console.log("[FFI] on_message_typed:", message.type, JSON.stringify(message.data).slice(0, 80));
      handler(message.type, message.data ?? {});
    }
    return false;
  });
}

// ---------------------------------------------------------------------------
// Decoding / encoding
// ---------------------------------------------------------------------------

export function decode_bool_field(obj, field) {
  if (obj && typeof obj[field] === "boolean") {
    return new Ok(obj[field]);
  }
  return new GleamError(undefined);
}

export function json_encode_string(s) {
  return JSON.stringify(s);
}

export function json_stringify(obj) {
  return JSON.stringify(obj);
}

// ---------------------------------------------------------------------------
// Countdown (module-level singleton — avoids storing timer ID in model)
// ---------------------------------------------------------------------------

let countdownTimer = null;

export function start_countdown(onTick) {
  stop_countdown();
  countdownTimer = setInterval(onTick, 1000);
}

export function stop_countdown() {
  if (countdownTimer !== null) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

// ---------------------------------------------------------------------------
// Tab
// ---------------------------------------------------------------------------

export function close_tab() {
  chrome.tabs.getCurrent((tab) => {
    if (tab?.id != null) chrome.tabs.remove(tab.id);
  });
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export function storage_sync_get_string(key, callback) {
  chrome.storage.sync.get([key], (result) => {
    void chrome.runtime.lastError;
    const val = result[key];
    if (val == null) {
      callback(new GleamError(undefined));
    } else {
      callback(new Ok(typeof val === "string" ? val : JSON.stringify(val)));
    }
  });
}

export function storage_sync_set_json(key, json) {
  try {
    chrome.storage.sync.set({ [key]: JSON.parse(json) });
  } catch {
    // fire-and-forget; silent on malformed json
  }
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export function apply_theme(theme) {
  const html = document.documentElement;
  html.classList.remove("light", "dark");
  if (theme !== "auto" && theme !== "") {
    html.classList.add(theme);
  }
}

// ---------------------------------------------------------------------------
// Clipboard
// ---------------------------------------------------------------------------

export function write_to_clipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {
    // best-effort; silent on failure
  });
}

// ---------------------------------------------------------------------------
// Event file extraction
// ---------------------------------------------------------------------------

export function file_from_drop_event(event) {
  const file = event?.dataTransfer?.files?.[0];
  return file ? new Some(file) : new None();
}

export function file_from_input_event(event) {
  const file = event?.target?.files?.[0];
  return file ? new Some(file) : new None();
}

// ---------------------------------------------------------------------------
// Keyboard shortcuts
// ---------------------------------------------------------------------------

export function add_keydown_listener(handler) {
  document.addEventListener("keydown", (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    handler(e.key, ctrl);
  });
}

// ---------------------------------------------------------------------------
// CSS custom property setters (bypasses CSP style-src 'self' restriction)
// Lustre's attribute.style() uses setAttribute which is blocked; style.setProperty()
// is a JS operation and is not subject to style-src CSP restrictions.
// ---------------------------------------------------------------------------

function setStyleProps(selector, props) {
  // Double rAF: first frame lets Lustre patch the DOM, second reads the result.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const el = document.querySelector(selector);
      if (el) {
        for (const [key, val] of props) {
          el.style.setProperty(key, val);
        }
      }
    });
  });
}

export function apply_margin_preview(top, right, bottom, left) {
  setStyleProps(".margin-preview-box", [
    ["--preview-top", top],
    ["--preview-right", right],
    ["--preview-bottom", bottom],
    ["--preview-left", left],
  ]);
}

export function apply_progress_pct(pct) {
  setStyleProps(".progress-bar-fill", [["--progress-pct", pct + "%"]]);
}

// ---------------------------------------------------------------------------
// Extension metadata
// ---------------------------------------------------------------------------

export function get_version() {
  return chrome?.runtime?.getManifest()?.version ?? "0.0.0";
}
