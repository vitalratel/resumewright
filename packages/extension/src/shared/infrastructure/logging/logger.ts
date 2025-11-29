/**
 * Logger Implementation
 * Structured logging with configurable levels
 * Implements ILogger interface from domain layer for Clean Architecture.
 */

import type { ILogger as DomainILogger } from '../../domain/logging/ILogger';
import browser from 'webextension-polyfill';

/* eslint-disable no-console */

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
 * Implements domain ILogger interface following Dependency Inversion Principle
 */
export class Logger implements DomainILogger {
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
   * Supports both old API (message, data) and new API (context, message, data)
   */
  debug(contextOrMessage: string, messageOrData?: string | unknown, data?: unknown): void {
    if (this.config.level <= LogLevel.DEBUG) {
      // Determine if using old or new API
      const [context, message, logData] = this.parseArgs(contextOrMessage, messageOrData, data);
      const formatted = this.formatMessage('DEBUG', context, message);
      if (logData !== undefined) {
        console.debug(formatted, logData);
      } else {
        console.debug(formatted);
      }
    }
  }

  /**
   * Log informational message
   * Supports both old API (message, data) and new API (context, message, data)
   */
  info(contextOrMessage: string, messageOrData?: string | unknown, data?: unknown): void {
    if (this.config.level <= LogLevel.INFO) {
      const [context, message, logData] = this.parseArgs(contextOrMessage, messageOrData, data);
      const formatted = this.formatMessage('INFO', context, message);
      if (logData !== undefined) {
        console.log(formatted, logData);
      } else {
        console.log(formatted);
      }
    }
  }

  /**
   * Log warning message
   * Supports both old API (message, data) and new API (context, message, data)
   */
  warn(contextOrMessage: string, messageOrData?: string | unknown, data?: unknown): void {
    if (this.config.level <= LogLevel.WARN) {
      const [context, message, logData] = this.parseArgs(contextOrMessage, messageOrData, data);
      const formatted = this.formatMessage('WARN', context, message);
      if (logData !== undefined) {
        console.warn(formatted, logData);
      } else {
        console.warn(formatted);
      }
    }
  }

  /**
   * Log error message (always logged except in NONE mode)
   * Supports both old API (message, error) and new API (context, message, error)
   */
  error(contextOrMessage: string, messageOrError?: string | unknown, error?: unknown): void {
    if (this.config.level <= LogLevel.ERROR) {
      const [context, message, logError] = this.parseArgs(contextOrMessage, messageOrError, error);
      const formatted = this.formatMessage('ERROR', context, message);
      if (logError !== undefined) {
        console.error(formatted, logError);
      } else {
        console.error(formatted);
      }
    }
  }

  /**
   * Parse arguments to support both old and new logger API
   * Old API: (message, data?)
   * New API: (context, message, data?)
   */
  private parseArgs(
    arg1: string,
    arg2?: string | unknown,
    arg3?: unknown
  ): [string, string, unknown] {
    // If arg2 is a string, assume new API with context
    if (typeof arg2 === 'string') {
      return [arg1, arg2, arg3];
    }
    // Otherwise, old API: arg1 is message, arg2 is data
    return ['', arg1, arg2];
  }
}
