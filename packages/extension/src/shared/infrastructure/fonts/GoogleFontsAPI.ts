/**
 * Google Fonts Fetching Service
 * Google Fonts API integration
 *
 * Fetches TrueType font files from Google Fonts API for embedding in PDFs.
 * Implements 5-second timeout, font variant handling, and in-memory caching.
 */

import { getLogger } from '@/shared/infrastructure/logging';

/**
 * Cached font data
 */
interface CachedFont {
  bytes: Uint8Array;
  timestamp: number;
  hits: number;
  size: number;
}

/**
 * In-memory font cache with LRU eviction
 * Survives multiple PDF generations but not service worker restarts
 * For persistent cache across restarts, use IndexedDB
 */
const FONT_CACHE = new Map<string, CachedFont>();
const MAX_CACHED_FONTS = 20; // ~4MB max cache size
const CACHE_TTL_MS = 3600000; // 1 hour

/**
 * Font fetch timeout in milliseconds
 * Extract magic number to named constant
 */
// Increased timeout for slow networks
const FONT_FETCH_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Evict least recently used fonts from cache
 */
function evictLRU(cache: Map<string, CachedFont>, maxSize: number): void {
  if (cache.size <= maxSize)
    return;

  // Sort by hits (ascending) - evict least used
  const sorted = Array.from(cache.entries())
    .sort(([, a], [, b]) => a.hits - b.hits);

  const toEvict = sorted.slice(0, cache.size - maxSize);

  for (const [key] of toEvict) {
    getLogger().debug('GoogleFonts', 'FontCache', `Evicting ${key} (${cache.get(key)?.hits} hits)`);
    cache.delete(key);
  }
}

/**
 * Clear font cache (for testing/debugging)
 */
export function clearFontCache(): void {
  const count = FONT_CACHE.size;
  FONT_CACHE.clear();
  getLogger().debug('GoogleFonts', 'FontCache', `Cleared ${count} fonts`);
}

/**
 * Get cache statistics
 */
export function getFontCacheStats(): { size: number; totalBytes: number; fonts: string[] } {
  let totalBytes = 0;
  const fonts: string[] = [];

  for (const [key, cached] of FONT_CACHE.entries()) {
    totalBytes += cached.size;
    fonts.push(key);
  }

  return { size: FONT_CACHE.size, totalBytes, fonts };
}

/**
 * Font style variants
 */
export type FontStyle = 'normal' | 'italic';

/**
 * Font weight values (100-900)
 */
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

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

// Font cache moved to top of file (FONT_CACHE with LRU eviction)

/**
 * Generates cache key for a font variant
 */
function getCacheKey(family: string, weight: FontWeight, style: FontStyle): string {
  return `${family}-${weight}-${style}`;
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
 * Extracts font URL from Google Fonts API CSS response
 *
 * @param cssText - CSS text from Google Fonts API
 * @returns Font URL and format, or null if not found
 *
 * Now supports WOFF2 format via Rust decompression
 */
function extractFontUrl(cssText: string): FontUrlInfo | null {
  // Google Fonts API returns @font-face rules with src: url(...)
  // We prefer .ttf format for easier PDF embedding

  // Try to find TrueType format first (uncompressed, best for PDFs)
  const ttfMatch = cssText.match(/url\((https:\/\/[^)]+\.ttf)\)/);
  if (ttfMatch) {
    return { url: ttfMatch[1], format: 'ttf' };
  }

  // WOFF2 support using Rust WASM decompression
  const woff2Match = cssText.match(/url\((https:\/\/[^)]+\.woff2)\)/);
  if (woff2Match) {
    return { url: woff2Match[1], format: 'woff2' };
  }

  return null;
}

/**
 * Constructs Google Fonts API URL for a specific font variant
 *
 * @param family - Font family name (e.g., "Roboto", "Open Sans")
 * @param weight - Font weight (400, 700, etc.)
 * @param style - Font style (normal, italic)
 * @returns Google Fonts API URL
 *
 * @example
 * buildApiUrl("Roboto", 400, "normal")
 * // Returns: "https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap"
 *
 * buildApiUrl("Roboto", 700, "italic")
 * // Returns: "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@1,700&display=swap"
 */
