/**
 * Tests for type guard functions
 */

import type { ConversionError, ConversionResult } from '../../types/models';
import { describe, expect, it } from 'vitest';
import { ErrorCode } from '../../types/errors/';
import { MessageType } from '../../types/messages';
import {
  isConversionError,
  isConversionErrorObject,
  isConversionSuccess,
  isDefined,
  isError,
  isMessage,
  isMessageType,
  isNotNull,
  isNotUndefined,
  isUint8Array,
} from '../typeGuards';

describe('typeGuards', () => {
  describe('isConversionSuccess', () => {
    it('should return true for successful conversion result', () => {
      const result: ConversionResult = {
        success: true,
        pdfBytes: new Uint8Array([1, 2, 3]),
        metadata: {
          title: '',
          creator: '',
          producer: '',
          pageCount: 1,
          fileSize: 1024,
          creationDate: new Date(),
        },
      };

      expect(isConversionSuccess(result)).toBe(true);
    });

    it('should return false for failed conversion result', () => {
      const result: ConversionResult = {
        success: false,
        error: {
          code: ErrorCode.TSX_PARSE_ERROR,
          recoverable: false,
          message: 'Invalid TSX',
          stage: 'failed',
          timestamp: Date.now(),
          suggestions: [],
          errorId: 'tsx-parse-error-id',
        },
      };

      expect(isConversionSuccess(result)).toBe(false);
    });
  });

  describe('isConversionError', () => {
    it('should return true for failed conversion result', () => {
      const result: ConversionResult = {
        success: false,
        error: {
          code: ErrorCode.TSX_PARSE_ERROR,
          recoverable: false,
          message: 'Invalid TSX',
          stage: 'failed',
          timestamp: Date.now(),
          suggestions: [],
          errorId: 'tsx-parse-error-id',
        },
      };

      expect(isConversionError(result)).toBe(true);
    });

    it('should return false for successful conversion result', () => {
      const result: ConversionResult = {
        success: true,
        pdfBytes: new Uint8Array([1, 2, 3]),
        metadata: {
          title: '',
          creator: '',
          producer: '',
          pageCount: 1,
          fileSize: 1024,
          creationDate: new Date(),
        },
      };

      expect(isConversionError(result)).toBe(false);
    });
  });

  describe('isMessage', () => {
    it('should return true for valid message', () => {
      const msg = {
        type: 'CONVERSION_STARTED',
        payload: { jobId: '123' },
      };

      expect(isMessage(msg)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isMessage(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isMessage(undefined)).toBe(false);
    });

    it('should return false for object without type', () => {
      expect(isMessage({ payload: {} })).toBe(false);
    });

    it('should return false for object without payload', () => {
      expect(isMessage({ type: 'TEST' })).toBe(false);
    });

    it('should return false for primitive values', () => {
      expect(isMessage('string')).toBe(false);
      expect(isMessage(123)).toBe(false);
      expect(isMessage(true)).toBe(false);
    });
  });

  describe('isMessageType', () => {
    it('should return true for matching message type', () => {
      const msg = {
        type: MessageType.CONVERSION_STARTED,
        payload: { jobId: '123' },
      };

      expect(isMessageType(msg, MessageType.CONVERSION_STARTED)).toBe(true);
    });

    it('should return false for non-matching message type', () => {
      const msg = {
        type: MessageType.CONVERSION_STARTED,
        payload: { jobId: '123' },
      };

      expect(isMessageType(msg, MessageType.CONVERSION_COMPLETE)).toBe(false);
    });

    it('should return false for invalid message', () => {
      expect(isMessageType(null, MessageType.CONVERSION_STARTED)).toBe(false);
      expect(isMessageType({ type: 'INVALID' }, MessageType.CONVERSION_STARTED)).toBe(false);
    });
  });

  describe('isUint8Array', () => {
    it('should return true for Uint8Array', () => {
      expect(isUint8Array(new Uint8Array([1, 2, 3]))).toBe(true);
    });

    it('should return false for regular array', () => {
      expect(isUint8Array([1, 2, 3])).toBe(false);
    });

    it('should return false for other types', () => {
      expect(isUint8Array(null)).toBe(false);
      expect(isUint8Array({})).toBe(false);
      expect(isUint8Array('test')).toBe(false);
    });
  });

  describe('isError', () => {
    it('should return true for Error instances', () => {
      expect(isError(new Error('test'))).toBe(true);
      expect(isError(new TypeError('test'))).toBe(true);
    });

    it('should return false for error-like objects', () => {
      expect(isError({ message: 'test' })).toBe(false);
    });

    it('should return false for other types', () => {
      expect(isError(null)).toBe(false);
      expect(isError('error')).toBe(false);
    });
  });

  describe('isConversionErrorObject', () => {
    it('should return true for valid ConversionError', () => {
      const error: ConversionError = {
        code: ErrorCode.TSX_PARSE_ERROR,
        recoverable: false,
        message: 'Invalid TSX',
        stage: 'failed',
        timestamp: Date.now(),
        suggestions: [],
        errorId: 'tsx-parse-error-id',
      };

      expect(isConversionErrorObject(error)).toBe(true);
    });

    it('should return false for objects missing code', () => {
      expect(isConversionErrorObject({ message: 'test', timestamp: 123 })).toBe(false);
    });

    it('should return false for objects missing message', () => {
      expect(isConversionErrorObject({ code: 'TEST', timestamp: 123 })).toBe(false);
    });

    it('should return false for other types', () => {
      expect(isConversionErrorObject(null)).toBe(false);
      expect(isConversionErrorObject(new Error('test'))).toBe(false);
    });
  });

  describe('isNotNull', () => {
    it('should return true for non-null values', () => {
      expect(isNotNull('test')).toBe(true);
      expect(isNotNull(0)).toBe(true);
      expect(isNotNull(false)).toBe(true);
      expect(isNotNull({})).toBe(true);
    });

    it('should return false for null', () => {
      expect(isNotNull(null)).toBe(false);
    });
  });

  describe('isNotUndefined', () => {
    it('should return true for defined values', () => {
      expect(isNotUndefined('test')).toBe(true);
      expect(isNotUndefined(0)).toBe(true);
      expect(isNotUndefined(null)).toBe(true);
      expect(isNotUndefined(false)).toBe(true);
    });

    it('should return false for undefined', () => {
      expect(isNotUndefined(undefined)).toBe(false);
    });
  });

  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined('test')).toBe(true);
      expect(isDefined(0)).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it('should return false for null', () => {
      expect(isDefined(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isDefined(undefined)).toBe(false);
    });
  });
});
