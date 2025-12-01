/**
 * Global Test Setup
 *
 * Uses WxtVitest plugin which provides:
 * - Browser API polyfill via @webext-core/fake-browser
 * - WXT aliases and auto-imports
 *
 * This file handles additional test setup:
 * - React Testing Library cleanup
 * - Zustand store resets
 * - Mock cleanup
 */

import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { usePopupStore } from '@/popup/store/index';
import { useProgressStore } from '@/popup/store/progressStore';
import '@testing-library/jest-dom';

/**
 * Mock IndexedDB for custom font storage tests
 * jsdom doesn't provide IndexedDB, so we use fake-indexeddb
 */
import 'fake-indexeddb/auto';

/**
 * Mock window.matchMedia for dark mode tests
 * Required for useDarkMode hook
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/**
 * Run before EVERY test in ALL test files
 *
 * Note: We intentionally do NOT clear mocks here because:
 * - Individual test files set up their own mocks in describe() blocks
 * - Clearing mocks here would break those test-specific setups
 * - Tests that need mock clearing should do it explicitly
 */
beforeEach(async () => {
  // Create a focused window so fakeBrowser.tabs.create() works
  // fakeBrowser.tabs.create() calls windows.getCurrent() which returns undefined
  // when no window has focus, causing "Cannot read properties of undefined" errors
  await fakeBrowser.windows.create({ focused: true });

  // Mock browser.downloads.search (not implemented in fakeBrowser)
  // This is needed for Success component tests that use useBrowserDownloads hook
  vi.spyOn(fakeBrowser.downloads, 'search').mockResolvedValue([]);

  // Intentionally minimal - just ensure clean component state
  // Individual tests handle their own mock cleanup as needed
});

/**
 * Run after EVERY test in ALL test files
 *
 * This ensures:
 * 1. React components are unmounted and cleaned up
 * 2. Zustand stores are reset to initial state
 * 3. All timers are cleared
 * 4. Mock functions are cleared
 *
 * Prevents memory leaks and test pollution by forcing cleanup even if tests forget to do it.
 */
afterEach(() => {
  // Clean up React components
  cleanup();

  // Reset fakeBrowser state to prevent test pollution
  fakeBrowser.reset();

  // Reset all Zustand stores to initial state
  usePopupStore.getState().reset();
  useProgressStore.getState().reset();

  // Clear all timers (setTimeout, setInterval, etc.)
  vi.clearAllTimers();

  // Clear mock call history to prevent test pollution
  // Note: This clears call counts/history but keeps mock implementations
  vi.clearAllMocks();
});
