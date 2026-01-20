// ABOUTME: Exponential backoff retry logic with jitter to prevent thundering herd.
// ABOUTME: Provides executeWithRetry function and preset configurations for common scenarios.

import { getLogger } from '../logging/instance';

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;

  /** Base delay in milliseconds between retries */
  baseDelayMs: number;

  /** Maximum delay in milliseconds (for exponential backoff) */
  maxDelayMs?: number;

  /** Total timeout in milliseconds for all attempts */
  timeoutMs?: number;

  /** Custom predicate to determine if error should be retried */
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Retry callback for progress updates
 */
export type RetryCallback = (attempt: number, delay: number, error: Error) => void;

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
  timeoutMs: 20000,
  shouldRetry: () => true, // Retry all errors by default
};

/**
 * Preset configurations for common retry scenarios
 */
export const retryPresets = {
  /**
   * Network retry - Aggressive retries for transient network failures
   */
  network: {
    maxAttempts: 5,
    baseDelayMs: 2000,
    maxDelayMs: 16000,
    timeoutMs: 60000,
    shouldRetry: (error: unknown) => {
      // Retry on network errors and timeouts
      return (
        error instanceof TypeError ||
        (error instanceof DOMException && error.name === 'TimeoutError')
      );
    },
  },

  /**
   * WASM retry - Conservative retries for initialization failures
   */
  wasm: {
    maxAttempts: 2,
    baseDelayMs: 500,
    maxDelayMs: 2000,
    timeoutMs: 10000,
  },

  /**
   * Storage retry - Quick retries for storage quota/lock issues
   */
  storage: {
    maxAttempts: 3,
    baseDelayMs: 200,
    maxDelayMs: 1000,
    timeoutMs: 5000,
  },

  /**
   * Default retry - Balanced configuration for general use
   */
  default: DEFAULT_CONFIG,
} as const satisfies Record<string, Partial<RetryConfig>>;

/**
 * Execute operation with exponential backoff retry logic
 *
 * Retry strategy:
 * - Delay increases exponentially: baseDelay * 2^(attempt-1)
 * - Adds ±30% jitter to prevent thundering herd
 * - Caps delay at maxDelayMs
 * - Respects total timeout across all attempts
 * - Supports custom shouldRetry predicate
 *
 * @param operation - Async operation to execute
 * @param config - Retry configuration (uses defaults for missing values)
 * @param onRetry - Optional callback for retry progress updates
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>,
  onRetry?: RetryCallback,
): Promise<T> {
  const resolvedConfig: Required<RetryConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const startTime = Date.now();
  return attemptOperation(operation, resolvedConfig, 1, startTime, undefined, onRetry);
}

/**
 * Recursive retry implementation (internal)
 */
async function attemptOperation<T>(
  operation: () => Promise<T>,
  config: Required<RetryConfig>,
  attempt: number,
  startTime: number,
  lastError: Error | undefined,
  onRetry?: RetryCallback,
): Promise<T> {
  // Check if total timeout exceeded
  const elapsed = Date.now() - startTime;
  if (config.timeoutMs && elapsed > config.timeoutMs) {
    throw new Error(
      `Retry timeout exceeded (${config.timeoutMs}ms after ${attempt - 1} attempts). Last error: ${lastError?.message}`,
    );
  }

  // Check if max attempts exceeded
  if (attempt > config.maxAttempts) {
    throw lastError || new Error('Max retry attempts exceeded');
  }

  try {
    // Execute the operation
    return await operation();
  } catch (error) {
    const currentError = error as Error;

    // Check if error should be retried
    const shouldRetry = config.shouldRetry(error);

    // If not retryable or last attempt, throw immediately
    if (!shouldRetry || attempt === config.maxAttempts) {
      throw error;
    }

    // Calculate delay with exponential backoff and jitter
    const delay = calculateDelay(attempt, config);

    // Notify callback
    onRetry?.(attempt, delay, currentError);

    // Log retry attempt
    getLogger().debug(
      'RetryPolicy',
      `Retry attempt ${attempt}/${config.maxAttempts} after ${delay}ms:`,
      currentError.message,
    );

    // Wait before next retry
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retry with next attempt (pass current error for next iteration)
    return attemptOperation(operation, config, attempt + 1, startTime, currentError, onRetry);
  }
}

/**
 * Calculate delay for retry attempt using exponential backoff with jitter
 *
 * Formula: delay = min(baseDelay * 2^(attempt-1) + jitter, maxDelay)
 * Jitter: ±30% random variation to prevent thundering herd
 */
function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
  // Exponential backoff: baseDelay * 2^(attempt-1)
  const exponentialDelay = config.baseDelayMs * 2 ** (attempt - 1);

  // Add jitter: ±30% random variation
  const jitter = exponentialDelay * 0.3 * (Math.random() * 2 - 1);

  // Apply jitter and cap at maxDelay
  const delay = Math.min(exponentialDelay + jitter, config.maxDelayMs);

  return Math.floor(delay);
}
