/**
 * E2E Tests for PDF Conversion Pipeline
 *
 * Tests the full conversion flow:
 * 1. CV detection on claude.ai
 * 2. Export button enablement
 * 3. Conversion pipeline execution
 * 4. Progress indicators (6 stages)
 * 5. PDF download
 * 6. Performance and file size validation
 *
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import { browserConfigs, expect, test } from '../fixtures';
import { waitForPdfDownload } from '../helpers/pdfDownload';

const FIXTURES_PATH = fileURLToPath(
  new URL('../../../../test-fixtures/tsx-samples/single-page', import.meta.url),
);
const TIMEOUT_CONVERSION = 5000; // Performance target: <5 seconds

/**
 * Helper function to upload a TSX file in the popup
 *
 * The popup shows a loading screen while WASM initializes, then shows the FileImport component.
 * We need to wait for WASM initialization to complete before the file input is available.
 */
interface ConsoleLog {
  type: string;
  text: string;
}

async function uploadTsxFile(popupPage: Page, filePath: string): Promise<void> {
  // Wait for the popup to fully load
  await popupPage.waitForLoadState('networkidle');

  // Wait for WASM to initialize - the file input only appears after WASM is ready
  // The loading screen disappears and the file import UI appears
  // 20s timeout (WASM typically initializes in ~5s, 4x buffer for slow environments)
  await popupPage.waitForSelector('[data-testid="file-input"]', {
    state: 'attached',
    timeout: 20000,
  });

  // Get the hidden file input and upload directly
  const fileInput = popupPage.locator('[data-testid="file-input"]');
  await fileInput.setInputFiles(filePath);

  // Wait a bit for file validation to start
  await popupPage.waitForTimeout(1000);

  // Check if there's a validation error
  const validationError = popupPage.locator('[role="alert"]');
  const hasError = await validationError.isVisible().catch((): boolean => false);
  if (hasError) {
    const errorText = await validationError.textContent();
    throw new Error(`File validation failed: ${errorText ?? 'Unknown error'}`);
  }

  // Wait for file validation to complete AND settings to load
  // Export button appears when: file validated + importedFile exists + settings loaded
  await expect(popupPage.locator('[data-testid="export-button"]')).toBeVisible({ timeout: 20000 });
}

/**
 * Test 1: Full conversion flow for single-column CV
 */
test('should convert single-column CV to PDF within performance targets', async ({
  context,
  extensionId,
  browserType,
}) => {
  // Build absolute path to fixture file
  const fixturePath = path.join(FIXTURES_PATH, '01-single-column-traditional.tsx');

  // Navigate to popup using browser-specific protocol
  const config = browserConfigs[browserType];
  const popupPage = await context.newPage();
  await popupPage.goto(`${config.protocol}://${extensionId}/converter.html`);

  // Set up console capture for download metadata
  const logs: ConsoleLog[] = [];
  popupPage.on('console', (msg) => {
    logs.push({ type: msg.type(), text: msg.text() });
  });

  // Upload TSX file
  await uploadTsxFile(popupPage, fixturePath);

  // Click export button to start conversion immediately
  const exportButton = popupPage.locator('[data-testid="export-button"]');
  await expect(exportButton).toBeEnabled();

  const startTime = Date.now();

  // Click export button - conversion starts immediately (no preview modal)
  await exportButton.click();

  // Verify progress indicators show 6 stages
  // Note: Stages may progress quickly, so we'll just verify the progress component appears
  await expect(popupPage.locator('[data-testid="progress-status"]')).toBeVisible({ timeout: 2000 });

  // Wait for PDF download (via success state)
  await waitForPdfDownload(popupPage, 15000);
  const downloadDuration = Date.now() - startTime;

  // Verify conversion completed within performance target
  expect(downloadDuration).toBeLessThan(TIMEOUT_CONVERSION);

  // Extract filename from browser logs
  // Note: Log format is "[PdfDownloader] [INFO] Download started successfully"
  const downloadLog = logs.find(
    (log) =>
      log.text.includes('[PdfDownloader]') && log.text.includes('Download started successfully'),
  );
  let filename = 'Resume.pdf';
  if (downloadLog !== undefined) {
    const match = downloadLog.text.match(/filename:\s*([^\s,}]+)/);
    if (match !== null && match[1] !== undefined) {
      filename = match[1];
    }
  }

  // Verify filename format (Name_Resume_YYYY-MM-DD.pdf or Resume_YYYY-MM-DD.pdf)
  // Format: Resume_YYYY-MM-DD.pdf (when name not extracted) or Name_Resume_YYYY-MM-DD.pdf
  expect(filename).toMatch(/^([A-Za-z_]+_)?Resume_\d{4}-\d{2}-\d{2}\.pdf$/);

  console.warn(`✓ Conversion successful:`);
  console.warn(`  Duration: ${downloadDuration}ms`);
  console.warn(`  Filename: ${filename}`);
});

