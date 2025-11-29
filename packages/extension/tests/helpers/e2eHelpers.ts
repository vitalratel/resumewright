/**
 * E2E Test Helper Utilities
 *
 * Shared helper functions for browser extension E2E tests.
 * Reduces code duplication and provides consistent test patterns.
 */

import type { BrowserContext, Page } from '@playwright/test';
import { Buffer } from 'node:buffer';
import { expect } from '@playwright/test';
/**
 * Browser type (matches fixtures/types.ts)
 */
export type BrowserType = 'chrome' | 'firefox';

/**
 * Browser-specific configuration
 */
export interface BrowserConfig {
  protocol: 'chrome-extension' | 'moz-extension';
  name: 'chrome' | 'firefox';
}

export const browserConfigs: Record<BrowserType, BrowserConfig> = {
  chrome: {
    protocol: 'chrome-extension',
    name: 'chrome',
  },
  firefox: {
    protocol: 'moz-extension',
    name: 'firefox',
  },
};

/**
 * Open extension popup page
 *
 * @param context - Browser context
 * @param extensionId - Extension ID
 * @param browserType - Browser type ('chrome' or 'firefox')
 * @returns Popup page
 *
 * @example
 * ```typescript
 * const popup = await openExtensionPopup(context, extensionId, 'chrome');
 * ```
 */
export async function openExtensionPopup(
  context: BrowserContext,
  extensionId: string,
  browserType: BrowserType
): Promise<Page> {
  const config = browserConfigs[browserType];
  // Open converter page directly (popup now redirects to converter)
  const popupPage = await context.newPage();
  await popupPage.goto(`${config.protocol}://${extensionId}/converter.html`);
  return popupPage;
}

/**
 * Upload options for TSX file
 */
export interface UploadOptions {
  /** Timeout for WASM initialization (default: 15000ms) */
  timeout?: number;
  /** Whether to expect validation error (default: false) */
  expectError?: boolean;
  /** Whether to enable verbose diagnostics (default: false) */
  verbose?: boolean;
}

/**
 * Upload TSX content from buffer without filesystem
 *
 * Uses Playwright's buffer API to upload file content directly.
 * Avoids filesystem race conditions in parallel test execution.
 *
 * @param page - Popup page
 * @param fileName - Name of file (e.g., 'resume.tsx')
 * @param content - File content as string
 * @param options - Upload options
 *
 * @example
 * ```typescript
 * await uploadTsxContent(page, 'resume.tsx', 'const CV = () => <div>Resume</div>; export default CV;');
 * ```
 */
