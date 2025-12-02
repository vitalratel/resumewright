/**
 * WASM Schema Validation Tests
 *
 * Tests for WASM boundary validation covering:
 * - Font requirements parsing from WASM JSON
 * - PDF config validation before sending to WASM
 * - PDF bytes validation from WASM output
 * - Progress callback parameter validation
 * - Error handling for malformed WASM data
 *
 * Coverage target: >85%
 * P1 Critical: WASM boundary validation prevents runtime crashes
 */

import type { FontWeight } from "@/shared/domain/fonts/types";
import { safeParse } from 'valibot';
import { describe, expect, it } from 'vitest';
import {
  FontRequirementSchema,
  FontSourceSchema,
  FontStyleSchema,
  FontWeightSchema,
  parseFontRequirements,
  PdfBytesSchema,
  ProgressCallbackParamsSchema,
  validatePdfBytes,
  validateProgressParams,
  validateWasmPdfConfig,
} from './wasmSchemas';

describe('WASM Schema Validation', () => {
  describe('parseFontRequirements', () => {
    it('should parse valid font requirements JSON', () => {
      const json = JSON.stringify([
        { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
        { family: 'Inter', weight: 700 as FontWeight, style: 'italic', source: 'google' },
      ]);

      const result = parseFontRequirements(json);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        family: 'Roboto',
        weight: 400 as FontWeight,
        style: 'normal',
        source: 'google',
      });
      expect(result[1]).toEqual({
        family: 'Inter',
        weight: 700 as FontWeight,
        style: 'italic',
        source: 'google',
      });
    });

    it('should parse empty array', () => {
      const json = '[]';

      const result = parseFontRequirements(json);

      expect(result).toEqual([]);
    });

    it('should handle custom font source', () => {
      const json = JSON.stringify([
        { family: 'CustomFont', weight: 400 as FontWeight, style: 'normal', source: 'custom' },
      ]);

      const result = parseFontRequirements(json);

      expect(result[0].source).toBe('custom');
    });

    it('should handle websafe font source', () => {
      const json = JSON.stringify([
        { family: 'Arial', weight: 400 as FontWeight, style: 'normal', source: 'websafe' },
      ]);

      const result = parseFontRequirements(json);

      expect(result[0].source).toBe('websafe');
    });

    it('should handle all valid font weights', () => {
      const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
      const json = JSON.stringify(
        weights.map(weight => ({
          family: 'Test',
          weight,
          style: 'normal',
          source: 'google',
        })),
      );

      const result = parseFontRequirements(json);

      expect(result).toHaveLength(9);
      result.forEach((req, idx) => {
        expect(req.weight).toBe(weights[idx]);
      });
    });

    it('should throw error for invalid JSON', () => {
      const invalidJson = '{not valid json}';

      expect(() => parseFontRequirements(invalidJson)).toThrow(
        'Failed to parse font requirements JSON',
      );
    });

    it('should throw error for malformed JSON structure', () => {
      const malformedJson = '{"not": "an array"}';

      expect(() => parseFontRequirements(malformedJson)).toThrow(
        'Invalid font requirements from WASM',
      );
    });

    it('should throw error for missing family field', () => {
      const json = JSON.stringify([
        { weight: 400 as FontWeight, style: 'normal', source: 'google' },
      ]);

      expect(() => parseFontRequirements(json)).toThrow(
        'Invalid font requirements from WASM',
      );
    });

    it('should throw error for empty family name', () => {
      const json = JSON.stringify([
        { family: '', weight: 400 as FontWeight, style: 'normal', source: 'google' },
      ]);

      expect(() => parseFontRequirements(json)).toThrow('Font family cannot be empty');
    });

    it('should throw error for invalid weight', () => {
      const json = JSON.stringify([
        { family: 'Test', weight: 450 as FontWeight, style: 'normal', source: 'google' },
      ]);

      expect(() => parseFontRequirements(json)).toThrow(
        'Invalid font requirements from WASM',
      );
    });

    it('should throw error for weight outside range', () => {
      const json = JSON.stringify([
        { family: 'Test', weight: 1000 as FontWeight, style: 'normal', source: 'google' },
      ]);

      expect(() => parseFontRequirements(json)).toThrow(
        'Invalid font requirements from WASM',
      );
    });

    it('should throw error for invalid style', () => {
      const json = JSON.stringify([
        { family: 'Test', weight: 400 as FontWeight, style: 'oblique', source: 'google' },
      ]);

      expect(() => parseFontRequirements(json)).toThrow(
        'Invalid font requirements from WASM',
      );
    });

    it('should throw error for invalid source', () => {
      const json = JSON.stringify([
        { family: 'Test', weight: 400 as FontWeight, style: 'normal', source: 'system' },
      ]);

      expect(() => parseFontRequirements(json)).toThrow(
        'Invalid font requirements from WASM',
      );
    });

    it('should throw error for missing required fields', () => {
      const json = JSON.stringify([
        { family: 'Test', weight: 400 },
      ]);

      expect(() => parseFontRequirements(json)).toThrow(
        'Invalid font requirements from WASM',
      );
    });
  });

  describe('validateWasmPdfConfig', () => {
    const validConfig = {
      page_size: 'Letter',
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      standard: 'PDF17',
      title: 'Resume - John Doe',
      author: 'John Doe',
      subject: 'Software Engineer Resume',
      keywords: 'software, engineer, react',
      creator: 'ResumeWright',
    };

    it('should validate valid PDF config', () => {
      const result = validateWasmPdfConfig(validConfig);

      expect(result).toEqual(validConfig);
    });

    it('should handle null author', () => {
      const config = { ...validConfig, author: null };

      const result = validateWasmPdfConfig(config);

      expect(result.author).toBeNull();
    });

    it('should handle null keywords', () => {
      const config = { ...validConfig, keywords: null };

      const result = validateWasmPdfConfig(config);

      expect(result.keywords).toBeNull();
    });

    it('should validate A4 page size', () => {
      const config = { ...validConfig, page_size: 'A4' };

      const result = validateWasmPdfConfig(config);

      expect(result.page_size).toBe('A4');
    });

    it('should validate Legal page size', () => {
      const config = { ...validConfig, page_size: 'Legal' };

      const result = validateWasmPdfConfig(config);

      expect(result.page_size).toBe('Legal');
      expect(result.title).toBeTruthy();
    });

    it('should validate PDFA1b standard', () => {
      const config = { ...validConfig, standard: 'PDFA1b' };

      const result = validateWasmPdfConfig(config);

      expect(result.standard).toBe('PDFA1b');
    });

    it('should validate zero margins', () => {
      const config = {
        ...validConfig,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      };

      const result = validateWasmPdfConfig(config);

      expect(result.margin).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    });

    it('should throw error for invalid page size', () => {
      const config = { ...validConfig, page_size: 'Tabloid' };

      expect(() => validateWasmPdfConfig(config)).toThrow('Invalid PDF config');
    });

    it('should throw error for negative margin', () => {
      const config = {
        ...validConfig,
        margin: { top: -0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      };

      expect(() => validateWasmPdfConfig(config)).toThrow('Invalid PDF config');
    });

    it('should throw error for missing margin field', () => {
      const config = {
        ...validConfig,
        margin: { top: 0.5, right: 0.5, bottom: 0.5 },
      };

      expect(() => validateWasmPdfConfig(config)).toThrow('Invalid PDF config');
    });

    it('should throw error for invalid standard', () => {
      const config = { ...validConfig, standard: 'PDF20' };

      expect(() => validateWasmPdfConfig(config)).toThrow('Invalid PDF config');
    });

    it('should throw error for missing required field', () => {
      const { title, ...incompleteConfig } = validConfig;
      void title; // Acknowledge unused variable

      expect(() => validateWasmPdfConfig(incompleteConfig)).toThrow('Invalid PDF config');
    });

    it('should throw error for wrong field type', () => {
      const config = { ...validConfig, title: 123 };

      expect(() => validateWasmPdfConfig(config)).toThrow('Invalid PDF config');
    });
  });

  describe('validatePdfBytes', () => {
    // Create a minimal valid PDF with correct magic bytes
    const createValidPdf = (size: number = 100): Uint8Array => {
      const pdf = new Uint8Array(size);
      // PDF magic bytes: "%PDF-1.7"
      pdf[0] = 0x25; // %
      pdf[1] = 0x50; // P
      pdf[2] = 0x44; // D
      pdf[3] = 0x46; // F
      pdf[4] = 0x2D; // -
      pdf[5] = 0x31; // 1
      pdf[6] = 0x2E; // .
      pdf[7] = 0x37; // 7
      return pdf;
    };

    it('should validate valid PDF bytes', () => {
      const pdfBytes = createValidPdf();

      const result = validatePdfBytes(pdfBytes);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(100);
    });

    it('should validate minimum size PDF (50 bytes)', () => {
      const pdfBytes = createValidPdf(50);

      const result = validatePdfBytes(pdfBytes);

      expect(result.length).toBe(50);
    });

    it('should validate large PDF', () => {
      const pdfBytes = createValidPdf(1024 * 1024); // 1MB

      const result = validatePdfBytes(pdfBytes);

      expect(result.length).toBe(1024 * 1024);
    });

    it('should convert Array-like to Uint8Array', () => {
      const arrayLike = createValidPdf();

      const result = validatePdfBytes(arrayLike);

      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should throw error for bytes below minimum size', () => {
      const tooSmall = createValidPdf(49);

      expect(() => validatePdfBytes(tooSmall)).toThrow('PDF must be at least 50 bytes');
    });

    it('should throw error for bytes exceeding maximum size', () => {
      const tooLarge = createValidPdf(11 * 1024 * 1024); // 11MB

      expect(() => validatePdfBytes(tooLarge)).toThrow('PDF cannot exceed 10MB');
    });

    it('should throw error for invalid PDF magic bytes', () => {
      const invalidPdf = new Uint8Array(100);
      invalidPdf[0] = 0x00; // Not %PDF

      expect(() => validatePdfBytes(invalidPdf)).toThrow(
        'Invalid PDF format: expected header "%PDF"',
      );
    });

    it('should throw error for wrong header format', () => {
      const wrongHeader = new Uint8Array(100);
      wrongHeader[0] = 0x50; // P
      wrongHeader[1] = 0x44; // D
      wrongHeader[2] = 0x46; // F
      wrongHeader[3] = 0x00; // Missing %

      expect(() => validatePdfBytes(wrongHeader)).toThrow(
        'Invalid PDF format: expected header "%PDF"',
      );
    });

    it('should throw error for null input', () => {
      expect(() => validatePdfBytes(null)).toThrow('Invalid PDF bytes from WASM');
    });

    it('should throw error for undefined input', () => {
      expect(() => validatePdfBytes(undefined)).toThrow('Invalid PDF bytes from WASM');
    });

    it('should throw error for non-array-like input', () => {
      expect(() => validatePdfBytes('not an array')).toThrow(
        'Invalid PDF bytes from WASM',
      );
    });

    it('should throw error for object without length', () => {
      expect(() => validatePdfBytes({ data: [1, 2, 3] })).toThrow(
        'Invalid PDF bytes from WASM',
      );
    });
  });

  describe('validateProgressParams', () => {
    it('should validate valid progress parameters', () => {
      expect(() => validateProgressParams('parsing', 50)).not.toThrow();
    });

    it('should validate 0% progress', () => {
      expect(() => validateProgressParams('queued', 0)).not.toThrow();
    });

    it('should validate 100% progress', () => {
      expect(() => validateProgressParams('completed', 100)).not.toThrow();
    });

    it('should validate different stage names', () => {
      const stages = [
        'parsing',
        'extracting-metadata',
        'rendering',
        'laying-out',
        'optimizing',
        'generating-pdf',
      ];

      stages.forEach((stage) => {
        expect(() => validateProgressParams(stage, 50)).not.toThrow();
      });
    });

    it('should throw error for negative percentage', () => {
      expect(() => validateProgressParams('parsing', -1)).toThrow(
        'Progress percentage cannot be negative',
      );
    });

    it('should throw error for percentage exceeding 100', () => {
      expect(() => validateProgressParams('parsing', 101)).toThrow(
        'Progress percentage cannot exceed 100',
      );
    });

    it('should throw error for non-string stage', () => {
      expect(() => validateProgressParams(123, 50)).toThrow(
        'Invalid progress callback params from WASM',
      );
    });

    it('should throw error for non-number percentage', () => {
      expect(() => validateProgressParams('parsing', '50')).toThrow(
        'Invalid progress callback params from WASM',
      );
    });

    it('should throw error for null stage', () => {
      expect(() => validateProgressParams(null, 50)).toThrow(
        'Invalid progress callback params from WASM',
      );
    });

    it('should throw error for undefined percentage', () => {
      expect(() => validateProgressParams('parsing', undefined)).toThrow(
        'Invalid progress callback params from WASM',
      );
    });
  });

  describe('Schema Direct Validation', () => {
    describe('FontWeightSchema', () => {
      it('should validate all valid weights', () => {
        const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];

        weights.forEach((weight) => {
          const result = safeParse(FontWeightSchema, weight);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid weights', () => {
        const invalidWeights = [0, 50, 150, 450, 1000];

        invalidWeights.forEach((weight) => {
          const result = safeParse(FontWeightSchema, weight);
          expect(result.success).toBe(false);
        });
      });
    });

    describe('FontStyleSchema', () => {
      it('should validate normal style', () => {
        const result = safeParse(FontStyleSchema, 'normal');
        expect(result.success).toBe(true);
      });

      it('should validate italic style', () => {
        const result = safeParse(FontStyleSchema, 'italic');
        expect(result.success).toBe(true);
      });

      it('should reject invalid styles', () => {
        const result = safeParse(FontStyleSchema, 'oblique');
        expect(result.success).toBe(false);
      });
    });

    describe('FontSourceSchema', () => {
      it('should validate google source', () => {
        const result = safeParse(FontSourceSchema, 'google');
        expect(result.success).toBe(true);
      });

      it('should validate custom source', () => {
        const result = safeParse(FontSourceSchema, 'custom');
        expect(result.success).toBe(true);
      });

      it('should validate websafe source', () => {
        const result = safeParse(FontSourceSchema, 'websafe');
        expect(result.success).toBe(true);
      });

      it('should reject invalid sources', () => {
        const result = safeParse(FontSourceSchema, 'system');
        expect(result.success).toBe(false);
      });
    });

    describe('FontRequirementSchema', () => {
      it('should validate complete font requirement', () => {
        const fontReq = {
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          source: 'google',
        };

        const result = safeParse(FontRequirementSchema, fontReq);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.output.family).toBe('Roboto');
        }
      });

      it('should reject font requirement with missing fields', () => {
        const incomplete = {
          family: 'Roboto',
          weight: 400 as FontWeight,
        };

        const result = safeParse(FontRequirementSchema, incomplete);
        expect(result.success).toBe(false);
      });
    });

    describe('PdfBytesSchema', () => {
      it('should validate Uint8Array of valid size', () => {
        const bytes = new Uint8Array(100);

        const result = safeParse(PdfBytesSchema, bytes);
        expect(result.success).toBe(true);
      });

      it('should reject array below minimum size', () => {
        const bytes = new Uint8Array(40);

        const result = safeParse(PdfBytesSchema, bytes);
        expect(result.success).toBe(false);
      });
    });

    describe('ProgressCallbackParamsSchema', () => {
      it('should validate valid params object', () => {
        const params = { stage: 'parsing', percentage: 50 };

        const result = safeParse(ProgressCallbackParamsSchema, params);
        expect(result.success).toBe(true);
      });

      it('should reject params with invalid percentage', () => {
        const params = { stage: 'parsing', percentage: -10 };

        const result = safeParse(ProgressCallbackParamsSchema, params);
        expect(result.success).toBe(false);
      });
    });
  });
});
