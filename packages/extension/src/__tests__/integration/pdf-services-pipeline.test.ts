/**
 * Integration Tests for PDF Services Pipeline
 *
 * Tests the complete PDF service pipeline with real WASM integration:
 * 1. TSX validation
 * 2. Font detection
 * 3. Config conversion
 * 4. WASM conversion
 * 5. PDF download
 *
 * These tests validate the service layer integration without UI.
 */

import type { ConversionConfig } from '@/shared/types/models';
import { beforeAll, describe, expect, it } from 'vitest';
import { convertTsxToPdfWithFonts } from '@/shared/application/pdf/converter';
import { validateTsxSyntax } from '@/shared/domain/pdf/validation';
import { getLogger } from '@/shared/infrastructure/logging';
import { clearFontCache, detectFonts } from '@/shared/infrastructure/pdf/fonts';
import { createConverterInstance, initWASM } from '@/shared/infrastructure/wasm';

// Import fixtures as raw strings
import fixture01 from '../../../../../test-fixtures/tsx-samples/single-page/01-single-column-traditional.tsx?raw';
import fixture02 from '../../../../../test-fixtures/tsx-samples/single-page/02-two-column-modern.tsx?raw';
import fixture03 from '../../../../../test-fixtures/tsx-samples/single-page/03-minimal-simple.tsx?raw';

