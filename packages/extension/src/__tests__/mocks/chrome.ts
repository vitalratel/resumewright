/**
 * Chrome API Mocks
 * Comprehensive mocks for Chrome extension APIs
 */

import type Browser from 'webextension-polyfill';
import { vi } from 'vitest';

/**
 * Create comprehensive Chrome API mocks
 * Covers all APIs used in ResumeWright extension
 */
export function createChromeMocks() {
  return {
    // Storage API
    storage: {
      local: {
        get: vi.fn(async _keys => Promise.resolve({})),
        set: vi.fn(async () => Promise.resolve()),
        remove: vi.fn(async () => Promise.resolve()),
        clear: vi.fn(async () => Promise.resolve()),
        getBytesInUse: vi.fn(async () => Promise.resolve(0)),
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
          hasListener: vi.fn(() => false),
        },
      },
      sync: {
        get: vi.fn(async () => Promise.resolve({})),
        set: vi.fn(async () => Promise.resolve()),
        remove: vi.fn(async () => Promise.resolve()),
        clear: vi.fn(async () => Promise.resolve()),
        getBytesInUse: vi.fn(async () => Promise.resolve(0)),
      },
      session: {
        get: vi.fn(async _keys => Promise.resolve({})),
        set: vi.fn(async () => Promise.resolve()),
        remove: vi.fn(async () => Promise.resolve()),
        clear: vi.fn(async () => Promise.resolve()),
      },
    },

    // Runtime API
    runtime: {
      id: 'test-extension-id',
      sendMessage: vi.fn(async () => Promise.resolve()),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn(() => false),
      },
      onInstalled: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn(() => false),
      },
      onStartup: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn(() => false),
      },
      getURL: vi.fn(path => `chrome-extension://test/${path}`),
      getManifest: vi.fn(() => ({
        name: 'ResumeWright',
        version: '1.0.0',
        manifest_version: 3,
      })),
      lastError: undefined,
      connect: vi.fn(() => ({
        postMessage: vi.fn(),
        onMessage: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
        onDisconnect: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
        disconnect: vi.fn(),
      })),
    },

    // Tabs API
    tabs: {
      query: vi.fn(async () => Promise.resolve([])),
      get: vi.fn(async () => Promise.resolve({
        id: 1,
        url: 'https://claude.ai',
        title: 'Claude',
        active: true,
      })),
      create: vi.fn(async () => Promise.resolve({
        id: 2,
        url: '',
        title: '',
        active: false,
      })),
      update: vi.fn(async () => Promise.resolve()),
      remove: vi.fn(async () => Promise.resolve()),
      sendMessage: vi.fn(async () => Promise.resolve()),
      onUpdated: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn(() => false),
      },
      onActivated: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn(() => false),
      },
    },

    // Action API (replaces browserAction in MV3)
    action: {
      setBadgeText: vi.fn(async () => Promise.resolve()),
      setBadgeBackgroundColor: vi.fn(async () => Promise.resolve()),
      setIcon: vi.fn(async () => Promise.resolve()),
      setTitle: vi.fn(async () => Promise.resolve()),
      getBadgeText: vi.fn(async () => Promise.resolve('')),
      getBadgeBackgroundColor: vi.fn(async () => Promise.resolve('')),
      onClicked: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn(() => false),
      },
    },

    // Downloads API
    downloads: {
      download: vi.fn(async () => Promise.resolve(1)),
      search: vi.fn(async () => Promise.resolve([])),
      cancel: vi.fn(async () => Promise.resolve()),
      open: vi.fn(async () => Promise.resolve()),
      show: vi.fn(async () => Promise.resolve()),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn(() => false),
      },
    },

    // Scripting API (for content scripts in MV3)
    scripting: {
      executeScript: vi.fn(async () => Promise.resolve([])),
      insertCSS: vi.fn(async () => Promise.resolve()),
      removeCSS: vi.fn(async () => Promise.resolve()),
    },

    // Alarms API
    alarms: {
      create: vi.fn(),
      get: vi.fn(async () => Promise.resolve(undefined)),
      getAll: vi.fn(async () => Promise.resolve([])),
      clear: vi.fn(async () => Promise.resolve(true)),
      clearAll: vi.fn(async () => Promise.resolve(true)),
      onAlarm: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn(() => false),
      },
    },

    // Permissions API
    permissions: {
      contains: vi.fn(async () => Promise.resolve(true)),
      request: vi.fn(async () => Promise.resolve(true)),
      remove: vi.fn(async () => Promise.resolve(true)),
      getAll: vi.fn(async () => Promise.resolve({
        permissions: [],
        origins: [],
      })),
    },

    // i18n API
    i18n: {
      getMessage: vi.fn((key: string): string => key),
      getUILanguage: vi.fn(() => 'en'),
      getAcceptLanguages: vi.fn(async () => Promise.resolve(['en'])),
    },
  };
}

/**
 * Mock helper: Set storage data
 */
