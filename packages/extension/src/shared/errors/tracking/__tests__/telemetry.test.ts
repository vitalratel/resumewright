/**
 * Error Telemetry Tests
 *
 * Tests for error tracking and telemetry covering:
 * - Error ID generation
 * - Timestamp formatting
 * - Error tracking with storage
 * - Error retrieval and filtering
 * - Export functionality
 * - Clipboard operations
 * - Stats generation
 * - Storage cleanup
 *
 * Uses fakeBrowser for real storage behavior.
 */

import { fakeBrowser } from '@webext-core/fake-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { localExtStorage } from '@/shared/infrastructure/storage/typedStorage';
import type { ErrorDetails, ErrorEvent } from '../telemetry';
import {
  clearStoredErrors,
  copyToClipboard,
  exportErrors,
  formatErrorDetailsForClipboard,
  formatErrorTimestamp,
  generateErrorId,
  getStoredErrors,
  getTelemetryStats,
  trackError,
} from '../telemetry';

describe('Error Telemetry', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-11T19:30:45'));

    // Clear storage before each test
    await fakeBrowser.storage.local.clear();
    await fakeBrowser.storage.sync.clear();

    // Mock getManifest since fakeBrowser doesn't implement it
    vi.spyOn(fakeBrowser.runtime, 'getManifest').mockReturnValue({
      manifest_version: 3,
      name: 'ResumeWright',
      version: '1.0.0',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateErrorId', () => {
    it('should generate error ID with correct format', () => {
      const errorId = generateErrorId();

      expect(errorId).toMatch(/^ERR-\d{8}-\d{6}-[0-9A-F]{4}$/);
    });

    it('should include current date in YYYYMMDD format', () => {
      const errorId = generateErrorId();

      expect(errorId).toContain('ERR-20251111');
    });

    it('should include current time in HHMMSS format', () => {
      const errorId = generateErrorId();

      expect(errorId).toContain('193045');
    });

    it('should generate unique IDs for multiple calls', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateErrorId());
      }

      // Should have mostly unique IDs (random component)
      expect(ids.size).toBeGreaterThan(90);
    });
  });

  describe('formatErrorTimestamp', () => {
    it('should format timestamp with current date', () => {
      const formatted = formatErrorTimestamp();

      expect(formatted).toBe('2025-11-11 19:30:45');
    });

    it('should format provided date correctly', () => {
      const date = new Date('2025-01-15T08:05:30');
      const formatted = formatErrorTimestamp(date);

      expect(formatted).toBe('2025-01-15 08:05:30');
    });

    it('should pad single-digit values with zeros', () => {
      const date = new Date('2025-01-05T03:02:01');
      const formatted = formatErrorTimestamp(date);

      expect(formatted).toBe('2025-01-05 03:02:01');
    });
  });

  describe('trackError', () => {
    const mockErrorDetails: ErrorDetails = {
      errorId: 'ERR-20251111-193045-A3F2',
      code: 'TSX_PARSE_ERROR',
      message: 'Failed to parse TSX',
      category: 'SYNTAX',
      technicalDetails: 'Unexpected token at line 42',
      metadata: { line: 42, column: 10 },
      timestamp: new Date().toISOString(),
    };

    beforeEach(async () => {
      // Enable telemetry in settings by default
      await localExtStorage.setItem('resumewright-settings', { telemetryEnabled: true } as never);
    });

    it('should track error when telemetry is enabled', async () => {
      await trackError(mockErrorDetails);

      const storedErrors = await localExtStorage.getItem('errorTelemetry');

      expect(storedErrors).toHaveLength(1);
      expect(storedErrors![0]).toMatchObject({
        errorId: mockErrorDetails.errorId,
        code: mockErrorDetails.code,
        message: mockErrorDetails.message,
        category: mockErrorDetails.category,
      });
    });

    it('should skip tracking when telemetry is disabled', async () => {
      await localExtStorage.setItem('resumewright-settings', { telemetryEnabled: false } as never);

      await trackError(mockErrorDetails);

      const storedErrors = await localExtStorage.getItem('errorTelemetry');
      expect(storedErrors).toBeNull();
    });

    it('should include context information', async () => {
      await trackError(mockErrorDetails);

      const storedErrors = await localExtStorage.getItem('errorTelemetry');
      const errorEvent = storedErrors![0];

      expect(errorEvent.context).toBeDefined();
      expect(errorEvent.context?.extensionVersion).toBeDefined();
    });

    it('should add multiple errors to storage', async () => {
      await trackError(mockErrorDetails);
      await trackError({ ...mockErrorDetails, errorId: 'ERR-2' });
      await trackError({ ...mockErrorDetails, errorId: 'ERR-3' });

      const storedErrors = await localExtStorage.getItem('errorTelemetry');

      expect(storedErrors).toHaveLength(3);
    });
  });

  describe('getStoredErrors', () => {
    it('should retrieve stored errors', async () => {
      const mockErrors: ErrorEvent[] = [
        {
          errorId: 'ERR-1',
          timestamp: Date.now(),
          code: 'TEST',
          message: 'Test error 1',
          category: 'SYSTEM',
          context: {},
        },
      ];

      await localExtStorage.setItem('errorTelemetry', mockErrors);

      const errors = await getStoredErrors();

      expect(errors).toEqual(mockErrors);
    });

    it('should return empty array when no errors stored', async () => {
      const errors = await getStoredErrors();

      expect(errors).toEqual([]);
    });
  });

  describe('clearStoredErrors', () => {
    it('should clear stored errors', async () => {
      // Setup - add some errors
      await localExtStorage.setItem('errorTelemetry', [
        {
          errorId: 'ERR-1',
          timestamp: Date.now(),
          code: 'TEST',
          message: 'Test',
          category: 'SYSTEM',
          context: {},
        },
      ]);

      await clearStoredErrors();

      const errors = await localExtStorage.getItem('errorTelemetry');
      expect(errors).toBeNull();
    });
  });

  describe('exportErrors', () => {
    it('should export errors as JSON array string', async () => {
      const mockErrors: ErrorEvent[] = [
        {
          errorId: 'ERR-1',
          timestamp: Date.now(),
          code: 'TEST',
          message: 'Test error',
          category: 'SYSTEM',
          context: {},
        },
      ];

      await localExtStorage.setItem('errorTelemetry', mockErrors);

      const exported = await exportErrors();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toMatchObject({
        errorId: 'ERR-1',
        code: 'TEST',
        message: 'Test error',
      });
    });

    it('should export empty array when no errors', async () => {
      const exported = await exportErrors();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(0);
    });
  });

  describe('formatErrorDetailsForClipboard', () => {
    const mockError: ErrorDetails = {
      errorId: 'ERR-20251111-193045-A3F2',
      timestamp: Date.now().toString(),
      code: 'TSX_PARSE_ERROR',
      message: 'Failed to parse TSX',
      category: 'SYNTAX',
      technicalDetails: 'Unexpected token',
      metadata: { line: 42 },
    };

    it('should format error for clipboard', () => {
      const formatted = formatErrorDetailsForClipboard(mockError);

      expect(formatted).toContain('Error ID: ERR-20251111-193045-A3F2');
      expect(formatted).toContain('Error Code: TSX_PARSE_ERROR');
      expect(formatted).toContain('Failed to parse TSX');
      expect(formatted).toContain('Category: SYNTAX');
      expect(formatted).toContain('=== ResumeWright Error Report ===');
    });

    it('should include technical details when present', () => {
      const formatted = formatErrorDetailsForClipboard(mockError);

      expect(formatted).toContain('--- Technical Details ---');
      expect(formatted).toContain('Unexpected token');
    });

    it('should handle errors without optional fields', () => {
      const minimalError: ErrorDetails = {
        errorId: 'ERR-1',
        timestamp: Date.now().toString(),
        code: 'TEST',
        message: 'Test',
        category: 'SYSTEM',
      };

      const formatted = formatErrorDetailsForClipboard(minimalError);

      expect(formatted).toContain('Error ID: ERR-1');
      expect(formatted).not.toContain('--- Technical Details ---');
    });
  });

  describe('copyToClipboard', () => {
    let writeTextMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // Mock clipboard API using defineProperty for happy-dom compatibility
      writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });
    });

    it('should copy text to clipboard', async () => {
      const text = 'Test error details';

      await copyToClipboard(text);

      expect(writeTextMock).toHaveBeenCalledWith(text);
    });

    it('should handle clipboard errors gracefully', async () => {
      writeTextMock.mockRejectedValue(new Error('Clipboard error'));

      await expect(copyToClipboard('test')).resolves.not.toThrow();
    });
  });

  describe('getTelemetryStats', () => {
    it('should return stats for stored errors', async () => {
      const now = Date.now();
      const mockErrors: ErrorEvent[] = [
        {
          errorId: 'ERR-1',
          timestamp: now,
          code: 'TSX_PARSE_ERROR',
          message: 'Error 1',
          category: 'SYNTAX',
          context: {},
        },
        {
          errorId: 'ERR-2',
          timestamp: now - 1000,
          code: 'WASM_INIT_FAILED',
          message: 'Error 2',
          category: 'SYSTEM',
          context: {},
        },
        {
          errorId: 'ERR-3',
          timestamp: now - 2000,
          code: 'TSX_PARSE_ERROR',
          message: 'Error 3',
          category: 'SYNTAX',
          context: {},
        },
      ];

      await localExtStorage.setItem('errorTelemetry', mockErrors);

      const stats = await getTelemetryStats();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByCategory.SYNTAX).toBe(2);
      expect(stats.errorsByCategory.SYSTEM).toBe(1);
      expect(stats.errorsByCode.TSX_PARSE_ERROR).toBe(2);
      expect(stats.errorsByCode.WASM_INIT_FAILED).toBe(1);
    });

    it('should handle empty error list', async () => {
      const stats = await getTelemetryStats();

      expect(stats.totalErrors).toBe(0);
      expect(stats.errorsByCategory).toEqual({});
      expect(stats.errorsByCode).toEqual({});
    });

    it('should include oldest and newest timestamps', async () => {
      const now = Date.now();
      const mockErrors: ErrorEvent[] = [
        {
          errorId: 'ERR-1',
          timestamp: now,
          code: 'TEST',
          message: 'Newest',
          category: 'SYSTEM',
          context: {},
        },
        {
          errorId: 'ERR-2',
          timestamp: now - 5000,
          code: 'TEST',
          message: 'Oldest',
          category: 'SYSTEM',
          context: {},
        },
      ];

      await localExtStorage.setItem('errorTelemetry', mockErrors);

      const stats = await getTelemetryStats();

      expect(stats.oldestError).toBe(now - 5000);
      expect(stats.newestError).toBe(now);
    });
  });
});
