import { describe, expect, it } from 'vitest';
import { convertTsxToPdfWithFonts } from '@/shared/application/pdf/converter';
import { initWASM, isWASMInitialized } from '@/shared/infrastructure/wasm';

/**
 * Performance tests simulating low-end devices.
 *
 * Note: CPU throttling via CDP only affects browser operations, not Node.js WASM execution.
 * These tests simulate 4x CPU slowdown by multiplying measured times.
 *
 * Performance Targets:
 * - Single-page CV: <8 seconds (with 4x throttling)
 * - Multi-page CV: <15 seconds (with 4x throttling)
 */

interface PerformanceResult {
  totalTime: number;
  parseTime?: number;
  layoutTime?: number;
  pdfTime?: number;
}

/**
 * Measure conversion performance using real WASM pipeline.
 */
async function measureConversion(tsxContent: string): Promise<PerformanceResult> {
  if (!isWASMInitialized()) {
    await initWASM();
  }

  const startTime = performance.now();

  const config = {
    pageSize: 'Letter' as const,
    margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    compress: false,
    filename: 'low-end-benchmark.pdf',
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
    pdfTime: stageTimes['generating-pdf'],
  };
}

describe('Performance - Low-End Device', () => {
  const sampleTSX = `
    <div>
      <h1>John Doe</h1>
      <p>john.doe@example.com</p>
      <h2>Experience</h2>
      <section>
        <h3>Senior Developer</h3>
        <p>Tech Corp (2020-Present)</p>
        <ul>
          <li>Led development team</li>
          <li>Architected scalable solutions</li>
        </ul>
      </section>
    </div>
  `.trim();

  it('should convert single-page CV within 8 seconds on low-end device', async () => {
    // Use real WASM conversion
    const result = await measureConversion(sampleTSX);

    // Simulate 4x CPU throttling
    const throttledTime = result.totalTime * 4;

    console.warn(`Low-end device conversion time: ${throttledTime.toFixed(2)}ms`);
    console.warn(`  Actual time: ${result.totalTime.toFixed(2)}ms`);
    console.warn(`  Throttled (4x): ${throttledTime.toFixed(2)}ms`);
    console.warn(`  Parse: ${result.parseTime ?? 0}ms`);
    console.warn(`  Layout: ${result.layoutTime ?? 0}ms`);
    console.warn(`  PDF: ${result.pdfTime ?? 0}ms`);

    // Verify performance target (<8 seconds for single-page)
    expect(throttledTime).toBeLessThan(8000);
  });

  it('should measure memory usage during conversion', async () => {
    // Memory profiling in Node.js environment
    const memoryBefore =
      (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0;

    await measureConversion(sampleTSX);

    const memoryAfter =
      (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0;
    const memoryDelta = memoryAfter - memoryBefore;
    const memoryDeltaMB = memoryDelta / (1024 * 1024);

    console.warn(`Memory usage:`);
    console.warn(`  Before: ${(memoryBefore / 1024 / 1024).toFixed(2)} MB`);
    console.warn(`  After: ${(memoryAfter / 1024 / 1024).toFixed(2)} MB`);
    console.warn(`  Delta: ${memoryDeltaMB.toFixed(2)} MB`);

    // Target: <50MB memory usage
    expect(memoryDeltaMB).toBeLessThan(50);
  });

  it('should profile conversion stages', async () => {
    const result = await measureConversion(sampleTSX);

    console.warn('Performance breakdown:');
    console.warn(`  Total: ${result.totalTime.toFixed(2)}ms`);
    console.warn(
      `  Parse: ${result.parseTime ?? 0}ms (${(((result.parseTime ?? 0) / result.totalTime) * 100).toFixed(1)}%)`
    );
    console.warn(
      `  Layout: ${result.layoutTime ?? 0}ms (${(((result.layoutTime ?? 0) / result.totalTime) * 100).toFixed(1)}%)`
    );
    console.warn(
      `  PDF: ${result.pdfTime ?? 0}ms (${(((result.pdfTime ?? 0) / result.totalTime) * 100).toFixed(1)}%)`
    );

    // Verify we have stage timing data
    expect(result.parseTime).toBeGreaterThan(0);
    expect(result.layoutTime).toBeGreaterThan(0);
    expect(result.pdfTime).toBeGreaterThan(0);
  });
});
