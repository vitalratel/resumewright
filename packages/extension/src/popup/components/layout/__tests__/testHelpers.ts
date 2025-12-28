// ABOUTME: Shared test utilities for layout component tests.
// ABOUTME: Provides mock context factories to reduce boilerplate.

import { vi } from 'vitest';
import type { AppContextValue } from '../../../context/AppContext';
import type { QuickSettingsContextValue } from '../../../context/QuickSettingsContext';
import type { ConversionHandlers } from '../../../hooks/conversion/useConversionHandlers';

/**
 * Factory for mock AppContextValue with sensible defaults
 */
export function createMockAppContext(overrides?: Partial<AppContextValue>): AppContextValue {
  return {
    appState: {
      uiState: 'waiting_for_import' as const,
      validationError: null,
      isValidating: false,
      lastError: null,
      lastFilename: null,
      importedFile: null,
      getProgress: vi.fn(() => undefined),
      setValidating: vi.fn(),
      setValidationError: vi.fn(),
      clearValidationError: vi.fn(),
      startConversion: vi.fn(),
      setSuccess: vi.fn(),
      setError: vi.fn(),
      setUIState: vi.fn(),
      setImportedFile: vi.fn(),
      clearImportedFile: vi.fn(),
      reset: vi.fn(),
    },
    currentJobId: '',
    successRef: { current: null },
    errorRef: { current: null },
    onOpenSettings: vi.fn(),
    ...overrides,
  };
}

/**
 * Factory for mock ConversionHandlers with sensible defaults
 */
export function createMockConversionContext(
  overrides?: Partial<ConversionHandlers>,
): ConversionHandlers {
  return {
    handleFileValidated: vi.fn(),
    handleExportClick: vi.fn(async () => {}),
    handleCancelConversion: vi.fn(),
    handleRetry: vi.fn(),
    handleDismissError: vi.fn(),
    handleImportDifferent: vi.fn(),
    handleReportIssue: vi.fn(),
    ...overrides,
  };
}

/**
 * Factory for mock QuickSettingsContextValue with sensible defaults
 */
export function createMockQuickSettingsContext(
  overrides?: Partial<QuickSettingsContextValue>,
): QuickSettingsContextValue {
  return {
    settings: null,
    handlers: {
      handlePageSizeChange: vi.fn(),
      handleMarginsChange: vi.fn(),
      handleCustomMarginChange: vi.fn(),
    },
    ...overrides,
  };
}

/**
 * Common test file fixture
 */
export const TEST_FILE = {
  name: 'resume.tsx',
  size: 2048,
  content: '// Mock TSX content',
};

/**
 * Common test settings fixture
 */
export const TEST_SETTINGS = {
  theme: 'auto' as const,
  autoDetectCV: true,
  showConvertButtons: true,
  telemetryEnabled: false,
  retentionDays: 30,
  settingsVersion: 1,
  lastUpdated: Date.now(),
  defaultConfig: {
    pageSize: 'Letter' as const,
    margin: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
    fontSize: 12,
    fontFamily: 'Arial',
    compress: false,
  },
};
