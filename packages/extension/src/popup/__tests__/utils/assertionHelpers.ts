/**
 * Test Assertion Helpers
 *
 * Custom assertion functions for common test scenarios.
 * Provides clear error messages and reduces test boilerplate.
 */

import type { UIState } from '../../store';
import type { ConversionError, ConversionProgress, CVMetadata } from '@/shared/types/models';
import { expect } from 'vitest';
import { usePersistedStore, useUIStore  } from '../../store';
import { useProgressStore } from '../../store/progressStore';

/**
 * Assert UI store state matches expected values
 */
export function assertUIStoreState(expected: Partial<ReturnType<typeof useUIStore.getState>>) {
  const actual = useUIStore.getState();

  Object.entries(expected).forEach(([key, value]) => {
    expect(actual[key as keyof typeof actual]).toEqual(value);
  });
}

/**
 * Assert current UI state
 */
export function assertUIState(expectedState: UIState) {
  const actualState = useUIStore.getState().uiState;
  expect(actualState).toBe(expectedState);
}

/**
 * Assert persisted store state matches expected values
 */
export function assertPersistedStoreState(expected: Partial<ReturnType<typeof usePersistedStore.getState>>) {
  const actual = usePersistedStore.getState();

  Object.entries(expected).forEach(([key, value]) => {
    expect(actual[key as keyof typeof actual]).toEqual(value);
  });
}

/**
 * Assert imported file exists and matches expected data
 */
export function assertImportedFile(expected: {
  name?: string;
  size?: number;
  content?: string;
}) {
  const actual = usePersistedStore.getState().importedFile;

  expect(actual).toBeTruthy();

  if (expected.name !== undefined) {
    expect(actual?.name).toBe(expected.name);
  }
  if (expected.size !== undefined) {
    expect(actual?.size).toBe(expected.size);
  }
  if (expected.content !== undefined) {
    expect(actual?.content).toBe(expected.content);
  }
}

/**
 * Assert CV metadata exists and matches expected data
 */
export function assertCVMetadata(expected: Partial<CVMetadata>) {
  const actual = usePersistedStore.getState().cvMetadata;

  expect(actual).toBeTruthy();
  expect(actual).toMatchObject(expected);
}

/**
 * Assert progress state for a job
 */
export function assertProgressState(jobId: string, expected: Partial<ConversionProgress>) {
  const actual = useProgressStore.getState().getProgress(jobId);

  expect(actual).toBeTruthy();
  expect(actual).toMatchObject(expected);
}

/**
 * Assert progress does not exist for a job
 */
export function assertNoProgress(jobId: string) {
  const actual = useProgressStore.getState().getProgress(jobId);
  expect(actual).toBeFalsy();
}

/**
 * Assert last error matches expected error
 */
export function assertLastError(expected: Partial<ConversionError>) {
  const actual = useUIStore.getState().lastError;

  expect(actual).toBeTruthy();
  expect(actual).toMatchObject(expected);
}

/**
 * Assert no error exists
 */
export function assertNoError() {
  const actual = useUIStore.getState().lastError;
  expect(actual).toBeNull();
}

/**
 * Assert validation error exists with expected message
 */
export function assertValidationError(expectedMessage?: string) {
  const actual = useUIStore.getState().validationError;

  expect(actual).toBeTruthy();

  if (expectedMessage !== undefined) {
    expect(actual).toContain(expectedMessage);
  }
}

/**
 * Assert no validation error exists
 */
export function assertNoValidationError() {
  const actual = useUIStore.getState().validationError;
  expect(actual).toBeNull();
}

/**
 * Assert success state with optional filename
 */
export function assertSuccessState(expectedFilename?: string) {
  assertUIState('success');

  if (expectedFilename !== undefined) {
    const actual = useUIStore.getState().lastFilename;
    expect(actual).toBe(expectedFilename);
  }
}

/**
 * Assert stores are in clean initial state
 */
export function assertStoresClean() {
  const uiState = useUIStore.getState();
  const persistedState = usePersistedStore.getState();

  expect(uiState.uiState).toBe('waiting_for_import');
  expect(uiState.validationError).toBeNull();
  expect(uiState.lastError).toBeNull();
  expect(persistedState.importedFile).toBeNull();
  expect(persistedState.cvMetadata).toBeNull();
}

/**
 * Assert conversion is in progress
 */
export function assertConversionInProgress(jobId: string, expectedStage?: ConversionProgress['stage']) {
  assertUIState('converting');

  const progress = useProgressStore.getState().getProgress(jobId);
  expect(progress).toBeTruthy();

  if (expectedStage !== undefined) {
    expect(progress?.stage).toBe(expectedStage);
  }
}

/**
 * Assert file is validated and ready for conversion
 */
export function assertFileValidatedState() {
  assertUIState('file_validated');

  const persistedState = usePersistedStore.getState();
  expect(persistedState.importedFile).toBeTruthy();
  expect(persistedState.cvMetadata).toBeTruthy();
}

/**
 * Assert multiple store properties at once
 */
export function assertStoreState(expected: {
  uiState?: UIState;
  hasImportedFile?: boolean;
  hasCVMetadata?: boolean;
  hasError?: boolean;
  hasValidationError?: boolean;
  hasProgress?: { jobId: string; exists: boolean };
}) {
  if (expected.uiState !== undefined) {
    assertUIState(expected.uiState);
  }

  if (expected.hasImportedFile !== undefined) {
    const importedFile = usePersistedStore.getState().importedFile;
    expect(!!importedFile).toBe(expected.hasImportedFile);
  }

  if (expected.hasCVMetadata !== undefined) {
    const cvMetadata = usePersistedStore.getState().cvMetadata;
    expect(!!cvMetadata).toBe(expected.hasCVMetadata);
  }

  if (expected.hasError !== undefined) {
    const error = useUIStore.getState().lastError;
    expect(!!error).toBe(expected.hasError);
  }

  if (expected.hasValidationError !== undefined) {
    const validationError = useUIStore.getState().validationError;
    expect(validationError != null).toBe(expected.hasValidationError);
  }

  if (expected.hasProgress !== undefined) {
    const progress = useProgressStore.getState().getProgress(expected.hasProgress.jobId);
    expect(!!progress).toBe(expected.hasProgress.exists);
  }
}
