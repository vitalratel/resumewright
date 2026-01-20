// ABOUTME: WASM initialization state management functions.
// ABOUTME: Provides type-safe access to WASM status with validation.

import { null_, number, picklist, string } from 'valibot';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import { localExtStorage } from '@/shared/infrastructure/storage/typedStorage';
import { setValidatedStorage } from '@/shared/infrastructure/storage/validation';

/**
 * WASM initialization status types
 */
type WasmStatus = 'initializing' | 'success' | 'failed' | 'unknown';

/**
 * Detailed WASM status information
 */
export interface WasmStatusInfo {
  status: WasmStatus;
  error?: string;
}

/**
 * Valibot schema for WASM status validation
 */
const statusSchema = picklist(['initializing', 'success', 'failed'] as const);

/**
 * Mark WASM as initializing
 */
export async function setWasmInitializing(): Promise<void> {
  await setValidatedStorage('wasmStatus', 'initializing', statusSchema);
}

/**
 * Mark WASM as successfully initialized
 *
 * Stores success status and initialization timestamp.
 * Clears any previous error state.
 */
export async function setWasmSuccess(): Promise<void> {
  await setValidatedStorage('wasmStatus', 'success', statusSchema);
  await setValidatedStorage('wasmInitTime', Date.now(), number());
  await setValidatedStorage('wasmInitError', null, null_());
}

/**
 * Mark WASM as failed with error message
 *
 * @param errorMessage - Human-readable error message
 */
export async function setWasmFailed(errorMessage: string): Promise<void> {
  await setValidatedStorage('wasmStatus', 'failed', statusSchema);
  await setValidatedStorage('wasmInitError', errorMessage, string());
}

/**
 * Check if WASM is ready for conversion operations
 *
 * @returns true if WASM initialization succeeded, false otherwise
 */
export async function isWasmReady(): Promise<boolean> {
  try {
    const status = await localExtStorage.getItem('wasmStatus');
    return status === 'success';
  } catch (error) {
    getLogger().error('WasmStateManager', 'Failed to check WASM status', error);
    return false;
  }
}

/**
 * Get detailed WASM status for error messages and diagnostics
 *
 * @returns Status information including error message if failed
 */
export async function getWasmStatus(): Promise<WasmStatusInfo> {
  try {
    const status = await localExtStorage.getItem('wasmStatus');
    const error = await localExtStorage.getItem('wasmInitError');
    return {
      status: status ?? 'unknown',
      error: error ?? undefined,
    };
  } catch (error) {
    getLogger().error('WasmStateManager', 'Failed to get WASM status', error);
    return { status: 'unknown', error: String(error) };
  }
}
