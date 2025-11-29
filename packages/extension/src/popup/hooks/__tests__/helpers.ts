/**
 * Test Helpers for Hook Tests
 * Provides mock factories and utilities to reduce test verbosity
 */

import type browser from 'webextension-polyfill';
import type { AppState } from '../integration/useAppState';
import { vi } from 'vitest';

// Mock Download Item Factory
export function mockDownloadItem(id: number, filename: string, startTime = '2025-01-01T00:00:00Z'): browser.Downloads.DownloadItem {
  return {
    id,
    filename,
    state: 'complete',
    startTime,
  } as unknown as browser.Downloads.DownloadItem;
}

// Mock search result helper
export function mockSearchResult(items: browser.Downloads.DownloadItem[]) {
  return items;
}

// Mock AppState factory
export function createMockAppState(overrides?: Partial<AppState>): AppState {
  return {
    uiState: 'waiting_for_import',
    importedFile: null,
    validating: false,
    validationError: null,
    lastError: null,
    setUIState: vi.fn(),
    setValidating: vi.fn(),
    setValidationError: vi.fn(),
    clearValidationError: vi.fn(),
    setImportedFile: vi.fn(),
    startConversion: vi.fn(),
    setError: vi.fn(),
    clearImportedFile: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  } as unknown as AppState;
}

// Helper to temporarily remove API
export function withoutAPI<T>(getter: () => T, setter: (val: T | undefined) => void, testFn: () => void | Promise<void>) {
  return async () => {
    const orig = getter();
    setter(undefined);
    try {
      await testFn();
    }
    finally {
      setter(orig);
    }
  };
}

// Console spy helper
export function withSuppressedConsole(method: 'error' | 'warn' | 'info', testFn: () => void | Promise<void>) {
  return async () => {
    const spy = vi.spyOn(console, method).mockImplementation(() => {});
    try {
      await testFn();
      return spy;
    }
    finally {
      spy.mockRestore();
    }
  };
}
