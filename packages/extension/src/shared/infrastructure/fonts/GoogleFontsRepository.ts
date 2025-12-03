/**
 * Google Fonts Repository
 *
 * Infrastructure implementation of IFontRepository for Google Fonts API.
 * Provides font fetching, caching, and validation following Clean Architecture.
 *
 * @module Infrastructure/Fonts
 */

import type { FontCacheStats, IFontRepository } from '../../domain/fonts/IFontRepository';
import type { FontStyle, FontWeight } from '../../domain/fonts/types';
import { getLogger } from '../logging';
import type { IRetryPolicy } from '../retry/ExponentialBackoffRetryPolicy';
import { ExponentialBackoffRetryPolicy } from '../retry/ExponentialBackoffRetryPolicy';

/**
 * Cached font data with LRU tracking
 */
interface CachedFont {
  bytes: Uint8Array;
  timestamp: number;
  hits: number;
  size: number;
}

/**
 * Font format detected from CSS
 */
type FontFormat = 'ttf' | 'woff2';

/**
 * Result of font URL extraction
 */
interface FontUrlInfo {
  url: string;
  format: FontFormat;
}

/**
 * Font fetch error types
 */
export enum FontFetchErrorType {
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  NOT_FOUND = 'NOT_FOUND',
}

/**
 * Font fetch error
 */
export class FontFetchError extends Error {
  constructor(
    public type: FontFetchErrorType,
    public fontFamily: string,
    message: string,
  ) {
    super(message);
    this.name = 'FontFetchError';
  }
}

/**
 * Google Fonts Repository
 *
 * Implements IFontRepository for Google Fonts API with:
 * - In-memory LRU cache
 * - 30-second timeout with retry logic
 * - WOFF2 decompression support
 * - Comprehensive error handling
 */
export class GoogleFontsRepository implements IFontRepository {
  /** In-memory font cache with LRU eviction */
  private readonly fontCache = new Map<string, CachedFont>();

  /** Maximum number of fonts to cache */
  private readonly maxCachedFonts = 20; // ~4MB max cache size

  /** Cache TTL in milliseconds */
  private readonly cacheTtlMs = 3600000; // 1 hour

  /** Font fetch timeout in milliseconds */
  private readonly fetchTimeoutMs = 30000; // 30 seconds

  /** Retry policy for network operations */
  private readonly retryPolicy: IRetryPolicy;

  constructor(retryPolicy?: IRetryPolicy) {
    // Use network preset by default (optimized for font fetching)
    this.retryPolicy = retryPolicy || ExponentialBackoffRetryPolicy.presets.network;
  }

  /**
   * Fetch a Google Font by family, weight, and style
   */
  async fetchGoogleFont(family: string, weight: FontWeight, style: FontStyle): Promise<Uint8Array> {
    const cacheKey = this.getCacheKey(family, weight, style);

    // Check cache first
    const cached = await this.getCachedFont(family, weight, style);
    if (cached) {
      return cached;
    }

    getLogger().debug('GoogleFontsRepository', `Fetching: ${family} ${weight} ${style}`);

    try {
      // Step 1: Fetch CSS from Google Fonts API
      const apiUrl = this.buildApiUrl(family, weight, style);
      const cssResponse = await this.retryPolicy.execute(async () => {
        const response = await fetch(apiUrl, {
          signal: AbortSignal.timeout(this.fetchTimeoutMs),
        });

        if (!response.ok) {
          throw new FontFetchError(
            FontFetchErrorType.NOT_FOUND,
            family,
            `Google Fonts API returned ${response.status} for ${family}`,
          );
        }

        return response;
      });

      const cssText = await cssResponse.text();

      // Step 2: Parse CSS to extract font URL
      const fontInfo = this.extractFontUrl(cssText);
      if (!fontInfo) {
        throw new FontFetchError(
          FontFetchErrorType.PARSE_ERROR,
          family,
          `Failed to extract font URL from CSS for ${family}`,
        );
      }

      // Step 3: Fetch font file
      const fontResponse = await this.retryPolicy.execute(async () => {
        const response = await fetch(fontInfo.url, {
          signal: AbortSignal.timeout(this.fetchTimeoutMs),
        });

        if (!response.ok) {
          throw new FontFetchError(
            FontFetchErrorType.NETWORK_ERROR,
            family,
            `Failed to download font file: ${response.status}`,
          );
        }

        return response;
      });

      // Step 4: Convert to Uint8Array and decompress if needed
      const arrayBuffer = await fontResponse.arrayBuffer();
      let fontBytes: Uint8Array<ArrayBufferLike> | Uint8Array<ArrayBuffer> = new Uint8Array(
        arrayBuffer,
      );

      // Decompress WOFF2 to TrueType using Rust WASM
      if (fontInfo.format === 'woff2') {
        fontBytes = await this.decompressWoff2(fontBytes, family);
      }

      // Cache the result
      await this.cacheFont(family, weight, style, fontBytes);

      getLogger().debug(
        'GoogleFontsRepository',
        `Fetched ${fontBytes.length} bytes for ${cacheKey} (cache: ${this.fontCache.size}/${this.maxCachedFonts})`,
      );

      return fontBytes;
    } catch (error) {
      this.handleFetchError(error, family);
    }
  }

