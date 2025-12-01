/**
 * PDF Converter Module
 *
 * Core PDF conversion functions with full TSX-to-PDF pipeline.
 * Refactored to use dependency injection following Clean Architecture.
 */

import type { FontData, FontRequirement } from '../../domain/fonts/models/Font';
import type { IFontRepository } from '../../domain/fonts/repositories/IFontRepository';
import type { ILogger } from '../../domain/logging/ILogger';
import type { ConversionConfig } from '../../types/models';
import { FontCollection, FontData as WasmFontData } from '@pkg/wasm_bridge';
import { FontFetchOrchestrator } from '../../application/fonts/FontFetchOrchestrator';
import { convertConfigToRust } from '../../domain/pdf/config';
import { parseWasmError } from '../../domain/pdf/errors';
import { validatePdfBytes, validateProgressParams } from '../../domain/pdf/wasmSchemas';
import { GoogleFontsRepository } from '../../infrastructure/fonts/GoogleFontsRepository';
import { getLogger } from '../../infrastructure/logging';
import { detectFonts } from '../../infrastructure/pdf/fonts';
import { createConverterInstance } from '../../infrastructure/wasm';

/**
 * Dependency injection options for convertTsxToPdfWithFonts
 *
 * All dependencies are optional with sensible defaults.
 * Providing dependencies improves testability and flexibility.
 */
export interface ConversionDependencies {
  /** Logger instance (defaults to getLogger()) */
  logger?: ILogger;
  /** Font repository for Google Fonts (defaults to GoogleFontsRepository) */
  fontRepository?: IFontRepository;
}

/**
 * Convert TSX to PDF with automatic font detection and fetching
 *
 * Pipeline:
 * 1. Detect fonts from TSX (WASM)
 * 2. Fetch fonts from Google Fonts (TypeScript + IndexedDB)
 * 3. Convert with pre-fetched fonts (WASM)
 *
 * @param tsx - TSX source code
 * @param config - Conversion configuration
 * @param onProgress - Optional progress callback (stage, percentage)
 * @param onFontFetch - Optional font fetch progress callback
 * @param dependencies - Optional dependencies for testing
 */
export async function convertTsxToPdfWithFonts(
  tsx: string,
  config: ConversionConfig,
  onProgress?: (stage: string, percentage: number) => void,
  onFontFetch?: (current: number, total: number, fontFamily: string) => void,
  dependencies?: ConversionDependencies
): Promise<Uint8Array> {
  // Resolve dependencies with defaults (composition root)
  const logger = dependencies?.logger ?? getLogger();
  const fontRepository = dependencies?.fontRepository ?? new GoogleFontsRepository();

  // Create orchestrator with injected dependencies
  const orchestrator = new FontFetchOrchestrator(fontRepository, logger);

  // Delegate to service
  const service = new PdfConverterService(orchestrator, logger);
  return service.convertWithFonts(tsx, config, onProgress, onFontFetch);
}

/**
 * Progress stage definitions for conversion pipeline
 */
const PROGRESS_STAGES = {
  DETECTING_FONTS: { stage: 'detecting-fonts', percentage: 5 },
  FETCHING_FONTS: { stage: 'fetching-fonts', percentage: 10 },
  PARSING: { stage: 'parsing', percentage: 15 },
  // WASM stages (parsing through generation) map to 15-100%
  WASM_START_OFFSET: 15,
  WASM_SCALE: 0.85,
} as const;

/**
 * Convert FontData array to WASM FontCollection
 *
 * @param fontData - Font data from orchestrator
 * @returns WASM FontCollection ready for conversion
 */
function buildFontCollection(fontData: FontData[]): FontCollection {
  const fontCollection = new FontCollection();
  for (const font of fontData) {
    const wasmFont = new WasmFontData(
      font.family,
      font.weight,
      font.style === 'italic',
      font.bytes
    );
    fontCollection.add(wasmFont);
  }
  return fontCollection;
}

/**
 * Create progress callback wrapper that maps WASM progress to overall progress
 *
 * @param onProgress - User's progress callback
 * @param logger - Logger instance
 * @returns Wrapped progress callback for WASM
 */
function createProgressWrapper(
  onProgress: ((stage: string, percentage: number) => void) | undefined,
  logger: ILogger
): ((stage: string, percentage: number) => void) | undefined {
  if (!onProgress) {
    return undefined;
  }

  return (stage: string, percentage: number) => {
    // Validate progress callback params from WASM
    validateProgressParams(stage, percentage);

    // Map WASM progress (0-100) to overall progress (15-100)
    const mappedPercentage = PROGRESS_STAGES.WASM_START_OFFSET + percentage * PROGRESS_STAGES.WASM_SCALE;
    logger.debug('PdfConverter', 'Conversion progress', {
      stage,
      percentage: mappedPercentage.toFixed(0),
    });
    onProgress(stage, mappedPercentage);
  };
}

