/**
 * Message Validation Tests
 * Tests for message schema validation functions
 */

import type { FontWeight } from "@/shared/domain/fonts/models/Font";
import { describe, expect, it } from 'vitest';
import { MessageType } from '@/shared/types/messages';
import { parseMessage, validateMessage } from '../messages';

describe('Message Validation', () => {
  describe('validateMessage', () => {
    it('should validate POPUP_OPENED message', () => {
      const validMessage = {
        type: MessageType.POPUP_OPENED,
        payload: { requestProgressUpdate: true },
      };

      expect(validateMessage(validMessage)).toBe(true);
    });

    it('should validate CONVERSION_REQUEST message', () => {
      const validMessage = {
        type: MessageType.CONVERSION_REQUEST,
        payload: { tsx: 'const CV = () => <div>Test</div>', fileName: 'test.pdf' },
      };

      expect(validateMessage(validMessage)).toBe(true);
    });

    it('should validate CONVERSION_STARTED message', () => {
      const validMessage = {
        type: MessageType.CONVERSION_STARTED,
        payload: { jobId: 'job-123', estimatedDuration: 5000 },
      };

      expect(validateMessage(validMessage)).toBe(true);
    });

    it('should reject invalid message type', () => {
      // Test validation at line 173
      const invalidMessage = {
        type: 'INVALID_TYPE',
        payload: {},
      };

      expect(validateMessage(invalidMessage)).toBe(false);
    });

    it('should reject message with missing required fields', () => {
      // Test validation at line 173
      const invalidMessage = {
        type: MessageType.CONVERSION_STARTED,
        payload: { jobId: 'job-123' }, // missing estimatedDuration
      };

      expect(validateMessage(invalidMessage)).toBe(false);
    });

    it('should reject message with wrong payload type', () => {
      // Test validation at line 173
      const invalidMessage = {
        type: MessageType.POPUP_OPENED,
        payload: { requestProgressUpdate: 'not-a-boolean' },
      };

      expect(validateMessage(invalidMessage)).toBe(false);
    });

    it('should reject non-object input', () => {
      // Test validation at line 173
      expect(validateMessage(null)).toBe(false);
      expect(validateMessage(undefined)).toBe(false);
      expect(validateMessage('string')).toBe(false);
      expect(validateMessage(42)).toBe(false);
    });
  });

  describe('parseMessage', () => {
    it('should parse valid CONVERSION_COMPLETE message', () => {
      const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
      const validMessage = {
        type: MessageType.CONVERSION_COMPLETE,
        payload: {
          jobId: 'job-123',
          filename: 'resume.pdf',
          fileSize: 1024,
          duration: 3000,
          pdfBytes,
        },
      };

      const result = parseMessage(validMessage);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe(MessageType.CONVERSION_COMPLETE);
        expect(result.data.payload).toMatchObject({
          jobId: 'job-123',
          filename: 'resume.pdf',
          fileSize: 1024,
          duration: 3000,
        });
      }
    });

    it('should parse valid CONVERSION_ERROR message', () => {
      const validMessage = {
        type: MessageType.CONVERSION_ERROR,
        payload: {
          jobId: 'job-123',
          error: {
            stage: 'parsing',
            code: 'TSX_PARSE_ERROR',
            message: 'Failed to parse TSX',
            recoverable: true,
            suggestions: ['Check TSX syntax', 'Verify component structure'],
          },
        },
      };

      const result = parseMessage(validMessage);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe(MessageType.CONVERSION_ERROR);
      }
    });

    it('should return error for invalid message type', () => {
      // Test validation at line 181
      const invalidMessage = {
        type: 'UNKNOWN_TYPE',
        payload: {},
      };

      const result = parseMessage(invalidMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('type');
      }
    });

    it('should return error for missing required fields', () => {
      // Test validation at line 181
      const invalidMessage = {
        type: MessageType.CONVERSION_STARTED,
        payload: {}, // missing jobId and estimatedDuration
      };

      const result = parseMessage(invalidMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }
    });

    it('should return error for invalid payload types', () => {
      // Test validation at line 181
      const invalidMessage = {
        type: MessageType.CONVERSION_COMPLETE,
        payload: {
          jobId: 'job-123',
          fileSize: '1024', // should be number
          duration: 3000,
          pdfBytes: new Uint8Array([]),
        },
      };

      const result = parseMessage(invalidMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
        expect(result.error.length).toBeGreaterThan(0);
      }
    });

    it('should return error for non-object input', () => {
      // Test validation at line 181
      const result1 = parseMessage(null);
      expect(result1.success).toBe(false);

      const result2 = parseMessage('not an object');
      expect(result2.success).toBe(false);

      const result3 = parseMessage(42);
      expect(result3.success).toBe(false);
    });

    it('should validate FETCH_GOOGLE_FONT with optional fields', () => {
      const messageWithOptionals = {
        type: MessageType.FETCH_GOOGLE_FONT,
        payload: {
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'italic',
        },
      };

      const result = parseMessage(messageWithOptionals);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.payload).toMatchObject({
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'italic',
        });
      }
    });

    it('should validate GET_SETTINGS with empty payload', () => {
      const validMessage = {
        type: MessageType.GET_SETTINGS,
        payload: {},
      };

      const result = parseMessage(validMessage);

      expect(result.success).toBe(true);
    });

    it('should validate UPDATE_SETTINGS with any record', () => {
      const validMessage = {
        type: MessageType.UPDATE_SETTINGS,
        payload: {
          settings: {
            theme: 'dark',
            autoDetectCV: true,
            telemetryEnabled: false,
          },
        },
      };

      const result = parseMessage(validMessage);

      expect(result.success).toBe(true);
    });
  });
});
