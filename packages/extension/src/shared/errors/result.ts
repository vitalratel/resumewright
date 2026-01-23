// ABOUTME: Re-exports neverthrow types and provides domain-specific type aliases.
// ABOUTME: Central entry point for Result pattern usage throughout the codebase.

export { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow';

/**
 * Synchronous Result type alias.
 * Use for functions that return synchronously and may fail.
 *
 * @example
 * function parseJson(input: string): SyncResult<object> {
 *   return tryCatch(() => JSON.parse(input));
 * }
 */
export type SyncResult<T, E = Error> = import('neverthrow').Result<T, E>;

/**
 * Asynchronous Result type alias.
 * Use for async functions that may fail.
 *
 * @example
 * function fetchData(url: string): AsyncResult<Data> {
 *   return tryCatchAsync(() => fetch(url).then(r => r.json()));
 * }
 */
export type AsyncResult<T, E = Error> = import('neverthrow').ResultAsync<T, E>;

// ============================================================================
// Domain-specific Error Types
// ============================================================================

/**
 * Font fetching error.
 * Represents failures during font download from Google Fonts.
 */
export interface FontError {
  type: 'network_timeout' | 'network_error' | 'parse_error' | 'not_found';
  fontFamily: string;
  message: string;
}

/**
 * WASM initialization/execution error.
 */
export interface WasmError {
  type: 'init_failed' | 'execution_error';
  message: string;
}

/**
 * Input/schema validation error.
 */
export interface ValidationError {
  type: 'invalid_input' | 'schema_mismatch';
  field?: string;
  message: string;
}

/**
 * Settings storage error.
 */
export interface SettingsError {
  type: 'validation_failed' | 'storage_failed';
  message: string;
}

/**
 * Configuration error.
 */
export interface ConfigError {
  type: 'invalid_config';
  field?: string;
  message: string;
}

/**
 * Retry policy exhausted error.
 */
export interface RetryExhaustedError {
  type: 'retry_exhausted';
  attempts: number;
  lastError: unknown;
  message: string;
}
