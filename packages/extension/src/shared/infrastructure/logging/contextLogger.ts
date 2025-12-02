/**
 * Context Logger
 *
 * Context-bound logger for specific components.
 * Automatically prepends context to all log calls.
 */

import type { ILogger } from './logger';

/**
 * Context-bound logger for specific components
 * Automatically prepends context to all log calls
 */
export class ContextLogger {
  constructor(
    private parent: ILogger,
    private context: string,
  ) {}

  debug(message: string, data?: unknown): void {
    this.parent.debug(this.context, message, data);
  }

  info(message: string, data?: unknown): void {
    this.parent.info(this.context, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.parent.warn(this.context, message, data);
  }

  error(message: string, error?: unknown): void {
    this.parent.error(this.context, message, error);
  }
}
