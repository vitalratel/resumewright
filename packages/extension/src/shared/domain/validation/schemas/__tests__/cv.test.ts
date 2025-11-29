/**
 * CV Validation Schema Tests
 *
 * Tests for Valibot schemas and validation functions for CV-related types.
 *
 * Coverage areas:
 * - CVMetadata validation (email, URL, enums, numbers)
 * - CVDocument validation (structure, timestamps, custom checks)
 * - Parse functions with error handling
 * - Edge cases and boundary values
 *
 * Coverage target: >85%
 */

import type { CVDocument, CVMetadata } from '@/shared/types/models';
import { describe, expect, it } from 'vitest';
import { safeParse } from '../../valibot';
import {
  CVDocumentSchema,
  CVMetadataSchema,
  parseCVDocument,
  validateCVDocument,
  validateCVMetadata,
} from '../cv';

describe('CVMetadata Schema', () => {
  describe('Valid Metadata', () => {
    it('should validate complete CVMetadata', () => {
      const validMetadata: CVMetadata = {
        name: 'John Doe',
        title: 'Software Engineer',
        email: 'john@example.com',
        phone: '+1-555-0123',
        location: 'San Francisco, CA',
        website: 'https://johndoe.com',
        layoutType: 'single-column',
        estimatedPages: 2,
        componentCount: 15,
        hasContactInfo: true,
        hasClearSections: true,
        fontComplexity: 'simple',
      };

      expect(validateCVMetadata(validMetadata)).toBe(true);
      const result = safeParse(CVMetadataSchema, validMetadata);
      expect(result.success).toBe(true);
    });

    it('should validate minimal CVMetadata (only required fields)', () => {
      const minimalMetadata = {
        layoutType: 'single-column',
        estimatedPages: 1,
        componentCount: 5,
        hasContactInfo: false,
        hasClearSections: true,
        fontComplexity: 'simple',
      };

      expect(validateCVMetadata(minimalMetadata)).toBe(true);
    });

    it.each([
      ['single-column', 'single-column'],
      ['two-column', 'two-column'],
      ['academic', 'academic'],
      ['portfolio', 'portfolio'],
      ['custom', 'custom'],
    ])('should accept layoutType: %s', (_label, layoutType) => {
      const metadata = {
        layoutType,
        estimatedPages: 1,
        componentCount: 0,
        hasContactInfo: false,
        hasClearSections: false,
        fontComplexity: 'simple',
      };

      expect(validateCVMetadata(metadata)).toBe(true);
    });

    it.each([
      ['simple', 'simple'],
      ['moderate', 'moderate'],
      ['complex', 'complex'],
    ])('should accept fontComplexity: %s', (_label, fontComplexity) => {
      const metadata = {
        layoutType: 'single-column',
        estimatedPages: 1,
        componentCount: 0,
        hasContactInfo: false,
        hasClearSections: false,
        fontComplexity,
      };

      expect(validateCVMetadata(metadata)).toBe(true);
    });
  });

  describe('Email Validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'john.doe@company.co.uk',
        'contact+tag@domain.org',
        'name_123@sub.domain.com',
      ];

      validEmails.forEach((email) => {
        const metadata = {
          email,
          layoutType: 'single-column' as const,
          estimatedPages: 1,
          componentCount: 0,
          hasContactInfo: true,
          hasClearSections: false,
          fontComplexity: 'simple' as const,
        };

        expect(validateCVMetadata(metadata)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user @example.com',
        'user@.com',
      ];

      invalidEmails.forEach((email) => {
        const metadata = {
          email,
          layoutType: 'single-column' as const,
          estimatedPages: 1,
          componentCount: 0,
          hasContactInfo: true,
          hasClearSections: false,
          fontComplexity: 'simple' as const,
        };

        expect(validateCVMetadata(metadata)).toBe(false);
      });
    });

    it('should allow missing email (optional field)', () => {
      const metadata = {
        layoutType: 'single-column' as const,
        estimatedPages: 1,
        componentCount: 0,
        hasContactInfo: false,
        hasClearSections: false,
        fontComplexity: 'simple' as const,
      };

      expect(validateCVMetadata(metadata)).toBe(true);
    });
  });

  describe('Website URL Validation', () => {
    it('should accept valid URLs', () => {
      const validURLs = [
        'https://example.com',
        'http://johndoe.com',
        'https://www.portfolio.io/projects',
        'https://github.com/username',
      ];

      validURLs.forEach((website) => {
        const metadata = {
          website,
          layoutType: 'single-column' as const,
          estimatedPages: 1,
          componentCount: 0,
          hasContactInfo: true,
          hasClearSections: false,
          fontComplexity: 'simple' as const,
        };

        expect(validateCVMetadata(metadata)).toBe(true);
      });
    });

    it('should reject invalid URL - not a URL', () => {
      const metadata = {
        website: 'not-a-url',
        layoutType: 'single-column' as const,
        estimatedPages: 1,
        componentCount: 0,
        hasContactInfo: true,
        hasClearSections: false,
        fontComplexity: 'simple' as const,
      };

      expect(validateCVMetadata(metadata)).toBe(false);
    });

    it('should reject invalid URL - missing protocol', () => {
      const metadata = {
        website: 'example.com',
        layoutType: 'single-column' as const,
        estimatedPages: 1,
        componentCount: 0,
        hasContactInfo: true,
        hasClearSections: false,
        fontComplexity: 'simple' as const,
      };

      expect(validateCVMetadata(metadata)).toBe(false);
    });

    it('should allow missing website (optional field)', () => {
      const metadata = {
        layoutType: 'single-column' as const,
        estimatedPages: 1,
        componentCount: 0,
        hasContactInfo: false,
        hasClearSections: false,
        fontComplexity: 'simple' as const,
      };

      expect(validateCVMetadata(metadata)).toBe(true);
    });
  });

  describe('Numeric Field Validation', () => {
    it('should accept valid estimatedPages values', () => {
      [1, 2, 5, 10, 100].forEach((estimatedPages) => {
        const metadata = {
          layoutType: 'single-column' as const,
          estimatedPages,
          componentCount: 0,
          hasContactInfo: false,
          hasClearSections: false,
          fontComplexity: 'simple' as const,
        };

        expect(validateCVMetadata(metadata)).toBe(true);
      });
    });

    it('should reject non-positive estimatedPages', () => {
      [0, -1, -10].forEach((estimatedPages) => {
        const metadata = {
          layoutType: 'single-column' as const,
          estimatedPages,
          componentCount: 0,
          hasContactInfo: false,
          hasClearSections: false,
          fontComplexity: 'simple' as const,
        };

        expect(validateCVMetadata(metadata)).toBe(false);
      });
    });

    it('should reject non-integer estimatedPages', () => {
      const metadata = {
        layoutType: 'single-column' as const,
        estimatedPages: 1.5,
        componentCount: 0,
        hasContactInfo: false,
        hasClearSections: false,
        fontComplexity: 'simple' as const,
      };

      expect(validateCVMetadata(metadata)).toBe(false);
    });

    it('should accept valid componentCount values including zero', () => {
      [0, 1, 10, 50, 100].forEach((componentCount) => {
        const metadata = {
          layoutType: 'single-column' as const,
          estimatedPages: 1,
          componentCount,
          hasContactInfo: false,
          hasClearSections: false,
          fontComplexity: 'simple' as const,
        };

        expect(validateCVMetadata(metadata)).toBe(true);
      });
    });

    it('should reject negative componentCount', () => {
      const metadata = {
        layoutType: 'single-column' as const,
        estimatedPages: 1,
        componentCount: -1,
        hasContactInfo: false,
        hasClearSections: false,
        fontComplexity: 'simple' as const,
      };

      expect(validateCVMetadata(metadata)).toBe(false);
    });
  });

  describe('Enum Field Validation', () => {
    it('should reject invalid layoutType', () => {
      const metadata = {
        layoutType: 'invalid-layout',
        estimatedPages: 1,
        componentCount: 0,
        hasContactInfo: false,
        hasClearSections: false,
        fontComplexity: 'simple',
      };

      expect(validateCVMetadata(metadata)).toBe(false);
    });

    it('should reject invalid fontComplexity', () => {
      const metadata = {
        layoutType: 'single-column',
        estimatedPages: 1,
        componentCount: 0,
        hasContactInfo: false,
        hasClearSections: false,
        fontComplexity: 'invalid',
      };

      expect(validateCVMetadata(metadata)).toBe(false);
    });
  });
});

