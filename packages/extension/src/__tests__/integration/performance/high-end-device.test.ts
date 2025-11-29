import { describe, expect, it } from 'vitest';
import { convertTsxToPdfWithFonts } from '@/shared/application/pdf/converter';
import { initWASM, isWASMInitialized } from '@/shared/infrastructure/wasm';

/**
 * Performance tests simulating high-end devices.
 *
 * No CPU/network throttling applied.
 *
 * Performance Targets:
 * - Single-page CV: <5 seconds
 * - Multi-page CV: <10 seconds
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
    filename: 'high-end-benchmark.pdf',
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

describe('Performance - High-End Device', () => {
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

  it('should convert single-page CV within 5 seconds on high-end device', async () => {
    // Use real WASM conversion
    const result = await measureConversion(sampleTSX);

    console.warn(`High-end device conversion time: ${result.totalTime.toFixed(2)}ms`);
    console.warn(`  Parse: ${result.parseTime ?? 0}ms`);
    console.warn(`  Layout: ${result.layoutTime ?? 0}ms`);
    console.warn(`  PDF: ${result.pdfTime ?? 0}ms`);

    // Verify performance target (<5 seconds for single-page)
    expect(result.totalTime).toBeLessThan(5000);
  });

  it('should benchmark conversion performance', async () => {
    const conversionTimes: number[] = [];
    const iterations = 3;

    for (let i = 0; i < iterations; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- Sequential execution required for accurate performance measurement
      const result = await measureConversion(sampleTSX);
      conversionTimes.push(result.totalTime);

      console.warn(`Iteration ${i + 1}: ${result.totalTime.toFixed(2)}ms`);

      // Wait a bit between iterations
      // eslint-disable-next-line no-await-in-loop -- Intentional delay between measurements
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Calculate statistics
    const avgTime = conversionTimes.reduce((a, b) => a + b, 0) / conversionTimes.length;
    const minTime = Math.min(...conversionTimes);
    const maxTime = Math.max(...conversionTimes);

    console.warn(`Performance statistics:`);
    console.warn(`  Average: ${avgTime.toFixed(2)}ms`);
    console.warn(`  Min: ${minTime.toFixed(2)}ms`);
    console.warn(`  Max: ${maxTime.toFixed(2)}ms`);

    // Verify average is within target
    expect(avgTime).toBeLessThan(5000);
  });
});
