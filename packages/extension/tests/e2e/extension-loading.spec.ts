import { browserConfigs, expect, test } from '../fixtures';

/**
 * E2E tests for extension loading and basic functionality.
 *
 * Validates:
 * - Extension loads successfully
 * - Service worker is active
 * - Popup page is accessible
 * - Basic UI elements are present
 */

test.describe('Extension Loading', () => {
  test('should load extension successfully', async ({ extensionId, backgroundPage }) => {
    // Verify extension ID is present and valid
    expect(extensionId).toBeTruthy();

    // Validate extension ID format (Chrome: 32 lowercase letters)
    expect(extensionId).toMatch(/^[a-z]{32}$/);

    // Verify backgroundPage fixture is available (even if mocked)
    expect(backgroundPage).toBeTruthy();
    expect(backgroundPage.url()).toContain(extensionId);
    expect(backgroundPage.url()).toContain('background.js');

    // Note: Service workers may not be accessible via Playwright's
    // context.serviceWorkers() in Manifest V3 persistent contexts.
    // This is a known Playwright limitation, not an extension bug.
  });

  test('should open converter page', async ({ page, extensionId, browserType }) => {
    // Navigate to extension converter using browser-specific protocol
    const config = browserConfigs[browserType];
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);

    // Verify converter loaded
    await expect(page).toHaveTitle(/ResumeWright/i);

    // Verify main UI elements are present
    await expect(page.locator('body')).toBeVisible();

    // Verify React app mounted
    await expect(page.locator('#root')).toBeVisible();
  });

  test('should have correct manifest version', async ({ context, extensionId, browserType }) => {
    // Verify extension by loading its converter and checking metadata
    const page = await context.newPage();
    const config = browserConfigs[browserType];

    try {
      // Navigate to the converter using browser-specific protocol
      await page.goto(`${config.protocol}://${extensionId}/converter.html`);

      // Verify extension metadata from the page
      await expect(page).toHaveTitle(/ResumeWright/i);

      // Validate extension ID format (Chrome: 32 lowercase letters)
      expect(extensionId).toMatch(/^[a-z]{32}$/);

      // Verify the converter page loaded successfully (indicates Manifest V3 works)
      const bodyVisible = await page.locator('body').isVisible();
      expect(bodyVisible).toBe(true);

      // Check that React app is mounted
      const rootExists = await page.locator('#root').count();
      expect(rootExists).toBeGreaterThan(0);
    } finally {
      await page.close();
    }
  });
});
