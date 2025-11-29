/**
 * Font Manager for Two-Step WASM API
 * TypeScript integration for detect_fonts() → fetch → convert
 *
 * Orchestrates the two-step font workflow:
 * 1. Detect fonts from TSX (WASM)
 * 2. Fetch Google Fonts (TypeScript)
 * 3. Convert with pre-fetched fonts (WASM)
 */

import type { FontData, FontRequirement } from '../../../shared/domain/fonts/models/Font';
import { GOOGLE_FONTS_SET } from '@/shared/infrastructure/fonts/googleFontsList';
// Imports now handled dynamically in fetchFontsFromRequirements
// to avoid circular dependencies and maintain clean architecture

/**
 * Font fetch progress callback
 */
export type FontFetchProgressCallback = (
  current: number,
  total: number,
  fontFamily: string
) => void;

/**
 * Fetch fonts based on requirements from detect_fonts()
 *
 * This function:
 * 1. Filters out web-safe fonts (no fetching needed)
 * 2. Fetches Google Fonts from Google Fonts API
 * 3. Loads custom fonts from IndexedDB
 * 4. Returns FontData array ready for convert_tsx_to_pdf()
 *
 * @param requirements - Font requirements from WASM detect_fonts()
 * @param progressCallback - Optional callback for progress updates
 * @returns Promise resolving to array of FontData for WASM
 * @throws Error if any required fonts fail to fetch
 */
export async function fetchFontsFromRequirements(
  requirements: FontRequirement[],
  progressCallback?: FontFetchProgressCallback
): Promise<FontData[]> {
  // Delegate to FontFetchOrchestrator (shared application layer)
  // This maintains backward compatibility while fixing dependency direction
  const { FontFetchOrchestrator } = await import('@/shared/application/fonts/FontFetchOrchestrator');
  const { GoogleFontsRepository } = await import('@/shared/infrastructure/fonts/GoogleFontsRepository');
  const { CustomFontStoreAdapter } = await import('@/shared/infrastructure/fonts/CustomFontStoreAdapter');
  const { getLogger } = await import('@/shared/infrastructure/logging');

  // Composition root: wire up dependencies
  const repository = new GoogleFontsRepository();
  const customFontStore = new CustomFontStoreAdapter();
  const logger = getLogger();
  const orchestrator = new FontFetchOrchestrator(repository, customFontStore, logger);

  return orchestrator.fetchFontsFromRequirements(requirements, progressCallback);
}

/**
 * Helper: Detect if a font family is web-safe
 *
 * @param family - Font family name
 * @returns true if font is web-safe (no fetching needed)
 */
export function isWebSafeFont(family: string): boolean {
  const webSafeFonts = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Times',
    'Courier New',
    'Courier',
    'Georgia',
    'Verdana',
  ];

  return webSafeFonts.some((wsf) => wsf.toLowerCase() === family.toLowerCase());
}

/**
 * Helper: Detect if a font family is a known Google Font
 *
 * @param family - Font family name
 * @returns true if font is a known Google Font
 */
export function isGoogleFont(family: string): boolean {
  return GOOGLE_FONTS_SET.has(family.toLowerCase());
}
