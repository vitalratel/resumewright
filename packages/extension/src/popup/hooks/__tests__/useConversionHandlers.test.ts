/**
 * Tests for useConversionHandlers hook
 * Custom hooks testing
 * Complex hook validation
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateTsxFile } from '@/shared/domain/pdf/validation';
import { ErrorCode } from '@/shared/errors/codes';
import { copyToClipboard } from '@/shared/errors/tracking/telemetry';
import { extensionAPI } from '../../services/extensionAPI';
import { useProgressStore } from '../../store/progressStore';
import { useConversionHandlers } from '../conversion/useConversionHandlers';
import type { AppState } from '../integration/useAppState';
import { createMockAppState } from './helpers';

vi.mock('../../services/extensionAPI', () => ({
  extensionAPI: { startConversion: vi.fn() },
}));

vi.mock('@/shared/domain/pdf/validation', async () => {
  const actual = await vi.importActual('@/shared/domain/pdf/validation');
  return {
    ...actual,
    validateTsxFile: vi.fn(),
  };
});

vi.mock('@/shared/errors/tracking/telemetry', async () => {
  const actual = await vi.importActual('@/shared/errors/tracking/telemetry');
  return {
    ...actual,
    copyToClipboard: vi.fn().mockResolvedValue(true),
    generateErrorId: () => 'error-123',
  };
});

// Use real logging implementation

describe('useConversionHandlers', () => {
  let mockAppState: AppState;
  const testJobId = 'test-job-123';
  const defaultProps = () => ({
    appState: mockAppState,
    currentJobId: testJobId,
    wasmInitialized: true,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    useProgressStore.getState().reset();
    mockAppState = createMockAppState();
  });

  describe('handleFileValidated', () => {
    it('validates file content successfully', async () => {
      vi.mocked(validateTsxFile).mockResolvedValue({ valid: true });

      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      await act(async () => {
        await result.current.handleFileValidated('<CV>Test</CV>', 'test.tsx', 1024);
      });

      expect(mockAppState.setValidating).toHaveBeenCalledWith(true);
      expect(validateTsxFile).toHaveBeenCalledWith(
        '<CV>Test</CV>',
        1024,
        'test.tsx',
        expect.anything(),
      );
      expect(mockAppState.setImportedFile).toHaveBeenCalledWith('test.tsx', 1024, '<CV>Test</CV>');
      expect(mockAppState.setUIState).toHaveBeenCalledWith('file_validated');
      expect(mockAppState.clearValidationError).toHaveBeenCalled();
      expect(mockAppState.setValidating).toHaveBeenCalledWith(false);
    });

    it('handles validation failure', async () => {
      vi.mocked(validateTsxFile).mockResolvedValue({ valid: false, error: 'Invalid CV format' });

      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      await act(async () => {
        await result.current.handleFileValidated('invalid', 'test.tsx', 1024);
      });

      expect(mockAppState.setValidationError).toHaveBeenCalledWith('Invalid CV format');
      expect(mockAppState.setImportedFile).not.toHaveBeenCalled();
      expect(mockAppState.setValidating).toHaveBeenCalledWith(false);
    });

    it('handles validation error exception', async () => {
      vi.mocked(validateTsxFile).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      await act(async () => {
        await result.current.handleFileValidated('<CV>Test</CV>', 'test.tsx', 1024);
      });

      expect(mockAppState.setValidationError).toHaveBeenCalled();
      expect(mockAppState.setValidating).toHaveBeenCalledWith(false);
    });

    it('clears previous validation errors on success', async () => {
      vi.mocked(validateTsxFile).mockResolvedValue({ valid: true });

      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      await act(async () => {
        await result.current.handleFileValidated('<CV>Valid</CV>', 'test.tsx', 1024);
      });

      expect(mockAppState.clearValidationError).toHaveBeenCalled();
    });
  });

  describe('handleExportClick', () => {
    it('starts conversion with valid file', async () => {
      mockAppState.importedFile = { name: 'test.tsx', size: 1024, content: '<CV>Test</CV>' };
      vi.mocked(extensionAPI.startConversion).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      await act(async () => {
        await result.current.handleExportClick();
      });
      expect(mockAppState.startConversion).toHaveBeenCalled();
      expect(extensionAPI.startConversion).toHaveBeenCalledWith('<CV>Test</CV>', 'test.tsx');
    });

    it('shows error when no file imported', async () => {
      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      await act(async () => {
        await result.current.handleExportClick();
      });
      expect(mockAppState.setValidationError).toHaveBeenCalled();
      expect(extensionAPI.startConversion).not.toHaveBeenCalled();
    });

    it('handles WASM not initialized', async () => {
      mockAppState.importedFile = { name: 'test.tsx', size: 1024, content: '<CV>Test</CV>' };

      const { result } = renderHook(() =>
        useConversionHandlers({ ...defaultProps(), wasmInitialized: false }),
      );

      await act(async () => {
        await result.current.handleExportClick();
      });

      expect(mockAppState.setError).toHaveBeenCalledWith(
        expect.objectContaining({ code: ErrorCode.CONVERSION_START_FAILED, recoverable: true }),
      );
      expect(extensionAPI.startConversion).not.toHaveBeenCalled();
    });

    it('handles large files correctly', async () => {
      mockAppState.importedFile = {
        name: 'large.tsx',
        size: 2 * 1024 * 1024,
        content: '<CV>Large</CV>',
      };
      vi.mocked(extensionAPI.startConversion).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      await act(async () => {
        await result.current.handleExportClick();
      });

      // Should start conversion successfully despite large size
      expect(extensionAPI.startConversion).toHaveBeenCalled();
    });

    it('handles conversion start failure', async () => {
      mockAppState.importedFile = { name: 'test.tsx', size: 1024, content: '<CV>Test</CV>' };
      vi.mocked(extensionAPI.startConversion).mockRejectedValue(new Error('Failed to start'));

      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      await act(async () => {
        await result.current.handleExportClick();
      });

      expect(mockAppState.setError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.CONVERSION_START_FAILED,
          recoverable: true,
          suggestions: expect.arrayContaining([
            'Try converting again',
            'Make sure your file is from Claude',
            'Check your internet connection',
          ]),
        }),
      );
    });

    it('updates progress store', async () => {
      mockAppState.importedFile = { name: 'test.tsx', size: 1024, content: '<CV>Test</CV>' };
      vi.mocked(extensionAPI.startConversion).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      await act(async () => {
        await result.current.handleExportClick();
      });

      expect(useProgressStore.getState().getProgress(testJobId)).toBeDefined();
    });
  });

  describe('handleCancelConversion', () => {
    it('resets app state and clears progress', () => {
      useProgressStore.getState().startConversion(testJobId);
      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      act(() => result.current.handleCancelConversion?.());

      expect(mockAppState.reset).toHaveBeenCalled();
      expect(useProgressStore.getState().getProgress(testJobId)).toBeUndefined();
    });
  });

  describe('handleRetry', () => {
    it('resets app state', () => {
      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      act(() => result.current.handleRetry());

      expect(mockAppState.reset).toHaveBeenCalled();
    });
  });

  describe('handleDismissError', () => {
    it('resets app state', () => {
      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      act(() => result.current.handleDismissError());

      expect(mockAppState.reset).toHaveBeenCalled();
    });
  });

  describe('handleImportDifferent', () => {
    it('clears imported file and validation error', () => {
      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      act(() => result.current.handleImportDifferent());

      expect(mockAppState.clearImportedFile).toHaveBeenCalled();
      expect(mockAppState.clearValidationError).toHaveBeenCalled();
    });
  });

  describe('handleReportIssue', () => {
    it('copies error details to clipboard when error exists', async () => {
      const testError = {
        stage: 'parsing' as const,
        code: ErrorCode.TSX_PARSE_ERROR,
        message: 'Test error',
        recoverable: true,
        timestamp: Date.now(),
        suggestions: [],
      };
      mockAppState.lastError = testError;

      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      await act(async () => {
        await result.current.handleReportIssue();
      });

      expect(copyToClipboard).toHaveBeenCalledWith(expect.stringContaining('TSX_PARSE_ERROR'));
    });

    it('does not copy when no error exists', async () => {
      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      await act(async () => {
        await result.current.handleReportIssue();
      });

      expect(copyToClipboard).not.toHaveBeenCalled();
    });
  });

  describe('Hook Stability', () => {
    it('returns consistent handler object structure', () => {
      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      expect(typeof result.current.handleFileValidated).toBe('function');
      expect(typeof result.current.handleExportClick).toBe('function');
      expect(typeof result.current.handleCancelConversion).toBe('function');
      expect(typeof result.current.handleRetry).toBe('function');
      expect(typeof result.current.handleDismissError).toBe('function');
      expect(typeof result.current.handleImportDifferent).toBe('function');
      expect(typeof result.current.handleReportIssue).toBe('function');
    });

    it('handlers remain stable when props do not change', () => {
      const { result, rerender } = renderHook(() => useConversionHandlers(defaultProps()));

      const firstHandlers = result.current;
      rerender();

      // Handlers should be stable (same reference) when dependencies don't change
      // This prevents unnecessary re-renders of child components
      expect(firstHandlers.handleExportClick).toBe(result.current.handleExportClick);
    });
  });

  describe('Edge Cases', () => {
    it('handles null wasmInitialized', async () => {
      mockAppState.importedFile = { name: 'test.tsx', size: 1024, content: '<CV>Test</CV>' };

      const { result } = renderHook(() =>
        useConversionHandlers({ ...defaultProps(), wasmInitialized: null }),
      );

      await act(async () => {
        await result.current.handleExportClick();
      });

      expect(mockAppState.setError).toHaveBeenCalledWith(
        expect.objectContaining({ code: ErrorCode.CONVERSION_START_FAILED }),
      );
    });

    it('handles empty file content', async () => {
      vi.mocked(validateTsxFile).mockResolvedValue({ valid: false, error: 'File is empty' });

      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      await act(async () => {
        await result.current.handleFileValidated('', 'empty.tsx', 0);
      });

      expect(mockAppState.setValidationError).toHaveBeenCalledWith('File is empty');
    });

    it('handles very large files', async () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      vi.mocked(validateTsxFile).mockResolvedValue({ valid: true });

      const largeContent = `${'<CV>'.padEnd(10 * 1024 * 1024, 'x')}</CV>`;
      const { result } = renderHook(() => useConversionHandlers(defaultProps()));

      await act(async () => {
        await result.current.handleFileValidated(largeContent, 'large.tsx', largeContent.length);
      });

      expect(mockAppState.setImportedFile).toHaveBeenCalledWith(
        'large.tsx',
        largeContent.length,
        largeContent,
      );
      spy.mockRestore();
    });
  });
});
