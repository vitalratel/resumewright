/**
 * Test Helpers for Hook Tests
 * Provides mock factories and utilities to reduce test verbosity
 */

import { vi } from 'vitest';
import type { Browser } from 'wxt/browser';
import type { AppState } from '../integration/useAppState';

// Mock Download Item Factory
export function mockDownloadItem(
  id: number,
  filename: string,
  startTime = '2025-01-01T00:00:00Z',
): Browser.downloads.DownloadItem {
  return {
    id,
    filename,
    state: 'complete',
    startTime,
  } as unknown as Browser.downloads.DownloadItem;
}

// Mock search result helper
export function mockSearchResult(items: Browser.downloads.DownloadItem[]) {
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
