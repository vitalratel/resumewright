/**
 * useConversionHandlers Hook
 * Consolidates all conversion-related handlers
 *
 * This is now a composition hook that combines:
 * - useFileImport: File validation and import
 * - useConversionExecution: PDF conversion execution
 * - useConversionCleanup: Error recovery and cleanup
 *
 * Refactored for single responsibility principle
 */

import type { AppState } from '../integration/useAppState';
import { useMemo } from 'react';
import { useFileImport } from '../form/useFileImport';
import { useConversionCleanup } from './useConversionCleanup';
import { useConversionExecution } from './useConversionExecution';

export interface ConversionHandlers {
  handleFileValidated: (content: string, fileName: string, fileSize: number) => Promise<void>;
  handleExportClick: () => Promise<void>;
  handleCancelConversion?: () => void; // Optional to support contexts where cancellation isn't available
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
 *
 * Composed from three focused hooks for better maintainability
 */
export function useConversionHandlers(options: UseConversionHandlersOptions): ConversionHandlers {
  const { appState, currentJobId, wasmInitialized } = options;

  // File import and validation
  const fileImportHandlers = useFileImport({ appState });

  // Conversion execution and cancellation
  const executionHandlers = useConversionExecution({
    appState,
    currentJobId,
    wasmInitialized,
  });

  // Error recovery and cleanup
  const cleanupHandlers = useConversionCleanup({ appState });

  // Memoize combined handlers for stable reference
  return useMemo(
    () => ({
      ...fileImportHandlers,
      ...executionHandlers,
      ...cleanupHandlers,
    }),
    [fileImportHandlers, executionHandlers, cleanupHandlers],
  );
}
