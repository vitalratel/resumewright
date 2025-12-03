/**
 * Font Service Module
 *
 * Handles font detection and requirements extraction.
 * Includes simple cache for repeated font detection calls.
 */

import type { FontRequirement } from '../../domain/fonts/types';
import { parseFontRequirements } from '../../domain/pdf/wasmSchemas';
import { getLogger } from '../../infrastructure/logging/instance';
import { createConverterInstance } from '../wasm/instance';

/**
 * Simple cache for font detection results
 * Key: TSX content hash, Value: Font requirements
 */
const fontDetectionCache = new Map<string, FontRequirement[]>();

/**
 * Maximum cache size (prevent memory bloat)
 */
const MAX_CACHE_SIZE = 100;

/**
 * Create simple hash of TSX content for caching
 *
 * @param tsx - TSX content
 * @returns Hash string
 */
function hashTsx(tsx: string): string {
  // Simple hash - use length + first/last 100 chars
  const length = tsx.length;
  const start = tsx.slice(0, 100);
  const end = tsx.slice(-100);
  return `${length}-${start}-${end}`;
}

/**
 * Detect font requirements from TSX (Two-Step API - Step 1)
 *
 * Scans TSX code for font-family declarations and returns structured font requirements.
 * This is the first step of the two-step API: detect → fetch → convert.
 *
 * Results are cached to avoid redundant WASM calls for the same TSX.
 *
 * @param tsx - TSX source code
 * @param useCache - Whether to use cache (default: true)
 * @returns Array of font requirements
 * @throws Error if WASM not initialized, TSX parsing fails, or WASM returns invalid data
 *
 * @example
 * ```typescript
 * const fonts = await detectFonts(tsxCode);
 * console.log(`Found ${fonts.length} fonts:`, fonts);
 * ```
 */
export async function detectFonts(tsx: string, useCache = true): Promise<FontRequirement[]> {
  if (!tsx || tsx.trim().length === 0) {
    throw new Error('TSX input is empty');
  }

  // Check cache first
  if (useCache) {
    const cacheKey = hashTsx(tsx);
    const cached = fontDetectionCache.get(cacheKey);
    if (cached) {
      getLogger().debug('FontService', 'Cache hit - returning cached fonts', {
        count: cached.length,
      });
      return cached;
    }
  }

  try {
    getLogger().debug('FontService', 'Detecting fonts in TSX...');

    const converter = createConverterInstance();

    // WASM function returns JSON string with font requirements
    const fontsJson = converter.detect_fonts(tsx);

    // Parse and validate JSON result (runtime type safety)
    const fontRequirements = parseFontRequirements(fontsJson);

    getLogger().debug('FontService', 'Found font requirements', {
      count: fontRequirements.length,
      fontRequirements,
    });

    // Cache result
    if (useCache) {
      const cacheKey = hashTsx(tsx);

      // Evict oldest entry if cache is full
      if (fontDetectionCache.size >= MAX_CACHE_SIZE) {
        const firstKey = fontDetectionCache.keys().next().value;
        if (firstKey !== null && firstKey !== undefined && firstKey !== '') {
          fontDetectionCache.delete(firstKey);
        }
      }

      fontDetectionCache.set(cacheKey, fontRequirements);
    }

    return fontRequirements;
  } catch (error) {
    getLogger().error('FontService', 'Failed to detect fonts', error);
    throw new Error(`Font detection failed: ${String(error)}`);
  }
}

/**
 * Clear font detection cache
 *
 * Useful for testing or when memory needs to be freed.
 *
 * @example
 * ```typescript
 * clearFontCache();
 * ```
 */
export function clearFontCache(): void {
  fontDetectionCache.clear();
  getLogger().debug('FontService', 'Cache cleared');
}
