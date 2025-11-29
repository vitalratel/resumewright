/**
 * WASM Compatibility Checker Mock
 *
 * Provides mock implementations for WASM compatibility checking.
 * Used in tests that verify browser capability detection.
 *
 * Usage:
 * ```typescript
 * import { mockCompatibilityChecker } from '@/__tests__/mocks/compatibilityChecker';
 *
 * vi.mock('@/shared/wasm/compatibility', () => ({
 *   WasmCompatibilityChecker: mockCompatibilityChecker()
 * }));
 * ```
 */

import { vi } from 'vitest';

/**
 * Mock compatibility report for supported browser
 */
export const MOCK_COMPATIBLE_BROWSER = {
  compatible: true,
  issues: [],
  browserInfo: {
    userAgent: 'test-agent',
    browserName: 'Chrome',
    browserVersion: '120',
    platform: 'Linux',
  },
  wasmInfo: {
    supported: true,
    streaming: true,
    threads: true,
    simd: true,
  },
};

/**
 * Mock compatibility report for unsupported browser
 */
export const MOCK_INCOMPATIBLE_BROWSER = {
  compatible: false,
  issues: [
    {
      severity: 'error' as const,
      category: 'wasm' as const,
      message: 'WebAssembly is not supported',
      recommendation: 'Use a modern browser like Chrome, Firefox, or Edge',
    },
  ],
  browserInfo: {
    userAgent: 'test-agent',
    browserName: 'IE',
    browserVersion: '11',
    platform: 'Windows',
  },
  wasmInfo: {
    supported: false,
    streaming: false,
    threads: false,
    simd: false,
  },
};

/**
 * Mock compatibility report for partially supported browser
 */
export const MOCK_PARTIAL_SUPPORT = {
  compatible: true,
  issues: [
    {
      severity: 'warning' as const,
      category: 'performance' as const,
      message: 'SIMD not supported - slower performance',
      recommendation: 'Update browser for better performance',
    },
  ],
  browserInfo: {
    userAgent: 'test-agent',
    browserName: 'Firefox',
    browserVersion: '100',
    platform: 'Linux',
  },
  wasmInfo: {
    supported: true,
    streaming: true,
    threads: false,
    simd: false,
  },
};

/**
 * Creates a mock WasmCompatibilityChecker
 *
 * @param isSupported - Whether WASM is supported (default: true)
 * @returns Mock checker object
 *
 * @example
 * ```typescript
 * // Supported
 * vi.mock('@/shared/wasm/compatibility', () => ({
 *   WasmCompatibilityChecker: mockCompatibilityChecker(true)
 * }));
 *
 * // Unsupported
 * vi.mock('@/shared/wasm/compatibility', () => ({
 *   WasmCompatibilityChecker: mockCompatibilityChecker(false)
 * }));
 * ```
 */
export function mockCompatibilityChecker(isSupported = true) {
  const report = isSupported ? MOCK_COMPATIBLE_BROWSER : MOCK_INCOMPATIBLE_BROWSER;

  return {
    check: vi.fn().mockResolvedValue(report),
  };
}

/**
 * Creates a mock with custom compatibility report
 *
 * @param customReport - Custom compatibility report
 * @returns Mock checker object
 */
export function mockCompatibilityCheckerWithReport(customReport: typeof MOCK_COMPATIBLE_BROWSER) {
  return {
    check: vi.fn().mockResolvedValue(customReport),
  };
}

/**
 * Creates a mock that throws error during check
 *
 * @param errorMessage - Error message to throw
 * @returns Mock checker object
 */
export function mockCompatibilityCheckerWithError(errorMessage = 'Compatibility check failed') {
  return {
    check: vi.fn().mockRejectedValue(new Error(errorMessage)),
  };
}
