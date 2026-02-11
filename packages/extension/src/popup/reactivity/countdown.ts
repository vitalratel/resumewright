// ABOUTME: Pausable countdown timer with completion callback.
// ABOUTME: Used for auto-close modals and timed actions (WCAG 2.2.1 compliant).

import type { Accessor } from 'solid-js';
import { createEffect, createSignal, onCleanup, untrack } from 'solid-js';

/**
 * Countdown timer with pause/resume and completion callback
 *
 * @param initialSeconds - Initial countdown value in seconds (undefined = no countdown)
 * @param onComplete - Optional callback invoked when countdown reaches 0
 * @returns Object with countdown accessor, isPaused accessor, and pause/resume functions
 */
export function createCountdown(
  initialSeconds: number | undefined,
  onComplete?: () => void,
): {
  countdown: Accessor<number | undefined>;
  isPaused: Accessor<boolean>;
  pause: () => void;
  resume: () => void;
} {
  const [countdown, setCountdown] = createSignal(initialSeconds);
  const [isPaused, setIsPaused] = createSignal(false);

  createEffect(() => {
    if (isPaused()) return;

    const current = untrack(() => countdown());
    if (current === undefined || current === 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === undefined || prev <= 1) {
          clearInterval(timer);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    onCleanup(() => clearInterval(timer));
  });

  return {
    countdown,
    isPaused,
    pause: () => setIsPaused(true),
    resume: () => setIsPaused(false),
  };
}
