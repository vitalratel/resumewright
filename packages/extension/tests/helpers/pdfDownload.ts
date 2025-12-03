/**
 * PDF Download Helpers
 * Utilities for triggering and validating PDF downloads in E2E tests.
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

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
