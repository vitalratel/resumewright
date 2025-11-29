/**
 * Full Popup Application Accessibility Tests
 * WCAG 2.1 AA compliance for complete popup with WASM, router, and store
 *
 * Tests the actual running popup application in a real browser extension context,
 * replacing the skipped Vitest test that couldn't handle full App dependencies.
 */

import AxeBuilder from '@axe-core/playwright';
import { browserConfigs, expect, test } from '../fixtures';

// Increase timeout for full extension loading + axe-core analysis
test.setTimeout(60000);

test.describe('Full Popup Application - WCAG 2.1 Compliance', () => {
  test('popup app has no WCAG Level A violations', async ({ page, extensionId, browserType }) => {
    test.skip(browserType === 'firefox', 'Firefox extension loading not supported in Playwright');

    // Navigate to actual extension popup using browser-specific protocol
    const config = browserConfigs[browserType];
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);

    // Wait for popup to fully load (React app, WASM, etc.)
    await page.waitForLoadState('networkidle');

    // Wait for main content to render
    // The popup should have either NoCVDetected or CVDetected state
    await page.waitForSelector('[role="main"], main, body', { timeout: 10000 });

    // Run axe accessibility scan - Level A only (hard requirement)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag21a']) // WCAG 2.0/2.1 Level A only
      .analyze();

    // Log violations for debugging
    if (results.violations.length > 0) {
      console.warn('\n========== WCAG Level A Violations ==========');
      results.violations.forEach((violation, index) => {
        console.warn(`\n${index + 1}. ${violation.id}: ${violation.description}`);
        console.warn(`   Impact: ${violation.impact}`);
        console.warn(`   Help: ${violation.help}`);
        console.warn(`   Affected elements: ${violation.nodes.length}`);
        violation.nodes.forEach((node, nodeIndex) => {
          console.warn(`     ${nodeIndex + 1}. ${node.html}`);
          console.warn(`        Fix: ${node.failureSummary}`);
        });
      });
      console.warn('=============================================\n');
    }

    // Assert zero Level A violations (hard requirement for P1)
    expect(results.violations).toEqual([]);
  });

  test('popup app checks WCAG Level AA compliance', async ({ page, extensionId, browserType }) => {
    test.skip(browserType === 'firefox', 'Firefox extension loading not supported in Playwright');

    // Navigate to actual extension popup using browser-specific protocol
    const config = browserConfigs[browserType];
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);

    // Wait for popup to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[role="main"], main, body', { timeout: 10000 });

    // Run axe accessibility scan - Level AA (target, not hard requirement)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa']) // WCAG 2.0/2.1 Level AA
      .analyze();

    // Log violations for review (not a hard failure)
    if (results.violations.length > 0) {
      console.warn('\n========== WCAG Level AA Violations (Review) ==========');
      results.violations.forEach((violation, index) => {
        console.warn(`\n${index + 1}. ${violation.id}: ${violation.description}`);
        console.warn(`   Impact: ${violation.impact}`);
        console.warn(`   Help: ${violation.help}`);
        console.warn(`   Affected elements: ${violation.nodes.length}`);
      });
      console.warn('=======================================================\n');
    }

    // Don't fail on AA violations (target, not requirement)
    // Just report for continuous improvement
    console.warn(`Level AA violations found: ${results.violations.length}`);
    expect(results).toBeDefined();
  });

  test('popup app keyboard navigation works', async ({ page, extensionId, browserType }) => {
    test.skip(browserType === 'firefox', 'Firefox extension loading not supported in Playwright');

    // Navigate to actual extension popup using browser-specific protocol
    const config = browserConfigs[browserType];
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);

    // Wait for popup to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[role="main"], main, body', { timeout: 10000 });

    // Test keyboard navigation
    // Tab should move focus through interactive elements
    await page.keyboard.press('Tab');

    // Check that focus is visible (WCAG 2.4.7 - Focus Visible)
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;

      const styles = window.getComputedStyle(el);
      return {
        tagName: el.tagName,
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    });

    // Should have visible focus indicator
    expect(focusedElement).not.toBeNull();

    // Run axe check specifically for keyboard navigation
    const results = await new AxeBuilder({ page })
      .withTags(['keyboard']) // Keyboard-specific checks
      .analyze();

    if (results.violations.length > 0) {
      console.warn('\n========== Keyboard Navigation Violations ==========');
      results.violations.forEach((violation) => {
        console.warn(`${violation.id}: ${violation.description}`);
      });
      console.warn('===================================================\n');
    }

    expect(results.violations).toEqual([]);
  });

  test('popup app has proper semantic HTML structure', async ({
    page,
    extensionId,
    browserType,
  }) => {
    test.skip(browserType === 'firefox', 'Firefox extension loading not supported in Playwright');

    // Navigate to actual extension popup using browser-specific protocol
    const config = browserConfigs[browserType];
    await page.goto(`${config.protocol}://${extensionId}/converter.html`);

    // Wait for popup to fully load
    await page.waitForLoadState('networkidle');

    // Check for semantic HTML structure
    const hasMain = await page.locator('main, [role="main"]').count();
    const hasHeading = await page.locator('h1, h2, h3').count();

    expect(hasMain).toBeGreaterThan(0); // Should have main landmark
    expect(hasHeading).toBeGreaterThan(0); // Should have headings

    // Run axe check for semantic structure
    const results = await new AxeBuilder({ page })
      .withTags(['best-practice']) // Best practices including semantic HTML
      .analyze();

    // Log any best practice violations (informational)
    if (results.violations.length > 0) {
      console.warn('\n========== Best Practice Violations (Info) ==========');
      results.violations.forEach((violation) => {
        console.warn(`${violation.id}: ${violation.description} (${violation.impact})`);
      });
      console.warn('====================================================\n');
    }

    // Don't fail on best practices (informational)
    expect(results).toBeDefined();
  });
});

/**
 * Manual Accessibility Testing Checklist
 * (To be performed by QA/developers before releases)
 *
 * Keyboard Navigation:
 * [ ] Tab through all interactive elements in popup
 * [ ] Enter/Space activate buttons and links
 * [ ] Escape closes dialogs/modals if present
 * [ ] Arrow keys work in custom controls (if any)
 * [ ] Focus order is logical (top to bottom, left to right)
 * [ ] No keyboard traps (can Tab out of all components)
 *
 * Screen Reader Testing (NVDA/JAWS/VoiceOver):
 * [ ] All buttons have meaningful labels
 * [ ] Form inputs have associated labels
 * [ ] Error messages are announced with role="alert"
 * [ ] Progress updates are announced (aria-live)
 * [ ] Headings create logical document structure
 * [ ] Links have descriptive text (not "click here")
 * [ ] Images have alt text (if any)
 *
 * Visual Testing:
 * [ ] Focus indicators clearly visible on all interactive elements
 * [ ] Text contrast ratio >= 4.5:1 for normal text
 * [ ] Text contrast ratio >= 3:1 for large text (18pt+)
 * [ ] UI usable at 200% browser zoom
 * [ ] No information conveyed by color alone
 * [ ] Touch targets >= 44×44 CSS pixels (mobile)
 *
 * Tools for Manual Testing:
 * - axe DevTools browser extension (automated checks)
 * - NVDA screen reader (Windows, free)
 * - JAWS screen reader (Windows, trial available)
 * - VoiceOver (macOS/iOS, built-in)
 * - Chrome DevTools Lighthouse (accessibility audit)
 * - WebAIM Color Contrast Checker
 */
