// ABOUTME: Orchestrates WASM initialization using service layer components.
// ABOUTME: Provides retry logic and state management for WASM module loading.

import { getLogger } from '@/shared/infrastructure/logging/instance';
import { createWasmInitError } from '../shared/errors/factory/wasmErrors';
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
        const result = await initWASM();

        // Convert Result error to thrown error for retry mechanism
        if (result.isErr()) {
          throw new Error(result.error.message);
        }
      },
      {
        maxAttempts: MAX_INIT_RETRIES,
        baseDelayMs: RETRY_DELAY_BASE,
        maxDelayMs: MAX_RETRY_DELAY,
      },
      (attempt: number, _delay: number, error: Error) => {
        // Use shared error factory for consistent error handling
        const technicalDetails =
          error instanceof Error
            ? `${error.message}
${error.stack}`
            : String(error);
        const conversionError = createWasmInitError('failed', technicalDetails);

        // Log retry attempts with structured data
        getLogger().error('WasmInit', 'WASM initialization failed, retrying', {
          code: conversionError.code,
          attempt,
          maxRetries: MAX_INIT_RETRIES,
          browserInfo: {
            userAgent: navigator.userAgent,
          },
        });
      },
    );

    // Success - update state and clear badge
    getLogger().info('WasmInit', 'Initialized successfully');
    await setWasmSuccess();
    await showBadgeSuccess();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Use shared error factory for max retries error
    const maxRetriesError = createWasmInitError(
      'failed',
      `Failed after ${MAX_INIT_RETRIES} initialization attempts`,
    );

    getLogger().error('WasmInit', 'Max retries reached', {
      code: maxRetriesError.code,
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
