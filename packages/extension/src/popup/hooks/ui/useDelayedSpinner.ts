import { useEffect, useState } from 'react';

/**
 * Custom hook to delay spinner display to prevent janky flashing for fast operations
 *
 * WCAG 2.2.2 (Pause, Stop, Hide): Prevents distracting rapid UI changes
 *
 * @param isLoading - Whether the operation is currently loading
 * @param delayMs - Delay in milliseconds before showing spinner (default: 300ms)
 * @returns boolean indicating whether to show the spinner
 *
 * @example
 * ```tsx
 * const shouldShowSpinner = useDelayedSpinner(isLoading, 300);
 * return shouldShowSpinner ? <Spinner /> : null;
 * ```
 */
export function useDelayedSpinner(
  isLoading: boolean,
  delayMs: number = 300,
): boolean {
  const [shouldShow, setShouldShow] = useState(delayMs === 0);

  useEffect(() => {
    // React 19 pattern: Avoid synchronous setState in useEffect by using setTimeout
    // This prevents cascading renders while maintaining the same behavior

    if (!isLoading) {
      // Hide spinner immediately (asynchronous to avoid cascading render)
      const timer = setTimeout(() => setShouldShow(false), 0);
      return () => clearTimeout(timer);
    }

    if (delayMs === 0) {
      // Show immediately (asynchronous to avoid cascading render)
      const timer = setTimeout(() => setShouldShow(true), 0);
      return () => clearTimeout(timer);
    }

    // Wait for delay before showing
    const timer = setTimeout(() => setShouldShow(true), delayMs);
    return () => clearTimeout(timer);
  }, [isLoading, delayMs]);

  return shouldShow;
}
