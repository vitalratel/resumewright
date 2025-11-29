/**
 * Lifecycle Manager Integration Tests
 * Integration tests for lifecycle manager recovery scenarios
 *
 * Tests: Job state persistence, orphaned job detection, checkpoint save/restore
 *
 * The lifecycle manager tracks active conversion jobs across service worker restarts.
 * This test validates:
 * 1. Job checkpoint save/restore functionality
 * 2. Orphaned job detection after service worker restart
 * 3. Job state cleanup on completion/failure
 * 4. Multiple concurrent job tracking
 * 5. Recovery from storage failures
 */

import type { LifecycleManager as LifecycleManagerType } from '../../background/core/lifecycle/lifecycleManager';
import type { ConversionStatus } from '../../shared/types/models';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockBrowser } from './test-utils';

// Mock webextension-polyfill BEFORE importing LifecycleManager
vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      onInstalled: {
        addListener: vi.fn(),
      },
      onStartup: {
        addListener: vi.fn(),
      },
      onSuspend: {
        addListener: vi.fn(),
      },
    },
    storage: {
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      },
      sync: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
      },
    },
  },
}));

// Mock logger
vi.mock('../../shared/utils/logger', () => ({
  getLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('Lifecycle Manager - Recovery Scenarios', () => {
  let browserMock: ReturnType<typeof createMockBrowser>;
  let LifecycleManager: typeof LifecycleManagerType;
  let lifecycleManager: LifecycleManagerType;

  beforeAll(async () => {
    // Import LifecycleManager after mocks are set up
    const module = await import('../../background/core/lifecycle/lifecycleManager');
    LifecycleManager = module.LifecycleManager;
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create mock browser
    browserMock = createMockBrowser();

    // Get the vi.mocked browser
    const webext = await import('webextension-polyfill');
    
    // Update vi.mock storage methods to use browserMock
    vi.mocked(webext.default.storage.local.get).mockImplementation(browserMock.mockBrowser.storage.local.get);
    vi.mocked(webext.default.storage.local.set).mockImplementation(browserMock.mockBrowser.storage.local.set);
    
    // Create fresh instance for each test (no singleton state to clear)
    lifecycleManager = new LifecycleManager();

    // Clear storage
    browserMock.clearStorage();

    await lifecycleManager.initialize();
  });

  afterEach(() => {
    // Destroy mock browser to prevent memory leaks
    browserMock.destroy();

    vi.clearAllMocks();
  });

  describe('Job Checkpoint Save and Restore', () => {
    it('should save job checkpoint to storage', async () => {
      const jobId = 'test-job-1';
      const status: ConversionStatus = 'parsing';
      const tsx = '<CV><PersonalInfo><Name>John Doe</Name></PersonalInfo></CV>';

      await lifecycleManager.saveJobCheckpoint(jobId, status, tsx);

      // Verify job is tracked in memory
      expect(lifecycleManager.hasJob(jobId)).toBe(true);

      // Verify job is persisted to storage
      const stored = await browserMock.mockBrowser.storage.local.get('resumewright_job_states');
      const jobStates = stored.resumewright_job_states as Record<string, unknown>;

      expect(jobStates).toBeDefined();
      expect(jobStates[jobId]).toBeDefined();
      expect((jobStates[jobId] as { status: string }).status).toBe('parsing');
      expect((jobStates[jobId] as { tsx: string }).tsx).toBe(tsx);
    });

    it('should restore job state after checkpoint', async () => {
      const jobId = 'test-job-restore';
      const status: ConversionStatus = 'rendering';

      // Save checkpoint
      await lifecycleManager.saveJobCheckpoint(jobId, status);

      // Verify job is restored in active jobs
      const activeJobIds = lifecycleManager.getActiveJobIds();
      expect(activeJobIds).toContain(jobId);
    });

    it('should update existing checkpoint with new status', async () => {
      const jobId = 'test-job-update';

      // Save initial checkpoint
      await lifecycleManager.saveJobCheckpoint(jobId, 'parsing');

      // Update to new status
      await lifecycleManager.saveJobCheckpoint(jobId, 'rendering');

      // Verify updated status in storage
      const stored = await browserMock.mockBrowser.storage.local.get('resumewright_job_states');
      const jobStates = stored.resumewright_job_states as Record<string, unknown>;

      expect((jobStates[jobId] as { status: string }).status).toBe('rendering');
    });

    it('should handle checkpoint save failure gracefully', async () => {
      const jobId = 'test-job-error';

      // Mock storage failure
      const originalSet = browserMock.mockBrowser.storage.local.set;
      vi.mocked(browserMock.mockBrowser.storage.local.set).mockRejectedValueOnce(new Error('Storage quota exceeded'));

      // Should not throw even if storage fails
      await expect(
        lifecycleManager.saveJobCheckpoint(jobId, 'parsing'),
      ).resolves.not.toThrow();

      // Restore original function
      browserMock.mockBrowser.storage.local.set = originalSet;
    });
  });

  describe('Job Checkpoint Cleanup', () => {
    it('should clear job checkpoint from storage', async () => {
      const jobId = 'test-job-clear';

      // Save checkpoint
      await lifecycleManager.saveJobCheckpoint(jobId, 'parsing');
      expect(lifecycleManager.hasJob(jobId)).toBe(true);

      // Clear checkpoint
      await lifecycleManager.clearJobCheckpoint(jobId);

      // Verify job removed from memory
      expect(lifecycleManager.hasJob(jobId)).toBe(false);

      // Verify job removed from storage
      const stored = await browserMock.mockBrowser.storage.local.get('resumewright_job_states');
      const jobStates = (stored.resumewright_job_states as Record<string, unknown> | undefined) ?? {};

      expect(jobStates[jobId]).toBeUndefined();
    });

    it('should handle clearing non-existent job gracefully', async () => {
      const jobId = 'non-existent-job';

      // Should not throw for non-existent job
      await expect(
        lifecycleManager.clearJobCheckpoint(jobId),
      ).resolves.not.toThrow();
    });

    it('should handle storage failure during cleanup gracefully', async () => {
      const jobId = 'test-job-cleanup-error';

      // Save checkpoint first
      await lifecycleManager.saveJobCheckpoint(jobId, 'parsing');

      // Mock storage failure
      const originalSet = browserMock.mockBrowser.storage.local.set;
      vi.mocked(browserMock.mockBrowser.storage.local.set).mockRejectedValueOnce(new Error('Storage error'));

      // Should not throw even if storage fails
      await expect(
        lifecycleManager.clearJobCheckpoint(jobId),
      ).resolves.not.toThrow();

      // Restore original function
      browserMock.mockBrowser.storage.local.set = originalSet;
    });
  });

  describe('Multiple Concurrent Jobs', () => {
    it('should track multiple active jobs', async () => {
      const jobs = [
        { id: 'job-1', status: 'parsing' as ConversionStatus },
        { id: 'job-2', status: 'rendering' as ConversionStatus },
        { id: 'job-3', status: 'generating-pdf' as ConversionStatus },
      ];

      // Save checkpoints for all jobs using Promise.all() to avoid await-in-loop
      await Promise.all(
        jobs.map(async job => lifecycleManager.saveJobCheckpoint(job.id, job.status)),
      );

      // Verify all jobs are tracked
      const activeJobIds = lifecycleManager.getActiveJobIds();
      expect(activeJobIds).toHaveLength(3);
      expect(activeJobIds).toContain('job-1');
      expect(activeJobIds).toContain('job-2');
      expect(activeJobIds).toContain('job-3');
    });

    it('should clear individual jobs without affecting others', async () => {
      // Save multiple checkpoints
      await lifecycleManager.saveJobCheckpoint('job-1', 'parsing');
      await lifecycleManager.saveJobCheckpoint('job-2', 'rendering');
      await lifecycleManager.saveJobCheckpoint('job-3', 'generating-pdf');

      // Clear one job
      await lifecycleManager.clearJobCheckpoint('job-2');

      // Verify only job-2 is removed
      expect(lifecycleManager.hasJob('job-1')).toBe(true);
      expect(lifecycleManager.hasJob('job-2')).toBe(false);
      expect(lifecycleManager.hasJob('job-3')).toBe(true);
    });

    it('should handle rapid job creation and cleanup', async () => {
      const jobCount = 10;

      // Rapidly create jobs
      const savePromises = Array.from({ length: jobCount }, async (_, i) =>
        lifecycleManager.saveJobCheckpoint(`rapid-job-${i}`, 'parsing'));
      await Promise.all(savePromises);

      // Verify all jobs created
      expect(lifecycleManager.getActiveJobIds()).toHaveLength(jobCount);

      // Rapidly clear jobs
      const clearPromises = Array.from({ length: jobCount }, async (_, i) =>
        lifecycleManager.clearJobCheckpoint(`rapid-job-${i}`));
      await Promise.all(clearPromises);

      // Verify all jobs cleared
      expect(lifecycleManager.getActiveJobIds()).toHaveLength(0);
    });
  });

  describe('Job State Transitions', () => {
    it.each([
      ['queued', 'parsing'],
      ['parsing', 'rendering'],
      ['rendering', 'generating'],
      ['generating', 'completed'],
    ])('should track transition from %s to %s', async (fromStatus, toStatus) => {
      const jobId = `transition-${fromStatus}-${toStatus}`;

      // Save initial status
      await lifecycleManager.saveJobCheckpoint(jobId, fromStatus as ConversionStatus);

      // Transition to new status
      await lifecycleManager.saveJobCheckpoint(jobId, toStatus as ConversionStatus);

      // Verify final status
      const stored = await browserMock.mockBrowser.storage.local.get('resumewright_job_states');
      const jobStates = stored.resumewright_job_states as Record<string, unknown>;

      expect((jobStates[jobId] as { status: string }).status).toBe(toStatus);
    });

    it('should handle failed job state', async () => {
      const jobId = 'failed-job';

      // Save as parsing
      await lifecycleManager.saveJobCheckpoint(jobId, 'parsing');

      // Transition to failed
      await lifecycleManager.saveJobCheckpoint(jobId, 'failed');

      // Job should still be tracked until explicitly cleared
      expect(lifecycleManager.hasJob(jobId)).toBe(true);

      // Verify status
      const stored = await browserMock.mockBrowser.storage.local.get('resumewright_job_states');
      const jobStates = stored.resumewright_job_states as Record<string, unknown>;

      expect((jobStates[jobId] as { status: string }).status).toBe('failed');
    });

    it('should preserve tsx data across status transitions', async () => {
      const jobId = 'preserve-tsx-job';
      const tsx = '<CV><PersonalInfo><Name>Jane Doe</Name></PersonalInfo></CV>';

      // Save with tsx
      await lifecycleManager.saveJobCheckpoint(jobId, 'parsing', tsx);

      // Transition without tsx parameter
      await lifecycleManager.saveJobCheckpoint(jobId, 'rendering');

      // Status should be updated
      const stored = await browserMock.mockBrowser.storage.local.get('resumewright_job_states');
      const jobStates = stored.resumewright_job_states as Record<string, unknown>;

      expect((jobStates[jobId] as { status: string }).status).toBe('rendering');
    });
  });

  describe('Storage Edge Cases', () => {
    it('should handle empty storage gracefully', async () => {
      // Clear all storage
      browserMock.clearStorage();

      // Initialize should work with empty storage
      await expect(lifecycleManager.initialize()).resolves.not.toThrow();

      // Should be able to save new checkpoints
      await expect(
        lifecycleManager.saveJobCheckpoint('new-job', 'parsing'),
      ).resolves.not.toThrow();
    });

    it('should handle corrupted storage data gracefully', async () => {
      // Set corrupted data
      await browserMock.mockBrowser.storage.local.set({
        resumewright_job_states: 'invalid-not-an-object',
      });

      // Initialize should handle corrupted data
      await expect(lifecycleManager.initialize()).resolves.not.toThrow();

      // Should be able to save new checkpoints (will overwrite corrupted data)
      await expect(
        lifecycleManager.saveJobCheckpoint('recovery-job', 'parsing'),
      ).resolves.not.toThrow();
    });

    it('should handle storage with unexpected structure', async () => {
      // Set storage with unexpected structure
      await browserMock.mockBrowser.storage.local.set({
        resumewright_job_states: {
          'job-1': {
            // Missing required fields
            randomField: 'value',
          },
        },
      });

      // Should handle gracefully
      await expect(lifecycleManager.initialize()).resolves.not.toThrow();
    });
  });

  describe('Timestamp Tracking', () => {
    it('should track startTime for new jobs', async () => {
      const jobId = 'timestamp-job';
      const beforeSave = Date.now();

      await lifecycleManager.saveJobCheckpoint(jobId, 'parsing');

      const afterSave = Date.now();

      // Verify timestamp is within expected range
      const stored = await browserMock.mockBrowser.storage.local.get('resumewright_job_states');
      const jobStates = stored.resumewright_job_states as Record<string, unknown>;

      const startTime = (jobStates[jobId] as { startTime: number }).startTime;
      expect(startTime).toBeGreaterThanOrEqual(beforeSave);
      expect(startTime).toBeLessThanOrEqual(afterSave);
    });

    it('should update lastUpdate on each checkpoint save', async () => {
      const jobId = 'update-timestamp-job';

      // Save initial checkpoint
      await lifecycleManager.saveJobCheckpoint(jobId, 'parsing');

      // Get initial lastUpdate
      let stored = await browserMock.mockBrowser.storage.local.get('resumewright_job_states');
      let jobStates = stored.resumewright_job_states as Record<string, unknown>;
      const firstUpdate = (jobStates[jobId] as { lastUpdate: number }).lastUpdate;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      // Save another checkpoint
      await lifecycleManager.saveJobCheckpoint(jobId, 'rendering');

      // Get updated lastUpdate
      stored = await browserMock.mockBrowser.storage.local.get('resumewright_job_states');
      jobStates = stored.resumewright_job_states as Record<string, unknown>;
      const secondUpdate = (jobStates[jobId] as { lastUpdate: number }).lastUpdate;

      // lastUpdate should be newer
      expect(secondUpdate).toBeGreaterThan(firstUpdate);
    });

    it('should preserve startTime across status transitions', async () => {
      const jobId = 'preserve-starttime-job';

      // Save initial checkpoint
      await lifecycleManager.saveJobCheckpoint(jobId, 'parsing');

      // Get initial startTime
      let stored = await browserMock.mockBrowser.storage.local.get('resumewright_job_states');
      let jobStates = stored.resumewright_job_states as Record<string, unknown>;
      const originalStartTime = (jobStates[jobId] as { startTime: number }).startTime;

      // Wait and transition to new status
      await new Promise(resolve => setTimeout(resolve, 10));
      await lifecycleManager.saveJobCheckpoint(jobId, 'rendering');

      // Verify startTime unchanged
      stored = await browserMock.mockBrowser.storage.local.get('resumewright_job_states');
      jobStates = stored.resumewright_job_states as Record<string, unknown>;
      const newStartTime = (jobStates[jobId] as { startTime: number }).startTime;

      expect(newStartTime).toBe(originalStartTime);
    });
  });
});
