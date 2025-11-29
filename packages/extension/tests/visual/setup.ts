/**
 * Visual Test Setup for Extension Testing
 * Playwright extension context setup
 * 
 * Provides utilities for:
 * - Loading extension in persistent context
 * - Accessing extension pages (popup, options, etc.)
 * - Custom font management for testing
 * - PDF rendering for visual comparison
 */

import type {BrowserContext, Page} from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base,  chromium  } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ExtensionTestFixtures {
  context: BrowserContext;
  extensionId: string;
  extensionPage: Page;
}

/**
 * Extended Playwright test with extension fixtures
 */
export const test = base.extend<ExtensionTestFixtures>({
  // Browser context with extension loaded
  context: async (_baseFixtures, use) => {
    const pathToExtension = path.join(__dirname, '../../dist');
    
    // Verify extension is built
    const fs = await import('node:fs');
    if (!fs.existsSync(pathToExtension)) {
      throw new Error(
        `Extension not built. Run 'pnpm build' before running visual tests.\nExpected path: ${pathToExtension}`
      );
    }
    
    // Launch persistent context with extension
    // Note: Extensions require headed mode
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--disable-blink-features=AutomationControlled',
      ],
      viewport: { width: 1280, height: 720 },
      // Reduce flakiness
      slowMo: 50, // 50ms delay between actions
    });
    
    await use(context);
    await context.close();
  },
  
  // Extension ID extracted from service worker
  extensionId: async ({ context }, use) => {
    const serviceWorkers = context.serviceWorkers();
    let serviceWorker = serviceWorkers.length > 0 ? serviceWorkers[0] : undefined;
    
    if (serviceWorker === undefined) {
      serviceWorker = await context.waitForEvent('serviceworker', {
        timeout: 10000,
      });
    }
    
    // Extract ID from chrome-extension://<id>/service-worker.js
    const extensionId = serviceWorker.url().split('/')[2];
    
    await use(extensionId);
  },
  
  // Extension popup page
  extensionPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    
    // Navigate to extension popup
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);
    
    // Wait for extension to initialize
    await page.waitForLoadState('networkidle');
    
    // Wait for fonts to load (prevents screenshot flakiness)
    await page.evaluate(async () => document.fonts.ready);
    
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';

/**
 * Screenshot options for consistent visual tests
 */
export const screenshotOptions = {
  animations: 'disabled' as const,
  maxDiffPixels: 100,
  threshold: 0.05, // 5% threshold for 95% fidelity
};

/**
 * Navigate to Settings panel in extension
 */
export async function openSettings(page: Page): Promise<void> {
  // Click settings button (assuming it exists in popup)
  const settingsButton = page.locator('[data-testid="settings-button"]');
  
  if (await settingsButton.count() > 0) {
    await settingsButton.click();
  } else {
    // Fallback: Settings might be a tab or route
    const settingsTab = page.locator('button:has-text("Settings")');
    if (await settingsTab.count() > 0) {
      await settingsTab.click();
    }
  }
  
  // Wait for settings panel to be visible
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to Custom Fonts section in Settings
 */
export async function openCustomFonts(page: Page): Promise<void> {
  await openSettings(page);
  
  // Scroll to Custom Fonts section (it's at the bottom)
  const customFontsSection = page.locator('h2:has-text("Custom Fonts")');
  if (await customFontsSection.count() > 0) {
    await customFontsSection.scrollIntoViewIfNeeded();
  }
  
  // Wait for any animations to complete
  await page.waitForTimeout(500);
}
