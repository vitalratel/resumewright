/**
 * Tests for useAppSubscriptions hook
 * Tests message subscription management and cleanup
 */

import type { Mock } from 'vitest';
import type { ConversionCompletePayload, ConversionErrorPayload, ConversionProgressPayload } from '../../../../shared/types/messages';
import type { ConversionProgress } from '../../../../shared/types/models';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCode } from '../../../../shared/errors/codes';
import { downloadPDF } from '../../../../shared/infrastructure/pdf/downloader';
import { extensionAPI } from '../../../services/extensionAPI';
import { usePopupStore } from '../../../store';
import { useProgressStore } from '../../../store/progressStore';
import { useAppSubscriptions } from '../useAppSubscriptions';

// Mock extensionAPI
vi.mock('../../../services/extensionAPI', () => ({
  extensionAPI: {
    onProgress: vi.fn(),
    onSuccess: vi.fn(),
    onError: vi.fn(),
  },
}));

// Mock downloadPDF
vi.mock('../../../../shared/infrastructure/pdf/downloader', () => ({
  downloadPDF: vi.fn(),
}));

// Don't mock logger - test with real implementation

describe('useAppSubscriptions', () => {
  let unsubProgress: Mock<() => void>;
  let unsubSuccess: Mock<() => void>;
  let unsubError: Mock<() => void>;
  let progressCallback: ((payload: ConversionProgressPayload) => void) | null;
  let successCallback: ((result: ConversionCompletePayload) => void) | null;
  let errorCallback: ((payload: ConversionErrorPayload) => void) | null;

  beforeEach(() => {
    vi.clearAllMocks();
    useProgressStore.getState().reset();
    usePopupStore.getState().reset();

    // Reset callbacks
    progressCallback = null;
    successCallback = null;
    errorCallback = null;

    // Setup unsubscribe functions with correct type signature
    unsubProgress = vi.fn<() => void>();
    unsubSuccess = vi.fn<() => void>();
    unsubError = vi.fn<() => void>();

    // Mock extensionAPI subscriptions to capture callbacks
    vi.mocked(extensionAPI.onProgress).mockImplementation((cb) => {
      progressCallback = cb;
      return unsubProgress;
    });

    vi.mocked(extensionAPI.onSuccess).mockImplementation((cb) => {
      successCallback = cb;
      return unsubSuccess;
    });

    vi.mocked(extensionAPI.onError).mockImplementation((cb) => {
      errorCallback = cb;
      return unsubError;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('subscription setup', () => {
    it('should set up all three message subscriptions on mount', () => {
      renderHook(() => useAppSubscriptions());

      expect(extensionAPI.onProgress).toHaveBeenCalledTimes(1);
      expect(extensionAPI.onSuccess).toHaveBeenCalledTimes(1);
      expect(extensionAPI.onError).toHaveBeenCalledTimes(1);
      expect(progressCallback).not.toBeNull();
      expect(successCallback).not.toBeNull();
      expect(errorCallback).not.toBeNull();
    });

    it('should clean up all subscriptions on unmount', () => {
      const { unmount } = renderHook(() => useAppSubscriptions());

      unmount();

      expect(unsubProgress).toHaveBeenCalledTimes(1);
      expect(unsubSuccess).toHaveBeenCalledTimes(1);
      expect(unsubError).toHaveBeenCalledTimes(1);
    });
  });

  describe('progress updates', () => {
    it('should update progress store when progress message received', () => {
      renderHook(() => useAppSubscriptions());

      const testJobId = 'test-job-123';
      const testProgress: ConversionProgress = {
        stage: 'queued',
        percentage: 50,
        currentOperation: 'Parsing TSX',
      };

      // Trigger progress callback
      progressCallback?.({ jobId: testJobId, progress: testProgress });

      // Verify progress store was updated
      const progressState = useProgressStore.getState().activeConversions[testJobId];
      expect(progressState).toBeDefined();
      expect(progressState.stage).toBe('queued');
      expect(progressState.percentage).toBe(50);
    });

    it('should handle multiple progress updates for same job', () => {
      renderHook(() => useAppSubscriptions());

      const testJobId = 'test-job-123';

      progressCallback?.({
        jobId: testJobId,
        progress: { stage: 'queued', percentage: 25, currentOperation: 'Parsing' },
      });
      expect(useProgressStore.getState().activeConversions[testJobId]?.percentage).toBe(25);

      progressCallback?.({
        jobId: testJobId,
        progress: { stage: 'rendering', percentage: 50, currentOperation: 'Layout' },
      });
      expect(useProgressStore.getState().activeConversions[testJobId]?.percentage).toBe(50);

      progressCallback?.({
        jobId: testJobId,
        progress: { stage: 'generating-pdf', percentage: 75, currentOperation: 'PDF' },
      });
      expect(useProgressStore.getState().activeConversions[testJobId]?.percentage).toBe(75);
    });

    it('should handle progress updates for different jobs', () => {
      renderHook(() => useAppSubscriptions());

      progressCallback?.({
        jobId: 'job-1',
        progress: { stage: 'queued', percentage: 30, currentOperation: 'Parsing' },
      });
      progressCallback?.({
        jobId: 'job-2',
        progress: { stage: 'generating-pdf', percentage: 70, currentOperation: 'PDF' },
      });

      const progressState = useProgressStore.getState().activeConversions;
      expect(progressState['job-1']?.percentage).toBe(30);
      expect(progressState['job-2']?.percentage).toBe(70);
    });
  });

  describe('success handling', () => {
    it('should download PDF and set success state when PDF bytes provided', async () => {
      vi.mocked(downloadPDF).mockResolvedValue();

      renderHook(() => useAppSubscriptions());

      const testPdfBytes = new Uint8Array([37, 80, 68, 70]); // %PDF header
      const testFilename = 'test-resume.pdf';

      // Trigger success callback
      successCallback?.({
        jobId: 'test-job-123',
        filename: testFilename,
        fileSize: testPdfBytes.length,
        duration: 1000,
        pdfBytes: testPdfBytes,
      });

      // Wait for async operations
      await vi.waitFor(() => {
        expect(downloadPDF).toHaveBeenCalledWith(testPdfBytes, testFilename);
      });

      // Verify UI state was updated
      const uiState = usePopupStore.getState();
      expect(uiState.uiState).toBe('success');
      expect(uiState.lastFilename).toBe(testFilename);
    });

    it('should convert array-like PDF bytes to Uint8Array', async () => {
      vi.mocked(downloadPDF).mockResolvedValue();

      renderHook(() => useAppSubscriptions());

      // Simulate message passing converting Uint8Array to object
      const arrayLikePdfBytes = { 0: 37, 1: 80, 2: 68, 3: 70, length: 4 };

      successCallback?.({
        jobId: 'test-job-123',
        filename: 'test.pdf',
        fileSize: 4,
        duration: 1000,
        pdfBytes: arrayLikePdfBytes as unknown as Uint8Array,
      });

      await vi.waitFor(() => {
        const downloadCall = vi.mocked(downloadPDF).mock.calls[0];
        expect(downloadCall).toBeDefined();
        const bytes = downloadCall[0];
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes[0]).toBe(37);
      });
    });

    it('should set success state even without filename', async () => {
      vi.mocked(downloadPDF).mockResolvedValue();

      renderHook(() => useAppSubscriptions());

      const testPdfBytes = new Uint8Array([37, 80, 68, 70]);

      successCallback?.({
        jobId: 'test-job-123',
        fileSize: testPdfBytes.length,
        duration: 1000,
        pdfBytes: testPdfBytes,
      });

      await vi.waitFor(() => {
        expect(downloadPDF).toHaveBeenCalledWith(testPdfBytes, undefined);
      });

      const uiState = usePopupStore.getState();
      expect(uiState.uiState).toBe('success');
    });

    it('should set error state when PDF download fails', async () => {
      const downloadError = new Error('Download permission denied');
      vi.mocked(downloadPDF).mockRejectedValue(downloadError);

      renderHook(() => useAppSubscriptions());

      const testPdfBytes = new Uint8Array([37, 80, 68, 70]);

      successCallback?.({
        jobId: 'test-job-123',
        filename: 'test.pdf',
        fileSize: testPdfBytes.length,
        duration: 1000,
        pdfBytes: testPdfBytes,
      });

      await vi.waitFor(() => {
        const uiState = usePopupStore.getState();
        expect(uiState.uiState).toBe('error');
        expect(uiState.lastError?.code).toBe(ErrorCode.DOWNLOAD_FAILED);
        expect(uiState.lastError?.message).toBe('Failed to download PDF file');
        expect(uiState.lastError?.technicalDetails).toBe('Download permission denied');
        expect(uiState.lastError?.recoverable).toBe(true);
        expect(uiState.lastError?.suggestions).toContain('Try exporting the file again');
      });
    });

    it('should set success state even without PDF bytes (backwards compat)', async () => {
      renderHook(() => useAppSubscriptions());

      successCallback?.({
        jobId: 'test-job-123',
        filename: 'test.pdf',
        fileSize: 0,
        duration: 1000,
        pdfBytes: undefined as unknown as Uint8Array,
      });

      // Should not call downloadPDF
      expect(downloadPDF).not.toHaveBeenCalled();

      // Should still set success state
      const uiState = usePopupStore.getState();
      expect(uiState.uiState).toBe('success');
      expect(uiState.lastFilename).toBe('test.pdf');
    });
  });

  describe('error handling', () => {
    it('should set error state when error message received', () => {
      renderHook(() => useAppSubscriptions());

      const testError = {
        stage: 'generating-pdf' as const,
        code: ErrorCode.PDF_GENERATION_FAILED,
        message: 'PDF generation failed',
        technicalDetails: 'Memory allocation error',
        recoverable: true,
        suggestions: ['Try with a smaller file'],
        timestamp: Date.now(),
        errorId: 'ERR-123',
      };

      errorCallback?.({ jobId: 'test-job-123', error: testError });

      const uiState = usePopupStore.getState();
      expect(uiState.uiState).toBe('error');
      expect(uiState.lastError).toEqual(testError);
    });

    it('should handle multiple error updates', () => {
      renderHook(() => useAppSubscriptions());

      const error1 = {
        stage: 'parsing' as const,
        code: ErrorCode.TSX_PARSE_ERROR,
        message: 'Parse error',
        recoverable: true,
        suggestions: ['Check TSX syntax'],
        timestamp: Date.now(),
        errorId: 'ERR-1',
      };

      const error2 = {
        stage: 'generating-pdf' as const,
        code: ErrorCode.PDF_GENERATION_FAILED,
        message: 'Generation error',
        recoverable: false,
        suggestions: ['Try again'],
        timestamp: Date.now(),
        errorId: 'ERR-2',
      };

      errorCallback?.({ jobId: 'test-job-123', error: error1 });
      expect(usePopupStore.getState().lastError).toEqual(error1);

      errorCallback?.({ jobId: 'test-job-123', error: error2 });
      expect(usePopupStore.getState().lastError).toEqual(error2);
    });
  });

  describe('memory leak prevention', () => {
    it('should not recreate subscriptions on re-render', () => {
      const { rerender } = renderHook(() => useAppSubscriptions());

      expect(extensionAPI.onProgress).toHaveBeenCalledTimes(1);
      expect(extensionAPI.onSuccess).toHaveBeenCalledTimes(1);
      expect(extensionAPI.onError).toHaveBeenCalledTimes(1);

      // Force re-render
      rerender();

      // Subscriptions should not be recreated (empty dependency array)
      expect(extensionAPI.onProgress).toHaveBeenCalledTimes(1);
      expect(extensionAPI.onSuccess).toHaveBeenCalledTimes(1);
      expect(extensionAPI.onError).toHaveBeenCalledTimes(1);
    });
  });
});
