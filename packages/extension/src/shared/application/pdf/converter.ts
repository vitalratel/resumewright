// ABOUTME: Core PDF conversion with full TSX-to-PDF pipeline.
// ABOUTME: Handles font detection, fetching, and WASM-based PDF generation.

import { FontCollection, FontData as WasmFontData } from '@pkg/wasm_bridge';
import { fetchFontsFromRequirements } from '../../application/fonts/FontFetchOrchestrator';
import type { IFontRepository } from '../../domain/fonts/IFontRepository';
import type { FontData, FontRequirement } from '../../domain/fonts/types';
import { convertConfigToRust } from '../../domain/pdf/config';
import { parseWasmError } from '../../domain/pdf/errors';
import { validatePdfBytes, validateProgressParams } from '../../domain/pdf/wasmSchemas';
import { createGoogleFontsRepository } from '../../infrastructure/fonts/GoogleFontsRepository';
import { getLogger } from '../../infrastructure/logging/instance';
import type { ILogger } from '../../infrastructure/logging/logger';
import { detectFonts } from '../../infrastructure/pdf/fonts';
import { createConverterInstance } from '../../infrastructure/wasm/instance';
import type { ConversionConfig } from '../../types/models';

/**
 * Dependency injection options for convertTsxToPdfWithFonts
 *
 * All dependencies are optional with sensible defaults.
 * Providing dependencies improves testability and flexibility.
 */
interface ConversionDependencies {
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
  dependencies?: ConversionDependencies,
): Promise<Uint8Array> {
  // Resolve dependencies with defaults (composition root)
  const logger = dependencies?.logger ?? getLogger();
  const fontRepository = dependencies?.fontRepository ?? createGoogleFontsRepository();

  validateTsxInput(tsx);

  try {
    const startTime = performance.now();
    logger.debug('PdfConverter', 'Starting two-step conversion...');

    // Step 1: Detect fonts
    const fontRequirements = await detectFontsStep(tsx, onProgress, logger);

    // Step 2: Fetch fonts
    const fontData = await fetchFontsStep(
      fontRequirements,
      fontRepository,
      logger,
      onProgress,
      onFontFetch,
    );

    // Step 3: Convert to PDF
    const pdfBytes = await convertToPdfStep(tsx, config, fontData, onProgress, logger);

    const duration = performance.now() - startTime;
    logger.info('PdfConverter', 'Conversion completed', {
      duration: duration.toFixed(0),
      pdfSize: pdfBytes.length,
    });

    return pdfBytes;
  } catch (error) {
    logger.error('PdfConverter', 'Conversion failed', error);
    const conversionError = parseWasmError(error);
    throw new Error(conversionError.message);
  }
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
      font.bytes,
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
  logger: ILogger,
): ((stage: string, percentage: number) => void) | undefined {
  if (!onProgress) {
    return undefined;
  }

  return (stage: string, percentage: number) => {
    // Validate progress callback params from WASM
    const validationResult = validateProgressParams(stage, percentage);
    if (validationResult.isErr()) {
      logger.warn('PdfConverter', 'Invalid progress params', {
        error: validationResult.error.message,
      });
      return;
    }

    // Map WASM progress (0-100) to overall progress (15-100)
    const mappedPercentage =
      PROGRESS_STAGES.WASM_START_OFFSET + percentage * PROGRESS_STAGES.WASM_SCALE;
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
 * Step 1: Detect font requirements from TSX
 */
async function detectFontsStep(
  tsx: string,
  onProgress: ((stage: string, percentage: number) => void) | undefined,
  logger: ILogger,
): Promise<FontRequirement[]> {
  onProgress?.(PROGRESS_STAGES.DETECTING_FONTS.stage, PROGRESS_STAGES.DETECTING_FONTS.percentage);

  const fontRequirements = await detectFonts(tsx);

  logger.debug('PdfConverter', 'Step 1: Detected fonts', {
    count: fontRequirements.length,
  });

  return fontRequirements;
}

/**
 * Step 2: Fetch required fonts from repositories
 */
async function fetchFontsStep(
  fontRequirements: FontRequirement[],
  fontRepository: IFontRepository,
  logger: ILogger,
  onProgress: ((stage: string, percentage: number) => void) | undefined,
  onFontFetch: ((current: number, total: number, fontFamily: string) => void) | undefined,
): Promise<FontData[]> {
  onProgress?.(PROGRESS_STAGES.FETCHING_FONTS.stage, PROGRESS_STAGES.FETCHING_FONTS.percentage);

  const fontData = await fetchFontsFromRequirements(
    fontRequirements,
    fontRepository,
    logger,
    onFontFetch,
  );

  logger.debug('PdfConverter', 'Step 2: Fetched fonts', { count: fontData.length });

  return fontData;
}

/**
 * Step 3: Convert TSX to PDF with fonts
 */
async function convertToPdfStep(
  tsx: string,
  config: ConversionConfig,
  fontData: FontData[],
  onProgress: ((stage: string, percentage: number) => void) | undefined,
  logger: ILogger,
): Promise<Uint8Array> {
  onProgress?.(PROGRESS_STAGES.PARSING.stage, PROGRESS_STAGES.PARSING.percentage);

  // Build WASM font collection
  const fontCollection = buildFontCollection(fontData);

  // Prepare WASM config
  const wasmConfig = convertConfigToRust(config, logger);

  // Create progress wrapper
  const progressCallback = createProgressWrapper(onProgress, logger);

  // Convert with WASM
  const converterInstance = createConverterInstance();
  try {
    const pdfBytes = converterInstance.convert_tsx_to_pdf(
      tsx,
      wasmConfig,
      fontCollection,
      progressCallback,
    );

    // Validate PDF output
    const validationResult = validatePdfBytes(pdfBytes);
    if (validationResult.isErr()) {
      throw new Error(validationResult.error.message);
    }
    return validationResult.value;
  } finally {
    converterInstance.free();
  }
}
