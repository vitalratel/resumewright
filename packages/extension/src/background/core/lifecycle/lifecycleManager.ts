/**
 * Service Worker Lifecycle Manager
 *
 * Handles basic service worker lifecycle events and simple state persistence.
 * This is a simplified implementation focused on quality foundation.
 *
 * Full checkpoint-based recovery is deferred for future enhancements.
 *
 * Basic lifecycle handling:
 * - Install/activate event handling
 * - Simple checkpoint before critical operations
 * - Basic recovery detection (logs warning, doesn't auto-resume)
 */

import type { ConversionStatus } from '../../../shared/types/models';
import { getLogger } from '@/shared/infrastructure/logging';
import { settingsStore } from '@/shared/infrastructure/settings/SettingsStore';

/**
 * Simple job state for persistence
 * Full checkpoint system deferred for future enhancements
 */
interface JobState {
  jobId: string;
  status: ConversionStatus;
  startTime: number;
  lastUpdate: number;
  tsx?: string; // Store TSX for potential manual recovery
}

export class LifecycleManager {
  private activeJobs: Map<string, JobState> = new Map();
  private readonly STORAGE_KEY = 'resumewright_job_states';

  constructor() {
    this.setupLifecycleListeners();
  }

  /**
   * Setup service worker lifecycle event listeners
   *
   * IMPORTANT: Manifest V3 Service Worker Limitations
   * -------------------------------------------------
   * Manifest V3 does NOT expose a service worker suspend/termination event.
   * Service workers are terminated without warning after:
   * - 30 seconds of inactivity (Chrome)
   * - 5 minutes of inactivity (Firefox)
   * - Immediately after completing event handlers
   *
   * Recovery Strategy:
   * We handle this limitation by persisting job state before every critical
   * operation via saveJobCheckpoint() calls throughout the conversion pipeline.
   * On startup, we detect orphaned jobs using checkForOrphanedJobs() and notify
   * the user to retry the conversion.
   *
   * State Persistence Points:
   * - Before parsing TSX (jobQueue.ts)
   * - Before font fetching (fontManager.ts)
   * - Before WASM processing (messageHandler.ts)
   * - After each major conversion step
   *
   
   */
  private setupLifecycleListeners(): void {
    // Install event - first time extension is installed
    browser.runtime.onInstalled.addListener((details) => {
      getLogger().info('LifecycleManager', ` onInstalled: ${details.reason}`);

      if (details.reason === 'install') {
        getLogger().info('LifecycleManager', 'Extension installed. Initializing...');
        void this.initialize();
      }
      else if (details.reason === 'update') {
        const previousVersion = details.previousVersion;
        getLogger().info('LifecycleManager', ` Updated from version ${previousVersion}`);
        void this.handleUpdate(previousVersion);
      }
    });

    // Startup event - browser starts / extension reloads
    browser.runtime.onStartup.addListener(() => {
      void (async () => {
      getLogger().info('LifecycleManager', 'onStartup: Browser started');
        await this.checkForOrphanedJobs();
      })();
    });
  }

  /**
   * Initialize extension on first install
   */
  async initialize(): Promise<void> {
    getLogger().info('LifecycleManager', 'Performing first-time initialization');
    // Clear any existing state
    await browser.storage.local.set({ [this.STORAGE_KEY]: {} });

    // Initialize default settings
    try {
      await settingsStore.loadSettings();
      getLogger().info('LifecycleManager', 'Default settings initialized');
    }
    catch (error) {
      getLogger().error('LifecycleManager', '[Lifecycle] Failed to initialize settings', error);
    }
  }

  /**
   * Handle extension update
   */
  private async handleUpdate(previousVersion?: string): Promise<void> {
    getLogger().info('LifecycleManager', ` Handling update from ${previousVersion}`);
    // Future: Run data migrations here
    await this.checkForOrphanedJobs();
  }

