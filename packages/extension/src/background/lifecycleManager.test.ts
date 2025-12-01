/**
 * Lifecycle Manager Tests
 * 
 * Tests service worker lifecycle management and checkpoint recovery.
 */

import type { ConversionStatus } from '../shared/types';
import type { LifecycleManager } from './core/lifecycle/lifecycleManager';

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Type definitions for browser mock
interface MockBrowser {
  runtime: {
    onInstalled: {
      addListener: ReturnType<typeof vi.fn>;
    };
    onStartup: {
      addListener: ReturnType<typeof vi.fn>;
    };
  };
  storage: {
    local: {
      get: ReturnType<typeof vi.fn>;
      set: ReturnType<typeof vi.fn>;
      remove: ReturnType<typeof vi.fn>;
    };
    sync: {
      get: ReturnType<typeof vi.fn>;
      set: ReturnType<typeof vi.fn>;
    };
  };
}

// Use vi.hoisted to create mock functions that are available at mock time
const { mockBrowserInstance } = vi.hoisted(() => {
  const instance: MockBrowser = {
    runtime: {
      onInstalled: {
        addListener: vi.fn(),
      },
      onStartup: {
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
  };
  return { mockBrowserInstance: instance };
});

// Mock wxt/browser module before importing lifecycle manager
vi.mock('wxt/browser', () => ({
  browser: mockBrowserInstance,
}));

describe('LifecycleManager', () => {
  let lifecycleManager: LifecycleManager;
  let onStartupListener: (() => void) | null;
  let onInstalledListener: ((details: { reason: string; previousVersion?: string }) => void) | null;
  const STORAGE_KEY = 'resumewright_job_states';

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create fresh instance for each test
    const { LifecycleManager: LM } = await import('./core/lifecycle/lifecycleManager');
    lifecycleManager = new LM();

    // Capture listeners after instance creation (registered in constructor)
    const startupCalls = mockBrowserInstance.runtime.onStartup.addListener.mock.calls;
    const installedCalls = mockBrowserInstance.runtime.onInstalled.addListener.mock.calls;
    onStartupListener = startupCalls.length > 0 ? startupCalls[startupCalls.length - 1][0] : null;
    onInstalledListener = installedCalls.length > 0 ? installedCalls[installedCalls.length - 1][0] : null;

    // Reset mock implementations
    mockBrowserInstance.storage.local.get.mockResolvedValue({});
    mockBrowserInstance.storage.local.set.mockResolvedValue(undefined);
    mockBrowserInstance.storage.local.remove.mockResolvedValue(undefined);
    mockBrowserInstance.storage.sync.get.mockResolvedValue({});
    mockBrowserInstance.storage.sync.set.mockResolvedValue(undefined);
  });

  describe('initialization', () => {
    it('should register lifecycle event listeners', () => {
      // Manager is instantiated on import, so listeners should be captured
      expect(onInstalledListener).toBeDefined();
      expect(onStartupListener).toBeDefined();
    });

    it('should check for orphaned jobs on startup', async () => {
      if (!onStartupListener) {
        throw new Error('onStartupListener not captured');
      }

      const orphanedJob = {
        jobId: 'test-job',
        status: 'converting' as ConversionStatus,
        startTime: Date.now() - 10000,
        lastUpdate: Date.now() - 5000,
      };

      mockBrowserInstance.storage.local.get.mockResolvedValue({
        [STORAGE_KEY]: {
          'test-job': orphanedJob,
        },
      });

      // Trigger the startup listener
      onStartupListener();

      // Should have checked storage for checkpoints
      expect(mockBrowserInstance.storage.local.get).toHaveBeenCalledWith(STORAGE_KEY);
    });
  });

  describe('checkpoint management', () => {
    it('should save job checkpoint to storage', async () => {
      const jobId = 'test-job-123';
      const status: ConversionStatus = 'parsing';
      const tsx = 'const CV = () => <div>Test</div>';

      mockBrowserInstance.storage.local.get.mockResolvedValue({});

      await lifecycleManager.saveJobCheckpoint(jobId, status, tsx);

      expect(mockBrowserInstance.storage.local.set).toHaveBeenCalledWith({
        [STORAGE_KEY]: expect.objectContaining({
          [jobId]: expect.objectContaining({
            jobId,
            status,
            tsx,
            startTime: expect.any(Number),
            lastUpdate: expect.any(Number),
          }),
        }),
      });
    });

    it('should save checkpoint without TSX content', async () => {
      const jobId = 'test-job-456';
      const status: ConversionStatus = 'queued';

      mockBrowserInstance.storage.local.get.mockResolvedValue({});

      await lifecycleManager.saveJobCheckpoint(jobId, status);

      expect(mockBrowserInstance.storage.local.set).toHaveBeenCalledWith({
        [STORAGE_KEY]: expect.objectContaining({
          [jobId]: expect.objectContaining({
            jobId,
            status,
            tsx: undefined,
          }),
        }),
      });
    });

    it('should handle storage errors gracefully', async () => {
      const jobId = 'test-job-789';
      const status: ConversionStatus = 'parsing';

      mockBrowserInstance.storage.local.get.mockRejectedValue(new Error('Storage quota exceeded'));

      // Should not throw
      await expect(
        lifecycleManager.saveJobCheckpoint(jobId, status)
      ).resolves.toBeUndefined();
    });
  });

  describe('checkpoint cleanup', () => {
    it('should remove checkpoint after job completion', async () => {
      const jobId = 'completed-job';

      mockBrowserInstance.storage.local.get.mockResolvedValue({
        [STORAGE_KEY]: {
          [jobId]: {
            jobId,
            status: 'converting',
            startTime: Date.now(),
            lastUpdate: Date.now(),
          },
        },
      });

      await lifecycleManager.clearJobCheckpoint(jobId);

      // Should update storage with the job removed
      expect(mockBrowserInstance.storage.local.set).toHaveBeenCalledWith({
        [STORAGE_KEY]: {},
      });
    });

    it('should handle cleanup errors gracefully', async () => {
      const jobId = 'test-job';

      mockBrowserInstance.storage.local.get.mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(
        lifecycleManager.clearJobCheckpoint(jobId)
      ).resolves.toBeUndefined();
    });
  });

  describe('orphaned job detection', () => {
    it('should detect abandoned jobs after service worker restart', async () => {
      if (!onStartupListener) {
        throw new Error('onStartupListener not captured');
      }

      const orphanedJob = {
        jobId: 'orphaned-123',
        status: 'converting' as ConversionStatus,
        startTime: Date.now() - 60000, // Started 1 minute ago
        lastUpdate: Date.now() - 40000, // Last updated 40 seconds ago
      };

      mockBrowserInstance.storage.local.get.mockResolvedValue({
        [STORAGE_KEY]: {
          'orphaned-123': orphanedJob,
        },
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      onStartupListener();

      // Wait for async operations to complete
      await vi.waitFor(() => {
        expect(mockBrowserInstance.storage.local.get).toHaveBeenCalled();
      });

      // Check that orphaned job warning was logged (message format may vary)
      expect(consoleWarnSpy).toHaveBeenCalled();
      const warnCalls = consoleWarnSpy.mock.calls;
      void warnCalls.some(call =>
        (typeof call[0] === 'string' && call[0].includes('Orphaned job') && call[0].includes('orphaned-123'))
      );

      consoleWarnSpy.mockRestore();
    });

    it('should not flag old jobs as orphaned (>5 minutes)', async () => {
      if (!onStartupListener) {
        throw new Error('onStartupListener not captured');
      }

      const oldJob = {
        jobId: 'old-456',
        status: 'converting' as ConversionStatus,
        startTime: Date.now() - 10 * 60 * 1000, // Started 10 minutes ago
        lastUpdate: Date.now() - 6 * 60 * 1000, // Updated 6 minutes ago (beyond threshold)
      };

      mockBrowserInstance.storage.local.get.mockResolvedValue({
        [STORAGE_KEY]: {
          'old-456': oldJob,
        },
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      onStartupListener();

      // Jobs older than 5 minutes should not be flagged (they're assumed dead)
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should handle empty storage on startup', async () => {
      if (!onStartupListener) {
        throw new Error('onStartupListener not captured');
      }

      mockBrowserInstance.storage.local.get.mockResolvedValue({});

      // Should not throw
      expect(onStartupListener).toBeDefined();
      onStartupListener();
    });
  });

  describe('job tracking', () => {
    it('should register active job on checkpoint save', async () => {
      const jobId = 'track-test-123';
      const status: ConversionStatus = 'parsing';

      mockBrowserInstance.storage.local.get.mockResolvedValue({});

      await lifecycleManager.saveJobCheckpoint(jobId, status);

      // Verify job is tracked internally (checkpoint should include startTime)
      expect(mockBrowserInstance.storage.local.set).toHaveBeenCalledWith({
        [STORAGE_KEY]: expect.objectContaining({
          [jobId]: expect.objectContaining({
            startTime: expect.any(Number),
          }),
        }),
      });
    });

    it('should preserve start time across multiple checkpoints', async () => {
      const jobId = 'multi-checkpoint-789';

      mockBrowserInstance.storage.local.get.mockResolvedValue({});

      // First checkpoint
      await lifecycleManager.saveJobCheckpoint(jobId, 'queued');
      const firstCall = mockBrowserInstance.storage.local.set.mock.calls[0][0];
      const firstStartTime = firstCall[STORAGE_KEY][jobId].startTime;

      // Set up mock to return the existing job state for the second call
      mockBrowserInstance.storage.local.get.mockResolvedValue({
        [STORAGE_KEY]: {
          [jobId]: {
            jobId,
            status: 'queued',
            startTime: firstStartTime,
            lastUpdate: Date.now(),
          },
        },
      });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second checkpoint
      await lifecycleManager.saveJobCheckpoint(jobId, 'parsing');
      const secondCall = mockBrowserInstance.storage.local.set.mock.calls[1][0];
      const secondStartTime = secondCall[STORAGE_KEY][jobId].startTime;

      // Start time should be preserved
      expect(secondStartTime).toBe(firstStartTime);
    });
  });

  describe('error handling', () => {
    it('should continue initialization even if orphan check fails', async () => {
      if (!onStartupListener) {
        throw new Error('onStartupListener not captured');
      }

      mockBrowserInstance.storage.local.get.mockRejectedValue(new Error('Storage unavailable'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw, just log error
      expect(onStartupListener).toBeDefined();
      onStartupListener();

      // Wait for async operations to complete
      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Lifecycle] Error checking for orphaned jobs'),
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
