// ABOUTME: Tests for conversion validation schemas.
// ABOUTME: Verifies status, progress, config, and error validation.

import { describe, expect, it } from 'vitest';
import {
  parseConversionConfig,
  validateConversionConfig,
  validateConversionError,
  validateConversionProgress,
  validateConversionStatus,
} from '../conversion';

describe('Conversion Validation', () => {
  describe('validateConversionStatus', () => {
    it('should validate valid conversion status', () => {
      expect(validateConversionStatus('queued')).toBe(true);
      expect(validateConversionStatus('parsing')).toBe(true);
      expect(validateConversionStatus('completed')).toBe(true);
      expect(validateConversionStatus('failed')).toBe(true);
    });

    it('should reject invalid conversion status', () => {
      expect(validateConversionStatus('invalid')).toBe(false);
      expect(validateConversionStatus('')).toBe(false);
      expect(validateConversionStatus(null)).toBe(false);
      expect(validateConversionStatus(undefined)).toBe(false);
      expect(validateConversionStatus(123)).toBe(false);
    });
  });

  describe('validateConversionProgress', () => {
    it('should validate valid conversion progress', () => {
      const validProgress = {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering page 1 of 2',
      };

      expect(validateConversionProgress(validProgress)).toBe(true);
    });

    it('should validate progress with optional fields', () => {
      const progressWithOptionals = {
        stage: 'laying-out',
        percentage: 75,
        currentOperation: 'Laying out content',
        estimatedTimeRemaining: 5000,
        pagesProcessed: 1,
        totalPages: 2,
      };

      expect(validateConversionProgress(progressWithOptionals)).toBe(true);
    });

    it('should reject invalid percentage', () => {
      const invalidProgress = {
        stage: 'rendering',
        percentage: 150, // > 100
        currentOperation: 'Rendering',
      };

      expect(validateConversionProgress(invalidProgress)).toBe(false);
    });

    it('should reject invalid stage', () => {
      const invalidProgress = {
        stage: 'invalid-stage',
        percentage: 50,
        currentOperation: 'Processing',
      };

      expect(validateConversionProgress(invalidProgress)).toBe(false);
    });

    it('should reject empty currentOperation', () => {
      const invalidProgress = {
        stage: 'rendering',
        percentage: 50,
        currentOperation: '', // empty string not allowed
      };

      expect(validateConversionProgress(invalidProgress)).toBe(false);
    });

    it('should reject pagesProcessed without totalPages', () => {
      const invalidProgress = {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering',
        pagesProcessed: 1,
        // missing totalPages
      };

      expect(validateConversionProgress(invalidProgress)).toBe(false);
    });
  });

  describe('validateConversionConfig', () => {
    it('should validate valid conversion config', () => {
      const validConfig = {
        pageSize: 'Letter',
        margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        fontSize: 12,
        fontFamily: 'Arial',
        filename: 'resume.pdf',
        compress: true,
        atsOptimization: true,
        includeMetadata: true,
      };

      expect(validateConversionConfig(validConfig)).toBe(true);
    });

    it('should reject invalid page size', () => {
      const invalidConfig = {
        pageSize: 'InvalidSize',
        margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        fontSize: 12,
        fontFamily: 'Arial',
        filename: 'resume.pdf',
        compress: true,
        atsOptimization: true,
        includeMetadata: true,
      };

      expect(validateConversionConfig(invalidConfig)).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidConfig = {
        pageSize: 'Letter',
        // missing margin, fontSize, etc.
      };

      expect(validateConversionConfig(invalidConfig)).toBe(false);
    });
  });

  describe('validateConversionError', () => {
    it('should validate valid conversion error', () => {
      const validError = {
        stage: 'parsing',
        code: 'TSX_PARSE_ERROR',
        message: 'Failed to parse TSX',
        recoverable: true,
        suggestions: ['Check syntax', 'Verify structure'],
      };

      expect(validateConversionError(validError)).toBe(true);
    });

    it('should validate error with optional technical details', () => {
      const errorWithDetails = {
        stage: 'rendering',
        code: 'RENDER_ERROR',
        message: 'Rendering failed',
        technicalDetails: 'Stack trace: ...',
        recoverable: false,
        suggestions: ['Report issue'],
      };

      expect(validateConversionError(errorWithDetails)).toBe(true);
    });

    it('should reject invalid error code', () => {
      const invalidError = {
        stage: 'parsing',
        code: '', // empty code not allowed
        message: 'Failed',
        recoverable: true,
        suggestions: [],
      };

      expect(validateConversionError(invalidError)).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidError = {
        code: 'ERROR',
        message: 'Failed',
        // missing stage, recoverable, suggestions
      };

      expect(validateConversionError(invalidError)).toBe(false);
    });
  });

  describe('parseConversionConfig', () => {
    it('should parse valid config', () => {
      const validConfig = {
        pageSize: 'Letter',
        margin: { top: 1, right: 1, bottom: 1, left: 1 },
        fontSize: 14,
        fontFamily: 'Times New Roman',
        filename: 'document.pdf',
        compress: true,
        atsOptimization: false,
        includeMetadata: true,
      };

      const result = parseConversionConfig(validConfig);

      expect(result).toEqual(validConfig);
    });

    it('should throw on invalid config', () => {
      const invalidConfig = {
        pageSize: 'InvalidSize',
        margin: { top: 1, right: 1, bottom: 1, left: 1 },
      };

      expect(() => parseConversionConfig(invalidConfig)).toThrow();
    });

    it('should throw on missing required fields', () => {
      const invalidConfig = {
        pageSize: 'Letter',
        // missing margin and other required fields
      };

      expect(() => parseConversionConfig(invalidConfig)).toThrow();
    });
  });
});
