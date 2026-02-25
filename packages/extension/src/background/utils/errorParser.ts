/**
 * Error Parser Utility
 * Converts raw errors into structured ConversionError objects
 * Sanitizes error messages for security
 */

/**
 * Parse and enrich error information for ConversionError.
 * Provides user-friendly errors with full debugging context.
 * Sanitizes messages to prevent information disclosure.
 */
import type { ErrorCode } from '../../shared/errors/codes';
import { createConversionError } from '../../shared/errors/factory/errorFactory';
import { ERROR_CATEGORIES } from '../../shared/errors/metadata';
import type { ConversionError } from '../../shared/types/models';
import { sanitizeTechnicalDetails } from './errorSanitization';

export function parseConversionError(error: unknown, _jobId: string): ConversionError {
  // If already a ConversionError, use it directly
  if (
    error !== null &&
    error !== undefined &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error
  ) {
    const existing = error as ConversionError;
    // Ensure category is set
    if (
      (existing.category === null || existing.category === undefined) &&
      existing.code !== null &&
      existing.code !== undefined
    ) {
      existing.category = ERROR_CATEGORIES[existing.code];
    }
    return existing;
  }

  // Parse standard Error objects
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Pattern matching to determine error code and conversion stage
  let code = 'UNKNOWN_ERROR';
  let stage: ConversionError['stage'] = 'generating-pdf';

  if (errorMessage.includes('parse') || errorMessage.includes('syntax')) {
    code = 'TSX_PARSE_ERROR';
    stage = 'parsing';
  } else if (errorMessage.includes('WASM') || errorMessage.includes('WebAssembly')) {
    code = 'WASM_EXECUTION_ERROR';
    stage = 'queued';
  } else if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
    code = 'MEMORY_LIMIT_EXCEEDED';
    stage = 'laying-out';
  } else if (errorMessage.includes('timeout')) {
    code = 'CONVERSION_TIMEOUT';
    stage = 'generating-pdf';
  } else if (errorMessage.includes('font')) {
    code = 'FONT_LOAD_ERROR';
    stage = 'generating-pdf';
  } else if (errorMessage.includes('layout')) {
    code = 'PDF_LAYOUT_ERROR';
    stage = 'laying-out';
  } else {
    code = 'PDF_GENERATION_FAILED';
    stage = 'generating-pdf';
  }

  // Sanitize stack trace before passing as technical details
  // This prevents file paths, extension IDs, and other sensitive info from being displayed
  // Note: Original error is still logged in conversionHandler for debugging
  const sanitizedTechnicalDetails = sanitizeTechnicalDetails(
    errorStack !== null && errorStack !== undefined && errorStack !== ''
      ? errorStack
      : errorMessage,
  );

  return createConversionError({
    code: code as ErrorCode,
    stage,
    technicalDetails: sanitizedTechnicalDetails,
  });
}
