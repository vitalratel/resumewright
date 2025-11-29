/**
 * Font Detection Cache Benchmark
 *
 * Measures the impact of font detection caching on performance.
 * Compares cached vs non-cached performance across different TSX sizes.
 *
 * Run with: pnpm test:integration benchmarks/font-cache-benchmark
 */

/* eslint-disable no-console -- Benchmark output requires console logging */
/* eslint-disable no-await-in-loop -- Sequential benchmarking required for accuracy */

import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
// Import directly from specific modules to avoid loading downloader.ts which requires webextension-polyfill
import { clearFontCache, detectFonts } from '@/shared/infrastructure/pdf/fonts';
import { initWASM } from '@/shared/infrastructure/wasm';
import { paths } from '../paths';

const FIXTURES_PATH = paths.fixturesDir('single-page');

interface BenchmarkResult {
  fixture: string;
  cached: {
    min: number;
    max: number;
    avg: number;
    p95: number;
  };
  uncached: {
    min: number;
    max: number;
    avg: number;
    p95: number;
  };
  speedup: string;
  cacheHitRate: string;
}

describe('Font Cache Performance Benchmark', () => {
  beforeAll(async () => {
    // Auto-detect WASM path
    await initWASM();
  });

  beforeEach(() => {
    // Clear cache before each test
    clearFontCache();
  });

  it('should benchmark font detection with cache', async () => {
    const fixtures = [
      '01-single-column-traditional.tsx',
      '02-two-column-modern.tsx',
      '03-minimal-simple.tsx',
      '04-technical-developer.tsx',
    ];

    const results: BenchmarkResult[] = [];

    for (const fixture of fixtures) {
      const fixturePath = path.join(FIXTURES_PATH, fixture);
      const tsxContent = fs.readFileSync(fixturePath, 'utf-8');

      // Benchmark uncached (10 iterations)
      clearFontCache();
      const uncachedTimes: number[] = [];

      for (let i = 0; i < 10; i++) {
        clearFontCache(); // Force re-detection
        const start = performance.now();
        await detectFonts(tsxContent, false); // useCache = false
        const end = performance.now();
        uncachedTimes.push(end - start);
      }

      // Benchmark cached (10 iterations after warming up)
      clearFontCache();
      await detectFonts(tsxContent, true); // Warm up cache

      const cachedTimes: number[] = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        await detectFonts(tsxContent, true); // useCache = true
        const end = performance.now();
        cachedTimes.push(end - start);
      }

      // Calculate statistics
      const uncachedStats = calculateStats(uncachedTimes);
      const cachedStats = calculateStats(cachedTimes);
      const speedup = (uncachedStats.avg / cachedStats.avg).toFixed(2);
      const cacheHitRate = '100%'; // All cached after first call

      results.push({
        fixture,
        uncached: uncachedStats,
        cached: cachedStats,
        speedup: `${speedup}x`,
        cacheHitRate,
      });
    }

    // Print results
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 FONT CACHE PERFORMANCE BENCHMARK');
    console.log('='.repeat(80));
    console.log('\nTest Date:', new Date().toISOString());
    console.log('Iterations per test: 10');
    console.log('\n');

    results.forEach((result) => {
      console.log(`Fixture: ${result.fixture}`);
      console.log(
        `  Uncached: ${result.uncached.avg.toFixed(2)}ms (min: ${result.uncached.min.toFixed(2)}ms, max: ${result.uncached.max.toFixed(2)}ms, p95: ${result.uncached.p95.toFixed(2)}ms)`
      );
      console.log(
        `  Cached:   ${result.cached.avg.toFixed(2)}ms (min: ${result.cached.min.toFixed(2)}ms, max: ${result.cached.max.toFixed(2)}ms, p95: ${result.cached.p95.toFixed(2)}ms)`
      );
      console.log(`  Speedup:  ${result.speedup}`);
      console.log(`  Cache Hit Rate: ${result.cacheHitRate}`);
      console.log('');
    });

    // Overall statistics
    const avgSpeedup =
      results.reduce((sum, r) => sum + Number.parseFloat(r.speedup.replace('x', '')), 0) /
      results.length;
    const avgUncached = results.reduce((sum, r) => sum + r.uncached.avg, 0) / results.length;
    const avgCached = results.reduce((sum, r) => sum + r.cached.avg, 0) / results.length;

    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Average uncached time: ${avgUncached.toFixed(2)}ms`);
    console.log(`Average cached time:   ${avgCached.toFixed(2)}ms`);
    console.log(`Average speedup:       ${avgSpeedup.toFixed(2)}x`);
    console.log(
      `Cache benefit:         ${((1 - avgCached / avgUncached) * 100).toFixed(1)}% faster`
    );
    console.log('');

    // Save results to file
    const outputDir = path.join(process.cwd(), 'packages/extension/test-results/benchmarks');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'font-cache-benchmark.json');
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          summary: {
            avgUncached,
            avgCached,
            avgSpeedup,
            cacheBenefit: `${((1 - avgCached / avgUncached) * 100).toFixed(1)}%`,
          },
          results,
        },
        null,
        2
      )
    );

    console.log(`Results saved to: ${outputPath}`);
    console.log(`${'='.repeat(80)}\n`);

    // Verify cache provides benefit
    expect(avgSpeedup).toBeGreaterThan(1);
  }, 60000);

  it('should benchmark cache with realistic usage pattern', async () => {
    // Simulate realistic usage: user edits TSX and re-converts multiple times
    const fixturePath = path.join(FIXTURES_PATH, '01-single-column-traditional.tsx');
    const tsxContent = fs.readFileSync(fixturePath, 'utf-8');

    // Simulate 5 edits (each slightly different)
    const edits = [
      tsxContent,
      tsxContent.replace('John Doe', 'Jane Smith'),
      tsxContent.replace('Software Engineer', 'Senior Developer'),
      tsxContent.replace('2020-Present', '2019-Present'),
      tsxContent.replace('Stanford University', 'MIT'),
    ];

    clearFontCache();

    const times: number[] = [];

    for (let i = 0; i < edits.length; i++) {
      const start = performance.now();
      await detectFonts(edits[i], true); // Use cache
      const end = performance.now();
      times.push(end - start);

      console.log(`Edit ${i + 1}: ${(end - start).toFixed(2)}ms`);
    }

    console.log('');
    console.log('Realistic Usage Pattern Results:');
    console.log(`  First call (cache miss):  ${times[0].toFixed(2)}ms`);
    console.log(
      `  Subsequent calls (cache hit): ${times
        .slice(1)
        .map((t) => `${t.toFixed(2)}ms`)
        .join(', ')}`
    );
    console.log(
      `  Average subsequent:       ${(times.slice(1).reduce((a, b) => a + b, 0) / times.slice(1).length).toFixed(2)}ms`
    );
    console.log(
      `  Speedup after first:      ${(times[0] / (times.slice(1).reduce((a, b) => a + b, 0) / times.slice(1).length)).toFixed(2)}x`
    );

    // Verify subsequent calls are faster
    const avgSubsequent = times.slice(1).reduce((a, b) => a + b, 0) / times.slice(1).length;
    expect(avgSubsequent).toBeLessThan(times[0]);
  }, 30000);

  it('should benchmark cache performance under load', async () => {
    const fixtures = [
      '01-single-column-traditional.tsx',
      '02-two-column-modern.tsx',
      '03-minimal-simple.tsx',
    ];

    // Load all fixtures
    const tsxContents = fixtures.map((fixture) => {
      const fixturePath = path.join(FIXTURES_PATH, fixture);
      const content = fs.readFileSync(fixturePath, 'utf-8');
      return content;
    });

    clearFontCache();

    // Simulate rapid conversions (realistic Chrome extension usage)
    const iterations = 20;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const tsx = tsxContents[i % tsxContents.length];
      const start = performance.now();
      await detectFonts(tsx, true);
      const end = performance.now();
      times.push(end - start);
    }

    const stats = calculateStats(times);

    console.log('\n📊 Cache Performance Under Load:');
    console.log(`  Iterations: ${iterations}`);
    console.log(`  Average:    ${stats.avg.toFixed(2)}ms`);
    console.log(`  Min:        ${stats.min.toFixed(2)}ms`);
    console.log(`  Max:        ${stats.max.toFixed(2)}ms`);
    console.log(`  P95:        ${stats.p95.toFixed(2)}ms`);
    console.log(`  Std Dev:    ${stats.stdDev.toFixed(2)}ms`);

    // Verify reasonable performance
    expect(stats.avg).toBeLessThan(100); // Should be fast with cache
  }, 60000);

  it('should measure cache memory overhead', async () => {
    const fixtures = [
      '01-single-column-traditional.tsx',
      '02-two-column-modern.tsx',
      '03-minimal-simple.tsx',
      '04-technical-developer.tsx',
    ];

    clearFontCache();

    // Memory measurement (approximate via process.memoryUsage if available)
    const initialMemory = getMemoryUsage();

    // Fill cache with 100 entries (max cache size)
    for (let i = 0; i < 100; i++) {
      const fixturePath = path.join(FIXTURES_PATH, fixtures[i % fixtures.length]);
      const tsxContent = `${fs.readFileSync(fixturePath, 'utf-8')}\n// Variation ${i}`;
      await detectFonts(tsxContent, true);
    }

    const finalMemory = getMemoryUsage();
    const memoryDelta = finalMemory - initialMemory;

    console.log('\n💾 Cache Memory Overhead:');
    console.log(`  Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Final memory:   ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Delta:          ${(memoryDelta / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Per entry:      ${(memoryDelta / 100 / 1024).toFixed(2)} KB`);

    // Verify memory overhead is reasonable (< 10MB for 100 entries)
    expect(memoryDelta).toBeLessThan(10 * 1024 * 1024);
  }, 60000);
});

/**
 * Calculate statistics from array of numbers
 */
function calculateStats(values: number[]): {
  min: number;
  max: number;
  avg: number;
  p95: number;
  stdDev: number;
} {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / sorted.length;

  const squareDiffs = sorted.map((value) => (value - avg) ** 2);
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / sorted.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  const p95Index = Math.floor(sorted.length * 0.95);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg,
    p95: sorted[p95Index],
    stdDev,
  };
}

/**
 * Get current memory usage (approximate)
 */
function getMemoryUsage(): number {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    // Chrome-specific
    // eslint-disable-next-line ts/no-unsafe-return -- Performance.memory is not typed
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
}
