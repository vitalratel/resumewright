// ABOUTME: Manages conversion progress state and UI updates.
// ABOUTME: Handles throttled progress messaging and popup synchronization.

import { getLogger } from '@/shared/infrastructure/logging/instance';
import { sendMessage } from '@/shared/messaging';
import type { ConversionProgress, ConversionStatus } from '../../shared/types/models';
import { throttleProgress } from '../../shared/utils/progressThrottle';

/**
 * Configuration constants for progress behavior
 */
const PROGRESS_THROTTLE_MS = 100; // Throttle progress updates to every 100ms

/**
 * Active conversion state tracking
 * Maintains current progress for each in-flight conversion job
 */
interface ActiveConversion {
  /** Unique identifier for the conversion job */
  jobId: string;
  /** Unix timestamp (ms) when conversion started */
  startTime: number;
  /** Current progress state for UI updates */
  currentProgress: ConversionProgress;
}

/**
 * Progress Tracker Service
 *
 * Encapsulates all progress tracking and UI update logic.
 * Designed for dependency injection and testability.
 *
 * @example
 * ```ts
 * const tracker = new ProgressTracker();
 * tracker.startTracking(jobId);
 * const onProgress = tracker.createProgressCallback(jobId);
 * await convertToPdf(tsx, config, onProgress);
 * tracker.stopTracking(jobId);
 * ```
 */
export class ProgressTracker {
  /**
   * Active conversions map - tracks in-progress conversion jobs
   * Allows progress synchronization when popup reopens during conversion
   */
  private readonly conversions = new Map<string, ActiveConversion>();

  /**
   * Starts tracking a new conversion job
   *
   * Initializes active conversion state for progress synchronization.
   *
   * @param jobId - Unique conversion job identifier
   */
  startTracking(jobId: string): void {
    this.conversions.set(jobId, {
      jobId,
      startTime: Date.now(),
      currentProgress: {
        stage: 'queued',
        percentage: 0,
        currentOperation: 'Starting conversion...',
      },
    });
  }

  /**
   * Creates a throttled progress callback for a conversion job
   *
   * Returns a callback that:
   * - Updates active conversion state
   * - Sends throttled progress updates to UI (max every 100ms)
   *
   * Fire-and-forget pattern for message sending - errors are logged but don't block progress.
   *
   * @param jobId - Unique conversion job identifier
   * @returns Progress callback function for conversion pipeline
   */
  createProgressCallback(jobId: string): (stage: string, percentage: number) => void {
    // Create throttled progress sender to avoid overwhelming UI with updates
    const throttledProgressSend = throttleProgress((stage: string, percentage: number) => {
      const progress: ConversionProgress = {
        stage: stage as ConversionStatus,
        percentage,
        currentOperation: this.getOperationDescription(stage),
      };

      // Update active conversion state for popup synchronization
      const activeConv = this.conversions.get(jobId);
      if (activeConv) {
        activeConv.currentProgress = progress;
      }

      // Send progress update to UI (fire-and-forget - errors logged but not thrown)
      sendMessage('conversionProgress', { jobId, progress }).catch((err) => {
        getLogger().error('ProgressTracker', 'Failed to send progress message', err);
      });
    }, PROGRESS_THROTTLE_MS);

    return throttledProgressSend;
  }

  /**
   * Updates retry progress state and sends to UI
   *
   * Fire-and-forget delivery - errors are logged but not thrown.
   * Prevents retry logic from being blocked by messaging failures.
   *
   * @param jobId - Unique conversion job identifier
   * @param attempt - Current retry attempt number
   * @param maxAttempts - Maximum retry attempts
   * @param delay - Delay in milliseconds before next retry
   * @param error - Error that caused retry
   */
  sendRetryProgress(
    jobId: string,
    attempt: number,
    maxAttempts: number,
    delay: number,
    error: Error,
  ): void {
    const retryProgress: ConversionProgress = {
      stage: 'queued',
      percentage: 0,
      currentOperation: `Conversion attempt ${attempt}/${maxAttempts}... retrying in ${(delay / 1000).toFixed(1)}s`,
      retryAttempt: attempt,
      lastError: error.message,
    };

    // Update active conversion state
    const activeConv = this.conversions.get(jobId);
    if (activeConv) {
      activeConv.currentProgress = retryProgress;
    }

    // Send retry progress update (fire-and-forget)
    sendMessage('conversionProgress', { jobId, progress: retryProgress }).catch((err) => {
      getLogger().error('ProgressTracker', 'Failed to send retry progress message', err);
    });
  }

  /**
   * Synchronizes current progress to newly opened popup
   *
   * Sends progress updates for all active conversions in parallel.
   * Allows popup to display progress for conversions started before it opened.
   *
   * @returns Promise resolving when all progress messages sent
   */
  async synchronizeProgress(): Promise<void> {
    await Promise.all(
      Array.from(this.conversions.entries()).map(async ([jobId, conversion]) => {
        await sendMessage('conversionProgress', {
          jobId,
          progress: conversion.currentProgress,
        });
      }),
    );
  }

  /**
   * Stops tracking a conversion job
   *
   * Removes job from active conversions map.
   * Call this after conversion completes or fails to prevent memory leaks.
   *
   * @param jobId - Unique conversion job identifier
   */
  stopTracking(jobId: string): void {
    this.conversions.delete(jobId);
  }

  /**
   * Maps conversion stage to user-friendly operation description
   *
   * @param stage - Internal conversion stage identifier
   * @returns Human-readable operation description for UI display
   */
  private getOperationDescription(stage: string): string {
    const descriptions: Record<string, string> = {
      queued: 'Preparing conversion...',
      parsing: 'Parsing TSX code...',
      rendering: 'Rendering React components...',
      layout: 'Calculating layout...',
      'pdf-generation': 'Generating PDF...',
      complete: 'Complete!',
    };
    return descriptions[stage] || `Processing (${stage})...`;
  }
}
