/**
 * Logging Module
 *
 * Structured logging with configurable levels and context.
 *
 * @example Using the global logger
 * ```ts
 * import { getLogger } from '@/shared/infrastructure/logging';
 *
 * getLogger().info('MyContext', 'Conversion started');
 * getLogger().error('MyContext', 'Conversion failed', error);
 * ```
 *
 * @example Creating a context logger
 * ```ts
 * import { getLogger, createContextLogger } from '@/shared/infrastructure/logging';
 *
 * const componentLogger = createContextLogger(getLogger(), 'PDFGenerator');
 * componentLogger.debug('Initializing WASM module');
 * ```
 *
 * @example Configuring log level
 * ```ts
 * import { getLogger, LogLevel } from '@/shared/infrastructure/logging';
 *
 * getLogger().setLevel(LogLevel.WARN); // Only show warnings and errors
 * ```
 *
 * @example Injectable logger for testing
 * ```ts
 * import { setLogger, resetLogger, Logger } from '@/shared/infrastructure/logging';
 * import { vi } from 'vitest';
 *
 * // In test setup
 * const mockLogger = new Logger({ level: LogLevel.NONE });
 * vi.spyOn(mockLogger, 'info');
 * setLogger(mockLogger);
 *
 * // Test code that uses logger
 *
 * // In test cleanup
 * resetLogger();
 * ```
 */

export { ContextLogger } from './contextLogger';
// Context logger factory (recommended - avoids circular dependency)
export { createContextLogger } from './contextLoggerFactory';
// Global logger instance (most common import)
export { getLogger, resetLogger, setLogger } from './instance';
export type { ILogger, LoggerConfig } from './logger';
// Logger classes (for advanced usage)
export { Logger, LogLevel } from './logger';
