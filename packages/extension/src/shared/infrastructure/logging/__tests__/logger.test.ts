/**
 * Logger Tests
 * Tests for logging functionality and extension boundary handling
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import browser from 'webextension-polyfill';
import { Logger, LogLevel } from '../logger';

// Mock browser API
vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      getManifest: vi.fn(),
    },
  },
}));

// Mock console methods to verify logging output
const mockConsole = {
  debug: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe('Logger', () => {
  let originalConsole: typeof console;

  beforeEach(() => {
    // Store original console
    originalConsole = global.console;

    // Replace console with mocks
    global.console = {
      ...global.console,
      debug: mockConsole.debug,
      log: mockConsole.log,
      warn: mockConsole.warn,
      error: mockConsole.error,
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original console
    global.console = originalConsole;
  });

  describe('Constructor & Configuration', () => {
    it('should create logger with default config', () => {
      const logger = new Logger();

      expect(logger.getLevel()).toBeDefined();
    });

    it('should create logger with custom config', () => {
      const logger = new Logger({
        level: LogLevel.WARN,
        prefix: '[TestApp]',
      });

      expect(logger.getLevel()).toBe(LogLevel.WARN);
    });

    it('should set log level at runtime', () => {
      const logger = new Logger({ level: LogLevel.INFO });

      logger.setLevel(LogLevel.DEBUG);

      expect(logger.getLevel()).toBe(LogLevel.DEBUG);
    });
  });

  describe('Extension Boundary: browser.runtime.getManifest()', () => {
    it('should handle browser API failure gracefully - Error exception', () => {
      // Test that browser.runtime.getManifest() failures are handled
      // Mock browser.runtime.getManifest to throw (browser API unavailable)
      vi.mocked(browser.runtime.getManifest).mockImplementation(() => {
        throw new Error('API unavailable');
      });

      // Should not throw when creating logger - error is caught silently in isExtensionDevMode()
      expect(() => new Logger()).not.toThrow();

      // Logger should be created successfully with default level
      const logger = new Logger();
      expect(logger.getLevel()).toBeDefined();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should handle browser API failure gracefully - TypeError', () => {
      // Test non-extension context (browser API undefined)
      // Mock browser.runtime.getManifest to throw TypeError (not in extension context)
      vi.mocked(browser.runtime.getManifest).mockImplementation(() => {
        throw new TypeError('browser.runtime is undefined');
      });

      // Should not throw, should handle gracefully
      expect(() => new Logger()).not.toThrow();

      const logger = new Logger();
      expect(logger.getLevel()).toBeDefined();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should handle browser API failure gracefully - null/undefined', () => {
      // Test various failure modes
      vi.mocked(browser.runtime.getManifest).mockImplementation(() => {
        throw new Error('Manifest unavailable');
      });

      // Should not throw
      expect(() => new Logger()).not.toThrow();

      const logger = new Logger();
      expect(logger.getLevel()).toBeDefined();
    });

    it('should successfully create logger when browser API available', () => {
      // Happy path: Mock successful manifest retrieval
      const manifest = {
        name: 'ResumeWright',
        version: '1.0.0',
        manifest_version: 3,
      };
      vi.mocked(browser.runtime.getManifest).mockReturnValue(manifest as never);

      // Should successfully create logger without errors
      const logger = new Logger();

      expect(logger).toBeInstanceOf(Logger);
      expect(logger.getLevel()).toBeDefined();
    });
  });

  describe('Log Levels', () => {
    it('should respect log level - DEBUG logs everything', () => {
      const logger = new Logger({ level: LogLevel.DEBUG });

      logger.debug('Test', 'Debug message');
      logger.info('Test', 'Info message');
      logger.warn('Test', 'Warn message');
      logger.error('Test', 'Error message');

      expect(mockConsole.debug).toHaveBeenCalled();
      expect(mockConsole.log).toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should respect log level - INFO skips debug', () => {
      const logger = new Logger({ level: LogLevel.INFO });

      logger.debug('Test', 'Debug message');
      logger.info('Test', 'Info message');
      logger.warn('Test', 'Warn message');
      logger.error('Test', 'Error message');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.log).toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should respect log level - WARN skips debug and info', () => {
      const logger = new Logger({ level: LogLevel.WARN });

      logger.debug('Test', 'Debug message');
      logger.info('Test', 'Info message');
      logger.warn('Test', 'Warn message');
      logger.error('Test', 'Error message');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should respect log level - ERROR only logs errors', () => {
      const logger = new Logger({ level: LogLevel.ERROR });

      logger.debug('Test', 'Debug message');
      logger.info('Test', 'Info message');
      logger.warn('Test', 'Warn message');
      logger.error('Test', 'Error message');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should respect log level - NONE logs nothing', () => {
      const logger = new Logger({ level: LogLevel.NONE });

      logger.debug('Test', 'Debug message');
      logger.info('Test', 'Info message');
      logger.warn('Test', 'Warn message');
      logger.error('Test', 'Error message');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
    });
  });

  describe('Log Formatting', () => {
    it('should include prefix in log messages', () => {
      const logger = new Logger({ level: LogLevel.INFO, prefix: '[TestApp]' });

      logger.info('Test', 'Test message');

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[TestApp]'),
      );
    });

    it('should include context when provided', () => {
      const logger = new Logger({ level: LogLevel.INFO, includeContext: true });

      logger.info('ComponentName', 'Test message');

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('[ComponentName]'),
      );
    });

    it('should exclude context when includeContext is false', () => {
      const logger = new Logger({ level: LogLevel.INFO, includeContext: false });

      logger.info('ComponentName', 'Test message');

      const call = mockConsole.log.mock.calls[0][0];
      expect(call).not.toContain('[ComponentName]');
    });

    it('should include timestamp when enabled', () => {
      const logger = new Logger({ level: LogLevel.INFO, includeTimestamp: true });

      logger.info('Test', 'Test message');

      // Should contain ISO timestamp format
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
      );
    });

    it('should log with context, message, and data', () => {
      const logger = new Logger({ level: LogLevel.INFO, includeContext: true });
      const data = { key: 'value' };

      logger.info('Context', 'Test message', data);

      const call = mockConsole.log.mock.calls[0][0];
      expect(call).toContain('[Context]');
      expect(call).toContain('Test message');
      expect(mockConsole.log).toHaveBeenCalledWith(expect.any(String), data);
    });
  });

  describe('Log Methods', () => {
    it('should log debug messages with data', () => {
      const logger = new Logger({ level: LogLevel.DEBUG });
      const data = { debug: true };

      logger.debug('Test', 'Debug message', data);

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        data,
      );
    });

    it('should log warn messages with data', () => {
      const logger = new Logger({ level: LogLevel.WARN });
      const data = { warning: true };

      logger.warn('Test', 'Warning message', data);

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        data,
      );
    });

    it('should log error messages with error object', () => {
      const logger = new Logger({ level: LogLevel.ERROR });
      const error = new Error('Test error');

      logger.error('Test', 'Error occurred', error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        error,
      );
    });

    it('should log error messages without error object', () => {
      const logger = new Logger({ level: LogLevel.ERROR });

      logger.error('Test', 'Error occurred');

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred'),
      );
    });
  });
});
