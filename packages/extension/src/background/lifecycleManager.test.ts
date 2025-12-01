/**
 * Lifecycle Manager Tests
 *
 * Tests service worker lifecycle management and checkpoint recovery.
 * Uses fakeBrowser for real storage behavior.
 */

import type { ConversionStatus } from '../shared/types';

import { fakeBrowser } from '@webext-core/fake-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { localExtStorage } from '@/shared/infrastructure/storage';

const STORAGE_KEY = 'resumewright_job_states';

describe('LifecycleManager', () => {
  let onStartupListener: (() => void) | null = null;
  let onInstalledListener: ((details: { reason: string; previousVersion?: string }) => void) | null = null;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Clear storage
    await fakeBrowser.storage.local.clear();
    await fakeBrowser.storage.sync.clear();

    // Capture listeners
    vi.spyOn(fakeBrowser.runtime.onStartup, 'addListener').mockImplementation((listener: () => void) => {
      onStartupListener = listener;
    });
    vi.spyOn(fakeBrowser.runtime.onInstalled, 'addListener').mockImplementation((listener: (details: { reason: string; previousVersion?: string }) => void) => {
      onInstalledListener = listener;
    });

    // Import to trigger constructor which registers listeners
    await import('./core/lifecycle/lifecycleManager');
  });

  describe('initialization', () => {
    it('should register lifecycle event listeners', () => {
      expect(onInstalledListener).toBeDefined();
      expect(onStartupListener).toBeDefined();
    });
  });

  describe('checkpoint management', () => {
    it('should save job checkpoint to storage', async () => {
      const { LifecycleManager } = await import('./core/lifecycle/lifecycleManager');
      const manager = new LifecycleManager();

      const jobId = 'test-job-123';
      const status: ConversionStatus = 'parsing';
      const tsx = 'const CV = () => <div>Test</div>';

      await manager.saveJobCheckpoint(jobId, status, tsx);

      const stored = await localExtStorage.getItem(STORAGE_KEY);
      expect(stored).toMatchObject({
        [jobId]: {
          jobId,
          status,
          tsx,
          startTime: expect.any(Number),
          lastUpdate: expect.any(Number),
        },
      });
    });

    it('should save checkpoint without TSX content', async () => {
      const { LifecycleManager } = await import('./core/lifecycle/lifecycleManager');
      const manager = new LifecycleManager();

      const jobId = 'test-job-456';
      const status: ConversionStatus = 'queued';

      await manager.saveJobCheckpoint(jobId, status);

      const stored = await localExtStorage.getItem(STORAGE_KEY);
      expect(stored).toMatchObject({
        [jobId]: {
          jobId,
          status,
        },
      });
      // tsx should not be present when not provided
      expect(stored![jobId].tsx).toBeUndefined();
    });

  });

  describe('checkpoint cleanup', () => {
    it('should remove checkpoint after job completion', async () => {
      const { LifecycleManager } = await import('./core/lifecycle/lifecycleManager');
      const manager = new LifecycleManager();

      const jobId = 'completed-job';

      // Set up existing job
      await localExtStorage.setItem(STORAGE_KEY, {
        [jobId]: {
          jobId,
          status: 'generating-pdf' as ConversionStatus,
          startTime: Date.now(),
          lastUpdate: Date.now(),
        },
      });

      await manager.clearJobCheckpoint(jobId);

      const stored = await localExtStorage.getItem(STORAGE_KEY);
      expect(stored).toEqual({});
    });
  });

  describe('orphaned job detection', () => {
    it('should detect abandoned jobs after service worker restart', async () => {
      const orphanedJob = {
        jobId: 'orphaned-123',
        status: 'generating-pdf' as ConversionStatus,
        startTime: Date.now() - 60000,
        lastUpdate: Date.now() - 40000, // Last updated 40 seconds ago (< 5 min threshold)
      };

      await localExtStorage.setItem(STORAGE_KEY, { 'orphaned-123': orphanedJob });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      onStartupListener!();

      await vi.waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalled();
        const warnCalls = consoleWarnSpy.mock.calls;
        const hasOrphanedWarning = warnCalls.some(call =>
          typeof call[0] === 'string' && call[0].includes('orphaned-123'),
        );
        expect(hasOrphanedWarning).toBe(true);
      });

      consoleWarnSpy.mockRestore();
    });

    it('should not flag old jobs as orphaned (>5 minutes)', async () => {
      const oldJob = {
        jobId: 'old-456',
        status: 'generating-pdf' as ConversionStatus,
        startTime: Date.now() - 10 * 60 * 1000,
        lastUpdate: Date.now() - 6 * 60 * 1000, // Updated 6 minutes ago (beyond threshold)
      };

      await localExtStorage.setItem(STORAGE_KEY, { 'old-456': oldJob });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      onStartupListener!();

      // Give async operations time to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      // Jobs older than 5 minutes should not be flagged
      const warnCalls = consoleWarnSpy.mock.calls;
      const hasOrphanedWarning = warnCalls.some(call =>
        typeof call[0] === 'string' && call[0].includes('old-456'),
      );
      expect(hasOrphanedWarning).toBe(false);

      consoleWarnSpy.mockRestore();
    });

    it('should handle empty storage on startup', async () => {
      // Storage is already empty from beforeEach

      // Should not throw
      expect(() => onStartupListener!()).not.toThrow();
    });
  });

  describe('job tracking', () => {
    it('should register active job on checkpoint save', async () => {
      const { LifecycleManager } = await import('./core/lifecycle/lifecycleManager');
      const manager = new LifecycleManager();

      const jobId = 'track-test-123';
      const status: ConversionStatus = 'parsing';

      await manager.saveJobCheckpoint(jobId, status);

      const stored = await localExtStorage.getItem(STORAGE_KEY);
      expect(stored![jobId]).toMatchObject({
        startTime: expect.any(Number),
      });
    });

    it('should preserve start time across multiple checkpoints', async () => {
      const { LifecycleManager } = await import('./core/lifecycle/lifecycleManager');
      const manager = new LifecycleManager();

      const jobId = 'multi-checkpoint-789';

      // First checkpoint
      await manager.saveJobCheckpoint(jobId, 'queued');
      const firstStored = await localExtStorage.getItem(STORAGE_KEY);
      const firstStartTime = firstStored![jobId].startTime;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second checkpoint
      await manager.saveJobCheckpoint(jobId, 'parsing');
      const secondStored = await localExtStorage.getItem(STORAGE_KEY);
      const secondStartTime = secondStored![jobId].startTime;

      // Start time should be preserved
      expect(secondStartTime).toBe(firstStartTime);
    });
  });

});
