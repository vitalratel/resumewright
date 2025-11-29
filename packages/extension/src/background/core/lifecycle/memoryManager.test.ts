/**
 * Memory Manager Tests
 * 
 * Tests aggressive memory cleanup, threshold monitoring,
 * and service worker memory constraint handling.
 */

import { fakeBrowser } from '@webext-core/fake-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLEANUP_CONFIG, MEMORY_THRESHOLDS, MemoryManager } from './memoryManager';

// webextension-polyfill is mocked globally with fakeBrowser

// Use real logging implementation

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(fakeBrowser.storage.local, 'get').mockResolvedValue({});
    vi.spyOn(fakeBrowser.storage.local, 'remove').mockResolvedValue(undefined);
    memoryManager = new MemoryManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getMemoryUsage', () => {
    it('should return performance.memory stats when available', async () => {
      // Mock Chrome's performance.memory API
      const mockMemory = {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 75 * 1024 * 1024,
        jsHeapSizeLimit: 150 * 1024 * 1024,
      };

      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        configurable: true,
      });

      const result = await memoryManager.getMemoryUsage();

      expect(result.usedJSHeapSize).toBe(50 * 1024 * 1024);
      expect(result.totalJSHeapSize).toBe(75 * 1024 * 1024);
      expect(result.jsHeapSizeLimit).toBe(150 * 1024 * 1024);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should fall back to estimation when performance.memory unavailable', async () => {
      // Remove performance.memory (Firefox behavior)
      Object.defineProperty(performance, 'memory', {
        value: undefined,
        configurable: true,
      });

      // Mock storage.estimate
      const mockEstimate = vi.fn().mockResolvedValue({ usage: 10 * 1024 * 1024 });
      Object.defineProperty(navigator, 'storage', {
        value: { estimate: mockEstimate },
        configurable: true,
      });

      const result = await memoryManager.getMemoryUsage();

      expect(result.usedJSHeapSize).toBe(10 * 1024 * 1024);
      expect(result.totalJSHeapSize).toBe(15 * 1024 * 1024); // 1.5x estimate
      expect(result.jsHeapSizeLimit).toBe(150 * 1024 * 1024); // Default assumption
    });

    it('should use 10MB baseline when storage.estimate fails', async () => {
      Object.defineProperty(performance, 'memory', {
        value: undefined,
        configurable: true,
      });

      Object.defineProperty(navigator, 'storage', {
        value: { estimate: vi.fn().mockRejectedValue(new Error('Not supported')) },
        configurable: true,
      });

      const result = await memoryManager.getMemoryUsage();

      expect(result.usedJSHeapSize).toBe(10 * 1024 * 1024);
    });
  });

  describe('isMemoryHigh', () => {
    it.each([
      [MEMORY_THRESHOLDS.WARNING, 75 * 1024 * 1024, true],
      [MEMORY_THRESHOLDS.WARNING, 74 * 1024 * 1024, false],
      [MEMORY_THRESHOLDS.CRITICAL, 100 * 1024 * 1024, true],
      [MEMORY_THRESHOLDS.CRITICAL, 99 * 1024 * 1024, false],
    ])('should check if memory exceeds threshold %d with usage %d', async (threshold, usage, expected) => {
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: usage,
          totalJSHeapSize: usage * 1.5,
          jsHeapSizeLimit: 150 * 1024 * 1024,
        },
        configurable: true,
      });

      const result = await memoryManager.isMemoryHigh(threshold);
      expect(result).toBe(expected);
    });
  });

  describe('aggressiveCleanup', () => {
    beforeEach(() => {
      // Mock performance.memory
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 100 * 1024 * 1024,
          totalJSHeapSize: 120 * 1024 * 1024,
          jsHeapSizeLimit: 150 * 1024 * 1024,
        },
        configurable: true,
      });
    });

    it('should clean old history entries', async () => {
      const now = Date.now();
      const oldTimestamp = now - (8 * 24 * 60 * 60 * 1000); // 8 days ago

      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValue({
        history_1: { timestamp: oldTimestamp },
        history_2: { timestamp: now },
        job_1: { status: 'pending' },
      });

      vi.mocked(fakeBrowser.storage.local.remove).mockResolvedValue(undefined);

      const result = await memoryManager.aggressiveCleanup();

      expect(result.success).toBe(true);
      expect(result.itemsDeleted).toBeGreaterThan(0);
      expect(fakeBrowser.storage.local.remove).toHaveBeenCalledWith(['history_1']);
    });

    it('should clean completed and failed jobs', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValue({
        job_1: { status: 'completed' },
        job_2: { status: 'failed' },
        job_3: { status: 'converting' },
      });

      vi.mocked(fakeBrowser.storage.local.remove).mockResolvedValue(undefined);

      const result = await memoryManager.aggressiveCleanup();

      expect(result.success).toBe(true);
      expect(result.itemsDeleted).toBe(2);
      expect(fakeBrowser.storage.local.remove).toHaveBeenCalledWith(['job_1', 'job_2']);
    });

    it('should prevent cleanup spam with minimum interval', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValue({});

      // First cleanup
      const result1 = await memoryManager.aggressiveCleanup();
      expect(result1.success).toBe(true);

      // Immediate second cleanup (should be skipped)
      const result2 = await memoryManager.aggressiveCleanup();
      expect(result2.success).toBe(false);
      expect(result2.itemsDeleted).toBe(0);
    });

    it('should continue cleanup despite individual operation failures', async () => {
      // Mock storage.get to fail during cleanOldHistory, but cleanCompletedJobs should still run
      vi.mocked(fakeBrowser.storage.local.get)
        .mockRejectedValueOnce(new Error('Storage error')) // cleanOldHistory fails
        .mockResolvedValueOnce({ job_1: { status: 'completed' } }); // cleanCompletedJobs succeeds

      vi.mocked(fakeBrowser.storage.local.remove).mockResolvedValue(undefined);

      const result = await memoryManager.aggressiveCleanup();

      // Cleanup should still succeed overall
      expect(result.success).toBe(true);
      expect(result.itemsDeleted).toBe(1); // One job cleaned despite history failure
    });

    it('should report memory before and after cleanup', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValue({
        job_1: { status: 'completed' },
      });
      vi.mocked(fakeBrowser.storage.local.remove).mockResolvedValue(undefined);

      const result = await memoryManager.aggressiveCleanup();

      expect(result.success).toBe(true);
      expect(result.memoryBefore).toBe(100 * 1024 * 1024);
      expect(result.memoryAfter).toBeGreaterThanOrEqual(0);
      expect(result.itemsDeleted).toBe(1);
      expect(result.duration).toBeGreaterThanOrEqual(0); // Can be 0ms on fast systems
    });

    it('should handle errors during cleanup operations gracefully', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValue({
        job_1: { status: 'completed' },
      });

      vi.mocked(fakeBrowser.storage.local.remove).mockRejectedValue(new Error('Storage remove failed'));

      const result = await memoryManager.aggressiveCleanup();

      // Cleanup continues despite errors in sub-operations (cleanCompletedJobs error handler catches and returns 0)
      expect(result.success).toBe(true);
      expect(result.itemsDeleted).toBe(0); // Error prevented deletion
    });
  });

  describe('monitorMemory', () => {
    beforeEach(() => {
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 50 * 1024 * 1024,
          totalJSHeapSize: 75 * 1024 * 1024,
          jsHeapSizeLimit: 150 * 1024 * 1024,
        },
        configurable: true,
      });
    });

    it('should execute operation and return result', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await memoryManager.monitorMemory('test-job', operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should trigger cleanup when memory exceeds warning threshold', async () => {
      // Mock high memory after operation
      let callCount = 0;
      Object.defineProperty(performance, 'memory', {
        get: () => {
          callCount += 1;
          return {
            usedJSHeapSize: callCount < 2 ? 50 * 1024 * 1024 : 80 * 1024 * 1024,
            totalJSHeapSize: 120 * 1024 * 1024,
            jsHeapSizeLimit: 150 * 1024 * 1024,
          };
        },
        configurable: true,
      });

      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValue({});
      const operation = vi.fn().mockResolvedValue('success');

      const result = await memoryManager.monitorMemory('test-job', operation);

      expect(result).toBe('success');
      // Cleanup should have been triggered
      expect(fakeBrowser.storage.local.get).toHaveBeenCalled();
    });

    it('should retry operation once after memory error with cleanup', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Out of memory'))
        .mockResolvedValueOnce('success after cleanup');

      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValue({
        job_1: { status: 'completed' },
      });
      vi.mocked(fakeBrowser.storage.local.remove).mockResolvedValue(undefined);

      const result = await memoryManager.monitorMemory('test-job', operation);

      expect(result).toBe('success after cleanup');
      expect(operation).toHaveBeenCalledTimes(2);
      expect(fakeBrowser.storage.local.remove).toHaveBeenCalled();
    });

    it('should re-throw non-memory errors without retry', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        memoryManager.monitorMemory('test-job', operation),
      ).rejects.toThrow('Network error');

      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('idle timer', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 50 * 1024 * 1024,
          totalJSHeapSize: 75 * 1024 * 1024,
          jsHeapSizeLimit: 150 * 1024 * 1024,
        },
        configurable: true,
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should trigger cleanup after idle timeout', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValue({});

      memoryManager.startIdleTimer();

      expect(fakeBrowser.storage.local.get).not.toHaveBeenCalled();

      // Fast-forward 5 minutes
      await vi.advanceTimersByTimeAsync(CLEANUP_CONFIG.IDLE_TIMEOUT_MS);

      expect(fakeBrowser.storage.local.get).toHaveBeenCalled();
    });

    it('should cancel idle timer when stopped', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValue({});

      memoryManager.startIdleTimer();
      memoryManager.stopIdleTimer();

      await vi.advanceTimersByTimeAsync(CLEANUP_CONFIG.IDLE_TIMEOUT_MS);

      expect(fakeBrowser.storage.local.get).not.toHaveBeenCalled();
    });

    it('should reset idle timer on user activity', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValue({});

      memoryManager.startIdleTimer();

      // Advance halfway
      await vi.advanceTimersByTimeAsync(CLEANUP_CONFIG.IDLE_TIMEOUT_MS / 2);

      // Reset timer (simulating user activity)
      memoryManager.resetIdleTimer();

      // Advance halfway again (should not trigger yet)
      await vi.advanceTimersByTimeAsync(CLEANUP_CONFIG.IDLE_TIMEOUT_MS / 2);

      expect(fakeBrowser.storage.local.get).not.toHaveBeenCalled();

      // Advance full duration (should trigger now)
      await vi.advanceTimersByTimeAsync(CLEANUP_CONFIG.IDLE_TIMEOUT_MS / 2);

      expect(fakeBrowser.storage.local.get).toHaveBeenCalled();
    });
  });
});
