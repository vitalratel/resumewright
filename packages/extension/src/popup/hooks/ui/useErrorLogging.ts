/**
 * Hook for error logging with optimized dependencies
 * Extracted from ErrorState component for reusability
 */

import { useEffect, useRef } from 'react';
import type { ERROR_MESSAGES, ErrorCategory } from '@/shared/errors/';
import { getLogger } from '@/shared/infrastructure/logging';
import type { ConversionError } from '@/shared/types/models';

type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];

/**
 * Log comprehensive error details for debugging
 *
 * Logger automatically gates based on environment (dev mode only)
 * Only logs when errorId or code changes (unique errors)
 */
export function useErrorLogging(
  error: ConversionError,
  category?: ErrorCategory,
  errorMessage?: ErrorMessage,
): void {
  const {
    errorId,
    code,
    message,
    technicalDetails,
    metadata,
    timestamp,
    recoverable,
    suggestions,
  } = error;

  // Track previous error to detect changes
  const prevErrorRef = useRef<{ errorId?: string; code: string } | null>(null);

  useEffect(() => {
    // Only log when errorId or code actually changes
    const prev = prevErrorRef.current;
    if (prev !== null && prev.errorId === errorId && prev.code === code) {
      return;
    }
    prevErrorRef.current = { errorId, code };

    const logger = getLogger();

    // Structured error log for programmatic access
    logger.error('ErrorState', 'Error displayed', {
      errorId,
      code,
      category,
      message,
      technicalDetails,
      metadata,
      timestamp,
      recoverable,
      suggestions,
    });

    // Formatted error report for manual debugging
    logger.error(
      'ErrorState',
      `=== ResumeWright Error Report ===
Error ID: ${errorId !== null && errorId !== undefined && errorId !== '' ? errorId : 'N/A'}
Error Code: ${code}
Category: ${category !== null && category !== undefined ? category : 'UNKNOWN'}
--- User-Facing Message ---
${errorMessage?.title !== null && errorMessage?.title !== undefined && errorMessage?.title !== '' ? errorMessage.title : 'An error occurred'}
${errorMessage?.description !== null && errorMessage?.description !== undefined && errorMessage?.description !== '' ? errorMessage.description : message}
--- Technical Details ---
${technicalDetails !== null && technicalDetails !== undefined && technicalDetails !== '' ? technicalDetails : 'No technical details available'}
${metadata !== null && metadata !== undefined ? `--- Metadata ---\n${JSON.stringify(metadata, null, 2)}` : ''}
`,
    );
  }, [
    errorId,
    code,
    category,
    message,
    technicalDetails,
    metadata,
    timestamp,
    recoverable,
    suggestions,
    errorMessage,
  ]);
}
