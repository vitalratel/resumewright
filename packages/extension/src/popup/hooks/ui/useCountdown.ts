/**
 * useCountdown Hook
 *
 * Provides countdown timer functionality with auto-trigger callback
 * Useful for auto-close modals, toasts, or timed actions
 */

import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for countdown timer with completion callback
 * Added pause/resume functionality
 *
 * @param initialSeconds - Initial countdown value in seconds (undefined = no countdown)
 * @param onComplete - Optional callback invoked when countdown reaches 0
 * @returns Object with countdown value, isPaused state, and pause/resume functions
 *
 * @example
 * const { countdown, isPaused, pause, resume } = useCountdown(5, () => {
 *   console.log('Countdown complete!');
 *   closeModal();
 * });
 *
 * {countdown !== undefined && (
 *   <div>
 *     <p>Closing in {countdown}s...</p>
 *     <button onClick={isPaused ? resume : pause}>
 *       {isPaused ? 'Resume' : 'Pause'}
 *     </button>
 *   </div>
 * )}
 */
export function useCountdown(
  initialSeconds: number | undefined,
  onComplete?: () => void,
): {
  countdown: number | undefined;
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
} {
  const [countdown, setCountdown] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [lastInitialSeconds, setLastInitialSeconds] = useState(initialSeconds);

  // React 19 pattern: Render-phase setState to synchronize with prop changes
  // This avoids cascading renders from setState in useEffect
  if (initialSeconds !== lastInitialSeconds && initialSeconds !== undefined) {
    setCountdown(initialSeconds);
    setLastInitialSeconds(initialSeconds);
  }

  useEffect(() => {
    if (countdown === undefined || countdown === 0) return;

    // Only run timer when not paused
    if (isPaused) return;

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

    return () => clearInterval(timer);
  }, [countdown, isPaused, onComplete]);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  return { countdown, isPaused, pause, resume };
}
