// ABOUTME: Integration tests for WASM initialization orchestration.
// ABOUTME: Tests retry logic, state management, and public API contracts.

import { fakeBrowser } from '@webext-core/fake-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetLogger, setLogger } from '@/shared/infrastructure/logging/instance';
import { createLogger, LogLevel } from '@/shared/infrastructure/logging/logger';
import { initWASM } from '../../shared/infrastructure/wasm/loader';
import { setWasmFailed, setWasmInitializing, setWasmSuccess } from '../services/wasmState';
import { initializeWASM } from '../wasmInit';

// Mock dependencies
vi.mock('../services/wasmState', () => ({
  setWasmInitializing: vi.fn(),
  setWasmSuccess: vi.fn(),
  setWasmFailed: vi.fn(),
  getWasmStatus: vi.fn(),
}));
vi.mock('../../shared/infrastructure/wasm/loader', () => ({
  initWASM: vi.fn(),
  isWASMInitialized: vi.fn(),
  resetWASMForTesting: vi.fn(),
}));
// Helper to create a resolving initWASM mock
function okResult(): ReturnType<typeof initWASM> {
  return Promise.resolve();
}

// Helper to create a rejecting initWASM mock
function errResult(message: string): ReturnType<typeof initWASM> {
  return Promise.reject(new Error(`WASM initialization failed: ${message}`));
}

// webextension-polyfill is mocked globally with fakeBrowser

describe('wasmInit - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(fakeBrowser.action, 'setBadgeText').mockResolvedValue(undefined);
    vi.spyOn(fakeBrowser.action, 'setBadgeBackgroundColor').mockResolvedValue(undefined);
    vi.useFakeTimers();

    const silentLogger = createLogger({ level: LogLevel.NONE });
    setLogger(silentLogger);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    resetLogger();
  });

  describe('initializeWASM - orchestration', () => {
    it('should initialize WASM successfully on first try', async () => {
      vi.mocked(initWASM).mockReturnValue(okResult());

      await initializeWASM();

      expect(initWASM).toHaveBeenCalledOnce();
      expect(setWasmInitializing).toHaveBeenCalled();
      expect(setWasmSuccess).toHaveBeenCalled();
      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });

    it('should set status to initializing before starting WASM', async () => {
      vi.mocked(initWASM).mockReturnValue(okResult());

      await initializeWASM();

      const initializingOrder = vi.mocked(setWasmInitializing).mock.invocationCallOrder[0];
      const initWasmOrder = vi.mocked(initWASM).mock.invocationCallOrder[0];
      expect(initializingOrder).toBeLessThan(initWasmOrder);
    });
  });

  describe('initializeWASM - retry integration', () => {
    it('should retry on failure', async () => {
      vi.mocked(initWASM)
        .mockImplementationOnce(() => errResult('Init failed'))
        .mockReturnValueOnce(okResult());

      void initializeWASM();
      await vi.runAllTimersAsync();

      expect(initWASM).toHaveBeenCalledTimes(2);
      expect(setWasmSuccess).toHaveBeenCalled();
    });

    it('should only update badge on final result (not intermediate retries)', async () => {
      vi.mocked(initWASM)
        .mockImplementationOnce(() => errResult('Fail 1'))
        .mockImplementationOnce(() => errResult('Fail 2'))
        .mockReturnValueOnce(okResult());

      void initializeWASM();
      await vi.runAllTimersAsync();

      // On final success, badge should be cleared (only called once)
      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledOnce();
      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });
  });

  describe('initializeWASM - error handling integration', () => {
    it('should handle Result errors', async () => {
      vi.mocked(initWASM).mockImplementation(() => errResult('String error'));

      const promise = initializeWASM().catch((e: unknown) => e);

      // Advance through all retry attempts (3 attempts total, ~5000ms max delay)
      await vi.advanceTimersByTimeAsync(6000);

      const result = await promise;
      expect(result).toBeInstanceOf(Error);

      expect(setWasmFailed).toHaveBeenCalledWith(
        expect.stringContaining('WASM initialization failed'),
      );
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent initialization attempts', async () => {
      vi.mocked(initWASM).mockReturnValue(okResult());

      await Promise.all([initializeWASM(), initializeWASM(), initializeWASM()]);

      expect(initWASM).toHaveBeenCalledTimes(3);
    });
  });
});
