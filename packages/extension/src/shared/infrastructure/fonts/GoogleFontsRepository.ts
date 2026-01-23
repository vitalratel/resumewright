// ABOUTME: Google Fonts Repository - Infrastructure implementation of IFontRepository.
// ABOUTME: Provides font fetching with LRU caching, WOFF2 decompression, and retry logic.

import type { FontCacheStats, IFontRepository } from '../../domain/fonts/IFontRepository';
import type { FontStyle, FontWeight } from '../../domain/fonts/types';
import {
  type AsyncResult,
  err,
  type FontError,
  ok,
  type Result,
  ResultAsync,
} from '../../errors/result';
import { getLogger } from '../logging/instance';
import {
  executeWithRetry,
  type RetryConfig,
  retryPresets,
} from '../retry/ExponentialBackoffRetryPolicy';

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

/** Maximum number of fonts to cache */
const MAX_CACHED_FONTS = 20; // ~4MB max cache size

/** Cache TTL in milliseconds */
const CACHE_TTL_MS = 3600000; // 1 hour

/** Font fetch timeout in milliseconds */
const FETCH_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Map an unknown error to a FontError
 */
function mapToFontError(error: unknown, family: string): FontError {
  if (isFontError(error)) {
    return error;
  }

  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return {
      type: 'network_timeout',
      fontFamily: family,
      message: `Timeout fetching font ${family} (exceeded 30 seconds). Consider using a web-safe font.`,
    };
  }

  if (error instanceof TypeError) {
    return {
      type: 'network_error',
      fontFamily: family,
      message: `Network error fetching font ${family}: ${error.message}`,
    };
  }

  return {
    type: 'network_error',
    fontFamily: family,
    message: `Unknown error fetching font ${family}: ${String(error)}`,
  };
}

/**
 * Type guard for FontError
 */
function isFontError(error: unknown): error is FontError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'type' in error &&
    'fontFamily' in error &&
    'message' in error
  );
}

/**
 * Create a Google Fonts Repository
 *
 * Factory function that creates an IFontRepository implementation with:
 * - In-memory LRU cache
 * - 30-second timeout with retry logic
 * - WOFF2 decompression support
 * - Result-based error handling
 */
