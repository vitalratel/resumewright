/**
 * Error Factory (Base)
 * Refactored to split category-specific factories
 *
 * Contains the base createConversionError function used by all category-specific factories.
 *
 * Category-specific error creators are now in:
 * - validationErrors.ts (TSX parsing, structure validation)
 * - wasmErrors.ts (WASM initialization, execution)
 * - pdfErrors.ts (PDF generation, layout, download)
 * - networkErrors.ts (Font loading, resource fetching)
 * - systemErrors.ts (Memory, timeouts, unknown errors)
 *
 * Import from './factory/' index for all error creation functions.
 */

import type {
  ErrorCode,
} from '../../types/errors/';
import type { ConversionError, ConversionStatus, ErrorMetadata } from '../../types/models';
import {
  ERROR_CATEGORIES,
  ERROR_MESSAGES,
  ERROR_RECOVERABLE,
  ERROR_SUGGESTIONS,
} from '../../types/errors/';
import { generateErrorId, trackError } from '../tracking/telemetry';

/**
 * Options for creating a ConversionError
 */
export interface CreateErrorOptions {
  /** Error code from ErrorCode enum */
  code: ErrorCode;

  /** Conversion stage where error occurred */
  stage: ConversionStatus;

  /** Optional custom message (overrides default) */
  message?: string;

  /** Optional technical details for debugging */
  technicalDetails?: string;

  /** Optional error metadata - Discriminated union type */
  metadata?: ErrorMetadata;
}

/**
 * Creates a ConversionError with enforced error codes and automatic message mapping.
 *
 * @param options - Error creation options
 * @returns Fully populated ConversionError
 *
 * @example
 * ```ts
 * const error = createConversionError({
 *   code: ErrorCode.TSX_PARSE_ERROR,
 *   stage: 'parsing',
 *   technicalDetails: 'Unexpected token at line 42',
 *   metadata: { line: 42, column: 10 }
 * });
 * ```
 */
export function createConversionError(options: CreateErrorOptions): ConversionError {
  const {
    code,
    stage,
    message,
    technicalDetails,
    metadata,
  } = options;

  const errorMessage = ERROR_MESSAGES[code];

  // FIX: Use lazy getters for expensive properties to reduce memory overhead
  // Only compute suggestions, category, and metadata when accessed
  const error = {
    code,
    stage,
    message: message ?? (typeof errorMessage === 'string' ? errorMessage : errorMessage.title),
    technicalDetails,
    recoverable: ERROR_RECOVERABLE[code],
    timestamp: Date.now(),
    errorId: generateErrorId(), // Generate unique error ID
  } as ConversionError;

  // FIX: Lazy getter for suggestions (only accessed when displaying error UI)
  Object.defineProperty(error, 'suggestions', {
    get: () => ERROR_SUGGESTIONS[code],
    enumerable: true,
    configurable: true,
  });

  // FIX: Lazy getter for category (only accessed for error presentation)
  Object.defineProperty(error, 'category', {
    get: () => ERROR_CATEGORIES[code],
    enumerable: true,
    configurable: true,
  });

  // FIX: Lazy getter for metadata (only accessed when error details expanded)
  Object.defineProperty(error, 'metadata', {
    get: () => metadata,
    enumerable: true,
    configurable: true,
  });

  // Track error in telemetry (async, non-blocking)
  void trackError({
    errorId: error.errorId,
    timestamp: new Date(error.timestamp).toISOString(),
    code: error.code,
    message: error.message,
    category: error.category,
    technicalDetails: error.technicalDetails,
    metadata: error.metadata as Record<string, unknown> | undefined,
  });

  return error;
}
