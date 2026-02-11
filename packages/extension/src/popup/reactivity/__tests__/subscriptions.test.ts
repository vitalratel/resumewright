// ABOUTME: Tests for message subscription management and cleanup.
// ABOUTME: Covers progress updates, success/download flow, error handling, and cleanup.

import { createRoot } from 'solid-js';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCode } from '@/shared/errors/codes';
import { downloadPDF } from '@/shared/infrastructure/pdf/downloader';
import type {
  ConversionCompletePayload,
  ConversionErrorPayload,
  ConversionProgressPayload,
} from '@/shared/types/messages';
import type { ConversionProgress } from '@/shared/types/models';
import { onError, onProgress, onSuccess } from '../../services/extensionAPI';
import { popupStore } from '../../store';
import { progressStore } from '../../store/progressStore';
import { createAppSubscriptions } from '../subscriptions';

vi.mock('../../services/extensionAPI', () => ({
  onProgress: vi.fn(),
  onSuccess: vi.fn(),
  onError: vi.fn(),
}));

vi.mock('@/shared/infrastructure/pdf/downloader', () => ({
  downloadPDF: vi.fn(),
}));

describe('createAppSubscriptions', () => {
  let unsubProgress: Mock<() => void>;
  let unsubSuccess: Mock<() => void>;
  let unsubError: Mock<() => void>;
  let progressCallback: ((payload: ConversionProgressPayload) => void) | null;
  let successCallback: ((result: ConversionCompletePayload) => void) | null;
  let errorCallback: ((payload: ConversionErrorPayload) => void) | null;

  beforeEach(() => {
    vi.clearAllMocks();
    popupStore.reset();
    popupStore.setHasHydrated(true);
    progressStore.reset();

    progressCallback = null;
    successCallback = null;
    errorCallback = null;

    unsubProgress = vi.fn<() => void>();
    unsubSuccess = vi.fn<() => void>();
    unsubError = vi.fn<() => void>();

    vi.mocked(onProgress).mockImplementation((cb) => {
      progressCallback = cb;
      return unsubProgress;
    });

    vi.mocked(onSuccess).mockImplementation((cb) => {
      successCallback = cb;
      return unsubSuccess;
    });

    vi.mocked(onError).mockImplementation((cb) => {
      errorCallback = cb;
      return unsubError;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('subscription setup', () => {
    it('should set up all three message subscriptions', () => {
      createRoot((dispose) => {
        createAppSubscriptions();
        dispose();
      });

      expect(onProgress).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(progressCallback).not.toBeNull();
      expect(successCallback).not.toBeNull();
      expect(errorCallback).not.toBeNull();
    });

    it('should clean up all subscriptions on dispose', () => {
      createRoot((dispose) => {
        createAppSubscriptions();
        dispose();
      });

      expect(unsubProgress).toHaveBeenCalledTimes(1);
      expect(unsubSuccess).toHaveBeenCalledTimes(1);
      expect(unsubError).toHaveBeenCalledTimes(1);
    });
  });

  describe('progress updates', () => {
    it('should update progress store when progress message received', () => {
      createRoot((dispose) => {
        createAppSubscriptions();

        const testJobId = 'test-job-123';
        const testProgress: ConversionProgress = {
          stage: 'queued',
          percentage: 50,
          currentOperation: 'Parsing TSX',
        };

        progressCallback?.({ jobId: testJobId, progress: testProgress });

        const progressState = progressStore.state.activeConversions[testJobId];
        expect(progressState).toBeDefined();
        expect(progressState.stage).toBe('queued');
        expect(progressState.percentage).toBe(50);

        dispose();
      });
    });

    it('should handle multiple progress updates for same job', () => {
      createRoot((dispose) => {
        createAppSubscriptions();

        const testJobId = 'test-job-123';

        progressCallback?.({
          jobId: testJobId,
          progress: { stage: 'queued', percentage: 25, currentOperation: 'Parsing' },
        });
        expect(progressStore.state.activeConversions[testJobId]?.percentage).toBe(25);

        progressCallback?.({
          jobId: testJobId,
          progress: { stage: 'rendering', percentage: 50, currentOperation: 'Layout' },
        });
        expect(progressStore.state.activeConversions[testJobId]?.percentage).toBe(50);

        progressCallback?.({
          jobId: testJobId,
          progress: { stage: 'generating-pdf', percentage: 75, currentOperation: 'PDF' },
        });
        expect(progressStore.state.activeConversions[testJobId]?.percentage).toBe(75);

        dispose();
      });
    });

    it('should handle progress updates for different jobs', () => {
      createRoot((dispose) => {
        createAppSubscriptions();

        progressCallback?.({
          jobId: 'job-1',
          progress: { stage: 'queued', percentage: 30, currentOperation: 'Parsing' },
        });
        progressCallback?.({
          jobId: 'job-2',
          progress: { stage: 'generating-pdf', percentage: 70, currentOperation: 'PDF' },
        });

        expect(progressStore.state.activeConversions['job-1']?.percentage).toBe(30);
        expect(progressStore.state.activeConversions['job-2']?.percentage).toBe(70);

        dispose();
      });
    });
  });

  describe('success handling', () => {
    it('should download PDF and set success state when PDF bytes provided', async () => {
      vi.mocked(downloadPDF).mockResolvedValue();

      let dispose!: () => void;
      createRoot((d) => {
        dispose = d;
        createAppSubscriptions();
      });

      const testPdfBytes = new Uint8Array([37, 80, 68, 70]);
      const testFilename = 'test-resume.pdf';

      successCallback?.({
        jobId: 'test-job-123',
        filename: testFilename,
        fileSize: testPdfBytes.length,
        duration: 1000,
        pdfBytes: testPdfBytes,
      });

      await vi.waitFor(() => {
        expect(downloadPDF).toHaveBeenCalledWith(testPdfBytes, testFilename);
      });

      expect(popupStore.state.uiState).toBe('success');
      expect(popupStore.state.lastFilename).toBe(testFilename);

      dispose();
    });

    it('should convert array-like PDF bytes to Uint8Array', async () => {
      vi.mocked(downloadPDF).mockResolvedValue();

      let dispose!: () => void;
      createRoot((d) => {
        dispose = d;
        createAppSubscriptions();
      });

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

      dispose();
    });

    it('should set success state even without filename', async () => {
      vi.mocked(downloadPDF).mockResolvedValue();

      let dispose!: () => void;
      createRoot((d) => {
        dispose = d;
        createAppSubscriptions();
      });

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

      expect(popupStore.state.uiState).toBe('success');

      dispose();
    });

    it('should set error state when PDF download fails', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const downloadError = new Error('Download permission denied');
      vi.mocked(downloadPDF).mockRejectedValue(downloadError);

      let dispose!: () => void;
      createRoot((d) => {
        dispose = d;
        createAppSubscriptions();
      });

      const testPdfBytes = new Uint8Array([37, 80, 68, 70]);

      successCallback?.({
        jobId: 'test-job-123',
        filename: 'test.pdf',
        fileSize: testPdfBytes.length,
        duration: 1000,
        pdfBytes: testPdfBytes,
      });

      await vi.waitFor(() => {
        expect(popupStore.state.uiState).toBe('error');
        expect(popupStore.state.lastError?.code).toBe(ErrorCode.DOWNLOAD_FAILED);
        expect(popupStore.state.lastError?.message).toBe('Failed to download PDF file');
        expect(popupStore.state.lastError?.technicalDetails).toBe('Download permission denied');
        expect(popupStore.state.lastError?.recoverable).toBe(true);
        expect(popupStore.state.lastError?.suggestions).toContain('Try exporting the file again');
      });

      spy.mockRestore();
      dispose();
    });

    it('should set success state even without PDF bytes', async () => {
      let dispose!: () => void;
      createRoot((d) => {
        dispose = d;
        createAppSubscriptions();
      });

      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      successCallback?.({
        jobId: 'test-job-123',
        filename: 'test.pdf',
        fileSize: 0,
        duration: 1000,
        pdfBytes: undefined as unknown as Uint8Array,
      });

      // Give async handler time to run
      await vi.waitFor(() => {
        expect(popupStore.state.uiState).toBe('success');
      });

      expect(downloadPDF).not.toHaveBeenCalled();
      expect(popupStore.state.lastFilename).toBe('test.pdf');

      spy.mockRestore();
      dispose();
    });
  });

  describe('error handling', () => {
    it('should set error state when error message received', () => {
      createRoot((dispose) => {
        createAppSubscriptions();

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

        expect(popupStore.state.uiState).toBe('error');
        expect(popupStore.state.lastError).toEqual(testError);

        dispose();
      });
    });

    it('should handle multiple error updates', () => {
      createRoot((dispose) => {
        createAppSubscriptions();

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
        expect(popupStore.state.lastError).toEqual(error1);

        errorCallback?.({ jobId: 'test-job-123', error: error2 });
        expect(popupStore.state.lastError).toEqual(error2);

        dispose();
      });
    });
  });
});
