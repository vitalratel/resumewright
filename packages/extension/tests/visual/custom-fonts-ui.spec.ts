/**
 * Visual Regression Tests - Custom Fonts UI
 * Custom font UI visual tests
 *
 * Tests all visual states of the Custom Fonts component:
 * - Empty state
 * - Upload form
 * - Font list with various formats (TTF/WOFF/WOFF2)
 * - Storage statistics (green/yellow/red states)
 * - Settings panel integration
 * - Success/error messages
 */

import path from 'node:path';
import { expect, openCustomFonts, test } from './setup';
import { deleteAllCustomFonts, uploadCustomFont } from './utils';

const screenshotOptions = {};

test.describe('Visual Regression - Custom Fonts UI', () => {
  test.beforeEach(async ({ extensionPage }) => {
    // Navigate to Custom Fonts section
    await openCustomFonts(extensionPage);

    // Clean up any existing fonts from previous tests
    await deleteAllCustomFonts(extensionPage);
  });

  test('empty state - no fonts uploaded', async ({ extensionPage }) => {
    // Verify empty state message
    const emptyMessage = extensionPage.locator('text=No custom fonts uploaded yet');
    await expect(emptyMessage).toBeVisible();

    // Take baseline screenshot
    const customFontsSection = extensionPage.locator('h2:has-text("Custom Fonts")').locator('..');
    await expect(customFontsSection).toHaveScreenshot('custom-fonts-empty.png', screenshotOptions);
  });

  test('upload form displays all fields correctly', async ({ extensionPage }) => {
    // Verify form fields exist
    await expect(extensionPage.locator('#font-family')).toBeVisible();
    await expect(extensionPage.locator('#font-weight')).toBeVisible();
    await expect(extensionPage.locator('#font-style')).toBeVisible();
    await expect(extensionPage.locator('#font-file')).toBeVisible();

    // Verify help text
    await expect(
      extensionPage.locator('text=Supports TrueType (TTF), WOFF, and WOFF2 formats')
    ).toBeVisible();

    // Take baseline screenshot of upload form
    const uploadForm = extensionPage.locator('.border.border-gray-300.rounded-md').first();
    await expect(uploadForm).toHaveScreenshot('custom-fonts-upload-form.png', screenshotOptions);
  });

  test('storage statistics display correctly', async ({ extensionPage }) => {
    // Verify storage stats section exists
    const statsSection = extensionPage.locator('.bg-gray-50.rounded-md.text-sm').first();
    await expect(statsSection).toBeVisible();

    // Verify it shows 0 fonts initially
    await expect(statsSection).toContainText('0 / 10 fonts');

    // Verify progress bar exists
    const progressBar = extensionPage.locator('.h-2.rounded-full.transition-all');
    await expect(progressBar).toBeVisible();

    // Take baseline screenshot
    await expect(statsSection).toHaveScreenshot(
      'custom-fonts-storage-empty.png',
      screenshotOptions
    );
  });

  test('single font uploaded - TTF format', async ({ extensionPage }) => {
    // Now enabled with font fixtures available

    const fontPath = path.join(__dirname, '../fixtures/fonts/Roboto-Regular.ttf');

    await uploadCustomFont(extensionPage, fontPath, {
      family: 'Roboto',
      weight: 400,
      style: 'normal',
    });

    // Take baseline screenshot
    const fontsList = extensionPage.locator('h3:has-text("Uploaded Fonts")').locator('..');
    await expect(fontsList).toHaveScreenshot('custom-fonts-single-ttf.png', screenshotOptions);
  });

  test('single font uploaded - WOFF format badge', async ({ extensionPage }) => {
    // Now enabled with font fixtures available

    const fontPath = path.join(__dirname, '../fixtures/fonts/Roboto-Regular.woff');

    await uploadCustomFont(extensionPage, fontPath, {
      family: 'Roboto',
      weight: 400,
      style: 'normal',
    });

    // Verify WOFF format badge exists and has correct color
    const formatBadge = extensionPage.locator('span:has-text("WOFF")').first();
    await expect(formatBadge).toBeVisible();
    await expect(formatBadge).toHaveClass(/bg-green-100/);

    // Take baseline screenshot
    const fontItem = extensionPage
      .locator('div:has(.font-medium.text-sm:has-text("Roboto"))')
      .first();
    await expect(fontItem).toHaveScreenshot('custom-fonts-woff-badge.png', screenshotOptions);
  });

  test('single font uploaded - WOFF2 format badge', async ({ extensionPage }) => {
    // Now enabled with font fixtures available

    const fontPath = path.join(__dirname, '../fixtures/fonts/OpenSans-Bold.woff2');

    await uploadCustomFont(extensionPage, fontPath, {
      family: 'Open Sans',
      weight: 700,
      style: 'normal',
    });

    // Verify WOFF2 format badge exists and has correct color
    const formatBadge = extensionPage.locator('span:has-text("WOFF2")').first();
    await expect(formatBadge).toBeVisible();
    await expect(formatBadge).toHaveClass(/bg-purple-100/);

    // Take baseline screenshot
    const fontItem = extensionPage
      .locator('div:has(.font-medium.text-sm:has-text("Open Sans"))')
      .first();
    await expect(fontItem).toHaveScreenshot('custom-fonts-woff2-badge.png', screenshotOptions);
  });

  test('progress bar green when storage < 70%', async ({ extensionPage }) => {
    // With no fonts, storage should be 0% (green)
    // Take baseline screenshot
    const statsSection = extensionPage.locator('.bg-gray-50.rounded-md.text-sm').first();
    await expect(statsSection).toHaveScreenshot(
      'custom-fonts-storage-green.png',
      screenshotOptions
    );
  });

  test('progress bar yellow when storage 70-90%', async ({ extensionPage }) => {
    // Upload 8 large fonts (~16MB total) to reach 70-90% of ~20MB quota
    for (let i = 1; i <= 8; i += 1) {
      const fontPath = path.join(__dirname, `../fixtures/fonts/large/Font-${i}.ttf`);
      // eslint-disable-next-line no-await-in-loop -- Sequential upload required for accurate storage state tracking
      await uploadCustomFont(extensionPage, fontPath, {
        family: `TestFont${i}`,
        weight: 400,
        style: 'normal',
      });
    }

    // Verify progress bar is yellow (70-90%)
    // Take baseline screenshot
    const statsSection = extensionPage.locator('.bg-gray-50.rounded-md.text-sm').first();
    await expect(statsSection).toHaveScreenshot(
      'custom-fonts-storage-yellow.png',
      screenshotOptions
    );
  });

  test('progress bar red when storage > 90%', async ({ extensionPage }) => {
    // Upload 10 large fonts (~20MB total) to reach >90% of ~20MB quota
    for (let i = 1; i <= 10; i += 1) {
      const fontPath = path.join(__dirname, `../fixtures/fonts/large/Font-${i}.ttf`);
      // eslint-disable-next-line no-await-in-loop -- Sequential upload required for accurate storage state tracking
      await uploadCustomFont(extensionPage, fontPath, {
        family: `TestFont${i}`,
        weight: 400,
        style: 'normal',
      });
    }

    // Verify progress bar is red (>90%)
    // Take baseline screenshot
    const statsSection = extensionPage.locator('.bg-gray-50.rounded-md.text-sm').first();
    await expect(statsSection).toHaveScreenshot('custom-fonts-storage-red.png', screenshotOptions);
  });

  test('upload disabled when font count limit reached', async ({ extensionPage }) => {
    // Upload 10 fonts to reach the maximum limit
    for (let i = 1; i <= 10; i += 1) {
      const fontPath = path.join(__dirname, `../fixtures/fonts/large/Font-${i}.ttf`);
      // eslint-disable-next-line no-await-in-loop -- Sequential upload required to accurately reach font count limit
      await uploadCustomFont(extensionPage, fontPath, {
        family: `TestFont${i}`,
        weight: 400,
        style: 'normal',
      });
    }

    // Verify storage shows 10/10 fonts
    const statsSection = extensionPage.locator('.bg-gray-50.rounded-md.text-sm').first();
    await expect(statsSection).toContainText('10 / 10 fonts');

    // Verify file input is disabled
    await expect(extensionPage.locator('#font-file')).toBeDisabled();

    // Verify warning message is displayed
    const warningMessage = extensionPage.locator('text=/Maximum.*fonts.*reached/i');
    await expect(warningMessage).toBeVisible();

    // Take baseline screenshot
    const uploadForm = extensionPage.locator('.border.border-gray-300.rounded-md').first();
    await expect(uploadForm).toHaveScreenshot('custom-fonts-limit-reached.png', screenshotOptions);
  });

  test('success message displays after upload', async ({ extensionPage }) => {
    // Now enabled with font fixtures available

    const fontPath = path.join(__dirname, '../fixtures/fonts/Roboto-Regular.ttf');

    await uploadCustomFont(extensionPage, fontPath, {
      family: 'Roboto',
      weight: 400,
      style: 'normal',
    });

    // Verify success message
    const successMessage = extensionPage.locator('[role="status"]');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText('Successfully uploaded Roboto');

    // Take baseline screenshot
    await expect(successMessage).toHaveScreenshot(
      'custom-fonts-success-message.png',
      screenshotOptions
    );
  });

  test('error message displays for invalid input', async ({ extensionPage }) => {
    // Upload a font file without entering the font family name (required field)
    const fontPath = path.join(__dirname, '../fixtures/fonts/Roboto-Regular.ttf');

    // Leave font-family empty
    await extensionPage.fill('#font-family', '');
    await extensionPage.selectOption('#font-weight', '400');
    await extensionPage.selectOption('#font-style', 'normal');

    // Try to upload font file
    const fileInput = extensionPage.locator('#font-file');
    await fileInput.setInputFiles(fontPath);

    // Wait for error message to appear
    const errorMessage = extensionPage.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Verify error message content
    await expect(errorMessage).toContainText(/family.*required/i);

    // Take baseline screenshot of error state
    const uploadForm = extensionPage.locator('.border.border-gray-300.rounded-md').first();
    await expect(uploadForm).toHaveScreenshot(
      'custom-fonts-error-validation.png',
      screenshotOptions
    );
  });
});

