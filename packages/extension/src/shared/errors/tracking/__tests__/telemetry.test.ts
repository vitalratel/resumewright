// ABOUTME: Tests for clipboard export utilities.
// ABOUTME: Covers timestamp formatting and clipboard operations.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ErrorDetails } from '../telemetry';
import {
  copyToClipboard,
  formatErrorDetailsForClipboard,
  formatErrorTimestamp,
} from '../telemetry';

describe('Error Telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-11T19:30:45'));
  });

  afterEach(() => {
    vi.useRealTimers();
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

  describe('formatErrorDetailsForClipboard', () => {
    const mockError: ErrorDetails = {
      timestamp: '2025-11-11 19:30:45',
      code: 'TSX_PARSE_ERROR',
      message: 'Failed to parse TSX',
      category: 'SYNTAX',
      technicalDetails: 'Unexpected token',
      metadata: { line: 42 },
    };

    it('should format error for clipboard', () => {
      const formatted = formatErrorDetailsForClipboard(mockError);

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

    it('should include metadata when present', () => {
      const formatted = formatErrorDetailsForClipboard(mockError);

      expect(formatted).toContain('--- Metadata ---');
      expect(formatted).toContain('"line": 42');
    });

    it('should handle errors without optional fields', () => {
      const minimalError: ErrorDetails = {
        timestamp: '2025-11-11 19:30:45',
        code: 'TEST',
        message: 'Test',
      };

      const formatted = formatErrorDetailsForClipboard(minimalError);

      expect(formatted).toContain('Error Code: TEST');
      expect(formatted).toContain('Category: N/A');
      expect(formatted).not.toContain('--- Technical Details ---');
      expect(formatted).not.toContain('--- Metadata ---');
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

    it('should copy text to clipboard and return true', async () => {
      const text = 'Test error details';

      const result = await copyToClipboard(text);

      expect(writeTextMock).toHaveBeenCalledWith(text);
      expect(result).toBe(true);
    });

    it('should return false when clipboard API fails', async () => {
      writeTextMock.mockRejectedValue(new Error('Clipboard error'));

      const result = await copyToClipboard('test');

      expect(result).toBe(false);
    });

    it('should return false when clipboard API is not available', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const result = await copyToClipboard('test');

      expect(result).toBe(false);
    });
  });
});
