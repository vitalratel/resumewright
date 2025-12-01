/**
 * Storage Validation Tests
 * Test validated storage operations
 * Comprehensive tests for all storage operations
 * Target: >85% coverage
 *
 * Refactored to use InMemoryStorage for real implementation testing
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { array, boolean, null_, number, object, optional, picklist, string } from '@/shared/domain/validation/valibot';
import {
  getMultipleValidatedStorage,
  getValidatedStorage,
  removeFromStorage,
  setValidatedStorage,
} from './validation';

// Mock webextension-polyfill with real InMemoryStorage
// InMemoryStorage must be defined inline to avoid hoisting issues
const { localStorage } = vi.hoisted(() => {
  // Inline InMemoryStorage implementation
  class InMemoryStorage {
    private data = new Map<string, unknown>();

    async get(keys: string | string[] | null): Promise<Record<string, unknown>> {
      const result: Record<string, unknown> = {};
      if (keys === null || keys === undefined) {
        this.data.forEach((value, key) => { result[key] = value; });
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

    async set(items: Record<string, unknown>): Promise<void> {
      Object.entries(items).forEach(([key, value]) => {
        this.data.set(key, value);
      });
    }

    async remove(keys: string | string[]): Promise<void> {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      keyArray.forEach(key => this.data.delete(key));
    }

    async clear(): Promise<void> {
      this.data.clear();
    }

    get size(): number {
      return this.data.size;
    }

    has(key: string): boolean {
      return this.data.has(key);
    }

    keys(): string[] {
      return Array.from(this.data.keys());
    }

    getInternalMap(): Map<string, unknown> {
      return this.data;
    }
  }

  return { localStorage: new InMemoryStorage() };
});

vi.mock('wxt/browser', () => ({
  browser: {
    storage: {
      local: localStorage,
    },
  },
}));

// Mock console to avoid test output pollution
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Storage Validation', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.getInternalMap().clear();
  });

  describe('getValidatedStorage', () => {
    it('should return validated data when valid', async () => {
      const schema = object({ name: string(), age: number() });
      const validData = { name: 'John', age: 30 };

      // Use real storage: set data then get it
      await localStorage.set({ testKey: validData });

      const result = await getValidatedStorage('testKey', schema);

      expect(result).toEqual(validData);
    });

    it('should return null and remove invalid data', async () => {
      const schema = object({ name: string(), age: number() });
      const invalidData = { name: 'John', age: 'thirty' }; // age should be number

      // Use real storage: set invalid data
      await localStorage.set({ testKey: invalidData });

      const result = await getValidatedStorage('testKey', schema);

      expect(result).toBeNull();
      // Verify invalid data was removed from storage
      expect(localStorage.has('testKey')).toBe(false);
    });

    it('should return null when key not found', async () => {
      const schema = string();

      // Don't set anything - key doesn't exist

      const result = await getValidatedStorage('nonexistent', schema);

      expect(result).toBeNull();
      // Storage size should still be 0
      expect(localStorage.size).toBe(0);
    });

    it('should return null for undefined value', async () => {
      const schema = string();

      // Explicitly set undefined
      await localStorage.set({ key: undefined });

      const result = await getValidatedStorage('key', schema);

      expect(result).toBeNull();
    });

    it('should return null for null value', async () => {
      const schema = string();

      // Set null value
      await localStorage.set({ key: null });

      const result = await getValidatedStorage('key', schema);

      expect(result).toBeNull();
    });

    it('should validate primitive string types', async () => {
      const schema = string();

      await localStorage.set({ text: 'hello' });

      const result = await getValidatedStorage('text', schema);

      expect(result).toBe('hello');
    });

    it('should validate number types', async () => {
      const schema = number();

      await localStorage.set({ count: 42 });

      const result = await getValidatedStorage('count', schema);

      expect(result).toBe(42);
    });

    it('should validate boolean types', async () => {
      const schema = boolean();

      await localStorage.set({ flag: true });

      const result = await getValidatedStorage('flag', schema);

      expect(result).toBe(true);
    });

    it('should validate array types', async () => {
      const schema = array(string());

      await localStorage.set({ items: ['a', 'b', 'c'] });

      const result = await getValidatedStorage('items', schema);

      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should validate nested objects', async () => {
      const schema = object({
        user: object({
          name: string(),
          address: object({
            city: string(),
          }),
        }),
      });

      const data = {
        user: {
          name: 'John',
          address: { city: 'NYC' },
        },
      };

      await localStorage.set({ data });

      const result = await getValidatedStorage('data', schema);

      expect(result).toEqual(data);
    });

    it('should handle storage access errors', async () => {
      const schema = string();

      // Temporarily break storage to simulate error
      const originalGet = localStorage.get.bind(localStorage);
      localStorage.get = vi.fn().mockRejectedValue(new Error('Storage error'));

      const result = await getValidatedStorage('key', schema);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();

      // Restore
      localStorage.get = originalGet;
    });

    it('should log validation errors to console', async () => {
      const schema = object({ name: string() });

      await localStorage.set({ user: { name: 123 } });

      await getValidatedStorage('user', schema);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Validation failed'),
        expect.any(String),
      );
    });

    it('should validate enum types', async () => {
      const schema = picklist(['light', 'dark']);

      await localStorage.set({ theme: 'dark' });

      const result = await getValidatedStorage('theme', schema);

      expect(result).toBe('dark');
    });

    it('should reject invalid enum values', async () => {
      const schema = picklist(['light', 'dark']);

      await localStorage.set({ theme: 'blue' });

      const result = await getValidatedStorage('theme', schema);

      expect(result).toBeNull();
      // Verify invalid data was removed
      expect(localStorage.has('theme')).toBe(false);
    });
  });

  describe('setValidatedStorage', () => {
    it('should store valid data', async () => {
      const schema = object({ name: string() });
      const validData = { name: 'Alice' };

      const result = await setValidatedStorage('testKey', validData, schema);

      expect(result).toBe(true);
      // Verify data was actually stored
      const stored = await localStorage.get('testKey');
      expect(stored).toEqual({ testKey: validData });
    });

    it('should reject invalid data', async () => {
      const schema = object({ name: string() });
      const invalidData = { name: 123 } as unknown; // name should be string

      const result = await setValidatedStorage('testKey', invalidData, schema);

      expect(result).toBe(false);
      // Verify nothing was stored
      expect(localStorage.size).toBe(0);
    });

    it('should store primitive types', async () => {
      const schema = string();

      const result = await setValidatedStorage('text', 'hello', schema);

      expect(result).toBe(true);
      const stored = await localStorage.get('text');
      expect(stored).toEqual({ text: 'hello' });
    });

    it('should store number types', async () => {
      const schema = number();

      const result = await setValidatedStorage('count', 42, schema);

      expect(result).toBe(true);
      const stored = await localStorage.get('count');
      expect(stored).toEqual({ count: 42 });
    });

    it('should store boolean types', async () => {
      const schema = boolean();

      const result = await setValidatedStorage('flag', false, schema);

      expect(result).toBe(true);
      const stored = await localStorage.get('flag');
      expect(stored).toEqual({ flag: false });
    });

    it('should store array types', async () => {
      const schema = array(string());

      const result = await setValidatedStorage('items', ['a', 'b'], schema);

      expect(result).toBe(true);
      const stored = await localStorage.get('items');
      expect(stored).toEqual({ items: ['a', 'b'] });
    });

    it('should store null values with correct schema', async () => {
      const schema = null_();

      const result = await setValidatedStorage('nullable', null, schema);

      expect(result).toBe(true);
      const stored = await localStorage.get('nullable');
      expect(stored).toEqual({ nullable: null });
    });

    it('should handle storage write errors', async () => {
      const schema = string();

      // Temporarily break storage to simulate error
      const originalSet = localStorage.set.bind(localStorage);
      localStorage.set = vi.fn().mockRejectedValue(new Error('Storage error'));

      const result = await setValidatedStorage('key', 'value', schema);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();

      // Restore
      localStorage.set = originalSet;
    });

    it('should log validation errors to console', async () => {
      const schema = object({ name: string() });

      await setValidatedStorage('user', { name: 123 } as never, schema);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Validation failed'),
        expect.any(String),
      );
    });

    it('should store complex nested data', async () => {
      const schema = object({
        config: object({
          theme: picklist(['light', 'dark']),
          settings: object({
            fontSize: number(),
          }),
        }),
      });

      const data = {
        config: {
          theme: 'light' as const,
          settings: { fontSize: 14 },
        },
      };

      const result = await setValidatedStorage('appConfig', data, schema);

      expect(result).toBe(true);
      const stored = await localStorage.get('appConfig');
      expect(stored).toEqual({ appConfig: data });
    });
  });

  describe('getMultipleValidatedStorage', () => {
    it('should return validated data for multiple keys', async () => {
      const schemas = {
        key1: string(),
        key2: number(),
        key3: boolean(),
      };

      const storageData = {
        key1: 'hello',
        key2: 42,
        key3: true,
      };

      await localStorage.set(storageData);

      const result = await getMultipleValidatedStorage(schemas);

      expect(result).toEqual(storageData);
    });

    it('should exclude invalid keys and remove them', async () => {
      const schemas = {
        key1: string(),
        key2: number(),
      };

      const storageData = {
        key1: 'hello',
        key2: 'invalid', // should be number
      };

      await localStorage.set(storageData);

      const result = await getMultipleValidatedStorage(schemas);

      expect(result).toEqual({ key1: 'hello' });
      // Verify invalid key was removed
      expect(localStorage.has('key2')).toBe(false);
    });

    it('should skip missing keys', async () => {
      const schemas = {
        key1: string(),
        key2: number(),
        missing: string(),
      };

      const storageData = {
        key1: 'hello',
        key2: 42,
      };

      await localStorage.set(storageData);

      const result = await getMultipleValidatedStorage(schemas);

      expect(result).toEqual({ key1: 'hello', key2: 42 });
      expect(result).not.toHaveProperty('missing');
    });

    it('should skip null values', async () => {
      const schemas = {
        key1: string(),
        nullable: string(),
      };

      const storageData = {
        key1: 'hello',
        nullable: null,
      };

      await localStorage.set(storageData);

      const result = await getMultipleValidatedStorage(schemas);

      expect(result).toEqual({ key1: 'hello' });
    });

    it('should skip undefined values', async () => {
      const schemas = {
        key1: string(),
        undefined: string(),
      };

      const storageData = {
        key1: 'hello',
        undefined,
      };

      await localStorage.set(storageData);

      const result = await getMultipleValidatedStorage(schemas);

      expect(result).toEqual({ key1: 'hello' });
    });

    it('should handle empty schemas', async () => {
      const result = await getMultipleValidatedStorage({});

      expect(result).toEqual({});
    });

    it('should handle all invalid keys', async () => {
      const schemas = {
        key1: string(),
        key2: number(),
      };

      const storageData = {
        key1: 123, // Invalid
        key2: 'invalid', // Invalid
      };

      await localStorage.set(storageData);

      const result = await getMultipleValidatedStorage(schemas);

      expect(result).toEqual({});
      // Verify both invalid keys were removed
      expect(localStorage.size).toBe(0);
    });

    it('should handle storage access errors', async () => {
      const schemas = { key: string() };

      // Temporarily break storage to simulate error
      const originalGet = localStorage.get.bind(localStorage);
      localStorage.get = vi.fn().mockRejectedValue(new Error('Storage error'));

      const result = await getMultipleValidatedStorage(schemas);

      expect(result).toEqual({});
      expect(console.error).toHaveBeenCalled();

      // Restore
      localStorage.get = originalGet;
    });

    it('should validate complex nested schemas', async () => {
      const schemas = {
        config: object({
          theme: picklist(['light', 'dark']),
          fontSize: number(),
        }),
        settings: object({
          enabled: boolean(),
        }),
      };

      const storageData = {
        config: { theme: 'light', fontSize: 14 },
        settings: { enabled: true },
      };

      await localStorage.set(storageData);

      const result = await getMultipleValidatedStorage(schemas);

      expect(result).toEqual(storageData);
    });

    it('should log validation errors for each invalid key', async () => {
      const schemas = {
        key1: string(),
        key2: number(),
      };

      const storageData = {
        key1: 123,
        key2: 'invalid',
      };

      await localStorage.set(storageData);

      await getMultipleValidatedStorage(schemas);

      expect(console.error).toHaveBeenCalledTimes(2);
    });
  });

  describe('removeFromStorage', () => {
    it('should remove single key', async () => {
      await localStorage.set({ key: 'value' });

      await removeFromStorage('key');

      expect(localStorage.has('key')).toBe(false);
    });

    it('should remove multiple keys', async () => {
      await localStorage.set({ key1: 'v1', key2: 'v2', key3: 'v3' });

      await removeFromStorage(['key1', 'key2', 'key3']);

      expect(localStorage.size).toBe(0);
    });

    it('should handle removal of non-existent keys', async () => {
      await removeFromStorage('nonexistent');

      // Should not throw, storage remains empty
      expect(localStorage.size).toBe(0);
    });

    it('should handle storage removal errors', async () => {
      // Temporarily break storage to simulate error
      const originalRemove = localStorage.remove.bind(localStorage);
      localStorage.remove = vi.fn().mockRejectedValue(new Error('Storage error'));

      await removeFromStorage('key');

      expect(console.error).toHaveBeenCalled();

      // Restore
      localStorage.remove = originalRemove;
    });

    it('should not throw on error', async () => {
      // Temporarily break storage to simulate error
      const originalRemove = localStorage.remove.bind(localStorage);
      localStorage.remove = vi.fn().mockRejectedValue(new Error('Storage error'));

      await expect(removeFromStorage('key')).resolves.toBeUndefined();

      // Restore
      localStorage.remove = originalRemove;
    });

    it('should remove empty array of keys', async () => {
      await localStorage.set({ key: 'value' });

      await removeFromStorage([]);

      // Storage should remain unchanged
      expect(localStorage.size).toBe(1);
    });
  });

  describe('integration scenarios', () => {
    it('should handle set and get workflow', async () => {
      const schema = object({ name: string() });
      const data = { name: 'Test' };

      // Set data
      const setResult = await setValidatedStorage('test', data, schema);
      expect(setResult).toBe(true);

      // Get data
      const result = await getValidatedStorage('test', schema);
      expect(result).toEqual(data);
    });

    it('should handle set, get, and remove workflow', async () => {
      const schema = string();

      // Set
      await setValidatedStorage('key', 'value', schema);

      // Get
      const result = await getValidatedStorage('key', schema);
      expect(result).toBe('value');

      // Remove
      await removeFromStorage('key');
      expect(localStorage.has('key')).toBe(false);
    });

    it('should handle schema evolution', async () => {
      // Store with old schema
      const oldSchema = object({ name: string() });
      const data = { name: 'John' };

      await setValidatedStorage('user', data, oldSchema);

      // Retrieve with new schema (additional optional field)
      const newSchema = object({
        name: string(),
        age: optional(number()),
      });
      const result = await getValidatedStorage('user', newSchema);

      expect(result).toEqual({ name: 'John' });
    });
  });
});
