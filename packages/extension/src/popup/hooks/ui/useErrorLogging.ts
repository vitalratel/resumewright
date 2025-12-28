/**
 * Hook for error logging with optimized dependencies
 * Extracted from ErrorState component for reusability
 */

import { useEffect, useRef } from 'react';
import type { ErrorCategory } from '@/shared/errors/codes';
import type { ERROR_MESSAGES } from '@/shared/errors/messages';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import type { ConversionError } from '@/shared/types/models';

type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];

/**
 * Log comprehensive error details for debugging
 *
 * Logger automatically gates based on environment (dev mode only)
 * Only logs when code or timestamp changes (unique errors)
 */
export function useErrorLogging(
  error: ConversionError,
  category?: ErrorCategory,
  errorMessage?: ErrorMessage,
): void {
  const { code, message, technicalDetails, metadata, timestamp, recoverable, suggestions } = error;

  // Track previous error to detect changes
  const prevErrorRef = useRef<{ code: string; timestamp: number } | null>(null);

  useEffect(() => {
    // Only log when code or timestamp actually changes
    const prev = prevErrorRef.current;
    if (prev !== null && prev.code === code && prev.timestamp === timestamp) {
      return;
    }
    prevErrorRef.current = { code, timestamp };

    const logger = getLogger();

    // Structured error log for programmatic access
    logger.error('ErrorState', 'Error displayed', {
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
