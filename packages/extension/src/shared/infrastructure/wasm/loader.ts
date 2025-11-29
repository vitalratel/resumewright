/**
 * WASM Module Loader
 *
 * Handles loading and initialization of the WASM module.
 * Implements singleton pattern for the WASM module itself.
 */

import process from 'node:process';
// CRITICAL: Service worker global guard
// Service workers don't have 'window', but some bundled code might check for it.
// This guard must run BEFORE any imports to prevent ReferenceError.
import init from '@pkg/wasm_bridge';
import browser from 'webextension-polyfill';
import { getLogger } from '../../infrastructure/logging';

if (typeof window === 'undefined' && typeof self !== 'undefined') {
  // We're in a service worker context
  // Provide a minimal window mock to prevent errors in bundled code
  (globalThis as { window?: unknown }).window = {
    // Stub common methods that might be called
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    // Make it detectable as a mock
    __isServiceWorkerMock: true,
  };
}

let wasmInitialized = false;

// Debug: Verify imports loaded correctly at module level
const logger = getLogger();
logger.debug('WasmLoader', '========== MODULE LOADED ==========');
logger.debug('WasmLoader', 'Checking imports...');
logger.debug('WasmLoader', '  - init type', { initType: typeof init });

/**
 * Lazy import of browser polyfill (only in browser/extension context)
 * This prevents errors when importing this module in Node.js test environment
 * @internal
 */
export function getBrowserPolyfill() {
  // Check if running in Node.js
  if (
    typeof process !== 'undefined'
    && process.versions != null
    && process.versions.node != null
  ) {
    throw new Error('browser polyfill should not be accessed in Node.js environment');
  }
  // Return the statically imported browser polyfill
  // Static import is required because dynamic import() is not supported in Service Workers
  return browser;
}

/**
 * Detect if running in Node.js environment
 * @internal
 */
export function isNodeEnvironment(): boolean {
  return (
    typeof process !== 'undefined'
    && process.versions != null
    && process.versions.node != null
  );
}

/**
 * Detect if running in Service Worker environment
 * @internal
 */
export function isServiceWorkerEnvironment(): boolean {
  // Service worker has self but not window
  // Check using typeof to avoid ReferenceError
  // Firefox MV3 fix: Check for importScripts (unique to workers) instead of ServiceWorkerGlobalScope
  return (
    typeof self !== 'undefined'
    && 'importScripts' in self
    && typeof (self as { importScripts?: unknown }).importScripts === 'function'
    && typeof window === 'undefined'
  );
}

/**
 * Initialize WASM module (call once on extension startup)
 *
 * @param wasmPath - Optional path to WASM file (for Node.js environment)
 *                   If not provided and running in Node.js, auto-constructs path
 * @throws {Error} If WASM initialization fails
 */
