// ABOUTME: Reactive localStorage persistence with cross-tab sync.
// ABOUTME: Signal-based storage access with JSON serialization and error handling.

import type { Accessor } from 'solid-js';
import { createSignal, onCleanup } from 'solid-js';
import { getLogger } from '@/shared/infrastructure/logging/instance';

/**
 * Reactive localStorage binding with cross-tab synchronization.
 *
 * @param key - The localStorage key
 * @param initialValue - The initial value if nothing is stored
 * @returns Object with value accessor and setValue function
 */
export function createLocalStorage<T>(
  key: string,
  initialValue: T,
): {
  value: Accessor<T>;
  setValue: (value: T | ((prev: T) => T)) => void;
} {
  const readFromStorage = (): T => {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item != null && item !== '' ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      getLogger().warn('LocalStorage', `Error reading localStorage key "${key}"`, error);
      return initialValue;
    }
  };

  const [value, setValueSignal] = createSignal<T>(readFromStorage());

  const setValue = (newValue: T | ((prev: T) => T)) => {
    try {
      const resolved =
        typeof newValue === 'function' ? (newValue as (prev: T) => T)(value()) : newValue;

      setValueSignal(() => resolved);
      window.localStorage.setItem(key, JSON.stringify(resolved));
    } catch (error) {
      getLogger().warn('LocalStorage', `Error setting localStorage key "${key}"`, error);
    }
  };

  // Listen for changes in other tabs/windows
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === key && e.newValue !== null) {
      try {
        setValueSignal(() => JSON.parse(e.newValue!) as T);
      } catch (error) {
        getLogger().warn('LocalStorage', `Error parsing storage event for key "${key}"`, error);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);
  onCleanup(() => window.removeEventListener('storage', handleStorageChange));

  return { value, setValue };
}
