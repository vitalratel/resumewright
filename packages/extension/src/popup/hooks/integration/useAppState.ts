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

import type { ConversionError, ConversionProgress } from '@/shared/types/models/conversion';
import { useCallback, useMemo } from 'react';
import { usePersistedStore, useUIStore } from '../../store';
import { useProgressStore } from '../../store/progressStore';

export interface AppState {
  // UI State
  uiState: ReturnType<typeof useUIStore.getState>['uiState'];
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
  setUIState: (state: ReturnType<typeof useUIStore.getState>['uiState']) => void;

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
  // UI State data - individual subscriptions (stable primitive values)
  const uiState = useUIStore((state) => state.uiState);
  const validationError = useUIStore((state) => state.validationError);
  const isValidating = useUIStore((state) => state.isValidating);
  const lastError = useUIStore((state) => state.lastError);
  const lastFilename = useUIStore((state) => state.lastFilename);

  // UI Actions - direct function references (stable)
  const setValidating = useUIStore((state) => state.setValidating);
  const setValidationError = useUIStore((state) => state.setValidationError);
  const clearValidationError = useUIStore((state) => state.clearValidationError);
  const startConversion = useUIStore((state) => state.startConversion);
  const setSuccess = useUIStore((state) => state.setSuccess);
  const setError = useUIStore((state) => state.setError);
  const setUIState = useUIStore((state) => state.setUIState);
  const resetUI = useUIStore((state) => state.reset);

  // Persisted data
  const importedFile = usePersistedStore((state) => state.importedFile);

  // Persisted actions - direct function references (stable)
  const setImportedFile = usePersistedStore((state) => state.setImportedFile);
  const clearImportedFileData = usePersistedStore((state) => state.clearImportedFile);
  const resetPersisted = usePersistedStore((state) => state.reset);

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
    resetUI();
    resetPersisted();
  }, [resetUI, resetPersisted]);

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
