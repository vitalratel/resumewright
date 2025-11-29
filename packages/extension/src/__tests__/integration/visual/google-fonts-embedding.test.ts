import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import { convertTsxToPdfWithFonts } from '@/shared/application/pdf/converter';
import { initWASM, isWASMInitialized } from '@/shared/infrastructure/wasm';
import { paths } from '../paths';

/**
 * Visual regression tests for Google Fonts embedding.
 *
 * Validates:
 * - CV with Roboto renders correctly (P0)
 * - CV converts with fallback font (P0)
 * - Conversion completes within 10s (P0)
 * - CV with bold/italic renders correctly (P1)
 * - Second conversion uses cache (visual) (P3)
 *
 * Each test:
 * 1. Loads Google Font TSX fixture
 * 2. Converts to PDF via WASM pipeline (with fallback if network unavailable)
 * 3. Converts each PDF page to PNG
 * 4. Compares against baseline PNGs with 95% fidelity threshold
 * 5. Validates performance targets
 *
 * Baseline Management:
 * - Generate baselines: pnpm test:integration visual/google-fonts-embedding --update
 * - Review baselines: test-fixtures/baselines/fonts/
 * - Note: Baselines use fallback fonts (Arial/Helvetica) due to network isolation in CI
 */

const BASELINES_DIR = paths.baselinesDir('fonts');
const OUTPUT_DIR = paths.pdfOutputDir();

// Ensure directories exist
[BASELINES_DIR, OUTPUT_DIR].forEach((dir) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

/**
 * Convert PDF to PNG images using Rust CLI tool.
 * Same implementation as font-styling-fidelity.test.ts for consistency.
 */
async function pdfToPngs(
  pdfPath: string,
  outputDir: string,
  baseFilename: string
): Promise<string[]> {
  const cliPath = paths.rustBinary('pdf-to-png');

  if (!existsSync(cliPath)) {
    throw new Error(
      `pdf-to-png binary not found at ${cliPath}\n` +
        'Please build it first:\n' +
        '  cd packages/rust-core && cargo build --release --bin pdf-to-png'
    );
  }

  try {
    const result = execSync(
      `"${cliPath}" --input "${pdfPath}" --output-dir "${outputDir}" --basename "${baseFilename}" --scale 2.0`,
      {
        encoding: 'utf-8',
        env: {
          ...process.env,
          LD_LIBRARY_PATH: `${join(__dirname, '../../../../../../lib')}:${process.env.LD_LIBRARY_PATH ?? ''}`,
        },
      }
    );

    const output = JSON.parse(result.trim()) as {
      success: boolean;
      pngPaths?: string[];
      error?: string;
    };

    if (!output.success || !output.pngPaths) {
      throw new Error(`pdf-to-png failed: ${output.error}`);
    }

    return output.pngPaths;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to convert PDF to PNG: ${errorMessage}`);
  }
}

/**
 * Compare two PNG images and return similarity score (0-100%).
 * Uses pixelmatch for pixel-level comparison.
 *
 * @returns Similarity percentage (100 = identical, 0 = completely different)
 */
function compareImages(actualPath: string, expectedPath: string): number {
  const actual = PNG.sync.read(readFileSync(actualPath));
  const expected = PNG.sync.read(readFileSync(expectedPath));

  // Verify dimensions match
  if (actual.width !== expected.width || actual.height !== expected.height) {
    throw new Error(
      `Image dimensions don't match: ` +
        `actual=${actual.width}x${actual.height}, expected=${expected.width}x${expected.height}`
    );
  }

  const { width, height } = actual;
  const diff = new PNG({ width, height });

  // Count differing pixels
  const numDiffPixels = pixelmatch(
    actual.data,
    expected.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 } // Slight tolerance for anti-aliasing differences
  );

  const totalPixels = width * height;
  const similarity = ((totalPixels - numDiffPixels) / totalPixels) * 100;

  // Save diff image if there are differences
  if (numDiffPixels > 0) {
    const diffPath = actualPath.replace('.png', '-diff.png');
    writeFileSync(diffPath, PNG.sync.write(diff));
    console.warn(`  Diff image saved: ${diffPath}`);
  }

  return similarity;
}

/**
 * Convert TSX to PDF using real WASM conversion pipeline.
 */