/**
 * Validate TSX input before conversion
 *
 * @param tsx - TSX source code
 * @throws Error if TSX is empty or invalid
 */
function validateTsxInput(tsx: string): void {
  if (!tsx || tsx.trim().length === 0) {
    throw new Error('TSX input is empty');
  }
}

/**
 * PDF Converter Service (Internal)
 *
 * Application service for PDF conversion using dependency injection.
 * Follows Clean Architecture: depends only on domain interfaces.
 *
 * Not exported - use convertTsxToPdfWithFonts() for public API.
 *
 * @internal
 */
class PdfConverterService {
  constructor(
    private readonly fontOrchestrator: FontFetchOrchestrator,
    private readonly logger: ILogger
  ) {}

  /**
   * Convert TSX to PDF with automatic font detection and fetching
   *
   * High-level orchestration:
   * 1. Validate input
   * 2. Detect fonts (WASM)
   * 3. Fetch fonts (network/storage)
   * 4. Build font collection
   * 5. Convert to PDF (WASM)
   */
  async convertWithFonts(
    tsx: string,
    config: ConversionConfig,
    onProgress?: (stage: string, percentage: number) => void,
    onFontFetch?: (current: number, total: number, fontFamily: string) => void
  ): Promise<Uint8Array> {
    validateTsxInput(tsx);

    try {
      const startTime = performance.now();
      this.logger.debug('PdfConverter', 'Starting two-step conversion...');

      // Step 1: Detect fonts
      const fontRequirements = await this.detectFontsStep(tsx, onProgress);

      // Step 2: Fetch fonts
      const fontData = await this.fetchFontsStep(fontRequirements, onProgress, onFontFetch);

      // Step 3: Convert to PDF
      const pdfBytes = await this.convertToPdfStep(tsx, config, fontData, onProgress);

      const duration = performance.now() - startTime;
      this.logger.info('PdfConverter', 'Conversion completed', {
        duration: duration.toFixed(0),
        pdfSize: pdfBytes.length,
      });

      return pdfBytes;
    } catch (error) {
      this.logger.error('PdfConverter', 'Conversion failed', error);
      const conversionError = parseWasmError(error);
      throw new Error(conversionError.message);
    }
  }

  /**
   * Step 1: Detect font requirements from TSX
   */
  private async detectFontsStep(
    tsx: string,
    onProgress?: (stage: string, percentage: number) => void
  ): Promise<FontRequirement[]> {
    onProgress?.(PROGRESS_STAGES.DETECTING_FONTS.stage, PROGRESS_STAGES.DETECTING_FONTS.percentage);

    const fontRequirements = await detectFonts(tsx);

    this.logger.debug('PdfConverter', 'Step 1: Detected fonts', {
      count: fontRequirements.length,
    });

    return fontRequirements;
  }

  /**
   * Step 2: Fetch required fonts from repositories
   */
  private async fetchFontsStep(
    fontRequirements: FontRequirement[],
    onProgress?: (stage: string, percentage: number) => void,
    onFontFetch?: (current: number, total: number, fontFamily: string) => void
  ): Promise<FontData[]> {
    onProgress?.(PROGRESS_STAGES.FETCHING_FONTS.stage, PROGRESS_STAGES.FETCHING_FONTS.percentage);

    const fontData = await this.fontOrchestrator.fetchFontsFromRequirements(
      fontRequirements,
      onFontFetch
    );

    this.logger.debug('PdfConverter', 'Step 2: Fetched fonts', { count: fontData.length });

    return fontData;
  }

  /**
   * Step 3: Convert TSX to PDF with fonts
   */
  private async convertToPdfStep(
    tsx: string,
    config: ConversionConfig,
    fontData: FontData[],
    onProgress?: (stage: string, percentage: number) => void
  ): Promise<Uint8Array> {
    onProgress?.(PROGRESS_STAGES.PARSING.stage, PROGRESS_STAGES.PARSING.percentage);

    // Build WASM font collection
    const fontCollection = buildFontCollection(fontData);

    // Prepare WASM config
    const wasmConfig = convertConfigToRust(config, this.logger);

    // Create progress wrapper
    const progressCallback = createProgressWrapper(onProgress, this.logger);

    // Convert with WASM
    const converterInstance = createConverterInstance();
    try {
      const pdfBytes = converterInstance.convert_tsx_to_pdf(
        tsx,
        wasmConfig,
        fontCollection,
        progressCallback
      );

      // Validate PDF output
      return validatePdfBytes(pdfBytes);
    } finally {
      converterInstance.free();
    }
  }
}
