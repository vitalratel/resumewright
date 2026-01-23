// ABOUTME: Domain interface for font data access.
// ABOUTME: Implementations provide font fetching, caching, and validation.

import type { AsyncResult, FontError } from '../../errors/result';
import type { FontStyle, FontWeight } from './types';

/**
 * Font cache statistics
 */
export interface FontCacheStats {
  /** Number of fonts in cache */
  size: number;
  /** Maximum cache capacity */
  maxSize: number;
  /** Number of cache hits */
  hits?: number;
  /** Number of cache misses */
  misses?: number;
}

/**
 * Font Repository Interface
 *
 * Abstracts font data access from various sources (Google Fonts, custom fonts, cache).
 */
export interface IFontRepository {
  /**
   * Fetch a Google Font by family, weight, and style.
   * Returns Result with font bytes on success, or FontError on failure.
   */
  fetchGoogleFont: (
    family: string,
    weight: FontWeight,
    style: FontStyle,
  ) => AsyncResult<Uint8Array, FontError>;

  /**
   * Get cached font if available
   */
  getCachedFont: (
    family: string,
    weight: FontWeight,
    style: FontStyle,
  ) => Promise<Uint8Array | null>;

  /**
   * Cache font binary data
   */
  cacheFont: (
    family: string,
    weight: FontWeight,
    style: FontStyle,
    data: Uint8Array,
  ) => Promise<void>;

  /**
   * Get cache statistics
   */
  getCacheStats: () => FontCacheStats;

  /**
   * Clear font cache
   */
  clearCache: () => void;
}
