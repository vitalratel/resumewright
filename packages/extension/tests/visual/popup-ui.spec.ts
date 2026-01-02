// ABOUTME: Visual regression tests for popup UI states.
// ABOUTME: Tests initial, file-validated, converting, success, and error states.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { browserConfigs, expect, test } from '../fixtures';

const FIXTURES_PATH = fileURLToPath(
  new URL('../../../../test-fixtures/tsx-samples/single-page', import.meta.url),
);

test.describe('Visual Regression - Popup UI', () => {
  test('should match baseline for initial popup state', async ({
    page,
    extensionId,
    browserType,
  }) => {
    const config = browserConfigs[browserType];
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for WASM initialization (file input appears when ready)
    await page.waitForSelector('[data-testid="file-input"]', { state: 'attached', timeout: 20000 });
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('popup-initial.png');
  });

  test('should match baseline for file validated state', async ({
    page,
    extensionId,
    browserType,
  }) => {
    const config = browserConfigs[browserType];
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for WASM and upload file
    await page.waitForSelector('[data-testid="file-input"]', { state: 'attached', timeout: 20000 });
    const fixturePath = path.join(FIXTURES_PATH, '01-single-column-traditional.tsx');
    await page.locator('[data-testid="file-input"]').setInputFiles(fixturePath);

    // Wait for export button (appears after validation)
    await expect(page.locator('[data-testid="export-button"]')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('popup-file-validated.png', {
      maxDiffPixels: 500,
    });
  });

  test('should match baseline for converting state', async ({ page, extensionId, browserType }) => {
    const config = browserConfigs[browserType];
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for WASM and upload file
    await page.waitForSelector('[data-testid="file-input"]', { state: 'attached', timeout: 20000 });
    const fixturePath = path.join(FIXTURES_PATH, '01-single-column-traditional.tsx');
    await page.locator('[data-testid="file-input"]').setInputFiles(fixturePath);

    // Wait for export button and click
    await expect(page.locator('[data-testid="export-button"]')).toBeVisible({ timeout: 20000 });
    await page.locator('[data-testid="export-button"]').click();

    // Capture converting state (progress indicator)
    await page.waitForSelector('[data-testid="progress-status"]', { timeout: 5000 });
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('popup-converting.png', {
      maxDiffPixels: 200, // Converting state has dynamic progress
    });
  });

  test('should match baseline for success state', async ({ page, extensionId, browserType }) => {
    const config = browserConfigs[browserType];
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for WASM and upload file
    await page.waitForSelector('[data-testid="file-input"]', { state: 'attached', timeout: 20000 });
    const fixturePath = path.join(FIXTURES_PATH, '01-single-column-traditional.tsx');
    await page.locator('[data-testid="file-input"]').setInputFiles(fixturePath);

    // Wait for export button and click
    await expect(page.locator('[data-testid="export-button"]')).toBeVisible({ timeout: 20000 });
    await page.locator('[data-testid="export-button"]').click();

    // Wait for success state and animations to complete
    await page.waitForSelector('[data-testid="success-state"]', { timeout: 15000 });
    await page.waitForTimeout(800); // Wait for animations to settle

    await expect(page).toHaveScreenshot('popup-success.png', {
      maxDiffPixels: 500, // Allow animation timing differences
    });
  });

  test('should match baseline for error state', async ({ page, extensionId, browserType }) => {
    const config = browserConfigs[browserType];
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for WASM
    await page.waitForSelector('[data-testid="file-input"]', { state: 'attached', timeout: 20000 });

    // Create invalid TSX file
    const fs = await import('node:fs');
    const tempDir = await import('node:os').then((os) => os.tmpdir());
    const invalidFilePath = path.join(tempDir, 'invalid-cv.tsx');
    fs.writeFileSync(invalidFilePath, '<CV><Name>Unclosed');

    // Upload invalid file
    await page.locator('[data-testid="file-input"]').setInputFiles(invalidFilePath);

    // Wait for validation error
    await page.waitForSelector('[data-testid="validation-error"]', { timeout: 5000 });
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('popup-error.png');

    // Cleanup
    fs.unlinkSync(invalidFilePath);
  });
});
