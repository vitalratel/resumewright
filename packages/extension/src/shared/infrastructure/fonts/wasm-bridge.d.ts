/**
 * TypeScript declarations for WASM bridge module
 *
 * This module is generated at build time by wasm-pack from the Rust crate.
 * These declarations provide type safety for the WebAssembly functions.
 */

declare module '*/pkg/wasm_bridge' {
  /**
   * Decompresses a WOFF font to TrueType format
   * @param bytes - WOFF font file bytes
   * @returns Decompressed TrueType font bytes
   * @throws Error if decompression fails
   */
  export function decompress_woff_font(bytes: Uint8Array): Uint8Array;

  /**
   * Decompresses a WOFF2 font to TrueType format
   * @param bytes - WOFF2 font file bytes
   * @returns Decompressed TrueType font bytes
   * @throws Error if decompression fails
   */
  export function decompress_woff2_font(bytes: Uint8Array): Uint8Array;
}
