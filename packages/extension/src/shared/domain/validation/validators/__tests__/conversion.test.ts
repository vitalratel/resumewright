/**
 * Conversion Validator Tests
 *
 * Tests for conversion validation functions covering:
 * - ConversionStatus validation
 * - ConversionProgress validation
 * - ConversionConfig validation
 * - ConversionError validation
 * - PDFMetadata validation
 * - ConversionJob validation
 * - Parse functions with error handling
 *
 * Coverage target: >85%
 */

import type {
  ConversionConfig,
  ConversionError,
  ConversionJob,
  ConversionProgress,
  ConversionStatus,
  PDFMetadata,
} from '@/shared/types/models';
import { describe, expect, it } from 'vitest';
import { ErrorCode } from '@/shared/types/errors';
import {
  parseConversionConfig,
  validateConversionConfig,
  validateConversionError,
  validateConversionJob,
  validateConversionProgress,
  validateConversionStatus,
  validatePDFMetadata,
} from '../conversion';

describe('Conversion Validators', () => {
  describe('validateConversionStatus', () => {
    it('should validate valid conversion statuses', () => {
      const validStatuses: ConversionStatus[] = [
        'queued',
        'parsing',
        'extracting-metadata',
        'rendering',
        'laying-out',
        'optimizing',
        'generating-pdf',
        'completed',
        'failed',
        'cancelled',
      ];

      validStatuses.forEach((status) => {
        expect(validateConversionStatus(status)).toBe(true);
      });
    });

    it('should reject invalid conversion statuses', () => {
      expect(validateConversionStatus('invalid')).toBe(false);
      expect(validateConversionStatus('COMPLETED')).toBe(false);
      expect(validateConversionStatus('')).toBe(false);
      expect(validateConversionStatus(null)).toBe(false);
      expect(validateConversionStatus(undefined)).toBe(false);
      expect(validateConversionStatus(123)).toBe(false);
    });
  });

  describe('validateConversionProgress', () => {
    const validProgress: ConversionProgress = {
      stage: 'parsing',
      percentage: 50,
      currentOperation: 'Parsing TSX components',
      estimatedTimeRemaining: 5000,
      pagesProcessed: 1,
      totalPages: 2,
    };

    it('should validate valid conversion progress', () => {
      expect(validateConversionProgress(validProgress)).toBe(true);
    });

    it('should validate minimal conversion progress', () => {
      const minimal = {
        stage: 'queued',
        percentage: 0,
        currentOperation: 'Initializing',
      };

      expect(validateConversionProgress(minimal)).toBe(true);
    });

    it('should reject progress with invalid percentage', () => {
      expect(validateConversionProgress({
        ...validProgress,
        percentage: -1,
      })).toBe(false);

      expect(validateConversionProgress({
        ...validProgress,
        percentage: 101,
      })).toBe(false);

      expect(validateConversionProgress({
        ...validProgress,
        percentage: 'fifty',
      })).toBe(false);
    });

    it('should reject progress with empty currentOperation', () => {
      expect(validateConversionProgress({
        ...validProgress,
        currentOperation: '',
      })).toBe(false);
    });

    it('should reject progress with invalid estimatedTimeRemaining', () => {
      expect(validateConversionProgress({
        ...validProgress,
        estimatedTimeRemaining: 0,
      })).toBe(false);

      expect(validateConversionProgress({
        ...validProgress,
        estimatedTimeRemaining: -100,
      })).toBe(false);

      expect(validateConversionProgress({
        ...validProgress,
        estimatedTimeRemaining: 5.5,
      })).toBe(false);
    });

    it('should reject progress with pagesProcessed > totalPages', () => {
      expect(validateConversionProgress({
        ...validProgress,
        pagesProcessed: 3,
        totalPages: 2,
      })).toBe(false);
    });

    it('should reject progress with pagesProcessed but no totalPages', () => {
      const progress = {
        stage: 'parsing',
        percentage: 50,
        currentOperation: 'Processing',
        pagesProcessed: 1,
      };

      expect(validateConversionProgress(progress)).toBe(false);
    });

    it('should reject progress with negative pages', () => {
      expect(validateConversionProgress({
        ...validProgress,
        pagesProcessed: -1,
        totalPages: 2,
      })).toBe(false);

      expect(validateConversionProgress({
        ...validProgress,
        pagesProcessed: 1,
        totalPages: 0,
      })).toBe(false);
    });
  });

  describe('validateConversionConfig', () => {
    const validConfig: ConversionConfig = {
      pageSize: 'Letter',
      margin: {
        top: 0.5,
        right: 0.5,
        bottom: 0.5,
        left: 0.5,
      },
      fontSize: 12,
      fontFamily: 'Arial',
      filename: 'resume.pdf',
      compress: true,
      atsOptimization: true,
      includeMetadata: true,
    };

    it('should validate valid conversion config', () => {
      expect(validateConversionConfig(validConfig)).toBe(true);
    });

    it('should validate minimal conversion config', () => {
      const minimal = {
        pageSize: 'A4',
        margin: {
          top: 1,
          right: 1,
          bottom: 1,
          left: 1,
        },
        fontSize: 10,
        fontFamily: 'Times New Roman',
        compress: false,
      };

      expect(validateConversionConfig(minimal)).toBe(true);
    });

    it('should validate different page sizes', () => {
      const sizes = ['Letter', 'A4', 'Legal'] as const;

      sizes.forEach((pageSize) => {
        expect(validateConversionConfig({
          ...validConfig,
          pageSize,
        })).toBe(true);
      });
    });

    it('should reject invalid page size', () => {
      expect(validateConversionConfig({
        ...validConfig,
        pageSize: 'Tabloid',
      })).toBe(false);
    });

    it('should reject invalid margins', () => {
      expect(validateConversionConfig({
        ...validConfig,
        margin: { ...validConfig.margin, top: -0.1 },
      })).toBe(false);

      expect(validateConversionConfig({
        ...validConfig,
        margin: { ...validConfig.margin, right: 2.1 },
      })).toBe(false);

      expect(validateConversionConfig({
        ...validConfig,
        margin: { ...validConfig.margin, bottom: 3 },
      })).toBe(false);
    });

    it('should reject invalid font size', () => {
      expect(validateConversionConfig({
        ...validConfig,
        fontSize: 5,
      })).toBe(false);

      expect(validateConversionConfig({
        ...validConfig,
        fontSize: 73,
      })).toBe(false);

      expect(validateConversionConfig({
        ...validConfig,
        fontSize: 'large',
      })).toBe(false);
    });

    it('should reject empty or too long font family', () => {
      expect(validateConversionConfig({
        ...validConfig,
        fontFamily: '',
      })).toBe(false);

      expect(validateConversionConfig({
        ...validConfig,
        fontFamily: 'A'.repeat(101),
      })).toBe(false);
    });

    it('should reject too long filename', () => {
      expect(validateConversionConfig({
        ...validConfig,
        filename: `${'A'.repeat(256)}.pdf`,
      })).toBe(false);
    });

    it('should reject non-boolean compress flag', () => {
      expect(validateConversionConfig({
        ...validConfig,
        compress: 'yes',
      })).toBe(false);

      expect(validateConversionConfig({
        ...validConfig,
        compress: 1,
      })).toBe(false);
    });
  });

  describe('validateConversionError', () => {
    const validError: ConversionError = {
      stage: 'parsing',
      code: ErrorCode.TSX_PARSE_ERROR,
      message: 'Failed to parse TSX component',
      technicalDetails: 'Unexpected token at line 42',
      recoverable: true,
      suggestions: ['Check TSX syntax', 'Verify component structure'],
      timestamp: Date.now(),
      errorId: 'error-123',
    };

    it('should validate valid conversion error', () => {
      expect(validateConversionError(validError)).toBe(true);
    });

    it('should validate minimal conversion error', () => {
      const minimal = {
        stage: 'failed',
        code: 'UNKNOWN_ERROR',
        message: 'An error occurred',
        recoverable: false,
        suggestions: [],
      };

      expect(validateConversionError(minimal)).toBe(true);
    });

    it('should reject empty error code', () => {
      expect(validateConversionError({
        ...validError,
        code: '',
      })).toBe(false);
    });

    it('should reject too long error code', () => {
      expect(validateConversionError({
        ...validError,
        code: 'A'.repeat(101),
      })).toBe(false);
    });

    it('should reject empty error message', () => {
      expect(validateConversionError({
        ...validError,
        message: '',
      })).toBe(false);
    });

    it('should reject too long error message', () => {
      expect(validateConversionError({
        ...validError,
        message: 'A'.repeat(501),
      })).toBe(false);
    });

    it('should reject too long technical details', () => {
      expect(validateConversionError({
        ...validError,
        technicalDetails: 'A'.repeat(2001),
      })).toBe(false);
    });

    it('should reject non-boolean recoverable flag', () => {
      expect(validateConversionError({
        ...validError,
        recoverable: 'yes',
      })).toBe(false);
    });

    it('should reject empty suggestions', () => {
      expect(validateConversionError({
        ...validError,
        suggestions: ['Valid suggestion', ''],
      })).toBe(false);
    });

    it('should reject too long suggestions', () => {
      expect(validateConversionError({
        ...validError,
        suggestions: ['A'.repeat(201)],
      })).toBe(false);
    });
  });

  describe('validatePDFMetadata', () => {
    const validMetadata: PDFMetadata = {
      title: 'Software Engineer Resume',
      author: 'John Doe',
      subject: 'Resume',
      keywords: ['software', 'engineer', 'typescript'],
      creator: 'ResumeWright',
      producer: 'ResumeWright PDF Generator',
      creationDate: new Date('2025-11-11T10:00:00Z'),
      modificationDate: new Date('2025-11-11T12:00:00Z'),
      pageCount: 1,
      fileSize: 50000,
    };

    it('should validate valid PDF metadata', () => {
      expect(validatePDFMetadata(validMetadata)).toBe(true);
    });

    it('should validate minimal PDF metadata', () => {
      const minimal = {
        title: 'Resume',
        creator: 'ResumeWright',
        producer: 'ResumeWright PDF Generator',
        creationDate: new Date(),
        pageCount: 1,
        fileSize: 10000,
      };

      expect(validatePDFMetadata(minimal)).toBe(true);
    });

    it('should reject empty title', () => {
      expect(validatePDFMetadata({
        ...validMetadata,
        title: '',
      })).toBe(false);
    });

    it('should reject too long title', () => {
      expect(validatePDFMetadata({
        ...validMetadata,
        title: 'A'.repeat(501),
      })).toBe(false);
    });

    it('should reject too long author', () => {
      expect(validatePDFMetadata({
        ...validMetadata,
        author: 'A'.repeat(201),
      })).toBe(false);
    });

    it('should reject too long subject', () => {
      expect(validatePDFMetadata({
        ...validMetadata,
        subject: 'A'.repeat(501),
      })).toBe(false);
    });

    it('should reject empty keywords', () => {
      expect(validatePDFMetadata({
        ...validMetadata,
        keywords: ['valid', ''],
      })).toBe(false);
    });

    it('should reject too long keywords', () => {
      expect(validatePDFMetadata({
        ...validMetadata,
        keywords: ['A'.repeat(101)],
      })).toBe(false);
    });

    it('should reject empty creator or producer', () => {
      expect(validatePDFMetadata({
        ...validMetadata,
        creator: '',
      })).toBe(false);

      expect(validatePDFMetadata({
        ...validMetadata,
        producer: '',
      })).toBe(false);
    });

    it('should reject invalid creation date', () => {
      expect(validatePDFMetadata({
        ...validMetadata,
        creationDate: '2025-11-11',
      })).toBe(false);

      expect(validatePDFMetadata({
        ...validMetadata,
        creationDate: Date.now(),
      })).toBe(false);
    });

    it('should reject modification date before creation date', () => {
      expect(validatePDFMetadata({
        ...validMetadata,
        creationDate: new Date('2025-11-11T12:00:00Z'),
        modificationDate: new Date('2025-11-11T10:00:00Z'),
      })).toBe(false);
    });

    it('should reject invalid page count', () => {
      expect(validatePDFMetadata({
        ...validMetadata,
        pageCount: 0,
      })).toBe(false);

      expect(validatePDFMetadata({
        ...validMetadata,
        pageCount: 1001,
      })).toBe(false);

      expect(validatePDFMetadata({
        ...validMetadata,
        pageCount: 1.5,
      })).toBe(false);
    });

    it('should reject negative file size', () => {
      expect(validatePDFMetadata({
        ...validMetadata,
        fileSize: -1,
      })).toBe(false);
    });
  });

  describe('validateConversionJob', () => {
    const baseTimestamp = Date.now();

    const validJob: ConversionJob = {
      id: 'job-123',
      cvDocument: {
        id: 'cv-123',
        sourceType: 'claude',
        tsx: 'export default function Resume() { return <div>Resume</div>; }',
        metadata: {
          name: 'John Doe',
          email: 'john@example.com',
          title: 'Software Engineer',
          layoutType: 'single-column',
          estimatedPages: 1,
          componentCount: 5,
          hasContactInfo: true,
          hasClearSections: true,
          fontComplexity: 'simple',
        },
        parseTimestamp: baseTimestamp,
      },
      status: 'parsing',
      progress: {
        stage: 'parsing',
        percentage: 50,
        currentOperation: 'Parsing components',
      },
      config: {
        pageSize: 'Letter',
        margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        fontSize: 12,
        fontFamily: 'Arial',
        compress: true,
      },
      startTime: baseTimestamp,
    };

    it('should validate valid conversion job', () => {
      expect(validateConversionJob(validJob)).toBe(true);
    });

    it('should validate job with success result', () => {
      const jobWithResult = {
        ...validJob,
        status: 'completed' as const,
        result: {
          success: true as const,
          pdfBytes: new Uint8Array([1, 2, 3]),
          metadata: {
            title: 'Resume',
            creator: 'ResumeWright',
            producer: 'ResumeWright PDF Generator',
            creationDate: new Date(baseTimestamp),
            pageCount: 1,
            fileSize: 50000,
          },
        },
        endTime: baseTimestamp + 5000,
      };

      expect(validateConversionJob(jobWithResult)).toBe(true);
    });

    it('should validate job with error result', () => {
      const jobWithError = {
        ...validJob,
        status: 'failed' as const,
        result: {
          success: false as const,
          error: {
            stage: 'parsing' as const,
            code: 'PARSE_ERROR',
            message: 'Failed to parse',
            recoverable: true,
            suggestions: ['Check syntax'],
          },
        },
        endTime: baseTimestamp + 5000,
      };

      expect(validateConversionJob(jobWithError)).toBe(true);
    });

    it('should reject empty job ID', () => {
      expect(validateConversionJob({
        ...validJob,
        id: '',
      })).toBe(false);
    });

    it('should reject too long job ID', () => {
      expect(validateConversionJob({
        ...validJob,
        id: 'A'.repeat(101),
      })).toBe(false);
    });

    it('should reject endTime before startTime', () => {
      expect(validateConversionJob({
        ...validJob,
        endTime: baseTimestamp - 1000,
      })).toBe(false);
    });

    it('should reject invalid start time', () => {
      expect(validateConversionJob({
        ...validJob,
        startTime: 0,
      })).toBe(false);

      expect(validateConversionJob({
        ...validJob,
        startTime: -1,
      })).toBe(false);
    });

    it('should reject result with wrong success type', () => {
      expect(validateConversionJob({
        ...validJob,
        result: {
          success: true,
          error: {
            stage: 'parsing',
            code: 'ERROR',
            message: 'Error',
            recoverable: false,
            suggestions: [],
          },
        },
      })).toBe(false);
    });
  });

  describe('parseConversionConfig', () => {
    const validConfig: ConversionConfig = {
      pageSize: 'Letter',
      margin: {
        top: 0.5,
        right: 0.5,
        bottom: 0.5,
        left: 0.5,
      },
      fontSize: 12,
      fontFamily: 'Arial',
      compress: true,
    };

    it('should parse valid conversion config', () => {
      const result = parseConversionConfig(validConfig);

      expect(result).toEqual(validConfig);
    });

    it('should throw error for invalid config', () => {
      expect(() => parseConversionConfig({
        ...validConfig,
        pageSize: 'Invalid',
      })).toThrow();

      expect(() => parseConversionConfig({
        ...validConfig,
        fontSize: 100,
      })).toThrow();

      expect(() => parseConversionConfig({
        ...validConfig,
        margin: { ...validConfig.margin, top: -1 },
      })).toThrow();
    });

    it('should throw error for missing required fields', () => {
      expect(() => parseConversionConfig({
        pageSize: 'Letter',
        // missing margin
        fontSize: 12,
        fontFamily: 'Arial',
        compress: true,
      })).toThrow();
    });

    it('should throw error for null or undefined', () => {
      expect(() => parseConversionConfig(null)).toThrow();
      expect(() => parseConversionConfig(undefined)).toThrow();
    });
  });
});