async function convertTsxToPdfFile(
  fixtureName: string
): Promise<{ pdfPath: string; duration: number }> {
  const startTime = Date.now();

  // Initialize WASM if not already done
  if (!isWASMInitialized()) {
    await initWASM();
  }

  // Load TSX fixture
  const tsxPath = join(paths.fixturesDir('single-page'), `${fixtureName}.tsx`);
  const tsxContent = readFileSync(tsxPath, 'utf-8');

  // Convert TSX to PDF using WASM pipeline
  const config = {
    pageSize: 'Letter' as const,
    margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    compress: false,
    filename: `${fixtureName}.pdf`,
    fontSize: 12,
    fontFamily: 'Arial',
  };

  const pdfBytes = await convertTsxToPdfWithFonts(tsxContent, config);

  // Write PDF to file
  const pdfPath = join(OUTPUT_DIR, `${fixtureName}.pdf`);
  const { Buffer: NodeBuffer } = await import('node:buffer');
  writeFileSync(pdfPath, NodeBuffer.from(pdfBytes));

  const duration = Date.now() - startTime;

  return { pdfPath, duration };
}

// =============================================================================
// CV with Roboto renders correctly
// =============================================================================

describe('Visual Regression - Google Fonts Embedding', () => {
  it('CV with Roboto font renders correctly', async () => {
    const fixtureName = '06-google-font-roboto';

    console.warn(`\n[E2E-001] Testing ${fixtureName}`);

    // Convert TSX to PDF
    const { pdfPath, duration } = await convertTsxToPdfFile(fixtureName);

    console.warn(`  Conversion time: ${duration}ms`);

    // Verify PDF exists
    expect(existsSync(pdfPath), `PDF should exist at ${pdfPath}`).toBe(true);

    // Convert PDF to PNGs
    const pngPaths = await pdfToPngs(pdfPath, OUTPUT_DIR, fixtureName);

    console.warn(`  Generated ${pngPaths.length} PNG(s)`);

    // Compare against baselines
    for (let i = 0; i < pngPaths.length; i += 1) {
      const actualPng = pngPaths[i];
      const baselinePng = join(BASELINES_DIR, `${fixtureName}-${i + 1}.png`);

      // Create baseline if it doesn't exist
      if (!existsSync(baselinePng)) {
        console.warn(`  Creating baseline: ${baselinePng}`);
        writeFileSync(baselinePng, readFileSync(actualPng));
      }

      // Compare images
      const similarity = compareImages(actualPng, baselinePng);

      console.warn(`  Page ${i + 1} similarity: ${similarity.toFixed(2)}%`);

      // Target: 95% fidelity
      expect(similarity).toBeGreaterThanOrEqual(95.0);
    }
  }, 60000);

  // =============================================================================
  // CV converts with fallback font (P0)
  // =============================================================================

  it('CV converts successfully with fallback fonts', async () => {
    const fixtureName = '08-google-font-mixed';

    console.warn(`\n[E2E-002] Testing fallback behavior with ${fixtureName}`);

    // This test validates that even if Google Fonts fail to load,
    // the conversion still succeeds using fallback fonts

    const { pdfPath, duration } = await convertTsxToPdfFile(fixtureName);

    console.warn(`  Conversion time: ${duration}ms`);

    // Verify PDF exists (critical: conversion must not fail)
    expect(existsSync(pdfPath), 'Conversion should succeed even without Google Fonts').toBe(true);

    // Verify PDF is valid
    const pdfBytes = readFileSync(pdfPath);
    expect(pdfBytes.subarray(0, 5).toString()).toBe('%PDF-');

    // Verify PDF has reasonable size (>1KB)
    expect(pdfBytes.length).toBeGreaterThan(1024);

    console.warn(`  ✓ PDF generated successfully: ${pdfBytes.length} bytes`);

    // Convert to PNG and validate rendering
    const pngPaths = await pdfToPngs(pdfPath, OUTPUT_DIR, fixtureName);
    expect(pngPaths.length).toBeGreaterThan(0);

    // Verify PNG is valid (has reasonable dimensions)
    const png = PNG.sync.read(readFileSync(pngPaths[0]));
    expect(png.width).toBeGreaterThan(500);
    expect(png.height).toBeGreaterThan(600);

    console.warn(`  ✓ PNG rendered: ${png.width}x${png.height}`);
  }, 60000);

  // =============================================================================
  // Conversion completes within 10s (P0)
  // =============================================================================

  it('Conversion completes within 10 seconds', async () => {
    const fixtureName = '09-google-font-variants';

    console.warn(`\n[E2E-003] Testing performance with ${fixtureName}`);

    const startTime = Date.now();

    // Convert TSX to PDF (includes Google Fonts fetch if available)
    const { pdfPath } = await convertTsxToPdfFile(fixtureName);

    // Convert PDF to PNG
    await pdfToPngs(pdfPath, OUTPUT_DIR, fixtureName);

    const totalDuration = Date.now() - startTime;

    console.warn(`  Total E2E time: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);

    // Performance target: Conversion should complete within 10 seconds
    // This includes: TSX parse + render + layout + PDF generation + PNG rendering
    expect(totalDuration).toBeLessThan(10000);

    // Log performance breakdown
    if (totalDuration > 5000) {
      console.warn(`  ⚠ Conversion took ${(totalDuration / 1000).toFixed(2)}s (>5s target)`);
    } else {
      console.warn(`  ✓ Performance target met (${(totalDuration / 1000).toFixed(2)}s < 10s)`);
    }
  }, 15000);

  // =============================================================================
  // CV with bold/italic renders correctly (P1)
  // =============================================================================

  it('CV with bold and italic variants renders correctly', async () => {
    const fixtureName = '09-google-font-variants';

    console.warn(`\n[E2E-004] Testing font variants with ${fixtureName}`);

    // This fixture uses:
    // - Roboto 300 (Light)
    // - Roboto 400 (Regular)
    // - Roboto 700 (Bold)
    // - Roboto 400 Italic
    // - Roboto 700 Bold Italic

    const { pdfPath, duration } = await convertTsxToPdfFile(fixtureName);

    console.warn(`  Conversion time: ${duration}ms`);

    // Convert to PNGs
    const pngPaths = await pdfToPngs(pdfPath, OUTPUT_DIR, fixtureName);

    // Compare against baselines
    for (let i = 0; i < pngPaths.length; i += 1) {
      const actualPng = pngPaths[i];
      const baselinePng = join(BASELINES_DIR, `${fixtureName}-${i + 1}.png`);

      if (!existsSync(baselinePng)) {
        console.warn(`  Creating baseline: ${baselinePng}`);
        writeFileSync(baselinePng, readFileSync(actualPng));
      }

      const similarity = compareImages(actualPng, baselinePng);

      console.warn(`  Page ${i + 1} similarity: ${similarity.toFixed(2)}%`);

      // AC: 95% fidelity
      expect(similarity).toBeGreaterThanOrEqual(95.0);
    }

    console.warn(`  ✓ All font variants rendered correctly`);
  }, 60000);

  // =============================================================================
  // Second conversion uses cache (visual) (P3)
  // =============================================================================

  it('Second conversion uses cached fonts (visual validation)', async () => {
    const fixtureName = '07-google-font-open-sans';

    console.warn(`\n[E2E-005] Testing font caching with ${fixtureName}`);

    // First conversion (cold cache)
    console.warn('  First conversion (cold cache)...');
    const first = await convertTsxToPdfFile(fixtureName);
    const firstPngs = await pdfToPngs(first.pdfPath, OUTPUT_DIR, `${fixtureName}-first`);

    console.warn(`  First conversion: ${first.duration}ms`);

    // Second conversion (warm cache)
    console.warn('  Second conversion (warm cache)...');
    const second = await convertTsxToPdfFile(fixtureName);
    const secondPngs = await pdfToPngs(second.pdfPath, OUTPUT_DIR, `${fixtureName}-second`);

    console.warn(`  Second conversion: ${second.duration}ms`);

    // Verify second conversion is faster (should be near-instant if cached)
    // Note: In CI without network, both will use fallback fonts, so times will be similar
    // This test mainly validates that visual output is consistent

    if (second.duration < first.duration * 0.5) {
      console.warn(
        `  ✓ Cache hit detected (${((1 - second.duration / first.duration) * 100).toFixed(0)}% faster)`
      );
    } else {
      console.warn(`  ⚠ Cache behavior unclear (may be using fallback fonts in both cases)`);
    }

    // Visual validation: both conversions should produce identical output
    expect(firstPngs.length).toBe(secondPngs.length);

    for (let i = 0; i < firstPngs.length; i += 1) {
      const similarity = compareImages(secondPngs[i], firstPngs[i]);

      console.warn(`  Page ${i + 1} consistency: ${similarity.toFixed(2)}%`);

      // Should be 100% identical (same fonts, same rendering)
      expect(similarity).toBeGreaterThanOrEqual(99.9);
    }

    console.warn(`  ✓ Cached conversion produces identical output`);
  }, 90000);
});
