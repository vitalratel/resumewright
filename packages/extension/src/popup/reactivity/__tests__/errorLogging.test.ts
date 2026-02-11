/**
 * ABOUTME: Tests for createErrorLogging reactive function.
 * ABOUTME: Validates error logging behavior with deduplication by code+timestamp.
 */

import { renderHook } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCategory } from '@/shared/errors/codes';
import type { ERROR_MESSAGES } from '@/shared/errors/messages';
import type { ConversionError } from '@/shared/types/models';

type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];

const mockLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

vi.mock('@/shared/infrastructure/logging/instance', () => ({
  getLogger: () => mockLogger,
}));

// Import after mock setup
const { createErrorLogging } = await import('../errorLogging');

function createTestError(overrides: Partial<ConversionError> = {}): ConversionError {
  return {
    code: 'RW-1001',
    message: 'Test error message',
    timestamp: Date.now(),
    recoverable: true,
    suggestions: [],
    ...overrides,
  };
}

describe('createErrorLogging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Logging', () => {
    it('logs error on initial render', () => {
      const error = createTestError();

      renderHook(() => createErrorLogging(() => error));

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('logs structured error details', () => {
      const error = createTestError({
        code: 'RW-2001',
        message: 'WASM failed',
        technicalDetails: 'Stack trace',
        metadata: { type: 'wasm', wasmInfo: { supported: true } },
        timestamp: 1000,
        recoverable: false,
        suggestions: ['Try again'],
      });

      renderHook(() =>
        createErrorLogging(() => error, {
          category: () => ErrorCategory.SYSTEM,
        }),
      );

      expect(mockLogger.error).toHaveBeenCalledWith('ErrorState', 'Error displayed', {
        code: 'RW-2001',
        category: ErrorCategory.SYSTEM,
        message: 'WASM failed',
        technicalDetails: 'Stack trace',
        metadata: { type: 'wasm', wasmInfo: { supported: true } },
        timestamp: 1000,
        recoverable: false,
        suggestions: ['Try again'],
      });
    });

    it('logs formatted error report', () => {
      const error = createTestError({
        code: 'RW-1001',
        technicalDetails: 'Some details',
      });
      const errorMessage: ErrorMessage = {
        title: 'Parse Error',
        description: 'Failed to parse',
      };

      renderHook(() =>
        createErrorLogging(() => error, {
          category: () => ErrorCategory.SYNTAX,
          errorMessage: () => errorMessage,
        }),
      );

      // Second call is the formatted report
      const reportCall = mockLogger.error.mock.calls.find(
        (call) => typeof call[1] === 'string' && call[1].includes('Error Report'),
      );
      expect(reportCall).toBeDefined();
      expect(reportCall![1]).toContain('RW-1001');
      expect(reportCall![1]).toContain('SYNTAX');
      expect(reportCall![1]).toContain('Parse Error');
      expect(reportCall![1]).toContain('Some details');
    });
  });

  describe('Deduplication', () => {
    it('does not re-log when error is the same (same code+timestamp)', () => {
      const error = createTestError({ code: 'RW-1001', timestamp: 1000 });
      const [getError, setError] = createSignal(error);

      renderHook(() => createErrorLogging(getError));

      const initialCallCount = mockLogger.error.mock.calls.length;

      // Re-set with same error (same code and timestamp)
      setError({ ...error });

      // Should not have additional calls since code+timestamp didn't change
      expect(mockLogger.error).toHaveBeenCalledTimes(initialCallCount);
    });

    it('re-logs when error code changes', () => {
      const [getError, setError] = createSignal(
        createTestError({ code: 'RW-1001', timestamp: 1000 }),
      );

      renderHook(() => createErrorLogging(getError));

      const initialCallCount = mockLogger.error.mock.calls.length;

      setError(createTestError({ code: 'RW-2001', timestamp: 1000 }));

      expect(mockLogger.error.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('re-logs when timestamp changes', () => {
      const [getError, setError] = createSignal(
        createTestError({ code: 'RW-1001', timestamp: 1000 }),
      );

      renderHook(() => createErrorLogging(getError));

      const initialCallCount = mockLogger.error.mock.calls.length;

      setError(createTestError({ code: 'RW-1001', timestamp: 2000 }));

      expect(mockLogger.error.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  describe('Optional Parameters', () => {
    it('handles missing category', () => {
      const error = createTestError();

      renderHook(() => createErrorLogging(() => error));

      expect(mockLogger.error).toHaveBeenCalledWith(
        'ErrorState',
        'Error displayed',
        expect.objectContaining({ category: undefined }),
      );
    });

    it('handles missing errorMessage', () => {
      const error = createTestError();

      renderHook(() =>
        createErrorLogging(() => error, {
          category: () => ErrorCategory.SYNTAX,
        }),
      );

      const reportCall = mockLogger.error.mock.calls.find(
        (call) => typeof call[1] === 'string' && call[1].includes('Error Report'),
      );
      expect(reportCall).toBeDefined();
      expect(reportCall![1]).toContain('An error occurred');
    });

    it('handles missing technicalDetails', () => {
      const error = createTestError({ technicalDetails: undefined });

      renderHook(() => createErrorLogging(() => error));

      const reportCall = mockLogger.error.mock.calls.find(
        (call) => typeof call[1] === 'string' && call[1].includes('Error Report'),
      );
      expect(reportCall).toBeDefined();
      expect(reportCall![1]).toContain('No technical details available');
    });

    it('handles missing metadata', () => {
      const error = createTestError({ metadata: undefined });

      renderHook(() => createErrorLogging(() => error));

      const reportCall = mockLogger.error.mock.calls.find(
        (call) => typeof call[1] === 'string' && call[1].includes('Error Report'),
      );
      expect(reportCall).toBeDefined();
      // Should not contain "Metadata" section
      expect(reportCall![1]).not.toContain('Metadata');
    });

    it('includes metadata section when metadata is present', () => {
      const error = createTestError({
        metadata: { type: 'location', line: 10, column: 5 },
      });

      renderHook(() => createErrorLogging(() => error));

      const reportCall = mockLogger.error.mock.calls.find(
        (call) => typeof call[1] === 'string' && call[1].includes('Error Report'),
      );
      expect(reportCall).toBeDefined();
      expect(reportCall![1]).toContain('Metadata');
      expect(reportCall![1]).toContain('"line": 10');
    });
  });

  describe('Reactive Updates', () => {
    it('logs with updated category when category changes', () => {
      const error = createTestError({ timestamp: 1000 });
      const [getCategory, setCategory] = createSignal<ErrorCategory | undefined>(
        ErrorCategory.SYNTAX,
      );

      renderHook(() =>
        createErrorLogging(() => error, {
          category: getCategory,
        }),
      );

      mockLogger.error.mockClear();

      setCategory(ErrorCategory.SYSTEM);

      // Category change alone shouldn't trigger re-log (only code+timestamp trigger)
      // The effect tracks error().code and error().timestamp for dedup
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });
});
