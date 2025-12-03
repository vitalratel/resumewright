/**
 * Error Parser Utility
 * Converts raw errors into structured ConversionError objects
 * Sanitizes error messages for security
 */

import { generateErrorId } from '@/shared/errors/tracking/telemetry';
import { ERROR_CATEGORIES, ErrorCategory } from '../../shared/errors';
/**
 * Parse and enrich error information for ConversionError.
 * Provides user-friendly errors with full debugging context.
 * Sanitizes messages to prevent information disclosure.
 */
import type { ErrorCode } from '../../shared/errors/codes';
import type { ConversionError } from '../../shared/types/models';

import { sanitizeErrorMessage, sanitizeTechnicalDetails } from './errorSanitization';

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

  // Determine error code and category based on message content
  let code = 'UNKNOWN_ERROR';
  let category: ErrorCategory = ErrorCategory.UNKNOWN;
  let stage: ConversionError['stage'] = 'generating-pdf';
  let suggestions: string[] = [
    'Try restarting the extension',
    'Reload the page',
    'Report this error if it persists',
  ];

  // Pattern matching to determine error type
  if (errorMessage.includes('parse') || errorMessage.includes('syntax')) {
    code = 'TSX_PARSE_ERROR';
    category = ErrorCategory.SYNTAX;
    stage = 'parsing';
    suggestions = [
      'The CV code may be incomplete or corrupted',
      'Try regenerating the CV in Claude',
      'Report this issue if the problem persists',
    ];
  } else if (errorMessage.includes('WASM') || errorMessage.includes('WebAssembly')) {
    code = 'WASM_EXECUTION_ERROR';
    category = ErrorCategory.SYSTEM;
    stage = 'queued';
    suggestions = [
      'Try restarting your browser',
      'Check if your browser supports WebAssembly',
      'Update your browser to the latest version',
    ];
  } else if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
    code = 'MEMORY_LIMIT_EXCEEDED';
    category = ErrorCategory.SIZE;
    stage = 'laying-out';
    suggestions = ['Your CV is too large', 'Try reducing the content', 'Split into multiple CVs'];
  } else if (errorMessage.includes('timeout')) {
    code = 'CONVERSION_TIMEOUT';
    category = ErrorCategory.SYSTEM;
    stage = 'generating-pdf';
    suggestions = [
      'Conversion is taking too long',
      'Try a simpler CV',
      'Check your system resources',
    ];
  } else if (errorMessage.includes('font')) {
    code = 'FONT_LOAD_ERROR';
    category = ErrorCategory.NETWORK;
    stage = 'generating-pdf';
    suggestions = [
      'Check your internet connection',
      'Try using a standard font',
      'Reload the extension',
    ];
  } else if (errorMessage.includes('layout')) {
    code = 'PDF_LAYOUT_ERROR';
    category = ErrorCategory.SYSTEM;
    stage = 'laying-out';
    suggestions = [
      'Adjust page margins in settings',
      'Try a different page size',
      'Simplify CV formatting',
    ];
  } else {
    code = 'PDF_GENERATION_FAILED';
    category = ErrorCategory.SYSTEM;
    stage = 'generating-pdf';
    suggestions = [
      'Try simplifying your CV',
      'Reduce the number of sections',
      'Try again with different settings',
    ];
  }

  // Sanitize error message and technical details before sending to popup
  // This prevents file paths, extension IDs, and other sensitive info from being displayed
  // Note: Original error is still logged in conversionHandler for debugging
  const sanitizedMessage = sanitizeErrorMessage(errorMessage);
  const sanitizedTechnicalDetails = sanitizeTechnicalDetails(
    errorStack !== null && errorStack !== undefined && errorStack !== ''
      ? errorStack
      : errorMessage,
  );

  return {
    stage,
    code: code as ErrorCode,
    message: sanitizedMessage,
    timestamp: Date.now(),
    errorId: generateErrorId(),
    technicalDetails: sanitizedTechnicalDetails,
    recoverable: code !== 'MEMORY_LIMIT_EXCEEDED', // Size errors not recoverable
    suggestions,
    category,
    // Removed jobId from metadata (not part of ErrorMetadata discriminated union)
    // JobId tracking should be handled separately from error metadata
  };
}
