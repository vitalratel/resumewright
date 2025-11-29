/**
 * Integration tests for Chrome extension ID discovery.
 *
 * Tests the production code in chrome-id-discovery.ts which extracts
 * the extension ID from the service worker URL at runtime.
 *
 * This replaces the outdated hash-based generation tests in fixtures.test.ts
 * which tested code that doesn't exist in production.
 */

import type { BrowserContext } from '@playwright/test';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { discoverChromeExtensionId } from '../../../tests/fixtures/chrome-id-discovery';

describe('Chrome Extension ID Discovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('discoverChromeExtensionId', () => {
    it('should extract ID from service worker URL when worker is ready', async () => {
      const mockServiceWorker = {
        url: () => 'chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef/service-worker-loader.js',
      };

      const mockContext = {
        serviceWorkers: () => [mockServiceWorker],
      } as unknown as BrowserContext;

      const extensionId = await discoverChromeExtensionId(mockContext, '/path/to/manifest.json');

      expect(extensionId).toBe('abcdefghijklmnopqrstuvwxyzabcdef');
    });

    it('should wait for service worker event if not immediately available', async () => {
      const mockServiceWorker = {
        url: () => 'chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef/service-worker-loader.js',
      };

      const mockContext = {
        serviceWorkers: () => [], // Empty initially
        waitForEvent: vi.fn().mockResolvedValue(mockServiceWorker),
      } as unknown as BrowserContext;

      const extensionId = await discoverChromeExtensionId(mockContext, '/path/to/manifest.json');

      expect(mockContext.waitForEvent).toHaveBeenCalledWith('serviceworker', { timeout: 10000 });
      expect(extensionId).toBe('abcdefghijklmnopqrstuvwxyzabcdef');
    });

    it('should validate extension ID is 32 characters', async () => {
      const mockServiceWorker = {
        url: () => 'chrome-extension://short/service-worker-loader.js', // Invalid: too short
      };

      const mockContext = {
        serviceWorkers: () => [mockServiceWorker],
      } as unknown as BrowserContext;

      await expect(
        discoverChromeExtensionId(mockContext, '/path/to/manifest.json'),
      ).rejects.toThrow(/Invalid extension ID/);
    });

    it('should throw error if service worker times out', async () => {
      const mockContext = {
        serviceWorkers: () => [],
        waitForEvent: vi.fn().mockRejectedValue(new Error('Timeout 10000ms exceeded')),
      } as unknown as BrowserContext;

      await expect(
        discoverChromeExtensionId(mockContext, '/path/to/manifest.json'),
      ).rejects.toThrow(/Timeout waiting for extension service worker/);
    });

    it('should handle service worker URL with different paths', async () => {
      const mockServiceWorker = {
        url: () => 'chrome-extension://pppppppppppppppppppppppppppppppp/background.js',
      };

      const mockContext = {
        serviceWorkers: () => [mockServiceWorker],
      } as unknown as BrowserContext;

      const extensionId = await discoverChromeExtensionId(mockContext, '/path/to/manifest.json');

      expect(extensionId).toBe('pppppppppppppppppppppppppppppppp');
    });

    it('should extract ID correctly from standard service worker URL format', async () => {
      // Real-world example format
      const mockServiceWorker = {
        url: () => 'chrome-extension://aapbdbdomjkkjkaonfhkkikfgjllcleb/service-worker-loader.js',
      };

      const mockContext = {
        serviceWorkers: () => [mockServiceWorker],
      } as unknown as BrowserContext;

      const extensionId = await discoverChromeExtensionId(mockContext, '/path/to/manifest.json');

      expect(extensionId).toBe('aapbdbdomjkkjkaonfhkkikfgjllcleb');
      expect(extensionId).toHaveLength(32);
      expect(extensionId).toMatch(/^[a-p]+$/); // Chrome IDs use only a-p
    });

    it('should throw error if extension ID is missing from URL', async () => {
      const mockServiceWorker = {
        url: () => 'chrome-extension:///service-worker-loader.js', // Missing ID
      };

      const mockContext = {
        serviceWorkers: () => [mockServiceWorker],
      } as unknown as BrowserContext;

      await expect(
        discoverChromeExtensionId(mockContext, '/path/to/manifest.json'),
      ).rejects.toThrow(/Invalid extension ID/);
    });

    it('should throw error if extension ID is empty string', async () => {
      const mockServiceWorker = {
        url: () => 'chrome-extension:///', // Empty ID
      };

      const mockContext = {
        serviceWorkers: () => [mockServiceWorker],
      } as unknown as BrowserContext;

      await expect(
        discoverChromeExtensionId(mockContext, '/path/to/manifest.json'),
      ).rejects.toThrow(/Invalid extension ID/);
    });

    it('should ignore manifestPath parameter (kept for interface compatibility)', async () => {
      const mockServiceWorker = {
        url: () => 'chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef/service-worker-loader.js',
      };

      const mockContext = {
        serviceWorkers: () => [mockServiceWorker],
      } as unknown as BrowserContext;

      // manifestPath is ignored, ID comes from service worker URL
      const id1 = await discoverChromeExtensionId(mockContext, '/path/to/manifest.json');
      const id2 = await discoverChromeExtensionId(mockContext, '/different/path/manifest.json');

      expect(id1).toBe(id2);
      expect(id1).toBe('abcdefghijklmnopqrstuvwxyzabcdef');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple service workers by using the first one', async () => {
      const mockServiceWorker1 = {
        url: () => 'chrome-extension://aaaabbbbccccddddeeeeffffgggghhhh/service-worker-loader.js',
      };
      const mockServiceWorker2 = {
        url: () => 'chrome-extension://iiiijjjjkkkkllllmmmmnnnnooooqqqq/service-worker-loader.js',
      };

      const mockContext = {
        serviceWorkers: () => [mockServiceWorker1, mockServiceWorker2],
      } as unknown as BrowserContext;

      const extensionId = await discoverChromeExtensionId(mockContext, '/path/to/manifest.json');

      expect(extensionId).toBe('aaaabbbbccccddddeeeeffffgggghhhh');
    });

    it('should handle service worker URL with query parameters', async () => {
      const mockServiceWorker = {
        url: () => 'chrome-extension://qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq/service-worker-loader.js?v=1',
      };

      const mockContext = {
        serviceWorkers: () => [mockServiceWorker],
      } as unknown as BrowserContext;

      const extensionId = await discoverChromeExtensionId(mockContext, '/path/to/manifest.json');

      // Should still extract ID correctly (before query params)
      expect(extensionId).toBe('qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');
    });

    it('should handle service worker URL with hash fragment', async () => {
      const mockServiceWorker = {
        url: () => 'chrome-extension://rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr/service-worker-loader.js#section',
      };

      const mockContext = {
        serviceWorkers: () => [mockServiceWorker],
      } as unknown as BrowserContext;

      const extensionId = await discoverChromeExtensionId(mockContext, '/path/to/manifest.json');

      expect(extensionId).toBe('rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr');
    });
  });

  describe('Error Messaging', () => {
    it('should provide helpful error message on timeout', async () => {
      const mockContext = {
        serviceWorkers: () => [],
        waitForEvent: vi.fn().mockRejectedValue(new Error('Timeout 10000ms exceeded')),
      } as unknown as BrowserContext;

      await expect(
        discoverChromeExtensionId(mockContext, '/path/to/manifest.json'),
      ).rejects.toThrow(/Ensure extension is built.*pnpm build/);
    });

    it('should include service worker URL in invalid ID error', async () => {
      const mockServiceWorker = {
        url: () => 'chrome-extension://invalid/service-worker-loader.js',
      };

      const mockContext = {
        serviceWorkers: () => [mockServiceWorker],
      } as unknown as BrowserContext;

      await expect(
        discoverChromeExtensionId(mockContext, '/path/to/manifest.json'),
      ).rejects.toThrow(/Service worker URL: chrome-extension:\/\/invalid/);
    });
  });
});