  /**
   * Get cached font if available
   */
  async getCachedFont(
    family: string,
    weight: FontWeight,
    style: FontStyle,
  ): Promise<Uint8Array | null> {
    const cacheKey = this.getCacheKey(family, weight, style);
    const cached = this.fontCache.get(cacheKey);

    if (!cached) {
      return null;
    }

    // Check TTL
    if (Date.now() - cached.timestamp >= this.cacheTtlMs) {
      getLogger().debug('GoogleFontsRepository', `Cache expired: ${cacheKey}`);
      this.fontCache.delete(cacheKey);
      return null;
    }

    cached.hits += 1;
    getLogger().debug(
      'GoogleFontsRepository',
      `Cache hit: ${cacheKey} (${cached.hits} hits, ${cached.size} bytes)`,
    );

    return cached.bytes;
  }

  /**
   * Cache font binary data
   */
  async cacheFont(
    family: string,
    weight: FontWeight,
    style: FontStyle,
    data: Uint8Array,
  ): Promise<void> {
    const cacheKey = this.getCacheKey(family, weight, style);

    this.fontCache.set(cacheKey, {
      bytes: data,
      timestamp: Date.now(),
      hits: 1,
      size: data.length,
    });

    // Evict LRU if cache is full
    this.evictLRU();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): FontCacheStats {
    return {
      size: this.fontCache.size,
      maxSize: this.maxCachedFonts,
      hits: Array.from(this.fontCache.values()).reduce((sum, font) => sum + font.hits, 0),
    };
  }

  /**
   * Clear font cache
   */
  clearCache(): void {
    const count = this.fontCache.size;
    this.fontCache.clear();
    getLogger().debug('GoogleFontsRepository', `Cleared ${count} fonts`);
  }

  /**
   * Generate cache key for a font variant
   */
  private getCacheKey(family: string, weight: FontWeight, style: FontStyle): string {
    return `${family}-${weight}-${style}`;
  }

  /**
   * Build Google Fonts API URL
   */
  private buildApiUrl(family: string, weight: FontWeight, style: FontStyle): string {
    const encodedFamily = encodeURIComponent(family);
    const baseUrl = 'https://fonts.googleapis.com/css2';

    if (style === 'italic') {
      return `${baseUrl}?family=${encodedFamily}:ital,wght@1,${weight}&display=swap`;
    } else {
      return `${baseUrl}?family=${encodedFamily}:wght@${weight}&display=swap`;
    }
  }

  /**
   * Extract font URL from Google Fonts CSS
   */
  private extractFontUrl(cssText: string): FontUrlInfo | null {
    // Try TrueType first (best for PDFs)
    const ttfMatch = cssText.match(/url\((https:\/\/[^)]+\.ttf)\)/);
    if (ttfMatch) {
      return { url: ttfMatch[1], format: 'ttf' };
    }

    // Fall back to WOFF2 (requires decompression)
    const woff2Match = cssText.match(/url\((https:\/\/[^)]+\.woff2)\)/);
    if (woff2Match) {
      return { url: woff2Match[1], format: 'woff2' };
    }

    return null;
  }

  /**
   * Decompress WOFF2 to TrueType
   */
  private async decompressWoff2(fontBytes: Uint8Array, family: string): Promise<Uint8Array> {
    try {
      getLogger().debug(
        'GoogleFontsRepository',
        `Decompressing WOFF2: ${family} (${fontBytes.length} bytes)`,
      );

      const wasmModule = await import('@pkg/wasm_bridge');
      const decompressed = new Uint8Array(wasmModule.decompress_woff2_font(fontBytes));

      getLogger().info(
        'GoogleFontsRepository',
        `WOFF2 decompressed: ${family} ${fontBytes.length} → ${decompressed.length} bytes`,
      );

      return decompressed;
    } catch (error) {
      throw new FontFetchError(
        FontFetchErrorType.PARSE_ERROR,
        family,
        `WOFF2 decompression failed for ${family}: ${String(error)}`,
      );
    }
  }

  /**
   * Evict least recently used fonts
   */
  private evictLRU(): void {
    if (this.fontCache.size <= this.maxCachedFonts) {
      return;
    }

    const sorted = Array.from(this.fontCache.entries()).sort(([, a], [, b]) => a.hits - b.hits);

    const toEvict = sorted.slice(0, this.fontCache.size - this.maxCachedFonts);

    for (const [key] of toEvict) {
      getLogger().debug(
        'GoogleFontsRepository',
        `Evicting ${key} (${this.fontCache.get(key)?.hits} hits)`,
      );
      this.fontCache.delete(key);
    }
  }

  /**
   * Handle fetch errors with proper error types
   */
  private handleFetchError(error: unknown, family: string): never {
    if (error instanceof FontFetchError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new FontFetchError(
        FontFetchErrorType.NETWORK_TIMEOUT,
        family,
        `Timeout fetching font ${family} (exceeded 30 seconds). Consider using a web-safe font.`,
      );
    }

    if (error instanceof TypeError) {
      throw new FontFetchError(
        FontFetchErrorType.NETWORK_ERROR,
        family,
        `Network error fetching font ${family}: ${error.message}`,
      );
    }

    throw new FontFetchError(
      FontFetchErrorType.NETWORK_ERROR,
      family,
      `Unknown error fetching font ${family}: ${String(error)}`,
    );
  }
}
