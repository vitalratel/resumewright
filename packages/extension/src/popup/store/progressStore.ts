/**
 * Progress Store
 *
 * Manages conversion progress state with ETA calculation, tracking active conversions,
 * start times, and progress histories for velocity-based time estimates.
 */

import type { ConversionProgress } from '../../shared/types/models';
import { create } from 'zustand';
import { calculateETA } from '../../shared/utils/progressCalculations';

interface ProgressState {
  /** Active conversions record (jobId → progress) */
  activeConversions: Record<string, ConversionProgress>;

  /** Start times for ETA calculation (jobId → timestamp) */
  startTimes: Record<string, number>;

  /** Progress histories for velocity calculation (jobId → percentages[]) */
  progressHistories: Record<string, number[]>;

  /** Actions */
  startConversion: (jobId: string) => void;
  updateProgress: (jobId: string, progress: ConversionProgress) => void;
  completeConversion: (jobId: string) => void;
  clearConversion: (jobId: string) => void;
  reset: () => void;

  /** Selectors */
  getProgress: (jobId: string) => ConversionProgress | undefined;
  getETA: (jobId: string) => number | undefined;
  getActiveJobIds: () => string[];
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  activeConversions: {},
  startTimes: {},
  progressHistories: {},

  startConversion: (jobId: string) => {
    const now = Date.now();
    set(state => ({
      activeConversions: {
        ...state.activeConversions,
        [jobId]: {
          stage: 'queued',
          percentage: 0,
          currentOperation: 'Starting conversion...',
        },
      },
      startTimes: {
        ...state.startTimes,
        [jobId]: now,
      },
      progressHistories: {
        ...state.progressHistories,
        [jobId]: [0],
      },
    }));
  },

  updateProgress: (jobId: string, progress: ConversionProgress) => {
    set((state) => {
      const existing = state.activeConversions[jobId];
      const startTime = state.startTimes[jobId];
      const history = state.progressHistories[jobId] ?? [];

      // Skip update if values haven't changed (prevents unnecessary re-renders)
      // Compare all progress fields to ensure we only create new object when actually needed
      if (existing != null) {
        const isSameStage = existing.stage === progress.stage;
        const isSamePercentage = existing.percentage === progress.percentage;
        const isSameOperation = existing.currentOperation === progress.currentOperation;
        const isSamePagesProcessed = existing.pagesProcessed === progress.pagesProcessed;
        const isSameTotalPages = existing.totalPages === progress.totalPages;

        // If all values identical, return existing state (same reference)
        if (isSameStage && isSamePercentage && isSameOperation
          && isSamePagesProcessed && isSameTotalPages) {
          return state; // No change - prevents component re-render
        }
      }

      // Calculate ETA for new progress
      const updatedProgress = { ...progress };

      if (startTime && progress.percentage > 0 && progress.percentage < 100) {
        updatedProgress.estimatedTimeRemaining = calculateETA(
          progress.percentage,
          startTime,
          history,
        );
      }

      return {
        activeConversions: {
          ...state.activeConversions,
          [jobId]: updatedProgress,
        },
        progressHistories: {
          ...state.progressHistories,
          [jobId]: [...history, progress.percentage].slice(-5),
        },
      };
    });
  },

  completeConversion: (jobId: string) => {
    set((state) => {
      const existing = state.activeConversions[jobId];

      if (existing === null || existing === undefined) {
        return state;
      }

      return {
        activeConversions: {
          ...state.activeConversions,
          [jobId]: {
            ...existing,
            stage: 'completed',
            percentage: 100,
            currentOperation: 'Conversion complete',
            estimatedTimeRemaining: undefined,
          },
        },
      };
    });
  },

  clearConversion: (jobId: string) => {
    set((state) => {
       
      const { [jobId]: _removedConversion, ...restConversions } = state.activeConversions;
       
      const { [jobId]: _removedStartTime, ...restStartTimes } = state.startTimes;
       
      const { [jobId]: _removedHistory, ...restHistories } = state.progressHistories;

      return {
        activeConversions: restConversions,
        startTimes: restStartTimes,
        progressHistories: restHistories,
      };
    });
  },

  getProgress: (jobId: string) => {
    return get().activeConversions[jobId];
  },

  getETA: (jobId: string) => {
    const progress = get().activeConversions[jobId];
    return progress?.estimatedTimeRemaining;
  },

  getActiveJobIds: () => {
    return Object.keys(get().activeConversions);
  },

  reset: () => {
    set({
      activeConversions: {},
      startTimes: {},
      progressHistories: {},
    });
  },
}));
