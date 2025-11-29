import type { BrowserConfig, BrowserType } from './types';
import { discoverChromeExtensionId } from './chrome-id-discovery';
import { discoverFirefoxExtensionId } from './firefox-id-discovery';

/**
 * Browser-specific configurations for extension testing.
 *
 * Handles key differences between Chrome and Firefox:
 * - Protocol: chrome-extension:// vs moz-extension://
 * - Build directory: WXT outputs to .output/chrome-mv3 and .output/firefox-mv3
 * - ID discovery: Hash-based (Chrome) vs static manifest ID (Firefox)
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
    distFolder: '.output/chrome-mv3', // Original path (without -dev suffix)
    discoverExtensionId: discoverChromeExtensionId,
  },
  firefox: {
    protocol: 'moz-extension',
    distFolder: '.output/firefox-mv3',
    discoverExtensionId: discoverFirefoxExtensionId,
  },
};
