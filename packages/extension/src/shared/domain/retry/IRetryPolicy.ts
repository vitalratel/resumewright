/**
 * Retry Policy Interface
 *
 * Domain interface for retry policies.
 * Abstracts retry logic from specific implementations (exponential backoff, linear, etc.).
 *
 * @module Domain/Retry
 */

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
 * Retry Policy Interface
 *
 * Defines contract for retry mechanisms following Clean Architecture.
 * Implementations can use different strategies (exponential backoff, linear, fibonacci, etc.).
 */
export interface IRetryPolicy {
  /**
   * Execute an operation with retry logic
   *
   * @param operation - Async operation to execute
   * @param onRetry - Optional callback invoked before each retry
   * @returns Promise resolving to operation result
   * @throws Last error if all retries exhausted
   */
  execute: <T>(
    operation: () => Promise<T>,
    onRetry?: RetryCallback
  ) => Promise<T>;

  /**
   * Get current retry configuration
   */
  getConfig: () => Readonly<RetryConfig>;
}
