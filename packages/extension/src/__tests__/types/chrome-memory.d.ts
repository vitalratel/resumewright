/**
 * Chrome-specific Performance Memory API
 * Proper type definitions for performance.memory
 *
 * @see https://developer.chrome.com/docs/devtools/memory-problems/#monitor_memory_use_in_realtime_with_the_performance_monitor
 */

interface PerformanceMemory {
  /** The maximum size of the heap, in bytes, that is available to the context */
  jsHeapSizeLimit: number;

  /** The total allocated heap size, in bytes */
  totalJSHeapSize: number;

  /** The currently active segment of JS heap, in bytes */
  usedJSHeapSize: number;
}

interface Performance {
  /**
   * Chrome DevTools Memory API
   * Only available in Chrome/Chromium browsers
   * Not available in Firefox, Safari, or other browsers
   */
  memory?: PerformanceMemory;
}
