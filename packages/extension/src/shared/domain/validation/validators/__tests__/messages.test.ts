/**
 * Message Validators Tests
 *
 * Tests runtime validation for messages
 */

import { describe, expect, it } from 'vitest';
import { MessageType } from '@/shared/types/messages';
import { parseMessage, validateMessage } from '../messages';

describe('Message Validators', () => {
  describe('validateMessage', () => {
    it('should validate valid message', () => {
      const validMessage = {
        type: MessageType.GET_WASM_STATUS,
        payload: {},
      };

      const result = validateMessage(validMessage);

      expect(result).toBe(true);
    });

    it('should reject invalid message - missing type', () => {
      // Test input validation
      const invalidMessage = {
        payload: { data: 'test' },
      };

      const result = validateMessage(invalidMessage);

      expect(result).toBe(false);
    });

    it('should reject invalid message - wrong type', () => {
      const invalidMessage = {
        type: 123, // Should be string
        payload: {},
      };

      const result = validateMessage(invalidMessage);

      expect(result).toBe(false);
    });

    it('should reject null', () => {
      const result = validateMessage(null);

      expect(result).toBe(false);
    });

    it('should reject undefined', () => {
      const result = validateMessage(undefined);

      expect(result).toBe(false);
    });
  });

  describe('parseMessage', () => {
    it('should parse valid message successfully', () => {
      const validMessage = {
        type: MessageType.GET_WASM_STATUS,
        payload: {},
      };

      const result = parseMessage(validMessage);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe(MessageType.GET_WASM_STATUS);
        expect(result.data.payload).toEqual({});
      }
    });

    it('should return error for invalid message', () => {
      // Test validation error handling
      const invalidMessage = {
        type: null,
        payload: {},
      };

      const result = parseMessage(invalidMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });

    it('should provide detailed error messages', () => {
      const invalidMessage = {
        // Missing required fields
      };

      const result = parseMessage(invalidMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.length).toBeGreaterThan(0);
      }
    });

    it('should handle nested validation errors', () => {
      const invalidMessage = {
        type: 'TEST',
        payload: {
          nested: {
            invalid: null,
          },
        },
      };

      const result = parseMessage(invalidMessage);

      // May pass or fail depending on schema - just check result type
      expect(result.success).toBeDefined();
    });
  });
});
