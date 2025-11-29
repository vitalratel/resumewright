/**
 * Logging Types
 *
 * Shared types for the logging module to avoid circular dependencies.
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
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  prefix: string;
  includeTimestamp: boolean;
  includeContext: boolean;
}

/**
 * Logger interface
 * Defines the contract that Logger class must implement
 */
export interface ILogger {
  setLevel: (level: LogLevel) => void;
  getLevel: () => LogLevel;
  debug: (context: string, message: string, data?: unknown) => void;
  info: (context: string, message: string, data?: unknown) => void;
  warn: (context: string, message: string, data?: unknown) => void;
  error: (context: string, message: string, error?: unknown) => void;
}
