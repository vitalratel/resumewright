/**
 * Unit tests for filename sanitization utility
 *
 * Story 3.3: Automatic Filename Generation from CV Metadata
 */

import { describe, expect } from 'vitest';
import { generateFilename, sanitizeFilename } from '../filenameSanitization';

describe('sanitizeFilename', () => {
  describe('Standard Names', () => {
    it('standard name with space', () => {
      expect(sanitizeFilename('John Doe')).toBe('John_Doe');
    });

    it('single word name', () => {
      expect(sanitizeFilename('John')).toBe('John');
    });

    it('name with multiple spaces', () => {
      expect(sanitizeFilename('John   Michael   Doe')).toBe('John_Michael_Doe');
    });

    it('name with leading/trailing spaces', () => {
      expect(sanitizeFilename('  John Doe  ')).toBe('John_Doe');
    });
  });

  describe('Special Characters', () => {
    it('name with apostrophe', () => {
      expect(sanitizeFilename("John O'Brien")).toBe('John_OBrien');
    });

    it('name with hyphen', () => {
      expect(sanitizeFilename('Mary-Jane Watson')).toBe('Mary-Jane_Watson');
    });

    it('name with ampersand', () => {
      expect(sanitizeFilename('John & Associates')).toBe('John_Associates');
    });

    it('name with period', () => {
      expect(sanitizeFilename('Dr. John Smith Jr.')).toBe('Dr_John_Smith_Jr');
    });

    it('name with comma', () => {
      expect(sanitizeFilename('Smith, John')).toBe('Smith_John');
    });

    it('name with multiple special chars', () => {
      expect(sanitizeFilename("John O'Brien & Associates, Inc.")).toBe(
        'John_OBrien_Associates_Inc',
      );
    });
  });

  describe('Unicode - Latin Accents', () => {
    it('Spanish accents', () => {
      expect(sanitizeFilename('José García')).toBe('Jose_Garcia');
    });

    it('French accents', () => {
      expect(sanitizeFilename('François Lefèvre')).toBe('Francois_Lefevre');
    });

    it('German umlaut', () => {
      expect(sanitizeFilename('Müller')).toBe('Muller');
    });

    it('Portuguese accents', () => {
      expect(sanitizeFilename('João Silva')).toBe('Joao_Silva');
    });

    it('mixed accents', () => {
      expect(sanitizeFilename('Zoë Søren Ñoño')).toBe('Zoe_Soren_Nono');
    });
  });

  describe('Unicode - Non-Latin Scripts', () => {
    it('CJK Chinese characters', () => {
      const result = sanitizeFilename('李明');
      expect(result).toMatch(/^[\w-]+$/); // Should be ASCII
      expect(result.length).toBeGreaterThan(0);
    });

    it('Cyrillic characters', () => {
      const result = sanitizeFilename('Иван Петров');
      expect(result).toMatch(/^[\w-]+$/); // Should be ASCII
      expect(result.length).toBeGreaterThan(0);
    });

    it('Arabic characters', () => {
      const result = sanitizeFilename('محمد');
      expect(result).toMatch(/^[\w-]+$/); // Should be ASCII
      expect(result.length).toBeGreaterThan(0);
    });

    it('Greek characters', () => {
      const result = sanitizeFilename('Αλέξανδρος');
      expect(result).toMatch(/^[\w-]+$/); // Should be ASCII
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Windows Forbidden Characters', () => {
    it('removes less than and greater than', () => {
      expect(sanitizeFilename('Resume <Draft>')).toBe('Resume_Draft');
    });

    it('removes colon', () => {
      expect(sanitizeFilename('Resume: Final')).toBe('Resume_Final');
    });

    it('removes double quotes', () => {
      expect(sanitizeFilename('Resume "Final"')).toBe('Resume_Final');
    });

    it('removes forward slash', () => {
      expect(sanitizeFilename('Resume/Draft')).toBe('ResumeDraft');
    });

    it('removes backslash', () => {
      expect(sanitizeFilename('Resume\\Draft')).toBe('ResumeDraft');
    });

    it('removes pipe', () => {
      expect(sanitizeFilename('Resume | Final')).toBe('Resume_Final');
    });

    it('removes question mark', () => {
      expect(sanitizeFilename('Resume?')).toBe('Resume');
    });

    it('removes asterisk', () => {
      expect(sanitizeFilename('Resume*')).toBe('Resume');
    });

    it('removes all forbidden characters', () => {
      expect(sanitizeFilename('Resume: <Final> "Draft" /V1\\ |Test| ?What? *')).toBe(
        'Resume_Final_Draft_V1_Test_What',
      );
    });
  });

  describe('Edge Cases - Empty/Invalid Input', () => {
    it('empty string returns fallback', () => {
      expect(sanitizeFilename('')).toBe('Resume');
    });

    it('whitespace-only returns fallback', () => {
      expect(sanitizeFilename('   ')).toBe('Resume');
    });

    it('undefined returns fallback', () => {
      expect(sanitizeFilename(undefined)).toBe('Resume');
    });

    it('null returns fallback', () => {
      // Test null input
      expect(sanitizeFilename(null as unknown as string)).toBe('Resume');
    });

    it('only special characters returns fallback', () => {
      expect(sanitizeFilename('@#$%^&*()')).toBe('Resume');
    });

    it('only forbidden characters returns fallback', () => {
      expect(sanitizeFilename('<>:"/\\|?*')).toBe('Resume');
    });

    it('only underscores returns fallback', () => {
      expect(sanitizeFilename('___')).toBe('Resume');
    });

    it('only dots returns fallback', () => {
      expect(sanitizeFilename('...')).toBe('Resume');
    });
  });

  describe('Edge Cases - Length Limits', () => {
    it('very long name (>255 chars) is truncated', () => {
      const longName = 'A'.repeat(300);
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });

    it('truncation preserves word boundaries', () => {
      const longName = `John_Alexander_Christopher_Benjamin_Montgomery_${'A'.repeat(250)}`;
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
      // Should truncate at underscore boundary, not mid-word
      expect(result.endsWith('_Montgomery')).toBe(true);
    });

    it('exactly 255 chars is not truncated', () => {
      const exactName = 'A'.repeat(255);
      const result = sanitizeFilename(exactName);
      expect(result.length).toBe(255);
    });

    it('254 chars is not truncated', () => {
      const exactName = 'A'.repeat(254);
      const result = sanitizeFilename(exactName);
      expect(result.length).toBe(254);
    });
  });

  describe('Edge Cases - Leading/Trailing Characters', () => {
    it('removes leading underscores', () => {
      expect(sanitizeFilename('___John_Doe')).toBe('John_Doe');
    });

    it('removes trailing underscores', () => {
      expect(sanitizeFilename('John_Doe___')).toBe('John_Doe');
    });

    it('removes leading dots', () => {
      expect(sanitizeFilename('...John_Doe')).toBe('John_Doe');
    });

    it('removes trailing dots', () => {
      expect(sanitizeFilename('John_Doe...')).toBe('John_Doe');
    });

    it('collapses multiple underscores', () => {
      expect(sanitizeFilename('John____Doe')).toBe('John_Doe');
    });
  });

  describe('Custom Fallback', () => {
    it('uses custom fallback for empty string', () => {
      expect(sanitizeFilename('', 'CV')).toBe('CV');
    });

    it('uses custom fallback for undefined', () => {
      expect(sanitizeFilename(undefined, 'Document')).toBe('Document');
    });

    it('uses custom fallback for special chars only', () => {
      expect(sanitizeFilename('@#$%', 'Default')).toBe('Default');
    });
  });

  describe('Real-World Examples', () => {
    it('typical professional name', () => {
      expect(sanitizeFilename('John Smith')).toBe('John_Smith');
    });

    it('name with suffix', () => {
      expect(sanitizeFilename('John Smith Jr.')).toBe('John_Smith_Jr');
    });

    it('name with middle initial', () => {
      expect(sanitizeFilename('John A. Smith')).toBe('John_A_Smith');
    });

    it('hyphenated last name', () => {
      expect(sanitizeFilename('Mary Wilson-Jones')).toBe('Mary_Wilson-Jones');
    });

    it('professional title', () => {
      expect(sanitizeFilename('Dr. Jane Doe')).toBe('Dr_Jane_Doe');
    });

    it('international name with accents', () => {
      expect(sanitizeFilename('María José Fernández')).toBe('Maria_Jose_Fernandez');
    });
  });
});

describe('generateFilename', () => {
  describe('Standard Generation', () => {
    it('generates filename with name and date', () => {
      const date = new Date('2025-10-17');
      const result = generateFilename('John Doe', date);
      expect(result).toBe('John_Doe_Resume_2025-10-17.pdf');
    });

    it('generates filename with sanitized name', () => {
      const date = new Date('2025-10-17');
      const result = generateFilename('José García', date);
      expect(result).toBe('Jose_Garcia_Resume_2025-10-17.pdf');
    });

    it('generates filename with special chars removed', () => {
      const date = new Date('2025-10-17');
      const result = generateFilename("John O'Brien & Associates", date);
      expect(result).toBe('John_OBrien_Associates_Resume_2025-10-17.pdf');
    });
  });

  describe('Fallback Behavior', () => {
    it('uses fallback for empty name', () => {
      const date = new Date('2025-10-17');
      const result = generateFilename('', date);
      expect(result).toBe('Resume_2025-10-17.pdf');
    });

    it('uses fallback for undefined name', () => {
      const date = new Date('2025-10-17');
      const result = generateFilename(undefined, date);
      expect(result).toBe('Resume_2025-10-17.pdf');
    });

    it('uses fallback for special chars only', () => {
      const date = new Date('2025-10-17');
      const result = generateFilename('@#$%', date);
      expect(result).toBe('Resume_2025-10-17.pdf');
    });
  });

  describe('Date Formatting', () => {
    it('formats date as YYYY-MM-DD', () => {
      const date = new Date('2025-10-17');
      const result = generateFilename('Test', date);
      expect(result).toMatch(/Test_Resume_2025-10-17\.pdf$/);
    });

    it('pads single-digit month', () => {
      const date = new Date('2025-01-05');
      const result = generateFilename('Test', date);
      expect(result).toBe('Test_Resume_2025-01-05.pdf');
    });

    it('pads single-digit day', () => {
      const date = new Date('2025-10-05');
      const result = generateFilename('Test', date);
      expect(result).toBe('Test_Resume_2025-10-05.pdf');
    });

    it('uses current date when not provided', () => {
      const result = generateFilename('Test');
      expect(result).toMatch(/^Test_Resume_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('handles end of year date', () => {
      const date = new Date('2025-12-31');
      const result = generateFilename('Test', date);
      expect(result).toBe('Test_Resume_2025-12-31.pdf');
    });

    it('handles start of year date', () => {
      const date = new Date('2025-01-01');
      const result = generateFilename('Test', date);
      expect(result).toBe('Test_Resume_2025-01-01.pdf');
    });
  });

  describe('Real-World Examples', () => {
    it('typical use case', () => {
      const date = new Date('2025-10-17');
      const result = generateFilename('John Smith', date);
      expect(result).toBe('John_Smith_Resume_2025-10-17.pdf');
    });

    it('international name', () => {
      const date = new Date('2025-10-17');
      const result = generateFilename('François Dupont', date);
      expect(result).toBe('Francois_Dupont_Resume_2025-10-17.pdf');
    });

    it('name with professional title', () => {
      const date = new Date('2025-10-17');
      const result = generateFilename('Dr. Jane Doe', date);
      expect(result).toBe('Dr_Jane_Doe_Resume_2025-10-17.pdf');
    });

    it('hyphenated name', () => {
      const date = new Date('2025-10-17');
      const result = generateFilename('Mary Wilson-Jones', date);
      expect(result).toBe('Mary_Wilson-Jones_Resume_2025-10-17.pdf');
    });
  });

  describe('Transliteration error handling', () => {
    it('should handle transliteration errors gracefully', () => {
      // Test with characters that might cause transliteration issues
      // The function should fall back to stripping non-ASCII if transliteration fails
      const problematicInput = 'Test\x00\x01\x02'; // Control characters
      const result = sanitizeFilename(problematicInput);

      // Should not throw and should produce valid filename
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should strip non-ASCII when transliteration fails', () => {
      // Even if transliteration fails, should produce ASCII-only output
      const input = 'Resume_Café_2025';
      const result = sanitizeFilename(input);

      // Should be printable ASCII only (space through tilde), excluding control characters
      expect(/^[\x20-\x7E]*$/.test(result)).toBe(true);
    });
  });
});
