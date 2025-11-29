/**
 * Tests for formatting utilities
 * File size formatting edge cases
 */

import { describe, expect, it } from 'vitest';
import { formatFileSize } from '../formatting';

describe('formatting', () => {
  describe('formatFileSize', () => {
    it('should format 0 bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('should format bytes without decimal places', () => {
      expect(formatFileSize(1)).toBe('1 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1023)).toBe('1023 B');
    });

    it('should format kilobytes with 1 decimal place', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2048)).toBe('2.0 KB');
      expect(formatFileSize(10240)).toBe('10.0 KB');
    });

    it('should format megabytes with 1 decimal place', () => {
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
      expect(formatFileSize(2097152)).toBe('2.0 MB');
      expect(formatFileSize(10485760)).toBe('10.0 MB');
    });

    it('should format gigabytes with 1 decimal place', () => {
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
      expect(formatFileSize(1610612736)).toBe('1.5 GB');
      expect(formatFileSize(2147483648)).toBe('2.0 GB');
    });

    it('should handle fractional values correctly', () => {
      // 1280 bytes = 1.25 KB → rounds to 1.3 KB
      expect(formatFileSize(1280)).toBe('1.3 KB');
      // 1835008 bytes = 1.75 MB → rounds to 1.8 MB
      expect(formatFileSize(1835008)).toBe('1.8 MB');
      // 2503999488 bytes = 2.33 GB → rounds to 2.3 GB
      expect(formatFileSize(2503999488)).toBe('2.3 GB');
    });

    it('should round bytes to nearest integer', () => {
      expect(formatFileSize(999.9)).toBe('1000 B');
      expect(formatFileSize(512.4)).toBe('512 B');
      expect(formatFileSize(512.6)).toBe('513 B');
    });

    it('should handle edge case between units', () => {
      // 1023 bytes (last B value)
      expect(formatFileSize(1023)).toBe('1023 B');
      // 1024 bytes (first KB value)
      expect(formatFileSize(1024)).toBe('1.0 KB');

      // Last KB value before MB
      expect(formatFileSize(1048575)).toBe('1024.0 KB');
      // First MB value
      expect(formatFileSize(1048576)).toBe('1.0 MB');
    });

    it('should handle very large files', () => {
      // 10 GB
      expect(formatFileSize(10737418240)).toBe('10.0 GB');
      // 100 GB
      expect(formatFileSize(107374182400)).toBe('100.0 GB');
    });

    it('should handle small decimal values consistently', () => {
      // Should always show 1 decimal for KB/MB/GB
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
    });

    it('should handle typical file sizes', () => {
      // Small text file (5 KB)
      expect(formatFileSize(5120)).toBe('5.0 KB');

      // Document (100 KB)
      expect(formatFileSize(102400)).toBe('100.0 KB');

      // Image (2.5 MB)
      expect(formatFileSize(2621440)).toBe('2.5 MB');

      // Video (500 MB)
      expect(formatFileSize(524288000)).toBe('500.0 MB');

      // Large file (1.5 GB)
      expect(formatFileSize(1610612736)).toBe('1.5 GB');
    });
  });
});
