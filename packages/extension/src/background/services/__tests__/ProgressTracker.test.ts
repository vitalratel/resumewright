/**
 * Tests for ProgressTracker
 *
 * Tests progress tracking and UI update logic:
 * - Starting and stopping conversion tracking
 * - Progress callback creation and throttling
 * - Retry progress updates
 * - Popup synchronization
 */

import { fakeBrowser } from '@webext-core/fake-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageType } from '../../../shared/types/messages';
import { ProgressTracker } from '../ProgressTracker';

// Mock dependencies
// webextension-polyfill is mocked globally with fakeBrowser

vi.mock('../../../shared/logging', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

vi.mock('../../../shared/utils/progressThrottle', () => ({
  throttleProgress: vi.fn(<T extends (...args: unknown[]) => unknown>(callback: T): T => callback), // Pass through for testing
}));

describe('ProgressTracker', () => {
  let tracker: ProgressTracker;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create spy for fakeBrowser runtime.sendMessage
    vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockResolvedValue(undefined);
    
    tracker = new ProgressTracker();
  });

  describe('startTracking', () => {
    it('should send CONVERSION_STARTED message', async () => {
      const jobId = 'test-job-123';

      await tracker.startTracking(jobId);

      expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith({
        type: MessageType.CONVERSION_STARTED,
        payload: {
          jobId,
          estimatedDuration: 5000,
        },
      });
    });

    it('should initialize active conversion state', async () => {
      const jobId = 'test-job-456';

      await tracker.startTracking(jobId);

      // Verify by synchronizing - should send progress for this job
      await tracker.synchronizeProgress();

      expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MessageType.CONVERSION_PROGRESS,
          payload: expect.objectContaining({
            jobId,
            progress: expect.objectContaining({
              stage: 'queued',
              percentage: 0,
              currentOperation: 'Starting conversion...',
            }),
          }),
        })
      );
    });
  });

  describe('createProgressCallback', () => {
    it('should create callback that sends progress updates', async () => {
      const jobId = 'test-job-789';
      await tracker.startTracking(jobId);

      const progressCallback = tracker.createProgressCallback(jobId);
      progressCallback('parsing', 25);

      expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MessageType.CONVERSION_PROGRESS,
          payload: {
            jobId,
            progress: {
              stage: 'parsing',
              percentage: 25,
              currentOperation: 'Parsing TSX code...',
            },
          },
        })
      );
    });

    it('should update active conversion state', async () => {
      const jobId = 'test-job-101';
      await tracker.startTracking(jobId);
      vi.clearAllMocks();

      const progressCallback = tracker.createProgressCallback(jobId);
      progressCallback('rendering', 50);

      // Synchronize to verify state was updated
      await tracker.synchronizeProgress();

      expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            progress: expect.objectContaining({
              stage: 'rendering',
              percentage: 50,
            }),
          }),
        })
      );
    });

    it('should handle unknown stage gracefully', async () => {
      const jobId = 'test-job-202';
      await tracker.startTracking(jobId);

      const progressCallback = tracker.createProgressCallback(jobId);
      progressCallback('unknown-stage', 75);

      expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            progress: expect.objectContaining({
              currentOperation: 'Processing (unknown-stage)...',
            }),
          }),
        })
      );
    });

    it('should handle message send failures gracefully', async () => {
      const jobId = 'test-job-303';
      await tracker.startTracking(jobId);

      vi.mocked(fakeBrowser.runtime.sendMessage).mockRejectedValue(new Error('Send failed'));

      const progressCallback = tracker.createProgressCallback(jobId);
      
      // Should not throw
      expect(() => progressCallback('parsing', 30)).not.toThrow();
    });
  });

  describe('sendRetryProgress', () => {
    it('should send retry progress update', async () => {
      const jobId = 'test-job-404';
      await tracker.startTracking(jobId);
      vi.clearAllMocks();

      const error = new Error('Conversion failed temporarily');
      tracker.sendRetryProgress(jobId, 2, 3, 2000, error);

      expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith({
        type: MessageType.CONVERSION_PROGRESS,
        payload: {
          jobId,
          progress: {
            stage: 'queued',
            percentage: 0,
            currentOperation: 'Conversion attempt 2/3... retrying in 2.0s',
            retryAttempt: 2,
            lastError: 'Conversion failed temporarily',
          },
        },
      });
    });

    it('should update active conversion state with retry info', async () => {
      const jobId = 'test-job-505';
      await tracker.startTracking(jobId);

      const error = new Error('Network timeout');
      tracker.sendRetryProgress(jobId, 1, 3, 1000, error);

      // Verify state was updated by synchronizing
      vi.clearAllMocks();
      await tracker.synchronizeProgress();

      expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            progress: expect.objectContaining({
              retryAttempt: 1,
              lastError: 'Network timeout',
            }),
          }),
        })
      );
    });

    it('should handle message send failures gracefully', async () => {
      const jobId = 'test-job-606';
      await tracker.startTracking(jobId);

      vi.mocked(fakeBrowser.runtime.sendMessage).mockRejectedValue(new Error('Send failed'));

      const error = new Error('Test error');
      
      // Should not throw
      expect(() => tracker.sendRetryProgress(jobId, 1, 3, 1000, error)).not.toThrow();
    });
  });

  describe('synchronizeProgress', () => {
    it('should send progress for all active conversions', async () => {
      const jobId1 = 'job-1';
      const jobId2 = 'job-2';

      await tracker.startTracking(jobId1);
      await tracker.startTracking(jobId2);

      vi.clearAllMocks();
      await tracker.synchronizeProgress();

      // Should send progress for both jobs
      expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledTimes(2);
      expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ jobId: jobId1 }),
        })
      );
      expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ jobId: jobId2 }),
        })
      );
    });

    it('should not send messages when no active conversions', async () => {
      await tracker.synchronizeProgress();

      expect(fakeBrowser.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('should send latest progress state', async () => {
      const jobId = 'job-sync-test';
      await tracker.startTracking(jobId);

      const progressCallback = tracker.createProgressCallback(jobId);
      progressCallback('layout', 80);

      vi.clearAllMocks();
      await tracker.synchronizeProgress();

      expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            progress: expect.objectContaining({
              stage: 'layout',
              percentage: 80,
            }),
          }),
        })
      );
    });
  });

  describe('stopTracking', () => {
    it('should remove job from active conversions', async () => {
      const jobId = 'test-job-cleanup';
      await tracker.startTracking(jobId);

      tracker.stopTracking(jobId);

      // Verify by synchronizing - should not send progress for this job
      vi.clearAllMocks();
      await tracker.synchronizeProgress();

      expect(fakeBrowser.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('should be idempotent', () => {
      const jobId = 'test-job-idempotent';

      // Should not throw when stopping non-existent job
      expect(() => tracker.stopTracking(jobId)).not.toThrow();
      expect(() => tracker.stopTracking(jobId)).not.toThrow();
    });
  });

  describe('getOperationDescription', () => {
    it('should map known stages to descriptions', async () => {
      const jobId = 'test-stages';
      await tracker.startTracking(jobId);
      const progressCallback = tracker.createProgressCallback(jobId);

      const stages = [
        { stage: 'queued', expected: 'Preparing conversion...' },
        { stage: 'parsing', expected: 'Parsing TSX code...' },
        { stage: 'rendering', expected: 'Rendering React components...' },
        { stage: 'layout', expected: 'Calculating layout...' },
        { stage: 'pdf-generation', expected: 'Generating PDF...' },
        { stage: 'complete', expected: 'Complete!' },
      ];

      for (const { stage, expected } of stages) {
        vi.clearAllMocks();
        progressCallback(stage, 50);

        expect(fakeBrowser.runtime.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              progress: expect.objectContaining({
                currentOperation: expected,
              }),
            }),
          })
        );
      }
    });
  });
});
