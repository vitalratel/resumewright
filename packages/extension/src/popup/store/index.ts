/**
 * Unified Popup Store - Composable Slices Pattern
 * Refactor to composable stores pattern
 *
 * Single Zustand store combining multiple slices with selective persistence.
 * Only persisted slice data is saved to chrome.storage.local.
 *
 * Benefits:
 * - Single source of truth
 * - No duplicated reset/error handling logic
 * - Clear separation between persisted vs transient state
 * - Simpler component imports
 */

import {
  boolean,
  literal,
  nullable,
  number,
  object,
  optional,
  safeParse,
  string,
  union,
} from 'valibot';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getLogger } from '../../shared/infrastructure/logging';
import { debounceAsync } from '../../shared/utils/debounce';
import type { CVMetadata, PersistedSlice } from './slices/persistedSlice';
import { createPersistedSlice } from './slices/persistedSlice';
import type { ErrorInfo, UISlice, UIState } from './slices/uiSlice';
import { createUISlice } from './slices/uiSlice';

// Import types from slices (CVMetadata comes from persistedSlice, not persistedStore)

// Valibot schemas (duplicated from persistedStore for validation)
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

// Schema for persisted data (excludes UI state and action functions)
const PopupStateSchema = object({
  cvMetadata: nullable(CVMetadataSchema),
  importedFile: nullable(ImportedFileSchema),
});

// Combined store type
export type PopupStore = PersistedSlice &
  UISlice & {
    // Unified reset action
    reset: () => void;
  };

// Re-export types from slices
export type { CVMetadata, ErrorInfo, UIState };

// Store debounced setter at module level so tests can cancel pending operations
const debouncedStorageSet = debounceAsync(
  async (data: Record<string, unknown>) => {
    await browser.storage.local.set(data);
  },
  300, // 300ms debounce delay
);

// Flush debounced writes when popup closes to prevent data loss
// Ensure pending writes are flushed before popup closes
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    void debouncedStorageSet.flush();
  });
}

/**
 * Cancel any pending debounced storage writes
 * Used in test cleanup to prevent memory leaks
 */
export function cancelPendingWrites(): void {
  debouncedStorageSet.cancel();
}

/**
 * Chrome Storage adapter for Zustand persist middleware
 * Uses chrome.storage.local for extension storage
 */
const chromeStorage = createJSONStorage(() => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      const result = await browser.storage.local.get(name);
      const value: unknown = result[name];
      return value !== null && value !== undefined ? JSON.stringify(value) : null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
      // Use debounced setter to reduce write frequency
      // Wrap JSON.parse for corrupted storage safety
      try {
        let parsed: unknown;
        try {
          parsed = JSON.parse(value);
        } catch (parseError) {
          getLogger().error('PopupStore', 'Failed to parse value for storage', parseError);
          throw new Error('Failed to parse state for storage');
        }

        // Ensure we have the required keys (partialize should provide them)
        const dataToValidate = {
          cvMetadata: (parsed as Record<string, unknown>).cvMetadata ?? null,
          importedFile: (parsed as Record<string, unknown>).importedFile ?? null,
        };

        // Validate with Valibot schema
        const result = safeParse(PopupStateSchema, dataToValidate);
        if (!result.success) {
          getLogger().error('PopupStore', 'Validation failed', result.issues);
          throw new Error('Invalid state structure for storage');
        }

        await debouncedStorageSet({ [name]: result.output });
      } catch (error) {
        getLogger().error('PopupStore', 'Failed to save storage', error);
        throw error;
      }
    },
    removeItem: async (name: string): Promise<void> => {
      await browser.storage.local.remove(name);
    },
  };
});

/**
 * Unified Popup Store
 * Combines persisted and UI slices with selective persistence
 */
export const usePopupStore = create<PopupStore>()(
  persist(
    (...a) => ({
      // Merge slices
      ...createPersistedSlice(...a),
      ...createUISlice(...a),

      // Unified reset action - resets both persisted and UI state
      reset: () => {
        const [set] = a;
        set({
          // Reset persisted slice
          cvMetadata: null,
          importedFile: null,

          // Reset UI slice
          uiState: 'waiting_for_import',
          validationError: null,
          isValidating: false,
          lastError: null,
          lastFilename: null,
        });
      },

      // Note: resetPersisted() and resetUI() methods are available from slices
      // for independent slice resets
    }),
    {
      name: 'resumewright-popup-state',
      storage: chromeStorage,
      skipHydration: false,
      // Selective persistence - only persist PersistedSlice fields
      partialize: (state) => ({
        cvMetadata: state.cvMetadata,
        importedFile: state.importedFile,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<PopupStore>),
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error !== null && error !== undefined) {
            getLogger().error('PopupStore', 'Hydration error', error);
            state?.setHydrationError(error instanceof Error ? error : new Error(String(error)));
          }
          // Always mark as hydrated (even on error, we use default state)
          state?.setHasHydrated(true);
        };
      },
    },
  ),
);