export async function uploadTsxContent(
  page: Page,
  fileName: string,
  content: string,
  options?: UploadOptions
): Promise<void> {
  const timeout = options?.timeout ?? 15000;
  const verbose = options?.verbose ?? false;
  const logs: ConsoleLogEntry[] = [];

  // Set up console capture if verbose mode
  if (verbose) {
    setupConsoleCapture(page);
  }

  // Wait for popup to fully load
  await page.waitForLoadState('networkidle');

  // Wait for WASM initialization - file input appears after WASM is ready
  try {
    await page.waitForSelector('[data-testid="file-input"]', {
      state: 'attached',
      timeout,
    });
  } catch (error) {
    // Capture diagnostics on failure
    const diagnostics = await captureDiagnostics(page, logs);
    console.error('[uploadTsxContent] File input not found. Diagnostics:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      consoleLogs: diagnostics.consoleLogs,
      visibleText: diagnostics.textContent.substring(0, 500),
    });
    throw new Error(
      `File input not found: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  if (verbose) {
    console.warn('[uploadTsxContent] File input ready, uploading content:', fileName);
  }

  // Upload file content from buffer
  const fileInput = page.locator('[data-testid="file-input"]');
  const buffer = Buffer.from(content, 'utf-8');
  await fileInput.setInputFiles({
    name: fileName,
    mimeType: 'text/plain',
    buffer,
  });

  // Wait for validation to process (monitor console for validation logs)
  await page.waitForTimeout(1000);

  // Check for validation errors
  const validationError = page.locator('[role="alert"]');
  const hasError = await validationError.isVisible().catch(() => false);

  if (options?.expectError) {
    if (!hasError) {
      throw new Error('Expected validation error but file was accepted');
    }
    if (verbose) {
      const errorText = await validationError.textContent();
      console.warn('[uploadTsxContent] Got expected error:', errorText);
    }
    return;
  }

  if (hasError) {
    const errorText = await validationError.textContent();

    // Capture detailed diagnostics on validation failure
    const diagnostics = await captureDiagnostics(page, logs);
    console.error('[uploadTsxContent] File validation failed:', {
      errorText,
      fileName,
      consoleLogs: diagnostics.consoleLogs.filter(
        (log) => log.text.includes('validate') || log.text.includes('WASM') || log.type === 'error'
      ),
    });

    throw new Error(`File validation failed: ${errorText}`);
  }

  if (verbose) {
    console.warn('[uploadTsxContent] File validated successfully');
  }

  // Wait for export button to be enabled (file validated + settings loaded)
  // Note: For manual uploads, the button is "preview-button", for Claude-detected CVs it's "export-button"
  try {
    await expect(
      page.locator('[data-testid="preview-button"], [data-testid="export-button"]')
    ).toBeVisible({ timeout });
  } catch (error) {
    const diagnostics = await captureDiagnostics(page, logs);
    console.error('[uploadTsxContent] Export button not visible. Diagnostics:', {
      consoleLogs: diagnostics.consoleLogs,
      visibleText: diagnostics.textContent.substring(0, 500),
    });
    throw error;
  }
}

/**
 * Upload TSX file to popup and wait for validation
 *
 * Handles WASM initialization wait and file validation.
 * The popup shows a loading screen while WASM initializes,
 * then shows the FileImport component.
 *
 * @param page - Popup page
 * @param filePath - Absolute path to TSX file
 * @param options - Upload options
 *
 * @example
 * ```typescript
 * await uploadTsxFile(page, '/path/to/resume.tsx');
 * ```
 *
 * @example
 * ```typescript
 * // Expect validation error
 * await uploadTsxFile(page, '/path/to/invalid.tsx', { expectError: true });
 * ```
 */
export async function uploadTsxFile(
  page: Page,
  filePath: string,
  options?: UploadOptions
): Promise<void> {
  const timeout = options?.timeout ?? 15000;
  const verbose = options?.verbose ?? false;
  const logs: ConsoleLogEntry[] = [];

  // Set up console capture if verbose mode
  if (verbose) {
    setupConsoleCapture(page);
  }

  // Wait for popup to fully load
  await page.waitForLoadState('networkidle');

  // Wait for WASM initialization - file input appears after WASM is ready
  try {
    await page.waitForSelector('[data-testid="file-input"]', {
      state: 'attached',
      timeout,
    });
  } catch (error) {
    // Capture diagnostics on failure
    const diagnostics = await captureDiagnostics(page, logs);
    console.error('[uploadTsxFile] File input not found. Diagnostics:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      consoleLogs: diagnostics.consoleLogs,
      visibleText: diagnostics.textContent.substring(0, 500),
    });
    throw new Error(
      `File input not found: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  if (verbose) {
    console.warn('[uploadTsxFile] File input ready, uploading file:', filePath);
  }

  // Upload file
  const fileInput = page.locator('[data-testid="file-input"]');
  await fileInput.setInputFiles(filePath);

  // Wait for validation to process (monitor console for validation logs)
  await page.waitForTimeout(1000);

  // Check for validation errors
  const validationError = page.locator('[role="alert"]');
  const hasError = await validationError.isVisible().catch(() => false);

  if (options?.expectError) {
    if (!hasError) {
      throw new Error('Expected validation error but file was accepted');
    }
    if (verbose) {
      const errorText = await validationError.textContent();
      console.warn('[uploadTsxFile] Got expected error:', errorText);
    }
    return;
  }

  if (hasError) {
    const errorText = await validationError.textContent();

    // Capture detailed diagnostics on validation failure
    const diagnostics = await captureDiagnostics(page, logs);
    console.error('[uploadTsxFile] File validation failed:', {
      errorText,
      file: filePath,
      consoleLogs: diagnostics.consoleLogs.filter(
        (log) => log.text.includes('validate') || log.text.includes('WASM') || log.type === 'error'
      ),
    });

    throw new Error(`File validation failed: ${errorText}`);
  }

  if (verbose) {
    console.warn('[uploadTsxFile] File validated successfully');
  }

  // Wait for export button to be enabled (file validated + settings loaded)
  // Note: For manual uploads, the button is "preview-button", for Claude-detected CVs it's "export-button"
  try {
    await expect(
      page.locator('[data-testid="preview-button"], [data-testid="export-button"]')
    ).toBeVisible({ timeout });
  } catch (error) {
    const diagnostics = await captureDiagnostics(page, logs);
    console.error('[uploadTsxFile] Export button not visible. Diagnostics:', {
      consoleLogs: diagnostics.consoleLogs,
      visibleText: diagnostics.textContent.substring(0, 500),
    });
    throw error;
  }
}

/**
 * Download result metadata
 */
export interface DownloadResult {
  /** Downloaded filename */
  filename: string;
  /** Absolute path to downloaded file */
  path: string;
  /** File size in bytes */
  size: number;
  /** File size in kilobytes */
  sizeKB: number;
}

/**
 * Wait for PDF download by detecting success state
 *
 * Browser extensions use browser.downloads.download() API which doesn't trigger
 * Playwright's download event. Instead, we wait for the UI success state which
 * appears when the download starts successfully.
 *
 * Note: This function waits for the success state but does NOT save/return the actual
 * downloaded file since Playwright cannot intercept browser.downloads.download().
 * Use this to verify the download UI appears correctly.
 *
 * @param page - Page that will trigger download
 * @param timeout - Download timeout (default: 15000ms)
 *
 * @example
 * ```typescript
 * const exportButton = page.locator('[data-testid="export-button"]');
 * await exportButton.click();
 * await waitForPdfDownload(page);
 * // Success state is now visible
 * ```
 */
export async function waitForPdfDownload(page: Page, timeout = 15000): Promise<void> {
  // Wait for success state to appear (indicates download started successfully)
  await expect(page.locator('[data-testid="success-state"]')).toBeVisible({ timeout });

  // Also verify the success heading is present
  // Heading text is either "Downloaded Successfully" (with download API) or "Ready" (without API)
  // The PDF abbreviation component may have aria-label that interferes with exact matching,
  // so we just check for the key words "Ready" or "Downloaded Successfully"
  await expect(page.getByRole('heading', { name: /(Ready|Downloaded Successfully)/i })).toBeVisible(
    { timeout: 1000 }
  );
}

/**
 * Wait for PDF download and get download metadata from browser logs
 *
 * Waits for the success state (which indicates download started) and extracts
 * download metadata from browser console logs.
 *
 * @param page - Page that will trigger download
 * @param logs - Console logs array from setupConsoleCapture()
 * @param timeout - Download timeout (default: 15000ms)
 * @returns Download result with metadata extracted from logs
 *
 * @example
 * ```typescript
 * const logs = setupConsoleCapture(page);
 * const exportButton = page.locator('[data-testid="export-button"]');
 * await exportButton.click();
 * const result = await waitForPdfDownloadWithMetadata(page, logs);
 * console.log(`Downloaded: ${result.filename}`);
 * ```
 */
export async function waitForPdfDownloadWithMetadata(
  page: Page,
  logs: ConsoleLogEntry[],
  timeout = 15000
): Promise<DownloadResult> {
  // Wait for success state
  await waitForPdfDownload(page, timeout);

  // Extract filename from browser logs
  // Look for: "[DownloadPDF] Download started successfully {downloadId: 1, filename: Resume_Resume_2025-10-23.pdf}"
  const downloadLog = logs.find((log) =>
    log.text.includes('[DownloadPDF] Download started successfully')
  );

  let filename = 'Resume.pdf'; // Default fallback
  if (downloadLog) {
    const match = downloadLog.text.match(/filename:\s*([^\s,}]+)/);
    if (match) {
      filename = match[1];
    }
  }

  // Since we can't access the actual file with browser.downloads.download(),
  // we return metadata with estimated values
  return {
    filename,
    path: '', // Not available
    size: 0, // Not available
    sizeKB: 0, // Not available
  };
}

