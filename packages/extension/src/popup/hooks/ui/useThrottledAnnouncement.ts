// ABOUTME: Throttles announcements based on value delta and time interval.
// ABOUTME: Prevents screen reader announcements from firing too frequently.

import type { Accessor } from 'solid-js';
import { createEffect, createSignal } from 'solid-js';

/**
 * Throttles announcements based on value delta and time interval.
 * Returns an accessor indicating whether to announce.
 *
 * @param value - Accessor for the value to monitor (e.g., progress percentage)
 * @param threshold - Accessor for minimum change to trigger announcement (default: 10)
 * @param minInterval - Accessor for minimum time between announcements in ms (default: 5000)
 * @returns Accessor<boolean> indicating whether to announce
 */
export function createThrottledAnnouncement(
  value: Accessor<number>,
  threshold: Accessor<number> = () => 10,
  minInterval: Accessor<number> = () => 5000,
): Accessor<boolean> {
  let lastAnnouncedValue = 0;
  let lastAnnouncedTime = Date.now();

  const [shouldAnnounce, setShouldAnnounce] = createSignal(true);
  let initialized = false;

  createEffect(() => {
    const currentValue = value();
    const currentThreshold = threshold();
    const currentMinInterval = minInterval();

    // First run: keep initial announcement as true
    if (!initialized) {
      initialized = true;
      lastAnnouncedValue = currentValue;
      lastAnnouncedTime = Date.now();
      return;
    }

    const valueDelta = Math.abs(currentValue - lastAnnouncedValue);
    const timeDelta = Date.now() - lastAnnouncedTime;

    if (valueDelta >= currentThreshold || timeDelta >= currentMinInterval) {
      lastAnnouncedValue = currentValue;
      lastAnnouncedTime = Date.now();
      setShouldAnnounce(true);
    } else {
      setShouldAnnounce(false);
    }
  });

  return shouldAnnounce;
}
