import fs from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BrowserContext } from '@playwright/test';
import { test as base, chromium } from '@playwright/test';
import { browserConfigs } from './fixtures/browser-config';
import type { BrowserType } from './fixtures/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extended Playwright test with custom fixtures for extension testing.
 * Chrome only - Playwright doesn't support Firefox extension loading.
 *
 * Provides:
 * - browserType: Always 'chrome' (kept for API compatibility)
 * - context: Persistent browser context with extension loaded
 * - extensionId: The ID of the loaded extension (for accessing extension pages)
 * - backgroundPage: Service worker reference (limited in Manifest V3)
 *
 * Usage:
 * ```typescript
 * import { test, expect, browserConfigs } from './fixtures';
 *
 * test('extension popup', async ({ context, extensionId, browserType }) => {
 *   const config = browserConfigs[browserType];
 *   const page = await context.newPage();
 *   await page.goto(`${config.protocol}://${extensionId}/converter.html`);
 *   await expect(page.locator('text=ResumeWright')).toBeVisible();
 * });
 * ```
 */

// Service worker mock interface for testing
interface ServiceWorkerMock {
  url: () => string;
  evaluate: () => Promise<never>;
}

// Extend base test with custom fixtures
export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
  backgroundPage: ServiceWorkerMock;
  browserType: BrowserType;
}>({
  // Browser type - always Chrome (Playwright doesn't support Firefox extensions)
  browserType: async ({}, use) => {
    await use('chrome');
  },

  // Custom context fixture that loads the extension
  context: async ({ browserType }, use, testInfo) => {
    const config = browserConfigs[browserType];
    const pathToExtension = path.join(__dirname, '..', config.distFolder);

    // Use a unique persistent user data directory with timestamp to avoid conflicts
    // This prevents race conditions when tests run in parallel
    const timestamp = Date.now();
    const userDataDir = path.join(
      __dirname,
      `../.test-profile-${browserType}-${testInfo.workerIndex}-${timestamp}`,
    );

    // Chrome: Use persistent context with extension loading arguments
    const launcher = chromium;
    const context: BrowserContext = await launcher.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        // Disable various Chrome features for cleaner testing
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security', // For local file access if needed
      ],
      viewport: { width: 1280, height: 720 },
    });

    await use(context);
    await context.close();

    // Clean up user data directory to prevent service worker caching issues
    // This ensures each test run gets a fresh extension state
    try {
      await rm(userDataDir, { recursive: true, force: true });
      console.warn(`[Fixture] Cleaned up user data directory: ${userDataDir}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[Fixture] Failed to clean up user data directory: ${errorMsg}`);
    }
  },

  // Custom fixture to get extension ID
  extensionId: async ({ context, browserType }, use) => {
    console.warn(`[Fixture] Looking for ${browserType} extension ID...`);

    // Get browser-specific configuration
    const config = browserConfigs[browserType];

    // Verify the extension is built
    const manifestPath = path.join(__dirname, '..', config.distFolder, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error(
        `Extension manifest not found at ${manifestPath}. ` +
          `Please build the extension first (run: pnpm build)`,
      );
    }

    // Discover extension ID using browser-specific logic
    const extensionId = await config.discoverExtensionId(context, manifestPath);

    // Verify extension is ready by trying to load the popup (Chrome only)
    if (browserType === 'chrome') {
      await verifyExtensionReady(context, config.protocol, extensionId);
    }

    await use(extensionId);
  },

  // Custom fixture to access background service worker
  backgroundPage: async (
    {
      context,
      extensionId,
      browserType,
    }: {
      context: BrowserContext;
      extensionId: string;
      browserType: BrowserType;
    },
    use: (value: ServiceWorkerMock) => Promise<void>,
  ) => {
    // WORKAROUND: Service workers in Manifest V3 may not be accessible via
    // Playwright's context.serviceWorkers() in persistent contexts.
    // We provide a mock/placeholder that tests can use to verify extension loaded.

    // Get browser-specific configuration for correct protocol
    const config = browserConfigs[browserType];

    // Try to get actual service worker
    const serviceWorkers = context.serviceWorkers();
    const actualServiceWorker = serviceWorkers.length > 0 ? serviceWorkers[0] : null;

    let serviceWorker: ServiceWorkerMock;

    if (!actualServiceWorker) {
      console.warn(
        '[Fixture] Service worker not accessible via Playwright API. ' +
          'This is a known limitation with Manifest V3 extensions. ' +
          'Tests should verify extension functionality via popup/content script instead.',
      );

      // Provide a placeholder object with the expected interface
      serviceWorker = {
        url: () => `${config.protocol}://${extensionId}/background.js`,
        evaluate: async () => {
          throw new Error(
            'Cannot evaluate in service worker context. ' +
              'Use popup page or content script for testing.',
          );
        },
      };
    } else {
      // Wrap actual service worker with our interface
      serviceWorker = {
        url: () => actualServiceWorker.url(),
        evaluate: async () => {
          throw new Error(
            'Cannot evaluate in service worker context. ' +
              'Use popup page or content script for testing.',
          );
        },
      };
    }

    // Note: Extension will use default settings since storage initialization
    // in service worker context is unreliable. The extension gracefully falls
    // back to defaults when settings are unavailable.

    await use(serviceWorker);
  },
});

/**
 * Verifies extension is ready by attempting to load the converter page.
 * Uses converter.html directly (popup.html just redirects to it).
 * Throws error if page cannot be accessed.
 */
async function verifyExtensionReady(
  context: BrowserContext,
  protocol: string,
  extensionId: string,
): Promise<void> {
  let testPage;

  try {
    testPage = await context.newPage();
    // Use converter.html directly - popup.html redirects and closes itself
    const converterUrl = `${protocol}://${extensionId}/converter.html`;
    console.warn('[Fixture] Verifying extension is ready:', converterUrl);

    // Navigate to converter page - this will fail if extension isn't loaded
    await testPage.goto(converterUrl, { timeout: 10000 });

    // Wait for React app to mount (look for actual app content in #root)
    await testPage.waitForSelector('#root > *', { timeout: 5000 });

    console.warn('[Fixture] Extension is ready');
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Extension loaded but converter page failed to load: ${errorMsg}. ` +
        'This might indicate a problem with the extension build.',
    );
  } finally {
    if (testPage) {
      await testPage.close().catch(() => {
        // Page may already be closed if context was closed
      });
    }
  }
}

export { browserConfigs };
export { expect } from '@playwright/test';
