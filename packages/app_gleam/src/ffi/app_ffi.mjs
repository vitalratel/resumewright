// ABOUTME: JS implementations for converter frontend FFI — file I/O, messaging, storage, theme.
// ABOUTME: Implements all functions declared in ffi/app.gleam.

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
  reader.onload = () => callback({ type: "Ok", 0: reader.result });
  reader.onerror = () =>
    callback({ type: "Error", 0: reader.error?.message ?? "read error" });
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
    if (message?.type) handler(message.type, message.data ?? {});
    return false;
  });
}

// ---------------------------------------------------------------------------
// Decoding / encoding
// ---------------------------------------------------------------------------

export function decode_bool_field(obj, field) {
  if (obj && typeof obj[field] === "boolean") {
    return { type: "Ok", 0: obj[field] };
  }
  return { type: "Error", 0: undefined };
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
      callback({ type: "Error", 0: undefined });
    } else {
      callback({
        type: "Ok",
        0: typeof val === "string" ? val : JSON.stringify(val),
      });
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
  document.documentElement.setAttribute("data-theme", theme);
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
  return file ? { type: "Some", 0: file } : { type: "None" };
}

export function file_from_input_event(event) {
  const file = event?.target?.files?.[0];
  return file ? { type: "Some", 0: file } : { type: "None" };
}

// ---------------------------------------------------------------------------
// Extension metadata
// ---------------------------------------------------------------------------

export function get_version() {
  return chrome?.runtime?.getManifest()?.version ?? "0.0.0";
}
