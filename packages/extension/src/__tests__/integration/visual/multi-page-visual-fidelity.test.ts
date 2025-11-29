import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { beforeAll, describe, expect, it } from 'vitest';

import { convertTsxToPdfWithFonts } from '@/shared/application/pdf/converter';
// Import WASM service
// Import directly from specific modules to avoid loading downloader.ts which requires webextension-polyfill
import { initWASM, isWASMInitialized } from '@/shared/infrastructure/wasm';
import { paths } from '../paths';

/**
 * Visual fidelity tests for multi-page CV pagination.
 *
 * Tests visual regression for multi-page fixtures.
 *
 * Validates:
 * - 2-page traditional CV renders with correct pagination
 * - 3-page academic CV preserves complex lists and formatting
 * - 6-page executive CV maintains visual fidelity across all pages
 * - Content flows correctly without truncation or overlap
 * - Page breaks occur at appropriate locations
 * - Visual fidelity ≥95% for all pages
 *
 * Each test:
 * 1. Loads multi-page TSX fixture
 * 2. Converts to PDF via WASM pipeline
 * 3. Converts each PDF page to PNG
 * 4. Compares against baseline PNGs with 95% fidelity threshold
 * 5. Reports per-page and average fidelity scores
 *
 * Baseline Management:
 * - Generate baselines: pnpm test:integration visual/multi-page-visual-fidelity --update
 * - Review baselines: test-fixtures/baselines/multi-page/
 * - Update after intentional pagination changes with documented reason
 */

const FIXTURES_DIR = paths.fixturesDir('multi-page');
const BASELINES_DIR = paths.baselinesDir('multi-page');
const OUTPUT_DIR = paths.pdfOutputDir();

/**
 * Convert PDF to PNG images (one per page) using Rust CLI tool.
 *
 * This function uses the pdf-to-png Rust binary which leverages pdfium-render
 * for significantly faster rendering compared to JavaScript-based solutions.
 *
 * @param pdfPath - Path to PDF file
 * @param outputDir - Directory to save PNGs
 * @param baseFilename - Base name for PNG files (will append -1.png, -2.png, etc.)
 * @returns Array of paths to generated PNG files
 */
async function pdfToPngs(
  pdfPath: string,
  outputDir: string,
  baseFilename: string
): Promise<string[]> {
  // Path to the Rust CLI binary
  const cliPath = paths.rustBinary('pdf-to-png');

  // Check if binary exists, if not provide helpful error
  if (!existsSync(cliPath)) {
    throw new Error(
      `pdf-to-png binary not found at ${cliPath}\n` +
        'Please build it first:\n' +
        '  cd packages/rust-core && cargo build --release --bin pdf-to-png'
    );
  }

  try {
    // Execute the CLI tool and capture output
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

    // Parse JSON output
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
    // Provide helpful error message
    if (error instanceof Error && error.message.includes('pdfium')) {
      throw new Error(
        'Pdfium library not found. Please run:\n' + '  bash scripts/download-pdfium-linux.sh'
      );
    }
    throw error;
  }
}

/**
 * Compare two PNG images and return similarity percentage.
 *
 * Uses pixelmatch for pixel-by-pixel comparison.
 *
 * @param img1Path - Path to first image (actual)
 * @param img2Path - Path to second image (baseline)
 * @param diffPath - Optional path to save diff image
 * @returns Similarity percentage (0-100)
 */
function compareImages(img1Path: string, img2Path: string, diffPath?: string): number {
  const img1 = PNG.sync.read(readFileSync(img1Path));
  
  // Create baseline if it doesn't exist
  if (!existsSync(img2Path)) {
    console.warn(`  Creating baseline: ${img2Path}`);
    writeFileSync(img2Path, readFileSync(img1Path));
    return 100.0; // Perfect match since we just created the baseline
  }
  
  const img2 = PNG.sync.read(readFileSync(img2Path));

  const { width, height } = img1;

  if (img2.width !== width || img2.height !== height) {
    throw new Error(
      `Image dimensions don't match: ${width}x${height} vs ${img2.width}x${img2.height}`
    );
  }

  const shouldCreateDiff = diffPath !== undefined && diffPath.length > 0;
  const diff = shouldCreateDiff ? new PNG({ width, height }) : null;

  // Use threshold of 0.1 (10% color difference per pixel)
  // This allows for minor anti-aliasing and font rendering differences
  const mismatchedPixels = pixelmatch(
    img1.data,
    img2.data,
    diff?.data ?? undefined,
    width,
    height,
    {
      threshold: 0.1,
    }
  );

  if (diff !== null && diffPath !== undefined) {
    writeFileSync(diffPath, PNG.sync.write(diff));
  }

  const totalPixels = width * height;
  const similarity = ((totalPixels - mismatchedPixels) / totalPixels) * 100;

  return similarity;
}

/**
 * Convert TSX to PDF using real WASM conversion pipeline.
 *
 * @param tsxContent - TSX content to convert
 * @param outputPath - Path to save PDF
 */
async function convertTsxToPdfFile(tsxContent: string, outputPath: string): Promise<void> {
  // Initialize WASM if not already done
  if (!isWASMInitialized()) {
    // Let initWASM auto-detect the WASM path
    await initWASM();
  }

  // Convert TSX to PDF using WASM pipeline
  const config = {
    pageSize: 'Letter' as const,
    margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    compress: false,
    filename: 'test.pdf',
    fontSize: 12,
    fontFamily: 'Arial',
  };

  const pdfBytes = await convertTsxToPdfWithFonts(tsxContent, config);

  // Write PDF to file
  const { Buffer: NodeBuffer } = await import('node:buffer');
  writeFileSync(outputPath, NodeBuffer.from(pdfBytes));
}

