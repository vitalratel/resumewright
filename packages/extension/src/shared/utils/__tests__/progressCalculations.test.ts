/**
 * Tests for Progress Calculation Utilities
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConversionStatus } from '../../types/models';
import {
  calculateETA,
  formatTimeRemaining,
  getStageDisplayName,
  getStageIcon,
} from '../progressCalculations';

describe('progressCalculations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateETA', () => {
    it('should return undefined at 0% progress', () => {
      const eta = calculateETA(0, Date.now(), []);
      expect(eta).toBeUndefined();
    });

    it('should return undefined at 100% progress', () => {
      const eta = calculateETA(100, Date.now(), []);
      expect(eta).toBeUndefined();
    });

    it('should return undefined if projected total < 3 seconds', () => {
      const startTime = Date.now();
      vi.advanceTimersByTime(500); // 500ms elapsed at 50% = 1s total
      const eta = calculateETA(50, startTime, [0, 25, 50]);
      expect(eta).toBeUndefined();
    });

    it('should calculate ETA using linear projection', () => {
      const startTime = Date.now();
      vi.advanceTimersByTime(2000); // 2s elapsed at 50% = 4s total
      const eta = calculateETA(50, startTime, [0]);
      expect(eta).toBe(2); // 2 seconds remaining
    });

    it('should calculate ETA using velocity-based calculation', () => {
      const startTime = Date.now();
      vi.advanceTimersByTime(4000); // 4s elapsed
      // Progress: 0 -> 20 -> 40 -> 60 (steady 20% increments)
      const eta = calculateETA(60, startTime, [0, 20, 40, 60]);
      expect(eta).toBeGreaterThan(0);
      expect(eta).toBeLessThan(5); // Should be reasonable
    });

    it('should handle zero velocity edge case', () => {
      const startTime = Date.now();
      vi.advanceTimersByTime(4000);
      // Same progress repeated (zero velocity)
      const eta = calculateETA(50, startTime, [50, 50, 50]);
      expect(eta).toBeGreaterThan(0); // Should fallback to linear
    });

    it('should use velocity-based calculation with sufficient history', () => {
      const startTime = Date.now();
      vi.advanceTimersByTime(5000);
      const history = [0, 10, 25, 45, 70]; // Accelerating progress
      const eta = calculateETA(70, startTime, history);
      expect(eta).toBeGreaterThan(0);
    });
  });

  describe('formatTimeRemaining', () => {
    it('should format less than 1 second', () => {
      expect(formatTimeRemaining(0)).toBe('less than a second');
      expect(formatTimeRemaining(0.5)).toBe('less than a second');
    });

    it('should format 1 second', () => {
      expect(formatTimeRemaining(1)).toBe('1 second');
    });

    it('should format multiple seconds', () => {
      expect(formatTimeRemaining(5)).toBe('5 seconds');
      expect(formatTimeRemaining(45)).toBe('45 seconds');
    });

    it('should format 1 minute', () => {
      expect(formatTimeRemaining(60)).toBe('1 minute');
      expect(formatTimeRemaining(90)).toBe('1 minute');
    });

    it('should format multiple minutes', () => {
      expect(formatTimeRemaining(120)).toBe('2 minutes');
      expect(formatTimeRemaining(180)).toBe('3 minutes');
      expect(formatTimeRemaining(300)).toBe('5 minutes');
    });
  });

  describe('getStageDisplayName', () => {
    it('should return correct display names for all stages', () => {
      expect(getStageDisplayName('queued')).toBe('Getting ready...');
      expect(getStageDisplayName('parsing')).toBe('Reading your resume...');
      expect(getStageDisplayName('extracting-metadata')).toBe('Analyzing content...');
      expect(getStageDisplayName('rendering')).toBe('Creating PDF layout...');
      expect(getStageDisplayName('laying-out')).toBe('Creating PDF layout...');
      expect(getStageDisplayName('optimizing')).toBe('Optimizing for ATS compatibility...');
      expect(getStageDisplayName('generating-pdf')).toBe('Generating PDF...');
      expect(getStageDisplayName('completed')).toBe('Complete');
      expect(getStageDisplayName('failed')).toBe('Failed');
      expect(getStageDisplayName('cancelled')).toBe('Cancelled');
    });

    it('should return original stage for unknown stages', () => {
      expect(getStageDisplayName('unknown' as ConversionStatus)).toBe('unknown');
    });
  });

  describe('getStageIcon', () => {
    it('should return correct icons for all stages', () => {
      expect(getStageIcon('queued')).toBe('⏳');
      expect(getStageIcon('parsing')).toBe('📄');
      expect(getStageIcon('extracting-metadata')).toBe('🔍');
      expect(getStageIcon('rendering')).toBe('🎨');
      expect(getStageIcon('laying-out')).toBe('📐');
      expect(getStageIcon('optimizing')).toBe('⚡');
      expect(getStageIcon('generating-pdf')).toBe('📋');
      expect(getStageIcon('completed')).toBe('✅');
      expect(getStageIcon('failed')).toBe('❌');
      expect(getStageIcon('cancelled')).toBe('🚫');
    });

    it('should return default icon for unknown stages', () => {
      expect(getStageIcon('unknown' as ConversionStatus)).toBe('⚙️');
    });
  });
});
