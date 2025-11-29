import type { BrowserContext } from '@playwright/test';

/**
 * Browser type for fixture configuration.
 * Chrome only - Playwright doesn't support Firefox extension loading.
 */
export type BrowserType = 'chrome';

/**
 * Browser-specific configuration for extension testing.
 */
export interface BrowserConfig {
  /** Extension URL protocol (chrome-extension://) */
  protocol: string;

  /** Path to build directory (.output/chrome-mv3) */
  distFolder: string;

  /** Function to discover extension ID */
  discoverExtensionId: (context: BrowserContext, manifestPath: string) => Promise<string>;
}
