// ABOUTME: Structured logging with configurable levels.
// ABOUTME: Provides createLogger factory function and ILogger interface.

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
 */
export interface ILogger {
  setLevel: (level: LogLevel) => void;
  getLevel: () => LogLevel;
  debug: (context: string, message: string, data?: unknown) => void;
  info: (context: string, message: string, data?: unknown) => void;
  warn: (context: string, message: string, data?: unknown) => void;
  error: (context: string, message: string, error?: unknown) => void;
}

/**
 * Check if running in browser extension development mode
 * Works in both Chrome and Firefox via webextension-polyfill
 *
 * Browser API differences:
 * - Chrome uses chrome.* namespace with callbacks
 * - Firefox uses browser.* namespace with Promises
 * - webextension-polyfill normalizes both to browser.* with Promises
 *
 * Detection strategy:
 * - Development builds: No update_url in manifest (local installation)
 * - Production builds: Has update_url (Chrome Web Store / AMO)
 */
function isExtensionDevMode(): boolean {
  try {
    // webextension-polyfill provides unified API for Chrome/Firefox/Edge/Safari
    const manifest = browser.runtime.getManifest();
    // Development builds don't have update_url in manifest
    return !('update_url' in manifest);
  } catch {
    // Ignore errors (not in extension context or browser API unavailable)
    return false;
  }
}

/**
 * Determine log level based on environment
 * Production: ERROR and WARN only
 * Development: All levels
 */
function getDefaultLogLevel(): LogLevel {
  const isDevelopment = import.meta.env?.DEV || isExtensionDevMode();

  return isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: getDefaultLogLevel(),
  prefix: '[ResumeWright]',
  includeTimestamp: false,
  includeContext: true,
};

/**
 * Create a logger with configurable levels and context
 *
 * Factory function that creates an ILogger implementation with:
 * - Configurable log levels (DEBUG, INFO, WARN, ERROR, NONE)
 * - Optional timestamp and context prefixes
 * - Runtime level adjustment via setLevel
 */
export function createLogger(configOverrides?: Partial<LoggerConfig>): ILogger {
  // Private mutable state
  const config: LoggerConfig = {
    ...DEFAULT_CONFIG,
    ...configOverrides,
  };

  // Helper function
  function formatMessage(level: string, context: string, message: string): string {
    const parts: string[] = [config.prefix];

    if (config.includeTimestamp) {
      const timestamp = new Date().toISOString();
      parts.push(`[${timestamp}]`);
    }

    if (config.includeContext && context) {
      parts.push(`[${context}]`);
    }

    parts.push(`[${level}]`);
    parts.push(message);

    return parts.join(' ');
  }

  // Public interface implementation
  function setLevel(level: LogLevel): void {
    config.level = level;
  }

  function getLevel(): LogLevel {
    return config.level;
  }

  function debug(context: string, message: string, data?: unknown): void {
    if (config.level <= LogLevel.DEBUG) {
      const formatted = formatMessage('DEBUG', context, message);
      if (data !== undefined) {
        console.debug(formatted, data);
      } else {
        console.debug(formatted);
      }
    }
  }

  function info(context: string, message: string, data?: unknown): void {
    if (config.level <= LogLevel.INFO) {
      const formatted = formatMessage('INFO', context, message);
      if (data !== undefined) {
        console.log(formatted, data);
      } else {
        console.log(formatted);
      }
    }
  }

  function warn(context: string, message: string, data?: unknown): void {
    if (config.level <= LogLevel.WARN) {
      const formatted = formatMessage('WARN', context, message);
      if (data !== undefined) {
        console.warn(formatted, data);
      } else {
        console.warn(formatted);
      }
    }
  }

  function error(context: string, message: string, error?: unknown): void {
    if (config.level <= LogLevel.ERROR) {
      const formatted = formatMessage('ERROR', context, message);
      if (error !== undefined) {
        console.error(formatted, error);
      } else {
        console.error(formatted);
      }
    }
  }

  return {
    setLevel,
    getLevel,
    debug,
    info,
    warn,
    error,
  };
}
