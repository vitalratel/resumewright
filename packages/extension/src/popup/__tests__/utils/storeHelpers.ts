/**
 * Test Store Helpers
 *
 * Helper functions for setting up store state in tests.
 * Reduces boilerplate and ensures consistent test setup.
 */

import { ErrorCategory, ErrorCode } from '@/shared/errors';
import type { ConversionError, ConversionProgress } from '@/shared/types/models';
import { DEFAULT_JOB_ID } from '../../constants/app';
import type { CVMetadata, UIState } from '../../store';
import { usePopupStore } from '../../store';
import { useProgressStore } from '../../store/progressStore';

/**
 * Create mock UI state with optional overrides
 */
export function createMockUIState(
  overrides?: Partial<{
    uiState: UIState;
    validationError: string | null;
    isValidating: boolean;
    lastError: ConversionError | null;
    lastFilename: string | null;
    lastConversionTime: number | null;
  }>,
) {
  return {
    uiState: 'waiting_for_import' as UIState,
    validationError: null,
    isValidating: false,
    lastError: null,
    lastFilename: null,
    lastConversionTime: null,
    ...overrides,
  };
}

/**
 * Create mock persisted state with optional overrides
 */
export function createMockPersistedState(
  overrides?: Partial<{
    importedFile: { filename: string; size: number; content: string } | null;
    cvMetadata: CVMetadata | null;
  }>,
) {
  return {
    importedFile: null,
    cvMetadata: null,
    ...overrides,
  };
}

/**
 * Create mock progress state
 */
export function createMockProgressState(
  _jobId: string = DEFAULT_JOB_ID,
  overrides?: Partial<ConversionProgress>,
) {
  const defaults: ConversionProgress = {
    stage: 'queued',
    percentage: 0,
    currentOperation: 'Starting conversion...',
  };

  return {
    ...defaults,
    ...overrides,
  };
}

/**
 * Set up converting state in stores
 *
 * Convenience function to set up all stores for converting state
 */
export function setupConvertingState(
  jobId: string = DEFAULT_JOB_ID,
  progress?: Partial<ConversionProgress>,
) {
  usePopupStore.getState().setUIState('converting');
  useProgressStore.getState().startConversion(jobId);

  if (progress) {
    useProgressStore.getState().updateProgress(jobId, {
      ...createMockProgressState(jobId),
      ...progress,
    });
  }
}

/**
 * Set up file_validated state in stores
 *
 * Convenience function to set up stores for file_validated state
 */
export function setupFileValidatedState(
  filename: string = 'test.tsx',
  content: string = '<CV><Name>Test</Name></CV>',
  metadata?: Partial<CVMetadata>,
) {
  const defaultMetadata: CVMetadata = {
    name: 'Test User',
    confidence: 0.95,
    estimatedPages: 1,
    layoutType: 'single-column',
    hasImages: false,
    ...metadata,
  };

  usePopupStore.getState().setImportedFile(filename, content.length, content);
  usePopupStore.getState().setCVDetected(defaultMetadata);
  usePopupStore.getState().setUIState('file_validated');
}

/**
 * Set up error state in stores
 */
export function setupErrorState(error?: Partial<ConversionError>) {
  const defaultError: ConversionError = {
    stage: 'failed',
    code: ErrorCode.UNKNOWN_ERROR,
    message: 'Test error',
    recoverable: true,
    suggestions: ['Try again'],
    timestamp: Date.now(),
    errorId: 'test-error-id',
    category: ErrorCategory.UNKNOWN,
    ...error,
  };

  usePopupStore.getState().setError(defaultError);
}

/**
 * Set up success state in stores
 */
export function setupSuccessState(filename: string = 'test-cv.pdf') {
  usePopupStore.getState().setSuccess(filename);
}

/**
 * Reset all stores to initial state
 *
 * Call in beforeEach/afterEach to ensure clean state
 */
export function resetAllStores() {
  usePopupStore.getState().reset();
  useProgressStore.getState().clearConversion(DEFAULT_JOB_ID);
}

/**
 * Get current state of all stores (for assertions)
 */
export function getAllStoreState() {
  return {
    popup: usePopupStore.getState(),
    progress: useProgressStore.getState().getProgress(DEFAULT_JOB_ID),
  };
}
