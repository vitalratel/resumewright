/**
 * Error Factory (Base)
 *
 * Contains the base createConversionError function used by all category-specific factories.
 */

import type { ConversionError } from '../../types/models';
import type { ErrorCode } from '../codes';
import { ERROR_MESSAGES, ERROR_RECOVERABLE, ERROR_SUGGESTIONS } from '../messages';
import { ERROR_CATEGORIES } from '../metadata';

/**
 * Options for creating a ConversionError
 */
export interface CreateErrorOptions {
  /** Error code from ErrorCode enum */
  code: ErrorCode;

  /** Optional custom message (overrides default) */
  message?: string;

  /** Optional technical details for debugging */
  technicalDetails?: string;
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
  const { code, message, technicalDetails } = options;

  const errorMessage = ERROR_MESSAGES[code];

  return {
    code,
    message: message ?? (typeof errorMessage === 'string' ? errorMessage : errorMessage.title),
    technicalDetails,
    recoverable: ERROR_RECOVERABLE[code],
    suggestions: ERROR_SUGGESTIONS[code],
    category: ERROR_CATEGORIES[code],
  };
}
