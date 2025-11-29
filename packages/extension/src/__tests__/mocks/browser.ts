/**
 * Consolidated webextension-polyfill Mock
 *
 * This module provides a standardized mock for webextension-polyfill
 * used across 19+ test files. Consolidates browser API mocking patterns.
 *
 * Usage:
 * ```typescript
 * import { mockBrowser } from '@/__tests__/mocks/browser';
 *
 * vi.mock('webextension-polyfill', () => mockBrowser());
 *
 * // Or with custom overrides:
 * vi.mock('webextension-polyfill', () => mockBrowser({
 *   runtime: { id: 'custom-id' }
 * }));
 * ```
 */

import { vi } from 'vitest';
// import type { Browser } from 'webextension-polyfill'; // Unused

export interface MockBrowserOptions {
  runtime?: Record<string, unknown>;
  storage?: {
    local?: Record<string, unknown>;
  };
  tabs?: Record<string, unknown>;
  downloads?: Record<string, unknown>;
}

/**
 * Creates a complete webextension-polyfill mock with sensible defaults
 *
 * @param overrides - Custom implementations for specific APIs
 * @returns Mock object suitable for vi.mock('webextension-polyfill')
 *
 * @example
 * ```typescript
 * // Basic usage
 * vi.mock('webextension-polyfill', () => mockBrowser());
 *
 * // With custom storage data
 * vi.mock('webextension-polyfill', () => mockBrowser({
 *   storage: {
 *     local: {
 *       get: vi.fn().mockResolvedValue({ key: 'value' })
 *     }
 *   }
 * }));
 * ```
 */
export function mockBrowser(overrides?: MockBrowserOptions) {
  return {
    default: {
      runtime: {
        getManifest: () => ({
          name: 'ResumeWright',
          version: '1.0.0-test',
          manifest_version: 3,
        }),
        sendMessage: vi.fn().mockResolvedValue(undefined),
        onMessage: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
          hasListener: vi.fn(() => false),
        },
        onInstalled: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
        onStartup: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
        reload: vi.fn(),
        id: 'test-extension-id',
        getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
        lastError: undefined,
        ...overrides?.runtime,
      },
      storage: {
        local: {
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn().mockResolvedValue(undefined),
          remove: vi.fn().mockResolvedValue(undefined),
          clear: vi.fn().mockResolvedValue(undefined),
          onChanged: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
          },
          ...overrides?.storage?.local,
        },
      },
      tabs: {
        query: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue({
          id: 1,
          url: 'https://claude.ai',
          title: 'Claude',
          active: true,
        }),
        sendMessage: vi.fn().mockResolvedValue(undefined),
        onUpdated: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
        ...overrides?.tabs,
      },
      downloads: {
        download: vi.fn().mockResolvedValue(1),
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
        ...overrides?.downloads,
      },
    },
  };
}

/**
 * Creates a minimal browser mock (only runtime.sendMessage)
 * Use for tests that only need message passing
 */
export function mockBrowserMinimal() {
  return {
    default: {
      runtime: {
        sendMessage: vi.fn().mockResolvedValue(undefined),
      },
    },
  };
}

/**
 * Helper: Mock chrome.storage.local.get with specific data
 *
 * @param browserMock - The mocked browser object
 * @param data - Data to return from storage.local.get
 *
 * @example
 * ```typescript
 * const mock = mockBrowser();
 * mockStorageGet(mock, { settings: { theme: 'dark' } });
 * ```
 */
export function mockStorageGet(
  browserMock: ReturnType<typeof mockBrowser>,
  data: Record<string, unknown>,
) {
  const mockGet = vi.fn(async (_keys: string | string[] | Record<string, unknown> | null | undefined) => {
    if (typeof _keys === 'string') {
      return Promise.resolve({ [_keys]: data[_keys] });
    }
    if (Array.isArray(_keys)) {
      const result: Record<string, unknown> = {};
      for (const key of _keys) {
        if (key in data) {
          result[key] = data[key];
        }
      }
      return Promise.resolve(result);
    }
    // If keys is object (with defaults) or null/undefined (all keys)
    return Promise.resolve(data);
  });

  browserMock.default.storage.local.get = mockGet;
  return browserMock;
}

/**
 * Helper: Create in-memory chrome.storage.local implementation
 * Useful for integration tests that need persistent storage across operations
 */
export function createInMemoryStorage() {
  const storage = new Map<string, unknown>();

  return {
    get: vi.fn(async (keys) => {
      if (typeof keys === 'string') {
        return Promise.resolve(
          storage.has(keys) ? { [keys]: storage.get(keys) } : {},
        );
      }
      if (Array.isArray(keys)) {
        const result: Record<string, unknown> = {};
        for (const key of keys) {
          if (storage.has(key)) {
            result[key] = storage.get(key);
          }
        }
        return Promise.resolve(result);
      }
      // Return all
      const result: Record<string, unknown> = {};
      storage.forEach((value, key) => {
        result[key] = value;
      });
      return Promise.resolve(result);
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.entries(items).forEach(([key, value]) => {
        storage.set(key, value);
      });
      return Promise.resolve();
    }),
    remove: vi.fn(async (keys: string | string[]) => {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach(key => storage.delete(key));
      return Promise.resolve();
    }),
    clear: vi.fn(async () => {
      storage.clear();
      return Promise.resolve();
    }),
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  };
}
