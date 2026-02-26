// ABOUTME: Orchestrates WASM initialization using service layer components.
// ABOUTME: Provides retry logic and state management for WASM module loading.

import { getLogger } from '@/shared/infrastructure/logging/instance';
import { ErrorCode } from '../shared/errors/codes';
import { executeWithRetry } from '../shared/infrastructure/retry/ExponentialBackoffRetryPolicy';
import { initWASM } from '../shared/infrastructure/wasm/loader';
import { showBadgeError, showBadgeSuccess } from './services/badgeManager';
import type { WasmStatusInfo } from './services/wasmState';
import {
  getWasmStatus as getWasmStatusFromStorage,
  setWasmFailed,
  setWasmInitializing,
  setWasmSuccess,
} from './services/wasmState';

// WASM initialization configuration
const MAX_INIT_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // Start with 1s, exponential backoff
const MAX_RETRY_DELAY = 5000; // Cap at 5s to prevent excessive delays

/**
 * Initialize WASM with retry mechanism
 *
 * Delegates to service layer for:
 * - Retry logic (retryWithBackoff)
 * - Badge updates (showBadgeSuccess, showBadgeError)
 * - State management (setWasmInitializing, setWasmSuccess, setWasmFailed)
 *
 * This function now focuses purely on orchestration.
 */
export async function initializeWASM(): Promise<void> {
  await setWasmInitializing();

  try {
    // Retry WASM initialization with exponential backoff
    await executeWithRetry(
      async () => {
        getLogger().info('WasmInit', 'Attempting initialization');
        await initWASM();
      },
      {
        maxAttempts: MAX_INIT_RETRIES,
        baseDelayMs: RETRY_DELAY_BASE,
        maxDelayMs: MAX_RETRY_DELAY,
      },
      (attempt: number, _delay: number, error: Error) => {
        getLogger().error('WasmInit', 'WASM initialization failed, retrying', {
          code: ErrorCode.WASM_INIT_FAILED,
          attempt,
          maxRetries: MAX_INIT_RETRIES,
          error: error instanceof Error ? error.message : String(error),
        });
      },
    );

    // Success - update state and clear badge
    getLogger().info('WasmInit', 'Initialized successfully');
    await setWasmSuccess();
    await showBadgeSuccess();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    getLogger().error('WasmInit', 'Max retries reached', {
      code: ErrorCode.WASM_INIT_FAILED,
      finalAttempt: MAX_INIT_RETRIES,
      permanentFailure: true,
    });

    // Update state and show error badge
    await setWasmFailed(errorMessage);
    await showBadgeError();

    throw error;
  }
}

/**
 * Get detailed WASM status for error messages.
 */
export async function getWasmStatus(): Promise<WasmStatusInfo> {
  return getWasmStatusFromStorage();
}

/**
 * Expose retry function for manual retry from popup
 */
export async function retryWasmInit(): Promise<void> {
  getLogger().info('WasmInit', 'Manual retry requested');
  await initializeWASM();
}