function buildApiUrl(family: string, weight: FontWeight, style: FontStyle): string {
  const encodedFamily = encodeURIComponent(family);
  const baseUrl = 'https://fonts.googleapis.com/css2';

  if (style === 'italic') {
    // For italic: use ital,wght@1,weight format
    return `${baseUrl}?family=${encodedFamily}:ital,wght@1,${weight}&display=swap`;
  }
  else {
    // For normal: use wght@weight format
    return `${baseUrl}?family=${encodedFamily}:wght@${weight}&display=swap`;
  }
}

/**
 * Fetches a Google Font from the API with timeout and error handling
 *
 * @param family - Font family name (e.g., "Roboto")
 * @param weight - Font weight (default: 400)
 * @param style - Font style (default: "normal")
 * @returns Promise resolving to font bytes as Uint8Array
 * @throws {FontFetchError} If fetch fails, times out, or font not found
 *
 * Implements basic fetching, network timeout (30 seconds), and comprehensive error handling
 */
/**
 * Helper to retry network operations with exponential backoff
 * Retry logic for transient network failures
 * Uses recursive pattern to avoid await-in-loop
 */
async function retryNetworkOperation<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000,
): Promise<T> {
  async function attempt(attemptNumber: number): Promise<T> {
    try {
      return await operation();
    }
    catch (error) {
      const err = error as Error;

      // Only retry on network errors and timeouts
      const isNetworkError = error instanceof TypeError;
      const isTimeout = error instanceof DOMException && error.name === 'TimeoutError';

      if (!isNetworkError && !isTimeout) {
        // Non-retryable error (e.g., 404, parse error)
        throw error;
      }

      // Don't retry on last attempt
      if (attemptNumber >= maxAttempts) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = baseDelayMs * 2 ** (attemptNumber - 1);
      const jitter = delay * 0.3 * (Math.random() * 2 - 1);
      const finalDelay = Math.floor(delay + jitter);

      getLogger().warn(
        'GoogleFonts',
        `Retry ${attemptNumber}/${maxAttempts} after ${finalDelay}ms:`,
        err.message,
      );

      await new Promise(resolve => setTimeout(resolve, finalDelay));
      return attempt(attemptNumber + 1);
    }
  }

  return attempt(1);
}

