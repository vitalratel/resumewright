/**
 * useAppState Hook
 * Consolidates all store subscriptions into a single object
 *
 * PERFORMANCE: Direct subscriptions for stable references
 * - Firefox fix: Removed useShallow to prevent CPU loop in ze() function
 * - Uses individual subscriptions (17 total) but all return stable references
 * - Functions are stable (same reference), primitives trigger re-renders only on change
 * - Prevents Zustand's shallow equality checker from running in tight loop
 */

import type { ConversionError, ConversionProgress } from '@/shared/types/models';
import { useCallback, useMemo } from 'react';
import { usePopupStore } from '../../store';
import { useProgressStore } from '../../store/progressStore';

export interface AppState {
  // UI State
  uiState: ReturnType<typeof usePopupStore.getState>['uiState'];
  validationError: string | null;
  isValidating: boolean;
  lastError: ConversionError | null;
  lastFilename: string | null;

  // Persisted Data
  importedFile: { name: string; size: number; content: string } | null;

  // Progress
  getProgress: (jobId: string) => ConversionProgress | undefined;

  // UI Actions
  setValidating: (validating: boolean) => void;
  setValidationError: (error: string) => void;
  clearValidationError: () => void;
  startConversion: () => void;
  setSuccess: (filename?: string) => void;
  setError: (error: ConversionError) => void;
  setUIState: (state: ReturnType<typeof usePopupStore.getState>['uiState']) => void;

  // Persisted Actions
  setImportedFile: (name: string, size: number, content: string) => void;
  clearImportedFile: () => void;

  // Combined Actions
  reset: () => void;
}

/**
 * Consolidated app state hook
 * Firefox fix: Removed useShallow to prevent CPU loop in ze (shallow equality checker)
 * Direct subscriptions prevent constant object recreation
 */
export function useAppState(): AppState {
  // State data - individual subscriptions (stable primitive values)
  const uiState = usePopupStore((state) => state.uiState);
  const validationError = usePopupStore((state) => state.validationError);
  const isValidating = usePopupStore((state) => state.isValidating);
  const lastError = usePopupStore((state) => state.lastError);
  const lastFilename = usePopupStore((state) => state.lastFilename);
  const importedFile = usePopupStore((state) => state.importedFile);

  // Actions - direct function references (stable)
  const setValidating = usePopupStore((state) => state.setValidating);
  const setValidationError = usePopupStore((state) => state.setValidationError);
  const clearValidationError = usePopupStore((state) => state.clearValidationError);
  const startConversion = usePopupStore((state) => state.startConversion);
  const setSuccess = usePopupStore((state) => state.setSuccess);
  const setError = usePopupStore((state) => state.setError);
  const setUIState = usePopupStore((state) => state.setUIState);
  const setImportedFile = usePopupStore((state) => state.setImportedFile);
  const clearImportedFileData = usePopupStore((state) => state.clearImportedFile);
  const resetStore = usePopupStore((state) => state.reset);

  // Progress store - direct function reference (stable)
  const getProgress = useProgressStore((state) => state.getProgress);

  // Coordinated action: Clear imported file and reset UI state
  const clearImportedFile = useCallback(() => {
    clearImportedFileData();
    setUIState('waiting_for_import');
    clearValidationError();
  }, [clearImportedFileData, setUIState, clearValidationError]);

  // Combined reset action
  const reset = useCallback(() => {
    resetStore();
  }, [resetStore]);

  // Firefox fix: useMemo with stable primitive/function dependencies
  // No more object spread from useShallow - all subscriptions are direct
  return useMemo(
    () => ({
      // UI State
      uiState,
      validationError,
      isValidating,
      lastError,
      lastFilename,

      // UI Actions
      setValidating,
      setValidationError,
      clearValidationError,
      startConversion,
      setSuccess,
      setError,
      setUIState,

      // Persisted Data
      importedFile,

      // Persisted Actions
      setImportedFile,
      clearImportedFile,

      // Progress
      getProgress,

      // Combined Actions
      reset,
    }),
    [
      uiState,
      validationError,
      isValidating,
      lastError,
      lastFilename,
      setValidating,
      setValidationError,
      clearValidationError,
      startConversion,
      setSuccess,
      setError,
      setUIState,
      importedFile,
      setImportedFile,
      clearImportedFile,
      getProgress,
      reset,
    ]
  );
}
