/**
 * ABOUTME: Tests for the popup store (persisted + UI state).
 * ABOUTME: Validates state management, persistence integration, and unified reset.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { ErrorCategory, ErrorCode } from '../../shared/errors/codes';
import { createPopupStore } from '../store';

describe('Popup Store - Persisted State', () => {
  let store: ReturnType<typeof createPopupStore>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    store = createPopupStore();
  });

  afterEach(() => {
    store.cancelPersistence();
    vi.useRealTimers();
    fakeBrowser.reset();
  });

  it('initializes with null importedFile and cvMetadata', () => {
    expect(store.state.importedFile).toBeNull();
    expect(store.state.cvMetadata).toBeNull();
  });

  it('stores imported file data', () => {
    store.setImportedFile('test.tsx', 1024, 'const CV = () => <div>Test</div>');

    expect(store.state.importedFile).toEqual({
      name: 'test.tsx',
      size: 1024,
      content: 'const CV = () => <div>Test</div>',
    });
  });

  it('stores CV metadata', () => {
    const metadata = {
      name: 'John Doe',
      role: 'Software Engineer',
      confidence: 0.95,
      estimatedPages: 2,
      layoutType: 'two-column' as const,
      hasImages: false,
    };

    store.setCVDetected(metadata);

    expect(store.state.cvMetadata).toEqual(metadata);
  });

  it('clears CV metadata with setNoCVDetected', () => {
    store.setCVDetected({
      confidence: 0.9,
      estimatedPages: 1,
      layoutType: 'single-column',
      hasImages: false,
    });
    store.setNoCVDetected();

    expect(store.state.cvMetadata).toBeNull();
  });

  it('clears imported file', () => {
    store.setImportedFile('test.tsx', 1024, 'content');
    store.clearImportedFile();

    expect(store.state.importedFile).toBeNull();
  });

  it('resets persisted state', () => {
    store.setImportedFile('test.tsx', 1024, 'content');
    store.setCVDetected({
      confidence: 0.9,
      estimatedPages: 1,
      layoutType: 'single-column',
      hasImages: false,
    });
    store.reset();

    expect(store.state.importedFile).toBeNull();
    expect(store.state.cvMetadata).toBeNull();
  });
});

describe('Popup Store - UI State', () => {
  let store: ReturnType<typeof createPopupStore>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    store = createPopupStore();
  });

  afterEach(() => {
    store.cancelPersistence();
    vi.useRealTimers();
    fakeBrowser.reset();
  });

  it('initializes with "waiting_for_import" state', () => {
    expect(store.state.uiState).toBe('waiting_for_import');
  });

  it('sets UI state directly', () => {
    store.setUIState('file_validated');
    expect(store.state.uiState).toBe('file_validated');
  });

  it('starts conversion', () => {
    store.startConversion();

    expect(store.state.uiState).toBe('converting');
    expect(store.state.lastError).toBeNull();
  });

  it('sets success state with filename', () => {
    store.setSuccess('CV_John_Doe_2025-10-13.pdf');

    expect(store.state.uiState).toBe('success');
    expect(store.state.lastFilename).toBe('CV_John_Doe_2025-10-13.pdf');
    expect(store.state.lastError).toBeNull();
  });

  it('sets error state with error info', () => {
    store.setError({
      code: ErrorCode.TSX_PARSE_ERROR,
      message: 'Failed to parse TSX',
      recoverable: true,
      suggestions: ['Simplify your CV layout'],
      stage: 'parsing',
      category: ErrorCategory.SYNTAX,
      timestamp: Date.now(),
    });

    expect(store.state.uiState).toBe('error');
    expect(store.state.lastError).toBeDefined();
    expect(store.state.lastError?.code).toBe(ErrorCode.TSX_PARSE_ERROR);
  });

  it('sets validation error', () => {
    store.setValidationError('Invalid CV format');

    expect(store.state.uiState).toBe('validation_error');
    expect(store.state.validationError).toBe('Invalid CV format');
    expect(store.state.isValidating).toBe(false);
  });

  it('clears validation error', () => {
    store.setValidationError('Invalid CV format');
    store.clearValidationError();

    expect(store.state.validationError).toBeNull();
    expect(store.state.isValidating).toBe(false);
  });

  it('sets validating state', () => {
    store.setValidating(true);
    expect(store.state.isValidating).toBe(true);

    store.setValidating(false);
    expect(store.state.isValidating).toBe(false);
  });

  it('resets UI state', () => {
    store.setError({
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'Test error',
      recoverable: true,
      suggestions: [],
      stage: 'queued',
      category: ErrorCategory.UNKNOWN,
      timestamp: Date.now(),
    });
    store.resetUI();

    expect(store.state.uiState).toBe('waiting_for_import');
    expect(store.state.lastError).toBeNull();
    expect(store.state.lastFilename).toBeNull();
    expect(store.state.validationError).toBeNull();
    expect(store.state.isValidating).toBe(false);
  });
});

describe('Popup Store - Hydration', () => {
  let store: ReturnType<typeof createPopupStore>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    store = createPopupStore();
  });

  afterEach(() => {
    store.cancelPersistence();
    vi.useRealTimers();
    fakeBrowser.reset();
  });

  it('initializes with hasHydrated false', () => {
    expect(store.state.hasHydrated).toBe(false);
  });

  it('sets hydrated state', () => {
    store.setHasHydrated(true);
    expect(store.state.hasHydrated).toBe(true);
  });

  it('stores hydration error', () => {
    const error = new Error('Storage corrupted');
    store.setHydrationError(error);

    expect(store.state.hydrationError).toBe(error);
  });

  it('clears hydration error', () => {
    store.setHydrationError(new Error('test'));
    store.setHydrationError(null);

    expect(store.state.hydrationError).toBeNull();
  });
});

describe('Popup Store - Integration', () => {
  let store: ReturnType<typeof createPopupStore>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    store = createPopupStore();
  });

  afterEach(() => {
    store.cancelPersistence();
    vi.useRealTimers();
    fakeBrowser.reset();
  });

  it('unified store combines persisted and UI state', () => {
    store.setImportedFile('test.tsx', 1024, 'content');
    store.setUIState('file_validated');

    expect(store.state.importedFile?.name).toBe('test.tsx');
    expect(store.state.uiState).toBe('file_validated');

    // resetUI only resets UI, not persisted data
    store.resetUI();

    expect(store.state.importedFile?.name).toBe('test.tsx');
    expect(store.state.uiState).toBe('waiting_for_import');

    // Full reset clears everything
    store.setUIState('converting');
    store.reset();

    expect(store.state.importedFile).toBeNull();
    expect(store.state.uiState).toBe('waiting_for_import');
  });

  it('persists state to Chrome storage via debounced write', async () => {
    store.setImportedFile('resume.tsx', 2048, '<Resume />');
    store.savePersistence();

    // Not written yet (debounced)
    const before = await fakeBrowser.storage.local.get('resumewright-popup-state');
    expect(before['resumewright-popup-state']).toBeUndefined();

    // Advance past debounce
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();

    const after = await fakeBrowser.storage.local.get('resumewright-popup-state');
    expect(after['resumewright-popup-state']).toEqual({
      cvMetadata: null,
      importedFile: { name: 'resume.tsx', size: 2048, content: '<Resume />' },
    });
  });

  it('loads persisted state from Chrome storage', async () => {
    await fakeBrowser.storage.local.set({
      'resumewright-popup-state': {
        cvMetadata: {
          name: 'Alice',
          confidence: 0.95,
          estimatedPages: 2,
          layoutType: 'two-column',
          hasImages: false,
        },
        importedFile: { name: 'cv.tsx', size: 512, content: 'CV content' },
      },
    });

    await store.hydrate();

    expect(store.state.importedFile).toEqual({
      name: 'cv.tsx',
      size: 512,
      content: 'CV content',
    });
    expect(store.state.cvMetadata?.name).toBe('Alice');
    expect(store.state.hasHydrated).toBe(true);
  });

  it('handles missing persisted state gracefully', async () => {
    await store.hydrate();

    expect(store.state.importedFile).toBeNull();
    expect(store.state.cvMetadata).toBeNull();
    expect(store.state.hasHydrated).toBe(true);
  });

  it('handles invalid persisted state gracefully', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await fakeBrowser.storage.local.set({
      'resumewright-popup-state': { cvMetadata: 'not-an-object', importedFile: 42 },
    });

    await store.hydrate();

    // Falls back to defaults
    expect(store.state.importedFile).toBeNull();
    expect(store.state.cvMetadata).toBeNull();
    expect(store.state.hasHydrated).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Validation failed'),
      expect.any(Array),
    );

    errorSpy.mockRestore();
  });

  it('flushes pending writes immediately', async () => {
    store.setImportedFile('flush-test.tsx', 100, 'content');
    store.savePersistence();

    await store.flushPersistence();

    const stored = await fakeBrowser.storage.local.get('resumewright-popup-state');
    expect(stored['resumewright-popup-state']).toEqual({
      cvMetadata: null,
      importedFile: { name: 'flush-test.tsx', size: 100, content: 'content' },
    });
  });
});
