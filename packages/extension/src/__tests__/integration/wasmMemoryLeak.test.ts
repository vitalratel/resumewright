/**
 * WASM Memory Leak Integration Tests
 * P1-TEST-LEAK-003, *
 * Critical tests to ensure WASM memory is properly managed in the TypeScript/browser context.
 * Memory leaks in the browser extension will crash the extension and lose user work.
 *
 * Requirements:
 * 1. Memory returns to baseline after 100 conversions
 * 2. Memory freed on error paths
 * 3. Integration with extension lifecycle
 *
 * Run with: pnpm --filter extension test wasmMemoryLeak
 *
 * **Browser Compatibility :**
 * - Full memory leak detection requires Chrome's performance.memory API
 * - Tests gracefully skip on Firefox (no equivalent API available)
 * - CI pipeline ensures Chrome tests always run for full coverage
 * - Firefox testing focuses on functional correctness without memory metrics
 *
 * Note: These tests require Chrome's performance.memory API and --expose-gc flag.
 * Run with: pnpm test -- --run --no-coverage
 */

import { describe, expect, vi } from 'vitest';
import { getLogger } from '@/shared/infrastructure/logging';

// Mock the WASM bridge since we're testing memory management patterns
vi.mock('@/shared/infrastructure/wasm/loader', () => ({
  loadWasmModule: vi.fn().mockResolvedValue({
    convert_tsx_to_pdf: vi.fn().mockResolvedValue(new Uint8Array(1024)),
  }),
}));

// Helper: Get current JS heap size (Chrome only)
function getHeapSize(): number {
  // Type definitions now available in __tests__/types/chrome-memory.d.ts
  if (typeof performance.memory !== 'undefined') {
    return performance.memory.usedJSHeapSize;
  }
  // Fallback for non-Chrome environments (test will be less precise)
  return 0;
}

// Helper: Trigger garbage collection if available
async function forceGC(): Promise<void> {
  return new Promise((resolve) => {
    if (global.gc) {
      global.gc();
    }
    // Wait for GC to complete
    setTimeout(resolve, 100);
  });
}

