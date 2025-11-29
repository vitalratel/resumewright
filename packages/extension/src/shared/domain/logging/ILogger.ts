/**
 * Logger Interface
 *
 * Domain interface for logging operations.
 * This interface is part of the domain layer to maintain Clean Architecture.
 * Infrastructure implementations provide concrete loggers.
 *
 * @module Domain/Logging
 */

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Logger Interface
 *
 * Abstracts logging operations from infrastructure details.
 * Follows Interface Segregation Principle from SOLID.
 */
export interface ILogger {
  /**
   * Set minimum log level
   */
  setLevel: (level: LogLevel) => void;

  /**
   * Get current log level
   */
  getLevel: () => LogLevel;

  /**
   * Debug-level logging for development details
   */
  debug: (context: string, message: string, data?: unknown) => void;

  /**
   * Info-level logging for general information
   */
  info: (context: string, message: string, data?: unknown) => void;

  /**
   * Warning-level logging for recoverable issues
   */
  warn: (context: string, message: string, data?: unknown) => void;

  /**
   * Error-level logging for failures
   */
  error: (context: string, message: string, error?: unknown) => void;
}
