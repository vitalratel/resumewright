/**
 * Progress Throttling Utility
 *
 * Throttles progress updates to configurable intervals (default 100ms).
 * Always emits 0% and 100% immediately for visibility.
 */

/**
 * Throttle progress callback to emit at most once per interval
 *
 * Always emits 100% progress immediately to ensure completion is visible.
 * Stores pending updates and emits them after the interval.
 *
 * @param callback - Progress callback function
 * @param interval - Throttle interval in milliseconds (default: 500)
 * @returns Throttled callback function
 */
export function throttleProgress(
  callback: (stage: string, percentage: number) => void,
  interval = 100, // Changed from 500ms to 100ms
): (stage: string, percentage: number) => void {
  let lastEmitTime = 0;
  let lastEmittedPercentage = -1;
  let pendingUpdate: [string, number] | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (stage: string, percentage: number) => {
    // Only emit at 10% increments (0, 10, 20, ..., 100)
    // Always emit 0% and 100% immediately
    const isIncrementBoundary = percentage % 10 === 0;
    const isInitial = percentage === 0;
    const isFinal = percentage === 100;
    const isDifferentIncrement = Math.floor(percentage / 10) !== Math.floor(lastEmittedPercentage / 10);

    // Always emit final update (100%) immediately
    if (isFinal) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      callback(stage, percentage);
      lastEmitTime = Date.now();
      lastEmittedPercentage = percentage;
      pendingUpdate = null;
      return;
    }

    // Always emit initial update (0%) immediately
    if (isInitial) {
      callback(stage, percentage);
      lastEmitTime = Date.now();
      lastEmittedPercentage = percentage;
      pendingUpdate = null;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      return;
    }

    // Skip non-increment values unless they're on a new 10% boundary
    if (!isIncrementBoundary && !isDifferentIncrement) {
      return;
    }

    const now = Date.now();
    if (now - lastEmitTime >= interval) {
      // Emit immediately if we've crossed into a new 10% increment
      if (isIncrementBoundary || isDifferentIncrement) {
        callback(stage, percentage);
        lastEmitTime = now;
        lastEmittedPercentage = percentage;
        pendingUpdate = null;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    }
    else {
      // Store pending update for next 10% increment
      if (isIncrementBoundary || isDifferentIncrement) {
        pendingUpdate = [stage, percentage];
        if (!timeoutId) {
          timeoutId = setTimeout(() => {
            if (pendingUpdate) {
              callback(...pendingUpdate);
              lastEmitTime = Date.now();
              lastEmittedPercentage = pendingUpdate[1];
              pendingUpdate = null;
            }
            timeoutId = null;
          }, interval - (now - lastEmitTime));
        }
      }
    }
  };
}