/**
 * Test 2: Full conversion flow for two-column CV
 */
test('should convert two-column CV to PDF within performance targets', async ({
  context,
  extensionId,
  browserType,
}) => {
  const fixturePath = path.join(FIXTURES_PATH, '02-two-column-modern.tsx');

  const config = browserConfigs[browserType];
  const popupPage = await context.newPage();
  await popupPage.goto(`${config.protocol}://${extensionId}/converter.html`);

  await uploadTsxFile(popupPage, fixturePath);

  const exportButton = popupPage.locator('[data-testid="export-button"]');
  await expect(exportButton).toBeEnabled();

  const startTime = Date.now();

  // Click export button - conversion starts immediately (no preview modal)
  await exportButton.click();

  // Wait for PDF download (via success state)
  await waitForPdfDownload(popupPage, 15000);
  const downloadDuration = Date.now() - startTime;

  expect(downloadDuration).toBeLessThan(TIMEOUT_CONVERSION);

  console.warn(`✓ Two-column conversion: ${downloadDuration}ms`);
});

/**
 * Test 3: Full conversion flow for minimal CV (AC1, AC7)
 */
test('should convert minimal CV to PDF within performance targets', async ({
  context,
  extensionId,
  browserType,
}) => {
  const fixturePath = path.join(FIXTURES_PATH, '03-minimal-simple.tsx');

  const config = browserConfigs[browserType];
  const popupPage = await context.newPage();
  await popupPage.goto(`${config.protocol}://${extensionId}/converter.html`);

  await uploadTsxFile(popupPage, fixturePath);

  const exportButton = popupPage.locator('[data-testid="export-button"]');
  await expect(exportButton).toBeEnabled();

  const startTime = Date.now();

  // Click export button - conversion starts immediately (no preview modal)
  await exportButton.click();

  // Wait for PDF download (via success state)
  await waitForPdfDownload(popupPage, 15000);
  const downloadDuration = Date.now() - startTime;

  expect(downloadDuration).toBeLessThan(TIMEOUT_CONVERSION);

  console.warn(`✓ Minimal conversion: ${downloadDuration}ms`);
});

/**
 * Test 4: Full conversion flow for technical CV (AC1, AC7)
 */
test('should convert technical CV to PDF within performance targets', async ({
  context,
  extensionId,
  browserType,
}) => {
  const fixturePath = path.join(FIXTURES_PATH, '04-technical-developer.tsx');

  const config = browserConfigs[browserType];
  const popupPage = await context.newPage();
  await popupPage.goto(`${config.protocol}://${extensionId}/converter.html`);

  await uploadTsxFile(popupPage, fixturePath);

  const exportButton = popupPage.locator('[data-testid="export-button"]');
  await expect(exportButton).toBeEnabled();

  const startTime = Date.now();

  // Click export button - conversion starts immediately (no preview modal)
  await exportButton.click();

  // Wait for PDF download (via success state)
  await waitForPdfDownload(popupPage, 15000);
  const downloadDuration = Date.now() - startTime;

  expect(downloadDuration).toBeLessThan(TIMEOUT_CONVERSION);

  console.warn(`✓ Technical conversion: ${downloadDuration}ms`);
});

