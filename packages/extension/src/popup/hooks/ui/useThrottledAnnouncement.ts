/**
 * useThrottledAnnouncement Hook
 * Extracted from ConvertingState for reusability
 *
 * Throttles announcements based on value delta and time interval.
 * Useful for screen reader announcements that shouldn't fire too frequently.
 *
 * @param value - The value to monitor (e.g., progress percentage)
 * @param threshold - Minimum change in value to trigger announcement (default: 10)
 * @param minInterval - Minimum time between announcements in ms (default: 5000)
 * @returns boolean indicating whether to announce
 */

import { useEffect, useRef, useState } from 'react';

export function useThrottledAnnouncement(
  value: number,
  threshold: number = 10,
  minInterval: number = 5000,
): boolean {
  const lastValueRef = useRef(0);
  // React 19 pattern: Use lazy initialization for impure functions like Date.now()
  const [lastTime, setLastTime] = useState(() => Date.now());
  const [shouldAnnounce, setShouldAnnounce] = useState(true);

  // Reset when threshold or minInterval changes
  useEffect(() => {
    lastValueRef.current = 0;
    const timer = setTimeout(() => setLastTime(Date.now()), 0);
    return () => clearTimeout(timer);
  }, [threshold, minInterval]);

  useEffect(() => {
    const valueDelta = Math.abs(value - lastValueRef.current);
    const timeDelta = Date.now() - lastTime;

    // React 19 pattern: Use setTimeout to avoid synchronous setState in useEffect
    // Assign to variable for proper cleanup
    let timer: NodeJS.Timeout;
    if (valueDelta >= threshold || timeDelta >= minInterval) {
      lastValueRef.current = value;
      const now = Date.now();
      timer = setTimeout(() => {
        setLastTime(now);
        setShouldAnnounce(true);
      }, 0);
    }
    else {
      // Only update state if it changed to prevent unnecessary re-renders
      timer = setTimeout(() => setShouldAnnounce(prev => prev ? false : prev), 0);
    }

    return () => clearTimeout(timer);
  }, [value, threshold, minInterval, lastTime]);

  return shouldAnnounce;
}
