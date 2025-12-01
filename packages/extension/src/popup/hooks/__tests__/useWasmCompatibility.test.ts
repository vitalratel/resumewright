// ABOUTME: Tests for useWasmCompatibility hook.
// ABOUTME: Verifies WASM compatibility checking and initialization status queries.

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WasmCompatibilityChecker } from '@/shared/infrastructure/wasm/compatibility';
import { sendMessage } from '@/shared/messaging';
import { useWasmCompatibility } from '../integration/useWasmCompatibility';

// Mock dependencies
vi.mock('@/shared/messaging', () => ({
  sendMessage: vi.fn(),
  onMessage: vi.fn(),
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
    (sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue({
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
    (sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue({
      initialized: false,
      error: 'WASM failed to initialize',
    });

    const { result } = renderHook(() => useWasmCompatibility());

    await waitFor(() => {
      expect(result.current.wasmInitialized).toBe(false);
    });

    expect(result.current.wasmReport?.compatible).toBe(false);
    expect(result.current.wasmReport?.issues).toHaveLength(1);
    expect(result.current.wasmReport?.issues[0].message).toBe('WASM failed to initialize');
  });

  it('should handle browser incompatibility', async () => {
    const mockReport = {
      compatible: false,
      browserInfo: {
        userAgent: 'test',
        browserName: 'OldBrowser',
        browserVersion: '1.0',
      },
      wasmInfo: {
        supported: false,
        streaming: false,
        threads: false,
        simd: false,
      },
      issues: [
        {
          severity: 'error' as const,
          category: 'wasm' as const,
          message: 'WebAssembly not supported',
          recommendation: 'Update your browser',
        },
      ],
    };

    (WasmCompatibilityChecker.check as ReturnType<typeof vi.fn>).mockResolvedValue(mockReport);

    const { result } = renderHook(() => useWasmCompatibility());

    await waitFor(() => {
      expect(result.current.wasmInitialized).toBe(false);
    });

    expect(result.current.wasmReport?.compatible).toBe(false);
    // sendMessage should not be called when browser is incompatible
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('should retry when background worker not ready', async () => {
    const mockReport = {
      compatible: true,
      browserInfo: {
        userAgent: 'test',
        browserName: 'Chrome',
        browserVersion: '120',
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
    (sendMessage as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('Receiving end does not exist'))
      .mockResolvedValueOnce({
        initialized: true,
        error: null,
      });

    const { result } = renderHook(() => useWasmCompatibility());

    await waitFor(() => {
      expect(result.current.wasmInitialized).toBe(true);
    }, { timeout: 2000 });

    expect(sendMessage).toHaveBeenCalledTimes(2);
  });

  it('should exhaust retries and handle failure', async () => {
    const mockReport = {
      compatible: true,
      browserInfo: {
        userAgent: 'test',
        browserName: 'Chrome',
        browserVersion: '120',
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
    (sendMessage as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Receiving end does not exist')
    );

    const { result } = renderHook(() => useWasmCompatibility());

    await waitFor(() => {
      expect(result.current.wasmInitialized).toBe(false);
    }, { timeout: 10000 });

    expect(result.current.wasmReport?.compatible).toBe(false);
    expect(sendMessage).toHaveBeenCalledTimes(5); // max retries
  });
});