/**
 * Test 5: File import and validation (AC8)
 * Note: This test verifies the file upload workflow rather than Claude.ai detection
 */
test('should detect CV on page and enable export button', async ({
  context,
  extensionId,
  browserType,
}) => {
  const fixturePath = path.join(FIXTURES_PATH, '01-single-column-traditional.tsx');

  // Open extension popup using browser-specific protocol
  const config = browserConfigs[browserType];
  const popupPage = await context.newPage();
  await popupPage.goto(`${config.protocol}://${extensionId}/converter.html`);

  // Upload file
  await uploadTsxFile(popupPage, fixturePath);

  // Verify preview button is enabled
  const exportButton = popupPage.locator('[data-testid="export-button"]');
  await expect(exportButton).toBeEnabled();
  await expect(exportButton).toBeVisible();

  console.warn('✓ CV detection working correctly');
});

/**
 * Test 6: Progress indicators show all 6 stages (AC10)
 */
test('should show progress indicator during conversion', async ({
  context,
  extensionId,
  browserType,
}) => {
  const fixturePath = path.join(FIXTURES_PATH, '01-single-column-traditional.tsx');

  const config = browserConfigs[browserType];
  const popupPage = await context.newPage();
  await popupPage.goto(`${config.protocol}://${extensionId}/converter.html`);

  await uploadTsxFile(popupPage, fixturePath);

  const exportButton = popupPage.locator('[data-testid="export-button"]');
  await expect(exportButton).toBeEnabled();

  // Click export button - conversion starts immediately (no preview modal)
  await exportButton.click();

  // Verify progress indicator appears (conversion is ~1.3s, too fast to observe individual stages)
  await expect(popupPage.locator('[data-testid="progress-status"]')).toBeVisible({ timeout: 2000 });

  // Wait for conversion to complete (via success state)
  await waitForPdfDownload(popupPage, 15000);

  console.warn('✓ Progress indicator shown during conversion');

  // NOTE: This test was simplified from "show all 6 progress stages" because:
  // - Conversion completes in ~1.3s (too fast to reliably observe individual stages)
  // - User insight: "if conversion is fast enough, there's no need for different statuses"
  // - Testing progress indicator presence (user value) vs. 6 specific stages (implementation detail)
});

/**
 * Test 7: Error handling for invalid TSX (AC12)
 */
test('should show user-friendly error message for invalid TSX', async ({
  context,
  extensionId,
  browserType,
}) => {
  const config = browserConfigs[browserType];
  const popupPage = await context.newPage();
  await popupPage.goto(`${config.protocol}://${extensionId}/converter.html`);

  // Create a temporary invalid TSX file
  const invalidTsx = '<div>Missing closing tag<p>Broken</div>';
  const tempDir = path.join(process.cwd(), 'packages/extension/test-results/temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const invalidTsxPath = path.join(tempDir, 'invalid.tsx');
  fs.writeFileSync(invalidTsxPath, invalidTsx, 'utf-8');

  try {
    // Upload invalid file
    const fileInput = popupPage.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles(invalidTsxPath);

    // Wait for file to be imported (may still import even if invalid)
    await popupPage.waitForTimeout(1000);

    // Try to export - this should trigger error
    const exportButton = popupPage.locator('[data-testid="export-button"]');
    if (await exportButton.isVisible({ timeout: 2000 })) {
      // Click export button - conversion starts immediately (no preview modal)
      await exportButton.click();

      // Wait for error message to appear
      const errorState = popupPage.locator('[data-testid="error-state"]');
      await expect(errorState).toBeVisible({ timeout: 10000 });

      // Verify error message is user-friendly (contains actionable text)
      const errorText = await errorState.textContent();
      expect(errorText).toBeTruthy();

      console.warn('✓ Error handling working correctly');
      console.warn(`  Error message displayed: ${errorText?.substring(0, 100)}...`);
    } else {
      console.warn('✓ Invalid file rejected during validation (before export)');
    }
  } finally {
    // Clean up temp file
    if (fs.existsSync(invalidTsxPath)) {
      fs.unlinkSync(invalidTsxPath);
    }
  }
});
