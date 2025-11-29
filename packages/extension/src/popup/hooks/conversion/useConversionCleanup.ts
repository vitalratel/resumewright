/**
 * useConversionCleanup Hook
 * Handles error recovery and cleanup logic
 *
 * Extracted from useConversionHandlers for single responsibility
 */

import type { AppState } from '../integration/useAppState';
import { useCallback } from 'react';
import { reportIssue } from '@/shared/errors/presentation/formatting';

export interface ConversionCleanupHandlers {
  handleRetry: () => void;
  handleDismissError: () => void;
  handleReportIssue: () => void;
}

interface UseConversionCleanupOptions {
  appState: AppState;
}

/**
 * Hook for managing error recovery and cleanup operations
 */
export function useConversionCleanup({ appState }: UseConversionCleanupOptions): ConversionCleanupHandlers {
  const { lastError, reset } = appState;

  // Handle retry on error
  const handleRetry = useCallback(() => {
    reset();
  }, [reset]);

  // Handle dismiss error
  const handleDismissError = useCallback(() => {
    reset();
  }, [reset]);

  // Handle report issue
  const handleReportIssue = useCallback(() => {
    if (lastError) {
      reportIssue(lastError);
    }
  }, [lastError]);

  return {
    handleRetry,
    handleDismissError,
    handleReportIssue,
  };
}
