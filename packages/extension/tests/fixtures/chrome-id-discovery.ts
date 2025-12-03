import type { BrowserContext } from '@playwright/test';

/**
 * Discovers Chrome extension ID from service worker.
 *
 * For Manifest V3 extensions, Chrome registers a service worker when the extension loads.
 * The extension ID can be extracted from the service worker's URL.
 *
 * This is the recommended approach from Playwright documentation:
 * https://playwright.dev/docs/chrome-extensions
 *
 * @param context - Browser context with extension loaded
 * @param _manifestPath - Path to extension manifest.json (unused, kept for interface compatibility)
 * @returns Extension ID (32 lowercase letters a-p)
 * @throws Error if service worker is not found or ID cannot be extracted
 */
export async function discoverChromeExtensionId(
  context: BrowserContext,
  _manifestPath: string,
): Promise<string> {
  console.warn('[Chrome] Waiting for extension service worker...');

  try {
    // For Manifest V3: Get service worker (background script)
    let [serviceWorker] = context.serviceWorkers();

    // If not immediately available, wait for it to register
    if (!serviceWorker) {
      console.warn('[Chrome] Service worker not ready, waiting for "serviceworker" event...');
      serviceWorker = await context.waitForEvent('serviceworker', { timeout: 10000 });
    }

    // Extract extension ID from service worker URL
    // Service worker URL format: chrome-extension://<extension-id>/service-worker-loader.js
    const serviceWorkerUrl = serviceWorker.url();
    console.warn('[Chrome] Service worker URL:', serviceWorkerUrl);

    const extensionId = serviceWorkerUrl.split('/')[2];

    if (!extensionId || extensionId.length !== 32) {
      throw new Error(
        `Invalid extension ID extracted from service worker URL: "${extensionId}". ` +
          `Expected 32-character ID. Service worker URL: ${serviceWorkerUrl}`,
      );
    }

    console.warn('[Chrome] Discovered extension ID:', extensionId);
    return extensionId;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Timeout')) {
      throw new Error(
        'Timeout waiting for extension service worker. ' +
          'Extension may not have loaded properly. ' +
          'Ensure extension is built (run: pnpm build) and manifest.json is valid.',
      );
    }
    throw error;
  }
}
