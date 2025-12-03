/**
 * Logger Implementation
 * Structured logging with configurable levels
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
 * Logger class with configurable levels and context
 */
export class Logger implements ILogger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: getDefaultLogLevel(),
      prefix: '[ResumeWright]',
      includeTimestamp: false,
      includeContext: true,
      ...config,
    };
  }

  /**
   * Set the log level at runtime
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Format log message with optional timestamp and context
   */
  private formatMessage(level: string, context: string, message: string): string {
    const parts: string[] = [this.config.prefix];

    if (this.config.includeTimestamp) {
      const timestamp = new Date().toISOString();
      parts.push(`[${timestamp}]`);
    }

    if (this.config.includeContext && context) {
      parts.push(`[${context}]`);
    }

    parts.push(`[${level}]`);
    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Log debug message (development only)
   */
  debug(context: string, message: string, data?: unknown): void {
    if (this.config.level <= LogLevel.DEBUG) {
      const formatted = this.formatMessage('DEBUG', context, message);
      if (data !== undefined) {
        console.debug(formatted, data);
      } else {
        console.debug(formatted);
      }
    }
  }

  /**
   * Log informational message
   */
  info(context: string, message: string, data?: unknown): void {
    if (this.config.level <= LogLevel.INFO) {
      const formatted = this.formatMessage('INFO', context, message);
      if (data !== undefined) {
        console.log(formatted, data);
      } else {
        console.log(formatted);
      }
    }
  }

  /**
   * Log warning message
   */
  warn(context: string, message: string, data?: unknown): void {
    if (this.config.level <= LogLevel.WARN) {
      const formatted = this.formatMessage('WARN', context, message);
      if (data !== undefined) {
        console.warn(formatted, data);
      } else {
        console.warn(formatted);
      }
    }
  }

  /**
   * Log error message (always logged except in NONE mode)
   */
  error(context: string, message: string, error?: unknown): void {
    if (this.config.level <= LogLevel.ERROR) {
      const formatted = this.formatMessage('ERROR', context, message);
      if (error !== undefined) {
        console.error(formatted, error);
      } else {
        console.error(formatted);
      }
    }
  }
}
