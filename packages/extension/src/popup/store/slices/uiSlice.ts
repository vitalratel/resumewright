/**
 * UI State Slice
 * Refactor to composable stores pattern
 *
 * Contains transient UI state that doesn't need persistence:
 * - UI state machine
 * - Validation state
 * - Error information
 * - Success state
 */

import type { StateCreator } from 'zustand';
import type { ConversionError } from '../../../shared/types/models';

export type UIState = 'waiting_for_import' | 'file_validated' | 'validation_error' | 'converting' | 'success' | 'error';

// Kept ErrorInfo as alias for backward compatibility
export type ErrorInfo = ConversionError;

export interface UISlice {
  // State
  uiState: UIState;
  validationError: string | null;
  isValidating: boolean;
  lastError: ErrorInfo | null;
  lastFilename: string | null;

  // Actions
  setUIState: (state: UIState) => void;
  setValidationError: (error: string) => void;
  setValidating: (isValidating: boolean) => void;
  clearValidationError: () => void;
  startConversion: () => void;
  setSuccess: (filename?: string) => void;
  setError: (error: ErrorInfo) => void;
  resetUI: () => void;
}

export const createUISlice: StateCreator<
  UISlice,
  [],
  [],
  UISlice
> = set => ({
  // Initial state
  uiState: 'waiting_for_import',
  validationError: null,
  isValidating: false,
  lastError: null,
  lastFilename: null,

  // Actions
  setUIState: state =>
    set({ uiState: state }),

  setValidationError: error =>
    set({
      uiState: 'validation_error',
      validationError: error,
      isValidating: false,
    }),

  setValidating: isValidating =>
    set({ isValidating }),

  clearValidationError: () =>
    set({
      validationError: null,
      isValidating: false,
    }),

  startConversion: () =>
    set({
      uiState: 'converting',
      lastError: null,
    }),

  setSuccess: filename =>
    set({
      uiState: 'success',
      lastFilename: filename,
      lastError: null,
    }),

  setError: error =>
    set({
      uiState: 'error',
      lastError: error,
    }),

  resetUI: () =>
    set({
      uiState: 'waiting_for_import',
      validationError: null,
      isValidating: false,
      lastError: null,
      lastFilename: null,
    }),
});
