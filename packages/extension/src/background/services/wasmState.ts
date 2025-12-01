/**
 * WASM State Manager Service
 *
 * Manages WASM initialization state in browser storage.
 * Provides type-safe access to WASM status with validation.
 */

import { null_, number, picklist, string } from '@/shared/domain/validation/valibot';
import { getLogger } from '@/shared/infrastructure/logging';
import { localExtStorage, setValidatedStorage } from '@/shared/infrastructure/storage';

/**
 * WASM initialization status types
 */
export type WasmStatus = 'initializing' | 'success' | 'failed' | 'unknown';

/**
 * Detailed WASM status information
 */
export interface WasmStatusInfo {
  status: WasmStatus;
  error?: string;
}

/**
 * WASM State Manager
 *
 * Centralized state management for WASM initialization lifecycle.
 * All storage operations are validated using valibot schemas.
 *
 * @example
 * ```ts
 * const stateManager = new WasmStateManager();
 *
 * await stateManager.setInitializing();
 * // ... initialization logic
 * await stateManager.setSuccess();
 *
 * const isReady = await stateManager.isReady();
 * ```
 */
export class WasmStateManager {
  private readonly statusSchema = picklist(['initializing', 'success', 'failed'] as const);

  /**
   * Mark WASM as initializing
   */
  async setInitializing(): Promise<void> {
    await setValidatedStorage('wasmStatus', 'initializing', this.statusSchema);
  }

  /**
   * Mark WASM as successfully initialized
   *
   * Stores success status and initialization timestamp.
   * Clears any previous error state.
   */
  async setSuccess(): Promise<void> {
    await setValidatedStorage('wasmStatus', 'success', this.statusSchema);
    await setValidatedStorage('wasmInitTime', Date.now(), number());
    await setValidatedStorage('wasmInitError', null, null_());
  }

  /**
   * Mark WASM as failed with error message
   *
   * @param errorMessage - Human-readable error message
   */
  async setFailed(errorMessage: string): Promise<void> {
    await setValidatedStorage('wasmStatus', 'failed', this.statusSchema);
    await setValidatedStorage('wasmInitError', errorMessage, string());
  }

  /**
   * Check if WASM is ready for conversion operations
   *
   * @returns true if WASM initialization succeeded, false otherwise
   */
  async isReady(): Promise<boolean> {
    try {
      const status = await localExtStorage.getItem('wasmStatus');
      return status === 'success';
    }
    catch (error) {
      getLogger().error('WasmStateManager', 'Failed to check WASM status', error);
      return false;
    }
  }

  /**
   * Get detailed WASM status for error messages and diagnostics
   *
   * @returns Status information including error message if failed
   */
  async getStatus(): Promise<WasmStatusInfo> {
    try {
      const status = await localExtStorage.getItem('wasmStatus');
      const error = await localExtStorage.getItem('wasmInitError');
      return {
        status: status ?? 'unknown',
        error: error ?? undefined,
      };
    }
    catch (error) {
      getLogger().error('WasmStateManager', 'Failed to get WASM status', error);
      return { status: 'unknown', error: String(error) };
    }
  }
}
