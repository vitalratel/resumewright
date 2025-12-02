/**
 * Hook for error logging with optimized dependencies
 * Extracted from ErrorState component for reusability
 */

import type { ERROR_MESSAGES, ErrorCategory } from '@/shared/errors/';
import type { ConversionError } from '@/shared/types/models';
import { useEffect, useRef } from 'react';
import { getLogger } from '@/shared/infrastructure/logging';

const logger = getLogger();

type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES];

/**
 * Log comprehensive error details for debugging
 *
 * Logger automatically gates based on environment (dev mode only)
 * Destructure only needed fields to prevent re-renders
 * Optimize useEffect dependencies - use ref to avoid re-running on every prop change
 *
 * Only logs when errorId or code changes (unique errors), but includes full error details
 */
export function useErrorLogging(error: ConversionError, category?: ErrorCategory, errorMessage?: ErrorMessage): void {
  const { errorId, code, message, technicalDetails, metadata, timestamp, recoverable, suggestions } = error;

  // Use ref to avoid re-running logging on every prop change
  const errorRef = useRef({ errorId, code, category, message, technicalDetails, metadata, timestamp, recoverable, suggestions, errorMessage });

  // React 19 pattern: Update ref in effect, not during render
  useEffect(() => {
    errorRef.current = { errorId, code, category, message, technicalDetails, metadata, timestamp, recoverable, suggestions, errorMessage };
  });

  // Only re-log when error ID or code changes (performance optimization)
  useEffect(() => {
    const err = errorRef.current;

    // Structured error log for programmatic access
    logger.error('ErrorState', 'Error displayed', {
      errorId: err.errorId,
      code: err.code,
      category: err.category,
      message: err.message,
      technicalDetails: err.technicalDetails,
      metadata: err.metadata,
      timestamp: err.timestamp,
      recoverable: err.recoverable,
      suggestions: err.suggestions,
    });

    // Formatted error report for manual debugging
    logger.error('ErrorState', `=== ResumeWright Error Report ===
Error ID: ${(err.errorId !== null && err.errorId !== undefined && err.errorId !== '') ? err.errorId : 'N/A'}
Error Code: ${err.code}
Category: ${(err.category !== null && err.category !== undefined) ? err.category : 'UNKNOWN'}
--- User-Facing Message ---
${(err.errorMessage?.title !== null && err.errorMessage?.title !== undefined && err.errorMessage?.title !== '') ? err.errorMessage.title : 'An error occurred'}
${(err.errorMessage?.description !== null && err.errorMessage?.description !== undefined && err.errorMessage?.description !== '') ? err.errorMessage.description : err.message}
--- Technical Details ---
${(err.technicalDetails !== null && err.technicalDetails !== undefined && err.technicalDetails !== '') ? err.technicalDetails : 'No technical details available'}
${(err.metadata !== null && err.metadata !== undefined) ? `--- Metadata ---\n${JSON.stringify(err.metadata, null, 2)}` : ''}
`);
  }, [errorId, code]); // Only re-log when error ID or code changes
}
