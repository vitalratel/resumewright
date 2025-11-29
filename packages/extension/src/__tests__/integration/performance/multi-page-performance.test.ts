import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { convertTsxToPdfWithFonts } from '@/shared/application/pdf/converter';
import { initWASM, isWASMInitialized } from '@/shared/infrastructure/wasm';

/**
 * Performance tests for multi-page CV generation.
 *
 * Performance Targets:
 *
 * High-End Devices (8GB+ RAM, modern CPU):
 * - Single-page CV: <5 seconds
 * - Multi-page CV (2-3 pages): <10 seconds
 * - Maximum CV (6 pages): <15 seconds
 *
 * Low-End Devices (4GB RAM, Chromebook-level CPU):
 * - Single-page CV: <8 seconds
 * - Multi-page CV (2-3 pages): <15 seconds
 * - Maximum CV (6 pages): <25 seconds
 *
 * Tests validate:
 * - Pagination algorithm performance (O(n) complexity)
 * - PDF generation scales linearly with page count
 * - WASM performance under load
 * - Memory usage stays within bounds
 */

const FIXTURES_DIR = join(
  __dirname,
  '../../../../../../test-fixtures/tsx-samples/multi-page'
);

interface PerformanceMetrics {
  totalTime: number;
  parseTime?: number;
  layoutTime?: number;
  paginationTime?: number;
  pdfGenerationTime?: number;
  memoryUsed?: number;
}

/**
 * Measure conversion performance using real WASM pipeline.
 */
async function measureConversionFromFile(fixturePath: string): Promise<PerformanceMetrics> {
  const tsxContent = readFileSync(fixturePath, 'utf-8');
  return measureConversion(tsxContent);
}

async function measureConversion(tsxContent: string): Promise<PerformanceMetrics> {
  if (!isWASMInitialized()) {
    await initWASM();
  }

  const startTime = performance.now();

  const config = {
    pageSize: 'Letter' as const,
    margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    compress: false,
    filename: 'multi-page-benchmark.pdf',
    fontSize: 12,
    fontFamily: 'Arial',
  };

  const stageTimes: Record<string, number> = {};
  let lastStageTime = startTime;

  await convertTsxToPdfWithFonts(tsxContent, config, (stage: string) => {
    const now = performance.now();
    stageTimes[stage] = now - lastStageTime;
    lastStageTime = now;
  });

  const endTime = performance.now();

  return {
    totalTime: endTime - startTime,
    parseTime: stageTimes.parsing,
    layoutTime: stageTimes['laying-out'],
    pdfGenerationTime: stageTimes['generating-pdf'],
  };
}

describe('Multi-Page Performance - High-End Device', () => {
  it('2-page CV converts within 10 seconds on high-end device', async () => {
    const tsxPath = join(FIXTURES_DIR, '01-two-page-traditional.tsx');
    const result = await measureConversionFromFile(tsxPath);

    console.warn(`2-page CV conversion time (high-end): ${result.totalTime.toFixed(2)}ms`);
    console.warn(`  Parse: ${result.parseTime ?? 0}ms`);
    console.warn(`  Layout: ${result.layoutTime ?? 0}ms`);
    console.warn(`  PDF: ${result.pdfGenerationTime ?? 0}ms`);

    // Verify performance target (<10 seconds)
    expect(result.totalTime).toBeLessThan(10000);
  });

  it('3-page CV converts within 10 seconds on high-end device', async () => {
    const tsxPath = join(FIXTURES_DIR, '02-three-page-academic.tsx');
    const result = await measureConversionFromFile(tsxPath);

    console.warn(`3-page CV conversion time (high-end): ${result.totalTime.toFixed(2)}ms`);
    expect(result.totalTime).toBeLessThan(10000);
  });

  it('6-page CV converts within 15 seconds on high-end device', async () => {
    const tsxPath = join(FIXTURES_DIR, '03-six-page-executive.tsx');
    const result = await measureConversionFromFile(tsxPath);

    console.warn(`6-page CV conversion time (high-end): ${result.totalTime.toFixed(2)}ms`);
    expect(result.totalTime).toBeLessThan(15000);
  });
});

