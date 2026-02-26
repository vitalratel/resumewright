// ABOUTME: Tests for createProgressTracker factory function.
// ABOUTME: Verifies progress tracking, throttling, and retry updates.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgressTracker, type IProgressTracker } from '../ProgressTracker';

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

describe('createProgressTracker', () => {
  let tracker: IProgressTracker;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendMessage.mockReset();
    mocks.sendMessage.mockResolvedValue(undefined);

    tracker = createProgressTracker();
  });

  describe('startTracking', () => {
    it('should enable subsequent progress callbacks', () => {
      const jobId = 'test-job-456';
      tracker.startTracking(jobId);

      const progressCallback = tracker.createProgressCallback(jobId);
      progressCallback('parsing', 10);

      expect(mocks.sendMessage).toHaveBeenCalledWith(
        'conversionProgress',
        expect.objectContaining({ jobId }),
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

    it('should handle message send failures gracefully', () => {
      const jobId = 'test-job-606';
      tracker.startTracking(jobId);

      mocks.sendMessage.mockRejectedValue(new Error('Send failed'));

      const error = new Error('Test error');

      // Should not throw
      expect(() => tracker.sendRetryProgress(jobId, 1, 3, 1000, error)).not.toThrow();
    });
  });

  describe('stopTracking', () => {
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
