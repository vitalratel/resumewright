/**
 * Font Repository Interface
 *
 * Domain interface for font data access.
 * Implementations provide font fetching, caching, and validation.
 *
 * @module Domain/Fonts/Repositories
 */

import type { FontStyle, FontWeight } from '../models/Font';

/**
 * Fetched font data with metadata
 */
export interface FetchedFont {
  /** Font family name */
  family: string;
  /** Font weight (100-900) */
  weight: FontWeight;
  /** Font style (normal, italic) */
  style: FontStyle;
  /** Font file binary data */
  bytes: Uint8Array;
}

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
 * Follows Repository pattern from Clean Architecture.
 */
export interface IFontRepository {
  /**
   * Fetch a Google Font by family, weight, and style
   *
   * @param family - Font family name
   * @param weight - Font weight (100-900)
   * @param style - Font style (normal, italic)
   * @returns Font binary data
   * @throws {Error} If font fetch fails
   */
  fetchGoogleFont: (family: string, weight: FontWeight, style: FontStyle) => Promise<Uint8Array>;

  /**
   * Get cached font if available
   *
   * @param family - Font family name
   * @param weight - Font weight
   * @param style - Font style
   * @returns Font binary data or null if not cached
   */
  getCachedFont: (family: string, weight: FontWeight, style: FontStyle) => Promise<Uint8Array | null>;

  /**
   * Cache font binary data
   *
   * @param family - Font family name
   * @param weight - Font weight
   * @param style - Font style
   * @param data - Font binary data
   */
  cacheFont: (family: string, weight: FontWeight, style: FontStyle, data: Uint8Array) => Promise<void>;

  /**
   * Get cache statistics
   *
   * @returns Cache stats (size, hits, misses)
   */
  getCacheStats: () => FontCacheStats;

  /**
   * Clear font cache
   */
  clearCache: () => void;
}
