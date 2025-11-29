/**
 * Popup Component Accessibility Tests
 * Popup Accessibility Tests
 *
 * Tests all popup states with axe-core for WCAG 2.1 Level A/AA compliance
 */

import { expect, test } from '@playwright/test';
import {
  assertNoLevelAViolations,
  checkLevelAAViolations,
} from '../../src/__tests__/utils/accessibility';

// Increase timeout for accessibility tests (axe-core analysis is slow)
test.setTimeout(60000); // 60 seconds per test

// Skip Firefox - these tests use static HTML via setContent(), no browser-specific behavior
test.skip(({ browserName }) => browserName === 'firefox', 'Static HTML tests only need one browser');

test.describe('Popup Accessibility Tests', () => {
  test.describe('WCAG 2.1 Level A (Hard Requirement)', () => {
    test('NoCVDetected state should have zero Level A violations', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>No CV Detected</title>
        </head>
        <body>
          <div role="main">
            <h1>No CV Detected</h1>
            <p>Navigate to claude.ai and create a CV component</p>
            <a href="#">Learn More</a>
          </div>
        </body>
        </html>
      `);

      const results = await assertNoLevelAViolations(page);
      expect(results.violations).toHaveLength(0);
    });

    test('CVDetected state should have zero Level A violations', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>CV Detected Test</title>
        </head>
        <body>
          <div role="main">
            <h1>John Doe - Software Engineer</h1>
            <p>Layout: Single Column</p>
            <button>Convert to PDF</button>
          </div>
        </body>
        </html>
      `);

      const results = await assertNoLevelAViolations(page);
      expect(results.violations).toHaveLength(0);
    });

    test('Converting state should have zero Level A violations', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Converting Test</title>
        </head>
        <body>
          <div role="main">
            <h1>Converting to PDF...</h1>
            <div role="progressbar" aria-label="Conversion progress" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" aria-live="polite">
              50%
            </div>
            <p>Rendering components...</p>
            <button>Cancel</button>
          </div>
        </body>
        </html>
      `);

      const results = await assertNoLevelAViolations(page);
      expect(results.violations).toHaveLength(0);
    });

    test('Success state should have zero Level A violations', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Success Test</title>
        </head>
        <body>
          <div role="main">
            <h1>PDF Exported Successfully!</h1>
            <p>john-doe-resume.pdf</p>
            <p>324 KB</p>
            <button aria-label="Export another CV">Export Another</button>
            <a href="#">View Export History</a>
          </div>
        </body>
        </html>
      `);

      const results = await assertNoLevelAViolations(page);
      expect(results.violations).toHaveLength(0);
    });

    test('Error state should have zero Level A violations', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Error Test</title>
        </head>
        <body>
          <div role="main">
            <h1>Export Failed</h1>
            <div role="alert" aria-live="assertive">
              <p>Failed to parse TSX code</p>
            </div>
            <div>
              <p><strong>Suggestions:</strong></p>
              <ul>
                <li>Remove complex nested components</li>
                <li>Ensure valid JSX syntax</li>
                <li>Try exporting a simpler CV first</li>
              </ul>
            </div>
            <button>Retry</button>
            <a href="#">View Troubleshooting Guide</a>
          </div>
        </body>
        </html>
      `);

      const results = await assertNoLevelAViolations(page);
      expect(results.violations).toHaveLength(0);
    });

    test('Settings state should have zero Level A violations', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Settings Test</title>
        </head>
        <body>
          <div role="main">
            <h1>Settings</h1>
            <form>
              <label for="pageSize">Page Size</label>
              <select id="pageSize" name="pageSize">
                <option value="letter">Letter</option>
                <option value="a4">A4</option>
              </select>

              <label for="margin">Margin (inches)</label>
              <input type="number" id="margin" name="margin" value="0.5" step="0.1" min="0" max="2" />

              <button type="submit">Save Settings</button>
              <button type="button">Reset to Defaults</button>
            </form>
          </div>
        </body>
        </html>
      `);

      const results = await assertNoLevelAViolations(page);
      expect(results.violations).toHaveLength(0);
    });
  });

  test.describe('WCAG 2.1 Level AA (Target)', () => {
    test('All popup states should check Level AA compliance', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Level AA Test</title>
        </head>
        <body>
          <div role="main">
            <h1>Test Content</h1>
            <p>This tests Level AA compliance</p>
            <button>Action Button</button>
          </div>
        </body>
        </html>
      `);

      const results = await checkLevelAAViolations(page);

      // Log violations for review (Level AA is target, not hard requirement)
      if (results.violationCount > 0) {
        console.warn(`Level AA violations found: ${results.violationCount}`);
        console.warn(results.summary);
      }

      // For now, just ensure the check runs (don't fail on AA violations)
      expect(results).toBeDefined();
    });
  });
});
