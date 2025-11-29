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
 * Visual regression tests for font and styling preservation.
 *
 * Validates:
 * - All 5 web-safe fonts render correctly (AC1)
 * - Font weights (400-700) preserve correctly (AC1)
 * - Font styles (bold, italic, bold-italic) preserve correctly (AC1)
 * - Text colors (hex, rgb, rgba, named) render accurately (AC1)
 * - Background colors preserve correctly (AC1)
 * - Mixed styling in realistic CV renders with 95% fidelity (AC3)
 *
 * Each test:
 * 1. Loads font/styling TSX fixture
 * 2. Converts to PDF via WASM pipeline
 * 3. Converts each PDF page to PNG
 * 4. Compares against baseline PNGs with 95% fidelity threshold
 *
 * Baseline Management:
 * - Generate baselines: pnpm test:integration visual/font-styling-fidelity --update
 * - Review baselines: test-fixtures/baselines/fonts/
 * - Update after intentional changes with documented reason
 */

const FIXTURES_DIR = paths.fixturesDir('single-page');
const BASELINES_DIR = paths.baselinesDir('fonts');
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

describe('Visual Regression - Font & Styling Preservation', () => {
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

  it('01-web-safe-fonts: All 5 web-safe fonts render correctly', async () => {
    // Load TSX fixture
    const tsxPath = join(FIXTURES_DIR, '01-web-safe-fonts.tsx');
    const tsxContent = readFileSync(tsxPath, 'utf-8');

    // Convert TSX to PDF
    const outputPdfPath = join(OUTPUT_DIR, '01-web-safe-fonts.pdf');
    await convertTsxToPdfFile(tsxContent, outputPdfPath);

    // Convert PDF pages to PNGs
    const pngPaths = await pdfToPngs(outputPdfPath, OUTPUT_DIR, '01-web-safe-fonts');

    // Should have at least 1 page
    expect(pngPaths.length).toBeGreaterThanOrEqual(1);

    // Compare each page against baseline
    for (let i = 0; i < pngPaths.length; i++) {
      const pageNum = i + 1;
      const actualPath = pngPaths[i];
      const baselinePath = join(BASELINES_DIR, `01-web-safe-fonts-${pageNum}.png`);
      const diffPath = join(OUTPUT_DIR, `01-web-safe-fonts-${pageNum}-diff.png`);

      // Compare with 95% fidelity threshold (5% tolerance for anti-aliasing)
      const similarity = compareImages(actualPath, baselinePath, diffPath);

      console.warn(`  Page ${pageNum} similarity: ${similarity.toFixed(2)}%`);

      expect(similarity).toBeGreaterThanOrEqual(95);
    }
  }, 60000);

  it('02-font-weights: Font weights (400-700) preserve correctly', async () => {
    const tsxPath = join(FIXTURES_DIR, '02-font-weights.tsx');
    const tsxContent = readFileSync(tsxPath, 'utf-8');

    const outputPdfPath = join(OUTPUT_DIR, '02-font-weights.pdf');
    await convertTsxToPdfFile(tsxContent, outputPdfPath);

    const pngPaths = await pdfToPngs(outputPdfPath, OUTPUT_DIR, '02-font-weights');

    expect(pngPaths.length).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < pngPaths.length; i++) {
      const pageNum = i + 1;
      const actualPath = pngPaths[i];
      const baselinePath = join(BASELINES_DIR, `02-font-weights-${pageNum}.png`);
      const diffPath = join(OUTPUT_DIR, `02-font-weights-${pageNum}-diff.png`);

      const similarity = compareImages(actualPath, baselinePath, diffPath);

      console.warn(`  Page ${pageNum} similarity: ${similarity.toFixed(2)}%`);

      expect(similarity).toBeGreaterThanOrEqual(95);
    }
  }, 60000);

  it('03-font-styles: Bold, italic, bold-italic combinations render correctly', async () => {
    const tsxPath = join(FIXTURES_DIR, '03-font-styles.tsx');
    const tsxContent = readFileSync(tsxPath, 'utf-8');

    const outputPdfPath = join(OUTPUT_DIR, '03-font-styles.pdf');
    await convertTsxToPdfFile(tsxContent, outputPdfPath);

    const pngPaths = await pdfToPngs(outputPdfPath, OUTPUT_DIR, '03-font-styles');

    expect(pngPaths.length).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < pngPaths.length; i++) {
      const pageNum = i + 1;
      const actualPath = pngPaths[i];
      const baselinePath = join(BASELINES_DIR, `03-font-styles-${pageNum}.png`);
      const diffPath = join(OUTPUT_DIR, `03-font-styles-${pageNum}-diff.png`);

      const similarity = compareImages(actualPath, baselinePath, diffPath);

      console.warn(`  Page ${pageNum} similarity: ${similarity.toFixed(2)}%`);

      expect(similarity).toBeGreaterThanOrEqual(95);
    }
  }, 60000);

  it('04-colors: Text and background colors render accurately', async () => {
    const tsxPath = join(FIXTURES_DIR, '04-colors.tsx');
    const tsxContent = readFileSync(tsxPath, 'utf-8');

    const outputPdfPath = join(OUTPUT_DIR, '04-colors.pdf');
    await convertTsxToPdfFile(tsxContent, outputPdfPath);

    const pngPaths = await pdfToPngs(outputPdfPath, OUTPUT_DIR, '04-colors');

    expect(pngPaths.length).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < pngPaths.length; i++) {
      const pageNum = i + 1;
      const actualPath = pngPaths[i];
      const baselinePath = join(BASELINES_DIR, `04-colors-${pageNum}.png`);
      const diffPath = join(OUTPUT_DIR, `04-colors-${pageNum}-diff.png`);

      const similarity = compareImages(actualPath, baselinePath, diffPath);

      console.warn(`  Page ${pageNum} similarity: ${similarity.toFixed(2)}%`);

      expect(similarity).toBeGreaterThanOrEqual(95);
    }
  }, 60000);

  it('05-mixed-styling: Realistic CV with varied styling renders with 95% fidelity', async () => {
    const tsxPath = join(FIXTURES_DIR, '05-mixed-styling.tsx');
    const tsxContent = readFileSync(tsxPath, 'utf-8');

    const outputPdfPath = join(OUTPUT_DIR, '05-mixed-styling.pdf');
    await convertTsxToPdfFile(tsxContent, outputPdfPath);

    const pngPaths = await pdfToPngs(outputPdfPath, OUTPUT_DIR, '05-mixed-styling');

    expect(pngPaths.length).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < pngPaths.length; i++) {
      const pageNum = i + 1;
      const actualPath = pngPaths[i];
      const baselinePath = join(BASELINES_DIR, `05-mixed-styling-${pageNum}.png`);
      const diffPath = join(OUTPUT_DIR, `05-mixed-styling-${pageNum}-diff.png`);

      const similarity = compareImages(actualPath, baselinePath, diffPath);

      console.warn(`  Page ${pageNum} similarity: ${similarity.toFixed(2)}%`);

      expect(similarity).toBeGreaterThanOrEqual(95);
    }
  }, 60000);
});