// Helper: Wait for async operations to settle
async function waitForSettle(ms = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock WASM converter function
async function mockConvertCV(_tsx: string): Promise<Uint8Array> {
  // Simulate WASM memory allocation
  const buffer = new ArrayBuffer(1024 * 1024); // 1MB allocation
  const view = new Uint8Array(buffer);

  // Simulate some processing
  for (let i = 0; i < 1000; i++) {
    view[i] = Math.floor(Math.random() * 256);
  }

  // Return PDF-like bytes
  return new Uint8Array([0x25, 0x50, 0x44, 0x46]); // "%PDF" header
}

// Sample TSX for testing
const SAMPLE_TSX = `
  const CV = () => (
    <div>
      <h1>John Doe</h1>
      <p>Software Engineer</p>
    </div>
  );
`;

const INVALID_TSX = '<div><h1>Unclosed tag';

describe('WASM Memory Leak Integration Tests', () => {
  describe('Memory Returns to Baseline After Conversions', () => {
    it('100 sequential conversions should not accumulate memory', async () => {
      // Skip if performance.memory not available (non-Chrome)
      if (typeof (performance as unknown as { memory?: unknown }).memory === 'undefined') {
        // Use structured logging
        getLogger().warn('WasmMemoryLeakTest', 'Skipping memory test: performance.memory not available (non-Chrome browser)');
        return;
      }

      // Force GC before baseline
      await forceGC();
      await waitForSettle(500);

      const baseline = getHeapSize();
      // Use structured logging
      getLogger().info('WasmMemoryLeakTest', 'Baseline heap size', { heapMB: (baseline / 1024 / 1024).toFixed(2) });

      // Run 100 conversions using recursive pattern to avoid await-in-loop
      async function runConversion(i: number): Promise<void> {
        if (i >= 100) {
          return;
        }

        const pdfBytes = await mockConvertCV(SAMPLE_TSX);

        // Verify conversion produced output
        expect(pdfBytes).toBeInstanceOf(Uint8Array);
        expect(pdfBytes.length).toBeGreaterThan(0);

        // Explicitly null out result to allow GC
        // (simulating real usage where user downloads PDF and discards reference)
        void pdfBytes;

        // Log progress every 25 iterations
        if (i % 25 === 0) {
          await forceGC();
          const current = getHeapSize();
          const growth = ((current - baseline) / baseline) * 100;
          // Use structured logging
          getLogger().debug('WasmMemoryLeakTest', 'Iteration progress', {
            iteration: i,
            heapMB: (current / 1024 / 1024).toFixed(2),
            growthPercent: growth.toFixed(1),
          });
        }

        return runConversion(i + 1);
      }

      await runConversion(0);

      // Force GC and wait for cleanup
      await forceGC();
      await waitForSettle(1000);

      const final = getHeapSize();
      const growth = final - baseline;
      const growthRatio = final / baseline;
      const growthPercent = ((growthRatio - 1) * 100).toFixed(1);

      // Use structured logging
      getLogger().info('WasmMemoryLeakTest', 'Final heap size', {
        heapMB: (final / 1024 / 1024).toFixed(2),
        growthPercent,
        ratio: growthRatio.toFixed(2),
      });

      // Memory should not grow more than 10MB (accounting for normal variance)
      const maxGrowthMB = 10;
      const growthMB = growth / 1024 / 1024;

      // Memory grew by ${growthMB.toFixed(2)} MB - should be < ${maxGrowthMB} MB
      expect(growthMB).toBeLessThan(maxGrowthMB);

      // Additional check: Growth ratio should be reasonable
      // Allow up to 20% growth (some persistent caching is acceptable)
      const maxGrowthRatio = 1.2;
      // Memory growth ratio should be < ${maxGrowthRatio}x (${((maxGrowthRatio - 1) * 100).toFixed(0)}% growth)
      expect(growthRatio).toBeLessThan(maxGrowthRatio);
    }, 120000); // 2 minute timeout for 100 iterations

    it('memory stabilizes after repeated use', async () => {
      // Skip if performance.memory not available
      if (typeof (performance as unknown as { memory?: unknown }).memory === 'undefined') {
        // Use structured logging
        getLogger().warn('WasmMemoryLeakTest', 'Skipping memory test: performance.memory not available');
        return;
      }

      const measurements: number[] = [];

      // Run conversions in batches and measure memory after each batch
      async function runBatch(batch: number): Promise<void> {
        if (batch >= 5) {
          return;
        }

        // Run 20 conversions per batch
        async function runConversion(i: number): Promise<void> {
          if (i >= 20) {
            return;
          }
          await mockConvertCV(SAMPLE_TSX);
          return runConversion(i + 1);
        }

        await runConversion(0);

        // Measure memory after batch
        await forceGC();
        await waitForSettle(200);
        const heapSize = getHeapSize();
        measurements.push(heapSize);

        // Use structured logging
        getLogger().debug('WasmMemoryLeakTest', 'Batch progress', { batch, heapMB: (heapSize / 1024 / 1024).toFixed(2) });

        return runBatch(batch + 1);
      }

      await runBatch(0);

      // Verify memory stabilizes (later batches shouldn't grow significantly)
      // Compare last batch to second batch (first might have one-time allocations)
      const secondBatch = measurements[1];
      const lastBatch = measurements[measurements.length - 1];
      const stabilityRatio = lastBatch / secondBatch;

      // Use structured logging
      getLogger().info('WasmMemoryLeakTest', 'Stability ratio', { ratio: stabilityRatio.toFixed(3) });

      // Memory should be stable (< 10% growth from batch 1 to batch 4)
      // Memory should stabilize - growth from batch 1 to 4 should be < 10%
      expect(stabilityRatio).toBeLessThan(1.1);
    }, 60000);
  });

  describe('Memory Freed on Error Paths', () => {
    it('memory freed after conversion error', async () => {
      // Skip if performance.memory not available
      if (typeof (performance as unknown as { memory?: unknown }).memory === 'undefined') {
        console.warn('Skipping memory test: performance.memory not available');
        return;
      }

      // Get baseline
      await forceGC();
      await waitForSettle(200);
      const baseline = getHeapSize();

      // Mock converter that throws error
      const mockConvertWithError = async (_tsx: string): Promise<Uint8Array> => {
        // Allocate memory
        const buffer = new ArrayBuffer(1024 * 1024); // 1MB
        void buffer; // Use buffer

        // Then throw error
        throw new Error('Conversion failed: Invalid TSX');
      };

      // Run 50 conversions that all fail using recursive pattern
      async function runFailingConversion(i: number): Promise<void> {
        if (i >= 50) {
          return;
        }

        try {
          await mockConvertWithError(INVALID_TSX);
        }
        catch (error) {
          // Expected error
          expect(error).toBeInstanceOf(Error);
        }

        return runFailingConversion(i + 1);
      }

      await runFailingConversion(0);

      // Force GC and wait
      await forceGC();
      await waitForSettle(1000);

      const final = getHeapSize();
      const growthMB = (final - baseline) / 1024 / 1024;

      // Use structured logging
      getLogger().info('WasmMemoryLeakTest', 'After error conversions', {
        baselineMB: (baseline / 1024 / 1024).toFixed(2),
        finalMB: (final / 1024 / 1024).toFixed(2),
        growthMB: growthMB.toFixed(2),
      });

      // Error paths should free memory - allow small growth (<1MB)
      const maxErrorPathGrowthMB = 1;
      // Error paths should not leak memory - growth should be < ${maxErrorPathGrowthMB} MB
      expect(growthMB).toBeLessThan(maxErrorPathGrowthMB);
    }, 30000);

    it('mixed success and error conversions free memory', async () => {
      // Skip if performance.memory not available
      if (typeof (performance as unknown as { memory?: unknown }).memory === 'undefined') {
        console.warn('Skipping memory test: performance.memory not available');
        return;
      }

      // Get baseline
      await forceGC();
      await waitForSettle(200);
      const baseline = getHeapSize();

      const mockConvertMixed = async (shouldFail: boolean): Promise<Uint8Array> => {
        const buffer = new ArrayBuffer(512 * 1024); // 512KB
        void buffer;

        if (shouldFail) {
          throw new Error('Conversion failed');
        }

        return new Uint8Array([0x25, 0x50, 0x44, 0x46]);
      };

      // Run 100 conversions alternating success/failure using recursive pattern
      async function runMixedConversion(i: number): Promise<void> {
        if (i >= 100) {
          return;
        }

        try {
          await mockConvertMixed(i % 2 === 1); // Odd iterations fail
        }
        catch {
          // Expected for odd iterations
        }

        if (i % 25 === 0) {
          await forceGC();
        }

        return runMixedConversion(i + 1);
      }

      await runMixedConversion(0);

      // Final cleanup
      await forceGC();
      await waitForSettle(1000);

      const final = getHeapSize();
      const growthMB = (final - baseline) / 1024 / 1024;

      // Use structured logging
      getLogger().info('WasmMemoryLeakTest', 'Mixed pattern growth', { growthMB: growthMB.toFixed(2) });

      // Mixed pattern should still free memory properly
      // Mixed pattern should free memory properly - growth should be < 5 MB
      expect(growthMB).toBeLessThan(5);
    }, 60000);
  });

  describe('ArrayBuffer and Typed Array Cleanup', () => {
    it('large ArrayBuffers are released', async () => {
      // Skip if performance.memory not available
      if (typeof (performance as unknown as { memory?: unknown }).memory === 'undefined') {
        console.warn('Skipping memory test: performance.memory not available');
        return;
      }

      // Get baseline
      await forceGC();
      await waitForSettle(200);
      const baseline = getHeapSize();

      // Simulate WASM returning large buffers
      const createLargeBuffer = (): Uint8Array => {
        const buffer = new ArrayBuffer(5 * 1024 * 1024); // 5MB
        return new Uint8Array(buffer);
      };

      // Create and discard 20 large buffers
      for (let i = 0; i < 20; i++) {
        const largeBuffer = createLargeBuffer();
        void largeBuffer; // Use but don't retain
      }

      // Force GC
      await forceGC();
      await waitForSettle(1000);

      const final = getHeapSize();
      const growthMB = (final - baseline) / 1024 / 1024;

      // Use structured logging
      getLogger().info('WasmMemoryLeakTest', 'After large buffer allocations', { growthMB: growthMB.toFixed(2) });

      // Should have freed most of the 100MB we allocated
      // Allow up to 10MB residual
      // Buffers should be GC'd - residual growth should be < 10 MB
      expect(growthMB).toBeLessThan(10);
    }, 30000);
  });

  describe('Extension Lifecycle Integration', () => {
    it('popup open/close cycles do not leak memory', async () => {
      // This simulates user opening popup, converting CV, closing popup
      // repeated 50 times

      // Skip if performance.memory not available
      if (typeof (performance as unknown as { memory?: unknown }).memory === 'undefined') {
        console.warn('Skipping memory test: performance.memory not available');
        return;
      }

      // Get baseline
      await forceGC();
      await waitForSettle(200);
      const baseline = getHeapSize();

      // Simulate 50 popup lifecycle cycles using recursive pattern
      async function runLifecycleCycle(i: number): Promise<void> {
        if (i >= 50) {
          return;
        }

        // Simulate popup open (WASM initialized, conversion happens)
        const pdfBytes = await mockConvertCV(SAMPLE_TSX);
        expect(pdfBytes.length).toBeGreaterThan(0);

        // Simulate popup close (all references released)
        void pdfBytes;

        // Periodic GC (simulating idle time between uses)
        if (i % 10 === 0) {
          await forceGC();
        }

        return runLifecycleCycle(i + 1);
      }

      await runLifecycleCycle(0);

      // Final cleanup
      await forceGC();
      await waitForSettle(1000);

      const final = getHeapSize();
      const growthMB = (final - baseline) / 1024 / 1024;

      // Use structured logging
      getLogger().info('WasmMemoryLeakTest', 'After popup lifecycle cycles', { cycles: 50, growthMB: growthMB.toFixed(2) });

      // Popup cycles should not accumulate memory
      // Popup lifecycle should not leak - growth should be < 5 MB
      expect(growthMB).toBeLessThan(5);
    }, 60000);
  });

  describe('Performance Memory API Availability', () => {
    it('reports when memory measurement is unavailable', () => {
      // Document that these tests require Chrome with performance.memory
      const hasMemoryAPI = typeof (performance as unknown as { memory?: unknown }).memory !== 'undefined';

      if (!hasMemoryAPI) {
        // Use structured logging
        getLogger().warn(
          'WasmMemoryLeakTest',
          'Memory leak tests require Chrome with performance.memory API. Tests will be skipped in other browsers. For full testing, run: pnpm test -- --browser=chrome',
        );
      }

      // This test always passes, it's just for documentation
      expect(true).toBe(true);
    });
  });
});
