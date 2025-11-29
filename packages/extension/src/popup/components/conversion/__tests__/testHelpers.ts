/**
 * Test Helpers for Conversion Components
 *
 * Provides factory functions and helper utilities to reduce
 * boilerplate and improve token efficiency in tests.
 */

import type { ConversionProgress, ConversionStatus } from '@/shared/types/models';
import { useProgressStore } from '../../../store/progressStore';

/**
 * Factory function to create ConversionProgress objects with defaults
 *
 * @example
 * const progress = createProgress({ percentage: 75, eta: 5000 });
 */
export function createProgress(overrides: Partial<ConversionProgress> = {}): ConversionProgress {
  return {
    stage: 'rendering' as ConversionStatus,
    percentage: 50,
    currentOperation: 'Processing...',
    ...overrides,
  };
}

/**
 * Pre-defined progress fixtures for common test scenarios
 */
export const progressFixtures = {
  parsing: createProgress({
    stage: 'parsing',
    percentage: 25,
    currentOperation: 'Parsing TSX code...',
  }),
  rendering: createProgress({
    stage: 'rendering',
    percentage: 40,
    currentOperation: 'Rendering components...',
  }),
  layout: createProgress({
    stage: 'laying-out',
    percentage: 60,
    currentOperation: 'Calculating layout...',
  }),
  pdf: createProgress({
    stage: 'generating-pdf',
    percentage: 80,
    currentOperation: 'Generating PDF...',
  }),
  completed: createProgress({
    stage: 'completed',
    percentage: 100,
    currentOperation: 'Complete',
  }),
};

/**
 * Concise helper API for progress store operations
 * Reduces verbosity of useProgressStore.getState() calls
 *
 * @example
 * progressStore.start(jobId);
 * progressStore.update(jobId, progress);
 * progressStore.reset();
 */
export const progressStore = {
  start: (jobId: string) => useProgressStore.getState().startConversion(jobId),
  update: (jobId: string, progress: ConversionProgress) =>
    useProgressStore.getState().updateProgress(jobId, progress),
  complete: (jobId: string) => useProgressStore.getState().completeConversion(jobId),
  clear: (jobId: string) => useProgressStore.getState().clearConversion(jobId),
  reset: () => useProgressStore.getState().reset(),
  get: (jobId: string) => useProgressStore.getState().getProgress(jobId),
};
