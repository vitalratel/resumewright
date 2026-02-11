// ABOUTME: Reactive error logging with deduplication by code+timestamp.
// ABOUTME: Logs structured error details and formatted reports for debugging.

import type { Accessor } from 'solid-js';
import { createEffect } from 'solid-js';
import type { ErrorCategory } from '@/shared/errors/codes';
import type { ERROR_MESSAGES } from '@/shared/errors/messages';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import type { ConversionError } from '@/shared/types/models';

type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];

interface ErrorLoggingOptions {
  category?: Accessor<ErrorCategory | undefined>;
  errorMessage?: Accessor<ErrorMessage | undefined>;
}

/**
 * Log comprehensive error details for debugging.
 *
 * Logger automatically gates based on environment (dev mode only).
 * Only logs when code or timestamp changes (unique errors).
 *
 * @param error - Accessor returning the current ConversionError
 * @param options - Optional category and errorMessage accessors
 */
export function createErrorLogging(
  error: Accessor<ConversionError>,
  options?: ErrorLoggingOptions,
): void {
  let prevCode: string | undefined;
  let prevTimestamp: number | undefined;

  createEffect(() => {
    const err = error();
    const { code, timestamp } = err;

    // Only log when code or timestamp changes (unique errors)
    if (code === prevCode && timestamp === prevTimestamp) return;
    prevCode = code;
    prevTimestamp = timestamp;

    const category = options?.category?.();
    const errorMsg = options?.errorMessage?.();
    const logger = getLogger();

    // Structured error log for programmatic access
    logger.error('ErrorState', 'Error displayed', {
      code: err.code,
      category,
      message: err.message,
      technicalDetails: err.technicalDetails,
      metadata: err.metadata,
      timestamp: err.timestamp,
      recoverable: err.recoverable,
      suggestions: err.suggestions,
    });

    // Formatted error report for manual debugging
    logger.error(
      'ErrorState',
      `=== ResumeWright Error Report ===
Error Code: ${err.code}
Category: ${category !== null && category !== undefined ? category : 'UNKNOWN'}
--- User-Facing Message ---
${errorMsg?.title !== null && errorMsg?.title !== undefined && errorMsg?.title !== '' ? errorMsg.title : 'An error occurred'}
${errorMsg?.description !== null && errorMsg?.description !== undefined && errorMsg?.description !== '' ? errorMsg.description : err.message}
--- Technical Details ---
${err.technicalDetails !== null && err.technicalDetails !== undefined && err.technicalDetails !== '' ? err.technicalDetails : 'No technical details available'}
${err.metadata !== null && err.metadata !== undefined ? `--- Metadata ---\n${JSON.stringify(err.metadata, null, 2)}` : ''}
`,
    );
  });
}
