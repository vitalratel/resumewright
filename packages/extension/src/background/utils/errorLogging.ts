/**
 * Structured Error Logging for Background Operations
 * Add error message context for better debugging
 *
 * Provides structured logging with operation context for all background errors.
 */

import { getLogger } from '@/shared/infrastructure/logging';

/**
 * Structured context for error logging
 */
export interface ErrorContext {
  /** Which step/phase of the operation failed */
  step?: string;
  /** Additional context-specific data */
  [key: string]: unknown;
}

/**
 * Log background operation error with structured context
 *
 * @param operation - Human-readable operation name (e.g., "WASM initialization", "PDF generation")
 * @param error - The error that occurred
 * @param context - Additional context about the operation
 *
 * @example
 * ```ts
 * try {
 *   await initWasm();
 * } catch (error) {
 *   logBackgroundError('WASM initialization', error, {
 *     step: 'startup',
 *     wasmPath: url,
 *     memoryPages: 256,
 *   });
 *   throw error;
 * }
 * ```
 */
export function logBackgroundError(
  operation: string,
  error: unknown,
  context?: ErrorContext,
): void {
  const timestamp = new Date().toISOString();

  // Extract error details
  const errorDetails =
    error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : {
          message: String(error),
          raw: error,
        };

  // Build structured log data
  const logData = {
    timestamp,
    operation,
    error: errorDetails,
    ...(context && { context }),
  };

  // Log using structured logger
  getLogger().error('ErrorLogging', `${operation} failed`, logData);
}

/**
 * Log background operation warning with structured context
 *
 * @param operation - Human-readable operation name
 * @param message - Warning message
 * @param context - Additional context about the operation
 */
export function logBackgroundWarning(
  operation: string,
  message: string,
  context?: ErrorContext,
): void {
  const timestamp = new Date().toISOString();

  const logData = {
    timestamp,
    operation,
    ...(context && { context }),
  };

  getLogger().warn('ErrorLogging', `${operation}: ${message}`, logData);
}
