/**
 * WASM Initialization Integration Tests
 *
 * Tests the orchestration of WASM initialization services.
 * Unit tests for individual services are in services/__tests__/
 *
 * Focus: Integration, orchestration, public API contracts
 */

import { fakeBrowser } from '@webext-core/fake-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger, LogLevel, resetLogger, setLogger } from '@/shared/infrastructure/logging';
import { setValidatedStorage } from '@/shared/infrastructure/storage';
import { initWASM } from '../../shared/infrastructure/wasm/loader';
import { getWasmStatus, initializeWASM, retryWasmInit } from '../wasmInit';

// Mock dependencies
vi.mock('@/shared/infrastructure/storage', () => ({
  setValidatedStorage: vi.fn(),
}));
vi.mock('../../shared/infrastructure/wasm/loader', () => ({
  initWASM: vi.fn(),
  isWASMInitialized: vi.fn(),
  resetWASMForTesting: vi.fn(),
}));
vi.mock('../../shared/errors/factory', () => ({
  createWasmInitError: vi.fn((stage, technicalDetails) => ({
    code: 'WASM_INIT_FAILED',
    stage,
    message: 'Failed to initialize WASM module',
    technicalDetails,
    metadata: {},
    errorId: 'test-error-id',
    timestamp: Date.now(),
    recoverable: false,
    suggestions: [],
    category: 'system',
  })),
}));

// webextension-polyfill is mocked globally with fakeBrowser

