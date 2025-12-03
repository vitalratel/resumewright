/**
 * WASM Initialization Module
 *
 * Orchestrates WASM initialization using service layer components.
 * Refactored for maintainability and separation of concerns.
 */

import { getLogger } from '@/shared/infrastructure/logging/instance';
import { createWasmInitError } from '../shared/errors/factory/wasmErrors';
import { ExponentialBackoffRetryPolicy } from '../shared/infrastructure/retry/ExponentialBackoffRetryPolicy';
import { initWASM } from '../shared/infrastructure/wasm/loader';
import { BadgeManager } from './services/badgeManager';
import type { WasmStatusInfo } from './services/wasmState';
import { WasmStateManager } from './services/wasmState';

// WASM initialization configuration
const MAX_INIT_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // Start with 1s, exponential backoff
const MAX_RETRY_DELAY = 5000; // Cap at 5s to prevent excessive delays

// Service instances
const badgeManager = new BadgeManager();
const stateManager = new WasmStateManager();

/**
 * Initialize WASM with retry mechanism
 *
 * Delegates to service layer for:
 * - Retry logic (retryWithBackoff)
 * - Badge updates (BadgeManager)
 * - State management (WasmStateManager)
 *
 * This function now focuses purely on orchestration.
 */
export async function initializeWASM(): Promise<void> {
  await stateManager.setInitializing();

  try {
    // Retry WASM initialization with exponential backoff
    const retryPolicy = new ExponentialBackoffRetryPolicy({
      maxAttempts: MAX_INIT_RETRIES,
      baseDelayMs: RETRY_DELAY_BASE,
      maxDelayMs: MAX_RETRY_DELAY,
    });

    await retryPolicy.execute(
      async () => {
        getLogger().info('WasmInit', 'Attempting initialization');
        await initWASM();
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
          errorId: conversionError.errorId,
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
    await stateManager.setSuccess();
    await badgeManager.showSuccess();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Use shared error factory for max retries error
    const maxRetriesError = createWasmInitError(
      'failed',
      `Failed after ${MAX_INIT_RETRIES} initialization attempts`,
    );

    getLogger().error('WasmInit', 'Max retries reached', {
      errorId: maxRetriesError.errorId,
      code: maxRetriesError.code,
      finalAttempt: MAX_INIT_RETRIES,
      permanentFailure: true,
    });

    // Update state and show error badge
    await stateManager.setFailed(errorMessage);
    await badgeManager.showError();

    throw error;
  }
}

/**
 * Get detailed WASM status for error messages.
 */
export async function getWasmStatus(): Promise<WasmStatusInfo> {
  return stateManager.getStatus();
}

/**
 * Expose retry function for manual retry from popup
 */
export async function retryWasmInit(): Promise<void> {
  getLogger().info('WasmInit', 'Manual retry requested');
  await initializeWASM();
}
