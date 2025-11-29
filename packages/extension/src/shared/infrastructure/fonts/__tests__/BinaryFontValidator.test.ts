/**
 * Comprehensive Font Validation Tests
 *
 * Tests magic number validation, file size limits, and format detection
 */

import type { FontWeight } from "@/shared/domain/fonts/models/Font";
import { describe, expect, it, vi } from 'vitest';
import { quickValidateFont, validateAndProcessFont } from '@/shared/infrastructure/fonts/BinaryFontValidator';

// Mock WASM module for WOFF/WOFF2 decompression in tests
// This allows validation tests to run without actual WASM module
vi.mock('@pkg/wasm_bridge', () => {
  return {
    decompress_woff_font: (woffBytes: Uint8Array): Uint8Array => {
      // Check for WOFF magic number
      if (woffBytes.length >= 4
        && woffBytes[0] === 0x77 && woffBytes[1] === 0x4F
        && woffBytes[2] === 0x46 && woffBytes[3] === 0x46) {
        // Return mock TTF bytes with valid magic number (0x00010000)
        const ttfBytes = new Uint8Array(104); // Same size as test input
        ttfBytes[0] = 0x00;
        ttfBytes[1] = 0x01;
        ttfBytes[2] = 0x00;
        ttfBytes[3] = 0x00;
        return ttfBytes;
      }
      throw new Error('INVALID_WOFF_MAGIC');
    },
    decompress_woff2_font: (woff2Bytes: Uint8Array): Uint8Array => {
      // Check for WOFF2 magic number
      if (woff2Bytes.length >= 4
        && woff2Bytes[0] === 0x77 && woff2Bytes[1] === 0x4F
        && woff2Bytes[2] === 0x46 && woff2Bytes[3] === 0x32) {
        // Return mock TTF bytes with valid magic number (0x00010000)
        const ttfBytes = new Uint8Array(104); // Same size as test input
        ttfBytes[0] = 0x00;
        ttfBytes[1] = 0x01;
        ttfBytes[2] = 0x00;
        ttfBytes[3] = 0x00;
        return ttfBytes;
      }
      throw new Error('INVALID_WOFF2_MAGIC');
    },
  };
});

/**
 * Helper function to create a mock File with working arrayBuffer() method
 *
 * The browser File API has an arrayBuffer() method that returns a Promise<ArrayBuffer>.
 * When creating mock Files in tests, we need to manually add this method.
 */
function createMockFontFile(name: string, content: Uint8Array, type?: string): File {
  const blob = new Blob([content as BlobPart], { type: (type !== null && type !== undefined && type !== '') ? type : 'application/octet-stream' });
  const file = new File([blob], name, { type: (type !== null && type !== undefined && type !== '') ? type : 'application/octet-stream' });

  // Add arrayBuffer() method that returns the content
  file.arrayBuffer = vi.fn().mockResolvedValue(content.buffer);

  return file;
}

