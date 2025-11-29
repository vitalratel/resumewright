/**
 * useWasmCompatibility Hook Tests
 *
 * Tests WASM compatibility checking and initialization status
 */

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import browser from 'webextension-polyfill';

import { WasmCompatibilityChecker } from '@/shared/infrastructure/wasm/compatibility';
import { useWasmCompatibility } from '../integration/useWasmCompatibility';

// Mock dependencies
vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      sendMessage: vi.fn(),
    },
  },
}));

vi.mock('@/shared/infrastructure/wasm/compatibility', () => ({
  WasmCompatibilityChecker: {
    check: vi.fn(),
  },
}));

vi.mock('@/shared/infrastructure/logging', () => ({
  getLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('useWasmCompatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initialized status when WASM is ready', async () => {
    const mockReport = {
      compatible: true,
      browserInfo: {
        userAgent: 'test',
        browserName: 'Chrome',
        browserVersion: '120',
        platform: 'test',
      },
      wasmInfo: {
        supported: true,
        streaming: true,
        threads: false,
        simd: false,
      },
      issues: [],
    };

    (WasmCompatibilityChecker.check as ReturnType<typeof vi.fn>).mockResolvedValue(mockReport);
    (browser.runtime.sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue({
      initialized: true,
      error: null,
    });

    const { result } = renderHook(() => useWasmCompatibility());

    expect(result.current.wasmInitialized).toBeNull();

    await waitFor(() => {
      expect(result.current.wasmInitialized).toBe(true);
    });

    expect(result.current.wasmReport).toBeDefined();
    expect(result.current.wasmReport?.compatible).toBe(true);
  });

  it('should handle WASM not initialized', async () => {
    const mockReport = {
      compatible: true,
      browserInfo: {
        userAgent: 'test',
        browserName: 'Chrome',
        browserVersion: '120',
        platform: 'test',
      },
      wasmInfo: {
        supported: true,
        streaming: true,
        threads: false,
        simd: false,
      },
      issues: [],
    };

    (WasmCompatibilityChecker.check as ReturnType<typeof vi.fn>).mockResolvedValue(mockReport);
    (browser.runtime.sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue({
      initialized: false,
      error: 'WASM initialization failed',
    });

    const { result } = renderHook(() => useWasmCompatibility());

    await waitFor(() => {
      expect(result.current.wasmInitialized).toBe(false);
    });

    expect(result.current.wasmReport?.compatible).toBe(false);
  });

  it('should handle browser incompatibility', async () => {
    const mockReport = {
      compatible: false,
      browserInfo: {
        userAgent: 'test',
        browserName: 'OldBrowser',
        browserVersion: '1',
        platform: 'test',
      },
      wasmInfo: {
        supported: false,
        streaming: false,
        threads: false,
        simd: false,
      },
      issues: [{
        severity: 'error' as const,
        category: 'wasm' as const,
        message: 'WASM not supported',
        recommendation: 'Update browser',
      }],
    };

    (WasmCompatibilityChecker.check as ReturnType<typeof vi.fn>).mockResolvedValue(mockReport);

    const { result } = renderHook(() => useWasmCompatibility());

    await waitFor(() => {
      expect(result.current.wasmInitialized).toBe(false);
    });

    expect(result.current.wasmReport?.compatible).toBe(false);
    expect(result.current.wasmReport?.issues.length).toBeGreaterThan(0);
  });

  it('should retry when background worker not ready', async () => {
    // Test error handler with retry logic
    const mockReport = {
      compatible: true,
      browserInfo: {
        userAgent: 'test',
        browserName: 'Chrome',
        browserVersion: '120',
        platform: 'test',
      },
      wasmInfo: {
        supported: true,
        streaming: true,
        threads: false,
        simd: false,
      },
      issues: [],
    };

    (WasmCompatibilityChecker.check as ReturnType<typeof vi.fn>).mockResolvedValue(mockReport);

    // First call fails, second succeeds
    (browser.runtime.sendMessage as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('Receiving end does not exist'))
      .mockResolvedValueOnce({
        initialized: true,
        error: null,
      });

    const { result } = renderHook(() => useWasmCompatibility());

    await waitFor(() => {
      expect(result.current.wasmInitialized).toBe(true);
    }, { timeout: 2000 });

    expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(2);
  });

  it('should handle error in catch block', async () => {
    // Test catch block error handling
    (WasmCompatibilityChecker.check as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Compatibility check failed'),
    );

    const { result } = renderHook(() => useWasmCompatibility());

    await waitFor(() => {
      expect(result.current.wasmInitialized).toBe(false);
    });

    expect(result.current.wasmReport?.compatible).toBe(false);
    expect(result.current.wasmReport?.issues).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        category: 'wasm',
      }),
    );
  });

  it('should handle non-Error exceptions', async () => {
    // Test non-Error exception handling
    (WasmCompatibilityChecker.check as ReturnType<typeof vi.fn>).mockRejectedValue(
      'String error',
    );

    const { result } = renderHook(() => useWasmCompatibility());

    await waitFor(() => {
      expect(result.current.wasmInitialized).toBe(false);
    });

    expect(result.current.wasmReport?.compatible).toBe(false);
  });

  it('should exhaust retries and handle failure', async () => {
    // Test retry exhaustion
    const mockReport = {
      compatible: true,
      browserInfo: {
        userAgent: 'test',
        browserName: 'Chrome',
        browserVersion: '120',
        platform: 'test',
      },
      wasmInfo: {
        supported: true,
        streaming: true,
        threads: false,
        simd: false,
      },
      issues: [],
    };

    (WasmCompatibilityChecker.check as ReturnType<typeof vi.fn>).mockResolvedValue(mockReport);
    (browser.runtime.sendMessage as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Receiving end does not exist'),
    );

    const { result } = renderHook(() => useWasmCompatibility());

    await waitFor(() => {
      expect(result.current.wasmInitialized).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.wasmReport?.compatible).toBe(false);
    expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(5); // max retries
  });
});
