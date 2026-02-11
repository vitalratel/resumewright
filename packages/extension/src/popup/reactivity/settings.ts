// ABOUTME: Settings-related reactive functions for form state management.
// ABOUTME: Provides unsaved changes detection via deep equality comparison.

import type { Accessor } from 'solid-js';

/**
 * Deep equality check for reliable dirty detection.
 * Handles nested objects, arrays, and edge cases.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => Object.hasOwn(bObj, key) && deepEqual(aObj[key], bObj[key]));
}

/**
 * Track unsaved changes by comparing current and original state.
 *
 * @param current - Accessor for current state
 * @param original - Accessor for original baseline state
 * @returns Object with isDirty derived accessor
 */
export function createUnsavedChanges<T>(
  current: Accessor<T | null>,
  original: Accessor<T | null>,
): { isDirty: Accessor<boolean> } {
  const isDirty = () => {
    const curr = current();
    const orig = original();
    if (curr === null || curr === undefined || orig === null || orig === undefined) {
      return false;
    }
    return !deepEqual(curr, orig);
  };

  return { isDirty };
}