describe('CVDocument Schema', () => {
  const baseTimestamp = Date.now();

  describe('Valid Documents', () => {
    it('should validate complete CVDocument', () => {
      const validDocument: CVDocument = {
        id: 'cv-123',
        sourceType: 'claude',
        tsx: '<div>CV Content</div>',
        metadata: {
          name: 'John Doe',
          layoutType: 'single-column',
          estimatedPages: 1,
          componentCount: 10,
          hasContactInfo: true,
          hasClearSections: true,
          fontComplexity: 'simple',
        },
        parseTimestamp: baseTimestamp - 1000,
      };

      expect(validateCVDocument(validDocument)).toBe(true);
      const result = safeParse(CVDocumentSchema, validDocument);
      expect(result.success).toBe(true);
    });

    it.each([
      ['claude', 'claude'],
      ['manual', 'manual'],
    ])('should accept sourceType: %s', (_label, sourceType) => {
      const document = {
        id: 'cv-123',
        sourceType,
        tsx: '<div>Content</div>',
        metadata: {
          layoutType: 'single-column' as const,
          estimatedPages: 1,
          componentCount: 0,
          hasContactInfo: false,
          hasClearSections: false,
          fontComplexity: 'simple' as const,
        },
        parseTimestamp: baseTimestamp - 1000,
      };

      expect(validateCVDocument(document)).toBe(true);
    });
  });

  describe('Field Validation', () => {
    it('should reject empty CV ID', () => {
      const document = {
        id: '',
        sourceType: 'claude' as const,
        tsx: '<div>Content</div>',
        metadata: {
          layoutType: 'single-column' as const,
          estimatedPages: 1,
          componentCount: 0,
          hasContactInfo: false,
          hasClearSections: false,
          fontComplexity: 'simple' as const,
        },
        parseTimestamp: baseTimestamp - 1000,
      };

      expect(validateCVDocument(document)).toBe(false);
    });

    it('should reject empty TSX', () => {
      const document = {
        id: 'cv-123',
        sourceType: 'claude' as const,
        tsx: '',
        metadata: {
          layoutType: 'single-column' as const,
          estimatedPages: 1,
          componentCount: 0,
          hasContactInfo: false,
          hasClearSections: false,
          fontComplexity: 'simple' as const,
        },
        parseTimestamp: baseTimestamp - 1000,
      };

      expect(validateCVDocument(document)).toBe(false);
    });

    it('should reject invalid sourceType', () => {
      const document = {
        id: 'cv-123',
        sourceType: 'invalid',
        tsx: '<div>Content</div>',
        metadata: {
          layoutType: 'single-column' as const,
          estimatedPages: 1,
          componentCount: 0,
          hasContactInfo: false,
          hasClearSections: false,
          fontComplexity: 'simple' as const,
        },
        parseTimestamp: baseTimestamp - 1000,
      };

      expect(validateCVDocument(document)).toBe(false);
    });
  });

  describe('Timestamp Validation', () => {
    it('should accept past timestamps', () => {
      const document = {
        id: 'cv-123',
        sourceType: 'claude' as const,
        tsx: '<div>Content</div>',
        metadata: {
          layoutType: 'single-column' as const,
          estimatedPages: 1,
          componentCount: 0,
          hasContactInfo: false,
          hasClearSections: false,
          fontComplexity: 'simple' as const,
        },
        parseTimestamp: baseTimestamp - 10000,
      };

      expect(validateCVDocument(document)).toBe(true);
    });

    it('should accept current timestamp', () => {
      const document = {
        id: 'cv-123',
        sourceType: 'claude' as const,
        tsx: '<div>Content</div>',
        metadata: {
          layoutType: 'single-column' as const,
          estimatedPages: 1,
          componentCount: 0,
          hasContactInfo: false,
          hasClearSections: false,
          fontComplexity: 'simple' as const,
        },
        parseTimestamp: Date.now(),
      };

      expect(validateCVDocument(document)).toBe(true);
    });

    it('should reject future timestamps', () => {
      const document = {
        id: 'cv-123',
        sourceType: 'claude' as const,
        tsx: '<div>Content</div>',
        metadata: {
          layoutType: 'single-column' as const,
          estimatedPages: 1,
          componentCount: 0,
          hasContactInfo: false,
          hasClearSections: false,
          fontComplexity: 'simple' as const,
        },
        parseTimestamp: Date.now() + 10000,
      };

      expect(validateCVDocument(document)).toBe(false);
    });

    it('should reject non-positive parseTimestamp', () => {
      const document = {
        id: 'cv-123',
        sourceType: 'claude' as const,
        tsx: '<div>Content</div>',
        metadata: {
          layoutType: 'single-column' as const,
          estimatedPages: 1,
          componentCount: 0,
          hasContactInfo: false,
          hasClearSections: false,
          fontComplexity: 'simple' as const,
        },
        parseTimestamp: 0,
      };

      expect(validateCVDocument(document)).toBe(false);
    });

    it('should reject non-integer parseTimestamp', () => {
      const document = {
        id: 'cv-123',
        sourceType: 'claude' as const,
        tsx: '<div>Content</div>',
        metadata: {
          layoutType: 'single-column' as const,
          estimatedPages: 1,
          componentCount: 0,
          hasContactInfo: false,
          hasClearSections: false,
          fontComplexity: 'simple' as const,
        },
        parseTimestamp: 1234.56,
      };

      expect(validateCVDocument(document)).toBe(false);
    });
  });

  describe('Nested Metadata Validation', () => {
    it('should reject document with invalid metadata email', () => {
      const document = {
        id: 'cv-123',
        sourceType: 'claude' as const,
        tsx: '<div>Content</div>',
        metadata: {
          email: 'invalid-email',
          layoutType: 'single-column' as const,
          estimatedPages: 1,
          componentCount: 0,
          hasContactInfo: true,
          hasClearSections: false,
          fontComplexity: 'simple' as const,
        },
        parseTimestamp: baseTimestamp - 1000,
      };

      expect(validateCVDocument(document)).toBe(false);
    });

    it('should reject document with invalid metadata layoutType', () => {
      const document = {
        id: 'cv-123',
        sourceType: 'claude' as const,
        tsx: '<div>Content</div>',
        metadata: {
          layoutType: 'invalid',
          estimatedPages: 1,
          componentCount: 0,
          hasContactInfo: false,
          hasClearSections: false,
          fontComplexity: 'simple',
        },
        parseTimestamp: baseTimestamp - 1000,
      };

      expect(validateCVDocument(document)).toBe(false);
    });
  });
});