describe('Font Validator ', () => {
  describe('Magic Number Validation', () => {
    it('should validate TTF format (0x00 0x01 0x00 0x00)', async () => {
      const ttfBytes = new Uint8Array([
        0x00,
        0x01,
        0x00,
        0x00, // TTF magic number
        ...Array.from({ length: 100 }).fill(0) as number[], // Padding
      ]);

      const file = createMockFontFile('test.ttf', ttfBytes, 'font/ttf');

      const result = await validateAndProcessFont(file, {
        family: 'Test',
        weight: 400 as FontWeight,
        style: 'normal',
      });

      expect(result.valid).toBe(true);
      expect(result.metadata?.format).toBe('ttf');
    });

    it('should validate TTF Mac format (0x74 0x72 0x75 0x65 - "true")', async () => {
      const ttfMacBytes = new Uint8Array([
        0x74,
        0x72,
        0x75,
        0x65, // 'true' magic number
        ...Array.from({ length: 100 }).fill(0) as number[],
      ]);

      const file = createMockFontFile('test.ttf', ttfMacBytes, 'font/ttf');

      const result = await validateAndProcessFont(file, {
        family: 'Test',
        weight: 400 as FontWeight,
        style: 'normal',
      });

      expect(result.valid).toBe(true);
      expect(result.metadata?.format).toBe('ttf');
    });

    it('should validate OTF format (0x4F 0x54 0x54 0x4F - "OTTO")', async () => {
      const otfBytes = new Uint8Array([
        0x4F,
        0x54,
        0x54,
        0x4F, // 'OTTO' magic number
        ...Array.from({ length: 100 }).fill(0) as number[],
      ]);

      const file = createMockFontFile('test.otf', otfBytes, 'font/otf');

      const result = await validateAndProcessFont(file, {
        family: 'Test',
        weight: 400 as FontWeight,
        style: 'normal',
      });

      expect(result.valid).toBe(true);
      expect(result.metadata?.format).toBe('ttf'); // OTF is treated as TTF
    });

    it('should validate WOFF format (0x77 0x4F 0x46 0x46 - "wOFF")', async () => {
      const woffBytes = new Uint8Array([
        0x77,
        0x4F,
        0x46,
        0x46, // 'wOFF' magic number
        ...Array.from({ length: 100 }).fill(0) as number[],
      ]);

      const file = createMockFontFile('test.woff', woffBytes, 'font/woff');

      const result = await validateAndProcessFont(file, {
        family: 'Test',
        weight: 400 as FontWeight,
        style: 'normal',
      });

      expect(result.valid).toBe(true);
      expect(result.metadata?.format).toBe('woff');
    });

    it('should validate WOFF2 format (0x77 0x4F 0x46 0x32 - "wOF2")', async () => {
      const woff2Bytes = new Uint8Array([
        0x77,
        0x4F,
        0x46,
        0x32, // 'wOF2' magic number
        ...Array.from({ length: 100 }).fill(0) as number[],
      ]);

      const file = createMockFontFile('test.woff2', woff2Bytes, 'font/woff2');

      const result = await validateAndProcessFont(file, {
        family: 'Test',
        weight: 400 as FontWeight,
        style: 'normal',
      });

      expect(result.valid).toBe(true);
      expect(result.metadata?.format).toBe('woff2');
    });

    it('should reject invalid magic numbers', async () => {
      const invalidBytes = new Uint8Array([
        0xFF,
        0xFF,
        0xFF,
        0xFF, // Invalid magic number
        ...Array.from({ length: 100 }).fill(0) as number[],
      ]);

      const file = createMockFontFile('test.ttf', invalidBytes, 'font/ttf');

      const result = await validateAndProcessFont(file, {
        family: 'Test',
        weight: 400 as FontWeight,
        style: 'normal',
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid font file format');
    });

    it('should reject files too small to have magic numbers', async () => {
      const tinyBytes = new Uint8Array([0x00, 0x01]); // Only 2 bytes

      const file = createMockFontFile('test.ttf', tinyBytes, 'font/ttf');

      const result = await validateAndProcessFont(file, {
        family: 'Test',
        weight: 400 as FontWeight,
        style: 'normal',
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
    });
  });

  describe('File Size Validation', () => {
    it('should accept files under 2MB limit', () => {
      const size1MB = 1 * 1024 * 1024;
      const file = new File([new Uint8Array(size1MB)], 'test.ttf');

      const result = quickValidateFont(file);

      expect(result.valid).toBe(true);
    });

    it('should reject files over 2MB limit', () => {
      const size3MB = 3 * 1024 * 1024;
      const file = new File([new Uint8Array(size3MB)], 'test.ttf');

      const result = quickValidateFont(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds');
      expect(result.error).toContain('2MB');
    });

    it('should accept files exactly at 2MB limit', () => {
      const size2MB = 2 * 1024 * 1024;
      const file = new File([new Uint8Array(size2MB)], 'test.ttf');

      const result = quickValidateFont(file);

      expect(result.valid).toBe(true);
    });

    it('should provide size information in error message', () => {
      const size4MB = 4 * 1024 * 1024;
      const file = new File([new Uint8Array(size4MB)], 'test.ttf');

      const result = quickValidateFont(file);

      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/4\.\d+MB/); // Should show actual size
      expect(result.error).toContain('2MB'); // Should show limit
    });
  });

  describe('File Extension Validation', () => {
    it('should accept .ttf extension', () => {
      const file = new File([new Uint8Array(100)], 'font.ttf');
      const result = quickValidateFont(file);
      expect(result.valid).toBe(true);
    });

    it('should accept .woff extension', () => {
      const file = new File([new Uint8Array(100)], 'font.woff');
      const result = quickValidateFont(file);
      expect(result.valid).toBe(true);
    });

    it('should accept .woff2 extension', () => {
      const file = new File([new Uint8Array(100)], 'font.woff2');
      const result = quickValidateFont(file);
      expect(result.valid).toBe(true);
    });

    it('should accept .otf extension', () => {
      const file = new File([new Uint8Array(100)], 'font.otf');
      const result = quickValidateFont(file);
      expect(result.valid).toBe(true);
    });

    it('should reject unsupported extensions', () => {
      const file = new File([new Uint8Array(100)], 'font.txt');
      const result = quickValidateFont(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file extension');
    });

    it('should handle uppercase extensions', () => {
      const file = new File([new Uint8Array(100)], 'font.TTF');
      const result = quickValidateFont(file);
      expect(result.valid).toBe(true);
    });

    it('should handle mixed case extensions', () => {
      const file = new File([new Uint8Array(100)], 'font.Woff2');
      const result = quickValidateFont(file);
      expect(result.valid).toBe(true);
    });

    it('should reject files without extension', () => {
      const file = new File([new Uint8Array(100)], 'font');
      const result = quickValidateFont(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file extension');
    });
  });

  describe('Comprehensive Validation', () => {
    it('should validate all criteria for valid font', async () => {
      const ttfBytes = new Uint8Array([
        0x00,
        0x01,
        0x00,
        0x00, // Valid TTF magic
        ...Array.from({ length: 1000 }).fill(0) as number[],
      ]);

      const file = createMockFontFile('MyFont-Regular.ttf', ttfBytes, 'font/ttf');

      const result = await validateAndProcessFont(file, {
        family: 'MyFont',
        weight: 400 as FontWeight,
        style: 'normal',
      });

      expect(result.valid).toBe(true);
      expect(result.metadata).toMatchObject({
        family: 'MyFont',
        weight: 400 as FontWeight,
        style: 'normal',
        format: 'ttf',
      });
    });

    it('should fail if extension is valid but magic number is wrong', async () => {
      const invalidBytes = new Uint8Array([
        0x50,
        0x4B,
        0x03,
        0x04, // ZIP file magic (not font)
        ...Array.from({ length: 1000 }).fill(0) as number[],
      ]);

      const file = createMockFontFile('notafont.ttf', invalidBytes, 'font/ttf');

      const result = await validateAndProcessFont(file, {
        family: 'Test',
        weight: 400 as FontWeight,
        style: 'normal',
      });

      expect(result.valid).toBe(false);
    });

    it('should provide detailed error for multiple failures', async () => {
      // Too large AND invalid format
      const size10MB = 10 * 1024 * 1024;
      const invalidBytes = new Uint8Array(size10MB);
      invalidBytes.fill(0xFF); // Invalid magic

      const file = new File([invalidBytes], 'huge.ttf');

      // Quick validation catches size first
      const quickResult = quickValidateFont(file);
      expect(quickResult.valid).toBe(false);
      expect(quickResult.error).toContain('exceeds');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file', async () => {
      const emptyFile = createMockFontFile('empty.ttf', new Uint8Array([]));

      const result = await validateAndProcessFont(emptyFile, {
        family: 'Test',
        weight: 400 as FontWeight,
        style: 'normal',
      });

      expect(result.valid).toBe(false);
    });

    it('should handle file with only magic bytes (no font data)', async () => {
      const minimalBytes = new Uint8Array([0x00, 0x01, 0x00, 0x00]); // Just magic

      const file = createMockFontFile('minimal.ttf', minimalBytes);

      const result = await validateAndProcessFont(file, {
        family: 'Test',
        weight: 400 as FontWeight,
        style: 'normal',
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
    });

    it('should handle corrupted magic bytes (partial match)', async () => {
      const corruptedBytes = new Uint8Array([
        0x00,
        0x01,
        0x00,
        0xFF, // Last byte wrong
        ...Array.from({ length: 100 }).fill(0) as number[],
      ]);

      const file = createMockFontFile('corrupted.ttf', corruptedBytes);

      const result = await validateAndProcessFont(file, {
        family: 'Test',
        weight: 400 as FontWeight,
        style: 'normal',
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('WOFF Error Handlers', () => {
    it('should handle INVALID_WOFF_MAGIC error from decompressWOFF', async () => {
      // Test that error handler catches and converts WASM errors
      // The mock already throws INVALID_WOFF_MAGIC for invalid bytes
      // Lines 369-387 in fontValidator.ts handle these errors

      // Valid WOFF file structure but mock will throw error
      const invalidWoffBytes = new Uint8Array(104);
      invalidWoffBytes[0] = 0x77; // W
      invalidWoffBytes[1] = 0x4F; // O
      invalidWoffBytes[2] = 0x46; // F
      invalidWoffBytes[3] = 0x45; // E (wrong - should be F)

      const file = createMockFontFile('test.woff', invalidWoffBytes);

      const result = await validateAndProcessFont(file, {
        family: 'Test',
        weight: 400 as FontWeight,
        style: 'normal',
      });

      // Error handlers convert WASM errors to user-friendly messages
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
