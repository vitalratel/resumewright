/**
 * Persisted State Slice
 * Refactor to composable stores pattern
 *
 * Contains state that persists across browser restarts:
 * - Imported file data
 * - CV metadata
 */

import type { StateCreator } from 'zustand';

export interface CVMetadata {
  name?: string;
  role?: string;
  confidence: number;
  estimatedPages: number;
  layoutType: 'single-column' | 'two-column' | 'academic' | 'portfolio' | 'custom';
  hasImages: boolean;
}

export interface PersistedSlice {
  // State
  cvMetadata: CVMetadata | null;
  importedFile: { name: string; size: number; content: string } | null;

  // Hydration state (not persisted)
  _hasHydrated: boolean;
  _hydrationError: Error | null;

  // Actions
  setCVDetected: (metadata: CVMetadata) => void;
  setNoCVDetected: () => void;
  setImportedFile: (name: string, size: number, content: string) => void;
  clearImportedFile: () => void;
  setHasHydrated: (state: boolean) => void;
  setHydrationError: (error: Error | null) => void;
  reset: () => void;
  resetPersisted: () => void;
}

export const createPersistedSlice: StateCreator<PersistedSlice, [], [], PersistedSlice> = (
  set,
) => ({
  // Initial state
  cvMetadata: null,
  importedFile: null,
  _hasHydrated: false,
  _hydrationError: null,

  // Actions
  setCVDetected: (metadata) =>
    set({
      cvMetadata: metadata,
    }),

  setNoCVDetected: () =>
    set({
      cvMetadata: null,
    }),

  setImportedFile: (name, size, content) =>
    set({
      importedFile: { name, size, content },
    }),

  clearImportedFile: () =>
    set({
      importedFile: null,
    }),

  setHasHydrated: (state) =>
    set({
      _hasHydrated: state,
    }),

  setHydrationError: (error) =>
    set({
      _hydrationError: error,
    }),

  reset: () =>
    set({
      cvMetadata: null,
      importedFile: null,
    }),

  resetPersisted: () =>
    set({
      cvMetadata: null,
      importedFile: null,
    }),
});
