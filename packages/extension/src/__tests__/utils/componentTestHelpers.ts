/**
 * React Component Test Helpers
 *
 * Reusable utilities for testing React components in the ResumeWright extension.
 * Provides render wrappers, store management, and common test setup patterns.
 *
 * Usage:
 * ```typescript
 * import { renderWithStore, triggerStoreError, resetAllStores } from '@tests/utils/componentTestHelpers';
 *
 * beforeEach(() => {
 *   resetAllStores();
 * });
 *
 * it('should display error', async () => {
 *   const { container } = renderWithStore(<Component />);
 *   triggerStoreError(createParseError());
 *   await waitFor(() => expect(screen.getByText(/error/i)).toBeInTheDocument());
 * });
 * ```
 */

import type { RenderResult } from '@testing-library/react';
import type { ConversionError } from '@/shared/types/models';
import { render, waitFor as rtlWaitFor, screen } from '@testing-library/react';
import { act } from 'react';

// Import stores (adjust paths as needed based on actual store locations)
// These imports may need to be mocked depending on test setup
import { usePersistedStore, useUIStore } from '@/popup/store/index';

/**
 * Options for renderWithStore
 */
export interface RenderOptions {
  /** Wait for specific text to appear after render */
  waitForText?: string | RegExp;
  /** Initial UI store state */
  initialUIState?: Partial<ReturnType<typeof useUIStore.getState>>;
  /** Initial persisted store state */
  initialPersistedState?: Partial<ReturnType<typeof usePersistedStore.getState>>;
}

/**
 * Render a React component with Zustand stores initialized
 *
 * @param component - React element to render
 * @param options - Render configuration
 * @returns Testing Library render result
 *
 * @example
 * ```typescript
 * const { container, getByText } = await renderWithStore(<Settings />);
 *
 * // With initial state
 * const { container } = await renderWithStore(<ErrorState />, {
 *   initialUIState: { error: createParseError() }
 * });
 *
 * // Wait for specific content
 * await renderWithStore(<Settings />, { waitForText: 'Settings' });
 * ```
 */
export async function renderWithStore(
  component: React.ReactElement,
  options: RenderOptions = {}
): Promise<RenderResult> {
  // Set initial store state if provided
  if (options.initialUIState) {
    act(() => {
      useUIStore.setState(options.initialUIState!);
    });
  }

  if (options.initialPersistedState) {
    act(() => {
      usePersistedStore.setState(options.initialPersistedState!);
    });
  }

  // Render component
  const result = render(component);

  // Wait for specific text if requested
  if (options.waitForText !== null && options.waitForText !== undefined) {
    await rtlWaitFor(() => {
      expect(screen.getByText(options.waitForText!)).toBeInTheDocument();
    });
  }

  return result;
}

/**
 * Trigger an error in the UI store (for error flow testing)
 *
 * @param error - ConversionError to set
 *
 * @example
 * ```typescript
 * triggerStoreError(createParseError());
 * expect(screen.getByText(/parse error/i)).toBeInTheDocument();
 * ```
 */
export function triggerStoreError(error: ConversionError) {
  act(() => {
    useUIStore.getState().setError(error);
  });
}

/**
 * Reset all Zustand stores to initial state
 *
 * Use in beforeEach to ensure test isolation.
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   resetAllStores();
 * });
 * ```
 */
export function resetAllStores() {
  act(() => {
    useUIStore.getState().reset();
    usePersistedStore.getState().reset();
  });
}

/**
 * Standard beforeEach setup for component tests
 *
 * Clears all mocks and resets all stores.
 *
 * @example
 * ```typescript
 * import { vi } from 'vitest';
 *
 * beforeEach(() => {
 *   setupComponentTest();
 * });
 * ```
 */
export function setupComponentTest() {
  // Note: vi.clearAllMocks() must be called from test file
  // since it requires vitest context
  resetAllStores();
}

/**
 * Wait for loading state to complete
 *
 * @param expectedText - Optional text to wait for after loading completes
 * @param timeout - Max wait time in ms (default: 5000)
 *
 * @example
 * ```typescript
 * render(<Component />);
 * await waitForLoadingComplete('Content loaded');
 * ```
 */
export async function waitForLoadingComplete(expectedText?: string | RegExp, timeout = 5000) {
  // Wait for loading indicator to disappear
  await rtlWaitFor(
    () => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    },
    { timeout }
  );

  // If expectedText provided, wait for it to appear
  if (expectedText !== null && expectedText !== undefined) {
    await rtlWaitFor(
      () => {
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      },
      { timeout }
    );
  }
}

/**
 * Wait for conversion state to change
 *
 * @param expectedState - Expected conversion state
 * @param timeout - Max wait time in ms (default: 5000)
 *
 * @example
 * ```typescript
 * await waitForConversionState('converting');
 * expect(screen.getByText(/converting/i)).toBeInTheDocument();
 * ```
 */
export async function waitForConversionState(
  expectedState: 'idle' | 'converting' | 'success' | 'error',
  timeout = 5000
) {
  await rtlWaitFor(
    () => {
      const currentState = useUIStore.getState().uiState;
      expect(currentState).toBe(expectedState);
    },
    { timeout }
  );
}

/**
 * Get current UI store state (for assertions)
 *
 * @example
 * ```typescript
 * const state = getUIState();
 * expect(state.error).toBeDefined();
 * expect(state.conversionState).toBe('error');
 * ```
 */
export function getUIState() {
  return useUIStore.getState();
}

/**
 * Get current persisted store state (for assertions)
 *
 * @example
 * ```typescript
 * const state = getPersistedState();
 * expect(state.tsx).toBe(mockTsx);
 * ```
 */
export function getPersistedState() {
  return usePersistedStore.getState();
}

/**
 * Simulate successful conversion
 *
 * @param _pdfBytes - Mock PDF bytes (optional, unused)
 *
 * @example
 * ```typescript
 * simulateConversionSuccess();
 * await waitForConversionState('success');
 * ```
 */
export function simulateConversionSuccess(_pdfBytes?: Uint8Array) {
  act(() => {
    const store = useUIStore.getState();
    store.setSuccess();
    // Note: pdfBytes would be stored in persistedStore, not uiStore
  });
}

/**
 * Simulate conversion failure
 *
 * @param error - ConversionError to set
 *
 * @example
 * ```typescript
 * simulateConversionFailure(createParseError());
 * await waitForConversionState('error');
 * ```
 */
export function simulateConversionFailure(error: ConversionError) {
  act(() => {
    const store = useUIStore.getState();
    store.setError(error);
  });
}
