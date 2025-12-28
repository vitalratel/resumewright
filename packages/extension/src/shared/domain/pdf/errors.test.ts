// ABOUTME: Tests for WASM error parsing module.
// ABOUTME: Covers JSON parsing, stage mapping, and fallback error handling.

import { describe, expect, it } from 'vitest';
import { ErrorCode } from '../../errors/codes';
import { parseWasmError } from './errors';

describe('parseWasmError', () => {
  describe('valid JSON error parsing', () => {
    it('should parse valid JSON error with all fields', () => {
      const jsonError = JSON.stringify({
        code: 'TSX_PARSE_ERROR',
        message: 'Failed to parse TSX',
        stage: 'parsing',
        technicalDetails: 'Syntax error at line 5',
        recoverable: true,
        suggestions: ['Check syntax', 'Try again'],
      });

      const result = parseWasmError(jsonError);

      expect(result.code).toBe('TSX_PARSE_ERROR');
      expect(result.message).toBe('Failed to parse TSX');
      expect(result.stage).toBe('parsing');
      expect(result.technicalDetails).toBe('Syntax error at line 5');
      expect(result.recoverable).toBe(true);
      expect(result.suggestions).toEqual(['Check syntax', 'Try again']);
      expect(result.timestamp).toBeTypeOf('number');
    });

    it('should parse JSON error with minimal fields', () => {
      const jsonError = JSON.stringify({
        code: 'UNKNOWN_ERROR',
        message: 'Something went wrong',
      });

      const result = parseWasmError(jsonError);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('Something went wrong');
      expect(result.stage).toBe('failed'); // Default for unknown/missing stage
      expect(result.recoverable).toBe(false); // Default
      expect(result.suggestions).toEqual([]); // Default
    });

    it('should handle empty stage as failed', () => {
      const jsonError = JSON.stringify({
        code: 'ERROR',
        message: 'Error',
        stage: '',
      });

      const result = parseWasmError(jsonError);

      expect(result.stage).toBe('failed');
    });

    it('should handle null stage as failed', () => {
      const jsonError = JSON.stringify({
        code: 'ERROR',
        message: 'Error',
        stage: null,
      });

      const result = parseWasmError(jsonError);

      expect(result.stage).toBe('failed');
    });
  });

  describe('stage mapping', () => {
    const stages = [
      { input: 'parsing', expected: 'parsing' },
      { input: 'extracting-metadata', expected: 'extracting-metadata' },
      { input: 'rendering', expected: 'rendering' },
      { input: 'laying-out', expected: 'laying-out' },
      { input: 'generating-pdf', expected: 'generating-pdf' },
      { input: 'completed', expected: 'completed' },
      { input: 'unknown-stage', expected: 'failed' },
      { input: 'invalid', expected: 'failed' },
    ];

    stages.forEach(({ input, expected }) => {
      it(`should map stage "${input}" to "${expected}"`, () => {
        const jsonError = JSON.stringify({
          code: 'ERROR',
          message: 'Error',
          stage: input,
        });

        const result = parseWasmError(jsonError);

        expect(result.stage).toBe(expected);
      });
    });
  });

  describe('fallback error handling', () => {
    it('should handle Error objects', () => {
      const error = new Error('Something broke');

      const result = parseWasmError(error);

      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.message).toBe('Conversion failed: Something broke');
      expect(result.stage).toBe('failed');
      expect(result.recoverable).toBe(false);
      expect(result.suggestions).toEqual([
        'Check TSX syntax',
        'Try again',
        'Contact support if error persists',
      ]);
    });

    it('should handle plain strings', () => {
      const error = 'Plain string error';

      const result = parseWasmError(error);

      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.message).toBe('Conversion failed: Plain string error');
    });

    it('should handle numbers', () => {
      const error = 42;

      const result = parseWasmError(error);

      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.message).toBe('Conversion failed: 42');
    });

    it('should handle null', () => {
      const result = parseWasmError(null);

      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.message).toBe('Conversion failed: null');
    });

    it('should handle undefined', () => {
      const result = parseWasmError(undefined);

      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.message).toBe('Conversion failed: undefined');
    });

    it('should serialize plain objects to JSON', () => {
      const error = { custom: 'property', nested: { value: 123 } };

      const result = parseWasmError(error);

      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.message).toContain('Conversion failed:');
      expect(result.message).toContain('custom');
      expect(result.message).toContain('property');
    });

    it('should handle invalid JSON strings', () => {
      const invalidJson = '{not valid json}';

      const result = parseWasmError(invalidJson);

      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.message).toBe('Conversion failed: {not valid json}');
    });

    it('should handle JSON that does not match schema', () => {
      // Valid JSON but missing required fields
      const invalidSchema = JSON.stringify({ foo: 'bar' });

      const result = parseWasmError(invalidSchema);

      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.message).toContain('Conversion failed:');
    });
  });

  describe('optional fields handling', () => {
    it('should handle undefined recoverable as false', () => {
      const jsonError = JSON.stringify({
        code: 'ERROR',
        message: 'Error',
        recoverable: undefined,
      });

      const result = parseWasmError(jsonError);

      expect(result.recoverable).toBe(false);
    });

    it('should fallback to default when recoverable is null (fails schema)', () => {
      // null is not valid for optional(boolean()), so schema validation fails
      const jsonError = JSON.stringify({
        code: 'ERROR',
        message: 'Error',
        recoverable: null,
      });

      const result = parseWasmError(jsonError);

      // Falls back to default error handling
      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.recoverable).toBe(false);
    });

    it('should handle undefined suggestions as empty array', () => {
      const jsonError = JSON.stringify({
        code: 'ERROR',
        message: 'Error',
        suggestions: undefined,
      });

      const result = parseWasmError(jsonError);

      expect(result.suggestions).toEqual([]);
    });

    it('should fallback to default when suggestions is null (fails schema)', () => {
      // null is not valid for optional(array(string())), so schema validation fails
      // and we get the default error with default suggestions
      const jsonError = JSON.stringify({
        code: 'ERROR',
        message: 'Error',
        suggestions: null,
      });

      const result = parseWasmError(jsonError);

      // Falls back to default error handling
      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.suggestions).toEqual([
        'Check TSX syntax',
        'Try again',
        'Contact support if error persists',
      ]);
    });

    it('should preserve technicalDetails when provided', () => {
      const jsonError = JSON.stringify({
        code: 'ERROR',
        message: 'Error',
        technicalDetails: 'Stack trace here',
      });

      const result = parseWasmError(jsonError);

      expect(result.technicalDetails).toBe('Stack trace here');
    });
  });
});