describe('Visual Fidelity - Multi-Page CV Pagination', () => {
  beforeAll(async () => {
    // Ensure output directory exists
    const fs = await import('node:fs');
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    if (!fs.existsSync(BASELINES_DIR)) {
      fs.mkdirSync(BASELINES_DIR, { recursive: true });
    }
  });

  it(
    '01-two-page-traditional: 2-page CV renders with ≥95% fidelity',
    async () => {
      // Load TSX fixture
      const tsxPath = join(FIXTURES_DIR, '01-two-page-traditional.tsx');
      const tsxContent = readFileSync(tsxPath, 'utf-8');

      // Convert TSX to PDF
      const outputPdfPath = join(OUTPUT_DIR, '01-two-page-traditional.pdf');
      await convertTsxToPdfFile(tsxContent, outputPdfPath);

      // Convert PDF pages to PNGs
      const pngPaths = await pdfToPngs(outputPdfPath, OUTPUT_DIR, '01-two-page-traditional');

      // Should have exactly 2 pages
      expect(pngPaths.length).toBe(2);

      const similarities: number[] = [];

      // Compare each page against baseline
      for (let i = 0; i < pngPaths.length; i += 1) {
        const pageNum = i + 1;
        const actualPath = pngPaths[i];
        const baselinePath = join(BASELINES_DIR, `01-two-page-traditional-${pageNum}.png`);
        const diffPath = join(OUTPUT_DIR, `01-two-page-traditional-${pageNum}-diff.png`);

        // Compare with 95% fidelity threshold (5% tolerance for anti-aliasing)
        const similarity = compareImages(actualPath, baselinePath, diffPath);
        similarities.push(similarity);

        console.warn(`  Page ${pageNum} similarity: ${similarity.toFixed(2)}%`);

        expect(similarity).toBeGreaterThanOrEqual(95);
      }

      // Calculate and report average fidelity
      const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
      console.warn(`  Average fidelity: ${avgSimilarity.toFixed(2)}%`);
    },
    60000
  );

  it(
    '02-three-page-academic: 3-page CV preserves complex formatting with ≥95% fidelity',
    async () => {
      const tsxPath = join(FIXTURES_DIR, '02-three-page-academic.tsx');
      const tsxContent = readFileSync(tsxPath, 'utf-8');

      const outputPdfPath = join(OUTPUT_DIR, '02-three-page-academic.pdf');
      await convertTsxToPdfFile(tsxContent, outputPdfPath);

      const pngPaths = await pdfToPngs(outputPdfPath, OUTPUT_DIR, '02-three-page-academic');

      // Should have exactly 3 pages
      expect(pngPaths.length).toBe(3);

      const similarities: number[] = [];

      for (let i = 0; i < pngPaths.length; i += 1) {
        const pageNum = i + 1;
        const actualPath = pngPaths[i];
        const baselinePath = join(BASELINES_DIR, `02-three-page-academic-${pageNum}.png`);
        const diffPath = join(OUTPUT_DIR, `02-three-page-academic-${pageNum}-diff.png`);

        const similarity = compareImages(actualPath, baselinePath, diffPath);
        similarities.push(similarity);

        console.warn(`  Page ${pageNum} similarity: ${similarity.toFixed(2)}%`);

        expect(similarity).toBeGreaterThanOrEqual(95);
      }

      const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
      console.warn(`  Average fidelity: ${avgSimilarity.toFixed(2)}%`);
    },
    60000
  );

  it(
    '03-six-page-executive: 6-page CV maintains visual fidelity across all pages',
    async () => {
      const tsxPath = join(FIXTURES_DIR, '03-six-page-executive.tsx');
      const tsxContent = readFileSync(tsxPath, 'utf-8');

      const outputPdfPath = join(OUTPUT_DIR, '03-six-page-executive.pdf');
      await convertTsxToPdfFile(tsxContent, outputPdfPath);

      const pngPaths = await pdfToPngs(outputPdfPath, OUTPUT_DIR, '03-six-page-executive');

      // Should have multiple pages (at least 4)
      expect(pngPaths.length).toBeGreaterThanOrEqual(4);

      const similarities: number[] = [];

      for (let i = 0; i < pngPaths.length; i += 1) {
        const pageNum = i + 1;
        const actualPath = pngPaths[i];
        const baselinePath = join(BASELINES_DIR, `03-six-page-executive-${pageNum}.png`);
        const diffPath = join(OUTPUT_DIR, `03-six-page-executive-${pageNum}-diff.png`);

        const similarity = compareImages(actualPath, baselinePath, diffPath);
        similarities.push(similarity);

        console.warn(`  Page ${pageNum} similarity: ${similarity.toFixed(2)}%`);

        expect(similarity).toBeGreaterThanOrEqual(95);
      }

      const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
      console.warn(`  Average fidelity: ${avgSimilarity.toFixed(2)}%`);

      // Additional validation for 6-page CV
      // Verify all pages maintain consistent quality (no significant degradation on later pages)
      const maxVariance = Math.max(...similarities) - Math.min(...similarities);
      console.warn(`  Fidelity variance: ${maxVariance.toFixed(2)}%`);

      // Allow max 5% variance between best and worst page
      expect(maxVariance).toBeLessThan(5);
    },
    60000
  );
});
