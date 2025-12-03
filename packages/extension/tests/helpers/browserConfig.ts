/**
 * Browser Configuration Helpers
 * Browser-specific configuration and popup opening utilities for E2E tests.
 */

import type { BrowserContext, Page } from '@playwright/test';

/**
 * Browser type (matches fixtures/types.ts)
 */
export type BrowserType = 'chrome' | 'firefox';

/**
 * Browser-specific configuration
 */
export interface BrowserConfig {
  protocol: 'chrome-extension' | 'moz-extension';
  name: 'chrome' | 'firefox';
}

export const browserConfigs: Record<BrowserType, BrowserConfig> = {
  chrome: {
    protocol: 'chrome-extension',
    name: 'chrome',
  },
  firefox: {
    protocol: 'moz-extension',
    name: 'firefox',
  },
};

/**
 * Open extension popup page
 *
 * @param context - Browser context
 * @param extensionId - Extension ID
 * @param browserType - Browser type ('chrome' or 'firefox')
 * @returns Popup page
 *
 * @example
 * ```typescript
 * const popup = await openExtensionPopup(context, extensionId, 'chrome');
 * ```
 */
export async function openExtensionPopup(
  context: BrowserContext,
  extensionId: string,
  browserType: BrowserType,
): Promise<Page> {
  const config = browserConfigs[browserType];
  // Open converter page directly (popup now redirects to converter)
  const popupPage = await context.newPage();
  await popupPage.goto(`${config.protocol}://${extensionId}/converter.html`);
  return popupPage;
}
