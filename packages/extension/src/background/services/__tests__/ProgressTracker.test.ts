// ABOUTME: Tests for ProgressTracker service.
// ABOUTME: Verifies progress tracking, throttling, retry updates, and popup synchronization.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgressTracker } from '../ProgressTracker';

// Mock sendMessage from @/shared/messaging using vi.hoisted for proper hoisting
const mocks = vi.hoisted(() => ({
  sendMessage: vi.fn(),
}));

vi.mock('@/shared/messaging', () => ({
  sendMessage: mocks.sendMessage,
  onMessage: vi.fn(() => vi.fn()),
}));

vi.mock('@/shared/infrastructure/logging', () => ({
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
    mocks.sendMessage.mockReset();
    mocks.sendMessage.mockResolvedValue(undefined);

    tracker = new ProgressTracker();
  });

  describe('startTracking', () => {
    it('should initialize active conversion state', async () => {
      const jobId = 'test-job-456';

      tracker.startTracking(jobId);

      // Verify by synchronizing - should send progress for this job
      await tracker.synchronizeProgress();

      expect(mocks.sendMessage).toHaveBeenCalledWith(
        'conversionProgress',
        expect.objectContaining({
          jobId,
          progress: expect.objectContaining({
            stage: 'queued',
            percentage: 0,
            currentOperation: 'Starting conversion...',
          }),
        }),
      );
    });
  });

  describe('createProgressCallback', () => {
    it('should create callback that sends progress updates', () => {
      const jobId = 'test-job-789';
      tracker.startTracking(jobId);

      const progressCallback = tracker.createProgressCallback(jobId);
      progressCallback('parsing', 25);

      expect(mocks.sendMessage).toHaveBeenCalledWith('conversionProgress', {
        jobId,
        progress: {
          stage: 'parsing',
          percentage: 25,
          currentOperation: 'Parsing TSX code...',
        },
      });
    });

    it('should update active conversion state', async () => {
      const jobId = 'test-job-101';
      tracker.startTracking(jobId);

      const progressCallback = tracker.createProgressCallback(jobId);
      progressCallback('rendering', 50);

      // Synchronize to verify state was updated
      mocks.sendMessage.mockClear();
      await tracker.synchronizeProgress();

      expect(mocks.sendMessage).toHaveBeenCalledWith(
        'conversionProgress',
        expect.objectContaining({
          progress: expect.objectContaining({
            stage: 'rendering',
            percentage: 50,
          }),
        }),
      );
    });

    it('should handle unknown stage gracefully', () => {
      const jobId = 'test-job-202';
      tracker.startTracking(jobId);

      const progressCallback = tracker.createProgressCallback(jobId);
      progressCallback('unknown-stage', 75);

      expect(mocks.sendMessage).toHaveBeenCalledWith(
        'conversionProgress',
        expect.objectContaining({
          progress: expect.objectContaining({
            currentOperation: 'Processing (unknown-stage)...',
          }),
        }),
      );
    });

    it('should handle message send failures gracefully', () => {
      const jobId = 'test-job-303';
      tracker.startTracking(jobId);

      mocks.sendMessage.mockRejectedValue(new Error('Send failed'));

      const progressCallback = tracker.createProgressCallback(jobId);

      // Should not throw
      expect(() => progressCallback('parsing', 30)).not.toThrow();
    });
  });

  describe('sendRetryProgress', () => {
    it('should send retry progress update', () => {
      const jobId = 'test-job-404';
      tracker.startTracking(jobId);
      mocks.sendMessage.mockClear();

      const error = new Error('Conversion failed temporarily');
      tracker.sendRetryProgress(jobId, 2, 3, 2000, error);

      expect(mocks.sendMessage).toHaveBeenCalledWith('conversionProgress', {
        jobId,
        progress: {
          stage: 'queued',
          percentage: 0,
          currentOperation: 'Conversion attempt 2/3... retrying in 2.0s',
          retryAttempt: 2,
          lastError: 'Conversion failed temporarily',
        },
      });
    });

    it('should update active conversion state with retry info', async () => {
      const jobId = 'test-job-505';
      tracker.startTracking(jobId);

      const error = new Error('Network timeout');
      tracker.sendRetryProgress(jobId, 1, 3, 1000, error);

      // Verify state was updated by synchronizing
      mocks.sendMessage.mockClear();
      await tracker.synchronizeProgress();

      expect(mocks.sendMessage).toHaveBeenCalledWith(
        'conversionProgress',
        expect.objectContaining({
          progress: expect.objectContaining({
            retryAttempt: 1,
            lastError: 'Network timeout',
          }),
        }),
      );
    });

    it('should handle message send failures gracefully', () => {
      const jobId = 'test-job-606';
      tracker.startTracking(jobId);

      mocks.sendMessage.mockRejectedValue(new Error('Send failed'));

      const error = new Error('Test error');

      // Should not throw
      expect(() => tracker.sendRetryProgress(jobId, 1, 3, 1000, error)).not.toThrow();
    });
  });

  describe('synchronizeProgress', () => {
    it('should send progress for all active conversions', async () => {
      const jobId1 = 'job-1';
      const jobId2 = 'job-2';

      tracker.startTracking(jobId1);
      tracker.startTracking(jobId2);

      mocks.sendMessage.mockClear();
      await tracker.synchronizeProgress();

      // Should send progress for both jobs
      expect(mocks.sendMessage).toHaveBeenCalledTimes(2);
      expect(mocks.sendMessage).toHaveBeenCalledWith(
        'conversionProgress',
        expect.objectContaining({ jobId: jobId1 }),
      );
      expect(mocks.sendMessage).toHaveBeenCalledWith(
        'conversionProgress',
        expect.objectContaining({ jobId: jobId2 }),
      );
    });

    it('should not send messages when no active conversions', async () => {
      await tracker.synchronizeProgress();

      expect(mocks.sendMessage).not.toHaveBeenCalled();
    });

    it('should send latest progress state', async () => {
      const jobId = 'job-sync-test';
      tracker.startTracking(jobId);

      const progressCallback = tracker.createProgressCallback(jobId);
      progressCallback('layout', 80);

      mocks.sendMessage.mockClear();
      await tracker.synchronizeProgress();

      expect(mocks.sendMessage).toHaveBeenCalledWith(
        'conversionProgress',
        expect.objectContaining({
          progress: expect.objectContaining({
            stage: 'layout',
            percentage: 80,
          }),
        }),
      );
    });
  });

  describe('stopTracking', () => {
    it('should remove job from active conversions', async () => {
      const jobId = 'test-job-cleanup';
      tracker.startTracking(jobId);

      tracker.stopTracking(jobId);

      // Verify by synchronizing - should not send progress for this job
      mocks.sendMessage.mockClear();
      await tracker.synchronizeProgress();

      expect(mocks.sendMessage).not.toHaveBeenCalled();
    });

    it('should be idempotent', () => {
      const jobId = 'test-job-idempotent';

      // Should not throw when stopping non-existent job
      expect(() => tracker.stopTracking(jobId)).not.toThrow();
      expect(() => tracker.stopTracking(jobId)).not.toThrow();
    });
  });

  describe('getOperationDescription', () => {
    it('should map known stages to descriptions', () => {
      const jobId = 'test-stages';
      tracker.startTracking(jobId);
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
        mocks.sendMessage.mockClear();
        progressCallback(stage, 50);

        expect(mocks.sendMessage).toHaveBeenCalledWith(
          'conversionProgress',
          expect.objectContaining({
            progress: expect.objectContaining({
              currentOperation: expected,
            }),
          }),
        );
      }
    });
  });
});
