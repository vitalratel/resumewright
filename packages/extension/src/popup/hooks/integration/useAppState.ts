// ABOUTME: Consolidates all store subscriptions into a single AppState object.
// ABOUTME: Uses useShallow for efficient shallow equality comparison.

import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { ConversionError, ConversionProgress } from '@/shared/types/models';
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
 * Consolidated app state hook using Zustand's useShallow for efficient updates
 */
export function useAppState(): AppState {
  const popupState = usePopupStore(
    useShallow((state) => ({
      // State
      uiState: state.uiState,
      validationError: state.validationError,
      isValidating: state.isValidating,
      lastError: state.lastError,
      lastFilename: state.lastFilename,
      importedFile: state.importedFile,
      // Actions
      setValidating: state.setValidating,
      setValidationError: state.setValidationError,
      clearValidationError: state.clearValidationError,
      startConversion: state.startConversion,
      setSuccess: state.setSuccess,
      setError: state.setError,
      setUIState: state.setUIState,
      setImportedFile: state.setImportedFile,
      clearImportedFileData: state.clearImportedFile,
      resetStore: state.reset,
    })),
  );

  const getProgress = useProgressStore((state) => state.getProgress);

  // Coordinated action: Clear imported file and reset UI state
  const clearImportedFile = useCallback(() => {
    popupState.clearImportedFileData();
    popupState.setUIState('waiting_for_import');
    popupState.clearValidationError();
  }, [popupState]);

  const reset = useCallback(() => {
    popupState.resetStore();
  }, [popupState]);

  return {
    // State
    uiState: popupState.uiState,
    validationError: popupState.validationError,
    isValidating: popupState.isValidating,
    lastError: popupState.lastError,
    lastFilename: popupState.lastFilename,
    importedFile: popupState.importedFile,
    // Actions
    setValidating: popupState.setValidating,
    setValidationError: popupState.setValidationError,
    clearValidationError: popupState.clearValidationError,
    startConversion: popupState.startConversion,
    setSuccess: popupState.setSuccess,
    setError: popupState.setError,
    setUIState: popupState.setUIState,
    setImportedFile: popupState.setImportedFile,
    clearImportedFile,
    getProgress,
    reset,
  };
}
