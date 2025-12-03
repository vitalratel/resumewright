/**
 * useConversionCleanup Hook
 * Handles error recovery and cleanup logic
 *
 * Extracted from useConversionHandlers for single responsibility
 */

import { useCallback } from 'react';
import {
  copyToClipboard,
  formatErrorDetailsForClipboard,
  formatErrorTimestamp,
} from '@/shared/errors';
import type { AppState } from '../integration/useAppState';

export interface ConversionCleanupHandlers {
  handleRetry: () => void;
  handleDismissError: () => void;
  handleReportIssue: () => Promise<void>;
}

interface UseConversionCleanupOptions {
  appState: AppState;
}

/**
 * Hook for managing error recovery and cleanup operations
 */
export function useConversionCleanup({
  appState,
}: UseConversionCleanupOptions): ConversionCleanupHandlers {
  const { lastError, reset } = appState;

  // Handle retry on error
  const handleRetry = useCallback(() => {
    reset();
  }, [reset]);

  // Handle dismiss error
  const handleDismissError = useCallback(() => {
    reset();
  }, [reset]);

  // Handle report issue - copy error details to clipboard
  const handleReportIssue = useCallback(async () => {
    if (lastError) {
      const details = formatErrorDetailsForClipboard({
        errorId: lastError.errorId,
        timestamp: formatErrorTimestamp(new Date(lastError.timestamp)),
        code: lastError.code,
        message: lastError.message,
        category: lastError.category,
        technicalDetails: lastError.technicalDetails,
        metadata: lastError.metadata as Record<string, unknown> | undefined,
      });
      await copyToClipboard(details);
    }
  }, [lastError]);

  return {
    handleRetry,
    handleDismissError,
    handleReportIssue,
  };
}
