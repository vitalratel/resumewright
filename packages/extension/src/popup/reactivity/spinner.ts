// ABOUTME: Delays spinner display to prevent janky flashing for fast operations.
// ABOUTME: WCAG 2.2.2 compliant - prevents distracting rapid UI changes.

import { createSignal, onCleanup } from 'solid-js';

/**
 * @param delayMs - Delay in milliseconds before showing spinner (default: 300ms)
 * @returns accessor returning whether to show the spinner
 */
export function useDelayedSpinner(delayMs: number = 300): () => boolean {
  const [shouldShow, setShouldShow] = createSignal(delayMs === 0);

  if (delayMs > 0) {
    const timer = setTimeout(() => setShouldShow(true), delayMs);
    onCleanup(() => clearTimeout(timer));
  }

  return shouldShow;
}
