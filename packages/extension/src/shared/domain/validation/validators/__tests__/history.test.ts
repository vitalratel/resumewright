/**
 * History Validator Tests
 *
 * Tests for history entry validation functions:
 * - validateHistoryEntry (boolean validation)
 * - parseHistoryEntry (parse with detailed errors)
 *
 * Coverage target: >85%
 */

import type { HistoryEntry } from '@/shared/types/models';
import { describe, expect, it } from 'vitest';
import {
  parseHistoryEntry,
  validateHistoryEntry,
} from '../history';

describe('History Validators', () => {
  // Valid history entry fixture
  const validHistoryEntry: HistoryEntry = {
    id: 'history-123',
    cvDocumentId: 'cv-doc-456',
    timestamp: Date.now() - 1000, // 1 second ago
    filename: 'resume.tsx',
    success: true,
    config: {
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      fontSize: 12,
      fontFamily: 'Arial',
      pageSize: 'A4',
      filename: 'resume.pdf',
      compress: true,
      atsOptimization: true,
      includeMetadata: true,
    },
    metadata: {
      title: 'My Resume',
      author: 'John Doe',
      subject: 'Resume',
      keywords: ['resume', 'cv'],
      creator: 'ResumeWright',
      producer: 'ResumeWright PDF Generator',
      creationDate: new Date(Date.now() - 1000),
      modificationDate: new Date(Date.now() - 1000),
      pageCount: 1,
      fileSize: 50000,
    },
    tsxPreview: 'import React from "react"; export default () => <div>Resume</div>',
    tsxHash: 'abc123',
  };

  describe('validateHistoryEntry', () => {
    it('should validate valid history entry', () => {
      expect(validateHistoryEntry(validHistoryEntry)).toBe(true);
    });

    it('should validate history entry without optional fields', () => {
      const minimalEntry: HistoryEntry = {
        id: 'history-456',
        cvDocumentId: 'cv-doc-789',
        timestamp: Date.now() - 1000,
        filename: 'cv.tsx',
        success: false,
        config: {
          margin: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
          fontSize: 11,
          fontFamily: 'Times',
          pageSize: 'Letter',
          filename: 'cv.pdf',
          compress: false,
          atsOptimization: false,
          includeMetadata: false,
        },
        metadata: null,
        tsxPreview: 'code preview',
        tsxHash: 'def456',
      };

      expect(validateHistoryEntry(minimalEntry)).toBe(true);
    });

    it('should reject invalid history entry - missing required fields', () => {
      const invalidEntry = {
        id: 'history-123',
        // Missing cvDocumentId
        timestamp: Date.now(),
        filename: 'resume.tsx',
      };

      expect(validateHistoryEntry(invalidEntry)).toBe(false);
    });

    it('should reject invalid history entry - wrong types', () => {
      const invalidEntry = {
        ...validHistoryEntry,
        timestamp: 'not-a-number', // Should be number
      };

      expect(validateHistoryEntry(invalidEntry)).toBe(false);
    });

    it('should reject invalid history entry - empty ID', () => {
      const invalidEntry = {
        ...validHistoryEntry,
        id: '', // Empty string not allowed
      };

      expect(validateHistoryEntry(invalidEntry)).toBe(false);
    });

    it('should reject invalid history entry - ID too long', () => {
      const invalidEntry = {
        ...validHistoryEntry,
        id: 'a'.repeat(101), // Max 100 characters
      };

      expect(validateHistoryEntry(invalidEntry)).toBe(false);
    });

    it('should reject invalid history entry - future timestamp', () => {
      const invalidEntry = {
        ...validHistoryEntry,
        timestamp: Date.now() + 10000, // Future timestamp
      };

      expect(validateHistoryEntry(invalidEntry)).toBe(false);
    });

    it('should reject invalid history entry - negative timestamp', () => {
      const invalidEntry = {
        ...validHistoryEntry,
        timestamp: -1, // Negative not allowed
      };

      expect(validateHistoryEntry(invalidEntry)).toBe(false);
    });

    it('should reject invalid history entry - invalid success field', () => {
      const invalidEntry = {
        ...validHistoryEntry,
        success: 'true', // Should be boolean
      };

      expect(validateHistoryEntry(invalidEntry)).toBe(false);
    });
  });

  describe('parseHistoryEntry', () => {
    it('should parse valid history entry', () => {
      const result = parseHistoryEntry(validHistoryEntry);
      expect(result).toEqual(validHistoryEntry);
    });

    it('should throw error for invalid history entry', () => {
      const invalidEntry = {
        id: 'history-123',
        // Missing required fields
      };

      expect(() => parseHistoryEntry(invalidEntry)).toThrow();
    });

    it('should throw error with descriptive message for wrong type', () => {
      const invalidEntry = {
        ...validHistoryEntry,
        timestamp: 'invalid', // Wrong type
      };

      expect(() => parseHistoryEntry(invalidEntry)).toThrow(/Timestamp must be a number/);
    });

    it('should throw error for empty ID', () => {
      const invalidEntry = {
        ...validHistoryEntry,
        id: '',
      };

      expect(() => parseHistoryEntry(invalidEntry)).toThrow(/History entry ID cannot be empty/);
    });

    it('should throw error for future timestamp', () => {
      const invalidEntry = {
        ...validHistoryEntry,
        timestamp: Date.now() + 10000,
      };

      expect(() => parseHistoryEntry(invalidEntry)).toThrow(/timestamp cannot be in the future/);
    });
  });
});