describe('wasmInit - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(fakeBrowser.storage.local, 'set').mockResolvedValue(undefined);
    vi.spyOn(fakeBrowser.storage.local, 'get').mockResolvedValue({});
    vi.spyOn(fakeBrowser.action, 'setBadgeText').mockResolvedValue(undefined);
    vi.spyOn(fakeBrowser.action, 'setBadgeBackgroundColor').mockResolvedValue(undefined);
    vi.useFakeTimers();

    const silentLogger = new Logger({ level: LogLevel.NONE });
    setLogger(silentLogger);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    resetLogger();
  });

  describe('initializeWASM - orchestration', () => {
    it('should initialize WASM successfully on first try', async () => {
      vi.mocked(initWASM).mockResolvedValue(undefined);
      vi.mocked(setValidatedStorage).mockResolvedValue(true);

      await initializeWASM();

      expect(initWASM).toHaveBeenCalledOnce();
      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmStatus',
        'initializing',
        expect.any(Object),
      );
      expect(setValidatedStorage).toHaveBeenCalledWith('wasmStatus', 'success', expect.any(Object));
      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });

    it('should set status to initializing before starting', async () => {
      vi.mocked(initWASM).mockResolvedValue(undefined);
      vi.mocked(setValidatedStorage).mockResolvedValue(true);

      await initializeWASM();

      expect(setValidatedStorage).toHaveBeenNthCalledWith(
        1,
        'wasmStatus',
        'initializing',
        expect.any(Object),
      );
    });

    it('should set status to success after initialization', async () => {
      vi.mocked(initWASM).mockResolvedValue(undefined);
      vi.mocked(setValidatedStorage).mockResolvedValue(true);

      await initializeWASM();

      expect(setValidatedStorage).toHaveBeenCalledWith('wasmStatus', 'success', expect.any(Object));
    });

    it('should store initialization timestamp', async () => {
      vi.mocked(initWASM).mockResolvedValue(undefined);
      vi.mocked(setValidatedStorage).mockResolvedValue(true);

      const beforeTime = Date.now();
      await initializeWASM();
      const afterTime = Date.now();

      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmInitTime',
        expect.any(Number),
        expect.any(Object),
      );

      const call = vi
        .mocked(setValidatedStorage)
        .mock.calls.find((call) => call[0] === 'wasmInitTime');
      if (!call) throw new Error('wasmInitTime call not found');
      const timestamp = call[1] as number;
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should clear error state on success', async () => {
      vi.mocked(initWASM).mockResolvedValue(undefined);
      vi.mocked(setValidatedStorage).mockResolvedValue(true);

      await initializeWASM();

      expect(setValidatedStorage).toHaveBeenCalledWith('wasmInitError', null, expect.any(Object));
    });

    it('should clear badge on success', async () => {
      vi.mocked(initWASM).mockResolvedValue(undefined);
      vi.mocked(setValidatedStorage).mockResolvedValue(true);

      await initializeWASM();

      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });
  });

  describe('initializeWASM - retry integration', () => {
    it('should retry on failure', async () => {
      vi.mocked(initWASM)
        .mockRejectedValueOnce(new Error('Init failed'))
        .mockResolvedValueOnce(undefined);
      vi.mocked(setValidatedStorage).mockResolvedValue(true);

      void initializeWASM();
      await vi.runAllTimersAsync();

      expect(initWASM).toHaveBeenCalledTimes(2);
      expect(setValidatedStorage).toHaveBeenCalledWith('wasmStatus', 'success', expect.any(Object));
    });

    it('should successfully retry after failure', async () => {
      vi.mocked(initWASM).mockRejectedValueOnce(new Error('Fail')).mockResolvedValueOnce(undefined);
      vi.mocked(setValidatedStorage).mockResolvedValue(true);

      void initializeWASM();
      await vi.runAllTimersAsync();

      expect(initWASM).toHaveBeenCalledTimes(2);
      expect(setValidatedStorage).toHaveBeenCalledWith('wasmStatus', 'success', expect.any(Object));
    });

    it('should only update badge on final result (not intermediate retries)', async () => {
      vi.mocked(initWASM)
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce(undefined);
      vi.mocked(setValidatedStorage).mockResolvedValue(true);

      void initializeWASM();
      await vi.runAllTimersAsync();

      // On final success, badge should be cleared (only called once)
      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledOnce();
      expect(fakeBrowser.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });
  });

  describe('initializeWASM - error handling integration', () => {
    it('should handle non-Error objects', async () => {
      vi.mocked(initWASM).mockRejectedValue('String error');
      vi.mocked(setValidatedStorage).mockResolvedValue(true);

      const promise = initializeWASM().catch((e: unknown) => e);

      // Advance through all retry attempts (3 attempts total, ~5000ms max delay)
      await vi.advanceTimersByTimeAsync(6000);

      const result = await promise;
      expect(result).toBe('String error');

      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmInitError',
        'Unknown error',
        expect.any(Object),
      );
    });

    it('should create structured errors using error factory', async () => {
      const { createWasmInitError } = await import('../../shared/errors/factory');
      vi.mocked(initWASM).mockRejectedValue(new Error('Init failed'));
      vi.mocked(setValidatedStorage).mockResolvedValue(true);

      const promise = initializeWASM().catch((e: unknown) => e);

      // Advance through all retry attempts
      await vi.advanceTimersByTimeAsync(6000);

      const result = await promise;
      expect(result).toBeInstanceOf(Error);

      expect(createWasmInitError).toHaveBeenCalled();
      expect(createWasmInitError).toHaveBeenCalledWith(
        'failed',
        expect.stringContaining('Init failed'),
      );
    });

    it('should create error for max retries reached', async () => {
      const { createWasmInitError } = await import('../../shared/errors/factory');
      vi.mocked(initWASM).mockRejectedValue(new Error('Fail'));
      vi.mocked(setValidatedStorage).mockResolvedValue(true);

      const promise = initializeWASM().catch((e: unknown) => e);

      // Advance through all retry attempts
      await vi.advanceTimersByTimeAsync(6000);

      const result = await promise;
      expect(result).toBeInstanceOf(Error);

      expect(createWasmInitError).toHaveBeenCalledWith(
        'failed',
        expect.stringContaining('Failed after'),
      );
    });
  });

  describe('retryWasmInit - public API', () => {
    it('should start fresh initialization', async () => {
      vi.mocked(initWASM).mockResolvedValue(undefined);
      vi.mocked(setValidatedStorage).mockResolvedValue(true);

      await retryWasmInit();

      expect(initWASM).toHaveBeenCalledOnce();
      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmStatus',
        'initializing',
        expect.any(Object),
      );
    });

    it('should handle retry failures', async () => {
      vi.mocked(initWASM).mockRejectedValue(new Error('Retry failed'));
      vi.mocked(setValidatedStorage).mockResolvedValue(true);

      const promise = retryWasmInit().catch((e: unknown) => e);

      // Advance through all retry attempts
      await vi.advanceTimersByTimeAsync(6000);

      const result = await promise;
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Retry failed');
    });

    it('should use same retry logic as initializeWASM', async () => {
      vi.mocked(initWASM).mockRejectedValueOnce(new Error('Fail')).mockResolvedValueOnce(undefined);
      vi.mocked(setValidatedStorage).mockResolvedValue(true);

      void retryWasmInit();
      await vi.runAllTimersAsync();

      expect(initWASM).toHaveBeenCalledTimes(2);
    });
  });

  describe('getWasmStatus - public API', () => {
    it('should handle browser.storage.local.get errors', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockRejectedValueOnce(
        new Error('Storage read error'),
      );

      const status = await getWasmStatus();

      expect(status.status).toBe('unknown');
      expect(status.error).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle very fast initialization', async () => {
      vi.mocked(initWASM).mockResolvedValue(undefined);
      vi.mocked(setValidatedStorage).mockResolvedValue(true);

      const start = Date.now();
      await initializeWASM();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle concurrent initialization attempts', async () => {
      vi.mocked(initWASM).mockResolvedValue(undefined);
      vi.mocked(setValidatedStorage).mockResolvedValue(true);

      await Promise.all([initializeWASM(), initializeWASM(), initializeWASM()]);

      expect(initWASM).toHaveBeenCalledTimes(3);
    });
  });
});
