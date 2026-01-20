/**
 * Error Logging Tests
 * Tests for background error logging utility functions
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetLogger, setLogger } from '@/shared/infrastructure/logging/instance';
import type { ILogger } from '@/shared/infrastructure/logging/logger';
import { logBackgroundError, logBackgroundWarning } from '../errorLogging';

describe('errorLogging', () => {
  const mockError = vi.fn();
  const mockWarn = vi.fn();
  const mockInfo = vi.fn();
  const mockDebug = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock logger and inject it
    const mockLogger = {
      error: mockError,
      warn: mockWarn,
      info: mockInfo,
      debug: mockDebug,
    } as unknown as ILogger;

    setLogger(mockLogger);
  });

  afterEach(() => {
    resetLogger();
    vi.clearAllMocks();
  });

  describe('logBackgroundError', () => {
    it('should log Error instances with full details', () => {
      const error = new Error('Test error message');
      error.stack = 'Error: Test error message\n    at test.ts:10:15';

      logBackgroundError('testOperation', error);

      expect(mockError).toHaveBeenCalledWith(
        'ErrorLogging',
        'testOperation failed',
        expect.objectContaining({
          operation: 'testOperation',
          error: {
            message: 'Test error message',
            stack: expect.stringContaining('Error: Test error message'),
            name: 'Error',
          },
          timestamp: expect.any(String),
        }),
      );
    });

    it('should log non-Error values as strings', () => {
      logBackgroundError('testOperation', 'string error');

      expect(mockError).toHaveBeenCalledWith(
        'ErrorLogging',
        'testOperation failed',
        expect.objectContaining({
          operation: 'testOperation',
          error: {
            message: 'string error',
            raw: 'string error',
          },
        }),
      );
    });

    it('should include optional context', () => {
      const context = { userId: '123', action: 'download' };

      logBackgroundError('testOperation', new Error('Test'), context);

      expect(mockError).toHaveBeenCalledWith(
        'ErrorLogging',
        'testOperation failed',
        expect.objectContaining({
          context,
        }),
      );
    });

    it('should handle null/undefined errors', () => {
      logBackgroundError('testOperation', null);

      expect(mockError).toHaveBeenCalledWith(
        'ErrorLogging',
        'testOperation failed',
        expect.objectContaining({
          error: {
            message: 'null',
            raw: null,
          },
        }),
      );
    });

    it('should include timestamp in ISO format', () => {
      logBackgroundError('testOperation', new Error('Test'));

      const callArgs = mockError.mock.calls[0][2];
      expect(callArgs.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle custom Error types', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error');
      logBackgroundError('testOperation', error);

      expect(mockError).toHaveBeenCalledWith(
        'ErrorLogging',
        'testOperation failed',
        expect.objectContaining({
          error: expect.objectContaining({
            name: 'CustomError',
            message: 'Custom error',
          }),
        }),
      );
    });
  });

  describe('logBackgroundWarning', () => {
    it('should log warning with operation and message', () => {
      logBackgroundWarning('testOperation', 'Warning message');

      expect(mockWarn).toHaveBeenCalledWith(
        'ErrorLogging',
        'testOperation: Warning message',
        expect.objectContaining({
          operation: 'testOperation',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should include optional context', () => {
      const context = { retryCount: 3 };

      logBackgroundWarning('testOperation', 'Warning', context);

      expect(mockWarn).toHaveBeenCalledWith(
        'ErrorLogging',
        'testOperation: Warning',
        expect.objectContaining({
          context,
        }),
      );
    });

    it('should not include context when not provided', () => {
      logBackgroundWarning('testOperation', 'Warning');

      const callArgs = mockWarn.mock.calls[0][2];
      expect(callArgs).not.toHaveProperty('context');
    });

    it('should include timestamp in ISO format', () => {
      logBackgroundWarning('testOperation', 'Warning');

      const callArgs = mockWarn.mock.calls[0][2];
      expect(callArgs.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle empty message', () => {
      logBackgroundWarning('testOperation', '');

      expect(mockWarn).toHaveBeenCalledWith('ErrorLogging', 'testOperation: ', expect.any(Object));
    });

    it('should handle special characters in message', () => {
      logBackgroundWarning('testOperation', 'Warning: "test" & <tag>');

      expect(mockWarn).toHaveBeenCalledWith(
        'ErrorLogging',
        'testOperation: Warning: "test" & <tag>',
        expect.any(Object),
      );
    });
  });
});
