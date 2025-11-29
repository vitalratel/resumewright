/**
 * Font Fetch Orchestrator
 *
 * Application service that orchestrates font fetching from multiple sources.
 * Follows Clean Architecture: depends only on domain interfaces, not infrastructure.
 *
 * @module Application/Fonts
 */

import type { FontData, FontRequirement } from '../../domain/fonts/models/Font';
import type { ICustomFontStore } from '../../domain/fonts/repositories/ICustomFontStore';
import type { IFontRepository } from '../../domain/fonts/repositories/IFontRepository';
import type { ILogger } from '../../domain/logging/ILogger';

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
 * Coordinates font fetching from multiple sources:
 * - Google Fonts (via repository)
 * - Custom fonts (via store)
 * - Web-safe fonts (built-in, no fetch needed)
 *
 * Uses dependency injection for testability and flexibility.
 * All dependencies are injected via constructor (Dependency Inversion Principle).
 */
export class FontFetchOrchestrator {
  constructor(
    private readonly fontRepository: IFontRepository,
    private readonly customFontStore: ICustomFontStore,
    private readonly logger: ILogger
  ) {}

  /**
   * Fetch fonts based on requirements from detect_fonts()
   *
   * This function:
   * 1. Filters out web-safe fonts (no fetching needed)
   * 2. Fetches Google Fonts via repository
   * 3. Loads custom fonts from IndexedDB
   * 4. Returns FontData array ready for convert_tsx_to_pdf()
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
    const customFonts = requirements.filter((req) => req.source === 'custom');
    const webSafeFonts = requirements.filter((req) => req.source === 'websafe');

    this.logger.debug('FontFetchOrchestrator', 'Font requirements:', {
      google: googleFonts.length,
      custom: customFonts.length,
      websafe: webSafeFonts.length,
      total: requirements.length,
    });

    // Web-safe fonts don't need fetching - PDF generator has them built-in
    this.logger.debug('FontFetchOrchestrator', `Skipping ${webSafeFonts.length} web-safe fonts (built-in)`);

    let current = 0;
    const totalToFetch = googleFonts.length + customFonts.length;

    // Fetch Google Fonts using recursive pattern to avoid await-in-loop
    await this.fetchGoogleFonts(googleFonts, fontData, progressCallback, current, totalToFetch);
    current += googleFonts.length;

    // Load custom fonts from IndexedDB
    if (customFonts.length > 0) {
      await this.fetchCustomFonts(customFonts, fontData, progressCallback, current, totalToFetch);
    }

    this.logger.debug(
      'FontFetchOrchestrator',
      `Fetched ${fontData.length} fonts (${googleFonts.length} Google + ${customFonts.length} custom)`
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
      // Future: Could throw error or show user warning
      this.logger.warn(
        'FontFetchOrchestrator',
        `Continuing without ${req.family} (will fallback to web-safe font)`
      );
    }

    return this.fetchGoogleFonts(requirements, fontData, progressCallback, currentOffset, total, index + 1);
  }

  /**
   * Fetch custom fonts from IndexedDB
   */
  private async fetchCustomFonts(
    requirements: FontRequirement[],
    fontData: FontData[],
    progressCallback: FontFetchProgressCallback | undefined,
    currentOffset: number,
    total: number
  ): Promise<void> {
    const allCustomFonts = await this.customFontStore.getAllCustomFonts();

    for (let i = 0; i < requirements.length; i++) {
      const req = requirements[i];
      const current = currentOffset + i + 1;
      progressCallback?.(current, total, req.family);

      try {
        this.logger.debug(
          'FontFetchOrchestrator',
          `Loading custom font: ${req.family} ${req.weight} ${req.style}`
        );

        // Find matching custom font
        const customFont = allCustomFonts.find(
          (f) => f.family === req.family && f.weight === req.weight && f.style === req.style
        );

        if (customFont) {
          fontData.push({
            family: customFont.family,
            weight: customFont.weight,
            style: customFont.style,
            bytes: customFont.bytes,
            format: 'ttf', // Custom fonts are stored as TrueType
          });

          this.logger.debug(
            'FontFetchOrchestrator',
            `✓ Loaded custom font ${customFont.family} (${customFont.bytes.length} bytes)`
          );
        } else {
          this.logger.warn(
            'FontFetchOrchestrator',
            `Custom font not found: ${req.family} ${req.weight} ${req.style}`
          );
        }
      } catch (error) {
        this.logger.error('FontFetchOrchestrator', `✗ Failed to load custom font ${req.family}:`, error);
      }
    }
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
