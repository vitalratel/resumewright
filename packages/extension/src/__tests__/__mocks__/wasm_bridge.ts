/**
 * Mock WASM Bridge Module
 *
 * This is a mock implementation of the @pkg/wasm_bridge module for testing.
 * For most tests, the WASM module is not needed and we provide a no-op mock.
 *
 * For integration tests that need the real WASM, they should import from the
 * actual pkg location using Node.js path resolution.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Try to import the real WASM module if it exists (for integration tests)
let realWasmModule: Record<string, unknown> | null = null;

// Check if real WASM exists (in Node.js environment)
if (typeof process !== 'undefined' && process.versions?.node) {
  const wasmPath = resolve(__dirname, '../../../../../rust-core/wasm-bridge/pkg/wasm_bridge.js');
  if (existsSync(wasmPath)) {
    try {
      // Use top-level await with dynamic import (modern ES module approach)
      realWasmModule = await import(wasmPath);
    } catch {
      // Real WASM not available, will use mock
    }
  }
}

/**
 * Init function - uses real WASM if available, otherwise returns mock
 */
const init =
  realWasmModule?.default ??
  (async (): Promise<void> => {
    return Promise.resolve();
  });

// Export real WASM types and functions if available, otherwise empty exports
export default init;
export const TsxToPdfConverter = realWasmModule?.TsxToPdfConverter;
export const FontCollection = realWasmModule?.FontCollection;
export const FontData = realWasmModule?.FontData;
export const PdfBytes = realWasmModule?.PdfBytes;
export const ConversionConfig = realWasmModule?.ConversionConfig;
export const ConversionError = realWasmModule?.ConversionError;
