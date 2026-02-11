/**
 * Test Helpers for Conversion Components
 *
 * Provides factory functions and helper utilities to reduce
 * boilerplate and improve token efficiency in tests.
 */

import type { ConversionProgress, ConversionStatus } from '@/shared/types/models';
import { progressStore as solidProgressStore } from '../../../store/progressStore';

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
 * Reduces verbosity of direct progressStore singleton calls
 *
 * @example
 * progressStore.start(jobId);
 * progressStore.update(jobId, progress);
 * progressStore.reset();
 */
export const progressStore = {
  start: (jobId: string) => solidProgressStore.startConversion(jobId),
  update: (jobId: string, progress: ConversionProgress) =>
    solidProgressStore.updateProgress(jobId, progress),
  complete: (jobId: string) => solidProgressStore.completeConversion(jobId),
  clear: (jobId: string) => solidProgressStore.clearConversion(jobId),
  reset: () => solidProgressStore.reset(),
  get: (jobId: string) => solidProgressStore.getProgress(jobId),
};