describe('Visual Regression - Font Rendering Quality', () => {
  it('font anti-aliasing and hinting applied correctly', async () => {
    // Verify that fonts are rendered with proper anti-aliasing
    // This prevents jagged edges and improves readability

    const outputPdfPath = join(OUTPUT_DIR, '01-web-safe-fonts.pdf');
    const pngPaths = await pdfToPngs(
      outputPdfPath,
      OUTPUT_DIR,
      '01-web-safe-fonts-antialiasing-check'
    );

    // Check that text areas are not purely black/white (indicating anti-aliasing)
    const img = PNG.sync.read(readFileSync(pngPaths[0]));

    // Sample a small area where text is expected (adjust coordinates as needed)
    const sampleX = 100;
    const sampleY = 100;
    const sampleWidth = 200;
    const sampleHeight = 50;

    let grayPixels = 0;
    let totalSampled = 0;

    for (let y = sampleY; y < sampleY + sampleHeight && y < img.height; y++) {
      for (let x = sampleX; x < sampleX + sampleWidth && x < img.width; x++) {
        const idx = (img.width * y + x) << 2;
        const r = img.data[idx];
        const g = img.data[idx + 1];
        const b = img.data[idx + 2];

        // Check if pixel is gray (between black and white)
        if ((r > 50 && r < 200) || (g > 50 && g < 200) || (b > 50 && b < 200)) {
          grayPixels += 1;
        }
        totalSampled += 1;
      }
    }

    const grayPercent = (grayPixels / totalSampled) * 100;
    console.warn(`  Gray pixels (anti-aliasing): ${grayPercent.toFixed(2)}%`);

    // Expect at least 2.5% gray pixels (indicating anti-aliasing is applied)
    // Note: 2.5% threshold accounts for PDF rendering variations across different systems
    expect(grayPercent).toBeGreaterThanOrEqual(2.5);
  });
});
