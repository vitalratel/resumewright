/**
 * ABOUTME: Tests for the progress store that tracks conversion progress and ETA.
 * ABOUTME: Covers actions, selectors, ETA calculations, and multi-job tracking.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConversionProgress } from '../../../shared/types/models';
import { createProgressStore } from '../progressStore';

describe('progressStore', () => {
  let store: ReturnType<typeof createProgressStore>;

  beforeEach(() => {
    vi.useFakeTimers();
    store = createProgressStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should have empty objects for initial state', () => {
      expect(Object.keys(store.state.activeConversions).length).toBe(0);
      expect(Object.keys(store.state.startTimes).length).toBe(0);
      expect(Object.keys(store.state.progressHistories).length).toBe(0);
    });
  });

  describe('startConversion', () => {
    it('should initialize conversion tracking', () => {
      const jobId = 'test-job-1';
      store.startConversion(jobId);

      expect(jobId in store.state.activeConversions).toBe(true);
      expect(jobId in store.state.startTimes).toBe(true);
      expect(jobId in store.state.progressHistories).toBe(true);
    });

    it('should set initial progress to queued with 0%', () => {
      const jobId = 'test-job-1';
      store.startConversion(jobId);

      const progress = store.getProgress(jobId);
      expect(progress).toBeDefined();
      expect(progress?.stage).toBe('queued');
      expect(progress?.percentage).toBe(0);
      expect(progress?.currentOperation).toBe('Starting conversion...');
    });

    it('should record start time', () => {
      const beforeTime = Date.now();
      const jobId = 'test-job-1';

      store.startConversion(jobId);

      const afterTime = Date.now();
      const startTime = store.state.startTimes[jobId];

      expect(startTime).toBeDefined();
      expect(startTime).toBeGreaterThanOrEqual(beforeTime);
      expect(startTime).toBeLessThanOrEqual(afterTime);
    });

    it('should initialize progress history with [0]', () => {
      const jobId = 'test-job-1';
      store.startConversion(jobId);

      const history = store.state.progressHistories[jobId];
      expect(history).toEqual([0]);
    });

    it('should handle multiple conversions', () => {
      store.startConversion('job-1');
      store.startConversion('job-2');
      store.startConversion('job-3');

      expect(Object.keys(store.state.activeConversions).length).toBe(3);
      expect(Object.keys(store.state.startTimes).length).toBe(3);
      expect(Object.keys(store.state.progressHistories).length).toBe(3);
    });

    it('should override existing conversion with same jobId', () => {
      const jobId = 'test-job';

      store.startConversion(jobId);
      store.updateProgress(jobId, {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering...',
      });

      // Start again with same jobId
      store.startConversion(jobId);

      const progress = store.getProgress(jobId);
      expect(progress?.percentage).toBe(0);
      expect(progress?.stage).toBe('queued');
    });
  });

  describe('updateProgress', () => {
    beforeEach(() => {
      store.startConversion('test-job');
    });

    it('should update progress', () => {
      const newProgress: ConversionProgress = {
        stage: 'rendering',
        percentage: 35,
        currentOperation: 'Rendering components...',
      };

      store.updateProgress('test-job', newProgress);

      const progress = store.getProgress('test-job');
      expect(progress?.stage).toBe('rendering');
      expect(progress?.percentage).toBe(35);
      expect(progress?.currentOperation).toBe('Rendering components...');
    });

    it('should calculate and set ETA', () => {
      vi.advanceTimersByTime(4000);

      const newProgress: ConversionProgress = {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering...',
      };

      store.updateProgress('test-job', newProgress);

      const progress = store.getProgress('test-job');
      expect(progress?.estimatedTimeRemaining).toBeDefined();
      // At 50% progress after 4s, projected total is 8s, remaining: 4s
      expect(progress?.estimatedTimeRemaining).toBe(4);
    });

    it('should not set ETA for 0% progress', () => {
      const newProgress: ConversionProgress = {
        stage: 'queued',
        percentage: 0,
        currentOperation: 'Queued...',
      };

      store.updateProgress('test-job', newProgress);

      const progress = store.getProgress('test-job');
      expect(progress?.estimatedTimeRemaining).toBeUndefined();
    });

    it('should not set ETA for 100% progress', () => {
      const newProgress: ConversionProgress = {
        stage: 'completed',
        percentage: 100,
        currentOperation: 'Done',
      };

      store.updateProgress('test-job', newProgress);

      const progress = store.getProgress('test-job');
      expect(progress?.estimatedTimeRemaining).toBeUndefined();
    });

    it('should update progress history', () => {
      store.updateProgress('test-job', {
        stage: 'rendering',
        percentage: 25,
        currentOperation: 'Rendering...',
      });

      store.updateProgress('test-job', {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering...',
      });

      const history = store.state.progressHistories['test-job'];
      expect(history).toContain(25);
      expect(history).toContain(50);
    });

    it('should limit history to last 5 entries', () => {
      for (let i = 1; i <= 10; i++) {
        store.updateProgress('test-job', {
          stage: 'rendering',
          percentage: i * 10,
          currentOperation: `Progress ${i * 10}%`,
        });
      }

      const history = store.state.progressHistories['test-job'];
      expect(history?.length).toBe(5);
      expect(history).toEqual([60, 70, 80, 90, 100]);
    });

    it('should handle progress going backwards', () => {
      store.updateProgress('test-job', {
        stage: 'rendering',
        percentage: 75,
        currentOperation: 'Rendering...',
      });

      store.updateProgress('test-job', {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Re-rendering...',
      });

      const progress = store.getProgress('test-job');
      expect(progress?.percentage).toBe(50);
    });

    it('should handle updates for non-existent jobId gracefully', () => {
      store.updateProgress('non-existent', {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Test',
      });

      const progress = store.getProgress('non-existent');
      expect(progress).toBeDefined();
      expect(progress?.percentage).toBe(50);
    });
  });

  describe('completeConversion', () => {
    beforeEach(() => {
      store.startConversion('test-job');
      store.updateProgress('test-job', {
        stage: 'rendering',
        percentage: 75,
        currentOperation: 'Almost done...',
      });
    });

    it('should mark conversion as completed', () => {
      store.completeConversion('test-job');

      const progress = store.getProgress('test-job');
      expect(progress?.stage).toBe('completed');
      expect(progress?.percentage).toBe(100);
      expect(progress?.currentOperation).toBe('Conversion complete');
    });

    it('should clear ETA', () => {
      store.completeConversion('test-job');

      const progress = store.getProgress('test-job');
      expect(progress?.estimatedTimeRemaining).toBeUndefined();
    });

    it('should preserve existing progress data', () => {
      const beforeProgress = store.getProgress('test-job');
      const originalStage = beforeProgress?.stage;

      store.completeConversion('test-job');

      const progress = store.getProgress('test-job');
      expect(progress).toBeDefined();
      expect(progress?.stage).not.toBe(originalStage);
      expect(progress?.stage).toBe('completed');
    });

    it('should handle completing non-existent jobId gracefully', () => {
      store.completeConversion('non-existent');

      const progress = store.getProgress('non-existent');
      expect(progress).toBeUndefined();
    });
  });

  describe('clearConversion', () => {
    beforeEach(() => {
      store.startConversion('test-job');
      store.updateProgress('test-job', {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering...',
      });
    });

    it('should remove conversion from all objects', () => {
      store.clearConversion('test-job');

      expect('test-job' in store.state.activeConversions).toBe(false);
      expect('test-job' in store.state.startTimes).toBe(false);
      expect('test-job' in store.state.progressHistories).toBe(false);
    });

    it('should handle clearing non-existent jobId gracefully', () => {
      store.clearConversion('non-existent');

      expect('non-existent' in store.state.activeConversions).toBe(false);
    });

    it('should not affect other conversions', () => {
      store.startConversion('job-1');
      store.startConversion('job-2');

      store.clearConversion('job-1');

      expect('job-1' in store.state.activeConversions).toBe(false);
      expect('job-2' in store.state.activeConversions).toBe(true);
    });
  });

  describe('getProgress selector', () => {
    beforeEach(() => {
      store.startConversion('test-job');
    });

    it('should return progress for existing jobId', () => {
      const progress = store.getProgress('test-job');

      expect(progress).toBeDefined();
      expect(progress?.stage).toBe('queued');
      expect(progress?.percentage).toBe(0);
    });

    it('should return undefined for non-existent jobId', () => {
      const progress = store.getProgress('non-existent');
      expect(progress).toBeUndefined();
    });

    it('should return updated progress', () => {
      store.updateProgress('test-job', {
        stage: 'rendering',
        percentage: 60,
        currentOperation: 'Rendering...',
      });

      const progress = store.getProgress('test-job');
      expect(progress?.percentage).toBe(60);
    });
  });

  describe('getETA selector', () => {
    beforeEach(() => {
      store.startConversion('test-job');
    });

    it('should return ETA for job with progress', () => {
      store.startConversion('test-job');

      vi.advanceTimersByTime(4000);

      store.updateProgress('test-job', {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering...',
      });

      const eta = store.getETA('test-job');
      expect(eta).toBeDefined();
      expect(eta).toBe(4);
    });

    it('should return undefined for non-existent jobId', () => {
      const eta = store.getETA('non-existent');
      expect(eta).toBeUndefined();
    });

    it('should return undefined for 0% progress', () => {
      const eta = store.getETA('test-job');
      expect(eta).toBeUndefined();
    });

    it('should return undefined for completed job', () => {
      store.completeConversion('test-job');

      const eta = store.getETA('test-job');
      expect(eta).toBeUndefined();
    });
  });

  describe('getActiveJobIds', () => {
    it('should return empty array when no jobs', () => {
      expect(store.getActiveJobIds()).toEqual([]);
    });

    it('should return all active job IDs', () => {
      store.startConversion('job-1');
      store.startConversion('job-2');

      const ids = store.getActiveJobIds();
      expect(ids).toContain('job-1');
      expect(ids).toContain('job-2');
      expect(ids.length).toBe(2);
    });
  });

  describe('Multiple Concurrent Conversions', () => {
    it('should track multiple conversions independently', () => {
      store.startConversion('job-1');
      store.startConversion('job-2');
      store.startConversion('job-3');

      store.updateProgress('job-1', {
        stage: 'rendering',
        percentage: 25,
        currentOperation: 'Job 1 rendering...',
      });

      store.updateProgress('job-2', {
        stage: 'generating-pdf',
        percentage: 75,
        currentOperation: 'Job 2 generating...',
      });

      const progress1 = store.getProgress('job-1');
      const progress2 = store.getProgress('job-2');
      const progress3 = store.getProgress('job-3');

      expect(progress1?.percentage).toBe(25);
      expect(progress2?.percentage).toBe(75);
      expect(progress3?.percentage).toBe(0);
    });

    it('should complete conversions independently', () => {
      store.startConversion('job-1');
      store.startConversion('job-2');

      store.completeConversion('job-1');

      const progress1 = store.getProgress('job-1');
      const progress2 = store.getProgress('job-2');

      expect(progress1?.stage).toBe('completed');
      expect(progress2?.stage).toBe('queued');
    });

    it('should clear conversions independently', () => {
      store.startConversion('job-1');
      store.startConversion('job-2');

      store.clearConversion('job-1');

      expect(store.getProgress('job-1')).toBeUndefined();
      expect(store.getProgress('job-2')).toBeDefined();
    });
  });

  describe('Progress Workflow', () => {
    it('should handle typical conversion workflow', () => {
      const jobId = 'workflow-test';

      store.startConversion(jobId);
      expect(store.getProgress(jobId)?.percentage).toBe(0);

      store.updateProgress(jobId, {
        stage: 'parsing',
        percentage: 20,
        currentOperation: 'Parsing TSX...',
      });
      expect(store.getProgress(jobId)?.stage).toBe('parsing');

      store.updateProgress(jobId, {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering components...',
      });
      expect(store.getProgress(jobId)?.percentage).toBe(50);

      store.updateProgress(jobId, {
        stage: 'laying-out',
        percentage: 75,
        currentOperation: 'Calculating layout...',
      });
      expect(store.getProgress(jobId)?.stage).toBe('laying-out');

      store.completeConversion(jobId);
      expect(store.getProgress(jobId)?.percentage).toBe(100);

      store.clearConversion(jobId);
      expect(store.getProgress(jobId)).toBeUndefined();
    });

    it('should handle cancelled workflow', () => {
      const jobId = 'cancel-test';

      store.startConversion(jobId);
      store.updateProgress(jobId, {
        stage: 'rendering',
        percentage: 45,
        currentOperation: 'Rendering...',
      });

      store.clearConversion(jobId);

      expect(store.getProgress(jobId)).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      store.startConversion('job-1');
      store.startConversion('job-2');

      store.reset();

      expect(Object.keys(store.state.activeConversions).length).toBe(0);
      expect(Object.keys(store.state.startTimes).length).toBe(0);
      expect(Object.keys(store.state.progressHistories).length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle percentage over 100', () => {
      store.startConversion('test-job');
      store.updateProgress('test-job', {
        stage: 'rendering',
        percentage: 150,
        currentOperation: 'Over 100%',
      });

      const progress = store.getProgress('test-job');
      expect(progress?.percentage).toBe(150);
    });

    it('should handle negative percentage', () => {
      store.startConversion('test-job');
      store.updateProgress('test-job', {
        stage: 'rendering',
        percentage: -10,
        currentOperation: 'Negative',
      });

      const progress = store.getProgress('test-job');
      expect(progress?.percentage).toBe(-10);
    });

    it('should handle very long operation names', () => {
      const longOperation = 'x'.repeat(1000);
      store.startConversion('test-job');
      store.updateProgress('test-job', {
        stage: 'rendering',
        percentage: 50,
        currentOperation: longOperation,
      });

      const progress = store.getProgress('test-job');
      expect(progress?.currentOperation).toBe(longOperation);
    });

    it('should handle empty jobId', () => {
      store.startConversion('');
      const progress = store.getProgress('');

      expect(progress).toBeDefined();
    });

    it('should handle special characters in jobId', () => {
      const specialJobId = 'job-#@!$%^&*()';
      store.startConversion(specialJobId);

      const progress = store.getProgress(specialJobId);
      expect(progress).toBeDefined();
    });
  });
});
