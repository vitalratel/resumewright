import { browserConfigs, expect, test } from '../fixtures';

/**
 * Visual regression tests for popup UI.
 *
 * Validates:
 * - Popup initial state appearance
 * - UI elements after user interactions
 * - Error states visual appearance
 * - Success states visual appearance
 *
 * Uses Playwright's built-in screenshot comparison.
 */

test.describe('Visual Regression - Popup UI', () => {
  test('should match baseline for initial popup state', async ({
    page,
    extensionId,
    browserType,
  }) => {
    // Navigate to popup using browser-specific protocol
    const config = browserConfigs[browserType];
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for UI to be fully rendered
    await page.waitForTimeout(500);

    // Take screenshot and compare to baseline
    await expect(page).toHaveScreenshot('popup-initial.png');
  });

  test('should match baseline for popup with TSX input', async ({
    page,
    extensionId,
    browserType,
  }) => {
    const config = browserConfigs[browserType];
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);
    await page.waitForLoadState('domcontentloaded');

    // Enter sample TSX
    const sampleTSX = '<CV><Name>John Doe</Name></CV>';
    const tsxInput = page.locator('[data-testid="tsx-input"]').or(page.locator('textarea')).first();
    await tsxInput.fill(sampleTSX);

    await page.waitForTimeout(300);

    // Screenshot with content
    await expect(page).toHaveScreenshot('popup-with-input.png');
  });

  test('should match baseline for converting state', async ({ page, extensionId, browserType }) => {
    const config = browserConfigs[browserType];
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);
    await page.waitForLoadState('domcontentloaded');

    // Enter TSX
    const sampleTSX = '<CV><Name>John Doe</Name></CV>';
    const tsxInput = page.locator('[data-testid="tsx-input"]').or(page.locator('textarea')).first();
    await tsxInput.fill(sampleTSX);

    // Click convert button
    const convertButton = page
      .locator('[data-testid="convert-button"]')
      .or(page.locator('button:has-text("Convert")'))
      .first();
    await convertButton.click();

    // Wait briefly to capture "converting" state
    await page.waitForTimeout(100);

    // Screenshot during conversion
    await expect(page).toHaveScreenshot('popup-converting.png');
  });

  test('should match baseline for success state', async ({ page, extensionId, browserType }) => {
    const config = browserConfigs[browserType];
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);
    await page.waitForLoadState('domcontentloaded');

    // Enter TSX and convert
    const sampleTSX = '<CV><Name>John Doe</Name></CV>';
    const tsxInput = page.locator('[data-testid="tsx-input"]').or(page.locator('textarea')).first();
    await tsxInput.fill(sampleTSX);

    const convertButton = page
      .locator('[data-testid="convert-button"]')
      .or(page.locator('button:has-text("Convert")'))
      .first();
    await convertButton.click();

    // Wait for success state
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
    await page.waitForTimeout(300);

    // Screenshot success state
    await expect(page).toHaveScreenshot('popup-success.png');
  });

  test('should match baseline for error state', async ({ page, extensionId, browserType }) => {
    const config = browserConfigs[browserType];
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);
    await page.waitForLoadState('domcontentloaded');

    // Enter invalid TSX
    const invalidTSX = '<CV><Name>Unclosed';
    const tsxInput = page.locator('[data-testid="tsx-input"]').or(page.locator('textarea')).first();
    await tsxInput.fill(invalidTSX);

    const convertButton = page
      .locator('[data-testid="convert-button"]')
      .or(page.locator('button:has-text("Convert")'))
      .first();
    await convertButton.click();

    // Wait for error state
    await page.waitForSelector('[data-testid="error-message"]', { timeout: 5000 });
    await page.waitForTimeout(300);

    // Screenshot error state
    await expect(page).toHaveScreenshot('popup-error.png');
  });
});
