// ABOUTME: E2E tests for the settings panel — theme switching and persistence.
// ABOUTME: Validates that light/dark/auto themes correctly update the UI.

import { browserConfigs, expect, test } from '../fixtures';

// Background CSS variable values — Chrome normalizes oklch: 0.21 → 21%, 1 → 100%, drops leading zero
const DARK_BG = 'oklch(21% .034 264.665)';
const LIGHT_BG = 'oklch(100% 0 0)';

async function getBgVar(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--background').trim(),
  );
}

test.describe('Theme switching', () => {
  test('auto mode uses dark tokens when system prefers dark', async ({
    context,
    extensionId,
    browserType,
  }) => {
    const config = browserConfigs[browserType];
    const page = await context.newPage();

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);
    await page.waitForSelector('#drop-zone', { state: 'visible' });

    // Default theme is 'auto' — no explicit class on html
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
    await expect(page.locator('html')).not.toHaveClass(/\blight\b/);

    // CSS variables must reflect dark mode
    expect(await getBgVar(page)).toBe(DARK_BG);

    // html and body must also use the dark background (covers full viewport)
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).not.toBe('rgb(249, 250, 251)'); // not the hardcoded #f9fafb
  });

  test('auto mode uses light tokens when system prefers light', async ({
    context,
    extensionId,
    browserType,
  }) => {
    const config = browserConfigs[browserType];
    const page = await context.newPage();

    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);
    await page.waitForSelector('#drop-zone', { state: 'visible' });

    expect(await getBgVar(page)).toBe(LIGHT_BG);
  });

  test('explicit dark overrides system preference', async ({
    context,
    extensionId,
    browserType,
  }) => {
    const config = browserConfigs[browserType];
    const page = await context.newPage();

    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);
    await page.waitForSelector('#drop-zone', { state: 'visible' });

    // Open settings and switch to explicit dark
    await page.click('#btn-settings');
    await page.click('#tab-general');
    await page.click('#theme-dark');

    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    expect(await getBgVar(page)).toBe(DARK_BG);
  });

  test('explicit light overrides system preference', async ({
    context,
    extensionId,
    browserType,
  }) => {
    const config = browserConfigs[browserType];
    const page = await context.newPage();

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);
    await page.waitForSelector('#drop-zone', { state: 'visible' });

    await page.click('#btn-settings');
    await page.click('#tab-general');
    await page.click('#theme-light');

    await expect(page.locator('html')).toHaveClass(/\blight\b/);
    expect(await getBgVar(page)).toBe(LIGHT_BG);
  });
});
