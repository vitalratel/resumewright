import { Buffer } from 'node:buffer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { browserConfigs, expect, test } from '../fixtures';
import { measureDuration, setupConsoleCapture } from '../helpers/diagnostics';
import { uploadTsxContent, uploadTsxFile } from '../helpers/fileUpload';
import { waitForPdfDownload, waitForProgressIndicator } from '../helpers/pdfDownload';

// Test timeout constants for consistency
const TIMEOUTS = {
  APP_MOUNT: 10000,
  CONVERSION: 10000,
  ELEMENT_VISIBLE: 5000,
} as const;

// Use fixture files (same as conversion.spec.ts)
const FIXTURES_PATH = fileURLToPath(
  new URL('../../../../test-fixtures/tsx-samples/single-page', import.meta.url),
);

/**
 * E2E tests for TSX to PDF conversion flow.
 *
 * Validates:
 * - File upload is accepted
 * - Conversion process initiates
 * - Success state is reached
 * - PDF download is triggered
 * - Error handling works correctly
 *
 * Note: WASM readiness is not explicitly checked here. If WASM fails to initialize,
 * the conversion will fail and tests will fail with a meaningful error.
 * WASM initialization is covered by unit tests.
 */

test.describe('Conversion Flow', () => {
  const sampleTsxPath = path.join(FIXTURES_PATH, '01-single-column-traditional.tsx');

  test('should convert TSX to PDF successfully', async ({ context, extensionId, browserType }) => {
    // Open extension popup
    const config = browserConfigs[browserType];
    const page = await context.newPage();
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);

    // Enhanced console capture with structured logging
    const logs = setupConsoleCapture(page);

    // Wait for React app to mount
    await expect(page.locator('text=ResumeWright')).toBeVisible({ timeout: TIMEOUTS.APP_MOUNT });

    // Upload test file (use actual fixture)
    await uploadTsxFile(page, sampleTsxPath, { verbose: true });

    // Measure conversion duration
    const duration = await measureDuration(async () => {
      // Click export button - conversion starts immediately (no preview modal)
      const exportButton = page.locator('[data-testid="export-button"]');
      await exportButton.click();

      // Wait for progress indicator
      await waitForProgressIndicator(page);

      // Wait for PDF download (via success state)
      await waitForPdfDownload(page, 15000);
    });

    console.warn(`Conversion completed in ${duration}ms`);

    // Log any errors or warnings from browser console
    const errorLogs = logs.filter(
      (log: { type: string }) => log.type === 'error' || log.type === 'warn',
    );
    if (errorLogs.length > 0) {
      console.warn('[Test] Browser console errors/warnings:', errorLogs);
    }

    // Target: <5s for high-end devices
    expect(duration).toBeLessThan(5000);
  });

  // NOTE: "should handle PDF download" test removed as redundant
  // This functionality is already thoroughly tested by "should convert TSX to PDF successfully" above
  // which verifies: upload, conversion, progress indicator, success state, and performance

  test('should handle invalid TSX input', async ({ context, extensionId, browserType }) => {
    const config = browserConfigs[browserType];
    const page = await context.newPage();
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);

    // Wait for React app to mount
    await expect(page.locator('text=ResumeWright')).toBeVisible({ timeout: TIMEOUTS.APP_MOUNT });

    // Wait for file input to be ready
    await page.waitForSelector('[data-testid="file-input"]', { state: 'attached', timeout: 15000 });

    // Create file with invalid TSX (proper format but broken JSX)
    const invalidTSX = `import React from 'react';

export default function InvalidResume() {
  return (
    <div>
      <h1>Test</h1>
      <p>Unclosed tag
    </div>
  );
}`;

    // Upload file directly (not using helper since behavior is non-standard)
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles({
      name: 'invalid-cv.tsx',
      mimeType: 'text/plain',
      buffer: Buffer.from(invalidTSX, 'utf-8'),
    });

    // Wait for validation to process
    await page.waitForTimeout(2000);

    // Export button should not be visible since file is invalid
    // The app accepts the file but doesn't enable export for invalid TSX
    const exportButton = page.locator('[data-testid="export-button"]');
    await expect(exportButton).not.toBeVisible({ timeout: 3000 });
  });

  test('should handle empty TSX input', async ({ context, extensionId, browserType }) => {
    const config = browserConfigs[browserType];
    const page = await context.newPage();
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);
    const logs = setupConsoleCapture(page);

    // Wait for React app to mount
    await expect(page.locator('text=ResumeWright')).toBeVisible({ timeout: TIMEOUTS.APP_MOUNT });

    // Upload empty file expecting validation error
    await uploadTsxContent(page, 'empty.tsx', '', { expectError: true, verbose: true });

    // Export button should not be visible since file is invalid
    const exportButton = page.locator('[data-testid="export-button"]');
    await expect(exportButton).not.toBeVisible();

    // Log validation logs for debugging
    const validationLogs = logs.filter(
      (log: { text: string }) => log.text.includes('validate') || log.text.includes('empty'),
    );
    console.warn('[Test] Validation logs for empty file:', validationLogs);
  });
});
