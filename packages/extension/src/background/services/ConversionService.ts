// ABOUTME: PDF conversion business logic functions.
// ABOUTME: Handles metadata extraction, config loading, and PDF generation.

import { extract_cv_metadata } from '@pkg/wasm_bridge';
import { DEFAULT_CONVERSION_CONFIG } from '@/shared/domain/settings/defaults';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import { loadSettings } from '@/shared/infrastructure/settings/SettingsStore';
import { convertTsxToPdfWithFonts } from '../../shared/application/pdf/converter';
import { ExponentialBackoffRetryPolicy } from '../../shared/infrastructure/retry/ExponentialBackoffRetryPolicy';
import type { ConversionRequestPayload } from '../../shared/types/messages';
import type { ConversionConfig } from '../../shared/types/models';
import { generateFilename } from '../../shared/utils/filenameSanitization';

/**
 * CV metadata extracted from TSX content
 */
export interface CVMetadata {
  /** Candidate name extracted from CV */
  name?: string;
  /** Job title extracted from CV */
  title?: string;
}

/**
 * Result of CV metadata extraction
 */
export interface CVExtractionResult {
  /** TSX source code */
  tsxContent: string;
  /** Extracted CV metadata (may be null if extraction failed) */
  cvMetadata: CVMetadata | null;
}

/**
 * Result of PDF conversion
 */
export interface ConversionResult {
  /** Generated PDF bytes */
  pdfBytes: Uint8Array;
  /** Sanitized filename (undefined if generation failed) */
  filename: string | undefined;
  /** Conversion duration in milliseconds */
  duration: number;
}

/**
 * Retry callback for progress updates during retry attempts
 */
export type RetryCallback = (attempt: number, delay: number, error: Error) => void;

/**
 * Extracts TSX content and CV metadata from payload
 *
 * Attempts to extract metadata in this order:
 * 1. Parse CV content with WASM (extracts name, title)
 * 2. Extract name from filename if WASM parsing fails
 *
 * @param payload - Conversion request payload
 * @returns TSX content and optional CV metadata
 * @throws Error if no TSX content provided
 */
export async function extractCVMetadata(
  payload: ConversionRequestPayload,
): Promise<CVExtractionResult> {
  if (payload.tsx === null || payload.tsx === undefined || payload.tsx.trim() === '') {
    throw new Error('No TSX content found. Please import a TSX file.');
  }

  getLogger().info('ConversionService', 'Extracting CV metadata from TSX');
  const tsxContent = payload.tsx;
  let cvMetadata: CVMetadata | null = null;

  // Attempt to extract metadata from CV content using WASM parser
  try {
    const wasmMetadata = extract_cv_metadata(tsxContent);
    cvMetadata = {
      name: wasmMetadata.name,
      title: wasmMetadata.title,
    };
    getLogger().debug('ConversionService', 'Extracted metadata from CV content', cvMetadata);
  } catch (error) {
    getLogger().warn('ConversionService', 'Failed to extract metadata from CV content', error);

    // Fallback: Extract name from filename if metadata extraction fails
    // Handles formats like "John_Doe_Resume.tsx" -> "John Doe"
    if (
      payload.fileName !== null &&
      payload.fileName !== undefined &&
      payload.fileName.trim() !== ''
    ) {
      const nameMatch = payload.fileName.match(/^(.+?)(?:_Resume|_CV)?\.(?:tsx|ts|jsx|js)$/i);
      if (nameMatch !== null) {
        cvMetadata = { name: nameMatch[1].replace(/_/g, ' ') };
        getLogger().debug('ConversionService', 'Extracted name from filename', cvMetadata);
      }
    }
  }

  return { tsxContent, cvMetadata };
}

/**
 * Loads and validates conversion configuration
 *
 * Priority order:
 * 1. Payload config (from UI quick settings)
 * 2. User settings (from storage)
 * 3. Hardcoded defaults (fallback if settings corrupted)
 *
 * @param payload - Conversion request payload with optional config
 * @returns Validated conversion configuration
 */
