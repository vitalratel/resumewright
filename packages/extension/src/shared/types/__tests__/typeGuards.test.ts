/**
 * Type Guard Tests
 *
 * Tests for runtime type narrowing utilities.
 */

import type { ConversionResult, ConversionStatus } from '../models';
import { describe, expect, it } from 'vitest';
import {
  isConversionCancelled,
  isConversionComplete,
  isConversionCompleteMessage,
  isConversionError,
  isConversionErrorMessage,
  isConversionFailed,
  isConversionInProgress,
  isConversionProgressMessage,
  isConversionRequestMessage,
  isConversionSuccess,
  isConversionTerminal,
} from '../../utils/typeGuards';
import { ErrorCode } from '../errors/codes';
import { MessageType } from '../messages';

describe('Conversion Status Type Guards', () => {
  describe('isConversionInProgress', () => {
    it('returns true for in-progress statuses', () => {
      const inProgressStatuses: ConversionStatus[] = [
        'queued',
        'parsing',
        'extracting-metadata',
        'rendering',
        'laying-out',
        'optimizing',
        'generating-pdf',
      ];
      inProgressStatuses.forEach((status) => {
        expect(isConversionInProgress(status)).toBe(true);
      });
    });

    it('returns false for terminal statuses', () => {
      const terminalStatuses: ConversionStatus[] = ['completed', 'failed', 'cancelled'];
      terminalStatuses.forEach((status) => {
        expect(isConversionInProgress(status)).toBe(false);
      });
    });
  });

  describe('isConversionComplete', () => {
    it('returns true only for completed status', () => {
      expect(isConversionComplete('completed')).toBe(true);
    });

    it('returns false for non-completed statuses', () => {
      const nonCompleted: ConversionStatus[] = [
        'queued',
        'parsing',
        'failed',
        'cancelled',
      ];
      nonCompleted.forEach((status) => {
        expect(isConversionComplete(status)).toBe(false);
      });
    });
  });

  describe('isConversionFailed', () => {
    it('returns true only for failed status', () => {
      expect(isConversionFailed('failed')).toBe(true);
    });

    it('returns false for non-failed statuses', () => {
      const nonFailed: ConversionStatus[] = [
        'queued',
        'parsing',
        'completed',
        'cancelled',
      ];
      nonFailed.forEach((status) => {
        expect(isConversionFailed(status)).toBe(false);
      });
    });
  });

  describe('isConversionCancelled', () => {
    it('returns true only for cancelled status', () => {
      expect(isConversionCancelled('cancelled')).toBe(true);
    });

    it('returns false for non-cancelled statuses', () => {
      const nonCancelled: ConversionStatus[] = [
        'queued',
        'parsing',
        'completed',
        'failed',
      ];
      nonCancelled.forEach((status) => {
        expect(isConversionCancelled(status)).toBe(false);
      });
    });
  });

  describe('isConversionTerminal', () => {
    it('returns true for terminal statuses', () => {
      const terminalStatuses: ConversionStatus[] = ['completed', 'failed', 'cancelled'];
      terminalStatuses.forEach((status) => {
        expect(isConversionTerminal(status)).toBe(true);
      });
    });

    it('returns false for in-progress statuses', () => {
      const inProgressStatuses: ConversionStatus[] = [
        'queued',
        'parsing',
        'rendering',
      ];
      inProgressStatuses.forEach((status) => {
        expect(isConversionTerminal(status)).toBe(false);
      });
    });
  });
});

