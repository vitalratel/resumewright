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

import { safeParse } from 'valibot';
import { describe, expect, it } from 'vitest';
import type { FontWeight } from '@/shared/domain/fonts/types';
import type { Result, ValidationError } from '@/shared/errors/result';
import {
  FontRequirementSchema,
  FontSourceSchema,
  FontStyleSchema,
  FontWeightSchema,
  PdfBytesSchema,
  ProgressCallbackParamsSchema,
  parseFontRequirements,
  validatePdfBytes,
  validateProgressParams,
  validateWasmPdfConfig,
} from './wasmSchemas';

// Helper to extract error message from Result
function getErrorMessage<T>(result: Result<T, ValidationError>): string {
  if (result.isErr()) {
    return result.error.message;
  }
  throw new Error('Expected error result');
}

describe('WASM Schema Validation', () => {
  describe('parseFontRequirements', () => {
    it('should parse valid font requirements JSON', () => {
      const json = JSON.stringify([
        { family: 'Roboto', weight: 400 as FontWeight, style: 'normal', source: 'google' },
        { family: 'Inter', weight: 700 as FontWeight, style: 'italic', source: 'google' },
      ]);

      const result = parseFontRequirements(json);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]).toEqual({
          family: 'Roboto',
          weight: 400 as FontWeight,
          style: 'normal',
          source: 'google',
        });
        expect(result.value[1]).toEqual({
          family: 'Inter',
          weight: 700 as FontWeight,
          style: 'italic',
          source: 'google',
        });
      }
    });

    it('should parse empty array', () => {
      const json = '[]';

      const result = parseFontRequirements(json);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });

    it('should handle custom font source', () => {
      const json = JSON.stringify([
        { family: 'CustomFont', weight: 400 as FontWeight, style: 'normal', source: 'custom' },
      ]);

      const result = parseFontRequirements(json);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value[0].source).toBe('custom');
      }
    });

    it('should handle websafe font source', () => {
      const json = JSON.stringify([
        { family: 'Arial', weight: 400 as FontWeight, style: 'normal', source: 'websafe' },
      ]);

      const result = parseFontRequirements(json);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value[0].source).toBe('websafe');
      }
    });

    it('should handle all valid font weights', () => {
      const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
      const json = JSON.stringify(
        weights.map((weight) => ({
          family: 'Test',
          weight,
          style: 'normal',
          source: 'google',
        })),
      );

      const result = parseFontRequirements(json);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(9);
        result.value.forEach((req, idx) => {
          expect(req.weight).toBe(weights[idx]);
        });
      }
    });

    it('should return error for invalid JSON', () => {
      const invalidJson = '{not valid json}';

      const result = parseFontRequirements(invalidJson);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Failed to parse font requirements JSON');
    });

    it('should return error for malformed JSON structure', () => {
      const malformedJson = '{"not": "an array"}';

      const result = parseFontRequirements(malformedJson);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid font requirements from WASM');
    });

    it('should return error for missing family field', () => {
      const json = JSON.stringify([
        { weight: 400 as FontWeight, style: 'normal', source: 'google' },
      ]);

      const result = parseFontRequirements(json);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid font requirements from WASM');
    });

    it('should return error for empty family name', () => {
      const json = JSON.stringify([
        { family: '', weight: 400 as FontWeight, style: 'normal', source: 'google' },
      ]);

      const result = parseFontRequirements(json);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Font family cannot be empty');
    });

    it('should return error for invalid weight', () => {
      const json = JSON.stringify([
        { family: 'Test', weight: 450 as FontWeight, style: 'normal', source: 'google' },
      ]);

      const result = parseFontRequirements(json);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid font requirements from WASM');
    });

    it('should return error for weight outside range', () => {
      const json = JSON.stringify([
        { family: 'Test', weight: 1000 as FontWeight, style: 'normal', source: 'google' },
      ]);

      const result = parseFontRequirements(json);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid font requirements from WASM');
    });

    it('should return error for invalid style', () => {
      const json = JSON.stringify([
        { family: 'Test', weight: 400 as FontWeight, style: 'oblique', source: 'google' },
      ]);

      const result = parseFontRequirements(json);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid font requirements from WASM');
    });

    it('should return error for invalid source', () => {
      const json = JSON.stringify([
        { family: 'Test', weight: 400 as FontWeight, style: 'normal', source: 'system' },
      ]);

      const result = parseFontRequirements(json);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid font requirements from WASM');
    });

    it('should return error for missing required fields', () => {
      const json = JSON.stringify([{ family: 'Test', weight: 400 }]);

      const result = parseFontRequirements(json);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid font requirements from WASM');
    });

    it('should use different error message format for syntax errors vs validation errors', () => {
      // SyntaxError should use "Failed to parse font requirements JSON:" prefix
      const syntaxResult = parseFontRequirements('{invalid json}');
      expect(syntaxResult.isErr()).toBe(true);
      expect(getErrorMessage(syntaxResult)).toContain('Failed to parse font requirements JSON:');

      // Validation errors should use "Invalid font requirements from WASM:" prefix
      // (not "Failed to parse font requirements JSON:")
      const validJson = JSON.stringify([
        { family: '', weight: 400, style: 'normal', source: 'google' },
      ]);
      const validationResult = parseFontRequirements(validJson);
      expect(validationResult.isErr()).toBe(true);
      const message = getErrorMessage(validationResult);
      expect(message).not.toContain('Failed to parse font requirements JSON');
      expect(message).toContain('Invalid font requirements from WASM');
    });

    it('should include path in error message for nested validation failures', () => {
      // Test that error messages include the field path (e.g., "0.weight")
      const json = JSON.stringify([
        { family: 'Test', weight: 450, style: 'normal', source: 'google' },
      ]);

      const result = parseFontRequirements(json);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('0.weight');
    });

    it('should join multiple errors with comma separator', () => {
      // Test that multiple validation errors are joined with ", "
      const json = JSON.stringify([{ family: '', weight: 450, style: 'invalid', source: 'bad' }]);

      const result = parseFontRequirements(json);

      expect(result.isErr()).toBe(true);
      // Should have multiple errors joined by ", "
      expect(getErrorMessage(result)).toContain(', ');
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

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(validConfig);
      }
    });

    it('should handle null author', () => {
      const config = { ...validConfig, author: null };

      const result = validateWasmPdfConfig(config);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.author).toBeNull();
      }
    });

    it('should handle null keywords', () => {
      const config = { ...validConfig, keywords: null };

      const result = validateWasmPdfConfig(config);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.keywords).toBeNull();
      }
    });

    it('should validate A4 page size', () => {
      const config = { ...validConfig, page_size: 'A4' };

      const result = validateWasmPdfConfig(config);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.page_size).toBe('A4');
      }
    });

    it('should validate Legal page size', () => {
      const config = { ...validConfig, page_size: 'Legal' };

      const result = validateWasmPdfConfig(config);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.page_size).toBe('Legal');
        expect(result.value.title).toBeTruthy();
      }
    });

    it('should validate PDFA1b standard', () => {
      const config = { ...validConfig, standard: 'PDFA1b' };

      const result = validateWasmPdfConfig(config);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.standard).toBe('PDFA1b');
      }
    });

    it('should validate zero margins', () => {
      const config = {
        ...validConfig,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      };

      const result = validateWasmPdfConfig(config);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.margin).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
      }
    });

    it('should return error for invalid page size', () => {
      const config = { ...validConfig, page_size: 'Tabloid' };

      const result = validateWasmPdfConfig(config);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid PDF config');
    });

    it('should return error for negative margin', () => {
      const config = {
        ...validConfig,
        margin: { top: -0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      };

      const result = validateWasmPdfConfig(config);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid PDF config');
    });

    it('should return error for missing margin field', () => {
      const config = {
        ...validConfig,
        margin: { top: 0.5, right: 0.5, bottom: 0.5 },
      };

      const result = validateWasmPdfConfig(config);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid PDF config');
    });

    it('should return error for invalid standard', () => {
      const config = { ...validConfig, standard: 'PDF20' };

      const result = validateWasmPdfConfig(config);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid PDF config');
    });

    it('should return error for missing required field', () => {
      const { title, ...incompleteConfig } = validConfig;
      void title; // Acknowledge unused variable

      const result = validateWasmPdfConfig(incompleteConfig);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid PDF config');
    });

    it('should return error for wrong field type', () => {
      const config = { ...validConfig, title: 123 };

      const result = validateWasmPdfConfig(config);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid PDF config');
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
      pdf[4] = 0x2d; // -
      pdf[5] = 0x31; // 1
      pdf[6] = 0x2e; // .
      pdf[7] = 0x37; // 7
      return pdf;
    };

    it('should validate valid PDF bytes', () => {
      const pdfBytes = createValidPdf();

      const result = validatePdfBytes(pdfBytes);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(result.value.length).toBe(100);
      }
    });

    it('should validate minimum size PDF (50 bytes)', () => {
      const pdfBytes = createValidPdf(50);

      const result = validatePdfBytes(pdfBytes);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBe(50);
      }
    });

    it('should validate large PDF', () => {
      const pdfBytes = createValidPdf(1024 * 1024); // 1MB

      const result = validatePdfBytes(pdfBytes);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBe(1024 * 1024);
      }
    });

    it('should convert Array-like to Uint8Array', () => {
      const arrayLike = createValidPdf();

      const result = validatePdfBytes(arrayLike);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Uint8Array);
      }
    });

    it('should return error for bytes below minimum size', () => {
      const tooSmall = createValidPdf(49);

      const result = validatePdfBytes(tooSmall);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('PDF must be at least 50 bytes');
    });

    it('should return error for bytes exceeding maximum size', () => {
      const tooLarge = createValidPdf(11 * 1024 * 1024); // 11MB

      const result = validatePdfBytes(tooLarge);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('PDF cannot exceed 10MB');
    });

    it('should return error for invalid PDF magic bytes', () => {
      const invalidPdf = new Uint8Array(100);
      invalidPdf[0] = 0x00; // Not %PDF

      const result = validatePdfBytes(invalidPdf);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid PDF format: expected header "%PDF"');
    });

    it('should return error for wrong header format', () => {
      const wrongHeader = new Uint8Array(100);
      wrongHeader[0] = 0x50; // P
      wrongHeader[1] = 0x44; // D
      wrongHeader[2] = 0x46; // F
      wrongHeader[3] = 0x00; // Missing %

      const result = validatePdfBytes(wrongHeader);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid PDF format: expected header "%PDF"');
    });

    it('should return error for null input', () => {
      const result = validatePdfBytes(null);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid PDF bytes from WASM');
    });

    it('should return error for undefined input', () => {
      const result = validatePdfBytes(undefined);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid PDF bytes from WASM');
    });

    it('should return error for non-array-like input', () => {
      const result = validatePdfBytes('not an array');

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid PDF bytes from WASM');
    });

    it('should return error for object without length', () => {
      const result = validatePdfBytes({ data: [1, 2, 3] });

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid PDF bytes from WASM');
    });

    it('should return error for object with non-number length property', () => {
      // With proper validation, this should fail at custom validator level
      // If typeof check is bypassed, it would fail at check() with different error
      const objWithStringLength = { length: 'not a number', 0: 0x25, 1: 0x50, 2: 0x44, 3: 0x46 };

      const result = validatePdfBytes(objWithStringLength);

      expect(result.isErr()).toBe(true);
      const message = getErrorMessage(result);
      // Must fail at schema level (custom validator), not at size check level
      expect(message).toContain('Invalid PDF bytes from WASM');
      expect(message).not.toContain('at least 50 bytes');
    });

    it('should validate PDF at exactly 10MB boundary', () => {
      const pdfBytes = createValidPdf(10 * 1024 * 1024); // Exactly 10MB

      const result = validatePdfBytes(pdfBytes);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBe(10 * 1024 * 1024);
      }
    });

    it('should return error for PDF at 10MB + 1 byte', () => {
      const pdfBytes = createValidPdf(10 * 1024 * 1024 + 1);

      const result = validatePdfBytes(pdfBytes);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('PDF cannot exceed 10MB');
    });
  });

  describe('validateProgressParams', () => {
    it('should validate valid progress parameters', () => {
      const result = validateProgressParams('parsing', 50);

      expect(result.isOk()).toBe(true);
    });

    it('should validate 0% progress', () => {
      const result = validateProgressParams('queued', 0);

      expect(result.isOk()).toBe(true);
    });

    it('should validate 100% progress', () => {
      const result = validateProgressParams('completed', 100);

      expect(result.isOk()).toBe(true);
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
        const result = validateProgressParams(stage, 50);
        expect(result.isOk()).toBe(true);
      });
    });

    it('should return error for negative percentage', () => {
      const result = validateProgressParams('parsing', -1);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Progress percentage cannot be negative');
    });

    it('should return error for percentage exceeding 100', () => {
      const result = validateProgressParams('parsing', 101);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Progress percentage cannot exceed 100');
    });

    it('should return error for non-string stage', () => {
      const result = validateProgressParams(123, 50);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid progress callback params from WASM');
    });

    it('should return error for non-number percentage', () => {
      const result = validateProgressParams('parsing', '50');

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid progress callback params from WASM');
    });

    it('should return error for null stage', () => {
      const result = validateProgressParams(null, 50);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid progress callback params from WASM');
    });

    it('should return error for undefined percentage', () => {
      const result = validateProgressParams('parsing', undefined);

      expect(result.isErr()).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid progress callback params from WASM');
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
