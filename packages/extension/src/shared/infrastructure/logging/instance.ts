/**
 * Logger Singleton Instance
 *
 * Injectable logger for testing flexibility
 *
 * Provides both a global logger instance (for production) and
 * a way to inject custom loggers (for testing).
 */

import { Logger } from './logger';

/**
 * Global logger instance
 * Replaces all console.log usage
 */
let _logger = new Logger();

/**
 * Get the current logger instance
 * Allows dependency injection for testing
 */
export function getLogger(): Logger {
  return _logger;
}

/**
 * Set a custom logger instance (for testing)
 * Enables logger mocking in tests
 *
 * @param customLogger - Custom logger instance to use
 * @returns The previous logger instance (for restoration)
 */
export function setLogger(customLogger: Logger): Logger {
  const previous = _logger;
  _logger = customLogger;
  return previous;
}

/**
 * Reset logger to default instance
 * Helper for test cleanup
 */
export function resetLogger(): void {
  _logger = new Logger();
}
