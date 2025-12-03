/**
 * WASM Readiness Helpers
 * Utilities for checking WASM initialization status in popup and service worker.
 */

import type { BrowserContext, Page } from '@playwright/test';
import { type ConsoleLogEntry, setupConsoleCapture } from './diagnostics';

/**
 * WASM readiness check result
 */
interface WasmReadinessResult {
  /** Whether WASM is ready */
  ready: boolean;
  /** Time taken to become ready (ms) */
  durationMs: number;
  /** Console logs captured during check */
  logs: ConsoleLogEntry[];
  /** Error message if not ready */
  error?: string;
}

/**
 * Check if WASM is ready by polling for initialization signals
 *
 * Waits for the WASM compatibility check to complete and the converter to be initialized.
 * This is more reliable than just waiting for the file input to appear.
 *
 * @param page - Popup page
 * @param timeout - Maximum time to wait (default: 15000ms)
 * @returns WASM readiness result with diagnostics
 *
 * @example
 * ```typescript
 * const result = await waitForWasmReady(page);
 * if (!result.ready) {
 *   console.error('WASM not ready:', result.error);
 *   console.log('Logs:', result.logs);
 * }
 * ```
 */
async function waitForWasmReady(page: Page, timeout = 20000): Promise<WasmReadinessResult> {
  const startTime = Date.now();
  const logs = setupConsoleCapture(page);

  try {
    // STEP 1: Wait for WASM initialization log to appear
    // This ensures WASM is actually initialized, not just that the DOM is ready
    await page
      .waitForFunction(
        () => {
          // Access console logs captured by our listener
          // The log format is: "[useWasmCompatibility] WASM initialized successfully"
          return Boolean(window.console); // Placeholder - we'll check logs array instead
        },
        { timeout: Math.min(timeout, 5000), polling: 100 },
      )
      .catch(() => {
        // Timeout on this step is OK - we'll check logs afterward
      });

    // Wait for the actual console log to be captured
    const logCheckStartTime = Date.now();
    const logCheckTimeout = 5000; // 5s to capture the log
    let hasInitLog = false;

    while (Date.now() - logCheckStartTime < logCheckTimeout) {
      hasInitLog = logs.some(
        (log) =>
          log.text.includes('[useWasmCompatibility] WASM initialized successfully') ||
          log.text.includes('WASM initialized successfully') ||
          log.text.includes('WASM compatibility check passed'),
      );

      if (hasInitLog) {
        break;
      }

      // Check for error state
      const hasError = logs.some(
        (log) => log.type === 'error' && log.text.toLowerCase().includes('wasm'),
      );

      if (hasError) {
        throw new Error('WASM initialization error detected in console logs');
      }

      await page.waitForTimeout(100);
    }

    // STEP 2: Wait for UI to be ready (file input visible)
    // This ensures the React component has fully rendered
    await page.waitForFunction(
      () => {
        // Check if the file input is visible (only appears after WASM is ready)
        const fileInput = document.querySelector('[data-testid="file-input"]');
        if (!fileInput) return false;

        // Also check that we're not showing an error state
        const errorElement = document.querySelector('[role="alert"]');
        if (errorElement?.textContent?.includes('WASM')) return false;

        return true;
      },
      { timeout: Math.max(0, timeout - (Date.now() - startTime)), polling: 100 },
    );

    const durationMs = Date.now() - startTime;

    // Verify we got the initialization log
    if (!hasInitLog) {
      console.warn('[waitForWasmReady] WASM UI ready but no initialization log found');
      console.warn(
        '[waitForWasmReady] Captured logs:',
        logs.map((l) => l.text),
      );
    }

    return {
      ready: true,
      durationMs,
      logs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    return {
      ready: false,
      durationMs,
      logs,
      error: errorMsg,
    };
  }
}

/**
 * Service worker WASM readiness check result
 */
interface ServiceWorkerWasmReadinessResult {
  /** Whether service worker WASM is ready */
  ready: boolean;
  /** Time taken to become ready (ms) */
  durationMs: number;
  /** Error message if not ready */
  error?: string;
  /** Console logs captured from service worker via CDP */
  logs: string[];
}

/**
 * Wait for service worker WASM to be initialized
 *
 * Uses chrome.storage polling since service worker logs are not easily captured.
 * The service worker should set a flag or the converter should be accessible
 * after WASM initialization completes.
 *
 * @param context - Playwright browser context
 * @param timeout - Max wait time in milliseconds (default: 10000ms)
 * @returns Promise resolving when service worker WASM is ready
 *
 * @example
 * ```typescript
 * const result = await waitForServiceWorkerWasmReady(context);
 * if (!result.ready) {
 *   console.error('Service worker WASM not ready:', result.error);
 * }
 * ```
 */
async function waitForServiceWorkerWasmReady(
  context: BrowserContext,
  timeout = 15000,
): Promise<ServiceWorkerWasmReadinessResult> {
  const startTime = Date.now();
  const logs: string[] = [];

  try {
    // Get service workers
    const serviceWorkers = context.serviceWorkers();
    if (serviceWorkers.length === 0) {
      return {
        ready: false,
        durationMs: Date.now() - startTime,
        error: 'No service workers found',
        logs: ['[SW Check] No service workers found in context'],
      };
    }

    const serviceWorker = serviceWorkers[0];
    logs.push(`[SW Check] Service worker found, polling storage for WASM status...`);

    // Poll chrome.storage for WASM status
    const endTime = startTime + timeout;
    let backgroundScriptDetected = false;
    while (Date.now() < endTime) {
      try {
        // Read WASM status AND diagnostic flag from storage
        interface StorageResult {
          wasmStatus?: 'success' | 'failed' | 'initializing';
          wasmInitTime?: number;
          wasmInitError?: string;
          backgroundScriptLoaded?: boolean;
          loadTime?: number;
        }

        const result = await serviceWorker.evaluate(async (): Promise<StorageResult> => {
          // @ts-expect-error - Service worker context has chrome global
          const storage: StorageResult = await chrome.storage.local.get([
            'wasmStatus',
            'wasmInitTime',
            'wasmInitError',
            'backgroundScriptLoaded', // DIAGNOSTIC
            'loadTime', // DIAGNOSTIC
          ]);
          return storage;
        });

        logs.push(`[SW Check] Storage poll: ${JSON.stringify(result)}`);

        // DIAGNOSTIC: Check if background script is even running
        if (result.backgroundScriptLoaded === true && !backgroundScriptDetected) {
          backgroundScriptDetected = true;
          logs.push(
            `[SW Check] ✅ DIAGNOSTIC: Background script is running (loadTime: ${result.loadTime ?? 'unknown'})`,
          );
        }

        if (result.wasmStatus === 'success') {
          logs.push(
            `[SW Check] WASM initialized successfully at ${result.wasmInitTime ?? 'unknown'}`,
          );
          return {
            ready: true,
            durationMs: Date.now() - startTime,
            logs,
          };
        }

        if (result.wasmStatus === 'failed') {
          logs.push(`[SW Check] WASM initialization failed: ${result.wasmInitError ?? 'unknown'}`);
          return {
            ready: false,
            durationMs: Date.now() - startTime,
            error: `WASM init failed: ${result.wasmInitError ?? 'Unknown error'}`,
            logs,
          };
        }

        // Status is 'initializing' or undefined, keep polling
      } catch (evalError) {
        logs.push(
          `[SW Check] Evaluation error: ${evalError instanceof Error ? evalError.message : String(evalError)}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Timeout reached
    logs.push(`[SW Check] Timeout reached after ${timeout}ms`);
    if (!backgroundScriptDetected) {
      logs.push(
        `[SW Check] ❌ DIAGNOSTIC: Background script NEVER wrote to storage - script may not be loading at all!`,
      );
    }
    return {
      ready: false,
      durationMs: Date.now() - startTime,
      error: backgroundScriptDetected
        ? 'Timeout waiting for service worker WASM status in storage'
        : 'Background script never loaded (no storage writes detected)',
      logs,
    };
  } catch (error) {
    logs.push(`[SW Check] Exception: ${error instanceof Error ? error.message : String(error)}`);
    return {
      ready: false,
      durationMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
      logs,
    };
  }
}

/**
 * Combined WASM readiness check result
 */
interface BothWasmReadinessResult {
  /** Whether popup WASM is ready */
  popupReady: boolean;
  /** Whether service worker WASM is ready */
  serviceWorkerReady: boolean;
  /** Time taken for popup WASM to be ready (ms) */
  popupDurationMs: number;
  /** Time taken for service worker WASM to be ready (ms) */
  serviceWorkerDurationMs: number;
  /** Console logs captured from service worker via CDP */
  serviceWorkerLogs: string[];
  /** Error message if either is not ready */
  error?: string;
}

/**
 * Wait for BOTH popup and service worker WASM to be ready
 *
 * Convenience helper that checks both contexts to ensure complete
 * WASM initialization before running tests that depend on conversion.
 *
 * @param page - Playwright page (popup)
 * @param context - Playwright browser context
 * @param timeout - Max wait time in milliseconds (default: 10000ms)
 * @returns Promise resolving when both are ready
 *
 * @example
 * ```typescript
 * const result = await waitForBothWasmReady(page, context);
 * if (!result.popupReady || !result.serviceWorkerReady) {
 *   console.error('WASM not ready:', result.error);
 * }
 * ```
 */
export async function waitForBothWasmReady(
  page: Page,
  context: BrowserContext,
  timeout = 20000,
): Promise<BothWasmReadinessResult> {
  const startTime = Date.now();

  // Check popup WASM
  const popupResult = await waitForWasmReady(page, timeout);

  if (!popupResult.ready) {
    return {
      popupReady: false,
      serviceWorkerReady: false,
      popupDurationMs: popupResult.durationMs,
      serviceWorkerDurationMs: 0,
      serviceWorkerLogs: [],
      error: `Popup WASM not ready: ${popupResult.error}`,
    };
  }

  // Check service worker WASM with CDP
  const remainingTimeout = Math.max(0, timeout - (Date.now() - startTime));
  const swResult = await waitForServiceWorkerWasmReady(context, remainingTimeout);

  return {
    popupReady: popupResult.ready,
    serviceWorkerReady: swResult.ready,
    popupDurationMs: popupResult.durationMs,
    serviceWorkerDurationMs: swResult.durationMs,
    serviceWorkerLogs: swResult.logs ?? [],
    error: swResult.ready ? undefined : swResult.error,
  };
}
