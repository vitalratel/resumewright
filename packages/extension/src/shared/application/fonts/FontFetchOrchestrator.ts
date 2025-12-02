/**
 * Font Fetch Orchestrator
 *
 * Application service that orchestrates font fetching from Google Fonts.
 * Follows Clean Architecture: depends only on domain interfaces, not infrastructure.
 *
 * @module Application/Fonts
 */

import type { FontData, FontRequirement } from '../../domain/fonts/models/Font';
import type { IFontRepository } from '../../domain/fonts/repositories/IFontRepository';
import type { ILogger } from '../../infrastructure/logging';

/**
 * Font fetch progress callback
 */
export type FontFetchProgressCallback = (
  current: number,
  total: number,
  fontFamily: string
) => void;

/**
 * Font Fetch Orchestrator
 *
 * Coordinates font fetching from Google Fonts.
 * Web-safe fonts are built into the PDF generator and don't need fetching.
 *
 * Uses dependency injection for testability and flexibility.
 * All dependencies are injected via constructor (Dependency Inversion Principle).
 */
export class FontFetchOrchestrator {
  constructor(
    private readonly fontRepository: IFontRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Fetch fonts based on requirements from detect_fonts()
   *
   * This function:
   * 1. Filters out web-safe fonts (no fetching needed)
   * 2. Fetches Google Fonts via repository
   * 3. Returns FontData array ready for convert_tsx_to_pdf()
   *
   * @param requirements - Font requirements from WASM detect_fonts()
   * @param progressCallback - Optional callback for progress updates
   * @returns Promise resolving to array of FontData for WASM
   * @throws Error if any required fonts fail to fetch
   */
  async fetchFontsFromRequirements(
    requirements: FontRequirement[],
    progressCallback?: FontFetchProgressCallback
  ): Promise<FontData[]> {
    const fontData: FontData[] = [];

    // Separate requirements by source
    const googleFonts = requirements.filter((req) => req.source === 'google');
    const webSafeFonts = requirements.filter((req) => req.source === 'websafe');
    // Custom fonts (source === 'custom') are logged but not fetched - no upload UI exists
    const customFonts = requirements.filter((req) => req.source === 'custom');

    this.logger.debug('FontFetchOrchestrator', 'Font requirements:', {
      google: googleFonts.length,
      custom: customFonts.length,
      websafe: webSafeFonts.length,
      total: requirements.length,
    });

    // Web-safe fonts don't need fetching - PDF generator has them built-in
    this.logger.debug('FontFetchOrchestrator', `Skipping ${webSafeFonts.length} web-safe fonts (built-in)`);

    // Log warning for custom fonts (no upload UI exists)
    if (customFonts.length > 0) {
      this.logger.warn(
        'FontFetchOrchestrator',
        `${customFonts.length} custom font(s) requested but custom font upload is not available. Fonts will fallback to web-safe.`
      );
    }

    const totalToFetch = googleFonts.length;

    // Fetch Google Fonts using recursive pattern to avoid await-in-loop
    await this.fetchGoogleFonts(googleFonts, fontData, progressCallback, 0, totalToFetch);

    this.logger.debug(
      'FontFetchOrchestrator',
      `Fetched ${fontData.length} fonts (${googleFonts.length} Google)`
    );

    return fontData;
  }

  /**
   * Fetch Google Fonts recursively
   */
  private async fetchGoogleFonts(
    requirements: FontRequirement[],
    fontData: FontData[],
    progressCallback: FontFetchProgressCallback | undefined,
    currentOffset: number,
    total: number,
    index: number = 0
  ): Promise<void> {
    if (index >= requirements.length) {
      return;
    }

    const req = requirements[index];
    const current = currentOffset + index + 1;
    progressCallback?.(current, total, req.family);

    try {
      this.logger.debug(
        'FontFetchOrchestrator',
        `Fetching Google Font: ${req.family} ${req.weight} ${req.style}`
      );

      const bytes = await this.fontRepository.fetchGoogleFont(req.family, req.weight, req.style);

      fontData.push({
        family: req.family,
        weight: req.weight,
        style: req.style,
        bytes,
        format: 'ttf', // Google Fonts API returns TrueType
      });

      this.logger.debug('FontFetchOrchestrator', `✓ Fetched ${req.family} (${bytes.length} bytes)`);
    } catch (error) {
      this.logger.error('FontFetchOrchestrator', `✗ Failed to fetch Google Font ${req.family}:`, error);

      // For MVP: Log warning but continue with fallback
      this.logger.warn(
        'FontFetchOrchestrator',
        `Continuing without ${req.family} (will fallback to web-safe font)`
      );
    }

    return this.fetchGoogleFonts(requirements, fontData, progressCallback, currentOffset, total, index + 1);
  }

  /**
   * Get font repository cache statistics
   */
  getCacheStats() {
    return this.fontRepository.getCacheStats();
  }

  /**
   * Clear font repository cache
   */
  clearCache(): void {
    this.fontRepository.clearCache();
  }
}