export async function loadConversionConfig(
  payload: ConversionRequestPayload,
): Promise<ConversionConfig> {
  const settings = await loadSettings();
  let config = payload.config || settings.defaultConfig;

  // Fallback to hardcoded defaults if config is missing or invalid
  // Prevents conversion failures from corrupted settings
  if (config === null || config === undefined || !config.pageSize) {
    getLogger().warn('ConversionService', 'Config missing or invalid, using hardcoded defaults');
    config = DEFAULT_CONVERSION_CONFIG;
  }

  getLogger().debug('ConversionService', 'Loaded conversion config', config);
  return config;
}

/**
 * Converts TSX to PDF with retry logic
 *
 * Uses exponential backoff retry policy:
 * - Max 3 attempts
 * - Base delay: 1000ms
 * - Max delay: 8000ms
 * - Total timeout: 20000ms
 *
 * @param tsxContent - TSX source code to convert
 * @param config - Conversion configuration
 * @param onProgress - Progress callback for UI updates
 * @param onRetry - Callback invoked before each retry attempt
 * @returns PDF bytes as Uint8Array
 * @throws Error if all retry attempts exhausted or non-recoverable error
 */
export async function convertToPdf(
  tsxContent: string,
  config: ConversionConfig,
  onProgress?: (stage: string, percentage: number) => void,
  onRetry?: RetryCallback,
): Promise<Uint8Array> {
  const startTime = performance.now();

  // Font fetch progress callback - logs font fetching for debugging
  const onFontFetch = (current: number, total: number, fontFamily: string) => {
    getLogger().debug('ConversionService', 'Fetching font', {
      current,
      total,
      fontFamily,
      progress: `${current}/${total}`,
    });
  };

  const pdfBytes = await ExponentialBackoffRetryPolicy.presets.default.execute(
    async () => convertTsxToPdfWithFonts(tsxContent, config, onProgress, onFontFetch),
    onRetry,
  );

  const duration = performance.now() - startTime;
  getLogger().info('ConversionService', 'PDF conversion completed', {
    duration: duration.toFixed(0),
    fileSize: pdfBytes.length,
  });

  return pdfBytes;
}

/**
 * Generates sanitized filename from CV metadata
 *
 * Filename format: "{name}_Resume.pdf"
 * Falls back to timestamp if name unavailable or sanitization fails
 *
 * @param cvMetadata - Optional CV metadata containing name
 * @returns Sanitized filename or undefined if generation fails
 */
export function generateConversionFilename(cvMetadata: CVMetadata | null): string | undefined {
  try {
    const cvName = cvMetadata?.name;
    const filename = generateFilename(cvName);
    getLogger().debug('ConversionService', `Generated filename: ${filename}`, { cvName });
    return filename;
  } catch (error) {
    // Filename generation is optional - continue conversion even if it fails
    // User can manually rename the downloaded PDF
    getLogger().error('ConversionService', 'Filename generation failed', error);
    return undefined;
  }
}

/**
 * Performs complete conversion workflow
 *
 * Orchestrates:
 * 1. CV metadata extraction
 * 2. Config loading
 * 3. PDF conversion with retry
 * 4. Filename generation
 *
 * @param payload - Conversion request payload
 * @param onProgress - Progress callback for UI updates
 * @param onRetry - Callback invoked before each retry attempt
 * @returns Conversion result with PDF bytes, filename, and duration
 */
export async function convert(
  payload: ConversionRequestPayload,
  onProgress?: (stage: string, percentage: number) => void,
  onRetry?: RetryCallback,
): Promise<ConversionResult> {
  const startTime = performance.now();

  // Extract CV metadata
  const { tsxContent, cvMetadata } = await extractCVMetadata(payload);

  // Load configuration
  const config = await loadConversionConfig(payload);

  // Convert to PDF
  const pdfBytes = await convertToPdf(tsxContent, config, onProgress, onRetry);

  // Generate filename
  const filename = generateConversionFilename(cvMetadata);

  const duration = performance.now() - startTime;

  return {
    pdfBytes,
    filename,
    duration,
  };
}