export async function fetchGoogleFont(
  family: string,
  weight: FontWeight = 400,
  style: FontStyle = 'normal',
): Promise<Uint8Array> {
  const cacheKey = getCacheKey(family, weight, style);

  // Check cache first (with TTL and hit counting)
  const cached = FONT_CACHE.get(cacheKey);
  if (cached) {
    // Check TTL
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      cached.hits += 1;
      getLogger().debug('GoogleFonts', `Cache hit: ${cacheKey} (${cached.hits} hits, ${cached.size} bytes)`);
      return cached.bytes;
    }
    else {
      // Expired - remove from cache
      getLogger().debug('GoogleFonts', `Cache expired: ${cacheKey}`);
      FONT_CACHE.delete(cacheKey);
    }
  }

  getLogger().debug('GoogleFonts', `Fetching: ${family} ${weight} ${style}`);

  try {
    // Step 1: Fetch CSS from Google Fonts API (with 30s timeout and retry)
    const apiUrl = buildApiUrl(family, weight, style);
    const cssResponse = await retryNetworkOperation(async () => {
      const response = await fetch(apiUrl, {
        signal: AbortSignal.timeout(FONT_FETCH_TIMEOUT_MS),
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

    // cssResponse will only be reached if fetch succeeded

    const cssText = await cssResponse.text();

    // Step 2: Parse CSS to extract font URL and format
    const fontInfo = extractFontUrl(cssText);
    if (!fontInfo) {
      throw new FontFetchError(
        FontFetchErrorType.PARSE_ERROR,
        family,
        `Failed to extract font URL from CSS for ${family}`,
      );
    }

    // Step 3: Fetch font file (with 30s timeout and retry)
    const fontResponse = await retryNetworkOperation(async () => {
      const response = await fetch(fontInfo.url, {
        signal: AbortSignal.timeout(FONT_FETCH_TIMEOUT_MS),
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

    // fontResponse will only be reached if fetch succeeded

    // Step 4: Convert to Uint8Array and decompress if needed
    const arrayBuffer = await fontResponse.arrayBuffer();
    let fontBytes = new Uint8Array(arrayBuffer);

    // Decompress WOFF2 to TrueType using Rust WASM
    if (fontInfo.format === 'woff2') {
      try {
        getLogger().debug(
          'GoogleFonts',
          `Decompressing WOFF2: ${family} (${fontBytes.length} bytes)`,
        );
        // Dynamic import for lazy loading WASM module
        const wasmModule = await import('@pkg/wasm_bridge');
        fontBytes = new Uint8Array(wasmModule.decompress_woff2_font(fontBytes));
        getLogger().info(
          'GoogleFonts',
          `WOFF2 decompressed: ${family} ${arrayBuffer.byteLength} → ${fontBytes.length} bytes`,
        );
      }
      catch (error) {
        throw new FontFetchError(
          FontFetchErrorType.PARSE_ERROR,
          family,
          `WOFF2 decompression failed for ${family}: ${String(error)}`,
        );
      }
    }

    // Cache the result with metadata
    FONT_CACHE.set(cacheKey, {
      bytes: fontBytes,
      timestamp: Date.now(),
      hits: 1,
      size: fontBytes.length,
    });

    // Evict LRU if cache is full
    evictLRU(FONT_CACHE, MAX_CACHED_FONTS);

    getLogger().debug('GoogleFonts', `Fetched ${fontBytes.length} bytes for ${cacheKey} (cache size: ${FONT_CACHE.size}/${MAX_CACHED_FONTS})`);

    return fontBytes;
  }
  catch (error) {
    // Error handling
    if (error instanceof FontFetchError) {
      throw error;
    }

    // Handle timeout (30s with retry)
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new FontFetchError(
        FontFetchErrorType.NETWORK_TIMEOUT,
        family,
        `Timeout fetching font ${family} (exceeded 30 seconds after retries). Consider using a web-safe font instead.`,
      );
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new FontFetchError(
        FontFetchErrorType.NETWORK_ERROR,
        family,
        `Network error fetching font ${family}: ${error.message}`,
      );
    }

    // Unknown error
    throw new FontFetchError(
      FontFetchErrorType.NETWORK_ERROR,
      family,
      `Unknown error fetching font ${family}: ${String(error)}`,
    );
  }
}

/**
 * Font fetch result with optional fallback flag
 */
export interface FontFetchResult {
  cacheKey: string;
  fontBytes: Uint8Array | null;
  failed: boolean;
  error?: FontFetchError;
}

/**
 * Fetches multiple font variants concurrently with error recovery
 *
 * Uses Promise.allSettled() to handle font fetch failures gracefully.
 * Failed fonts are logged as warnings but don't crash the conversion.
 *
 * @param family - Font family name
 * @param variants - Array of [weight, style] tuples
 * @returns Promise resolving to array of FontFetchResult objects
 *
 * Handles font variant fetching concurrently with graceful error recovery
 */
export async function fetchFontVariants(
  family: string,
  variants: Array<[FontWeight, FontStyle]>,
): Promise<FontFetchResult[]> {
  const promises = variants.map(async ([weight, style]) => {
    const cacheKey = getCacheKey(family, weight, style);
    try {
      const fontBytes = await fetchGoogleFont(family, weight, style);
      return { cacheKey, fontBytes, failed: false };
    }
    catch (error) {
      getLogger().warn('GoogleFonts', `Failed to fetch ${cacheKey}, will use fallback`, error);
      return {
        cacheKey,
        fontBytes: null,
        failed: true,
        error: error instanceof FontFetchError ? error : undefined,
      };
    }
  });

  const results = await Promise.allSettled(promises);

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    else {
      // Promise.allSettled caught a rejection that wasn't handled internally
      const [weight, style] = variants[index];
      const cacheKey = getCacheKey(family, weight, style);
      getLogger().warn('GoogleFonts', `Unexpected rejection for ${cacheKey}`, result.reason);
      return {
        cacheKey,
        fontBytes: null,
        failed: true,
        error: result.reason instanceof FontFetchError ? result.reason : undefined,
      };
    }
  });
}

// Cache management functions moved to top of file (clearFontCache, getFontCacheStats)