export function mockChromeStorageGet(data: Record<string, unknown>) {
  const glob = globalThis as { chrome?: { storage?: { local?: { get?: ReturnType<typeof vi.fn> } } } };
  glob.chrome = glob.chrome || { storage: { local: { get: vi.fn() } } };
  glob.chrome.storage = glob.chrome.storage || { local: { get: vi.fn() } };
  glob.chrome.storage.local = glob.chrome.storage.local || { get: vi.fn() };
  glob.chrome.storage.local.get = glob.chrome.storage.local.get || vi.fn();
  vi.mocked(glob.chrome.storage.local.get).mockImplementation(
    (keys: string | string[] | Record<string, unknown> | null | undefined) => {
      if (typeof keys === 'string') {
        return { [keys]: data[keys] };
      }
      if (Array.isArray(keys)) {
        const result: Record<string, unknown> = {};
        for (const key of keys) {
          if (key in data) {
            result[key] = data[key];
          }
        }
        return result;
      }
      // If keys is object (with defaults) or null/undefined (all keys)
      return data;
    },
  );
}

/**
 * Mock helper: Simulate message response
 */
export function mockChromeMessage<T = unknown>(response: T) {
  const glob = globalThis as { chrome?: { runtime?: { sendMessage?: ReturnType<typeof vi.fn> } } };
  glob.chrome = glob.chrome || { runtime: { sendMessage: vi.fn() } };
  glob.chrome.runtime = glob.chrome.runtime || { sendMessage: vi.fn() };
  glob.chrome.runtime.sendMessage = glob.chrome.runtime.sendMessage || vi.fn();
  vi.mocked(glob.chrome.runtime.sendMessage).mockResolvedValue(response);
}

/**
 * Mock helper: Simulate message listener
 */
export function mockChromeMessageListener(
  _handler: (message: unknown, sender: Browser.Runtime.MessageSender, sendResponse: (response: unknown) => void) => boolean | void,
) {
  const glob = globalThis as { chrome?: { runtime?: { onMessage?: { addListener?: ReturnType<typeof vi.fn> } } } };
  glob.chrome = glob.chrome || { runtime: { onMessage: { addListener: vi.fn() } } };
  glob.chrome.runtime = glob.chrome.runtime || { onMessage: { addListener: vi.fn() } };
  glob.chrome.runtime.onMessage = glob.chrome.runtime.onMessage || { addListener: vi.fn() };
  glob.chrome.runtime.onMessage.addListener = glob.chrome.runtime.onMessage.addListener || vi.fn();
  vi.mocked(glob.chrome.runtime.onMessage.addListener).mockImplementation((listener: unknown) => {
    // Store listener for manual triggering if needed
    (global as Record<string, unknown>).__chromeMessageListener = listener;
  });
}

/**
 * Mock helper: Trigger message listener
 */
export async function triggerChromeMessage(message: unknown, sender: Browser.Runtime.MessageSender = {} as Browser.Runtime.MessageSender) {
  const listener = (global as Record<string, unknown>).__chromeMessageListener;
  if (listener === null || listener === undefined) {
    throw new Error('No message listener registered. Call mockChromeMessageListener first.');
  }

  return new Promise((resolve) => {
    const sendResponse = (response: unknown) => resolve(response);
    const result = (listener as (msg: unknown, snd: Browser.Runtime.MessageSender, resp: (r: unknown) => void) => boolean | void)(message, sender, sendResponse);

    // If handler returns true, it will send response asynchronously
    if (!result) {
      resolve(undefined);
    }
  });
}

/**
 * Mock helper: Set active tab
 */
export function mockActiveTab(tab: Partial<Browser.Tabs.Tab>) {
  const defaultTab: Browser.Tabs.Tab = {
    id: 1,
    index: 0,
    pinned: false,
    highlighted: false,
    windowId: 1,
    active: true,
    incognito: false,
    discarded: false,
    autoDiscardable: true,
    groupId: -1,
    url: 'https://claude.ai',
    title: 'Claude',
    ...tab,
  };

  const glob = globalThis as { chrome?: { tabs?: { query?: ReturnType<typeof vi.fn>; get?: ReturnType<typeof vi.fn> } } };
  glob.chrome = glob.chrome || { tabs: { query: vi.fn(), get: vi.fn() } };
  glob.chrome.tabs = glob.chrome.tabs || { query: vi.fn(), get: vi.fn() };
  glob.chrome.tabs.query = glob.chrome.tabs.query || vi.fn();
  glob.chrome.tabs.get = glob.chrome.tabs.get || vi.fn();
  vi.mocked(glob.chrome.tabs.query).mockResolvedValue([defaultTab]);
  vi.mocked(glob.chrome.tabs.get).mockResolvedValue(defaultTab);
}

/**
 * Mock helper: Clear all mocks
 */
export function clearAllChromeMocks() {
  vi.clearAllMocks();
}
