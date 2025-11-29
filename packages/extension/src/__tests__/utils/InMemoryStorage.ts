/**
 * In-Memory Storage Mock
 *
 * Real implementation of browser.storage API for testing.
 * Follows the SimpleLRUCache pattern from validationCache.test.ts.
 *
 * Benefits over vi.fn() mocks:
 * - Tests real storage behavior (set → get → remove lifecycle)
 * - Better integration test confidence
 * - Easier to debug test failures
 * - Single source of truth for test storage state
 */

/**
 * In-memory implementation of browser.storage.local API
 *
 * Provides a real Map-based storage that behaves like browser.storage.local
 * but runs entirely in memory for fast, deterministic tests.
 *
 * @example
 * ```typescript
 * const storage = new InMemoryStorage();
 *
 * await storage.set({ key: 'value' });
 * const result = await storage.get('key');
 * expect(result).toEqual({ key: 'value' });
 * ```
 */
export class InMemoryStorage {
  private data = new Map<string, unknown>();

  /**
   * Get one or more items from storage
   * @param keys - Single key or array of keys
   * @returns Promise resolving to object with key-value pairs
   */
  async get(keys: string | string[] | null): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

    if (keys === null || keys === undefined) {
      // Get all items
      this.data.forEach((value, key) => {
        result[key] = value;
      });
    }
    else {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      keyArray.forEach((key) => {
        if (this.data.has(key)) {
          result[key] = this.data.get(key);
        }
      });
    }

    return result;
  }

  /**
   * Set one or more items in storage
   * @param items - Object with key-value pairs to store
   * @returns Promise resolving when complete
   */
  async set(items: Record<string, unknown>): Promise<void> {
    Object.entries(items).forEach(([key, value]) => {
      this.data.set(key, value);
    });
  }

  /**
   * Remove one or more items from storage
   * @param keys - Single key or array of keys to remove
   * @returns Promise resolving when complete
   */
  async remove(keys: string | string[]): Promise<void> {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    keyArray.forEach(key => this.data.delete(key));
  }

  /**
   * Clear all items from storage
   * @returns Promise resolving when complete
   */
  async clear(): Promise<void> {
    this.data.clear();
  }

  /**
   * Get the number of items in storage
   * @returns Number of stored items
   */
  get size(): number {
    return this.data.size;
  }

  /**
   * Check if a key exists in storage
   * @param key - Key to check
   * @returns True if key exists
   */
  has(key: string): boolean {
    return this.data.has(key);
  }

  /**
   * Get all keys in storage
   * @returns Array of all keys
   */
  keys(): string[] {
    return Array.from(this.data.keys());
  }

  /**
   * Get the underlying Map for advanced test scenarios
   * @returns Internal Map instance
   */
  getInternalMap(): Map<string, unknown> {
    return this.data;
  }
}

/**
 * Create a browser.storage mock with InMemoryStorage
 *
 * @example
 * ```typescript
 * vi.mock('webextension-polyfill', () => ({
 *   default: createBrowserStorageMock()
 * }));
 * ```
 */
export function createBrowserStorageMock() {
  const localStorage = new InMemoryStorage();
  const syncStorage = new InMemoryStorage();

  return {
    storage: {
      local: localStorage,
      sync: syncStorage,
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn(),
      },
    },
    runtime: {
      lastError: undefined,
    },
  };
}
