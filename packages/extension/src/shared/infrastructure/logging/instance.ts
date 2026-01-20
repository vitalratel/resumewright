// ABOUTME: Logger singleton instance for global access.
// ABOUTME: Provides getLogger/setLogger for dependency injection in tests.

import { createLogger, type ILogger } from './logger';

/**
 * Global logger instance
 * Replaces all console.log usage
 */
let _logger = createLogger();

/**
 * Get the current logger instance
 * Allows dependency injection for testing
 */
export function getLogger(): ILogger {
  return _logger;
}

/**
 * Set a custom logger instance (for testing)
 * Enables logger mocking in tests
 *
 * @param customLogger - Custom logger instance to use
 * @returns The previous logger instance (for restoration)
 */
export function setLogger(customLogger: ILogger): ILogger {
  const previous = _logger;
  _logger = customLogger;
  return previous;
}

/**
 * Reset logger to default instance
 * Helper for test cleanup
 */
export function resetLogger(): void {
  _logger = createLogger();
}
