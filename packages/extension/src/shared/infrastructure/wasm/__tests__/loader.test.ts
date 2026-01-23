// ABOUTME: Tests for WASM loader initialization and error handling.
// ABOUTME: Verifies environment detection, Result-based error handling, and state management.

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
          'browser polyfill should not be accessed in Node.js environment',
        );
      });

      it('should verify function signature and conditional logic', async () => {
        const { getBrowserPolyfill } = await import('../loader');

        // Verify function exists and is callable
        expect(typeof getBrowserPolyfill).toBe('function');

        // In Node.js environment, should check process.versions and throw
        expect(() => getBrowserPolyfill()).toThrow(
          'browser polyfill should not be accessed in Node.js environment',
        );
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

  describe('initWASM - Error Handling with Result pattern', () => {
    beforeEach(async () => {
      // Reset WASM state before each test to ensure isolation
      const { resetWASMForTesting } = await import('../loader');
      resetWASMForTesting();
    });

    it('should return err result on init() failure', async () => {
      // Mock Node.js loader to fail
      const { initWASMNode } = await import('../loader.node.js');
      vi.mocked(initWASMNode).mockRejectedValue(new Error('WASM initialization failed'));

      // Import loader - let it run in Node.js environment (no need to spy)
      const loaderModule = await import('../loader');

      const result = await loaderModule.initWASM();
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('init_failed');
        expect(result.error.message).toContain('WASM initialization failed');
      }
    });

    it('should map error to WasmError with init_failed type', async () => {
      const originalError = new Error('Original WASM error');

      // Mock Node.js loader to fail with original error
      const { initWASMNode } = await import('../loader.node.js');
      vi.mocked(initWASMNode).mockRejectedValue(originalError);

      // Import loader - let it run in Node.js environment
      const loaderModule = await import('../loader');

      const result = await loaderModule.initWASM();
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('init_failed');
        expect(result.error.message).toContain('Original WASM error');
      }
    });

    it('should wrap non-Error exceptions in WasmError', async () => {
      // Mock Node.js loader to throw non-Error
      const { initWASMNode } = await import('../loader.node.js');
      vi.mocked(initWASMNode).mockRejectedValue('String error');

      // Import loader - let it run in Node.js environment
      const loaderModule = await import('../loader');

      const result = await loaderModule.initWASM();
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('init_failed');
        expect(result.error.message).toContain('String error');
      }
    });

    it('should return ok result on successful initialization', async () => {
      // Mock Node.js loader to succeed
      const { initWASMNode } = await import('../loader.node.js');
      vi.mocked(initWASMNode).mockResolvedValue(undefined);

      // Import loader - let it run in Node.js environment
      const loaderModule = await import('../loader');

      const result = await loaderModule.initWASM();
      expect(result.isOk()).toBe(true);
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

      const result = await loaderModule.initWASM();
      expect(result.isOk()).toBe(true);
      expect(loaderModule.isWASMInitialized()).toBe(true);
    });
  });
});
