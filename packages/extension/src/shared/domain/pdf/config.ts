/**
 * Config Adapter Module
 *
 * Converts TypeScript ConversionConfig to WASM-compatible format.
 */

import type { ILogger } from '../../infrastructure/logging';
import type { ConversionConfig } from '../../types/models';
import { DEFAULT_PDF_CONFIG, PDF_STANDARDS } from './constants';
import type { WasmPdfConfig } from './types';
import { validateWasmPdfConfig } from './wasmSchemas';

/**
 * Convert ConversionConfig to WASM-compatible format
 *
 * Transforms TypeScript config (inches) to Rust config (points).
 * Validates output to ensure WASM compatibility.
 *
 * @param config - TypeScript conversion config
 * @returns WASM-compatible config object
 * @throws Error if config validation fails
 *
 * @example
 * ```typescript
 * const wasmConfig = convertConfigToRust(config);
 * const pdfBytes = converter.convert_tsx_to_pdf(tsx, wasmConfig, fonts);
 * ```
 */
export function convertConfigToRust(config: ConversionConfig, logger: ILogger): WasmPdfConfig {
  logger.debug('PdfConfig', 'Converting config to WASM format', {
    config: JSON.stringify(config, null, 2),
  });

  // Build WASM config with strict types
  const wasmConfig: WasmPdfConfig = {
    page_size: config.pageSize,
    margin: {
      top: convertInchesToPoints(config.margin.top),
      right: convertInchesToPoints(config.margin.right),
      bottom: convertInchesToPoints(config.margin.bottom),
      left: convertInchesToPoints(config.margin.left),
    },
    standard: PDF_STANDARDS.PDFA1B, // Use PDF/A-1b for maximum ATS compatibility
    title:
      config.filename !== null && config.filename !== undefined && config.filename !== ''
        ? config.filename
        : DEFAULT_PDF_CONFIG.filename,
    author: null,
    subject: 'Curriculum Vitae',
    keywords: null,
    creator: DEFAULT_PDF_CONFIG.creator,
  };

  // Validate config structure before sending to WASM
  try {
    validateWasmPdfConfig(wasmConfig);
  } catch (error) {
    logger.error('PdfConfig', 'Config validation failed', error);
    throw error;
  }

  logger.debug('PdfConfig', 'WASM config', { wasmConfig: JSON.stringify(wasmConfig, null, 2) });
  return wasmConfig;
}

/**
 * Convert inches to points (1 inch = 72 points)
 *
 * @param inches - Measurement in inches
 * @returns Measurement in points
 */
function convertInchesToPoints(inches: number): number {
  return inches * 72;
}
