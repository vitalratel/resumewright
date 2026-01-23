// ABOUTME: Adapter utilities to wrap throwing functions into Result pattern.
// ABOUTME: Provides tryCatch for sync and tryCatchAsync for async functions.

import { err, ok, type Result, type ResultAsync } from 'neverthrow';

/**
 * Wrap a synchronous throwing function into a Result.
 *
 * @param fn - Function that may throw
 * @param mapError - Optional function to transform the caught error
 * @returns Result with success value or caught error
 *
 * @example
 * const result = tryCatch(() => JSON.parse(input));
 * if (result.isOk()) {
 *   console.log(result.value);
 * }
 *
 * @example
 * // With error mapping
 * const result = tryCatch(
 *   () => riskyOperation(),
 *   (e) => ({ type: 'operation_failed', cause: e })
 * );
 */
export function tryCatch<T, E = unknown>(
  fn: () => T,
  mapError?: (error: unknown) => E,
): Result<T, E> {
  try {
    return ok(fn());
  } catch (error) {
    return err(mapError ? mapError(error) : (error as E));
  }
}

/**
 * Wrap an asynchronous throwing function into a ResultAsync.
 *
 * @param fn - Async function that may throw or return a rejected promise
 * @param mapError - Optional function to transform the caught error
 * @returns ResultAsync with success value or caught error
 *
 * @example
 * const result = await tryCatchAsync(() => fetch(url).then(r => r.json()));
 * result.match(
 *   (data) => console.log('Success:', data),
 *   (error) => console.error('Failed:', error)
 * );
 *
 * @example
 * // With error mapping
 * const result = await tryCatchAsync(
 *   () => networkCall(),
 *   (e) => ({ type: 'network_error', message: String(e) })
 * );
 */
export async function tryCatchAsync<T, E = unknown>(
  fn: () => Promise<T>,
  mapError?: (error: unknown) => E,
): Promise<Result<T, E>> {
  try {
    const value = await fn();
    return ok(value);
  } catch (error) {
    return err(mapError ? mapError(error) : (error as E));
  }
}

/**
 * Type for ResultAsync without importing it directly.
 * Useful for type annotations when you want to avoid importing from neverthrow.
 */
export type { Result, ResultAsync };
