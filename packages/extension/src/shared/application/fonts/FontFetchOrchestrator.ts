// ABOUTME: Orchestrates font fetching from Google Fonts based on TSX font requirements.
// ABOUTME: Filters web-safe fonts (built-in), fetches Google Fonts, handles custom font warnings.

import type { IFontRepository } from '../../domain/fonts/IFontRepository';
import type { FontData, FontRequirement } from '../../domain/fonts/types';
import type { ILogger } from '../../infrastructure/logging/logger';

/**
 * Font fetch progress callback
 */
type FontFetchProgressCallback = (current: number, total: number, fontFamily: string) => void;

/**
 * Fetch fonts based on requirements from detect_fonts()
 *
 * This function:
 * 1. Filters out web-safe fonts (no fetching needed)
 * 2. Fetches Google Fonts via repository
 * 3. Returns FontData array ready for convert_tsx_to_pdf()
 *
 * Note: Uses graceful degradation - missing fonts are logged but don't fail the pipeline.
 *
 * @param requirements - Font requirements from WASM detect_fonts()
 * @param fontRepository - Repository for fetching fonts
 * @param logger - Logger instance
 * @param progressCallback - Optional callback for progress updates
 * @returns Promise resolving to array of FontData for WASM
 */
export async function fetchFontsFromRequirements(
  requirements: FontRequirement[],
  fontRepository: IFontRepository,
  logger: ILogger,
  progressCallback?: FontFetchProgressCallback,
): Promise<FontData[]> {
  const fontData: FontData[] = [];

  // Separate requirements by source
  const googleFonts = requirements.filter((req) => req.source === 'google');
  const webSafeFonts = requirements.filter((req) => req.source === 'websafe');
  // Custom fonts (source === 'custom') are logged but not fetched - no upload UI exists
  const customFonts = requirements.filter((req) => req.source === 'custom');

  logger.debug('FontFetchOrchestrator', 'Font requirements:', {
    google: googleFonts.length,
    custom: customFonts.length,
    websafe: webSafeFonts.length,
    total: requirements.length,
  });

  // Web-safe fonts don't need fetching - PDF generator has them built-in
  logger.debug(
    'FontFetchOrchestrator',
    `Skipping ${webSafeFonts.length} web-safe fonts (built-in)`,
  );

  // Log warning for custom fonts (no upload UI exists)
  if (customFonts.length > 0) {
    logger.warn(
      'FontFetchOrchestrator',
      `${customFonts.length} custom font(s) requested but custom font upload is not available. Fonts will fallback to web-safe.`,
    );
  }

  const totalToFetch = googleFonts.length;

  // Fetch Google Fonts using recursive pattern to avoid await-in-loop
  await fetchGoogleFontsRecursive(
    googleFonts,
    fontData,
    fontRepository,
    logger,
    progressCallback,
    0,
    totalToFetch,
  );

  logger.debug(
    'FontFetchOrchestrator',
    `Fetched ${fontData.length} fonts (${googleFonts.length} Google)`,
  );

  return fontData;
}

/**
 * Fetch Google Fonts recursively (internal helper)
 * Uses Result pattern from repository - errors are logged but don't fail the pipeline.
 */
async function fetchGoogleFontsRecursive(
  requirements: FontRequirement[],
  fontData: FontData[],
  fontRepository: IFontRepository,
  logger: ILogger,
  progressCallback: FontFetchProgressCallback | undefined,
  currentOffset: number,
  total: number,
  index: number = 0,
): Promise<void> {
  if (index >= requirements.length) {
    return;
  }

  const req = requirements[index];
  const current = currentOffset + index + 1;
  progressCallback?.(current, total, req.family);

  logger.debug(
    'FontFetchOrchestrator',
    `Fetching Google Font: ${req.family} ${req.weight} ${req.style}`,
  );

  const result = await fontRepository.fetchGoogleFont(req.family, req.weight, req.style);

  result.match(
    (bytes) => {
      fontData.push({
        family: req.family,
        weight: req.weight,
        style: req.style,
        bytes,
        format: 'ttf', // Google Fonts API returns TrueType
      });
      logger.debug('FontFetchOrchestrator', `✓ Fetched ${req.family} (${bytes.length} bytes)`);
    },
    (error) => {
      logger.error(
        'FontFetchOrchestrator',
        `✗ Failed to fetch Google Font ${req.family}:`,
        error.message,
      );
      // Graceful degradation: Log warning but continue with fallback
      logger.warn(
        'FontFetchOrchestrator',
        `Continuing without ${req.family} (will fallback to web-safe font)`,
      );
    },
  );

  return fetchGoogleFontsRecursive(
    requirements,
    fontData,
    fontRepository,
    logger,
    progressCallback,
    currentOffset,
    total,
    index + 1,
  );
}
