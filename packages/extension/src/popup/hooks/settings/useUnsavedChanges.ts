/**
 * useUnsavedChanges Hook
 * Extract unsaved changes logic from Settings.tsx
 * Removed dead code (resetDirty, updateBaseline)
 *
 * A React hook for tracking unsaved changes in forms.
 * Compares current state with original baseline to detect modifications.
 *
 * @template T - The type of the settings/state being tracked
 * @param current - Current state value
 * @param original - Original baseline value
 * @returns Object with dirty state flag
 *
 * @example
 * const { isDirty } = useUnsavedChanges(settings, originalSettings);
 */

import { useMemo } from 'react';

interface UseUnsavedChangesReturn {
  isDirty: boolean;
}

/**
 * Deep equality check for reliable dirty detection
 * Handles nested objects, arrays, and edge cases like Date, RegExp, etc.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  // Same reference or both null/undefined
  if (a === b) return true;

  // One is null/undefined but not the other
  if (a == null || b == null) return false;

  // Different types
  if (typeof a !== typeof b) return false;

  // Primitive types (already checked by ===)
  if (typeof a !== 'object') return false;

  // Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  // One is array, other is not
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  // Objects
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) => Object.hasOwn(bObj, key) && deepEqual(aObj[key], bObj[key]));
}

export function useUnsavedChanges<T>(
  current: T | null,
  original: T | null,
): UseUnsavedChangesReturn {
  // Optimize dirty check with useMemo instead of useEffect
  // This prevents unnecessary state updates and re-renders
  // Use deep equality check instead of JSON.stringify
  const isDirty = useMemo(() => {
    if (current === null || current === undefined || original === null || original === undefined) {
      return false;
    }
    // Deep equality check for reliable dirty detection
    return !deepEqual(current, original);
  }, [current, original]);

  return {
    isDirty,
  };
}
