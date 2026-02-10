/**
 * ABOUTME: Global test setup for the extension test suite.
 * ABOUTME: Configures browser mocks, store resets, and cleanup between tests.
 */

import { cleanup } from '@solidjs/testing-library';
import { afterEach, beforeEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { usePopupStore } from '@/popup/store/index';
import { useProgressStore } from '@/popup/store/progressStore';

/**
 * Mock IndexedDB for custom font storage tests
 * jsdom doesn't provide IndexedDB, so we use fake-indexeddb
 */
import 'fake-indexeddb/auto';

/**
 * Mock window.matchMedia for dark mode tests
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

beforeEach(async () => {
  // Create a focused window so fakeBrowser.tabs.create() works
  await fakeBrowser.windows.create({ focused: true });

  // Mock browser.downloads.search (not implemented in fakeBrowser)
  vi.spyOn(fakeBrowser.downloads, 'search').mockResolvedValue([]);
});

afterEach(() => {
  // Clean up Solid components
  cleanup();

  // Reset fakeBrowser state to prevent test pollution
  fakeBrowser.reset();

  // Reset all Zustand stores to initial state
  // TODO: Phase 1 — replace with Solid store resets
  usePopupStore.getState().reset();
  useProgressStore.getState().reset();

  // Clear all timers (setTimeout, setInterval, etc.)
  vi.clearAllTimers();

  // Clear mock call history to prevent test pollution
  vi.clearAllMocks();
});
