/**
 * Node.js-specific WASM loader
 * Separated to prevent Vite externalization issues in browser/service worker builds
 */

import { accessSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import init from '@pkg/wasm_bridge';
import { getLogger } from '../../infrastructure/logging';

/**
 * Get default WASM path for Node.js environment
 */
export function getDefaultNodeWasmPath(): string {
  // Find the monorepo root by looking for the pkg directory
  // The WASM file is at <monorepo-root>/pkg/wasm_bridge_bg.wasm

  // Start from current working directory and search upwards for pkg directory
  let currentDir = process.cwd();
  const maxDepth = 10; // Safety limit

  for (let i = 0; i < maxDepth; i++) {
    const pkgPath = resolve(currentDir, 'pkg/wasm_bridge_bg.wasm');
    try {
      // Check if file exists synchronously - no await needed
      accessSync(pkgPath);
      return pkgPath;
    }
    catch {
      // Move up one directory
      const parentDir = dirname(currentDir);
      if (parentDir === currentDir) {
        // Reached root without finding pkg
        break;
      }
      currentDir = parentDir;
    }
  }

  // Fallback: WASM is built by wasm-pack to packages/rust-core/wasm-bridge/pkg/
  // From packages/extension, that's ../rust-core/wasm-bridge/pkg/wasm_bridge_bg.wasm
  return resolve(process.cwd(), '../rust-core/wasm-bridge/pkg/wasm_bridge_bg.wasm');
}

/**
 * Initialize WASM in Node.js environment
 */
export async function initWASMNode(wasmPath: string): Promise<void> {
  getLogger().debug('WasmLoaderNode', 'Loading WASM from path', { wasmPath });
  const wasmBytes = readFileSync(wasmPath);
  await init({ module_or_path: wasmBytes });
  getLogger().debug('WasmLoaderNode', 'Loaded WASM from file successfully');
}
