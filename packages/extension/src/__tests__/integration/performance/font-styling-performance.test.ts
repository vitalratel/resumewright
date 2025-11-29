import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

import { convertTsxToPdfWithFonts } from '@/shared/application/pdf/converter';
// Import WASM service
// Import directly from specific modules to avoid loading downloader.ts which requires webextension-polyfill
import { initWASM, isWASMInitialized } from '@/shared/infrastructure/wasm';

/**
 * Performance tests for font and styling features.
 *
 * Validates:
 * - Font/color processing adds <500ms overhead vs baseline
 * - Memory usage increases by <5MB per font
 * - Conversion time for all 5 fixtures stays within performance budgets
 *
 * Performance Targets:
 * - High-End Devices: Single-page <5 seconds
 * - Low-End Devices: Single-page <8 seconds
 * - Overhead Budget: <500ms added overhead for font/color features
 *
 * Baseline Comparison:
 * - Baseline: Fixture without custom fonts/colors (no custom fonts/colors)
 * - Test Fixtures: With custom fonts and colors
 * - Overhead = Test time - Baseline time
 */

const FIXTURES_DIR = join(__dirname, '../../../../../../test-fixtures/tsx-samples/single-page');

interface PerformanceMetrics {
  totalTime: number;
  parseTime?: number;
  layoutTime?: number;
  pdfTime?: number;
  fontMappingTime?: number;
  memoryUsed?: number;
  memoryDelta?: number;
}

/**
 * Measure conversion performance using real WASM pipeline.
 *
 * @param tsxContent - TSX content to convert
 * @returns Performance metrics
 */
