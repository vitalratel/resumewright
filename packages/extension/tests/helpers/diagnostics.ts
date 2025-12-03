/**
 * Diagnostics and Console Capture Helpers
 * Utilities for capturing console logs and diagnostic information in E2E tests.
 */

import type { Page } from '@playwright/test';

/**
 * Console log collector
 */
export interface ConsoleLogEntry {
  type: 'log' | 'error' | 'warn' | 'info' | 'debug';
  text: string;
  timestamp: number;
  args?: unknown[];
}

/**
 * Enhanced console log collector
 *
 * Captures all console logs with timestamps and stores them for later analysis.
 *
 * @param page - Page to monitor
 * @returns Array of collected logs (updated in real-time)
 *
 * @example
 * ```typescript
 * const logs = setupConsoleCapture(page);
 * // ... perform actions ...
 * console.log('Captured logs:', logs);
 * ```
 */
export function setupConsoleCapture(page: Page): ConsoleLogEntry[] {
  const logs: ConsoleLogEntry[] = [];

  // Capture console messages
  page.on('console', async (msg) => {
    const entry: ConsoleLogEntry = {
      type: msg.type() as ConsoleLogEntry['type'],
      text: msg.text(),
      timestamp: Date.now(),
    };

    // Try to get full args for better diagnostics
    try {
      const args: unknown[] = await Promise.all(
        msg
          .args()
          .map(
            async (arg): Promise<unknown> =>
              arg.jsonValue().catch(() => '[unable to serialize]' as unknown),
          ),
      );
      if (args.length > 0) {
        entry.args = args;
      }
    } catch {
      // Args might not be serializable, that's ok
    }

    logs.push(entry);
    console.warn(`[BROWSER ${entry.type.toUpperCase()}]`, entry.text);
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    const entry: ConsoleLogEntry = {
      type: 'error',
      text: error.message,
      timestamp: Date.now(),
    };
    logs.push(entry);
    console.error('[BROWSER PAGE ERROR]', error.message);
  });

  return logs;
}

/**
 * Diagnostic info for debugging
 */
interface DiagnosticInfo {
  /** Browser console logs */
  consoleLogs: ConsoleLogEntry[];
  /** Page HTML snapshot */
  html: string;
  /** Current URL */
  url: string;
  /** Visible text content */
  textContent: string;
  /** Network activity (if available) */
  networkRequests?: string[];
}

/**
 * Capture comprehensive diagnostic information
 *
 * Captures page state for debugging test failures.
 *
 * @param page - Page to capture diagnostics from
 * @param logs - Previously collected console logs
 * @returns Diagnostic information
 *
 * @example
 * ```typescript
 * const diagnostics = await captureDiagnostics(page, logs);
 * console.log('Diagnostics:', JSON.stringify(diagnostics, null, 2));
 * ```
 */
export async function captureDiagnostics(
  page: Page,
  logs: ConsoleLogEntry[],
): Promise<DiagnosticInfo> {
  const html = await page.content();
  const url = page.url();
  const textContent = await page.evaluate(() => document.body.textContent || '');

  return {
    consoleLogs: logs,
    html,
    url,
    textContent,
  };
}

/**
 * Measure conversion duration
 *
 * @param action - Async action to measure
 * @returns Duration in milliseconds
 *
 * @example
 * ```typescript
 * const duration = await measureDuration(async () => {
 *   await exportButton.click();
 *   await downloadPromise;
 * });
 * expect(duration).toBeLessThan(5000);
 * ```
 */
export async function measureDuration(action: () => Promise<void>): Promise<number> {
  const startTime = Date.now();
  await action();
  return Date.now() - startTime;
}
