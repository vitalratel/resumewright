/**
 * Progress Store Tests
 * Zustand Store Test Coverage
 *
 * Tests progressStore.ts actions, selectors, and ETA calculations
 * Covers:
 * - Progress tracking for multiple conversions
 * - ETA calculation logic
 * - Progress history management
 * - Selector functions
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConversionProgress } from '../../../shared/types/models';
import { useProgressStore } from '../progressStore';

// Don't mock calculateETA - use the real implementation for ETA tests

describe('progressStore', () => {
  beforeEach(() => {
    // Use fake timers for ETA tests
    vi.useFakeTimers();

    // Clear all conversions before each test
    const state = useProgressStore.getState();
    Object.keys(state.activeConversions).forEach((jobId) => {
      state.clearConversion(jobId);
    });
  });

  afterEach(() => {
    // Restore real timers
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should have empty objects for initial state', () => {
      const state = useProgressStore.getState();

      expect(Object.keys(state.activeConversions).length).toBe(0);
      expect(Object.keys(state.startTimes).length).toBe(0);
      expect(Object.keys(state.progressHistories).length).toBe(0);
    });
  });

  describe('startConversion', () => {
    it('should initialize conversion tracking', () => {
      const jobId = 'test-job-1';
      useProgressStore.getState().startConversion(jobId);

      const state = useProgressStore.getState();
      expect(jobId in state.activeConversions).toBe(true);
      expect(jobId in state.startTimes).toBe(true);
      expect(jobId in state.progressHistories).toBe(true);
    });

    it('should set initial progress to queued with 0%', () => {
      const jobId = 'test-job-1';
      useProgressStore.getState().startConversion(jobId);

      const progress = useProgressStore.getState().getProgress(jobId);
      expect(progress).toBeDefined();
      expect(progress?.stage).toBe('queued');
      expect(progress?.percentage).toBe(0);
      expect(progress?.currentOperation).toBe('Starting conversion...');
    });

    it('should record start time', () => {
      const beforeTime = Date.now();
      const jobId = 'test-job-1';

      useProgressStore.getState().startConversion(jobId);

      const afterTime = Date.now();
      const startTime = useProgressStore.getState().startTimes[jobId];

      expect(startTime).toBeDefined();
      expect(startTime).toBeGreaterThanOrEqual(beforeTime);
      expect(startTime).toBeLessThanOrEqual(afterTime);
    });

    it('should initialize progress history with [0]', () => {
      const jobId = 'test-job-1';
      useProgressStore.getState().startConversion(jobId);

      const history = useProgressStore.getState().progressHistories[jobId];
      expect(history).toEqual([0]);
    });

    it('should handle multiple conversions', () => {
      useProgressStore.getState().startConversion('job-1');
      useProgressStore.getState().startConversion('job-2');
      useProgressStore.getState().startConversion('job-3');

      const state = useProgressStore.getState();
      expect(Object.keys(state.activeConversions).length).toBe(3);
      expect(Object.keys(state.startTimes).length).toBe(3);
      expect(Object.keys(state.progressHistories).length).toBe(3);
    });

    it('should override existing conversion with same jobId', () => {
      const jobId = 'test-job';

      useProgressStore.getState().startConversion(jobId);
      useProgressStore.getState().updateProgress(jobId, {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering...',
      });

      // Start again with same jobId
      useProgressStore.getState().startConversion(jobId);

      const progress = useProgressStore.getState().getProgress(jobId);
      expect(progress?.percentage).toBe(0); // Reset to 0
      expect(progress?.stage).toBe('queued');
    });
  });

  describe('updateProgress', () => {
    beforeEach(() => {
      useProgressStore.getState().startConversion('test-job');
    });

    it('should update progress', () => {
      const newProgress: ConversionProgress = {
        stage: 'rendering',
        percentage: 35,
        currentOperation: 'Rendering components...',
      };

      useProgressStore.getState().updateProgress('test-job', newProgress);

      const progress = useProgressStore.getState().getProgress('test-job');
      expect(progress?.stage).toBe('rendering');
      expect(progress?.percentage).toBe(35);
      expect(progress?.currentOperation).toBe('Rendering components...');
    });

    it('should calculate and set ETA', () => {
      // Advance time by 4 seconds (enough for ETA calculation threshold)
      // Note: startConversion already called in beforeEach
      vi.advanceTimersByTime(4000);

      const newProgress: ConversionProgress = {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering...',
      };

      useProgressStore.getState().updateProgress('test-job', newProgress);

      const progress = useProgressStore.getState().getProgress('test-job');
      expect(progress?.estimatedTimeRemaining).toBeDefined();
      // At 50% progress after 4s, projected total is 8s
      // Remaining: 4s
      expect(progress?.estimatedTimeRemaining).toBe(4);
    });

    it('should not set ETA for 0% progress', () => {
      const newProgress: ConversionProgress = {
        stage: 'queued',
        percentage: 0,
        currentOperation: 'Queued...',
      };

      useProgressStore.getState().updateProgress('test-job', newProgress);

      const progress = useProgressStore.getState().getProgress('test-job');
      expect(progress?.estimatedTimeRemaining).toBeUndefined();
    });

    it('should not set ETA for 100% progress', () => {
      const newProgress: ConversionProgress = {
        stage: 'completed',
        percentage: 100,
        currentOperation: 'Done',
      };

      useProgressStore.getState().updateProgress('test-job', newProgress);

      const progress = useProgressStore.getState().getProgress('test-job');
      expect(progress?.estimatedTimeRemaining).toBeUndefined();
    });

    it('should update progress history', () => {
      useProgressStore.getState().updateProgress('test-job', {
        stage: 'rendering',
        percentage: 25,
        currentOperation: 'Rendering...',
      });

      useProgressStore.getState().updateProgress('test-job', {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering...',
      });

      const history = useProgressStore.getState().progressHistories['test-job'];
      expect(history).toContain(25);
      expect(history).toContain(50);
    });

    it('should limit history to last 5 entries', () => {
      for (let i = 1; i <= 10; i++) {
        useProgressStore.getState().updateProgress('test-job', {
          stage: 'rendering',
          percentage: i * 10,
          currentOperation: `Progress ${i * 10}%`,
        });
      }

      const history = useProgressStore.getState().progressHistories['test-job'];
      expect(history?.length).toBe(5);
      expect(history).toEqual([60, 70, 80, 90, 100]);
    });

    it('should handle progress going backwards', () => {
      useProgressStore.getState().updateProgress('test-job', {
        stage: 'rendering',
        percentage: 75,
        currentOperation: 'Rendering...',
      });

      useProgressStore.getState().updateProgress('test-job', {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Re-rendering...',
      });

      const progress = useProgressStore.getState().getProgress('test-job');
      expect(progress?.percentage).toBe(50);
    });

    it('should handle updates for non-existent jobId gracefully', () => {
      useProgressStore.getState().updateProgress('non-existent', {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Test',
      });

      const progress = useProgressStore.getState().getProgress('non-existent');
      expect(progress).toBeDefined();
      expect(progress?.percentage).toBe(50);
    });
  });

  describe('completeConversion', () => {
    beforeEach(() => {
      useProgressStore.getState().startConversion('test-job');
      useProgressStore.getState().updateProgress('test-job', {
        stage: 'rendering',
        percentage: 75,
        currentOperation: 'Almost done...',
      });
    });

    it('should mark conversion as completed', () => {
      useProgressStore.getState().completeConversion('test-job');

      const progress = useProgressStore.getState().getProgress('test-job');
      expect(progress?.stage).toBe('completed');
      expect(progress?.percentage).toBe(100);
      expect(progress?.currentOperation).toBe('Conversion complete');
    });

    it('should clear ETA', () => {
      useProgressStore.getState().completeConversion('test-job');

      const progress = useProgressStore.getState().getProgress('test-job');
      expect(progress?.estimatedTimeRemaining).toBeUndefined();
    });

    it('should preserve existing progress data', () => {
      const beforeProgress = useProgressStore.getState().getProgress('test-job');
      const originalStage = beforeProgress?.stage;

      useProgressStore.getState().completeConversion('test-job');

      // Stage should be overridden, but conversion should still exist
      const progress = useProgressStore.getState().getProgress('test-job');
      expect(progress).toBeDefined();
      expect(progress?.stage).not.toBe(originalStage);
      expect(progress?.stage).toBe('completed');
    });

    it('should handle completing non-existent jobId gracefully', () => {
      useProgressStore.getState().completeConversion('non-existent');

      const progress = useProgressStore.getState().getProgress('non-existent');
      expect(progress).toBeUndefined();
    });
  });

  describe('clearConversion', () => {
    beforeEach(() => {
      useProgressStore.getState().startConversion('test-job');
      useProgressStore.getState().updateProgress('test-job', {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering...',
      });
    });

    it('should remove conversion from all objects', () => {
      useProgressStore.getState().clearConversion('test-job');

      const state = useProgressStore.getState();
      expect('test-job' in state.activeConversions).toBe(false);
      expect('test-job' in state.startTimes).toBe(false);
      expect('test-job' in state.progressHistories).toBe(false);
    });

    it('should handle clearing non-existent jobId gracefully', () => {
      useProgressStore.getState().clearConversion('non-existent');

      const state = useProgressStore.getState();
      // Should not throw, just be a no-op
      expect('non-existent' in state.activeConversions).toBe(false);
    });

    it('should not affect other conversions', () => {
      useProgressStore.getState().startConversion('job-1');
      useProgressStore.getState().startConversion('job-2');

      useProgressStore.getState().clearConversion('job-1');

      const state = useProgressStore.getState();
      expect('job-1' in state.activeConversions).toBe(false);
      expect('job-2' in state.activeConversions).toBe(true);
    });
  });

  describe('getProgress selector', () => {
    beforeEach(() => {
      useProgressStore.getState().startConversion('test-job');
    });

    it('should return progress for existing jobId', () => {
      const progress = useProgressStore.getState().getProgress('test-job');

      expect(progress).toBeDefined();
      expect(progress?.stage).toBe('queued');
      expect(progress?.percentage).toBe(0);
    });

    it('should return undefined for non-existent jobId', () => {
      const progress = useProgressStore.getState().getProgress('non-existent');
      expect(progress).toBeUndefined();
    });

    it('should return updated progress', () => {
      useProgressStore.getState().updateProgress('test-job', {
        stage: 'rendering',
        percentage: 60,
        currentOperation: 'Rendering...',
      });

      const progress = useProgressStore.getState().getProgress('test-job');
      expect(progress?.percentage).toBe(60);
    });
  });

  describe('getETA selector', () => {
    beforeEach(() => {
      useProgressStore.getState().startConversion('test-job');
    });

    it('should return ETA for job with progress', () => {
      // Start conversion at time 0
      useProgressStore.getState().startConversion('test-job');

      // Advance time by 4 seconds
      vi.advanceTimersByTime(4000);

      useProgressStore.getState().updateProgress('test-job', {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering...',
      });

      const eta = useProgressStore.getState().getETA('test-job');
      expect(eta).toBeDefined();
      // At 50% progress after 4s, projected total is 8s
      // Remaining: 4s
      expect(eta).toBe(4);
    });

    it('should return undefined for non-existent jobId', () => {
      const eta = useProgressStore.getState().getETA('non-existent');
      expect(eta).toBeUndefined();
    });

    it('should return undefined for 0% progress', () => {
      const eta = useProgressStore.getState().getETA('test-job');
      expect(eta).toBeUndefined();
    });

    it('should return undefined for completed job', () => {
      useProgressStore.getState().completeConversion('test-job');

      const eta = useProgressStore.getState().getETA('test-job');
      expect(eta).toBeUndefined();
    });
  });

  describe('Multiple Concurrent Conversions', () => {
    it('should track multiple conversions independently', () => {
      useProgressStore.getState().startConversion('job-1');
      useProgressStore.getState().startConversion('job-2');
      useProgressStore.getState().startConversion('job-3');

      useProgressStore.getState().updateProgress('job-1', {
        stage: 'rendering',
        percentage: 25,
        currentOperation: 'Job 1 rendering...',
      });

      useProgressStore.getState().updateProgress('job-2', {
        stage: 'generating-pdf',
        percentage: 75,
        currentOperation: 'Job 2 generating...',
      });

      const progress1 = useProgressStore.getState().getProgress('job-1');
      const progress2 = useProgressStore.getState().getProgress('job-2');
      const progress3 = useProgressStore.getState().getProgress('job-3');

      expect(progress1?.percentage).toBe(25);
      expect(progress2?.percentage).toBe(75);
      expect(progress3?.percentage).toBe(0);
    });

    it('should complete conversions independently', () => {
      useProgressStore.getState().startConversion('job-1');
      useProgressStore.getState().startConversion('job-2');

      useProgressStore.getState().completeConversion('job-1');

      const progress1 = useProgressStore.getState().getProgress('job-1');
      const progress2 = useProgressStore.getState().getProgress('job-2');

      expect(progress1?.stage).toBe('completed');
      expect(progress2?.stage).toBe('queued');
    });

    it('should clear conversions independently', () => {
      useProgressStore.getState().startConversion('job-1');
      useProgressStore.getState().startConversion('job-2');

      useProgressStore.getState().clearConversion('job-1');

      expect(useProgressStore.getState().getProgress('job-1')).toBeUndefined();
      expect(useProgressStore.getState().getProgress('job-2')).toBeDefined();
    });
  });

  describe('Progress Workflow', () => {
    it('should handle typical conversion workflow', () => {
      const jobId = 'workflow-test';

      // Start
      useProgressStore.getState().startConversion(jobId);
      expect(useProgressStore.getState().getProgress(jobId)?.percentage).toBe(0);

      // Parsing
      useProgressStore.getState().updateProgress(jobId, {
        stage: 'parsing',
        percentage: 20,
        currentOperation: 'Parsing TSX...',
      });
      expect(useProgressStore.getState().getProgress(jobId)?.stage).toBe('parsing');

      // Rendering
      useProgressStore.getState().updateProgress(jobId, {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering components...',
      });
      expect(useProgressStore.getState().getProgress(jobId)?.percentage).toBe(50);

      // Layout
      useProgressStore.getState().updateProgress(jobId, {
        stage: 'laying-out',
        percentage: 75,
        currentOperation: 'Calculating layout...',
      });
      expect(useProgressStore.getState().getProgress(jobId)?.stage).toBe('laying-out');

      // Complete
      useProgressStore.getState().completeConversion(jobId);
      expect(useProgressStore.getState().getProgress(jobId)?.percentage).toBe(100);

      // Clear
      useProgressStore.getState().clearConversion(jobId);
      expect(useProgressStore.getState().getProgress(jobId)).toBeUndefined();
    });

    it('should handle cancelled workflow', () => {
      const jobId = 'cancel-test';

      useProgressStore.getState().startConversion(jobId);
      useProgressStore.getState().updateProgress(jobId, {
        stage: 'rendering',
        percentage: 45,
        currentOperation: 'Rendering...',
      });

      // User cancels
      useProgressStore.getState().clearConversion(jobId);

      expect(useProgressStore.getState().getProgress(jobId)).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle percentage over 100', () => {
      useProgressStore.getState().startConversion('test-job');
      useProgressStore.getState().updateProgress('test-job', {
        stage: 'rendering',
        percentage: 150,
        currentOperation: 'Over 100%',
      });

      const progress = useProgressStore.getState().getProgress('test-job');
      expect(progress?.percentage).toBe(150);
    });

    it('should handle negative percentage', () => {
      useProgressStore.getState().startConversion('test-job');
      useProgressStore.getState().updateProgress('test-job', {
        stage: 'rendering',
        percentage: -10,
        currentOperation: 'Negative',
      });

      const progress = useProgressStore.getState().getProgress('test-job');
      expect(progress?.percentage).toBe(-10);
    });

    it('should handle very long operation names', () => {
      const longOperation = 'x'.repeat(1000);
      useProgressStore.getState().startConversion('test-job');
      useProgressStore.getState().updateProgress('test-job', {
        stage: 'rendering',
        percentage: 50,
        currentOperation: longOperation,
      });

      const progress = useProgressStore.getState().getProgress('test-job');
      expect(progress?.currentOperation).toBe(longOperation);
    });

    it('should handle empty jobId', () => {
      useProgressStore.getState().startConversion('');
      const progress = useProgressStore.getState().getProgress('');

      expect(progress).toBeDefined();
    });

    it('should handle special characters in jobId', () => {
      const specialJobId = 'job-#@!$%^&*()';
      useProgressStore.getState().startConversion(specialJobId);

      const progress = useProgressStore.getState().getProgress(specialJobId);
      expect(progress).toBeDefined();
    });
  });

  describe('Zustand Store Behavior', () => {
    it('should trigger subscribers on progress update', () => {
      let callCount = 0;
      const unsubscribe = useProgressStore.subscribe(() => {
        callCount += 1;
      });

      useProgressStore.getState().startConversion('test-job');
      expect(callCount).toBe(1);

      useProgressStore.getState().updateProgress('test-job', {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering...',
      });
      expect(callCount).toBe(2);

      unsubscribe();
    });

    it('should allow selective subscription', () => {
      let progressObjectChanges = 0;
      let lastSize = 0;

      const unsubscribe = useProgressStore.subscribe((state) => {
        // Only count when activeConversions object keys change
        const currentSize = Object.keys(state.activeConversions).length;
        if (currentSize !== lastSize) {
          lastSize = currentSize;
          progressObjectChanges += 1;
        }
      });

      // Initial
      lastSize = Object.keys(useProgressStore.getState().activeConversions).length;

      useProgressStore.getState().startConversion('test-job');
      expect(progressObjectChanges).toBe(1); // Object grew from 0 to 1 key

      // Update doesn't change object size
      useProgressStore.getState().updateProgress('test-job', {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering...',
      });
      expect(progressObjectChanges).toBe(1); // Still 1, size didn't change

      unsubscribe();
    });
  });

  describe('Performance Optimization', () => {
    it('should not create new object when progress values unchanged', () => {
      const jobId = 'perf-test';

      // Start conversion
      useProgressStore.getState().startConversion(jobId);

      // Get initial reference
      const progress1 = useProgressStore.getState().getProgress(jobId);

      // Update with same values
      useProgressStore.getState().updateProgress(jobId, {
        stage: 'queued',
        percentage: 0,
        currentOperation: 'Starting conversion...',
      });

      // Get reference after "update"
      const progress2 = useProgressStore.getState().getProgress(jobId);

      // Should be SAME reference (optimization working)
      expect(progress1).toBe(progress2);
      expect(progress1 === progress2).toBe(true);
    });

    it('should create new object when progress values change', () => {
      const jobId = 'perf-test-2';

      // Start conversion
      useProgressStore.getState().startConversion(jobId);

      // Get initial reference
      const progress1 = useProgressStore.getState().getProgress(jobId);

      // Update with different values
      useProgressStore.getState().updateProgress(jobId, {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering...',
      });

      // Get reference after update
      const progress2 = useProgressStore.getState().getProgress(jobId);

      // Should be DIFFERENT reference (actual change)
      expect(progress1).not.toBe(progress2);
      expect(progress1 === progress2).toBe(false);
      expect(progress2?.percentage).toBe(50);
    });

    it('should prevent re-renders when duplicate updates sent', () => {
      const jobId = 'render-test';
      let stateChangeCount = 0;
      let lastProgress: ConversionProgress | undefined;

      // Subscribe to store changes
      const unsubscribe = useProgressStore.subscribe((state) => {
        const currentProgress = state.activeConversions[jobId];
        // Only count as change if reference actually changed
        if (currentProgress !== lastProgress) {
          stateChangeCount += 1;
          lastProgress = currentProgress;
        }
      });

      // Start conversion (1st change)
      useProgressStore.getState().startConversion(jobId);
      expect(stateChangeCount).toBe(1);

      // Update with new value (2nd change)
      useProgressStore.getState().updateProgress(jobId, {
        stage: 'rendering',
        percentage: 25,
        currentOperation: 'Rendering...',
      });
      expect(stateChangeCount).toBe(2);

      // Update with SAME value (should NOT change reference)
      useProgressStore.getState().updateProgress(jobId, {
        stage: 'rendering',
        percentage: 25,
        currentOperation: 'Rendering...',
      });
      expect(stateChangeCount).toBe(2); // Still 2, no reference change

      // Update with new value (3rd change)
      useProgressStore.getState().updateProgress(jobId, {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering...',
      });
      expect(stateChangeCount).toBe(3);

      unsubscribe();
    });
  });
});
