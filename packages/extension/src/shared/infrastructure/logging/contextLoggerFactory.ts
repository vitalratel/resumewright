/**
 * Context Logger Factory
 *
 * Factory function to create context loggers without circular dependencies.
 * Separated from Logger class to break the import cycle.
 */

import { ContextLogger } from './contextLogger';
import type { Logger } from './logger';

/**
 * Create a context-bound logger
 *
 * @param parent - Parent logger instance
 * @param context - Context name for prefixing log messages
 * @returns ContextLogger instance
 */
export function createContextLogger(parent: Logger, context: string): ContextLogger {
  return new ContextLogger(parent, context);
}