test.describe('Visual Regression - Settings Panel Integration', () => {
  test('custom fonts section integrates with settings panel', async ({ extensionPage }) => {
    await openCustomFonts(extensionPage);

    // Verify Custom Fonts section exists within Settings
    const customFontsHeading = extensionPage.locator('h2:has-text("Custom Fonts")');
    await expect(customFontsHeading).toBeVisible();

    // Verify it's properly positioned (should have border-t for separation)
    const customFontsContainer = customFontsHeading.locator('..');
    await expect(customFontsContainer).toHaveClass(/border-t/);

    // Take full settings panel screenshot
    const settingsPanel = extensionPage.locator('main, .settings-panel, [role="main"]').first();
    await expect(settingsPanel).toHaveScreenshot(
      'settings-panel-with-custom-fonts.png',
      screenshotOptions
    );
  });

  test('settings panel scrolls correctly', async ({ extensionPage }) => {
    await openCustomFonts(extensionPage);

    // Scroll to Custom Fonts section
    const customFontsSection = extensionPage.locator('h2:has-text("Custom Fonts")');
    await customFontsSection.scrollIntoViewIfNeeded();

    // Verify section is visible after scroll
    await expect(customFontsSection).toBeVisible();

    // Take screenshot at scrolled position
    const settingsPanel = extensionPage.locator('main, .settings-panel, [role="main"]').first();
    await expect(settingsPanel).toHaveScreenshot(
      'settings-panel-scrolled-to-fonts.png',
      screenshotOptions
    );
  });
});
