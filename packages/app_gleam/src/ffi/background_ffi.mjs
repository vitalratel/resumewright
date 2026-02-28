// ABOUTME: Background service worker FFI — WASM init, conversion, downloads, messaging.
// ABOUTME: Wraps WASM bridge, chrome.downloads, and chrome.runtime messaging protocol.

import init, {
  TsxToPdfConverter,
  extract_cv_metadata,
} from "@pkg/wasm_bridge.js";

// ---------------------------------------------------------------------------
// WASM state (module-level singletons)
// ---------------------------------------------------------------------------

let wasmInitialized = false;
let converterInstance = null;

// ---------------------------------------------------------------------------
// WASM lifecycle
// ---------------------------------------------------------------------------

export async function wasm_init() {
  try {
    const wasmUrl = chrome.runtime.getURL("wasm_bridge_bg.wasm");
    const response = await fetch(wasmUrl);
    if (!response.ok) {
      return {
        type: "Error",
        0: `Failed to fetch WASM: ${response.status} ${response.statusText}`,
      };
    }
    const wasmBytes = await response.arrayBuffer();
    await init({ module_or_path: wasmBytes });
    converterInstance = new TsxToPdfConverter();
    wasmInitialized = true;
    return { type: "Ok", 0: undefined };
  } catch (err) {
    return { type: "Error", 0: err?.message ?? String(err) };
  }
}

export function wasm_is_initialized() {
  return wasmInitialized;
}

export async function wasm_validate(tsx) {
  if (!converterInstance) return true; // fallback: allow through if WASM not yet ready
  try {
    const result = converterInstance.detect_fonts(tsx);
    return Array.isArray(JSON.parse(result));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Conversion + download
// ---------------------------------------------------------------------------

// Builds a WASM-compatible PDF config from the Gleam ConversionConfig JSON.
// Converts margins from inches to points (1 inch = 72 points).
function buildWasmConfig(configJson, title) {
  const cfg = JSON.parse(configJson);
  return {
    page_size: cfg.pageSize,
    margin: {
      top: cfg.margin.top * 72,
      right: cfg.margin.right * 72,
      bottom: cfg.margin.bottom * 72,
      left: cfg.margin.left * 72,
    },
    standard: "PDFA1b",
    title: title ?? "Resume",
    author: null,
    subject: "Curriculum Vitae",
    keywords: null,
    creator: "ResumeWright Browser Extension",
  };
}

// Throttle helper: calls fn at most once per interval_ms.
function throttle(fn, interval_ms) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= interval_ms) {
      last = now;
      fn(...args);
    }
  };
}

/// Converts TSX to PDF and triggers a download via chrome.downloads.
/// Returns [file_size_bytes, duration_ms] as a Gleam 2-tuple.
export async function wasm_convert_and_download(
  tsx,
  config_json,
  _job_id,
  on_progress,
  filename,
) {
  const startTime = performance.now();

  // Extract CV name for PDF title metadata
  let cvName = "Resume";
  try {
    const meta = extract_cv_metadata(tsx);
    if (meta.name) cvName = meta.name;
    meta.free();
  } catch {
    // metadata extraction is best-effort
  }

  const wasmConfig = buildWasmConfig(config_json, cvName);

  // Throttled progress callback (100ms)
  const throttledProgress = throttle((stage, pct) => {
    on_progress(stage, pct);
  }, 100);

  // Convert to PDF (no custom fonts — system fonts only for Phase 3)
  const pdfBytes = converterInstance.convert_tsx_to_pdf(
    tsx,
    wasmConfig,
    null,
    (stage, pct) => throttledProgress(stage, pct),
  );

  const duration = Math.round(performance.now() - startTime);

  // Download via chrome.downloads using a data URL (works in service workers —
  // URL.createObjectURL is not available in SW context)
  const base64 = btoa(
    Array.from(new Uint8Array(pdfBytes))
      .map((b) => String.fromCharCode(b))
      .join(""),
  );
  const dataUrl = `data:application/pdf;base64,${base64}`;

  await new Promise((resolve) => {
    chrome.downloads.download({ url: dataUrl, filename, saveAs: false }, () => {
      void chrome.runtime.lastError; // suppress "download cancelled" errors
      resolve();
    });
  });

  return [pdfBytes.length, duration];
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export async function storage_local_set(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

export async function storage_local_get_string(key) {
  const result = await chrome.storage.local.get([key]);
  const value = result[key];
  if (value == null) return { type: "Error", 0: undefined };
  return { type: "Ok", 0: String(value) };
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

/// Registers a chrome.runtime.onMessage listener.
/// handler: fn(type: String, data: Dynamic) -> Promise(Dynamic)
/// Sends { res: result } back on success, { err: { message } } on failure.
export function on_request(handler) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message?.type) return false;
    // handler returns a JSON string; parse it before sending back as { res: obj }
    handler(message.type, message.data ?? null)
      .then((json_str) => {
        sendResponse({ res: JSON.parse(json_str) });
      })
      .catch((err) => {
        sendResponse({ err: { message: err?.message ?? String(err) } });
      });
    return true; // keep message channel open for async response
  });
}

/// Broadcasts a message to all extension pages using @webext-core/messaging wire format.
export async function broadcast(type, payload_json) {
  const data = JSON.parse(payload_json);
  const message = { id: 0, type, data, timestamp: Date.now() };
  await new Promise((resolve) => {
    chrome.runtime.sendMessage(message, () => {
      void chrome.runtime.lastError; // suppress "no receiver" errors
      resolve();
    });
  });
}

// ---------------------------------------------------------------------------
// Extension lifecycle
// ---------------------------------------------------------------------------

export function on_installed(handler) {
  chrome.runtime.onInstalled.addListener((details) => {
    handler(details.reason);
  });
}

export function on_startup(handler) {
  chrome.runtime.onStartup.addListener(() => {
    handler();
  });
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function uuid() {
  return crypto.randomUUID();
}

export function now_ms() {
  return Math.round(performance.now());
}

export function sleep_ms(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function current_date_string() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

