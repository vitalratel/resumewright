/**
 * Test Fixtures for WASM Compatibility Reports
 * Shared across WasmFallback tests
 */

import type { WasmCompatibilityReport } from '@/shared/infrastructure/wasm/compatibility';

export const compatibleReport: WasmCompatibilityReport = {
  compatible: true,
  browserInfo: {
    browserName: 'Chrome',
    browserVersion: '120.0',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  },
  wasmInfo: {
    supported: true,
    streaming: true,
    threads: false,
    simd: true,
  },
  memoryInfo: {
    available: true,
    totalMB: 8192,
    usedMB: 2048,
    percentUsed: 25,
  },
  issues: [],
};

export const incompatibleReport: WasmCompatibilityReport = {
  compatible: false,
  browserInfo: {
    browserName: 'Safari',
    browserVersion: '12.0',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X)',
  },
  wasmInfo: {
    supported: false,
    streaming: false,
    threads: false,
    simd: false,
  },
  memoryInfo: {
    available: true,
    totalMB: 2048,
    usedMB: 1600,
    percentUsed: 78,
  },
  issues: [
    {
      severity: 'error',
      category: 'wasm',
      message: 'WebAssembly not supported',
      recommendation: 'Update to Safari 14.1 or later',
    },
    {
      severity: 'warning',
      category: 'memory',
      message: 'Low memory available',
      recommendation: 'Close other applications',
    },
  ],
};

export const lowMemoryReport: WasmCompatibilityReport = {
  ...compatibleReport,
  memoryInfo: {
    available: true,
    totalMB: 4096,
    usedMB: 3500,
    percentUsed: 85,
  },
};

export const reportWithoutMemory: WasmCompatibilityReport = {
  ...compatibleReport,
  memoryInfo: undefined,
};
