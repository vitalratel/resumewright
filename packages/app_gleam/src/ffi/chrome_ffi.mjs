// ABOUTME: Chrome extension API wrappers exposed to Gleam via @external.
// ABOUTME: Wraps chrome.storage (sync/local), chrome.runtime messaging, and chrome.downloads.

export function storage_sync_get(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], (result) => {
      if (chrome.runtime.lastError || !(key in result)) {
        resolve({ type: "Error", 0: undefined });
      } else {
        resolve({ type: "Ok", 0: result[key] });
      }
    });
  });
}

export function storage_sync_set(key, value) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [key]: value }, resolve);
  });
}

export function storage_local_get(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError || !(key in result)) {
        resolve({ type: "Error", 0: undefined });
      } else {
        resolve({ type: "Ok", 0: result[key] });
      }
    });
  });
}

export function send_message(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, resolve);
  });
}

export function on_message(handler) {
  chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    handler(message);
    return false;
  });
}

export function download_blob(bytes, filename) {
  return new Promise((resolve) => {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url, filename, saveAs: false }, () => {
      URL.revokeObjectURL(url);
      resolve();
    });
  });
}
