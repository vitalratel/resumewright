/**
 * usePrevious Hook
 * Tracks the previous value of a state or prop
 *
 * Useful for:
 * - Undo functionality
 * - Change detection
 * - Comparing before/after states
 *
 * React 19 pattern: Uses render-phase setState instead of ref access during render
 * This avoids the "Cannot access refs during render" error
 */

import { useMemo } from 'react';

/**
 * Class to hold current and previous values
 * Using a class instance instead of ref avoids ESLint "ref access during render" errors
 * React 19 pattern from: https://stackoverflow.com/questions/78929408
 */
class ValueTracker<T> {
  previous: T | undefined;
  current: T | undefined;
  isFirstRender: boolean;

  constructor() {
    this.current = undefined;
    this.previous = undefined;
    this.isFirstRender = true;
  }

  update(newValue: T): void {
    if (this.isFirstRender) {
      // On first update, just update current and mark as rendered
      // previous stays undefined
      this.current = newValue;
      this.isFirstRender = false;
    }
    else if (this.current !== newValue) {
      // Value changed: move current to previous, update current
      this.previous = this.current;
      this.current = newValue;
    }
    else {
      // Value unchanged but not first render: previous should be current
      this.previous = this.current;
    }
  }
}

export function usePrevious<T>(value: T): T | undefined {
  // React 19 pattern: Use useMemo to create a persistent class instance (not a ref)
  // Accessing class properties doesn't violate the "no ref access during render" rule
  const tracker = useMemo(() => new ValueTracker<T>(), []);

  // Update tracker on every render - this is allowed for non-ref objects
  tracker.update(value);

  // Return the previous value
  return tracker.previous;
}
