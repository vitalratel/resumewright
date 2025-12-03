/**
 * WASM Module Loader
 *
 * Handles loading and initialization of the WASM module.
 * Implements singleton pattern for the WASM module itself.
 */

import process from 'node:process';
import init from '@pkg/wasm_bridge';
import { getLogger } from '../../infrastructure/logging';

let wasmInitialized = false;

/** Lazy logger getter to avoid module-level initialization */
function logger() {
  return getLogger();
}

/**
 * Lazy import of browser polyfill (only in browser/extension context)
 * This prevents errors when importing this module in Node.js test environment
 * @internal
 */
export function getBrowserPolyfill() {
  // Check if running in Node.js
  if (typeof process !== 'undefined' && process.versions != null && process.versions.node != null) {
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
    typeof process !== 'undefined' && process.versions != null && process.versions.node != null
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
    typeof self !== 'undefined' &&
    'importScripts' in self &&
    typeof (self as { importScripts?: unknown }).importScripts === 'function' &&
    typeof window === 'undefined'
  );
}

/**
 * Fetch and initialize WASM in browser/extension context
 * @internal
 */
async function initWASMFromExtension(environmentName: string): Promise<void> {
  logger().debug('WasmLoader', `Environment: ${environmentName}`);

  // WASM file is copied to public assets by WXT module at 'wasm_bridge_bg.wasm'
  const wasmPath = 'wasm_bridge_bg.wasm';
  const browserPolyfill = getBrowserPolyfill();
  // Type assertion needed because WXT's PublicPath type doesn't include WASM files
  const resolvedWasmUrl = (browserPolyfill.runtime.getURL as (path: string) => string)(wasmPath);
  logger().debug('WasmLoader', 'Resolved WASM URL', { url: resolvedWasmUrl });

  logger().debug('WasmLoader', 'Fetching WASM...');
  const response = await fetch(resolvedWasmUrl);
  logger().debug('WasmLoader', 'Fetch response', {
    status: response.status,
    statusText: response.statusText,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch WASM: ${response.status} ${response.statusText}. Path: ${resolvedWasmUrl}`,
    );
  }

  const wasmBytes = await response.arrayBuffer();
  logger().debug('WasmLoader', 'Fetched WASM bytes', { byteLength: wasmBytes.byteLength });

  logger().debug('WasmLoader', 'Calling init() with ArrayBuffer...');
  await init({ module_or_path: wasmBytes });
  logger().debug('WasmLoader', 'init() completed successfully');
}

/**
 * Initialize WASM module (call once on extension startup)
 *
 * @param wasmPath - Optional path to WASM file (for Node.js environment)
 *                   If not provided and running in Node.js, auto-constructs path
 * @throws {Error} If WASM initialization fails
 */
export async function initWASM(wasmPath?: string): Promise<void> {
  try {
    logger().debug('WasmLoader', 'WASM initialization starting');

    if (wasmInitialized) {
      logger().debug('WasmLoader', 'WASM already initialized, skipping');
      return;
    }

    const isNode = isNodeEnvironment();
    const isServiceWorker = isServiceWorkerEnvironment();

    logger().debug('WasmLoader', 'Environment detection', { isNode, isServiceWorker });

    if (isNode) {
      logger().debug('WasmLoader', 'Environment: Node.js');
      const { initWASMNode, getDefaultNodeWasmPath } = await import('./loader.node.js');
      const effectiveWasmPath =
        wasmPath !== null && wasmPath !== undefined && wasmPath !== ''
          ? wasmPath
          : getDefaultNodeWasmPath();
      logger().debug('WasmLoader', 'Using WASM path', { wasmPath: effectiveWasmPath });
      await initWASMNode(effectiveWasmPath);
    } else if (isServiceWorker) {
      await initWASMFromExtension('Service Worker');
    } else {
      await initWASMFromExtension('Browser (popup/TSX extractor)');
    }

    wasmInitialized = true;
    logger().info('WasmLoader', 'WASM initialization successful');
  } catch (error: unknown) {
    logger().error('WasmLoader', 'WASM initialization failed', error);

    if (error instanceof Error) {
      throw error;
    }

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