export async function initWASM(wasmPath?: string): Promise<void> {
  // ADD: Early error catching to identify silent failures
  try {
    logger.debug('WasmLoader', '========== WASM INITIALIZATION START ==========');

    if (wasmInitialized) {
      logger.debug('WasmLoader', 'WASM already initialized, skipping');
      return;
    }

    // Debug: Verify imports loaded correctly
    logger.debug('WasmLoader', 'Checking imports...');
    logger.debug('WasmLoader', '  - init function type', { initType: typeof init });

    // Auto-detect environment
    const isNode = isNodeEnvironment();
    const isServiceWorker = isServiceWorkerEnvironment();

    logger.debug('WasmLoader', 'Environment detection', { isNode, isServiceWorker });

    if (isNode) {
      logger.debug('WasmLoader', 'Environment: Node.js');
      // Dynamic import only executed in Node.js context
      // @vite-ignore - This import is Node.js-only and won't execute in browser
      const { initWASMNode, getDefaultNodeWasmPath } = await import('./loader.node.js');
      const effectiveWasmPath = (wasmPath !== null && wasmPath !== undefined && wasmPath !== '') ? wasmPath : getDefaultNodeWasmPath();
      logger.debug('WasmLoader', 'Using WASM path', { wasmPath: effectiveWasmPath });
      await initWASMNode(effectiveWasmPath);
    }
    else if (isServiceWorker) {
      logger.debug('WasmLoader', 'Environment: Service Worker');

      // Service workers use the WASM file copied to public assets by WXT module
      // The file is guaranteed to be at 'wasm_bridge_bg.wasm' in the extension root
      const wasmPath = 'wasm_bridge_bg.wasm';
      const browserPolyfill = getBrowserPolyfill();
      const resolvedWasmUrl = browserPolyfill.runtime.getURL(wasmPath);
      logger.debug('WasmLoader', 'Resolved WASM URL', { url: resolvedWasmUrl });

      logger.debug('WasmLoader', 'Fetching WASM...');
      const response = await fetch(resolvedWasmUrl);
      logger.debug('WasmLoader', 'Fetch response', { status: response.status, statusText: response.statusText });

      if (!response.ok) {
        throw new Error(`Failed to fetch WASM: ${response.status} ${response.statusText}. Path: ${resolvedWasmUrl}`);
      }

      const wasmBytes = await response.arrayBuffer();
      logger.debug('WasmLoader', 'Fetched WASM bytes', { byteLength: wasmBytes.byteLength });

      logger.debug('WasmLoader', 'Calling init() with ArrayBuffer...');
      await init({ module_or_path: wasmBytes });
      logger.debug('WasmLoader', 'init() completed successfully');
    }
    else {
      // Browser environment (popup/TSX extractor) - resolve WASM URL for extension context
      logger.debug('WasmLoader', 'Environment: Browser (popup/TSX extractor)');

      // Use the same WASM file copied to public assets by WXT module
      // Same as service worker - the file is at 'wasm_bridge_bg.wasm' in the extension root
      const wasmPath = 'wasm_bridge_bg.wasm';
      const browserPolyfill = getBrowserPolyfill();
      const resolvedWasmUrl = browserPolyfill.runtime.getURL(wasmPath);
      logger.debug('WasmLoader', 'Resolved WASM URL', { url: resolvedWasmUrl });

      logger.debug('WasmLoader', 'Fetching WASM...');
      const response = await fetch(resolvedWasmUrl);
      logger.debug('WasmLoader', 'Fetch response', { status: response.status, statusText: response.statusText });

      if (!response.ok) {
        throw new Error(`Failed to fetch WASM: ${response.status} ${response.statusText}. Path: ${resolvedWasmUrl}`);
      }

      const wasmBytes = await response.arrayBuffer();
      logger.debug('WasmLoader', 'Fetched WASM bytes', { byteLength: wasmBytes.byteLength });

      logger.debug('WasmLoader', 'Calling init() with ArrayBuffer...');
      await init({ module_or_path: wasmBytes });
      logger.debug('WasmLoader', 'init() completed successfully');
    }

    wasmInitialized = true;
    logger.info('WasmLoader', '========== WASM INITIALIZATION SUCCESS ==========');
  }
  catch (error: unknown) {
    logger.error('WasmLoader', '========== WASM INITIALIZATION FAILED ==========');
    logger.error('WasmLoader', 'CRITICAL ERROR', error);
    logger.error('WasmLoader', 'Error type', { errorType: typeof error });

    if (error instanceof Error) {
      logger.error('WasmLoader', 'Error message', { message: error.message });
      logger.error('WasmLoader', 'Error stack', { stack: error.stack });
      throw error; // Preserve original error with stack trace
    }

    logger.error('WasmLoader', 'Error details (JSON)', { error: JSON.stringify(error, null, 2) });
    throw new Error(`WASM initialization failed: ${String(error)}`);
  }
}

/**
 * Check if WASM module is initialized
 */
export function isWASMInitialized(): boolean {
  return wasmInitialized;
}

/**
 * Reset WASM initialization state (for testing only)
 * @internal
 */
export function resetWASMForTesting(): void {
  wasmInitialized = false;
}
