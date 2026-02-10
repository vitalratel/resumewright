/**
 * ABOUTME: Popup store combining persisted CV/file data with transient UI state.
 * ABOUTME: Uses Solid createStore with Chrome storage persistence via debounced writes.
 */

import { createStore, reconcile } from 'solid-js/store';
import { boolean, literal, nullable, number, object, optional, string, union } from 'valibot';
import type { ConversionError } from '../../shared/types/models';
import { loadPersistedState, setupPersistence } from './persistence';

// --- Types ---

interface CVMetadata {
  name?: string;
  role?: string;
  confidence: number;
  estimatedPages: number;
  layoutType: 'single-column' | 'two-column' | 'academic' | 'portfolio' | 'custom';
  hasImages: boolean;
}

export type UIState =
  | 'waiting_for_import'
  | 'file_validated'
  | 'validation_error'
  | 'converting'
  | 'success'
  | 'error';

interface PopupState {
  // Persisted fields
  cvMetadata: CVMetadata | null;
  importedFile: { name: string; size: number; content: string } | null;

  // UI state (transient)
  uiState: UIState;
  validationError: string | null;
  isValidating: boolean;
  lastError: ConversionError | null;
  lastFilename: string | null;

  // Hydration state (transient)
  hasHydrated: boolean;
  hydrationError: Error | null;
}

// --- Validation schemas ---

const STORAGE_KEY = 'resumewright-popup-state';

const CVMetadataSchema = object({
  name: optional(string()),
  role: optional(string()),
  confidence: number(),
  estimatedPages: number(),
  layoutType: union([
    literal('single-column'),
    literal('two-column'),
    literal('academic'),
    literal('portfolio'),
    literal('custom'),
  ]),
  hasImages: boolean(),
});

const ImportedFileSchema = object({
  name: string(),
  size: number(),
  content: string(),
});

const PersistedStateSchema = object({
  cvMetadata: nullable(CVMetadataSchema),
  importedFile: nullable(ImportedFileSchema),
});

// --- Initial state ---

const initialState: PopupState = {
  cvMetadata: null,
  importedFile: null,
  uiState: 'waiting_for_import',
  validationError: null,
  isValidating: false,
  lastError: null,
  lastFilename: null,
  hasHydrated: false,
  hydrationError: null,
};

// --- Store factory ---

export function createPopupStore() {
  const [state, setState] = createStore<PopupState>(structuredClone(initialState));

  const persistence = setupPersistence({
    state,
    storageKey: STORAGE_KEY,
    schema: PersistedStateSchema,
    debounceMs: 300,
    pick: (s) => ({
      cvMetadata: s.cvMetadata,
      importedFile: s.importedFile,
    }),
  });

  // --- Persisted state actions ---

  function setCVDetected(metadata: CVMetadata) {
    setState('cvMetadata', metadata);
  }

  function setNoCVDetected() {
    setState('cvMetadata', null);
  }

  function setImportedFile(name: string, size: number, content: string) {
    setState('importedFile', { name, size, content });
  }

  function clearImportedFile() {
    setState('importedFile', null);
  }

  // --- UI state actions ---

  function setUIState(uiState: UIState) {
    setState('uiState', uiState);
  }

  function setValidationError(error: string) {
    setState({
      uiState: 'validation_error',
      validationError: error,
      isValidating: false,
    });
  }

  function setValidating(isValidating: boolean) {
    setState('isValidating', isValidating);
  }

  function clearValidationError() {
    setState({
      validationError: null,
      isValidating: false,
    });
  }

  function startConversion() {
    setState({
      uiState: 'converting',
      lastError: null,
    });
  }

  function setSuccess(filename?: string) {
    setState({
      uiState: 'success',
      lastFilename: filename ?? null,
      lastError: null,
    });
  }

  function setError(error: ConversionError) {
    setState({
      uiState: 'error',
      lastError: error,
    });
  }

  function resetUI() {
    setState({
      uiState: 'waiting_for_import',
      validationError: null,
      isValidating: false,
      lastError: null,
      lastFilename: null,
    });
  }

  // --- Hydration actions ---

  function setHasHydrated(hydrated: boolean) {
    setState('hasHydrated', hydrated);
  }

  function setHydrationError(error: Error | null) {
    setState('hydrationError', error);
  }

  async function hydrate() {
    try {
      type PersistedData = {
        cvMetadata: CVMetadata | null;
        importedFile: { name: string; size: number; content: string } | null;
      };
      const persisted = await loadPersistedState<PersistedData>(STORAGE_KEY, PersistedStateSchema);
      if (persisted) {
        setState('cvMetadata', persisted.cvMetadata);
        setState('importedFile', persisted.importedFile);
      }
    } catch (error) {
      setHydrationError(error instanceof Error ? error : new Error(String(error)));
    }
    setHasHydrated(true);
  }

  // --- Unified reset ---

  function reset() {
    setState(reconcile(structuredClone(initialState)));
  }

  return {
    state,

    // Persisted state
    setCVDetected,
    setNoCVDetected,
    setImportedFile,
    clearImportedFile,

    // UI state
    setUIState,
    setValidationError,
    setValidating,
    clearValidationError,
    startConversion,
    setSuccess,
    setError,
    resetUI,

    // Hydration
    setHasHydrated,
    setHydrationError,
    hydrate,

    // Persistence control
    savePersistence: persistence.save,
    flushPersistence: persistence.flush,
    cancelPersistence: persistence.cancel,

    // Full reset
    reset,
  };
}

// Module-level singleton for production use
export const popupStore = createPopupStore();
