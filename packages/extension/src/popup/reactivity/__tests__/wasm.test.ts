/**
 * ABOUTME: Tests for createWasmCompatibility reactive function.
 * ABOUTME: Validates WASM compatibility checking, retry logic, and error handling.
 */

import { renderHook } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

vi.mock('@/shared/infrastructure/logging/instance', () => ({
  getLogger: () => mockLogger,
}));

const mockCheck = vi.fn();
vi.mock('@/shared/infrastructure/wasm/compatibility', () => ({
  WasmCompatibilityChecker: {
    check: () => mockCheck(),
  },
}));

const mockSendMessage = vi.fn();
vi.mock('@/shared/messaging', () => ({
  sendMessage: (...args: unknown[]) => mockSendMessage(...args),
}));

const { createWasmCompatibility } = await import('../wasm');

function createCompatibleReport() {
  return {
    compatible: true,
    browserInfo: { userAgent: 'test', browserName: 'Chrome', browserVersion: '120' },
    wasmInfo: { supported: true, streaming: true, threads: true, simd: true },
    issues: [],
  };
}

describe('createWasmCompatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('starts with wasmInitialized=null and wasmReport=null', () => {
      mockCheck.mockReturnValue(new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => createWasmCompatibility());

      expect(result.wasmInitialized()).toBeNull();
      expect(result.wasmReport()).toBeNull();
    });
  });

  describe('Successful Initialization', () => {
    it('sets wasmInitialized=true when WASM is ready', async () => {
      mockCheck.mockResolvedValue(createCompatibleReport());
      mockSendMessage.mockResolvedValue({ initialized: true });

      const { result } = renderHook(() => createWasmCompatibility());

      await vi.advanceTimersByTimeAsync(0);

      expect(result.wasmInitialized()).toBe(true);
      expect(result.wasmReport()).toBeTruthy();
    });

    it('sets wasmReport with compatibility info', async () => {
      const report = createCompatibleReport();
      mockCheck.mockResolvedValue(report);
      mockSendMessage.mockResolvedValue({ initialized: true });

      const { result } = renderHook(() => createWasmCompatibility());

      await vi.advanceTimersByTimeAsync(0);

      expect(result.wasmReport()?.compatible).toBe(true);
      expect(result.wasmReport()?.browserInfo.browserName).toBe('Chrome');
    });
  });

  describe('Incompatible Browser', () => {
    it('sets wasmInitialized=false when browser is incompatible', async () => {
      const report = createCompatibleReport();
      report.compatible = false;
      mockCheck.mockResolvedValue(report);

      const { result } = renderHook(() => createWasmCompatibility());

      await vi.advanceTimersByTimeAsync(0);

      expect(result.wasmInitialized()).toBe(false);
      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('WASM Not Initialized', () => {
    it('sets wasmInitialized=false when WASM fails to init', async () => {
      mockCheck.mockResolvedValue(createCompatibleReport());
      mockSendMessage.mockResolvedValue({ initialized: false, error: 'Init failed' });

      const { result } = renderHook(() => createWasmCompatibility());

      await vi.advanceTimersByTimeAsync(0);

      expect(result.wasmInitialized()).toBe(false);
    });
  });

  describe('Retry Logic', () => {
    it('retries when WASM is still initializing', async () => {
      mockCheck.mockResolvedValue(createCompatibleReport());
      mockSendMessage
        .mockResolvedValueOnce({ initialized: false }) // Still initializing
        .mockResolvedValueOnce({ initialized: true }); // Ready

      const { result } = renderHook(() => createWasmCompatibility());

      // First attempt
      await vi.advanceTimersByTimeAsync(0);
      // Retry delay
      await vi.advanceTimersByTimeAsync(500);

      expect(result.wasmInitialized()).toBe(true);
      expect(mockSendMessage).toHaveBeenCalledTimes(2);
    });

    it('retries on "Receiving end does not exist" error', async () => {
      mockCheck.mockResolvedValue(createCompatibleReport());
      mockSendMessage
        .mockRejectedValueOnce(new Error('Receiving end does not exist'))
        .mockResolvedValueOnce({ initialized: true });

      const { result } = renderHook(() => createWasmCompatibility());

      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(500);

      expect(result.wasmInitialized()).toBe(true);
      expect(mockSendMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('handles compatibility check exception', async () => {
      mockCheck.mockRejectedValue(new Error('Check failed'));

      const { result } = renderHook(() => createWasmCompatibility());

      await vi.advanceTimersByTimeAsync(0);

      expect(result.wasmInitialized()).toBe(false);
      expect(result.wasmReport()?.compatible).toBe(false);
      expect(result.wasmReport()?.issues[0]?.message).toBe('Check failed');
    });

    it('handles non-Error exceptions gracefully', async () => {
      mockCheck.mockRejectedValue('string error');

      const { result } = renderHook(() => createWasmCompatibility());

      await vi.advanceTimersByTimeAsync(0);

      expect(result.wasmInitialized()).toBe(false);
      expect(result.wasmReport()?.issues[0]?.message).toBe('Unknown WASM initialization error');
    });
  });
});
