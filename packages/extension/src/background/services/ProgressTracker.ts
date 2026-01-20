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
 * Progress Tracker Interface
 *
 * Provides methods to track conversion progress and synchronize with UI.
 */
export interface IProgressTracker {
  /**
   * Starts tracking a new conversion job
   */
  startTracking: (jobId: string) => void;

  /**
   * Creates a throttled progress callback for a conversion job
   */
  createProgressCallback: (jobId: string) => (stage: string, percentage: number) => void;

  /**
   * Sends retry progress update to UI
   */
  sendRetryProgress: (
    jobId: string,
    attempt: number,
    maxAttempts: number,
    delay: number,
    error: Error,
  ) => void;

  /**
   * Synchronizes current progress to newly opened popup
   */
  synchronizeProgress: () => Promise<void>;

  /**
   * Stops tracking a conversion job
   */
  stopTracking: (jobId: string) => void;
}

/**
 * Maps conversion stage to user-friendly operation description
 */
function getOperationDescription(stage: string): string {
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

/**
 * Create a Progress Tracker
 *
 * Factory function that creates an IProgressTracker implementation.
 * Encapsulates all progress tracking and UI update logic.
 *
 * @example
 * ```ts
 * const tracker = createProgressTracker();
 * tracker.startTracking(jobId);
 * const onProgress = tracker.createProgressCallback(jobId);
 * await convertToPdf(tsx, config, onProgress);
 * tracker.stopTracking(jobId);
 * ```
 */
export function createProgressTracker(): IProgressTracker {
  // Private state - tracks in-progress conversion jobs
  const conversions = new Map<string, ActiveConversion>();

  function startTracking(jobId: string): void {
    conversions.set(jobId, {
      jobId,
      startTime: Date.now(),
      currentProgress: {
        stage: 'queued',
        percentage: 0,
        currentOperation: 'Starting conversion...',
      },
    });
  }

  function createProgressCallback(jobId: string): (stage: string, percentage: number) => void {
    // Create throttled progress sender to avoid overwhelming UI with updates
    const throttledProgressSend = throttleProgress((stage: string, percentage: number) => {
      const progress: ConversionProgress = {
        stage: stage as ConversionStatus,
        percentage,
        currentOperation: getOperationDescription(stage),
      };

      // Update active conversion state for popup synchronization
      const activeConv = conversions.get(jobId);
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

  function sendRetryProgress(
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
    const activeConv = conversions.get(jobId);
    if (activeConv) {
      activeConv.currentProgress = retryProgress;
    }

    // Send retry progress update (fire-and-forget)
    sendMessage('conversionProgress', { jobId, progress: retryProgress }).catch((err) => {
      getLogger().error('ProgressTracker', 'Failed to send retry progress message', err);
    });
  }

  async function synchronizeProgress(): Promise<void> {
    await Promise.all(
      Array.from(conversions.entries()).map(async ([jobId, conversion]) => {
        await sendMessage('conversionProgress', {
          jobId,
          progress: conversion.currentProgress,
        });
      }),
    );
  }

  function stopTracking(jobId: string): void {
    conversions.delete(jobId);
  }

  return {
    startTracking,
    createProgressCallback,
    sendRetryProgress,
    synchronizeProgress,
    stopTracking,
  };
}
