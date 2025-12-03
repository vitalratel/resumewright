/**
 * Progress Calculation Utilities
 *
 * Provides ETA calculation and progress formatting for conversion status.
 * Uses velocity-based calculations with fallback to linear projection.
 */

import type { ConversionStatus } from '../types/models';

/**
 * Calculate estimated time remaining (ETA) for conversion
 *
 * Uses velocity-based calculation with fallback to linear projection.
 * Only returns ETA if projected total time > 3 seconds (per architecture requirements).
 *
 * Uses integer arithmetic to avoid floating-point precision issues
 *
 * @param currentPercentage - Current progress (0-100)
 * @param startTime - Conversion start timestamp (ms since epoch)
 * @param progressHistory - Recent progress percentages (last 5 samples)
 * @returns Estimated seconds remaining, or undefined if not applicable
 */
export function calculateETA(
  currentPercentage: number,
  startTime: number,
  progressHistory: number[],
): number | undefined {
  // Don't show ETA at start or end
  if (currentPercentage === 0 || currentPercentage === 100) {
    return undefined;
  }

  const elapsedMs = Date.now() - startTime;

  // Integer arithmetic - project total time in milliseconds
  // elapsed * 100 / currentPercentage (all integers)
  const projectedTotalMs = Math.floor((elapsedMs * 100) / currentPercentage);

  // Don't show ETA if conversion < 3 seconds (architecture requirement)
  if (projectedTotalMs < 3000) {
    return undefined;
  }

  // Velocity-based calculation (if enough history)
  if (progressHistory.length >= 2) {
    const recent = progressHistory.slice(-5); // Last 5 samples
    const velocities: number[] = [];

    for (let i = 1; i < recent.length; i++) {
      velocities.push(recent[i] - recent[i - 1]);
    }

    // Integer sum for velocities
    const velocitySum = velocities.reduce((a, b) => a + b, 0);
    const velocityCount = velocities.length;
    const avgVelocity = Math.floor(velocitySum / velocityCount);

    // Avoid division by zero
    if (avgVelocity === 0) {
      // Fallback to linear projection using integer arithmetic
      const remainingPercentage = 100 - currentPercentage;
      const remainingMs = Math.floor((elapsedMs * remainingPercentage) / currentPercentage);
      return Math.ceil(remainingMs / 1000);
    }

    const remaining = 100 - currentPercentage;
    // Calculate time per percentage point in ms, then multiply
    const progressMade = currentPercentage - progressHistory[0];
    const timePerPercentMs = Math.floor(elapsedMs / progressMade);
    const remainingMs = Math.floor((remaining * timePerPercentMs) / avgVelocity);
    return Math.ceil(remainingMs / 1000);
  }

  // Fallback: linear projection using integer arithmetic
  const remainingPercentage = 100 - currentPercentage;
  const remainingMs = Math.floor((elapsedMs * remainingPercentage) / currentPercentage);
  return Math.ceil(remainingMs / 1000);
}

/**
 * Format time remaining as human-readable string
 *
 * @param seconds - Number of seconds
 * @returns Formatted string (e.g., "5 seconds", "1 minute", "2 minutes")
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds < 1) {
    return 'less than a second';
  }
  if (seconds === 1) {
    return '1 second';
  }
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  if (seconds < 120) {
    return '1 minute';
  }
  return `${Math.floor(seconds / 60)} minutes`;
}

/**
 * Get user-friendly display name for conversion stage
 *
 * @param stage - Conversion status
 * @returns Display name
 */
export function getStageDisplayName(stage: ConversionStatus): string {
  // User-friendly stage names
  const names: Record<ConversionStatus, string> = {
    queued: 'Getting ready...',
    parsing: 'Reading your resume...',
    'extracting-metadata': 'Analyzing content...',
    rendering: 'Creating PDF layout...',
    'laying-out': 'Creating PDF layout...',
    optimizing: 'Optimizing for ATS compatibility...',
    'generating-pdf': 'Generating PDF...',
    completed: 'Complete',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };
  return names[stage] || stage;
}

/**
 * Get icon for conversion stage
 *
 * @param stage - Conversion status
 * @returns Emoji icon
 */
export function getStageIcon(stage: ConversionStatus): string {
  const icons: Record<ConversionStatus, string> = {
    queued: '⏳',
    parsing: '📄',
    'extracting-metadata': '🔍',
    rendering: '🎨',
    'laying-out': '📐',
    optimizing: '⚡',
    'generating-pdf': '📋',
    completed: '✅',
    failed: '❌',
    cancelled: '🚫',
  };
  return icons[stage] || '⚙️';
}
