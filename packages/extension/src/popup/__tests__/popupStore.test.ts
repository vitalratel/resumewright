/**
 * Popup Store Tests
 * State management with Zustand
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCategory, ErrorCode } from '../../shared/errors/codes';
import { usePopupStore } from '../store';

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      getManifest: () => ({ version: '1.0.0-test' }),
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    storage: {
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      },
    },
  },
}));

describe('usePopupStore - Persisted State', () => {
  beforeEach(() => {
    const { result } = renderHook(() => usePopupStore());
    act(() => {
      result.current.reset();
    });
  });

  it('initializes with null importedFile', () => {
    const { result } = renderHook(() => usePopupStore());
    expect(result.current.importedFile).toBeNull();
    expect(result.current.cvMetadata).toBeNull();
  });

  it('stores imported file data', () => {
    const { result } = renderHook(() => usePopupStore());

    act(() => {
      result.current.setImportedFile('test.tsx', 1024, 'const CV = () => <div>Test</div>');
    });

    expect(result.current.importedFile).toEqual({
      name: 'test.tsx',
      size: 1024,
      content: 'const CV = () => <div>Test</div>',
    });
  });

  it('stores CV metadata', () => {
    const { result } = renderHook(() => usePopupStore());
    const metadata = {
      name: 'John Doe',
      role: 'Software Engineer',
      confidence: 0.95,
      estimatedPages: 2,
      layoutType: 'two-column' as const,
      hasImages: false,
    };

    act(() => {
      result.current.setCVDetected(metadata);
    });

    expect(result.current.cvMetadata).toEqual(metadata);
  });

  it('clears imported file', () => {
    const { result } = renderHook(() => usePopupStore());

    act(() => {
      result.current.setImportedFile('test.tsx', 1024, 'content');
      result.current.clearImportedFile();
    });

    expect(result.current.importedFile).toBeNull();
  });

  it('resets persisted state', () => {
    const { result } = renderHook(() => usePopupStore());

    act(() => {
      result.current.setImportedFile('test.tsx', 1024, 'content');
      result.current.setCVDetected({
        confidence: 0.9,
        estimatedPages: 1,
        layoutType: 'single-column',
        hasImages: false,
      });
      result.current.reset();
    });

    expect(result.current.importedFile).toBeNull();
    expect(result.current.cvMetadata).toBeNull();
  });
});

describe('usePopupStore - UI State', () => {
  beforeEach(() => {
    const { result } = renderHook(() => usePopupStore());
    act(() => {
      result.current.reset();
    });
  });

  it('initializes with "waiting_for_import" state', () => {
    const { result } = renderHook(() => usePopupStore());
    expect(result.current.uiState).toBe('waiting_for_import');
  });

  it('sets UI state directly', () => {
    const { result } = renderHook(() => usePopupStore());

    act(() => {
      result.current.setUIState('file_validated');
    });

    expect(result.current.uiState).toBe('file_validated');
  });

  it('starts conversion', () => {
    const { result } = renderHook(() => usePopupStore());

    act(() => {
      result.current.startConversion();
    });

    expect(result.current.uiState).toBe('converting');
    expect(result.current.lastError).toBeNull();
  });

  it('sets success state with filename', () => {
    const { result } = renderHook(() => usePopupStore());

    act(() => {
      result.current.setSuccess('CV_John_Doe_2025-10-13.pdf');
    });

    expect(result.current.uiState).toBe('success');
    expect(result.current.lastFilename).toBe('CV_John_Doe_2025-10-13.pdf');
    expect(result.current.lastError).toBeNull();
  });

  it('sets error state with error info', () => {
    const { result } = renderHook(() => usePopupStore());

    act(() => {
      result.current.setError({
        code: ErrorCode.TSX_PARSE_ERROR,
        message: 'Failed to parse TSX',
        recoverable: true,
        suggestions: ['Simplify your CV layout'],
        stage: 'parsing',
        category: ErrorCategory.SYNTAX,
        timestamp: Date.now(),
        errorId: 'test-error-1',
      });
    });

    expect(result.current.uiState).toBe('error');
    expect(result.current.lastError).toBeDefined();
    expect(result.current.lastError?.code).toBe(ErrorCode.TSX_PARSE_ERROR);
  });

  it('sets validation error', () => {
    const { result } = renderHook(() => usePopupStore());

    act(() => {
      result.current.setValidationError('Invalid CV format');
    });

    expect(result.current.uiState).toBe('validation_error');
    expect(result.current.validationError).toBe('Invalid CV format');
    expect(result.current.isValidating).toBe(false);
  });

  it('clears validation error', () => {
    const { result } = renderHook(() => usePopupStore());

    act(() => {
      result.current.setValidationError('Invalid CV format');
      result.current.clearValidationError();
    });

    expect(result.current.validationError).toBeNull();
    expect(result.current.isValidating).toBe(false);
  });

  it('resets UI state', () => {
    const { result } = renderHook(() => usePopupStore());

    act(() => {
      result.current.setError({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Test error',
        recoverable: true,
        suggestions: [],
        stage: 'queued',
        category: ErrorCategory.UNKNOWN,
        timestamp: Date.now(),
        errorId: 'test-error-2',
      });
      result.current.reset();
    });

    expect(result.current.uiState).toBe('waiting_for_import');
    expect(result.current.lastError).toBeNull();
    expect(result.current.lastFilename).toBeNull();
  });

  it('triggers synchronous re-renders (no persist middleware)', () => {
    const { result } = renderHook(() => usePopupStore());

    let renderCount = 0;
    const { result: trackingResult } = renderHook(() => {
      renderCount += 1;
      return usePopupStore((state) => state.uiState);
    });

    const initialRenderCount = renderCount;

    act(() => {
      result.current.setError({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Test',
        recoverable: true,
        suggestions: [],
        stage: 'queued',
        category: ErrorCategory.UNKNOWN,
        timestamp: Date.now(),
        errorId: 'test-error-3',
      });
    });

    expect(renderCount).toBeGreaterThan(initialRenderCount);
    expect(trackingResult.current).toBe('error');
  });
});

describe('usePopupStore - Integration', () => {
  it('unified store combines persisted and UI state', () => {
    const { result } = renderHook(() => usePopupStore());

    act(() => {
      result.current.setImportedFile('test.tsx', 1024, 'content');
      result.current.setUIState('file_validated');
    });

    expect(result.current.importedFile?.name).toBe('test.tsx');
    expect(result.current.uiState).toBe('file_validated');

    act(() => {
      result.current.resetUI();
    });

    expect(result.current.importedFile?.name).toBe('test.tsx');
    expect(result.current.uiState).toBe('waiting_for_import');

    act(() => {
      result.current.setUIState('converting');
      result.current.reset();
    });

    expect(result.current.importedFile).toBeNull();
    expect(result.current.uiState).toBe('waiting_for_import');
  });
});
