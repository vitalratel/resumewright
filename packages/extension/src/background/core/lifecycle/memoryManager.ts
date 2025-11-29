/**
 * Memory Management for Service Worker
 *
 * Implements aggressive memory cleanup to stay within browser limits:
 * - Target: <50MB median, <75MB P95, <100MB P99
 * - Cleanup triggers: Memory threshold, post-conversion, idle timeout
 * - Actions: Clear old history, delete completed jobs, force GC
 *
 * Service worker memory constraints:
 * - Chrome: ~150MB hard limit before termination
 * - Firefox: Similar constraints
 *
 * Performance targets:
 * - Memory usage should not grow unbounded
 * - Cleanup should complete in <100ms
 * - No user-visible impact during cleanup
 */

import browser from 'webextension-polyfill';
import { getLogger } from '@/shared/infrastructure/logging';

export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

export interface CleanupResult {
  success: boolean;
  memoryBefore: number;
  memoryAfter: number;
  memoryFreed: number;
  itemsDeleted: number;
  duration: number;
}

/**
 * Memory thresholds (in bytes)
 */
export const MEMORY_THRESHOLDS = {
  // Warning threshold - start cleanup (75MB)
  WARNING: 75 * 1024 * 1024,

  // Critical threshold - aggressive cleanup (100MB)
  CRITICAL: 100 * 1024 * 1024,

  // Target after cleanup (50MB)
  TARGET: 50 * 1024 * 1024,
} as const;

/**
 * Cleanup configuration
 */
export const CLEANUP_CONFIG = {
  // Delete history older than 7 days
  HISTORY_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000,

  // Idle timeout before cleanup (5 minutes)
  IDLE_TIMEOUT_MS: 5 * 60 * 1000,

  // Minimum time between cleanups (30 seconds)
  MIN_CLEANUP_INTERVAL_MS: 30 * 1000,
} as const;

/**
 * Memory Manager for Service Worker
 *
 * Monitors memory usage and performs aggressive cleanup to prevent
 * service worker termination due to memory limits.
 */
/**
 * Type extension for Chrome's performance.memory API
 * Non-standard API only available in Chrome/Chromium-based browsers
 */
interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export class MemoryManager {
  private lastCleanupTime: number = 0;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Get current memory usage statistics
   *
   * Uses performance.memory API (Chrome only)
   * Falls back to estimation if not available
   */
  async getMemoryUsage(): Promise<MemoryStats> {
    // Chrome/Chromium support performance.memory
    const perf = performance as PerformanceWithMemory;
    if (perf.memory) {
      return {
        usedJSHeapSize: perf.memory.usedJSHeapSize,
        totalJSHeapSize: perf.memory.totalJSHeapSize,
        jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      };
    }

    // Firefox doesn't expose performance.memory
    // Estimate based on stored data size
    const estimate = await this.estimateMemoryUsage();
    return {
      usedJSHeapSize: estimate,
      totalJSHeapSize: estimate * 1.5,
      jsHeapSizeLimit: 150 * 1024 * 1024, // Assume 150MB limit
      timestamp: Date.now(),
    };
  }

  /**
   * Estimate memory usage based on IndexedDB/localStorage size
   */
  private async estimateMemoryUsage(): Promise<number> {
    try {
      // Get storage estimate (Chrome/Firefox)
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return (estimate.usage !== null && estimate.usage !== undefined && estimate.usage !== 0) ? estimate.usage : 10 * 1024 * 1024; // Default 10MB
      }
    }
    catch (error) {
      getLogger().warn('MemoryManager', 'Failed to estimate storage', error);
    }

    // Fallback: assume 10MB baseline
    return 10 * 1024 * 1024;
  }

  /**
   * Check if memory usage exceeds threshold
   */
  async isMemoryHigh(threshold: number = MEMORY_THRESHOLDS.WARNING): Promise<boolean> {
    const stats = await this.getMemoryUsage();
    return stats.usedJSHeapSize >= threshold;
  }

  /**
   * Monitor memory usage during an operation
   *
   * Wraps an async operation with memory monitoring and automatic cleanup
   * if memory exceeds thresholds.
   *
   * @param jobId - Identifier for the operation
   * @param operation - Async operation to monitor
   * @returns Operation result
   *
   * @example
   * const result = await memoryManager.monitorMemory('conversion-123', async () => {
   *   return await convertTSXToPDF(tsx);
   * });
   */
  async monitorMemory<T>(jobId: string, operation: () => Promise<T>): Promise<T> {
    const startStats = await this.getMemoryUsage();
    getLogger().debug('MemoryManager', `Starting operation ${jobId}`, {
      memoryBefore: `${(startStats.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
    });

    try {
      // Execute operation
      const result = await operation();

      // Check memory after operation
      const endStats = await this.getMemoryUsage();
      const memoryDelta = endStats.usedJSHeapSize - startStats.usedJSHeapSize;

      getLogger().debug('MemoryManager', `Operation ${jobId} completed`, {
        memoryAfter: `${(endStats.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)} MB`,
      });

      // Trigger cleanup if memory is high
      if (endStats.usedJSHeapSize >= MEMORY_THRESHOLDS.WARNING) {
        getLogger().warn('MemoryManager', 'Memory threshold exceeded, triggering cleanup');
        await this.aggressiveCleanup();
      }

      return result;
    }
    catch (error) {
      // Check if error is memory-related
      if (this.isMemoryError(error)) {
        getLogger().error('MemoryManager', 'Memory error detected, attempting recovery', error);

        // Perform aggressive cleanup
        await this.aggressiveCleanup();

        // Retry operation once
        getLogger().info('MemoryManager', `Retrying operation ${jobId} after cleanup`);
        return operation();
      }

      // Re-throw non-memory errors
      throw error;
    }
  }

  /**
   * Check if error is memory-related
   */
  private isMemoryError(error: unknown): boolean {
    if (error === null || error === undefined || error === false)
      return false;

    const message = (error as Error).message?.toLowerCase() || '';
    return (
      message.includes('out of memory')
      || message.includes('memory limit')
      || message.includes('allocation failed')
      || message.includes('heap')
    );
  }

  /**
   * Perform aggressive memory cleanup
   *
   * Cleanup actions:
   * 1. Delete history entries older than 7 days
   * 2. Delete completed/failed job states from IndexedDB
   * 3. Clear unnecessary caches
   * 4. Force garbage collection (if available)
   *
   * @returns Cleanup result with memory freed and duration
   */
  async aggressiveCleanup(): Promise<CleanupResult> {
    const startTime = Date.now();

    // Prevent cleanup spam (min 30s between cleanups)
    const timeSinceLastCleanup = startTime - this.lastCleanupTime;
    if (timeSinceLastCleanup < CLEANUP_CONFIG.MIN_CLEANUP_INTERVAL_MS) {
      getLogger().debug('MemoryManager', `Skipping cleanup (last cleanup ${timeSinceLastCleanup}ms ago)`);
      return {
        success: false,
        memoryBefore: 0,
        memoryAfter: 0,
        memoryFreed: 0,
        itemsDeleted: 0,
        duration: 0,
      };
    }

    const memoryBefore = await this.getMemoryUsage();
    getLogger().info('MemoryManager', 'Starting aggressive cleanup', {
      memoryBefore: `${(memoryBefore.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
    });

    let itemsDeleted = 0;

    try {
      // 1. Clean old history entries
      itemsDeleted += await this.cleanOldHistory();

      // 2. Clean completed job states
      itemsDeleted += await this.cleanCompletedJobs();

      // 3. Clear caches (if any)
      itemsDeleted += await this.clearCaches();

      // Removed forceGC() call - doesn't work in production without --expose-gc flag.
      // Browser's natural GC is sufficient with proper cleanup above.

      // Update last cleanup time
      this.lastCleanupTime = Date.now();

      // Get memory after cleanup
      const memoryAfter = await this.getMemoryUsage();
      const memoryFreed = memoryBefore.usedJSHeapSize - memoryAfter.usedJSHeapSize;
      const duration = Date.now() - startTime;

      getLogger().info('MemoryManager', 'Cleanup completed', {
        memoryAfter: `${(memoryAfter.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        memoryFreed: `${(memoryFreed / 1024 / 1024).toFixed(2)} MB`,
        itemsDeleted,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        memoryBefore: memoryBefore.usedJSHeapSize,
        memoryAfter: memoryAfter.usedJSHeapSize,
        memoryFreed,
        itemsDeleted,
        duration,
      };
    }
    catch (error) {
      getLogger().error('MemoryManager', 'Cleanup failed', error);
      return {
        success: false,
        memoryBefore: memoryBefore.usedJSHeapSize,
        memoryAfter: memoryBefore.usedJSHeapSize,
        memoryFreed: 0,
        itemsDeleted,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Delete history entries older than 7 days
   */
  private async cleanOldHistory(): Promise<number> {
    try {
      const cutoffTime = Date.now() - CLEANUP_CONFIG.HISTORY_MAX_AGE_MS;

      // Get all history keys from browser.storage.local (works in Chrome, Firefox, Edge, Safari)
      const result = await browser.storage.local.get(null);
      const historyKeys = Object.keys(result).filter(key => key.startsWith('history_'));

      let deletedCount = 0;
      const keysToDelete: string[] = [];

      for (const key of historyKeys) {
        const entry = result[key] as { timestamp?: number } | undefined;
        if (entry && (entry.timestamp !== null && entry.timestamp !== undefined && entry.timestamp !== 0) && entry.timestamp < cutoffTime) {
          keysToDelete.push(key);
          deletedCount += 1;
        }
      }

      if (keysToDelete.length > 0) {
        await browser.storage.local.remove(keysToDelete);
        getLogger().debug('MemoryManager', `Deleted ${deletedCount} old history entries`);
      }

      return deletedCount;
    }
    catch (error) {
      getLogger().error('MemoryManager', 'Failed to clean old history', error);
      return 0;
    }
  }

  /**
   * Delete completed/failed job states from storage
   */
  private async cleanCompletedJobs(): Promise<number> {
    try {
      const result = await browser.storage.local.get(null);
      const jobKeys = Object.keys(result).filter(key => key.startsWith('job_'));

      let deletedCount = 0;
      const keysToDelete: string[] = [];

      for (const key of jobKeys) {
        const job = result[key] as { status?: string } | undefined;
        if (job && (job.status === 'completed' || job.status === 'failed')) {
          keysToDelete.push(key);
          deletedCount += 1;
        }
      }

      if (keysToDelete.length > 0) {
        await browser.storage.local.remove(keysToDelete);
        getLogger().debug('MemoryManager', `Deleted ${deletedCount} completed/failed jobs`);
      }

      return deletedCount;
    }
    catch (error) {
      getLogger().error('MemoryManager', 'Failed to clean completed jobs', error);
      return 0;
    }
  }

  /**
   * Clear unnecessary caches
   */
  private async clearCaches(): Promise<number> {
    // Currently no caches to clear
    // This is a placeholder for future cache implementations
    return 0;
  }

  // Removed forceGC() method entirely.
  // Only works with --expose-gc flag which isn't available in production.
  // Browser's natural GC is sufficient when we properly clean up references.

  /**
   * Start idle timer for automatic cleanup
   *
   * Triggers cleanup after 5 minutes of inactivity
   */
  startIdleTimer(): void {
    this.stopIdleTimer();

    this.idleTimer = setTimeout(() => {
      void (async () => {
        getLogger().info('MemoryManager', 'Idle timeout triggered, starting cleanup');
        await this.aggressiveCleanup();
      })();
    }, CLEANUP_CONFIG.IDLE_TIMEOUT_MS);
  }

  /**
   * Stop idle timer
   */
  stopIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /**
   * Reset idle timer (call on user activity)
   */
  resetIdleTimer(): void {
    this.startIdleTimer();
  }
}

// Export singleton instance
export const memoryManager = new MemoryManager();