export function createGoogleFontsRepository(retryConfig?: Partial<RetryConfig>): IFontRepository {
  // Private state
  const fontCache = new Map<string, CachedFont>();
  const config = retryConfig ?? retryPresets.network;

  // Helper functions
  function getCacheKey(family: string, weight: FontWeight, style: FontStyle): string {
    return `${family}-${weight}-${style}`;
  }

  function buildApiUrl(family: string, weight: FontWeight, style: FontStyle): string {
    const encodedFamily = encodeURIComponent(family);
    const baseUrl = 'https://fonts.googleapis.com/css2';

    if (style === 'italic') {
      return `${baseUrl}?family=${encodedFamily}:ital,wght@1,${weight}&display=swap`;
    } else {
      return `${baseUrl}?family=${encodedFamily}:wght@${weight}&display=swap`;
    }
  }

  function extractFontUrl(cssText: string): FontUrlInfo | null {
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

  async function decompressWoff2(
    fontBytes: Uint8Array,
    family: string,
  ): Promise<Result<Uint8Array, FontError>> {
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

      return ok(decompressed);
    } catch (error) {
      return err({
        type: 'parse_error',
        fontFamily: family,
        message: `WOFF2 decompression failed for ${family}: ${String(error)}`,
      });
    }
  }

  function evictLRU(): void {
    if (fontCache.size <= MAX_CACHED_FONTS) {
      return;
    }

    const sorted = Array.from(fontCache.entries()).sort(([, a], [, b]) => a.hits - b.hits);

    const toEvict = sorted.slice(0, fontCache.size - MAX_CACHED_FONTS);

    for (const [key] of toEvict) {
      getLogger().debug(
        'GoogleFontsRepository',
        `Evicting ${key} (${fontCache.get(key)?.hits} hits)`,
      );
      fontCache.delete(key);
    }
  }

  // Public interface implementation
  function fetchGoogleFont(
    family: string,
    weight: FontWeight,
    style: FontStyle,
  ): AsyncResult<Uint8Array, FontError> {
    const cacheKey = getCacheKey(family, weight, style);

    return ResultAsync.fromPromise(
      (async (): Promise<Uint8Array> => {
        // Check cache first
        const cached = await getCachedFont(family, weight, style);
        if (cached) {
          return cached;
        }

        getLogger().debug('GoogleFontsRepository', `Fetching: ${family} ${weight} ${style}`);

        // Step 1: Fetch CSS from Google Fonts API
        const apiUrl = buildApiUrl(family, weight, style);
        const cssResponse = await executeWithRetry(async () => {
          const response = await fetch(apiUrl, {
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          });

          if (!response.ok) {
            const fontError: FontError = {
              type: 'not_found',
              fontFamily: family,
              message: `Google Fonts API returned ${response.status} for ${family}`,
            };
            throw fontError;
          }

          return response;
        }, config);

        const cssText = await cssResponse.text();

        // Step 2: Parse CSS to extract font URL
        const fontInfo = extractFontUrl(cssText);
        if (!fontInfo) {
          const fontError: FontError = {
            type: 'parse_error',
            fontFamily: family,
            message: `Failed to extract font URL from CSS for ${family}`,
          };
          throw fontError;
        }

        // Step 3: Fetch font file
        const fontResponse = await executeWithRetry(async () => {
          const response = await fetch(fontInfo.url, {
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          });

          if (!response.ok) {
            const fontError: FontError = {
              type: 'network_error',
              fontFamily: family,
              message: `Failed to download font file: ${response.status}`,
            };
            throw fontError;
          }

          return response;
        }, config);

        // Step 4: Convert to Uint8Array and decompress if needed
        const arrayBuffer = await fontResponse.arrayBuffer();
        let fontBytes: Uint8Array = new Uint8Array(arrayBuffer);

        // Decompress WOFF2 to TrueType using Rust WASM
        if (fontInfo.format === 'woff2') {
          const decompressResult = await decompressWoff2(fontBytes, family);
          if (decompressResult.isErr()) {
            throw decompressResult.error;
          }
          fontBytes = decompressResult.value;
        }

        // Cache the result
        await cacheFont(family, weight, style, fontBytes);

        getLogger().debug(
          'GoogleFontsRepository',
          `Fetched ${fontBytes.length} bytes for ${cacheKey} (cache: ${fontCache.size}/${MAX_CACHED_FONTS})`,
        );

        return fontBytes;
      })(),
      (error) => mapToFontError(error, family),
    );
  }

  async function getCachedFont(
    family: string,
    weight: FontWeight,
    style: FontStyle,
  ): Promise<Uint8Array | null> {
    const cacheKey = getCacheKey(family, weight, style);
    const cached = fontCache.get(cacheKey);

    if (!cached) {
      return null;
    }

    // Check TTL
    if (Date.now() - cached.timestamp >= CACHE_TTL_MS) {
      getLogger().debug('GoogleFontsRepository', `Cache expired: ${cacheKey}`);
      fontCache.delete(cacheKey);
      return null;
    }

    cached.hits += 1;
    getLogger().debug(
      'GoogleFontsRepository',
      `Cache hit: ${cacheKey} (${cached.hits} hits, ${cached.size} bytes)`,
    );

    return cached.bytes;
  }

  async function cacheFont(
    family: string,
    weight: FontWeight,
    style: FontStyle,
    data: Uint8Array,
  ): Promise<void> {
    const cacheKey = getCacheKey(family, weight, style);

    fontCache.set(cacheKey, {
      bytes: data,
      timestamp: Date.now(),
      hits: 1,
      size: data.length,
    });

    // Evict LRU if cache is full
    evictLRU();
  }

  function getCacheStats(): FontCacheStats {
    return {
      size: fontCache.size,
      maxSize: MAX_CACHED_FONTS,
      hits: Array.from(fontCache.values()).reduce((sum, font) => sum + font.hits, 0),
    };
  }

  function clearCache(): void {
    const count = fontCache.size;
    fontCache.clear();
    getLogger().debug('GoogleFontsRepository', `Cleared ${count} fonts`);
  }

  // Return the repository interface
  return {
    fetchGoogleFont,
    getCachedFont,
    cacheFont,
    getCacheStats,
    clearCache,
  };
}