describe('parseCVDocument', () => {
  const baseTimestamp = Date.now();

  it('should parse valid CVDocument', () => {
    const validData = {
      id: 'cv-123',
      sourceType: 'claude',
      tsx: '<div>Content</div>',
      metadata: {
        layoutType: 'single-column',
        estimatedPages: 1,
        componentCount: 5,
        hasContactInfo: true,
        hasClearSections: true,
        fontComplexity: 'simple',
      },
      parseTimestamp: baseTimestamp - 1000,
    };

    const result = parseCVDocument(validData);

    expect(result).toEqual(validData);
    expect(result.id).toBe('cv-123');
    expect(result.sourceType).toBe('claude');
  });

  it('should throw on invalid data', () => {
    const invalidData = {
      id: '',
      sourceType: 'claude',
      tsx: '<div>Content</div>',
      metadata: {
        layoutType: 'single-column',
        estimatedPages: 1,
        componentCount: 0,
        hasContactInfo: false,
        hasClearSections: false,
        fontComplexity: 'simple',
      },
      parseTimestamp: baseTimestamp - 1000,
    };

    expect(() => parseCVDocument(invalidData)).toThrow();
  });

  it('should throw on future timestamp', () => {
    const invalidData = {
      id: 'cv-123',
      sourceType: 'claude',
      tsx: '<div>Content</div>',
      metadata: {
        layoutType: 'single-column',
        estimatedPages: 1,
        componentCount: 0,
        hasContactInfo: false,
        hasClearSections: false,
        fontComplexity: 'simple',
      },
      parseTimestamp: Date.now() + 10000,
    };

    expect(() => parseCVDocument(invalidData)).toThrow();
  });

  it('should throw on invalid metadata', () => {
    const invalidData = {
      id: 'cv-123',
      sourceType: 'claude',
      tsx: '<div>Content</div>',
      metadata: {
        email: 'invalid-email',
        layoutType: 'single-column',
        estimatedPages: 1,
        componentCount: 0,
        hasContactInfo: true,
        hasClearSections: false,
        fontComplexity: 'simple',
      },
      parseTimestamp: baseTimestamp - 1000,
    };

    expect(() => parseCVDocument(invalidData)).toThrow();
  });
});
