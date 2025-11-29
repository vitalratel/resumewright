import type { BrowserContext } from '@playwright/test';

/**
 * Browser type for fixture configuration.
 * Determines which browser-specific logic to use.
 */
export type BrowserType = 'chrome' | 'firefox';

/**
 * Browser-specific configuration for extension testing.
 * Handles differences in protocol, ID discovery, and manifest structure between browsers.
 */
export interface BrowserConfig {
  /** Extension URL protocol (chrome-extension:// or moz-extension://) */
  protocol: string;

  /** Path to browser-specific build directory (.output/chrome-mv3 or .output/firefox-mv3) */
  distFolder: string;

  /** Function to discover extension ID for this browser */
  discoverExtensionId: (context: BrowserContext, manifestPath: string) => Promise<string>;
}