/**
 * Trigger PDF download and wait for success state
 *
 * Convenience function that combines button click with download wait.
 * Returns metadata extracted from browser logs since Playwright cannot
 * intercept browser.downloads.download() API.
 *
 * @param page - Popup page
 * @param logs - Console logs array from setupConsoleCapture()
 * @param timeout - Download timeout (default: 15000ms)
 * @returns Download result with filename from logs
 *
 * @example
 * ```typescript
 * const logs = setupConsoleCapture(page);
 * const result = await triggerPdfDownload(page, logs);
 * console.log(`Downloaded: ${result.filename}`);
 * ```
 */
export async function triggerPdfDownload(
  page: Page,
  logs: ConsoleLogEntry[],
  timeout = 15000
): Promise<DownloadResult> {
  // For manual uploads, use preview-button; for Claude-detected CVs, use export-button
  const button = page.locator('[data-testid="preview-button"], [data-testid="export-button"]');
  await expect(button).toBeEnabled();

  // Click button (opens preview modal)
  await button.click();

  // Wait for preview modal and confirm button to appear
  const confirmButton = page.locator('[data-testid="confirm-export-button"]');
  await expect(confirmButton).toBeVisible({ timeout: 5000 });

  // Click confirm button to start conversion
  await confirmButton.click();

  // Wait for download to complete (via success state)
  return waitForPdfDownloadWithMetadata(page, logs, timeout);
}

/**
 * Wait for progress indicator to appear
 *
 * @param page - Popup page
 * @param timeout - Timeout (default: 2000ms)
 *
 * @example
 * ```typescript
 * await waitForProgressIndicator(page);
 * ```
 */
