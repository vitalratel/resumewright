/**
 * ABOUTME: Progress store tracking conversion progress, ETA calculations, and multi-job support.
 * ABOUTME: Uses Solid's createStore for fine-grained reactive state management.
 */

import { createStore, reconcile } from 'solid-js/store';
import type { ConversionProgress } from '../../shared/types/models';
import { calculateETA } from '../../shared/utils/progressCalculations';

interface ProgressState {
  activeConversions: Record<string, ConversionProgress>;
  startTimes: Record<string, number>;
  progressHistories: Record<string, number[]>;
}

const initialState: ProgressState = {
  activeConversions: {},
  startTimes: {},
  progressHistories: {},
};

export function createProgressStore() {
  const [state, setState] = createStore<ProgressState>(structuredClone(initialState));

  function startConversion(jobId: string) {
    const now = Date.now();
    setState('activeConversions', jobId, {
      stage: 'queued',
      percentage: 0,
      currentOperation: 'Starting conversion...',
    });
    setState('startTimes', jobId, now);
    setState('progressHistories', jobId, [0]);
  }

  function updateProgress(jobId: string, progress: ConversionProgress) {
    const startTime = state.startTimes[jobId];
    const history = state.progressHistories[jobId] ?? [];

    const updatedProgress = { ...progress };

    if (startTime && progress.percentage > 0 && progress.percentage < 100) {
      updatedProgress.estimatedTimeRemaining = calculateETA(
        progress.percentage,
        startTime,
        history,
      );
    }

    setState('activeConversions', jobId, updatedProgress);
    setState('progressHistories', jobId, [...history, progress.percentage].slice(-5));
  }

  function completeConversion(jobId: string) {
    const existing = state.activeConversions[jobId];
    if (!existing) return;

    setState('activeConversions', jobId, {
      ...existing,
      stage: 'completed' as const,
      percentage: 100,
      currentOperation: 'Conversion complete',
      estimatedTimeRemaining: undefined,
    });
  }

  function clearConversion(jobId: string) {
    // Replace entire records without the cleared job
    const { [jobId]: _, ...restConversions } = state.activeConversions;
    const { [jobId]: __, ...restStartTimes } = state.startTimes;
    const { [jobId]: ___, ...restHistories } = state.progressHistories;

    setState('activeConversions', reconcile(restConversions));
    setState('startTimes', reconcile(restStartTimes));
    setState('progressHistories', reconcile(restHistories));
  }

  function getProgress(jobId: string): ConversionProgress | undefined {
    return state.activeConversions[jobId];
  }

  function getETA(jobId: string): number | undefined {
    return state.activeConversions[jobId]?.estimatedTimeRemaining;
  }

  function getActiveJobIds(): string[] {
    return Object.keys(state.activeConversions);
  }

  function reset() {
    setState(reconcile(structuredClone(initialState)));
  }

  return {
    state,
    startConversion,
    updateProgress,
    completeConversion,
    clearConversion,
    getProgress,
    getETA,
    getActiveJobIds,
    reset,
  };
}

// Module-level singleton for production use
export const progressStore = createProgressStore();
