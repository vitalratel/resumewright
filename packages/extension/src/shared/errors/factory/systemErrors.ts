/**
 * System Error Factory
 * Split from errorFactory.ts for better organization
 *
 * Handles system-level errors (memory, timeouts, unknown)
 */

import type { ConversionError, ConversionStatus, LocationErrorMetadata } from '../../types/models';
import { ErrorCode } from '../codes';
import { createConversionError } from './errorFactory';

/**
 * Creates a memory limit exceeded error
 *
 * @param stage - Conversion stage where error occurred
 * @param metadata - Optional metadata (file size, max size)
 * @returns ConversionError configured for memory limit failures
 */
export function createMemoryLimitError(
  stage: ConversionStatus,
  metadata?: LocationErrorMetadata,
): ConversionError {
  return createConversionError({
    code: ErrorCode.MEMORY_LIMIT_EXCEEDED,
    stage,
    metadata,
  });
}

/**
 * Creates a timeout error
 *
 * @param stage - Conversion stage where error occurred
 * @param type - Timeout type ('render' or 'conversion')
 * @returns ConversionError configured for timeout failures
 */
export function createTimeoutError(
  stage: ConversionStatus,
  type: 'render' | 'conversion' = 'conversion',
): ConversionError {
  return createConversionError({
    code: type === 'render' ? ErrorCode.RENDER_TIMEOUT : ErrorCode.CONVERSION_TIMEOUT,
    stage,
  });
}

/**
 * Creates an unknown error (fallback)
 *
 * @param stage - Conversion stage where error occurred
 * @param technicalDetails - Optional technical error details
 * @returns ConversionError for unexpected errors
 */
export function createUnknownError(
  stage: ConversionStatus,
  technicalDetails?: string,
): ConversionError {
  return createConversionError({
    code: ErrorCode.UNKNOWN_ERROR,
    stage,
    technicalDetails,
  });
}

/**
 * Converts a generic Error to ConversionError
 *
 * @param error - The error to convert
 * @param stage - Conversion stage where error occurred
 * @param defaultCode - Error code to use (defaults to UNKNOWN_ERROR)
 * @returns ConversionError with extracted error information
 */
export function errorToConversionError(
  error: unknown,
  stage: ConversionStatus,
  defaultCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
): ConversionError {
  if (error instanceof Error) {
    return createConversionError({
      code: defaultCode,
      stage,
      technicalDetails: error.message,
    });
  }

  return createConversionError({
    code: defaultCode,
    stage,
    technicalDetails: String(error),
  });
}
