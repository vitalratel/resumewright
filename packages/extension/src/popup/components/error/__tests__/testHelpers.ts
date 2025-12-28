// ABOUTME: Shared test utilities for error component tests.
// ABOUTME: Provides factory functions to reduce boilerplate.

import { ErrorCode } from '@/shared/errors/codes';
import type { ConversionError } from '@/shared/types/models';

/**
 * Factory function to create ConversionError objects with defaults
 *
 * @example
 * const error = createError({ code: ErrorCode.TSX_PARSE_ERROR });
 */
export function createError(overrides: Partial<ConversionError> = {}): ConversionError {
  return {
    stage: 'generating-pdf',
    code: ErrorCode.WASM_EXECUTION_ERROR,
    message: 'Test error',
    timestamp: Date.now(),
    recoverable: true,
    suggestions: [],
    technicalDetails: 'Test technical details',
    ...overrides,
  };
}
