// ABOUTME: Consolidates all conversion-related handlers into a single hook.
// ABOUTME: Combines file import, conversion execution, and error recovery logic.

import { useCallback, useMemo } from 'react';
import {
  copyToClipboard,
  formatErrorDetailsForClipboard,
  formatErrorTimestamp,
} from '@/shared/errors/tracking/telemetry';
import { useFileImport } from '../form/useFileImport';
import type { AppState } from '../integration/useAppState';
import { useConversionExecution } from './useConversionExecution';

export interface ConversionHandlers {
  handleFileValidated: (content: string, fileName: string, fileSize: number) => Promise<void>;
  handleExportClick: () => Promise<void>;
  handleCancelConversion?: () => void;
  handleRetry: () => void;
  handleDismissError: () => void;
  handleImportDifferent: () => void;
  handleReportIssue: () => Promise<void>;
}

interface UseConversionHandlersOptions {
  appState: AppState;
  currentJobId: string;
  wasmInitialized: boolean | null;
}

/**
 * Hook for managing all conversion-related handlers
 */
export function useConversionHandlers(options: UseConversionHandlersOptions): ConversionHandlers {
  const { appState, currentJobId, wasmInitialized } = options;
  const { lastError, reset } = appState;

  // File import and validation
  const fileImportHandlers = useFileImport({ appState });

  // Conversion execution and cancellation
  const executionHandlers = useConversionExecution({
    appState,
    currentJobId,
    wasmInitialized,
  });

  // Error recovery handlers (inlined from useConversionCleanup)
  const handleRetry = useCallback(() => {
    reset();
  }, [reset]);

  const handleDismissError = useCallback(() => {
    reset();
  }, [reset]);

  const handleReportIssue = useCallback(async () => {
    if (lastError) {
      const details = formatErrorDetailsForClipboard({
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

  // Memoize combined handlers for stable reference
  return useMemo(
    () => ({
      ...fileImportHandlers,
      ...executionHandlers,
      handleRetry,
      handleDismissError,
      handleReportIssue,
    }),
    [fileImportHandlers, executionHandlers, handleRetry, handleDismissError, handleReportIssue],
  );
}
