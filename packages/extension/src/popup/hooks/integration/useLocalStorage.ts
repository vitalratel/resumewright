/**
 * useLocalStorage Hook
 * Persist UI preferences in localStorage
 * SSR-safe localStorage access
 *
 * A React hook for syncing state with localStorage.
 * Similar to useState but persists value in localStorage.
 * Safe to use in SSR contexts (checks for window availability).
 *
 * @template T - The type of the stored value
 * @param key - The localStorage key
 * @param initialValue - The initial value if nothing is stored
 * @returns [storedValue, setValue] - Tuple like useState
 *
 * @example
 * const [count, setCount] = useLocalStorage('count', 0);
 */

import { useCallback, useEffect, useState } from 'react';
import { getLogger } from '@/shared/infrastructure/logging';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Check if window and localStorage are available (SSR-safe)
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return initialValue;
    }

    try {
      // Get from localStorage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or return initialValue
      return (item != null && item !== '') ? (JSON.parse(item) as T) : initialValue;
    }
    catch (error) {
      // If error also return initialValue
      getLogger().warn('LocalStorage', `Error reading localStorage key "${key}"`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      // Check if window and localStorage are available (SSR-safe)
      if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
        getLogger().warn('LocalStorage', `Cannot set localStorage key "${key}": localStorage not available`);
        return;
      }

      try {
        // Allow value to be a function so we have same API as useState
        // CRITICAL: Use functional update to avoid stale closure over storedValue
        setStoredValue((prevValue) => {
          const valueToStore = typeof value === 'function' ? (value as (val: T) => T)(prevValue) : value;

          // Save to localStorage
          window.localStorage.setItem(key, JSON.stringify(valueToStore));

          return valueToStore;
        });
      }
      catch (error) {
        // A more advanced implementation would handle the error case
        getLogger().warn('LocalStorage', `Error setting localStorage key "${key}"`, error);
      }
    },
    [key],
  );

  // Listen for changes to this key in other tabs/windows
  useEffect(() => {
    // Check if window is available (SSR-safe)
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        }
        catch (error) {
          getLogger().warn('LocalStorage', `Error parsing storage event for key "${key}"`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}
