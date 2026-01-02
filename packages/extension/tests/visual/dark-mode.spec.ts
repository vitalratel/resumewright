// ABOUTME: Visual regression tests for dark mode UI states.
// ABOUTME: Tests that all views render correctly with dark theme applied.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { browserConfigs, expect, test } from '../fixtures';

const FIXTURES_PATH = fileURLToPath(
  new URL('../../../../test-fixtures/tsx-samples/single-page', import.meta.url),
);

test.describe('Visual Regression - Dark Mode', () => {
  test.beforeEach(async ({ page, extensionId, browserType }) => {
    const config = browserConfigs[browserType];
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for WASM initialization
    await page.waitForSelector('[data-testid="file-input"]', { state: 'attached', timeout: 20000 });
  });

  test('should render initial state in dark mode', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('dark-mode-initial.png', {
      maxDiffPixels: 100,
    });
  });

  test('should render CVDetected state in dark mode', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    // Upload a file to get to validated state
    const fixturePath = path.join(FIXTURES_PATH, '01-single-column-traditional.tsx');
    await page.locator('[data-testid="file-input"]').setInputFiles(fixturePath);
    await expect(page.locator('[data-testid="export-button"]')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('dark-mode-cv-detected.png', {
      maxDiffPixels: 100,
    });
  });

  test('should render Settings view in dark mode', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    // Open settings via keyboard shortcut
    await page.keyboard.press('Control+Comma');
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('dark-mode-settings.png', {
      maxDiffPixels: 100,
    });
  });

  test('should render Help view in dark mode', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    // Press F1 to open help
    await page.keyboard.press('F1');
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('dark-mode-help.png', {
      maxDiffPixels: 100,
    });
  });

  test('should render success state in dark mode', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    // Upload file and convert
    const fixturePath = path.join(FIXTURES_PATH, '01-single-column-traditional.tsx');
    await page.locator('[data-testid="file-input"]').setInputFiles(fixturePath);
    await expect(page.locator('[data-testid="export-button"]')).toBeVisible({ timeout: 20000 });
    await page.locator('[data-testid="export-button"]').click();

    // Wait for success
    await page.waitForSelector('[data-testid="success-state"]', { timeout: 15000 });
    await page.waitForTimeout(800); // Wait for animations

    await expect(page).toHaveScreenshot('dark-mode-success.png', {
      maxDiffPixels: 100,
    });
  });

  test('should toggle between light and dark mode', async ({ page }) => {
    // Start in light mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('light-mode-initial.png', {
      maxDiffPixels: 100,
    });

    // Toggle to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('dark-mode-toggle-result.png', {
      maxDiffPixels: 100,
    });

    // Toggle back to light mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('light-mode-toggle-result.png', {
      maxDiffPixels: 100,
    });
  });

  test('should render QuickSettings in dark mode', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    // Upload file to show QuickSettings
    const fixturePath = path.join(FIXTURES_PATH, '01-single-column-traditional.tsx');
    await page.locator('[data-testid="file-input"]').setInputFiles(fixturePath);
    await expect(page.locator('[data-testid="export-button"]')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(300);

    // Expand QuickSettings if there's an accordion header
    const quickSettingsHeader = page.locator('button:has-text("Quick Settings")');
    if (await quickSettingsHeader.isVisible()) {
      await quickSettingsHeader.click();
      await page.waitForTimeout(200);
    }

    await expect(page).toHaveScreenshot('dark-mode-quick-settings.png', {
      maxDiffPixels: 100,
    });
  });
});
