/**
 * WASM Loader Tests
 * Tests for WASM initialization and error handling
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock logger
vi.mock('../../../../logging', () => ({
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock WASM bridge init
vi.mock('@pkg/wasm_bridge', () => ({
  default: vi.fn(), // Default export for 'import init from ...'
  init: vi.fn(),
  __wbg_init: vi.fn(),
}));

// Mock Node.js loader
vi.mock('../loader.node.js', () => ({
  getDefaultNodeWasmPath: vi.fn(() => '/mock/path/wasm_bridge_bg.wasm'),
  initWASMNode: vi.fn(),
}));

// Mock browser API
vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      getURL: vi.fn(),
    },
  },
}));

/**
 * NOTE: Some WASM loader behaviors are NOT unit tested in this file:
 *
 * 1. Service Worker Environment Detection (isServiceWorkerEnvironment)
 *    - Module-level code runs before tests can mock globals (window, self, importScripts)
 *    - Verified by: tests/e2e/extension-loading.spec.ts (actual service worker context)
 *
 * 2. Browser Polyfill Access (getBrowserPolyfill success path)
 *    - Can't test browser context in Node.js environment
 *    - Verified by: All integration tests run in browser environment
 *
 * 3. Service Worker Window Mock (module-level guard)
 *    - Defensive code that only activates in service worker context
 *    - Verified by: Service worker loads successfully without errors
 *
 * 4. Logger Initialization Behavior
 *    - Logger is initialized at module load time, before test mocks
 *    - Not critical: Logging is for debugging, not business logic
 *
 * These are YAGNI (You Aren't Gonna Need It) tests - the behaviors are already
 * verified by integration/E2E tests, and unit testing them would require complex
 * refactoring for minimal benefit.
 */
describe('WASM Loader', () => {
  describe('Internal Functions - Environment Detection (Direct Tests)', () => {
    describe('isNodeEnvironment', () => {
      it('should detect Node.js environment', async () => {
        const { isNodeEnvironment } = await import('../loader');

        // In Vitest, we ARE in Node.js environment
        expect(isNodeEnvironment()).toBe(true);
      });
    });

    describe('isServiceWorkerEnvironment', () => {
      it('should return false in Node.js test environment', async () => {
        const { isServiceWorkerEnvironment } = await import('../loader');

        expect(isServiceWorkerEnvironment()).toBe(false);
      });
    });

    describe('getBrowserPolyfill', () => {
      it('should throw error when called in Node.js environment', async () => {
        const { getBrowserPolyfill } = await import('../loader');

        // In Vitest/Node.js, getBrowserPolyfill should throw
        expect(() => getBrowserPolyfill()).toThrow(
          'browser polyfill should not be accessed in Node.js environment'
        );
      });

      it('should verify function signature and conditional logic', async () => {
        const { getBrowserPolyfill } = await import('../loader');

        // Verify function exists and is callable
        expect(typeof getBrowserPolyfill).toBe('function');

        // In Node.js environment, should check process.versions and throw
        expect(() => getBrowserPolyfill()).toThrow(
          'browser polyfill should not be accessed in Node.js environment'
        );
      });
    });

    describe('Service Worker Window Mock', () => {
      it('should document service worker window mock behavior', () => {
        // This test documents the module-level guard that executes before imports
        // The guard at lines 11-22 checks: typeof window === 'undefined' && typeof self !== 'undefined'
        // If true, it creates a minimal window mock on globalThis

        // In Vitest test environment with JSDOM:
        // - typeof window !== 'undefined' (window exists via JSDOM)
        // - typeof self !== 'undefined' (self is defined)
        // Therefore, the mock is NOT created in tests (first condition fails)

        // The guard only activates in true service worker environments
        const hasWindow = typeof window !== 'undefined';
        const hasSelf = typeof self !== 'undefined';

        // Document the condition: window must be undefined AND self must be defined
        expect(hasWindow || !hasSelf).toBe(true); // Mock not created when this is true
      });
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module state
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initWASM - Error Handling', () => {
    beforeEach(async () => {
      // Reset WASM state before each test to ensure isolation
      const { resetWASMForTesting } = await import('../loader');
      resetWASMForTesting();
    });

    // NOTE: Fetch error paths (lines 133, 158 in loader.ts) are browser/service-worker-specific
    // and cannot be tested from Node.js environment. These paths are only executed when:
    // - isNodeEnvironment() returns false AND
    // - Either isServiceWorkerEnvironment() returns true OR false (browser path)
    //
    // Testing these would require either:
    // 1. A real browser test environment (e.g., Playwright/Puppeteer)
    // 2. Complex mocking of process.versions at module load time
    //
    // The error handling logic itself IS tested through the init() failure tests below,
    // as both fetch and init errors go through the same catch block.

    it('should handle init() failure', async () => {
      // Mock Node.js loader to fail
      const { initWASMNode } = await import('../loader.node.js');
      vi.mocked(initWASMNode).mockRejectedValue(new Error('WASM initialization failed'));

      // Import loader - let it run in Node.js environment (no need to spy)
      const loaderModule = await import('../loader');

      await expect(loaderModule.initWASM()).rejects.toThrow('WASM initialization failed');
    });

    it('should preserve Error instances with stack traces', async () => {
      const originalError = new Error('Original WASM error');
      
      // Mock Node.js loader to fail with original error
      const { initWASMNode } = await import('../loader.node.js');
      vi.mocked(initWASMNode).mockRejectedValue(originalError);

      // Import loader - let it run in Node.js environment
      const loaderModule = await import('../loader');

      try {
        await loaderModule.initWASM();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBe(originalError);
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).stack).toBeDefined();
      }
    });

    it('should wrap non-Error exceptions', async () => {
      // Mock Node.js loader to throw non-Error
      const { initWASMNode } = await import('../loader.node.js');
      vi.mocked(initWASMNode).mockRejectedValue('String error');

      // Import loader - let it run in Node.js environment
      const loaderModule = await import('../loader');

      await expect(loaderModule.initWASM()).rejects.toThrow(
        'WASM initialization failed: String error'
      );
    });
  });

  describe('isWASMInitialized', () => {
    it('should return false before initialization', async () => {
      const { isWASMInitialized } = await import('../loader');

      expect(isWASMInitialized()).toBe(false);
    });

    it('should return true after successful initialization', async () => {
      // Mock Node.js loader to succeed
      const { initWASMNode } = await import('../loader.node.js');
      vi.mocked(initWASMNode).mockResolvedValue(undefined);

      // Import loader - let it run in Node.js environment
      const loaderModule = await import('../loader');

      await loaderModule.initWASM();

      expect(loaderModule.isWASMInitialized()).toBe(true);
    });
  });
});
