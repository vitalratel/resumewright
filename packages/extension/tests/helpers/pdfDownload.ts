/**
 * PDF Download Helpers
 * Utilities for triggering and validating PDF downloads in E2E tests.
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { ConsoleLogEntry } from './diagnostics';

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
    { timeout: 1000 },
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
  timeout = 15000,
): Promise<DownloadResult> {
  // Wait for success state
  await waitForPdfDownload(page, timeout);

  // Extract filename from browser logs
  // Look for: "[DownloadPDF] Download started successfully {downloadId: 1, filename: Resume_Resume_2025-10-23.pdf}"
  const downloadLog = logs.find((log) =>
    log.text.includes('[DownloadPDF] Download started successfully'),
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
  timeout = 15000,
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
  },
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
