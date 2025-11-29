/**
 * Unit tests for browser configuration.
 *
 * Tests the production browserConfigs object that defines browser-specific
 * settings for Chrome and Firefox.
 *
 * Note: Firefox tests are minimal for now (Firefox Support not yet implemented).
 * Chrome tests verify production configuration used in E2E tests.
 */

import { describe, expect, it } from 'vitest';
import { browserConfigs } from '../../../tests/fixtures/browser-config';
import { discoverChromeExtensionId } from '../../../tests/fixtures/chrome-id-discovery';
import { discoverFirefoxExtensionId } from '../../../tests/fixtures/firefox-id-discovery';

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

  describe('Firefox Configuration', () => {
    const firefoxConfig = browserConfigs.firefox;

    it('should have correct protocol', () => {
      expect(firefoxConfig.protocol).toBe('moz-extension');
    });

    it('should have correct dist folder', () => {
      expect(firefoxConfig.distFolder).toBe('.output/firefox-mv3');
    });

    it('should have discoverExtensionId function', () => {
      expect(firefoxConfig.discoverExtensionId).toBeDefined();
      expect(typeof firefoxConfig.discoverExtensionId).toBe('function');
    });

    it('should use Firefox ID discovery function', () => {
      expect(firefoxConfig.discoverExtensionId).toBe(discoverFirefoxExtensionId);
    });

    it('should construct valid extension URLs', () => {
      const extensionId = 'extension@resumewright.com';
      const pagePath = 'src/popup/index.html';

      // Test URL construction pattern used in fixtures.ts
      const url = `${firefoxConfig.protocol}://${extensionId}/${pagePath}`;

      expect(url).toBe('moz-extension://extension@resumewright.com/src/popup/index.html');
    });
  });

  describe('Configuration Completeness', () => {
    it('should have configurations for both browsers', () => {
      expect(browserConfigs).toHaveProperty('chrome');
      expect(browserConfigs).toHaveProperty('firefox');
    });

    it('should have all required fields for Chrome', () => {
      const config = browserConfigs.chrome;

      expect(config).toHaveProperty('protocol');
      expect(config).toHaveProperty('distFolder');
      expect(config).toHaveProperty('discoverExtensionId');
    });

    it('should have all required fields for Firefox', () => {
      const config = browserConfigs.firefox;

      expect(config).toHaveProperty('protocol');
      expect(config).toHaveProperty('distFolder');
      expect(config).toHaveProperty('discoverExtensionId');
    });
  });

  describe('Protocol Format', () => {
    it('should not include :// suffix in protocol (added at usage site)', () => {
      // protocols don't include :// - it's added when constructing URLs
      expect(browserConfigs.chrome.protocol).toBe('chrome-extension');
      expect(browserConfigs.firefox.protocol).toBe('moz-extension');

      // Not 'chrome-extension://' or 'moz-extension://'
      expect(browserConfigs.chrome.protocol).not.toContain('://');
      expect(browserConfigs.firefox.protocol).not.toContain('://');
    });
  });

  describe('Dist Folder Paths', () => {
    it('should use relative paths without leading slash', () => {
      expect(browserConfigs.chrome.distFolder).not.toMatch(/^\//);
      expect(browserConfigs.firefox.distFolder).not.toMatch(/^\//);
    });

    it('should use different dist folders for each browser', () => {
      expect(browserConfigs.chrome.distFolder).not.toBe(browserConfigs.firefox.distFolder);
    });
  });

  describe('Integration with Fixtures', () => {
    it('should support browser type detection pattern', () => {
      // Simulates logic from fixtures.ts browserType fixture
      const detectBrowser = (projectName: string): 'chrome' | 'firefox' => {
        return projectName.includes('firefox') ? 'firefox' : 'chrome';
      };

      const chromeType = detectBrowser('extension-chrome');
      const firefoxType = detectBrowser('extension-firefox');

      expect(browserConfigs[chromeType]).toBeDefined();
      expect(browserConfigs[firefoxType]).toBeDefined();
    });

    it('should work with manifest path construction pattern', () => {
      const baseDir = '/home/user/extension';

      const chromeManifest = `${baseDir}/${browserConfigs.chrome.distFolder}/manifest.json`;
      const firefoxManifest = `${baseDir}/${browserConfigs.firefox.distFolder}/manifest.json`;

      expect(chromeManifest).toBe('/home/user/extension/.output/chrome-mv3/manifest.json');
      expect(firefoxManifest).toBe('/home/user/extension/.output/firefox-mv3/manifest.json');
    });
  });
});
