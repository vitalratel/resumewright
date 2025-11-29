/**
 * Unit tests for browser configuration.
 *
 * Tests the production browserConfigs object that defines browser-specific
 * settings for Chrome. Firefox is not supported by Playwright for extension testing.
 */

import { describe, expect, it } from 'vitest';
import { browserConfigs } from '../../../tests/fixtures/browser-config';
import { discoverChromeExtensionId } from '../../../tests/fixtures/chrome-id-discovery';

describe('Browser Configuration', () => {
  describe('Chrome Configuration', () => {
    const chromeConfig = browserConfigs.chrome;

    it('should have correct protocol', () => {
      expect(chromeConfig.protocol).toBe('chrome-extension');
    });

    it('should have correct dist folder', () => {
      expect(chromeConfig.distFolder).toBe('.output/chrome-mv3');
    });

    it('should have discoverExtensionId function', () => {
      expect(chromeConfig.discoverExtensionId).toBeDefined();
      expect(typeof chromeConfig.discoverExtensionId).toBe('function');
    });

    it('should use Chrome ID discovery function', () => {
      expect(chromeConfig.discoverExtensionId).toBe(discoverChromeExtensionId);
    });

    it('should construct valid extension URLs', () => {
      const extensionId = 'abcdefghijklmnopqrstuvwxyzabcdef';
      const pagePath = 'src/popup/index.html';

      // Test URL construction pattern used in fixtures.ts
      const url = `${chromeConfig.protocol}://${extensionId}/${pagePath}`;

      expect(url).toBe('chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef/src/popup/index.html');
    });
  });

  describe('Configuration Completeness', () => {
    it('should have Chrome configuration', () => {
      expect(browserConfigs).toHaveProperty('chrome');
    });

    it('should have all required fields for Chrome', () => {
      const config = browserConfigs.chrome;

      expect(config).toHaveProperty('protocol');
      expect(config).toHaveProperty('distFolder');
      expect(config).toHaveProperty('discoverExtensionId');
    });
  });

  describe('Protocol Format', () => {
    it('should not include :// suffix in protocol (added at usage site)', () => {
      // protocols don't include :// - it's added when constructing URLs
      expect(browserConfigs.chrome.protocol).toBe('chrome-extension');

      // Not 'chrome-extension://'
      expect(browserConfigs.chrome.protocol).not.toContain('://');
    });
  });

  describe('Dist Folder Paths', () => {
    it('should use relative paths without leading slash', () => {
      expect(browserConfigs.chrome.distFolder).not.toMatch(/^\//);
    });
  });

  describe('Integration with Fixtures', () => {
    it('should work with manifest path construction pattern', () => {
      const baseDir = '/home/user/extension';

      const chromeManifest = `${baseDir}/${browserConfigs.chrome.distFolder}/manifest.json`;

      expect(chromeManifest).toBe('/home/user/extension/.output/chrome-mv3/manifest.json');
    });
  });
});
