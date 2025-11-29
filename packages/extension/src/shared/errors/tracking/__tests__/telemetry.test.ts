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
 * Coverage target: >85%
 */

import type { ErrorDetails, ErrorEvent } from '../telemetry';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import browser from 'webextension-polyfill';
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

// Mock dependencies
vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
      },
    },
    runtime: {
      getManifest: vi.fn(() => ({ version: '1.0.0' })),
    },
  },
}));

vi.mock('../../../logging', () => ({
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('Error Telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-11T19:30:45'));
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

    beforeEach(() => {
      // Mock settings with telemetry enabled
      vi.mocked(browser.storage.local.get).mockImplementation(async (key) => {
        if (key === 'settings') {
          return { settings: { telemetryEnabled: true } };
        }
        return { errorTelemetry: [] };
      });
      vi.mocked(browser.storage.local.set).mockResolvedValue(undefined);
    });

    it('should track error when telemetry is enabled', async () => {
      await trackError(mockErrorDetails);

      expect(browser.storage.local.set).toHaveBeenCalled();
      const callArgs = vi.mocked(browser.storage.local.set).mock.calls[0][0];
      const storedErrors = Object.values(callArgs)[0] as ErrorEvent[];

      expect(storedErrors).toHaveLength(1);
      expect(storedErrors[0]).toMatchObject({
        errorId: mockErrorDetails.errorId,
        code: mockErrorDetails.code,
        message: mockErrorDetails.message,
        category: mockErrorDetails.category,
      });
    });

    it('should skip tracking when telemetry is disabled', async () => {
      vi.mocked(browser.storage.local.get).mockResolvedValue({
        settings: { telemetryEnabled: false },
      });

      await trackError(mockErrorDetails);

      expect(browser.storage.local.set).not.toHaveBeenCalled();
    });

    it('should include context information', async () => {
      await trackError(mockErrorDetails);

      const callArgs = vi.mocked(browser.storage.local.set).mock.calls[0][0];
      const storedErrors = Object.values(callArgs)[0] as ErrorEvent[];
      const errorEvent = storedErrors[0];

      expect(errorEvent.context).toBeDefined();
      expect(errorEvent.context?.extensionVersion).toBe('1.0.0');
    });

    it('should handle storage errors gracefully', async () => {
      vi.mocked(browser.storage.local.get).mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(trackError(mockErrorDetails)).resolves.not.toThrow();
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

      vi.mocked(browser.storage.local.get).mockResolvedValue({
        errorTelemetry: mockErrors,
      });

      const errors = await getStoredErrors();

      expect(errors).toEqual(mockErrors);
    });

    it('should return empty array when no errors stored', async () => {
      vi.mocked(browser.storage.local.get).mockResolvedValue({});

      const errors = await getStoredErrors();

      expect(errors).toEqual([]);
    });

    it('should handle storage errors gracefully', async () => {
      vi.mocked(browser.storage.local.get).mockRejectedValue(new Error('Storage error'));

      const errors = await getStoredErrors();

      expect(errors).toEqual([]);
    });
  });

  describe('clearStoredErrors', () => {
    it('should clear stored errors', async () => {
      vi.mocked(browser.storage.local.remove).mockResolvedValue(undefined);

      await clearStoredErrors();

      expect(browser.storage.local.remove).toHaveBeenCalledWith('errorTelemetry');
    });

    it('should throw on removal errors', async () => {
      vi.mocked(browser.storage.local.remove).mockRejectedValue(new Error('Remove error'));

      await expect(clearStoredErrors()).rejects.toThrow('Remove error');
    });
  });

  describe('exportErrors', () => {
    it('should handle JSON stringify errors and rethrow', async () => {
      // Test error handler at lines 266-267
      const mockErrors: ErrorEvent[] = [
        {
          errorId: 'ERR-1',
          timestamp: Date.now(),
          code: 'TEST',
          message: 'Test',
          category: 'SYSTEM',
          context: {},
        },
      ];

      vi.mocked(browser.storage.local.get).mockResolvedValue({
        errorTelemetry: mockErrors,
      });

      // Mock JSON.stringify to throw
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn(() => {
        throw new Error('JSON stringify failed');
      }) as never;

      try {
        await expect(exportErrors()).rejects.toThrow('JSON stringify failed');
      }
      finally {
        JSON.stringify = originalStringify;
      }
    });

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

      vi.mocked(browser.storage.local.get).mockImplementation(async (key) => {
        if (key === 'errorTelemetry') {
          return { errorTelemetry: mockErrors };
        }
        return {};
      });

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
      vi.mocked(browser.storage.local.get).mockImplementation(async (key) => {
        if (key === 'errorTelemetry') {
          return { errorTelemetry: [] };
        }
        return {};
      });

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
    beforeEach(() => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });
    });

    it('should copy text to clipboard', async () => {
      const text = 'Test error details';

      await copyToClipboard(text);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
    });

    it('should handle clipboard errors gracefully', async () => {
      vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('Clipboard error'));

      await expect(copyToClipboard('test')).resolves.not.toThrow();
    });
  });

  describe('getTelemetryStats', () => {
    it('should handle processing errors and rethrow', async () => {
      // Test error handler at lines 314-315
      // Create error with malformed timestamp to trigger Math.min/max error
      const malformedErrors = [
        {
          errorId: 'ERR-1',
          timestamp: Number.NaN,
          code: 'TEST',
          message: 'Test',
          category: 'SYSTEM',
          context: {},
        },
      ];

      vi.mocked(browser.storage.local.get).mockResolvedValue({
        errorTelemetry: malformedErrors,
      });

      // Mock Math.min to throw
      const originalMin = Math.min;
      Math.min = vi.fn(() => {
        throw new Error('Math operation failed');
      }) as never;

      try {
        await expect(getTelemetryStats()).rejects.toThrow('Math operation failed');
      }
      finally {
        Math.min = originalMin;
      }
    });

    it('should return stats for stored errors', async () => {
      const mockErrors: ErrorEvent[] = [
        {
          errorId: 'ERR-1',
          timestamp: Date.now(),
          code: 'TSX_PARSE_ERROR',
          message: 'Error 1',
          category: 'SYNTAX',
          context: {},
        },
        {
          errorId: 'ERR-2',
          timestamp: Date.now() - 1000,
          code: 'WASM_INIT_FAILED',
          message: 'Error 2',
          category: 'SYSTEM',
          context: {},
        },
        {
          errorId: 'ERR-3',
          timestamp: Date.now() - 2000,
          code: 'TSX_PARSE_ERROR',
          message: 'Error 3',
          category: 'SYNTAX',
          context: {},
        },
      ];

      vi.mocked(browser.storage.local.get).mockResolvedValue({
        errorTelemetry: mockErrors,
      });

      const stats = await getTelemetryStats();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByCategory.SYNTAX).toBe(2);
      expect(stats.errorsByCategory.SYSTEM).toBe(1);
      expect(stats.errorsByCode.TSX_PARSE_ERROR).toBe(2);
      expect(stats.errorsByCode.WASM_INIT_FAILED).toBe(1);
    });

    it('should handle empty error list', async () => {
      vi.mocked(browser.storage.local.get).mockResolvedValue({
        errorTelemetry: [],
      });

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

      vi.mocked(browser.storage.local.get).mockResolvedValue({
        errorTelemetry: mockErrors,
      });

      const stats = await getTelemetryStats();

      expect(stats.oldestError).toBe(now - 5000);
      expect(stats.newestError).toBe(now);
    });
  });
});