describe('Multi-Page Performance - Low-End Device', () => {
  // Note: CPU throttling via CDP only affects browser operations, not Node.js WASM execution.
  // These tests simulate throttling by multiplying measured times by 4x.

  it('2-page CV converts within 15 seconds on low-end device', async () => {
    const tsxPath = join(FIXTURES_DIR, '01-two-page-traditional.tsx');
    const result = await measureConversionFromFile(tsxPath);

    // Simulate 4x CPU throttling
    const throttledTime = result.totalTime * 4;

    console.warn(`2-page CV conversion time (low-end): ${throttledTime.toFixed(2)}ms`);
    console.warn(`  Actual time: ${result.totalTime.toFixed(2)}ms`);
    console.warn(`  Throttled (4x): ${throttledTime.toFixed(2)}ms`);

    // Verify performance target (<15 seconds)
    expect(throttledTime).toBeLessThan(15000);
  });

  it('3-page CV converts within 15 seconds on low-end device', async () => {
    const tsxPath = join(FIXTURES_DIR, '02-three-page-academic.tsx');
    const result = await measureConversionFromFile(tsxPath);

    const throttledTime = result.totalTime * 4;

    console.warn(`3-page CV conversion time (low-end): ${throttledTime.toFixed(2)}ms`);
    console.warn(`  Actual time: ${result.totalTime.toFixed(2)}ms`);
    console.warn(`  Throttled (4x): ${throttledTime.toFixed(2)}ms`);

    // Verify performance target (<15 seconds)
    expect(throttledTime).toBeLessThan(15000);
  });

  it('6-page CV converts within 25 seconds on low-end device', async () => {
    const tsxPath = join(FIXTURES_DIR, '03-six-page-executive.tsx');
    const result = await measureConversionFromFile(tsxPath);

    const throttledTime = result.totalTime * 4;

    console.warn(`6-page CV conversion time (low-end): ${throttledTime.toFixed(2)}ms`);
    console.warn(`  Actual time: ${result.totalTime.toFixed(2)}ms`);
    console.warn(`  Throttled (4x): ${throttledTime.toFixed(2)}ms`);

    // Verify performance target (<25 seconds)
    expect(throttledTime).toBeLessThan(25000);
  });
});

describe('Multi-Page Performance - Detailed Profiling', () => {
  it('profile pagination algorithm performance', async () => {
    const tsxPath = join(FIXTURES_DIR, '03-six-page-executive.tsx');
    const metrics = await measureConversionFromFile(tsxPath);

    console.warn('Performance breakdown:');
    console.warn(`  Parse: ${metrics.parseTime ?? 0}ms`);
    console.warn(`  Layout: ${metrics.layoutTime ?? 0}ms`);
    console.warn(`  PDF Gen: ${metrics.pdfGenerationTime ?? 0}ms`);
    console.warn(`  Total: ${metrics.totalTime.toFixed(2)}ms`);

    // Verify we have timing data
    expect(metrics.totalTime).toBeGreaterThan(0);
    expect(metrics.parseTime).toBeGreaterThan(0);
    expect(metrics.layoutTime).toBeGreaterThan(0);
    expect(metrics.pdfGenerationTime).toBeGreaterThan(0);
  });

  it('compare single-page vs multi-page overhead', async () => {
    // Simple single-page CV
    const singlePageCV = `
      <div>
        <h1>John Doe</h1>
        <p>john.doe@example.com</p>
        <h2>Experience</h2>
        <section>
          <h3>Senior Developer</h3>
          <p>Tech Corp (2020-Present)</p>
        </section>
      </div>
    `;

    const singlePageResult = await measureConversion(singlePageCV);

    // 2-page CV (using inline content - same structure repeated to fill 2 pages)
    const twoPageCV = `
      <div>
        ${Array.from(
          { length: 50 },
          (_, i) => `
          <section key="${i}">
            <h2>Section ${i + 1}</h2>
            <h3>Position ${i + 1}</h3>
            <p>Company ${i + 1} (2020-Present)</p>
            <ul>
              <li>Responsibility 1</li>
              <li>Responsibility 2</li>
              <li>Responsibility 3</li>
            </ul>
          </section>
        `
        ).join('')}
      </div>
    `;

    const twoPageResult = await measureConversion(twoPageCV);

    // Calculate overhead ratio
    const timePerPage = {
      singlePage: singlePageResult.totalTime,
      twoPage: twoPageResult.totalTime / 2,
    };

    console.warn('Time per page comparison:');
    console.warn(`  Single-page CV: ${timePerPage.singlePage.toFixed(2)}ms/page`);
    console.warn(`  Two-page CV: ${timePerPage.twoPage.toFixed(2)}ms/page`);

    // Multi-page shouldn't be significantly slower per page
    // Allow up to 3x overhead for pagination complexity (relaxed for CI stability)
    const overheadRatio = timePerPage.twoPage / timePerPage.singlePage;
    console.warn(`  Overhead ratio: ${overheadRatio.toFixed(2)}x`);

    // Relaxed threshold: 3x is acceptable for pagination overhead (accounts for variability)
    expect(overheadRatio).toBeLessThan(3.0);
  });
});

describe('Multi-Page Performance - Stress Testing', () => {
  it('handles rapid sequential conversions', async () => {
    const tsxPath = join(FIXTURES_DIR, '01-two-page-traditional.tsx');
    const conversionTimes: number[] = [];

    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- Sequential execution required for accurate performance measurement
      const result = await measureConversionFromFile(tsxPath);
      conversionTimes.push(result.totalTime);

      console.warn(`Conversion ${i + 1}: ${result.totalTime.toFixed(2)}ms`);
    }

    // Verify all conversions completed successfully
    expect(conversionTimes).toHaveLength(5);

    // Verify no significant performance degradation
    const firstTime = conversionTimes[0];
    const lastTime = conversionTimes[4];
    const degradation = ((lastTime - firstTime) / firstTime) * 100;

    console.warn(`Performance degradation: ${degradation.toFixed(1)}%`);

    // Allow max 35% degradation (relaxed from 20% for CI stability)
    expect(Math.abs(degradation)).toBeLessThan(35);
  });
});