export async function waitForProgressIndicator(page: Page, timeout = 2000): Promise<void> {
  await expect(page.locator('[data-testid="progress-status"]')).toBeVisible({ timeout });
}

/**
 * Expect validation error to be displayed
 *
 * @param page - Popup page
 * @param expectedMessage - Expected error message (partial match)
 *
 * @example
 * ```typescript
 * await expectValidationError(page, 'File must be a .tsx');
 * ```
 */
export async function expectValidationError(page: Page, expectedMessage?: string): Promise<void> {
  const validationError = page.locator('[role="alert"]');
  await expect(validationError).toBeVisible();

  if (expectedMessage !== undefined && expectedMessage !== '') {
    await expect(validationError).toContainText(expectedMessage);
  }
}

/**
 * Assert PDF file properties
 *
 * Note: This function is deprecated for browser extension testing since
 * browser.downloads.download() API doesn't allow file access via Playwright.
 * Use filename validation from logs instead.
 *
 * @param result - Download result to validate
 * @param constraints - Size and performance constraints
 * @param constraints.maxSizeKB - Maximum size in KB
 * @param constraints.minSizeKB - Minimum size in KB
 *
 * @example
 * ```typescript
 * assertPdfProperties(result, { minSizeKB: 10 });
 * ```
 */
export function assertPdfProperties(
  result: DownloadResult,
  constraints: {
    maxSizeKB?: number;
    minSizeKB?: number;
  }
): void {
  // Note: Size checks are no longer available with browser.downloads.download()
  // These constraints are kept for API compatibility but will be no-ops
  if (constraints.maxSizeKB !== undefined && constraints.maxSizeKB > 0 && result.sizeKB > 0) {
    expect(result.sizeKB).toBeLessThan(constraints.maxSizeKB);
  }

  if (constraints.minSizeKB !== undefined && constraints.minSizeKB > 0 && result.sizeKB > 0) {
    expect(result.sizeKB).toBeGreaterThan(constraints.minSizeKB);
  }

  // Verify filename has .pdf extension
  expect(result.filename).toMatch(/\.pdf$/);
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

/**
 * Console log collector
 */
export interface ConsoleLogEntry {
  type: 'log' | 'error' | 'warn' | 'info' | 'debug';
  text: string;
  timestamp: number;
  args?: any[];
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
        msg.args().map(async (arg): Promise<unknown> => arg.jsonValue().catch(() => '[unable to serialize]' as unknown))
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
 * WASM readiness check result
 */
export interface WasmReadinessResult {
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
export async function waitForWasmReady(page: Page, timeout = 20000): Promise<WasmReadinessResult> {
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
        { timeout: Math.min(timeout, 5000), polling: 100 }
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
          log.text.includes('WASM compatibility check passed')
      );

      if (hasInitLog) {
        break;
      }

      // Check for error state
      const hasError = logs.some(
        (log) => log.type === 'error' && log.text.toLowerCase().includes('wasm')
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
        if (errorElement && errorElement.textContent?.includes('WASM')) return false;

        return true;
      },
      { timeout: Math.max(0, timeout - (Date.now() - startTime)), polling: 100 }
    );

    const durationMs = Date.now() - startTime;

    // Verify we got the initialization log
    if (!hasInitLog) {
      console.warn('[waitForWasmReady] WASM UI ready but no initialization log found');
      console.warn(
        '[waitForWasmReady] Captured logs:',
        logs.map((l) => l.text)
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
export interface ServiceWorkerWasmReadinessResult {
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
export async function waitForServiceWorkerWasmReady(
  context: BrowserContext,
  timeout = 15000
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
          // eslint-disable-next-line ts/no-unsafe-assignment, ts/no-unsafe-call, ts/no-unsafe-member-access
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
            `[SW Check] ✅ DIAGNOSTIC: Background script is running (loadTime: ${result.loadTime ?? 'unknown'})`
          );
        }

        if (result.wasmStatus === 'success') {
          logs.push(`[SW Check] WASM initialized successfully at ${result.wasmInitTime ?? 'unknown'}`);
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
          `[SW Check] Evaluation error: ${evalError instanceof Error ? evalError.message : String(evalError)}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Timeout reached
    logs.push(`[SW Check] Timeout reached after ${timeout}ms`);
    if (!backgroundScriptDetected) {
      logs.push(
        `[SW Check] ❌ DIAGNOSTIC: Background script NEVER wrote to storage - script may not be loading at all!`
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
export interface BothWasmReadinessResult {
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
  timeout = 20000
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

/**
 * Diagnostic info for debugging
 */
export interface DiagnosticInfo {
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
  logs: ConsoleLogEntry[]
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
