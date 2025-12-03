// ABOUTME: Custom assertion functions for popup tests.
// ABOUTME: Provides clear error messages and reduces test boilerplate.

import { expect } from 'vitest';
import type { ConversionError, ConversionProgress } from '@/shared/types/models';
import type { CVMetadata, UIState } from '../../store';
import { usePopupStore } from '../../store';
import { useProgressStore } from '../../store/progressStore';

/**
 * Assert popup store state matches expected values
 */
export function assertPopupStoreState(
  expected: Partial<ReturnType<typeof usePopupStore.getState>>,
) {
  const actual = usePopupStore.getState();

  Object.entries(expected).forEach(([key, value]) => {
    expect(actual[key as keyof typeof actual]).toEqual(value);
  });
}

/**
 * Assert current UI state
 */
export function assertUIState(expectedState: UIState) {
  const actualState = usePopupStore.getState().uiState;
  expect(actualState).toBe(expectedState);
}

/**
 * Assert imported file exists and matches expected data
 */
export function assertImportedFile(expected: { name?: string; size?: number; content?: string }) {
  const actual = usePopupStore.getState().importedFile;

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
  const actual = usePopupStore.getState().cvMetadata;

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
  const actual = usePopupStore.getState().lastError;

  expect(actual).toBeTruthy();
  expect(actual).toMatchObject(expected);
}

/**
 * Assert no error exists
 */
export function assertNoError() {
  const actual = usePopupStore.getState().lastError;
  expect(actual).toBeNull();
}

/**
 * Assert validation error exists with expected message
 */
export function assertValidationError(expectedMessage?: string) {
  const actual = usePopupStore.getState().validationError;

  expect(actual).toBeTruthy();

  if (expectedMessage !== undefined) {
    expect(actual).toContain(expectedMessage);
  }
}

/**
 * Assert no validation error exists
 */
export function assertNoValidationError() {
  const actual = usePopupStore.getState().validationError;
  expect(actual).toBeNull();
}

/**
 * Assert success state with optional filename
 */
export function assertSuccessState(expectedFilename?: string) {
  assertUIState('success');

  if (expectedFilename !== undefined) {
    const actual = usePopupStore.getState().lastFilename;
    expect(actual).toBe(expectedFilename);
  }
}

/**
 * Assert stores are in clean initial state
 */
export function assertStoresClean() {
  const state = usePopupStore.getState();

  expect(state.uiState).toBe('waiting_for_import');
  expect(state.validationError).toBeNull();
  expect(state.lastError).toBeNull();
  expect(state.importedFile).toBeNull();
  expect(state.cvMetadata).toBeNull();
}

/**
 * Assert conversion is in progress
 */
export function assertConversionInProgress(
  jobId: string,
  expectedStage?: ConversionProgress['stage'],
) {
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

  const state = usePopupStore.getState();
  expect(state.importedFile).toBeTruthy();
  expect(state.cvMetadata).toBeTruthy();
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

  const state = usePopupStore.getState();

  if (expected.hasImportedFile !== undefined) {
    expect(!!state.importedFile).toBe(expected.hasImportedFile);
  }

  if (expected.hasCVMetadata !== undefined) {
    expect(!!state.cvMetadata).toBe(expected.hasCVMetadata);
  }

  if (expected.hasError !== undefined) {
    expect(!!state.lastError).toBe(expected.hasError);
  }

  if (expected.hasValidationError !== undefined) {
    expect(state.validationError != null).toBe(expected.hasValidationError);
  }

  if (expected.hasProgress !== undefined) {
    const progress = useProgressStore.getState().getProgress(expected.hasProgress.jobId);
    expect(!!progress).toBe(expected.hasProgress.exists);
  }
}
