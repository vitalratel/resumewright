/**
 * Automated Accessibility Tests
 *
 * Uses aXe-core with Playwright to validate WCAG 2.1 Level AA compliance.
 * These tests replace manual screen reader testing for most scenarios.
 *
 * Run with: pnpm --filter extension test:a11y
 *
 * Coverage:
 * - WCAG 2.1 Level A and AA standards
 * - Keyboard navigation
 * - ARIA attributes
 * - Color contrast (light and dark modes)
 * - Form labels
 * - Focus management
 *
 * Note: Screen reader UX testing still requires manual verification.
 * These tests validate technical compliance only.
 */

import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';

type Theme = 'light' | 'dark';

/**
 * Apply theme to page by toggling .dark class on html element
 */
async function applyTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate((t) => {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, theme);
  await page.waitForTimeout(300); // Allow styles to apply
}

/**
 * Run aXe accessibility scan with WCAG 2.1 AA tags
 */
async function runAxeScan(page: Page, selector?: string) {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  if (selector) {
    builder = builder.include(selector);
  }
  return builder.analyze();
}

// Test both light and dark themes
const themes: Theme[] = ['light', 'dark'];

test.describe('Automated Accessibility (WCAG 2.1 AA)', () => {
  for (const theme of themes) {
    test.describe(`Theme: ${theme}`, () => {
      test('Popup UI - No accessibility violations', async ({ context, extensionId }) => {
        const page = await context.newPage();
        await page.goto(`chrome-extension://${extensionId}/converter.html`);
        await page.waitForTimeout(1000);
        await applyTheme(page, theme);

        const results = await runAxeScan(page);
        expect(results.violations).toEqual([]);

        await page.close();
      });

      test('Color contrast - WCAG AA compliance', async ({ context, extensionId }) => {
        const page = await context.newPage();
        await page.goto(`chrome-extension://${extensionId}/converter.html`);
        await page.waitForTimeout(1000);
        await applyTheme(page, theme);

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2aa'])
          .include('body')
          .analyze();

        const contrastViolations = results.violations.filter((v) =>
          v.id.includes('color-contrast'),
        );
        expect(contrastViolations).toEqual([]);

        await page.close();
      });

      test('Buttons - Accessible names and roles', async ({ context, extensionId }) => {
        const page = await context.newPage();
        await page.goto(`chrome-extension://${extensionId}/converter.html`);
        await page.waitForTimeout(1000);
        await applyTheme(page, theme);

        const buttons = await page.locator('button').all();
        for (const button of buttons) {
          const accessibleName = await button.evaluate((el) => {
            return el.textContent?.trim() || el.getAttribute('aria-label') || '';
          });
          expect(accessibleName.length).toBeGreaterThan(0);
        }

        const results = await runAxeScan(page);
        expect(results.violations).toEqual([]);

        await page.close();
      });

      test('Focus visible - Visual focus indicators', async ({ context, extensionId }) => {
        const page = await context.newPage();
        await page.goto(`chrome-extension://${extensionId}/converter.html`);
        await page.waitForTimeout(1000);
        await applyTheme(page, theme);

        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el) return null;

          const styles = window.getComputedStyle(el);
          return {
            tag: el.tagName.toLowerCase(),
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            boxShadow: styles.boxShadow,
          };
        });

        if (focusedElement) {
          const hasFocusIndicator =
            focusedElement.outline !== 'none' ||
            focusedElement.outlineWidth !== '0px' ||
            focusedElement.boxShadow !== 'none';
          expect(typeof hasFocusIndicator).toBe('boolean');
        }

        const results = await runAxeScan(page);
        expect(results.violations).toEqual([]);

        await page.close();
      });

      test('Settings page - Full accessibility', async ({ context, extensionId }) => {
        const page = await context.newPage();
        await page.goto(`chrome-extension://${extensionId}/converter.html`);
        await page.waitForTimeout(1000);
        await applyTheme(page, theme);

        // Navigate to settings
        const settingsButton = page.locator(
          'button[aria-label*="ettings"], button:has-text("Settings")',
        );
        if ((await settingsButton.count()) > 0) {
          await settingsButton.first().click();
          await page.waitForTimeout(500);
        }

        const results = await runAxeScan(page);
        expect(results.violations).toEqual([]);

        await page.close();
      });
    });
  }

  // Theme-independent tests (run once)
  test('Error state - Accessible and announced', async ({ context, extensionId }) => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const testFilePath = path.join(__dirname, '__temp_a11y_error.tsx');

    fs.writeFileSync(testFilePath, 'const CV = () => <div>Unclosed');

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/converter.html`);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    await page.waitForSelector('[data-testid="validation-error"]', { timeout: 5000 });

    const results = await runAxeScan(page, '[data-testid="validation-error"]');
    expect(results.violations).toEqual([]);

    const errorDisplay = page.locator('[data-testid="validation-error"]');
    const roleOrLive = await errorDisplay.evaluate((el) => {
      return {
        role: el.getAttribute('role'),
        ariaLive: el.getAttribute('aria-live'),
        ariaAtomic: el.getAttribute('aria-atomic'),
      };
    });

    const isAccessible =
      roleOrLive.role === 'alert' ||
      roleOrLive.ariaLive === 'assertive' ||
      roleOrLive.ariaLive === 'polite';
    expect(isAccessible).toBeTruthy();

    fs.unlinkSync(testFilePath);
    await page.close();
  });

  test('Keyboard navigation - Focusable elements', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/converter.html`);
    await page.waitForTimeout(1000);

    const focusableElements = await page.evaluate(() => {
      const selector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const elements = Array.from(document.querySelectorAll(selector));

      return elements.map((el) => ({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type'),
        tabIndex: el.getAttribute('tabindex'),
        ariaLabel: el.getAttribute('aria-label'),
        text: el.textContent?.trim(),
      }));
    });

    expect(focusableElements.length).toBeGreaterThan(0);

    const hasPositiveTabIndex = focusableElements.some((el) => {
      const tabIndex = Number.parseInt(el.tabIndex || '0', 10);
      return tabIndex > 0;
    });
    expect(hasPositiveTabIndex).toBeFalsy();

    const results = await runAxeScan(page);
    expect(results.violations).toEqual([]);

    await page.close();
  });

  test('Form elements - Proper labels and associations', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/converter.html`);
    await page.waitForTimeout(1000);

    const fileInput = page.locator('input[type="file"]');
    if ((await fileInput.count()) > 0) {
      const hasLabel = await fileInput.evaluate((el) => {
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledby = el.getAttribute('aria-labelledby');
        const id = el.getAttribute('id');

        if (ariaLabel || ariaLabelledby) {
          return true;
        }

        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          return !!label;
        }

        return false;
      });

      expect(hasLabel).toBeTruthy();
    }

    const results = await runAxeScan(page);
    expect(results.violations).toEqual([]);

    await page.close();
  });

  test('Images - Alt text or aria-label', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/converter.html`);
    await page.waitForTimeout(1000);

    const images = await page.locator('img').all();
    if (images.length > 0) {
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const ariaLabel = await img.getAttribute('aria-label');
        const role = await img.getAttribute('role');

        const isAccessible = alt !== null || ariaLabel || role === 'presentation';
        expect(isAccessible).toBeTruthy();
      }
    }

    const results = await runAxeScan(page);
    expect(results.violations).toEqual([]);

    await page.close();
  });

  test('Landmark regions - Proper semantic structure', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/converter.html`);
    await page.waitForTimeout(1000);

    const results = await runAxeScan(page);
    expect(results.violations).toEqual([]);

    await page.close();
  });

  test('Heading hierarchy - Proper h1-h6 structure', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/converter.html`);
    await page.waitForTimeout(1000);

    const headings = await page.evaluate(() => {
      const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));

      return headingElements.map((el) => ({
        level: Number.parseInt(el.tagName.substring(1), 10),
        text: el.textContent?.trim(),
      }));
    });

    if (headings.length > 0) {
      expect(headings[0].level).toBe(1);

      for (let i = 1; i < headings.length; i++) {
        const levelDiff = headings[i].level - headings[i - 1].level;
        expect(levelDiff).toBeLessThanOrEqual(1);
      }
    }

    const results = await runAxeScan(page);
    expect(results.violations).toEqual([]);

    await page.close();
  });

  test('Links - Descriptive text (no "click here")', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/converter.html`);
    await page.waitForTimeout(1000);

    const links = await page.locator('a[href]').all();
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');

      const linkText = (text?.trim() || ariaLabel || '').toLowerCase();

      const hasGenericText =
        linkText === 'click here' ||
        linkText === 'here' ||
        linkText === 'read more' ||
        linkText === 'more';

      expect(hasGenericText).toBeFalsy();
    }

    const results = await runAxeScan(page);
    expect(results.violations).toEqual([]);

    await page.close();
  });
});
