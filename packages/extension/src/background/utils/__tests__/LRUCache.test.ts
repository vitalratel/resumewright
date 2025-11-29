/**
 * Tests for LRUCache
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LRUCache } from '../LRUCache';

describe('LRUCache', () => {
  let cache: LRUCache<string, string>;

  beforeEach(() => {
    cache = new LRUCache({ maxSize: 3 });
  });

  describe('Basic Operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should track size correctly', () => {
      expect(cache.size).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size).toBe(2);
    });

    it('should return capacity', () => {
      expect(cache.capacity).toBe(3);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict oldest item when capacity is exceeded', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Add 4th item - should evict key1
      cache.set('key4', 'value4');

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
      expect(cache.size).toBe(3);
      expect(cache.evictions).toBe(1);

      consoleSpy.mockRestore();
    });

    it('should track eviction count', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.evictions).toBe(0);

      cache.set('key4', 'value4');
      expect(cache.evictions).toBe(1);

      cache.set('key5', 'value5');
      expect(cache.evictions).toBe(2);

      consoleSpy.mockRestore();
    });
  });

  describe('LRU Ordering', () => {
    it('should move accessed items to end', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Access key1 - moves it to end
      cache.get('key1');

      // Add key4 - should evict key2 (oldest), not key1
      cache.set('key4', 'value4');

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle maxSize of 1', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const smallCache = new LRUCache<string, string>({ maxSize: 1 });

      smallCache.set('key1', 'value1');
      expect(smallCache.size).toBe(1);

      smallCache.set('key2', 'value2');
      expect(smallCache.size).toBe(1);
      expect(smallCache.has('key1')).toBe(false);
      expect(smallCache.has('key2')).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should work with number keys and complex values', () => {
      const complexCache = new LRUCache<number, { data: string }>({ maxSize: 3 });

      complexCache.set(1, { data: 'one' });
      complexCache.set(2, { data: 'two' });

      expect(complexCache.get(1)).toEqual({ data: 'one' });
      expect(complexCache.get(2)).toEqual({ data: 'two' });
    });
  });
});