  /**
   * Check for jobs that were active when service worker terminated
   * Currently just logs warnings; auto-recovery deferred for future enhancements
   */
  private async checkForOrphanedJobs(): Promise<void> {
    try {
      const stored = await browser.storage.local.get(this.STORAGE_KEY);
      const jobStates = ((stored[this.STORAGE_KEY] !== null && stored[this.STORAGE_KEY] !== undefined) ? stored[this.STORAGE_KEY] : {}) as Record<string, JobState>;

      const now = Date.now();
      const orphanedJobs: string[] = [];

      for (const [jobId, state] of Object.entries(jobStates)) {
        const elapsedSinceUpdate = now - state.lastUpdate;

        // If job was updated in last 5 minutes and not completed/failed
        if (elapsedSinceUpdate < 5 * 60 * 1000) {
          if (state.status !== 'completed' && state.status !== 'failed') {
            orphanedJobs.push(jobId);
            getLogger().warn('LifecycleManager', `[Lifecycle] Orphaned job detected: ${jobId} (status: ${state.status}, `
            + `last updated ${(elapsedSinceUpdate / 1000).toFixed(0)}s ago)`);
          }
        }
      }

      if (orphanedJobs.length > 0) {
        getLogger().warn('LifecycleManager', `[Lifecycle] Found ${orphanedJobs.length} orphaned job(s). `
        + 'User may need to retry conversion. '
        + '(Auto-recovery to be implemented in future)');
      }
    }
    catch (error) {
      getLogger().error('LifecycleManager', '[Lifecycle] Error checking for orphaned jobs', error);
    }
  }

  /**
   * Save job state checkpoint before critical operations
   * This provides basic resilience without full recovery logic
   */
  async saveJobCheckpoint(
    jobId: string,
    status: ConversionStatus,
    tsx?: string,
  ): Promise<void> {
    const state: JobState = {
      jobId,
      status,
      startTime: (this.activeJobs.get(jobId)?.startTime !== null && this.activeJobs.get(jobId)?.startTime !== undefined && this.activeJobs.get(jobId)?.startTime !== 0) ? this.activeJobs.get(jobId)!.startTime : Date.now(),
      lastUpdate: Date.now(),
      tsx,
    };

    this.activeJobs.set(jobId, state);

    try {
      const stored = await browser.storage.local.get(this.STORAGE_KEY);
      const jobStates = ((stored[this.STORAGE_KEY] !== null && stored[this.STORAGE_KEY] !== undefined) ? stored[this.STORAGE_KEY] : {}) as Record<string, JobState>;

      jobStates[jobId] = state;

      await browser.storage.local.set({ [this.STORAGE_KEY]: jobStates });

      getLogger().info('LifecycleManager', ` Checkpoint saved: ${jobId} @ ${status}`);
    }
    catch (error) {
      getLogger().error('LifecycleManager', `[Lifecycle] Failed to save checkpoint for ${jobId}`, error);
      // Don't throw - checkpoint failure shouldn't block conversion
    }
  }

  /**
   * Remove job from persistent storage after completion
   */
  async clearJobCheckpoint(jobId: string): Promise<void> {
    this.activeJobs.delete(jobId);

    try {
      const stored = await browser.storage.local.get(this.STORAGE_KEY);
      const jobStates = ((stored[this.STORAGE_KEY] !== null && stored[this.STORAGE_KEY] !== undefined) ? stored[this.STORAGE_KEY] : {}) as Record<string, JobState>;

      delete jobStates[jobId];

      await browser.storage.local.set({ [this.STORAGE_KEY]: jobStates });

      getLogger().info('LifecycleManager', ` Checkpoint cleared: ${jobId}`);
    }
    catch (error) {
      getLogger().error('LifecycleManager', `[Lifecycle] Failed to clear checkpoint for ${jobId}`, error);
    }
  }

  /**
   * Get all active job IDs
   */
  getActiveJobIds(): string[] {
    return Array.from(this.activeJobs.keys());
  }

  /**
   * Check if a specific job is tracked
   */
  hasJob(jobId: string): boolean {
    return this.activeJobs.has(jobId);
  }
}


