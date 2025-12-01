/**
 * Type guard functions for runtime type checking.
 *
 * These guards provide type-safe narrowing for discriminated unions
 * and help avoid unsafe type assertions throughout the codebase.
 */

import type { FontData } from '../domain/fonts/models/Font';
import type {
  ConversionConfig,
  ConversionError,
  ConversionResult,
  PDFMetadata,
} from '../types/models';

/**
 * Type guard for successful conversion result.
 *
 * JSDoc example for type guard usage
 * @example
 * ```ts
 * const result = await convertTsxToPdfWithFonts(tsx, config);
 * if (isConversionSuccess(result)) {
 *   // result.pdfBytes is now safely accessible
 *   await downloadPdf(result.pdfBytes, result.metadata);
 * }
 * ```
 */
export function isConversionSuccess(
  result: ConversionResult,
): result is { success: true; pdfBytes: Uint8Array; metadata: PDFMetadata } {
  return result.success === true;
}

/**
 * Type guard for failed conversion result.
 *
 * JSDoc example for type guard usage
 * @example
 * ```ts
 * const result = await convertTsxToPdf(tsx, config);
 * if (isConversionError(result)) {
 *   // result.error is now safely accessible
 *   showError(result.error.message, result.error.code);
 * }
 * ```
 */
export function isConversionError(
  result: ConversionResult,
): result is { success: false; error: ConversionError } {
  return result.success === false;
}

/**
 * Type guard for Uint8Array.
 *
 * JSDoc example for type guard usage
 * @example
 * ```ts
 * function processPdfData(data: unknown) {
 *   if (isUint8Array(data)) {
 *     // data is now typed as Uint8Array
 *     return data.length;
 *   }
 *   throw new Error('Invalid PDF data');
 * }
 * ```
 */
export function isUint8Array(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array;
}

/**
 * Type guard for Error objects.
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard for ConversionError.
 *
 * JSDoc example for type guard usage
 * @example
 * ```ts
 * function handleUnknownError(error: unknown) {
 *   if (isConversionErrorObject(error)) {
 *     // error.code and error.message are now safely accessible
 *     logError(error.code, error.message);
 *   }
 * }
 * ```
 */
export function isConversionErrorObject(value: unknown): value is ConversionError {
  return (
    typeof value === 'object'
    && value !== null
    && 'code' in value
    && 'message' in value
    && typeof (value as { code: unknown }).code === 'string'
    && typeof (value as { message: unknown }).message === 'string'
  );
}

/**
 * Type guard for conversion status - in progress.
 *
 * JSDoc example for type guard usage
 * @example
 * ```ts
 * function updateUI(status: string) {
 *   if (isConversionInProgress(status)) {
 *     showProgressIndicator();
 *   }
 * }
 * ```
 */
export function isConversionInProgress(status: string): boolean {
  return (
    status === 'queued'
    || status === 'parsing'
    || status === 'extracting-metadata'
    || status === 'rendering'
    || status === 'laying-out'
    || status === 'optimizing'
    || status === 'generating-pdf'
  );
}

/**
 * Type guard for conversion status - complete.
 */
export function isConversionComplete(status: string): boolean {
  return status === 'completed';
}

/**
 * Type guard for conversion status - failed.
 */
export function isConversionFailed(status: string): boolean {
  return status === 'failed';
}

/**
 * Type guard for conversion status - cancelled.
 */
export function isConversionCancelled(status: string): boolean {
  return status === 'cancelled';
}

/**
 * Type guard for conversion status - terminal state.
 */
export function isConversionTerminal(status: string): boolean {
  return isConversionComplete(status) || isConversionFailed(status) || isConversionCancelled(status);
}

/**
 * Type guard for non-null values.
 *
 * JSDoc example for type guard usage
 * @example
 * ```ts
 * const values = [1, null, 2, null, 3];
 * const numbers = values.filter(isNotNull); // numbers: number[]
 * ```
 */
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * Type guard for non-undefined values.
 */
export function isNotUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/**
 * Type guard for defined values (not null or undefined).
 *
 * JSDoc example for type guard usage
 * @example
 * ```ts
 * const values = [1, null, undefined, 2, 3];
 * const defined = values.filter(isDefined); // defined: number[]
 * ```
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for FontData.
 * Validates that an unknown value conforms to the FontData interface.
 *
 * JSDoc example for type guard usage
 * @example
 * ```ts
 * function loadFont(data: unknown): FontData {
 *   if (isFontData(data)) {
 *     return data; // data is now typed as FontData
 *   }
 *   throw new Error('Invalid font data');
 * }
 * ```
 */
export function isFontData(value: unknown): value is FontData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.family === 'string'
    && (typeof obj.weight === 'number' || typeof obj.weight === 'string')
    && (obj.style === 'normal' || obj.style === 'italic')
    && obj.bytes instanceof Uint8Array
    && (obj.format === 'truetype' || obj.format === 'opentype' || obj.format === 'woff' || obj.format === 'woff2')
  );
}

/**
 * Type guard for ConversionConfig.
 * Validates that an unknown value conforms to the ConversionConfig interface.
 *
 * JSDoc example for type guard usage
 * @example
 * ```ts
 * async function loadConfig(stored: unknown): Promise<ConversionConfig> {
 *   if (isConversionConfig(stored)) {
 *     return stored; // stored is now typed as ConversionConfig
 *   }
 *   return getDefaultConfig();
 * }
 * ```
 */
export function isConversionConfig(value: unknown): value is ConversionConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Check required fields
  if (
    (obj.pageSize !== 'Letter' && obj.pageSize !== 'A4' && obj.pageSize !== 'Legal')
    || typeof obj.fontSize !== 'number'
    || typeof obj.fontFamily !== 'string'
    || typeof obj.compress !== 'boolean'
  ) {
    return false;
  }

  // Check margin object
  if (
    typeof obj.margin !== 'object'
    || obj.margin === null
    || typeof (obj.margin as Record<string, unknown>).top !== 'number'
    || typeof (obj.margin as Record<string, unknown>).right !== 'number'
    || typeof (obj.margin as Record<string, unknown>).bottom !== 'number'
    || typeof (obj.margin as Record<string, unknown>).left !== 'number'
  ) {
    return false;
  }

  // Check optional fields if present
  if (obj.filename !== undefined && typeof obj.filename !== 'string') {
    return false;
  }
  if (obj.atsOptimization !== undefined && typeof obj.atsOptimization !== 'boolean') {
    return false;
  }
  if (obj.includeMetadata !== undefined && typeof obj.includeMetadata !== 'boolean') {
    return false;
  }

  return true;
}
