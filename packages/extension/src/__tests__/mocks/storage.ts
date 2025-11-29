/**
 * Chrome Storage Mock
 *
 * Provides in-memory implementation of chrome.storage.local for tests.
 * Supports get/set/remove/clear operations with proper isolation.
 *
 * Usage:
 * ```typescript
 * import { createMockStorage } from '@/__tests__/mocks/storage';
 *
 * const storage = createMockStorage();
 * await storage.set({ key: 'value' });
 * const result = await storage.get('key'); // { key: 'value' }
 * ```
 */

import { vi } from 'vitest';

/**
 * Creates an in-memory chrome.storage.local implementation
 *
 * Each test should create its own instance for isolation.
 *
 * @param initialData - Optional initial storage data
 * @returns Mock storage.local object
 *
 * @example
 * ```typescript
 * const storage = createMockStorage({ settings: { theme: 'dark' } });
 * const result = await storage.get('settings');
 * // result = { settings: { theme: 'dark' } }
 * ```
 */
export function createMockStorage(initialData: Record<string, unknown> = {}) {
  const data = new Map<string, unknown>(Object.entries(initialData));

  return {
    /**
     * Get one or more items from storage
     *
     * @param keys - String key, array of keys, object with defaults, or null for all
     * @returns Promise resolving to object with key-value pairs
     */
    get: vi.fn(async (keys?: string | string[] | Record<string, unknown> | null) => {
      if (keys === null || keys === undefined) {
        // Get all
        const result: Record<string, unknown> = {};
        data.forEach((value, key) => {
          result[key] = value;
        });
        return Promise.resolve(result);
      }

      if (typeof keys === 'string') {
        // Single key
        return Promise.resolve(
          data.has(keys) ? { [keys]: data.get(keys) } : {},
        );
      }

      if (Array.isArray(keys)) {
        // Multiple keys
        const result: Record<string, unknown> = {};
        for (const key of keys) {
          if (data.has(key)) {
            result[key] = data.get(key);
          }
        }
        return Promise.resolve(result);
      }

      // Object with defaults
      const result: Record<string, unknown> = {};
      for (const [key, defaultValue] of Object.entries(keys)) {
        result[key] = data.has(key) ? data.get(key) : defaultValue;
      }
      return Promise.resolve(result);
    }),

    /**
     * Set one or more items in storage
     *
     * @param items - Object with key-value pairs to set
     * @returns Promise resolving when complete
     */
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.entries(items).forEach(([key, value]) => {
        data.set(key, value);
      });
      return Promise.resolve();
    }),

    /**
     * Remove one or more items from storage
     *
     * @param keys - String key or array of keys to remove
     * @returns Promise resolving when complete
     */
    remove: vi.fn(async (keys: string | string[]) => {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach(key => data.delete(key));
      return Promise.resolve();
    }),

    /**
     * Clear all items from storage
     *
     * @returns Promise resolving when complete
     */
    clear: vi.fn(async () => {
      data.clear();
      return Promise.resolve();
    }),

    /**
     * Get bytes in use (mock always returns 0)
     */
    getBytesInUse: vi.fn(async () => Promise.resolve(0)),

    /**
     * onChanged listener mock
     */
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(() => false),
    },
  };
}

/**
 * Helper: Get current storage data (for debugging/assertions)
 *
 * @param storage - Mock storage instance
 * @returns Current storage contents as plain object
 */
export async function getStorageData(
  storage: ReturnType<typeof createMockStorage>,
): Promise<Record<string, unknown>> {
  return storage.get(null);
}

/**
 * Helper: Reset storage to initial state
 *
 * @param storage - Mock storage instance
 * @param newData - New initial data (default: empty)
 */
export async function resetStorage(
  storage: ReturnType<typeof createMockStorage>,
  newData: Record<string, unknown> = {},
) {
  await storage.clear();
  if (Object.keys(newData).length > 0) {
    await storage.set(newData);
  }
}
