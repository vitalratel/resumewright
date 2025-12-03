/**
 * Exponential Backoff Retry Policy
 *
 * Retry logic with exponential backoff strategy and jitter to prevent thundering herd.
 */

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
 * Retry Policy Interface
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
  execute: <T>(operation: () => Promise<T>, onRetry?: RetryCallback) => Promise<T>;

  /**
   * Get current retry configuration
   */
  getConfig: () => Readonly<RetryConfig>;
}

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
 * Exponential Backoff Retry Policy
 *
 * Implements IRetryPolicy with exponential backoff strategy:
 * - Delay increases exponentially: baseDelay * 2^(attempt-1)
 * - Adds ±30% jitter to prevent thundering herd
 * - Caps delay at maxDelayMs
 * - Respects total timeout across all attempts
 * - Supports custom shouldRetry predicate
 */
export class ExponentialBackoffRetryPolicy implements IRetryPolicy {
  private readonly config: Required<RetryConfig>;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Execute operation with exponential backoff retry logic
   */
  async execute<T>(operation: () => Promise<T>, onRetry?: RetryCallback): Promise<T> {
    const startTime = Date.now();
    let lastError: Error | undefined;

    return this.attemptOperation(operation, 1, startTime, lastError, onRetry);
  }

  /**
   * Get current retry configuration
   */
  getConfig(): Readonly<RetryConfig> {
    return this.config;
  }

  /**
   * Recursive retry implementation
   * Avoids await-in-loop linter warning
   */
  private async attemptOperation<T>(
    operation: () => Promise<T>,
    attempt: number,
    startTime: number,
    lastError: Error | undefined,
    onRetry?: RetryCallback,
  ): Promise<T> {
    // Check if total timeout exceeded
    const elapsed = Date.now() - startTime;
    if (this.config.timeoutMs && elapsed > this.config.timeoutMs) {
      throw new Error(
        `Retry timeout exceeded (${this.config.timeoutMs}ms after ${attempt - 1} attempts). Last error: ${lastError?.message}`,
      );
    }

    // Check if max attempts exceeded
    if (attempt > this.config.maxAttempts) {
      throw lastError || new Error('Max retry attempts exceeded');
    }

    try {
      // Execute the operation
      return await operation();
    } catch (error) {
      const currentError = error as Error;

      // Check if error should be retried
      const shouldRetry = this.config.shouldRetry(error);

      // If not retryable or last attempt, throw immediately
      if (!shouldRetry || attempt === this.config.maxAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = this.calculateDelay(attempt);

      // Notify callback
      onRetry?.(attempt, delay, currentError);

      // Log retry attempt
      getLogger().debug(
        'RetryPolicy',
        `Retry attempt ${attempt}/${this.config.maxAttempts} after ${delay}ms:`,
        currentError.message,
      );

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry with next attempt (pass current error for next iteration)
      return this.attemptOperation(operation, attempt + 1, startTime, currentError, onRetry);
    }
  }

  /**
   * Calculate delay for retry attempt using exponential backoff with jitter
   *
   * Formula: delay = min(baseDelay * 2^(attempt-1) + jitter, maxDelay)
   * Jitter: ±30% random variation to prevent thundering herd
   */
  private calculateDelay(attempt: number): number {
    // Exponential backoff: baseDelay * 2^(attempt-1)
    const exponentialDelay = this.config.baseDelayMs * 2 ** (attempt - 1);

    // Add jitter: ±30% random variation
    const jitter = exponentialDelay * 0.3 * (Math.random() * 2 - 1);

    // Apply jitter and cap at maxDelay
    const delay = Math.min(exponentialDelay + jitter, this.config.maxDelayMs);

    return Math.floor(delay);
  }

  /**
   * Create predefined retry policies for common scenarios
   */
  static readonly presets = {
    /**
     * Network retry policy - Aggressive retries for transient network failures
     */
    network: new ExponentialBackoffRetryPolicy({
      maxAttempts: 5,
      baseDelayMs: 2000,
      maxDelayMs: 16000,
      timeoutMs: 60000,
      shouldRetry: (error) => {
        // Retry on network errors and timeouts
        return (
          error instanceof TypeError ||
          (error instanceof DOMException && error.name === 'TimeoutError')
        );
      },
    }),

    /**
     * WASM retry policy - Conservative retries for initialization failures
     */
    wasm: new ExponentialBackoffRetryPolicy({
      maxAttempts: 2,
      baseDelayMs: 500,
      maxDelayMs: 2000,
      timeoutMs: 10000,
    }),

    /**
     * Storage retry policy - Quick retries for storage quota/lock issues
     */
    storage: new ExponentialBackoffRetryPolicy({
      maxAttempts: 3,
      baseDelayMs: 200,
      maxDelayMs: 1000,
      timeoutMs: 5000,
    }),

    /**
     * Default retry policy - Balanced configuration for general use
     */
    default: new ExponentialBackoffRetryPolicy(DEFAULT_CONFIG),
  };
}