describe('Conversion Result Type Guards', () => {
  describe('isConversionSuccess', () => {
    it('identifies successful conversion result', () => {
      const successResult: ConversionResult = {
        success: true,
        pdfBytes: new Uint8Array([1, 2, 3]),
        metadata: {
          title: 'Test Resume',
          creator: 'ResumeWright',
          producer: 'printpdf',
          creationDate: new Date(),
          pageCount: 1,
          fileSize: 1000,
        },
      };
      expect(isConversionSuccess(successResult)).toBe(true);
    });

    it('identifies failed conversion result', () => {
      const errorResult: ConversionResult = {
        success: false,
        error: {
          stage: 'parsing',
          code: ErrorCode.TSX_PARSE_ERROR,
          message: 'Failed to parse TSX',
          recoverable: true,
          suggestions: ['Try again'],
          timestamp: Date.now(),
          errorId: 'test-error-1',
        },
      };
      expect(isConversionSuccess(errorResult)).toBe(false);
    });
  });

  describe('isConversionError', () => {
    it('identifies failed conversion result', () => {
      const errorResult: ConversionResult = {
        success: false,
        error: {
          stage: 'parsing',
          code: ErrorCode.TSX_PARSE_ERROR,
          message: 'Failed to parse TSX',
          recoverable: true,
          suggestions: ['Try again'],
          timestamp: Date.now(),
          errorId: 'test-error-2',
        },
      };
      expect(isConversionError(errorResult)).toBe(true);
    });

    it('identifies successful conversion result', () => {
      const successResult: ConversionResult = {
        success: true,
        pdfBytes: new Uint8Array([1, 2, 3]),
        metadata: {
          title: 'Test Resume',
          creator: 'ResumeWright',
          producer: 'printpdf',
          creationDate: new Date(),
          pageCount: 1,
          fileSize: 1000,
        },
      };
      expect(isConversionError(successResult)).toBe(false);
    });
  });

  describe('Type narrowing behavior', () => {
    it('narrows type correctly for success result', () => {
      const result: ConversionResult = {
        success: true,
        pdfBytes: new Uint8Array([1, 2, 3]),
        metadata: {
          title: 'Test Resume',
          creator: 'ResumeWright',
          producer: 'printpdf',
          creationDate: new Date(),
          pageCount: 1,
          fileSize: 1000,
        },
      };

      if (isConversionSuccess(result)) {
        // TypeScript should know result has pdfBytes and metadata
        expect(result.pdfBytes).toBeInstanceOf(Uint8Array);
        expect(result.metadata.title).toBe('Test Resume');
      }
      else {
        // Should not reach here
        expect(true).toBe(false);
      }
    });

    it('narrows type correctly for error result', () => {
      const result: ConversionResult = {
        success: false,
        error: {
          stage: 'parsing',
          code: ErrorCode.TSX_PARSE_ERROR,
          message: 'Failed to parse TSX',
          recoverable: true,
          suggestions: ['Try again'],
          timestamp: Date.now(),
          errorId: 'test-error-3',
        },
      };

      if (isConversionError(result)) {
        // TypeScript should know result has error
        expect(result.error.code).toBe(ErrorCode.TSX_PARSE_ERROR);
        expect(result.error.message).toBe('Failed to parse TSX');
      }
      else {
        // Should not reach here
        expect(true).toBe(false);
      }
    });
  });
});

describe('Message Type Guards', () => {
  describe('isConversionRequestMessage', () => {
    it('identifies CONVERSION_REQUEST messages', () => {
      const requestMessage = {
        type: MessageType.CONVERSION_REQUEST,
        payload: {
          config: {
            pageSize: 'Letter' as const,
            margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
            fontSize: 12,
            fontFamily: 'Arial',
            compress: false,
          },
        },
      };
      expect(isConversionRequestMessage(requestMessage)).toBe(true);
    });

    it('rejects non-CONVERSION_REQUEST messages', () => {
      const otherMessage = {
        type: MessageType.CONVERSION_PROGRESS,
        payload: {},
      };
      expect(isConversionRequestMessage(otherMessage)).toBe(false);
    });
  });

  describe('isConversionProgressMessage', () => {
    it('identifies CONVERSION_PROGRESS messages', () => {
      const progressMessage = {
        type: MessageType.CONVERSION_PROGRESS,
        payload: {
          jobId: 'job-123',
          progress: {
            stage: 'parsing' as const,
            percentage: 50,
            currentOperation: 'Parsing TSX...',
          },
        },
      };
      expect(isConversionProgressMessage(progressMessage)).toBe(true);
    });

    it('rejects non-CONVERSION_PROGRESS messages', () => {
      const otherMessage = {
        type: MessageType.CONVERSION_REQUEST,
        payload: {},
      };
      expect(isConversionProgressMessage(otherMessage)).toBe(false);
    });
  });

  describe('isConversionCompleteMessage', () => {
    it('identifies CONVERSION_COMPLETE messages', () => {
      const completeMessage = {
        type: MessageType.CONVERSION_COMPLETE,
        payload: {
          jobId: 'job-123',
          filename: 'resume.pdf',
          fileSize: 50000,
          duration: 5000,
        },
      };
      expect(isConversionCompleteMessage(completeMessage)).toBe(true);
    });

    it('rejects non-CONVERSION_COMPLETE messages', () => {
      const otherMessage = {
        type: MessageType.CONVERSION_REQUEST,
        payload: {},
      };
      expect(isConversionCompleteMessage(otherMessage)).toBe(false);
    });
  });

  describe('isConversionErrorMessage', () => {
    it('identifies CONVERSION_ERROR messages', () => {
      const errorMessage = {
        type: MessageType.CONVERSION_ERROR,
        payload: {
          jobId: 'job-123',
          error: {
            stage: 'parsing' as const,
            code: ErrorCode.TSX_PARSE_ERROR,
            message: 'Failed to parse TSX',
            recoverable: true,
            suggestions: ['Try again'],
            timestamp: Date.now(),
            errorId: 'test-error-4',
          },
        },
      };
      expect(isConversionErrorMessage(errorMessage)).toBe(true);
    });

    it('rejects non-CONVERSION_ERROR messages', () => {
      const otherMessage = {
        type: MessageType.CONVERSION_REQUEST,
        payload: {},
      };
      expect(isConversionErrorMessage(otherMessage)).toBe(false);
    });
  });
});
