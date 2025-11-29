/**
 * WASM Instance Management
 *
 * Manages lifecycle of WASM converter and generator instances.
 * Implements singleton pattern for shared instances and factory pattern
 * for per-conversion instances.
 */

import type { TsxToPdfConverter } from '../../domain/pdf/types';
import { TsxToPdfConverter as WasmTsxToPdfConverter } from '@pkg/wasm_bridge';
import { isWASMInitialized } from './loader';

/**
 * Create new converter instance (for per-conversion isolation)
 * @throws {Error} If WASM not initialized
 */
export function createConverterInstance(): TsxToPdfConverter {
  if (!isWASMInitialized()) {
    throw new Error('WASM not initialized. Call initWASM() first.');
  }

  return new WasmTsxToPdfConverter() as unknown as TsxToPdfConverter;
}
