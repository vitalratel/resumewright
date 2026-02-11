// ABOUTME: Tests for conversion handler factory.
// ABOUTME: Covers file validation, export execution, cancellation, and error recovery.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateTsxFile } from '@/shared/domain/pdf/validation';
import { ErrorCode } from '@/shared/errors/codes';
import { copyToClipboard } from '@/shared/errors/tracking/telemetry';
import { requestConversion } from '../../services/extensionAPI';
import { popupStore } from '../../store';
import { progressStore } from '../../store/progressStore';
import { createConversionHandlers } from '../conversion';

vi.mock('../../services/extensionAPI', () => ({
  requestConversion: vi.fn(),
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
  };
});

describe('createConversionHandlers', () => {
  const testJobId = 'test-job-123';
  let handlers: ReturnType<typeof createConversionHandlers>;

  beforeEach(() => {
    vi.clearAllMocks();
    popupStore.reset();
    popupStore.setHasHydrated(true);
    progressStore.reset();
    handlers = createConversionHandlers(testJobId);
  });

  describe('handleFileValidated', () => {
    it('validates file content successfully', async () => {
      vi.mocked(validateTsxFile).mockResolvedValue({ valid: true });

      await handlers.handleFileValidated('<CV>Test</CV>', 'test.tsx', 1024);

      expect(validateTsxFile).toHaveBeenCalledWith(
        '<CV>Test</CV>',
        1024,
        'test.tsx',
        expect.anything(),
      );
      expect(popupStore.state.importedFile).toEqual({
        name: 'test.tsx',
        size: 1024,
        content: '<CV>Test</CV>',
      });
      expect(popupStore.state.uiState).toBe('file_validated');
      expect(popupStore.state.validationError).toBeNull();
      expect(popupStore.state.isValidating).toBe(false);
    });

    it('handles validation failure', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(validateTsxFile).mockResolvedValue({
        valid: false,
        error: 'Invalid CV format',
      });

      await handlers.handleFileValidated('invalid', 'test.tsx', 1024);

      expect(popupStore.state.uiState).toBe('validation_error');
      expect(popupStore.state.validationError).toBe('Invalid CV format');
      expect(popupStore.state.importedFile).toBeNull();
      expect(popupStore.state.isValidating).toBe(false);
      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });

    it('handles validation error exception', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(validateTsxFile).mockRejectedValue(new Error('Network error'));

      await handlers.handleFileValidated('<CV>Test</CV>', 'test.tsx', 1024);

      expect(popupStore.state.validationError).toBeTruthy();
      expect(popupStore.state.isValidating).toBe(false);

      spy.mockRestore();
    });

    it('clears previous validation errors on success', async () => {
      popupStore.setValidationError('Previous error');
      vi.mocked(validateTsxFile).mockResolvedValue({ valid: true });

      await handlers.handleFileValidated('<CV>Valid</CV>', 'test.tsx', 1024);

      expect(popupStore.state.validationError).toBeNull();
    });
  });

  describe('handleExportClick', () => {
    it('starts conversion with valid file', async () => {
      popupStore.setImportedFile('test.tsx', 1024, '<CV>Test</CV>');
      vi.mocked(requestConversion).mockResolvedValue({ success: true });

      await handlers.handleExportClick();

      expect(popupStore.state.uiState).toBe('converting');
      expect(requestConversion).toHaveBeenCalledWith('<CV>Test</CV>', 'test.tsx');
    });

    it('shows error when no file imported', async () => {
      await handlers.handleExportClick();

      expect(popupStore.state.validationError).toBeTruthy();
      expect(requestConversion).not.toHaveBeenCalled();
    });

    it('handles large files correctly', async () => {
      popupStore.setImportedFile('large.tsx', 2 * 1024 * 1024, '<CV>Large</CV>');
      vi.mocked(requestConversion).mockResolvedValue({ success: true });

      await handlers.handleExportClick();

      expect(requestConversion).toHaveBeenCalled();
    });

    it('handles conversion start failure', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      popupStore.setImportedFile('test.tsx', 1024, '<CV>Test</CV>');
      vi.mocked(requestConversion).mockRejectedValue(new Error('Failed to start'));

      await handlers.handleExportClick();

      expect(popupStore.state.uiState).toBe('error');
      expect(popupStore.state.lastError?.code).toBe(ErrorCode.CONVERSION_START_FAILED);
      expect(popupStore.state.lastError?.recoverable).toBe(true);
      expect(popupStore.state.lastError?.suggestions).toContain('Try converting again');

      spy.mockRestore();
    });

    it('updates progress store', async () => {
      popupStore.setImportedFile('test.tsx', 1024, '<CV>Test</CV>');
      vi.mocked(requestConversion).mockResolvedValue({ success: true });

      await handlers.handleExportClick();

      expect(progressStore.getProgress(testJobId)).toBeDefined();
    });
  });

  describe('handleCancelConversion', () => {
    it('resets app state and clears progress', () => {
      popupStore.startConversion();
      progressStore.startConversion(testJobId);

      handlers.handleCancelConversion!();

      expect(popupStore.state.uiState).toBe('waiting_for_import');
      expect(progressStore.getProgress(testJobId)).toBeUndefined();
    });
  });

  describe('handleRetry', () => {
    it('resets UI state', () => {
      popupStore.setError({
        stage: 'queued',
        code: ErrorCode.CONVERSION_START_FAILED,
        message: 'Test',
        timestamp: Date.now(),
        recoverable: true,
        suggestions: [],
      });

      handlers.handleRetry();

      expect(popupStore.state.uiState).toBe('waiting_for_import');
      expect(popupStore.state.lastError).toBeNull();
    });
  });

  describe('handleDismissError', () => {
    it('resets UI state', () => {
      popupStore.setError({
        stage: 'queued',
        code: ErrorCode.CONVERSION_START_FAILED,
        message: 'Test',
        timestamp: Date.now(),
        recoverable: true,
        suggestions: [],
      });

      handlers.handleDismissError();

      expect(popupStore.state.uiState).toBe('waiting_for_import');
    });
  });

  describe('handleImportDifferent', () => {
    it('clears imported file and resets to import state', () => {
      popupStore.setImportedFile('test.tsx', 1024, '<CV>Test</CV>');
      popupStore.setValidationError('Some error');

      handlers.handleImportDifferent();

      expect(popupStore.state.importedFile).toBeNull();
      expect(popupStore.state.validationError).toBeNull();
      expect(popupStore.state.uiState).toBe('waiting_for_import');
    });
  });

  describe('handleReportIssue', () => {
    it('copies error details to clipboard when error exists', async () => {
      popupStore.setError({
        stage: 'parsing',
        code: ErrorCode.TSX_PARSE_ERROR,
        message: 'Test error',
        recoverable: true,
        timestamp: Date.now(),
        suggestions: [],
      });

      await handlers.handleReportIssue();

      expect(copyToClipboard).toHaveBeenCalledWith(expect.stringContaining('TSX_PARSE_ERROR'));
    });

    it('does not copy when no error exists', async () => {
      await handlers.handleReportIssue();

      expect(copyToClipboard).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty file content', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(validateTsxFile).mockResolvedValue({
        valid: false,
        error: 'File is empty',
      });

      await handlers.handleFileValidated('', 'empty.tsx', 0);

      expect(popupStore.state.validationError).toBe('File is empty');
      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });

    it('handles very large files', async () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      vi.mocked(validateTsxFile).mockResolvedValue({ valid: true });

      const largeContent = `${'<CV>'.padEnd(10 * 1024 * 1024, 'x')}</CV>`;

      await handlers.handleFileValidated(largeContent, 'large.tsx', largeContent.length);

      expect(popupStore.state.importedFile).toBeTruthy();
      expect(popupStore.state.importedFile?.name).toBe('large.tsx');

      spy.mockRestore();
    });
  });
});
