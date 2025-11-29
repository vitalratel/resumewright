/**
 * LRU (Least Recently Used) Cache Implementation
 * 
 * Prevents unbounded memory growth by automatically evicting least recently used items.
 */

export interface LRUCacheOptions {
  /**
   * Maximum number of items to store
   */
  maxSize: number;
}

/**
 * Generic LRU Cache implementation
 * Automatically evicts least recently used items when capacity is reached
 */
export class LRUCache<K, V> {
  private readonly maxSize: number;
  private cache: Map<K, V>;
  private evictionCount: number = 0;

  constructor(options: LRUCacheOptions) {
    this.maxSize = options.maxSize;
    this.cache = new Map<K, V>();
  }

  /**
   * Get a value from the cache
   * Marks the item as recently used (moves to end)
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);

    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }

    return value;
  }

  /**
   * Set a value in the cache
   * Evicts oldest item if capacity is exceeded
   */
  set(key: K, value: V): void {
    // If key exists, delete it first so it gets moved to end
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    else if (this.cache.size >= this.maxSize) {
      // Evict oldest (first) item
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        this.evictionCount += 1;
      }
    }

    this.cache.set(key, value);
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a specific key from the cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
    this.evictionCount = 0;
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get maximum cache size
   */
  get capacity(): number {
    return this.maxSize;
  }

  /**
   * Get total number of evictions
   */
  get evictions(): number {
    return this.evictionCount;
  }

  /**
   * Get all keys in the cache (in LRU order)
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * Get all values in the cache (in LRU order)
   */
  values(): IterableIterator<V> {
    return this.cache.values();
  }

  /**
   * Get all entries in the cache (in LRU order)
   */
  entries(): IterableIterator<[K, V]> {
    return this.cache.entries();
  }
}
