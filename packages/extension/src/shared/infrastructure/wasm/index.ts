/**
 * WASM Service Module
 *
 * Public API for WASM integration.
 * Re-exports loading and instance management functions.
 */

export { createConverterInstance } from './instance';
export { initWASM, isWASMInitialized } from './loader';
