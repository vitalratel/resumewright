/**
 * useDebounce Hook
 * Debounces a value by delaying updates
 *
 * Useful for:
 * - Auto-save functionality
 * - Search input
 * - Performance optimization (reducing re-renders)
 */

import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
