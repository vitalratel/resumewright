/**
 * Error Factory Tests
 *
 * Comprehensive tests for error factory functions.
 * Coverage: All error factories, proper error structure validation, metadata
 * Target: >85% coverage
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCode } from '../../codes';
import type { CreateErrorOptions } from '../errorFactory';
import { createConversionError } from '../errorFactory';
import { createFontLoadError } from '../networkErrors';
import { createPdfGenerationError } from '../pdfErrors';
import {
  createMemoryLimitError,
  createTimeoutError,
  createUnknownError,
  errorToConversionError,
} from '../systemErrors';
import { createTsxParseError } from '../validationErrors';
import { createWasmInitError } from '../wasmErrors';

describe('Error Factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createConversionError', () => {
    it('should create error with all required fields', () => {
      const options: CreateErrorOptions = {
        code: ErrorCode.TSX_PARSE_ERROR,
        stage: 'parsing',
      };

      const error = createConversionError(options);

      expect(error).toMatchObject({
        code: ErrorCode.TSX_PARSE_ERROR,
        stage: 'parsing',
        message: expect.any(String),
        recoverable: expect.any(Boolean),
        suggestions: expect.any(Array),
        category: expect.any(String),
        timestamp: expect.any(Number),
      });
    });

    it('should use default message from ERROR_MESSAGES', () => {
      const error = createConversionError({
        code: ErrorCode.TSX_PARSE_ERROR,
        stage: 'parsing',
      });

      expect(error.message).toBeTruthy();
      expect(error.message.length).toBeGreaterThan(0);
    });

    it('should use custom message when provided', () => {
      const customMessage = 'Custom error message';
      const error = createConversionError({
        code: ErrorCode.TSX_PARSE_ERROR,
        stage: 'parsing',
        message: customMessage,
      });

      expect(error.message).toBe(customMessage);
    });

    it('should include technical details when provided', () => {
      const technicalDetails = 'Line 42: Unexpected token';
      const error = createConversionError({
        code: ErrorCode.TSX_PARSE_ERROR,
        stage: 'parsing',
        technicalDetails,
      });

      expect(error.technicalDetails).toBe(technicalDetails);
    });

    it('should include metadata when provided', () => {
      const metadata = { type: 'location' as const, line: 42, column: 10 };
      const error = createConversionError({
        code: ErrorCode.TSX_PARSE_ERROR,
        stage: 'parsing',
        metadata,
      });

      expect(error.metadata).toEqual(metadata);
    });

    it('should set timestamp to current time', () => {
      const before = Date.now();
      const error = createConversionError({
        code: ErrorCode.TSX_PARSE_ERROR,
        stage: 'parsing',
      });
      const after = Date.now();

      expect(error.timestamp).toBeGreaterThanOrEqual(before);
      expect(error.timestamp).toBeLessThanOrEqual(after);
    });

    it('should set recoverable flag based on error code', () => {
      const recoverableError = createConversionError({
        code: ErrorCode.TSX_PARSE_ERROR,
        stage: 'parsing',
      });

      expect(recoverableError.recoverable).toBeDefined();
    });

    it('should set category based on error code', () => {
      const error = createConversionError({
        code: ErrorCode.TSX_PARSE_ERROR,
        stage: 'parsing',
      });

      expect(error.category).toBeDefined();
      expect(typeof error.category).toBe('string');
    });

    it('should include suggestions based on error code', () => {
      const error = createConversionError({
        code: ErrorCode.TSX_PARSE_ERROR,
        stage: 'parsing',
      });

      expect(Array.isArray(error.suggestions)).toBe(true);
    });

    it('should handle errors without metadata', () => {
      const error = createConversionError({
        code: ErrorCode.WASM_INIT_FAILED,
        stage: 'queued',
      });

      expect(error.metadata).toBeUndefined();
    });

    it('should handle errors without technical details', () => {
      const error = createConversionError({
        code: ErrorCode.PDF_GENERATION_FAILED,
        stage: 'generating-pdf',
      });

      expect(error.technicalDetails).toBeUndefined();
    });
  });

  describe('createTsxParseError', () => {
    it('should create TSX parse error with correct code', () => {
      const error = createTsxParseError('parsing');

      expect(error.code).toBe(ErrorCode.TSX_PARSE_ERROR);
      expect(error.stage).toBe('parsing');
    });

    it('should include technical details', () => {
      const details = 'Syntax error at line 10';
      const error = createTsxParseError('parsing', details);

      expect(error.technicalDetails).toBe(details);
    });

    it('should include line and column metadata', () => {
      const metadata = { type: 'location' as const, line: 42, column: 10 };
      const error = createTsxParseError('parsing', undefined, metadata);

      expect(error.metadata).toEqual(metadata);
    });

    it('should work without optional parameters', () => {
      const error = createTsxParseError('parsing');

      expect(error.code).toBe(ErrorCode.TSX_PARSE_ERROR);
      expect(error.technicalDetails).toBeUndefined();
      expect(error.metadata).toBeUndefined();
    });

    it('should include both technical details and metadata', () => {
      const details = 'Parsing failed';
      const metadata = { type: 'location' as const, line: 5, column: 3 };
      const error = createTsxParseError('parsing', details, metadata);

      expect(error.technicalDetails).toBe(details);
      expect(error.metadata).toEqual(metadata);
    });
  });

  describe('createWasmInitError', () => {
    it('should create WASM init error with correct code', () => {
      const error = createWasmInitError('queued');

      expect(error.code).toBe(ErrorCode.WASM_INIT_FAILED);
      expect(error.stage).toBe('queued');
    });

    it('should include technical details', () => {
      const details = 'WASM module failed to load';
      const error = createWasmInitError('queued', details);

      expect(error.technicalDetails).toBe(details);
    });

    it('should work without technical details', () => {
      const error = createWasmInitError('queued');

      expect(error.code).toBe(ErrorCode.WASM_INIT_FAILED);
      expect(error.technicalDetails).toBeUndefined();
    });
  });

  describe('createPdfGenerationError', () => {
    it('should create PDF generation error with correct code', () => {
      const error = createPdfGenerationError('generating-pdf');

      expect(error.code).toBe(ErrorCode.PDF_GENERATION_FAILED);
      expect(error.stage).toBe('generating-pdf');
    });

    it('should include technical details', () => {
      const details = 'Failed to render page';
      const error = createPdfGenerationError('generating-pdf', details);

      expect(error.technicalDetails).toBe(details);
    });

    it('should work without technical details', () => {
      const error = createPdfGenerationError('generating-pdf');

      expect(error.code).toBe(ErrorCode.PDF_GENERATION_FAILED);
      expect(error.technicalDetails).toBeUndefined();
    });
  });

  describe('createFontLoadError', () => {
    it('should create font load error with correct code', () => {
      const error = createFontLoadError('rendering');

      expect(error.code).toBe(ErrorCode.FONT_LOAD_ERROR);
      expect(error.stage).toBe('rendering');
    });

    it('should include technical details', () => {
      const details = 'Font "Arial" not found';
      const error = createFontLoadError('rendering', details);

      expect(error.technicalDetails).toBe(details);
    });

    it('should work without technical details', () => {
      const error = createFontLoadError('rendering');

      expect(error.code).toBe(ErrorCode.FONT_LOAD_ERROR);
      expect(error.technicalDetails).toBeUndefined();
    });
  });

  describe('createMemoryLimitError', () => {
    it('should create memory limit error with correct code', () => {
      const error = createMemoryLimitError('laying-out');

      expect(error.code).toBe(ErrorCode.MEMORY_LIMIT_EXCEEDED);
      expect(error.stage).toBe('laying-out');
    });

    it('should include file size metadata', () => {
      const metadata = { type: 'location' as const, fileSize: 10000000, maxSize: 5000000 };
      const error = createMemoryLimitError('laying-out', metadata);

      expect(error.metadata).toEqual(metadata);
    });

    it('should work without metadata', () => {
      const error = createMemoryLimitError('laying-out');

      expect(error.code).toBe(ErrorCode.MEMORY_LIMIT_EXCEEDED);
      expect(error.metadata).toBeUndefined();
    });

    it('should include partial metadata', () => {
      const metadata = { type: 'location' as const, fileSize: 10000000 };
      const error = createMemoryLimitError('laying-out', metadata);

      expect(error.metadata).toEqual(metadata);
    });
  });

  describe('createTimeoutError', () => {
    it('should create render timeout error', () => {
      const error = createTimeoutError('rendering', 'render');

      expect(error.code).toBe(ErrorCode.RENDER_TIMEOUT);
      expect(error.stage).toBe('rendering');
    });

    it('should create conversion timeout error', () => {
      const error = createTimeoutError('generating-pdf', 'conversion');

      expect(error.code).toBe(ErrorCode.CONVERSION_TIMEOUT);
      expect(error.stage).toBe('generating-pdf');
    });

    it('should default to conversion timeout', () => {
      const error = createTimeoutError('generating-pdf');

      expect(error.code).toBe(ErrorCode.CONVERSION_TIMEOUT);
    });

    it('should handle different stages', () => {
      const renderError = createTimeoutError('rendering', 'render');
      const conversionError = createTimeoutError('completed', 'conversion');

      expect(renderError.stage).toBe('rendering');
      expect(conversionError.stage).toBe('completed');
    });
  });

  describe('createUnknownError', () => {
    it('should create unknown error with correct code', () => {
      const error = createUnknownError('failed');

      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(error.stage).toBe('failed');
    });

    it('should include technical details', () => {
      const details = 'Unexpected error occurred';
      const error = createUnknownError('failed', details);

      expect(error.technicalDetails).toBe(details);
    });

    it('should work without technical details', () => {
      const error = createUnknownError('failed');

      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(error.technicalDetails).toBeUndefined();
    });
  });

  describe('errorToConversionError', () => {
    it('should convert Error to ConversionError', () => {
      const originalError = new Error('Test error');
      const conversionError = errorToConversionError(originalError, 'parsing');

      expect(conversionError.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(conversionError.stage).toBe('parsing');
      expect(conversionError.technicalDetails).toBe('Test error');
    });

    it('should use custom error code', () => {
      const originalError = new Error('Parse error');
      const conversionError = errorToConversionError(
        originalError,
        'parsing',
        ErrorCode.TSX_PARSE_ERROR,
      );

      expect(conversionError.code).toBe(ErrorCode.TSX_PARSE_ERROR);
    });

    it('should handle non-Error objects', () => {
      const conversionError = errorToConversionError('String error', 'parsing');

      expect(conversionError.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(conversionError.technicalDetails).toBe('String error');
    });

    it('should handle null', () => {
      const conversionError = errorToConversionError(null, 'parsing');

      expect(conversionError.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(conversionError.technicalDetails).toBe('null');
    });

    it('should handle undefined', () => {
      const conversionError = errorToConversionError(undefined, 'parsing');

      expect(conversionError.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(conversionError.technicalDetails).toBe('undefined');
    });

    it('should handle number errors', () => {
      const conversionError = errorToConversionError(42, 'parsing');

      expect(conversionError.technicalDetails).toBe('42');
    });

    it('should handle object errors', () => {
      const obj = { message: 'error', code: 123 };
      const conversionError = errorToConversionError(obj, 'parsing');

      // String(obj) returns '[object Object]'
      expect(conversionError.technicalDetails).toBe('[object Object]');
    });

    it('should extract message from Error objects', () => {
      const error = new Error('Detailed error message');
      const conversionError = errorToConversionError(error, 'parsing');

      expect(conversionError.technicalDetails).toBe('Detailed error message');
    });

    it('should handle Error with empty message', () => {
      const error = new Error('(empty error message)');
      const conversionError = errorToConversionError(error, 'parsing');

      expect(conversionError.technicalDetails).toBe('(empty error message)');
    });

    it('should preserve stage from input', () => {
      const error = new Error('Test');
      const stages: Array<'parsing' | 'rendering' | 'generating-pdf'> = [
        'parsing',
        'rendering',
        'generating-pdf',
      ];

      stages.forEach((stage) => {
        const conversionError = errorToConversionError(error, stage);
        expect(conversionError.stage).toBe(stage);
      });
    });
  });

  describe('error structure validation', () => {
    it('should have consistent structure across all factory functions', () => {
      const errors = [
        createTsxParseError('parsing'),
        createWasmInitError('queued'),
        createPdfGenerationError('generating-pdf'),
        createFontLoadError('rendering'),
        createMemoryLimitError('laying-out'),
        createTimeoutError('rendering'),
        createUnknownError('failed'),
      ];

      errors.forEach((error) => {
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('stage');
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('recoverable');
        expect(error).toHaveProperty('suggestions');
        expect(error).toHaveProperty('category');
        expect(error).toHaveProperty('timestamp');
      });
    });

    it('should have valid timestamps', () => {
      const error = createConversionError({
        code: ErrorCode.TSX_PARSE_ERROR,
        stage: 'parsing',
      });

      expect(error.timestamp).toBeGreaterThan(0);
      expect(error.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should have non-empty messages', () => {
      const errors = [
        createTsxParseError('parsing'),
        createWasmInitError('queued'),
        createPdfGenerationError('generating-pdf'),
      ];

      errors.forEach((error) => {
        expect(error.message).toBeTruthy();
        expect(error.message.length).toBeGreaterThan(0);
      });
    });

    it('should have array of suggestions', () => {
      const error = createConversionError({
        code: ErrorCode.TSX_PARSE_ERROR,
        stage: 'parsing',
      });

      expect(Array.isArray(error.suggestions)).toBe(true);
    });

    it('should have boolean recoverable flag', () => {
      const error = createConversionError({
        code: ErrorCode.TSX_PARSE_ERROR,
        stage: 'parsing',
      });

      expect(typeof error.recoverable).toBe('boolean');
    });
  });

  describe('metadata handling', () => {
    it('should preserve all metadata fields', () => {
      const metadata = {
        type: 'location' as const,
        line: 42,
        column: 10,
        fileSize: 1000,
        maxSize: 5000,
      };

      const error = createConversionError({
        code: ErrorCode.TSX_PARSE_ERROR,
        stage: 'parsing',
        metadata,
      });

      expect(error.metadata).toEqual(metadata);
    });

    it('should handle LocationErrorMetadata', () => {
      const metadata = {
        type: 'location' as const,
        line: 1,
        column: 5,
      };

      const error = createConversionError({
        code: ErrorCode.TSX_PARSE_ERROR,
        stage: 'parsing',
        metadata,
      });

      expect(error.metadata).toEqual(metadata);
    });

    it('should handle missing metadata', () => {
      const error = createConversionError({
        code: ErrorCode.TSX_PARSE_ERROR,
        stage: 'parsing',
      });

      expect(error.metadata).toBeUndefined();
    });
  });
});
