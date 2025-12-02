/**
 * Service Worker State
 *
 * Tracks service worker lifecycle state.
 * Extracted to avoid circular dependency with entrypoints/background.ts
 */

/**
 * Service worker start time (milliseconds since epoch)
 * Used for uptime calculation in health checks
 */
let _serviceWorkerStartTime = Date.now();

/**
 * Get service worker start time
 */
export function getServiceWorkerStartTime(): number {
  return _serviceWorkerStartTime;
}

/**
 * Reset start time (for testing purposes)
 */
export function resetServiceWorkerStartTime(): void {
  _serviceWorkerStartTime = Date.now();
}
