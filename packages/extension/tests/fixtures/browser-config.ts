import type { BrowserConfig, BrowserType } from './types';
import { discoverChromeExtensionId } from './chrome-id-discovery';

/**
 * Browser configuration for extension testing.
 * Chrome only - Playwright doesn't support Firefox extension loading.
 *
 * Usage:
 * ```typescript
 * const config = browserConfigs[browserType];
 * const extensionId = await config.discoverExtensionId(context, manifestPath);
 * const popupUrl = `${config.protocol}://${extensionId}/src/popup/index.html`;
 * ```
 */
export const browserConfigs: Record<BrowserType, BrowserConfig> = {
  chrome: {
    protocol: 'chrome-extension',
    distFolder: '.output/chrome-mv3',
    discoverExtensionId: discoverChromeExtensionId,
  },
};
