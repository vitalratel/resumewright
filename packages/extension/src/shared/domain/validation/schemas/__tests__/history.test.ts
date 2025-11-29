/**
 * History Validation Schema Tests
 *
 * Tests for Valibot schemas and validation functions for conversion history entries.
 *
 * Coverage areas:
 * - HistoryEntry validation (strings with length limits, timestamps, metadata)
 * - String length validation (minLength, maxLength)
 * - Timestamp future date validation
 * - Nullable metadata handling
 * - Optional cached PDF handling
 *
 * Coverage target: >85%
 */

import type { HistoryEntry } from '@/shared/types/models';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONVERSION_CONFIG } from '@/shared/types/models';
import { safeParse } from '../../valibot';
import {
  HistoryEntrySchema,
  parseHistoryEntry,
  validateHistoryEntry,
} from '../history';

describe('HistoryEntry Schema', () => {
  const baseTimestamp = Date.now();

  const validEntry: HistoryEntry = {
    id: 'history-123',
    cvDocumentId: 'cv-456',
    timestamp: baseTimestamp - 1000,
    filename: 'resume.pdf',
    success: true,
    config: DEFAULT_CONVERSION_CONFIG,
    metadata: {
      title: 'Resume',
      author: 'John Doe',
      subject: 'Software Engineer Resume',
      creator: 'ResumeWright',
      producer: 'ResumeWright PDF Generator',
      creationDate: new Date(baseTimestamp - 1000),
      pageCount: 1,
      fileSize: 50000,
    },
    tsxPreview: '<div>Preview</div>',
    tsxHash: 'abc123hash',
  };

  describe('Valid History Entries', () => {
    it('should validate complete HistoryEntry', () => {
      expect(validateHistoryEntry(validEntry)).toBe(true);
      const result = safeParse(HistoryEntrySchema, validEntry);
      expect(result.success).toBe(true);
    });

    it('should validate with null metadata', () => {
      const entry = { ...validEntry, metadata: null };
      expect(validateHistoryEntry(entry)).toBe(true);
    });

    it('should validate without cachedPdf (optional)', () => {
      const entry = { ...validEntry };
      delete entry.cachedPdf;
      expect(validateHistoryEntry(entry)).toBe(true);
    });

    it('should validate with cachedPdf', () => {
      const entry: HistoryEntry = {
        ...validEntry,
        cachedPdf: new Uint8Array([1, 2, 3, 4]),
      };
      expect(validateHistoryEntry(entry)).toBe(true);
    });

    it('should validate successful conversion', () => {
      const entry = { ...validEntry, success: true };
      expect(validateHistoryEntry(entry)).toBe(true);
    });

    it('should validate failed conversion', () => {
      const entry = { ...validEntry, success: false, metadata: null };
      expect(validateHistoryEntry(entry)).toBe(true);
    });
  });

  describe('ID Field Validation', () => {
    it('should reject empty ID', () => {
      const entry = { ...validEntry, id: '' };
      expect(validateHistoryEntry(entry)).toBe(false);
    });

    it('should reject ID exceeding max length (100 chars)', () => {
      const entry = { ...validEntry, id: 'a'.repeat(101) };
      expect(validateHistoryEntry(entry)).toBe(false);
    });

    it('should accept ID at max length boundary (100 chars)', () => {
      const entry = { ...validEntry, id: 'a'.repeat(100) };
      expect(validateHistoryEntry(entry)).toBe(true);
    });

    it('should reject non-string ID', () => {
      const entry = { ...validEntry, id: 12345 };
      expect(validateHistoryEntry(entry)).toBe(false);
    });
  });

  describe('cvDocumentId Field Validation', () => {
    it('should reject empty cvDocumentId', () => {
      const entry = { ...validEntry, cvDocumentId: '' };
      expect(validateHistoryEntry(entry)).toBe(false);
    });

    it('should reject cvDocumentId exceeding max length (100 chars)', () => {
      const entry = { ...validEntry, cvDocumentId: 'b'.repeat(101) };
      expect(validateHistoryEntry(entry)).toBe(false);
    });

    it('should accept cvDocumentId at max length boundary', () => {
      const entry = { ...validEntry, cvDocumentId: 'b'.repeat(100) };
      expect(validateHistoryEntry(entry)).toBe(true);
    });
  });

  describe('Timestamp Validation', () => {
    it('should accept past timestamps', () => {
      const entry = { ...validEntry, timestamp: baseTimestamp - 10000 };
      expect(validateHistoryEntry(entry)).toBe(true);
    });

    it('should accept current timestamp', () => {
      const entry = { ...validEntry, timestamp: Date.now() };
      expect(validateHistoryEntry(entry)).toBe(true);
    });

    it('should reject future timestamps', () => {
      const entry = { ...validEntry, timestamp: Date.now() + 10000 };
      expect(validateHistoryEntry(entry)).toBe(false);
    });

    it('should reject non-positive timestamp', () => {
      const entry = { ...validEntry, timestamp: 0 };
      expect(validateHistoryEntry(entry)).toBe(false);
    });

    it('should reject negative timestamp', () => {
      const entry = { ...validEntry, timestamp: -1 };
      expect(validateHistoryEntry(entry)).toBe(false);
    });

    it('should reject non-integer timestamp', () => {
      const entry = { ...validEntry, timestamp: 1234.56 };
      expect(validateHistoryEntry(entry)).toBe(false);
    });
  });

  describe('Filename Validation', () => {
    it('should accept valid filenames', () => {
      ['resume.pdf', 'John_Doe_CV.pdf', 'my-resume-2024.pdf'].forEach((filename) => {
        const entry = { ...validEntry, filename };
        expect(validateHistoryEntry(entry)).toBe(true);
      });
    });

    it('should reject empty filename', () => {
      const entry = { ...validEntry, filename: '' };
      expect(validateHistoryEntry(entry)).toBe(false);
    });

    it('should reject filename exceeding max length (255 chars)', () => {
      const entry = { ...validEntry, filename: 'a'.repeat(256) };
      expect(validateHistoryEntry(entry)).toBe(false);
    });

    it('should accept filename at max length boundary', () => {
      const entry = { ...validEntry, filename: 'a'.repeat(255) };
      expect(validateHistoryEntry(entry)).toBe(true);
    });
  });

  describe('TSX Preview Validation', () => {
    it('should accept valid TSX preview strings', () => {
      const previews = [
        '<div>Short preview</div>',
        'const Resume = () => <div>...</div>',
        'export default function CV() { return null; }',
      ];

      previews.forEach((tsxPreview) => {
        const entry = { ...validEntry, tsxPreview };
        expect(validateHistoryEntry(entry)).toBe(true);
      });
    });

    it('should accept empty TSX preview', () => {
      const entry = { ...validEntry, tsxPreview: '' };
      expect(validateHistoryEntry(entry)).toBe(true);
    });

    it('should reject TSX preview exceeding max length (500 chars)', () => {
      const entry = { ...validEntry, tsxPreview: 'x'.repeat(501) };
      expect(validateHistoryEntry(entry)).toBe(false);
    });

    it('should accept TSX preview at max length boundary', () => {
      const entry = { ...validEntry, tsxPreview: 'x'.repeat(500) };
      expect(validateHistoryEntry(entry)).toBe(true);
    });
  });

  describe('TSX Hash Validation', () => {
    it('should accept valid hash strings', () => {
      ['abc123', 'sha256-hash-value', 'a'.repeat(64)].forEach((tsxHash) => {
        const entry = { ...validEntry, tsxHash };
        expect(validateHistoryEntry(entry)).toBe(true);
      });
    });

    it('should reject empty tsxHash', () => {
      const entry = { ...validEntry, tsxHash: '' };
      expect(validateHistoryEntry(entry)).toBe(false);
    });

    it('should reject tsxHash exceeding max length (64 chars)', () => {
      const entry = { ...validEntry, tsxHash: 'h'.repeat(65) };
      expect(validateHistoryEntry(entry)).toBe(false);
    });

    it('should accept tsxHash at max length boundary', () => {
      const entry = { ...validEntry, tsxHash: 'h'.repeat(64) };
      expect(validateHistoryEntry(entry)).toBe(true);
    });
  });

  describe('Success Flag Validation', () => {
    it('should accept true success flag', () => {
      const entry = { ...validEntry, success: true };
      expect(validateHistoryEntry(entry)).toBe(true);
    });

    it('should accept false success flag', () => {
      const entry = { ...validEntry, success: false };
      expect(validateHistoryEntry(entry)).toBe(true);
    });

    it('should reject non-boolean success', () => {
      const entry = { ...validEntry, success: 'true' };
      expect(validateHistoryEntry(entry)).toBe(false);
    });

    it('should reject numeric success', () => {
      const entry = { ...validEntry, success: 1 };
      expect(validateHistoryEntry(entry)).toBe(false);
    });
  });

  describe('Config Validation', () => {
    it('should validate with default config', () => {
      const entry = { ...validEntry, config: DEFAULT_CONVERSION_CONFIG };
      expect(validateHistoryEntry(entry)).toBe(true);
    });

    it('should reject invalid page size in config', () => {
      const entry = {
        ...validEntry,
        config: { ...DEFAULT_CONVERSION_CONFIG, pageSize: 'Invalid' },
      };
      expect(validateHistoryEntry(entry)).toBe(false);
    });

    it('should reject invalid margin in config', () => {
      const entry = {
        ...validEntry,
        config: {
          ...DEFAULT_CONVERSION_CONFIG,
          margin: { ...DEFAULT_CONVERSION_CONFIG.margin, top: -1 },
        },
      };
      expect(validateHistoryEntry(entry)).toBe(false);
    });
  });

  describe('Metadata Validation', () => {
    it('should accept valid metadata', () => {
      const entry = {
        ...validEntry,
        metadata: {
          title: 'My Resume',
          author: 'Jane Doe',
          subject: 'Developer Resume',
          creator: 'ResumeWright',
          producer: 'ResumeWright PDF Generator',
          creationDate: new Date(Date.now() - 1000),
          pageCount: 2,
          fileSize: 75000,
        },
      };
      expect(validateHistoryEntry(entry)).toBe(true);
    });

    it('should accept null metadata', () => {
      const entry = { ...validEntry, metadata: null };
      expect(validateHistoryEntry(entry)).toBe(true);
    });

    it('should reject invalid metadata structure', () => {
      const entry = {
        ...validEntry,
        metadata: { invalid: 'structure' },
      };
      expect(validateHistoryEntry(entry)).toBe(false);
    });
  });

  describe('Cached PDF Validation', () => {
    it('should accept Uint8Array for cachedPdf', () => {
      const entry: HistoryEntry = {
        ...validEntry,
        cachedPdf: new Uint8Array([0x25, 0x50, 0x44, 0x46]), // PDF header
      };
      expect(validateHistoryEntry(entry)).toBe(true);
    });

    it('should accept empty Uint8Array', () => {
      const entry: HistoryEntry = {
        ...validEntry,
        cachedPdf: new Uint8Array([]),
      };
      expect(validateHistoryEntry(entry)).toBe(true);
    });

    it('should accept large Uint8Array', () => {
      const entry: HistoryEntry = {
        ...validEntry,
        cachedPdf: new Uint8Array(1000000), // 1MB
      };
      expect(validateHistoryEntry(entry)).toBe(true);
    });

    it('should reject non-Uint8Array for cachedPdf', () => {
      const entry = {
        ...validEntry,
        cachedPdf: [1, 2, 3, 4],
      };
      expect(validateHistoryEntry(entry)).toBe(false);
    });

    it('should reject string for cachedPdf', () => {
      const entry = {
        ...validEntry,
        cachedPdf: 'not a uint8array',
      };
      expect(validateHistoryEntry(entry)).toBe(false);
    });
  });

  describe('parseHistoryEntry', () => {
    it('should parse valid entry', () => {
      const result = parseHistoryEntry(validEntry);

      expect(result).toEqual(validEntry);
      expect(result.id).toBe('history-123');
      expect(result.success).toBe(true);
    });

    it('should throw on invalid ID', () => {
      const invalidEntry = { ...validEntry, id: '' };
      expect(() => parseHistoryEntry(invalidEntry)).toThrow();
    });

    it('should throw on future timestamp', () => {
      const invalidEntry = { ...validEntry, timestamp: Date.now() + 10000 };
      expect(() => parseHistoryEntry(invalidEntry)).toThrow();
    });

    it('should throw on invalid filename', () => {
      const invalidEntry = { ...validEntry, filename: '' };
      expect(() => parseHistoryEntry(invalidEntry)).toThrow();
    });

    it('should throw on missing required fields', () => {
      const { id, ...incomplete } = validEntry;
      void id; // Acknowledge unused variable
      expect(() => parseHistoryEntry(incomplete)).toThrow();
    });
  });
});