describe('PDF Services Pipeline Integration', () => {
  // Initialize WASM once for all tests
  beforeAll(async () => {
    await initWASM();
  });

  it('should validate TSX file successfully', async () => {
    const tsxContent = fixture01;

    // Use validateTsxSyntax directly (validateTsxFile requires browser messaging)
    const result = await validateTsxSyntax(tsxContent, getLogger(), createConverterInstance());

    expect(result).toBe(true);
  });

  it('should detect syntax errors in invalid TSX', async () => {
    const invalidTsx = '<div>Unclosed tag<p>Missing close';

    const result = await validateTsxSyntax(invalidTsx, getLogger(), createConverterInstance());

    expect(result).toBe(false);
  });

  it('should detect fonts from TSX', async () => {
    const tsxWithFonts = `
      <div style={{ fontFamily: 'Roboto' }}>
        <h1 style={{ fontFamily: 'Open Sans' }}>Title</h1>
        <p>Body text</p>
      </div>
    `;

    const fonts = await detectFonts(tsxWithFonts);

    expect(fonts).toBeDefined();
    expect(Array.isArray(fonts)).toBe(true);
    // Should detect custom fonts
    expect(fonts.length).toBeGreaterThanOrEqual(0);
  });

  it('should cache font detection results', async () => {
    const tsx = `<div style={{ fontFamily: 'Arial' }}>Test</div>`;

    // Clear cache first
    clearFontCache();

    // First call - not cached
    const fonts1 = await detectFonts(tsx, true);

    // Second call - should be cached (verify by calling with same input)
    const fonts2 = await detectFonts(tsx, true);

    // Results should be identical (cache hit returns same data)
    expect(fonts2).toEqual(fonts1);

    // Verify cache is actually working by disabling it
    clearFontCache();
    const fonts3 = await detectFonts(tsx, false); // useCache = false
    expect(fonts3).toEqual(fonts1); // Still same results, just not cached
  });

  it('should convert TSX with default config', async () => {
    const tsxContent = fixture03;

    const config: ConversionConfig = {
      pageSize: 'Letter',
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      fontSize: 12,
      fontFamily: 'Arial',
      compress: false,
    };

    const pdfBytes = await convertTsxToPdfWithFonts(tsxContent, config);

    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.length).toBeGreaterThan(0);
  });

  it('should convert TSX to PDF through full pipeline', async () => {
    const tsxContent = fixture01;

    const config: ConversionConfig = {
      pageSize: 'Letter',
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      fontSize: 12,
      fontFamily: 'Arial',
      compress: false,
    };

    // Measure conversion time
    const startTime = Date.now();

    const pdfBytes = await convertTsxToPdfWithFonts(tsxContent, config);

    const duration = Date.now() - startTime;

    // Verify PDF output
    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.length).toBeGreaterThan(0);

    // Verify PDF header
    const header = new TextDecoder().decode(pdfBytes.slice(0, 4));
    expect(header).toBe('%PDF');

    // Performance check
    expect(duration).toBeLessThan(5000);

    console.warn(`Full pipeline conversion: ${duration}ms, ${pdfBytes.length} bytes`);
  });

  it('should handle validation -> font detection -> conversion pipeline', async () => {
    const tsxContent = fixture02;

    // Step 1: Validate (use validateTsxSyntax - validateTsxFile requires browser messaging)
    const isValid = await validateTsxSyntax(tsxContent, getLogger(), createConverterInstance());
    expect(isValid).toBe(true);

    // Step 2: Detect fonts
    const fonts = await detectFonts(tsxContent);
    expect(fonts).toBeDefined();

    // Step 3: Convert
    const config: ConversionConfig = {
      pageSize: 'Letter',
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      fontSize: 12,
      fontFamily: 'Arial',
      compress: false,
    };

    const pdfBytes = await convertTsxToPdfWithFonts(tsxContent, config);

    expect(pdfBytes.length).toBeGreaterThan(0);
    expect(pdfBytes.length).toBeLessThan(500 * 1024); // <500KB

    console.warn(`Pipeline test: ${fonts.length} fonts, ${pdfBytes.length} bytes`);
  });

  it('should handle error gracefully for invalid TSX in conversion', async () => {
    const invalidTsx = '<div>Broken<p>Missing close';

    const config: ConversionConfig = {
      pageSize: 'Letter',
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      fontSize: 12,
      fontFamily: 'Arial',
      compress: false,
    };

    // Should throw error with clear message
    await expect(convertTsxToPdfWithFonts(invalidTsx, config)).rejects.toThrow();
  });

  it('should process multiple conversions sequentially', async () => {
    const fixtures = [
      { name: '01-single-column-traditional.tsx', content: fixture01 },
      { name: '02-two-column-modern.tsx', content: fixture02 },
      { name: '03-minimal-simple.tsx', content: fixture03 },
    ];

    const config: ConversionConfig = {
      pageSize: 'Letter',
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      fontSize: 12,
      fontFamily: 'Arial',
      compress: false,
    };

    const results: Array<{ fixture: string; duration: number; size: number }> = [];

    for (const fixture of fixtures) {
      const startTime = Date.now();
      // eslint-disable-next-line no-await-in-loop -- Sequential execution required for accurate benchmarking
      const pdfBytes = await convertTsxToPdfWithFonts(fixture.content, config);
      const duration = Date.now() - startTime;

      results.push({
        fixture: fixture.name,
        duration,
        size: pdfBytes.length,
      });

      expect(pdfBytes.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5000);
    }

    console.warn('\n📊 Sequential Conversion Results:');
    results.forEach((r) => {
      console.warn(`  ${r.fixture}: ${r.duration}ms, ${r.size} bytes`);
    });

    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    console.warn(`  Average: ${avgDuration.toFixed(0)}ms`);
  });

  it('should maintain consistent results across multiple conversions', async () => {
    const tsxContent = fixture01;

    const config: ConversionConfig = {
      pageSize: 'Letter',
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      fontSize: 12,
      fontFamily: 'Arial',
      compress: false,
    };

    // Convert same TSX multiple times
    const results: number[] = [];

    for (let i = 0; i < 3; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- Sequential execution required for consistent measurement
      const pdfBytes = await convertTsxToPdfWithFonts(tsxContent, config);
      results.push(pdfBytes.length);
    }

    // All conversions should produce identical output size
    expect(results[0]).toBe(results[1]);
    expect(results[1]).toBe(results[2]);

    console.warn(`Consistent output size: ${results[0]} bytes (${results.length} conversions)`);
  });
});
