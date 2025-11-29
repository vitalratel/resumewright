/**
 * CV Validator Tests
 *
 * Tests for CV validation functions covering:
 * - CVMetadata validation
 * - CVDocument validation
 * - Parse functions with error handling
 *
 * Coverage target: >85%
 */

import type { CVDocument, CVMetadata } from '@/shared/types/models';
import { describe, expect, it } from 'vitest';
import { parseCVDocument, validateCVDocument, validateCVMetadata } from '../cv';

describe('CV Validators', () => {
  describe('validateCVMetadata', () => {
    it('should validate valid minimal CV metadata', () => {
      const validMetadata: CVMetadata = {
        layoutType: 'single-column',
        estimatedPages: 1,
        componentCount: 5,
        hasContactInfo: true,
        hasClearSections: true,
        fontComplexity: 'simple',
      };

      expect(validateCVMetadata(validMetadata)).toBe(true);
    });

    it('should validate CV metadata with all optional fields', () => {
      const fullMetadata: CVMetadata = {
        name: 'John Doe',
        title: 'Software Engineer',
        email: 'john.doe@example.com',
        phone: '+1-555-0123',
        location: 'San Francisco, CA',
        website: 'https://johndoe.com',
        layoutType: 'two-column',
        estimatedPages: 2,
        componentCount: 10,
        hasContactInfo: true,
        hasClearSections: true,
        fontComplexity: 'moderate',
      };

      expect(validateCVMetadata(fullMetadata)).toBe(true);
    });

    it('should reject metadata with invalid email', () => {
      const invalidMetadata = {
        name: 'John Doe',
        email: 'not-an-email',
        layoutType: 'single-column',
        estimatedPages: 1,
        componentCount: 5,
        hasContactInfo: true,
        hasClearSections: true,
        fontComplexity: 'simple',
      };

      expect(validateCVMetadata(invalidMetadata)).toBe(false);
    });

    it('should reject metadata with invalid website URL', () => {
      const invalidMetadata = {
        name: 'John Doe',
        website: 'not-a-url',
        layoutType: 'single-column',
        estimatedPages: 1,
        componentCount: 5,
        hasContactInfo: true,
        hasClearSections: true,
        fontComplexity: 'simple',
      };

      expect(validateCVMetadata(invalidMetadata)).toBe(false);
    });

    it('should reject metadata with invalid layoutType', () => {
      const invalidMetadata = {
        layoutType: 'invalid-layout',
        estimatedPages: 1,
        componentCount: 5,
        hasContactInfo: true,
        hasClearSections: true,
        fontComplexity: 'simple',
      };

      expect(validateCVMetadata(invalidMetadata)).toBe(false);
    });

    it('should reject metadata with zero estimatedPages', () => {
      const invalidMetadata = {
        layoutType: 'single-column',
        estimatedPages: 0,
        componentCount: 5,
        hasContactInfo: true,
        hasClearSections: true,
        fontComplexity: 'simple',
      };

      expect(validateCVMetadata(invalidMetadata)).toBe(false);
    });

    it('should reject metadata with negative componentCount', () => {
      const invalidMetadata = {
        layoutType: 'single-column',
        estimatedPages: 1,
        componentCount: -1,
        hasContactInfo: true,
        hasClearSections: true,
        fontComplexity: 'simple',
      };

      expect(validateCVMetadata(invalidMetadata)).toBe(false);
    });

    it('should reject metadata with invalid fontComplexity', () => {
      const invalidMetadata = {
        layoutType: 'single-column',
        estimatedPages: 1,
        componentCount: 5,
        hasContactInfo: true,
        hasClearSections: true,
        fontComplexity: 'invalid',
      };

      expect(validateCVMetadata(invalidMetadata)).toBe(false);
    });

    it('should reject non-object metadata', () => {
      expect(validateCVMetadata(null)).toBe(false);
      expect(validateCVMetadata(undefined)).toBe(false);
      expect(validateCVMetadata('string')).toBe(false);
      expect(validateCVMetadata(123)).toBe(false);
      expect(validateCVMetadata([])).toBe(false);
    });
  });

  describe('validateCVDocument', () => {
    const validMetadata: CVMetadata = {
      name: 'John Doe',
      layoutType: 'single-column',
      estimatedPages: 1,
      componentCount: 5,
      hasContactInfo: true,
      hasClearSections: true,
      fontComplexity: 'simple',
    };

    it('should validate valid CV document', () => {
      const validDocument: CVDocument = {
        id: 'cv-123',
        sourceType: 'claude',
        tsx: 'export default function CV() { return <div>CV</div>; }',
        metadata: validMetadata,
        parseTimestamp: Date.now(),
      };

      expect(validateCVDocument(validDocument)).toBe(true);
    });

    it('should validate CV document with manual source', () => {
      const validDocument: CVDocument = {
        id: 'cv-manual-456',
        sourceType: 'manual',
        tsx: 'export default function CV() { return <div>Manual CV</div>; }',
        metadata: validMetadata,
        parseTimestamp: Date.now() - 1000,
      };

      expect(validateCVDocument(validDocument)).toBe(true);
    });

    it('should reject document with empty id', () => {
      const invalidDocument = {
        id: '',
        sourceType: 'claude',
        tsx: 'export default function CV() { return <div>CV</div>; }',
        metadata: validMetadata,
        parseTimestamp: Date.now(),
      };

      expect(validateCVDocument(invalidDocument)).toBe(false);
    });

    it('should reject document with invalid sourceType', () => {
      const invalidDocument = {
        id: 'cv-123',
        sourceType: 'invalid',
        tsx: 'export default function CV() { return <div>CV</div>; }',
        metadata: validMetadata,
        parseTimestamp: Date.now(),
      };

      expect(validateCVDocument(invalidDocument)).toBe(false);
    });

    it('should reject document with empty tsx', () => {
      const invalidDocument = {
        id: 'cv-123',
        sourceType: 'claude',
        tsx: '',
        metadata: validMetadata,
        parseTimestamp: Date.now(),
      };

      expect(validateCVDocument(invalidDocument)).toBe(false);
    });

    it('should reject document with invalid metadata', () => {
      const invalidDocument = {
        id: 'cv-123',
        sourceType: 'claude',
        tsx: 'export default function CV() { return <div>CV</div>; }',
        metadata: { invalid: 'metadata' },
        parseTimestamp: Date.now(),
      };

      expect(validateCVDocument(invalidDocument)).toBe(false);
    });

    it('should reject document with future parseTimestamp', () => {
      const futureTimestamp = Date.now() + 10000;
      const invalidDocument = {
        id: 'cv-123',
        sourceType: 'claude',
        tsx: 'export default function CV() { return <div>CV</div>; }',
        metadata: validMetadata,
        parseTimestamp: futureTimestamp,
      };

      expect(validateCVDocument(invalidDocument)).toBe(false);
    });

    it('should reject document with non-integer parseTimestamp', () => {
      const invalidDocument = {
        id: 'cv-123',
        sourceType: 'claude',
        tsx: 'export default function CV() { return <div>CV</div>; }',
        metadata: validMetadata,
        parseTimestamp: 123.456,
      };

      expect(validateCVDocument(invalidDocument)).toBe(false);
    });

    it('should reject non-object document', () => {
      expect(validateCVDocument(null)).toBe(false);
      expect(validateCVDocument(undefined)).toBe(false);
      expect(validateCVDocument('string')).toBe(false);
      expect(validateCVDocument(123)).toBe(false);
      expect(validateCVDocument([])).toBe(false);
    });
  });

  describe('parseCVDocument', () => {
    const validMetadata: CVMetadata = {
      name: 'John Doe',
      layoutType: 'single-column',
      estimatedPages: 1,
      componentCount: 5,
      hasContactInfo: true,
      hasClearSections: true,
      fontComplexity: 'simple',
    };

    it('should parse valid CV document', () => {
      const validDocument: CVDocument = {
        id: 'cv-123',
        sourceType: 'claude',
        tsx: 'export default function CV() { return <div>CV</div>; }',
        metadata: validMetadata,
        parseTimestamp: Date.now(),
      };

      const parsed = parseCVDocument(validDocument);
      expect(parsed).toEqual(validDocument);
    });

    it('should throw error for invalid document', () => {
      const invalidDocument = {
        id: '',
        sourceType: 'claude',
        tsx: 'export default function CV() { return <div>CV</div>; }',
        metadata: validMetadata,
        parseTimestamp: Date.now(),
      };

      expect(() => parseCVDocument(invalidDocument)).toThrow();
    });

    it('should throw error for null document', () => {
      expect(() => parseCVDocument(null)).toThrow();
    });

    it('should throw error for undefined document', () => {
      expect(() => parseCVDocument(undefined)).toThrow();
    });

    it('should throw error for non-object document', () => {
      expect(() => parseCVDocument('string')).toThrow();
      expect(() => parseCVDocument(123)).toThrow();
      expect(() => parseCVDocument([])).toThrow();
    });
  });
});