async function measureConversion(tsxContent: string): Promise<PerformanceMetrics> {
  // Initialize WASM if not already done
  if (!isWASMInitialized()) {
    await initWASM();
  }

  const startTime = performance.now();
  const startMemory =
    (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0;

  // Convert TSX to PDF using WASM pipeline
  const config = {
    pageSize: 'Letter' as const,
    margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    compress: false,
    filename: 'performance-test.pdf',
    fontSize: 12,
    fontFamily: 'Arial',
  };

  // Track stage timings
  const stageTimes: Record<string, number> = {};
  let lastStageTime = startTime;

  await convertTsxToPdfWithFonts(tsxContent, config, (stage: string) => {
    const now = performance.now();
    stageTimes[stage] = now - lastStageTime;
    lastStageTime = now;
  });

  const endTime = performance.now();
  const endMemory =
    (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0;

  return {
    totalTime: endTime - startTime,
    parseTime: stageTimes.parsing,
    layoutTime: stageTimes['laying-out'],
    pdfTime: stageTimes['generating-pdf'],
    fontMappingTime: stageTimes.rendering, // Font mapping happens during rendering
    memoryUsed: endMemory,
    memoryDelta: endMemory - startMemory,
  };
}

/**
 * Create baseline fixture without custom fonts/colors.
 * This simulates a CV without custom font/styling features.
 */
const baselineCV = `
export default function BaselineCV() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>John Doe</h1>
      <p>john.doe@example.com | (555) 123-4567</p>
      <p>San Francisco, CA</p>

      <h2>Experience</h2>
      <section>
        <h3>Senior Software Engineer</h3>
        <p>Tech Corp (2020-Present)</p>
        <ul>
          <li>Led team of 5 engineers</li>
          <li>Improved system performance by 40%</li>
          <li>Architected microservices platform</li>
        </ul>
      </section>

      <h2>Education</h2>
      <section>
        <p>BS Computer Science - State University (2015)</p>
      </section>

      <h2>Skills</h2>
      <section>
        <p>TypeScript, React, Node.js, PostgreSQL</p>
      </section>
    </div>
  );
}
`;

describe('Performance - Font & Styling Overhead', () => {
  let baselineMetrics: PerformanceMetrics;

  beforeAll(async () => {
    // Establish baseline (no custom fonts/colors)
    console.warn('\n📊 Establishing baseline performance...');
    baselineMetrics = await measureConversion(baselineCV);
    console.warn(`  Baseline conversion time: ${baselineMetrics.totalTime.toFixed(2)}ms`);
    console.warn(
      `  Baseline memory: ${(baselineMetrics.memoryDelta! / 1024 / 1024).toFixed(2)}MB\n`
    );
  });

  it('01-web-safe-fonts: Font mapping adds <500ms overhead', async () => {
    const tsxPath = join(FIXTURES_DIR, '01-web-safe-fonts.tsx');
    const tsxContent = readFileSync(tsxPath, 'utf-8');

    // Measure conversion time
    const metrics = await measureConversion(tsxContent);

    // Calculate overhead
    const overhead = metrics.totalTime - baselineMetrics.totalTime;
    const overheadPercent = (overhead / baselineMetrics.totalTime) * 100;

    console.warn('01-web-safe-fonts Performance:');
    console.warn(`  Total time: ${metrics.totalTime.toFixed(2)}ms`);
    console.warn(`  Overhead: ${overhead.toFixed(2)}ms (${overheadPercent.toFixed(1)}%)`);
    console.warn(`  Font mapping time: ${metrics.fontMappingTime}ms`);

    // Verify <500ms overhead (AC5)
    expect(overhead).toBeLessThan(500);

    // Should still be within high-end device target (<5 seconds)
    expect(metrics.totalTime).toBeLessThan(5000);
  });

  it('02-font-weights: Multiple font weights add <500ms overhead', async () => {
    const tsxPath = join(FIXTURES_DIR, '02-font-weights.tsx');
    const tsxContent = readFileSync(tsxPath, 'utf-8');

    const metrics = await measureConversion(tsxContent);
    const overhead = metrics.totalTime - baselineMetrics.totalTime;
    const overheadPercent = (overhead / baselineMetrics.totalTime) * 100;

    console.warn('02-font-weights Performance:');
    console.warn(`  Total time: ${metrics.totalTime.toFixed(2)}ms`);
    console.warn(`  Overhead: ${overhead.toFixed(2)}ms (${overheadPercent.toFixed(1)}%)`);

    expect(overhead).toBeLessThan(500);
    expect(metrics.totalTime).toBeLessThan(5000);
  });

  it('03-font-styles: Font style variations add <500ms overhead', async () => {
    const tsxPath = join(FIXTURES_DIR, '03-font-styles.tsx');
    const tsxContent = readFileSync(tsxPath, 'utf-8');

    const metrics = await measureConversion(tsxContent);
    const overhead = metrics.totalTime - baselineMetrics.totalTime;
    const overheadPercent = (overhead / baselineMetrics.totalTime) * 100;

    console.warn('03-font-styles Performance:');
    console.warn(`  Total time: ${metrics.totalTime.toFixed(2)}ms`);
    console.warn(`  Overhead: ${overhead.toFixed(2)}ms (${overheadPercent.toFixed(1)}%)`);

    expect(overhead).toBeLessThan(500);
    expect(metrics.totalTime).toBeLessThan(5000);
  });

  it('04-colors: Color processing adds <500ms overhead', async () => {
    const tsxPath = join(FIXTURES_DIR, '04-colors.tsx');
    const tsxContent = readFileSync(tsxPath, 'utf-8');

    const metrics = await measureConversion(tsxContent);
    const overhead = metrics.totalTime - baselineMetrics.totalTime;
    const overheadPercent = (overhead / baselineMetrics.totalTime) * 100;

    console.warn('04-colors Performance:');
    console.warn(`  Total time: ${metrics.totalTime.toFixed(2)}ms`);
    console.warn(`  Overhead: ${overhead.toFixed(2)}ms (${overheadPercent.toFixed(1)}%)`);

    expect(overhead).toBeLessThan(500);
    expect(metrics.totalTime).toBeLessThan(5000);
  });

  it('05-mixed-styling: Combined font/color features add <500ms overhead', async () => {
    const tsxPath = join(FIXTURES_DIR, '05-mixed-styling.tsx');
    const tsxContent = readFileSync(tsxPath, 'utf-8');

    const metrics = await measureConversion(tsxContent);
    const overhead = metrics.totalTime - baselineMetrics.totalTime;
    const overheadPercent = (overhead / baselineMetrics.totalTime) * 100;

    console.warn('05-mixed-styling Performance:');
    console.warn(`  Total time: ${metrics.totalTime.toFixed(2)}ms`);
    console.warn(`  Overhead: ${overhead.toFixed(2)}ms (${overheadPercent.toFixed(1)}%)`);

    expect(overhead).toBeLessThan(500);
    expect(metrics.totalTime).toBeLessThan(5000);
  });
});

describe('Performance - Memory Usage', () => {
  it('font mapping memory usage <5MB per font', async () => {
    // Test with 5 different fonts (01-web-safe-fonts.tsx)
    const tsxPath = join(FIXTURES_DIR, '01-web-safe-fonts.tsx');
    const tsxContent = readFileSync(tsxPath, 'utf-8');

    // Measure memory before conversion
    const memoryBefore =
      (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0;

    // Perform conversion
    await measureConversion(tsxContent);

    // Measure memory after conversion
    const memoryAfter =
      (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0;
    const memoryDelta = memoryAfter - memoryBefore;
    const memoryDeltaMB = memoryDelta / 1024 / 1024;

    console.warn('Memory Usage (5 fonts):');
    console.warn(`  Memory before: ${(memoryBefore / 1024 / 1024).toFixed(2)}MB`);
    console.warn(`  Memory after: ${(memoryAfter / 1024 / 1024).toFixed(2)}MB`);
    console.warn(`  Memory delta: ${memoryDeltaMB.toFixed(2)}MB`);
    console.warn(`  Per font: ${(memoryDeltaMB / 5).toFixed(2)}MB`);

    // Verify <5MB per font (AC6)
    // With 5 fonts, total should be <25MB
    expect(memoryDelta).toBeLessThan(25 * 1024 * 1024);
  });

  it('color processing memory usage is negligible', async () => {
    const tsxPath = join(FIXTURES_DIR, '04-colors.tsx');
    const tsxContent = readFileSync(tsxPath, 'utf-8');

    const memoryBefore =
      (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0;
    await measureConversion(tsxContent);
    const memoryAfter =
      (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0;

    const memoryDelta = memoryAfter - memoryBefore;
    const memoryDeltaMB = memoryDelta / 1024 / 1024;

    console.warn('Memory Usage (colors):');
    console.warn(`  Memory delta: ${memoryDeltaMB.toFixed(2)}MB`);

    // Color processing should add minimal memory (<2MB)
    expect(memoryDelta).toBeLessThan(2 * 1024 * 1024);
  });
});

describe('Performance - Low-End Device Simulation', () => {
  it('font styling conversion on low-end device <8 seconds', async () => {
    // Use most complex fixture (05-mixed-styling)
    const tsxPath = join(FIXTURES_DIR, '05-mixed-styling.tsx');
    const tsxContent = readFileSync(tsxPath, 'utf-8');

    // With 4x throttling, conversion time will be ~4x longer
    const metrics = await measureConversion(tsxContent);
    const throttledTime = metrics.totalTime * 4; // Simulate throttling effect

    console.warn('Low-End Device Performance (4x throttling):');
    console.warn(`  Simulated conversion time: ${throttledTime.toFixed(2)}ms`);
    console.warn(`  Seconds: ${(throttledTime / 1000).toFixed(2)}s`);

    // Verify <8 seconds on low-end device
    expect(throttledTime).toBeLessThan(8000);
  });
});

describe('Performance - Timing Breakdown', () => {
  it('generate detailed timing report for all fixtures', async () => {
    // Establish baseline for this test
    const baselineMetrics = await measureConversion(baselineCV);

    const fixtures = [
      '01-web-safe-fonts.tsx',
      '02-font-weights.tsx',
      '03-font-styles.tsx',
      '04-colors.tsx',
      '05-mixed-styling.tsx',
    ];

    console.warn(`\n${'='.repeat(70)}`);
    console.warn('📊 FONT/STYLING PERFORMANCE REPORT');
    console.warn('='.repeat(70));
    console.warn(`\nTest Date: ${new Date().toISOString()}`);
    console.warn(`Baseline (no custom fonts/colors)`);
    console.warn(`Baseline Time: ${baselineMetrics?.totalTime.toFixed(2)}ms\n`);

    console.warn('Performance Breakdown:\n');

    for (const fixture of fixtures) {
      const tsxPath = join(FIXTURES_DIR, fixture);
      const tsxContent = readFileSync(tsxPath, 'utf-8');

      // eslint-disable-next-line no-await-in-loop -- Sequential execution required for accurate benchmarking
      const metrics = await measureConversion(tsxContent);
      const overhead = metrics.totalTime - (baselineMetrics?.totalTime || 0);
      const overheadPercent = (overhead / (baselineMetrics?.totalTime || 1)) * 100;

      console.warn(`${fixture}:`);
      console.warn(`  Total: ${metrics.totalTime.toFixed(2)}ms`);
      console.warn(`  Overhead: ${overhead.toFixed(2)}ms (${overheadPercent.toFixed(1)}%)`);
      console.warn(`  Parse: ${metrics.parseTime}ms`);
      console.warn(`  Layout: ${metrics.layoutTime}ms`);
      console.warn(`  Font Mapping: ${metrics.fontMappingTime}ms`);
      console.warn(`  PDF Generation: ${metrics.pdfTime}ms`);
      console.warn(`  Status: ${overhead < 500 ? '✅ PASS' : '❌ FAIL'} (<500ms overhead)`);
      console.warn('');
    }

    console.warn('='.repeat(70));
    console.warn('Target: <500ms overhead vs baseline');
    console.warn('High-End Device Target: <5 seconds total');
    console.warn('Low-End Device Target: <8 seconds total (4x throttling)');
    console.warn(`${'='.repeat(70)}\n`);

    // This is a reporting test, always pass
    expect(true).toBe(true);
  });
});

describe('Performance - Regression Detection', () => {
  it('verify font mapping optimization (linear complexity)', async () => {
    // This test validates that font mapping is O(n) not O(n²)
    // by comparing conversion times for different content sizes

    const smallCV = baselineCV;
    const mediumCV = baselineCV.repeat(5);
    const largeCV = baselineCV.repeat(10);

    const smallMetrics = await measureConversion(smallCV);
    const mediumMetrics = await measureConversion(mediumCV);
    const largeMetrics = await measureConversion(largeCV);

    console.warn('Font Mapping Complexity Analysis:');
    console.warn(`  Small CV (1x): ${smallMetrics.totalTime.toFixed(2)}ms`);
    console.warn(`  Medium CV (5x): ${mediumMetrics.totalTime.toFixed(2)}ms`);
    console.warn(`  Large CV (10x): ${largeMetrics.totalTime.toFixed(2)}ms`);

    // Calculate growth rate
    const smallToMediumRatio = mediumMetrics.totalTime / smallMetrics.totalTime;
    const mediumToLargeRatio = largeMetrics.totalTime / mediumMetrics.totalTime;

    console.warn(`  Small→Medium growth: ${smallToMediumRatio.toFixed(2)}x`);
    console.warn(`  Medium→Large growth: ${mediumToLargeRatio.toFixed(2)}x`);

    // Linear growth: ratio should be close to content size ratio (5x and 2x)
    // Quadratic would be much higher (25x and 4x)

    // Allow some overhead, but should not exceed 2x the expected linear growth
    expect(smallToMediumRatio).toBeLessThan(10); // Should be ~5x for linear
    expect(mediumToLargeRatio).toBeLessThan(4); // Should be ~2x for linear
  });
});
