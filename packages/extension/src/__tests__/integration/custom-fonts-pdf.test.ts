/**
 * Integration Tests - Custom Font Decompression
 * Tests WOFF/WOFF2 decompression and PDF generation with custom fonts
 *
 * Validates:
 * - WOFF font decompression via WASM
 * - WOFF2 font decompression via WASM
 * - FontCollection API usage from TypeScript
 * - End-to-end custom font PDF generation
 *
 * Architecture:
 * - Runs in Node.js context (not browser)
 * - Uses WASM directly for font operations
 * - Validates PDF output programmatically
 *
 * Note: Font subsetting is tested in Rust (font-toolkit crate)
 * and happens automatically in WASM - no TypeScript API to control it.
 */

import type { ConversionConfig } from '@/shared/types/models/conversion';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  decompress_woff2_font,
  decompress_woff_font,
  FontCollection,
  FontData,
} from '@pkg/wasm_bridge';
import { beforeAll, describe, expect, it } from 'vitest';
import { initWASM } from '@/shared/infrastructure/wasm';

// Paths (using __dirname for vitest compatibility)
const FONT_FIXTURES_DIR = resolve(__dirname, '../../../../../test-fixtures/fonts');
const TSX_FIXTURES_DIR = resolve(__dirname, '../../../../../test-fixtures/tsx-samples/single-page');

// Sample CV TSX for testing
const SAMPLE_CV_TSX = readFileSync(join(TSX_FIXTURES_DIR, '03-minimal-simple.tsx'), 'utf-8');

/**
 * Base conversion config for tests
 */
const BASE_CONFIG: ConversionConfig = {
  pageSize: 'Letter',
  margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
  fontSize: 12,
  fontFamily: 'Arial',
  compress: false,
};

/**
 * Helper function to convert TSX to PDF with a custom FontCollection
 * Uses the WASM API directly to pass custom fonts to the converter
 */
async function convertTsxToPdfWithFontCollection(
  tsx: string,
  config: ConversionConfig,
  fontCollection: FontCollection
): Promise<Uint8Array> {
  const { createConverterInstance } = await import('@/shared/infrastructure/wasm');
  const { convertConfigToRust } = await import('@/shared/domain/pdf/config');
  const { getLogger } = await import('@/shared/infrastructure/logging');
  const { validatePdfBytes } = await import('@/shared/domain/pdf/wasmSchemas');
  const { parseWasmError } = await import('@/shared/domain/pdf/errors');

  try {
    const wasmConfig = convertConfigToRust(config, getLogger());
    const converterInstance = createConverterInstance();

    try {
      const pdfBytes = converterInstance.convert_tsx_to_pdf(
        tsx,
        wasmConfig,
        fontCollection,
        undefined
      );
      return validatePdfBytes(pdfBytes);
    } finally {
      converterInstance.free();
    }
  } catch (error) {
    const conversionError = parseWasmError(error);
    throw new Error(conversionError.message);
  }
}

describe('Custom Font Decompression', () => {
  beforeAll(async () => {
    await initWASM();
  });

  it('should decompress WOFF font and generate PDF', async () => {
    // 1. Load WOFF font file
    const woffPath = join(FONT_FIXTURES_DIR, 'Roboto-Regular.woff');
    const woffBytes = readFileSync(woffPath);

    // 2. Decompress using WASM
    const ttfBytes = decompress_woff_font(new Uint8Array(woffBytes));
    expect(ttfBytes.length).toBeGreaterThan(0);

    // 3. Create FontCollection and register font
    const fontCollection = new FontCollection();
    const fontData = new FontData('Roboto', 400, false, ttfBytes);
    fontCollection.add(fontData);

    // 4. Generate PDF with custom font
    const customFontTsx = SAMPLE_CV_TSX.replace(
      /font-family:\s*['"][^'"]+['"]/g,
      'font-family: "Roboto"'
    );

    const pdfBytes = await convertTsxToPdfWithFontCollection(
      customFontTsx,
      BASE_CONFIG,
      fontCollection
    );
    expect(pdfBytes.length).toBeGreaterThan(0);

    // 5. Verify PDF header
    const header = Buffer.from(pdfBytes.slice(0, 4)).toString('utf-8');
    expect(header).toBe('%PDF');
  });

  it('should decompress WOFF2 font and generate PDF', async () => {
    // 1. Load WOFF2 font file
    const woff2Path = join(FONT_FIXTURES_DIR, 'OpenSans-Bold.woff2');
    const woff2Bytes = readFileSync(woff2Path);

    // 2. Decompress using WASM
    const ttfBytes = decompress_woff2_font(new Uint8Array(woff2Bytes));
    expect(ttfBytes.length).toBeGreaterThan(0);

    // 3. Create FontCollection and register font
    const fontCollection = new FontCollection();
    const fontData = new FontData('Open Sans', 700, false, ttfBytes);
    fontCollection.add(fontData);

    // 4. Generate PDF with custom font
    const customFontTsx = SAMPLE_CV_TSX.replace(
      /font-family:\s*['"][^'"]+['"]/g,
      'font-family: "Open Sans"'
    );

    const pdfBytes = await convertTsxToPdfWithFontCollection(
      customFontTsx,
      BASE_CONFIG,
      fontCollection
    );
    expect(pdfBytes.length).toBeGreaterThan(0);

    // 5. Verify PDF header
    const header = Buffer.from(pdfBytes.slice(0, 4)).toString('utf-8');
    expect(header).toBe('%PDF');
  });
});
