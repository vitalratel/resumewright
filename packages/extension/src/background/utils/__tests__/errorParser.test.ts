// ABOUTME: Tests for errorParser — verifies conversion errors produce user-friendly messages.
// ABOUTME: Covers pattern matching to error codes and output from the factory lookup tables.

import { describe, expect, it } from 'vitest';
import { ErrorCode } from '../../../shared/errors/codes';
import {
  ERROR_MESSAGES,
  ERROR_RECOVERABLE,
  ERROR_SUGGESTIONS,
} from '../../../shared/errors/messages';
import { parseConversionError } from '../errorParser';

describe('parseConversionError', () => {
  describe('user-facing message comes from ERROR_MESSAGES, not raw error text', () => {
    it('parse/syntax error → TSX_PARSE_ERROR title', () => {
      const error = new Error('parse error: unexpected token in tsx syntax');
      const result = parseConversionError(error, 'job-1');
      expect(result.message).toBe(ERROR_MESSAGES[ErrorCode.TSX_PARSE_ERROR].title);
    });

    it('WASM error → WASM_EXECUTION_ERROR title', () => {
      const error = new Error('WASM execution failed: called Option::unwrap() on a None value');
      const result = parseConversionError(error, 'job-2');
      expect(result.message).toBe(ERROR_MESSAGES[ErrorCode.WASM_EXECUTION_ERROR].title);
    });

    it('memory error → MEMORY_LIMIT_EXCEEDED title', () => {
      const error = new Error('out of memory: heap allocation failed');
      const result = parseConversionError(error, 'job-3');
      expect(result.message).toBe(ERROR_MESSAGES[ErrorCode.MEMORY_LIMIT_EXCEEDED].title);
    });

    it('timeout error → CONVERSION_TIMEOUT title', () => {
      const error = new Error('conversion timeout exceeded after 20000ms');
      const result = parseConversionError(error, 'job-4');
      expect(result.message).toBe(ERROR_MESSAGES[ErrorCode.CONVERSION_TIMEOUT].title);
    });

    it('font error → FONT_LOAD_ERROR title', () => {
      const error = new Error('font not found: Inter 400 regular');
      const result = parseConversionError(error, 'job-5');
      expect(result.message).toBe(ERROR_MESSAGES[ErrorCode.FONT_LOAD_ERROR].title);
    });

    it('layout error → PDF_LAYOUT_ERROR title', () => {
      const error = new Error('layout overflow: content exceeds page bounds');
      const result = parseConversionError(error, 'job-6');
      expect(result.message).toBe(ERROR_MESSAGES[ErrorCode.PDF_LAYOUT_ERROR].title);
    });

    it('unknown error → PDF_GENERATION_FAILED title', () => {
      const error = new Error('called `Option::unwrap()` on a `None` value');
      const result = parseConversionError(error, 'job-7');
      expect(result.message).toBe(ERROR_MESSAGES[ErrorCode.PDF_GENERATION_FAILED].title);
    });
  });

  describe('suggestions and recoverability come from lookup tables', () => {
    it('uses ERROR_SUGGESTIONS for the matched code', () => {
      const error = new Error('WASM execution failed');
      const result = parseConversionError(error, 'job-8');
      expect(result.suggestions).toEqual(ERROR_SUGGESTIONS[ErrorCode.WASM_EXECUTION_ERROR]);
    });

    it('uses ERROR_RECOVERABLE for the matched code', () => {
      const error = new Error('out of memory');
      const result = parseConversionError(error, 'job-9');
      expect(result.recoverable).toBe(ERROR_RECOVERABLE[ErrorCode.MEMORY_LIMIT_EXCEEDED]);
    });
  });

  describe('technical details are preserved', () => {
    it('includes sanitized stack trace in technicalDetails', () => {
      const error = new Error('WASM execution failed');
      error.stack = 'Error: WASM execution failed\n    at convert (background.js:42)';
      const result = parseConversionError(error, 'job-10');
      expect(result.technicalDetails).toBeDefined();
    });
  });

  describe('existing ConversionError passthrough', () => {
    it('returns a ConversionError as-is', () => {
      const conversionError = {
        code: ErrorCode.PDF_GENERATION_FAILED,
        message: 'Already structured',
        recoverable: true,
        suggestions: ['Try again'],
      };
      const result = parseConversionError(conversionError, 'job-11');
      expect(result.message).toBe('Already structured');
    });
  });
});
