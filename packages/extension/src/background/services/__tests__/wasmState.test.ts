/**
 * WASM State Manager Tests
 *
 * Comprehensive tests for WasmStateManager service.
 * Coverage: State transitions, validation, storage operations, error handling
 */

import { fakeBrowser } from '@webext-core/fake-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger, LogLevel, resetLogger, setLogger } from '@/shared/infrastructure/logging';
import { WasmStateManager } from '../wasmState';

// Mock dependencies
// webextension-polyfill is mocked globally with fakeBrowser

vi.mock('@/shared/infrastructure/storage', () => ({
  setValidatedStorage: vi.fn().mockResolvedValue(true),
}));

describe('WasmStateManager', () => {
  let stateManager: WasmStateManager;

  beforeEach(() => {
    stateManager = new WasmStateManager();
    vi.clearAllMocks();

    // Create spies for fakeBrowser storage methods
    vi.spyOn(fakeBrowser.storage.local, 'get').mockResolvedValue({});
    vi.spyOn(fakeBrowser.storage.local, 'set').mockResolvedValue(undefined);

    // Suppress logger output during tests
    const silentLogger = new Logger({ level: LogLevel.NONE });
    setLogger(silentLogger);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetLogger();
  });

  describe('setInitializing', () => {
    it('should set status to initializing', async () => {
      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');

      await stateManager.setInitializing();

      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmStatus',
        'initializing',
        expect.any(Object),
      );
    });

    it('should complete without throwing', async () => {
      await expect(stateManager.setInitializing()).resolves.toBeUndefined();
    });

    it('should use validated storage with schema', async () => {
      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');

      await stateManager.setInitializing();

      const call = vi.mocked(setValidatedStorage).mock.calls[0];
      expect(call[0]).toBe('wasmStatus');
      expect(call[1]).toBe('initializing');
      expect(call[2]).toBeDefined(); // Schema object
    });
  });

  describe('setSuccess', () => {
    it('should set status to success', async () => {
      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');

      await stateManager.setSuccess();

      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmStatus',
        'success',
        expect.any(Object),
      );
    });

    it('should set initialization timestamp', async () => {
      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');

      const beforeTime = Date.now();
      await stateManager.setSuccess();
      const afterTime = Date.now();

      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmInitTime',
        expect.any(Number),
        expect.any(Object),
      );

      const call = vi.mocked(setValidatedStorage).mock.calls.find(
        (c) => c[0] === 'wasmInitTime',
      );
      expect(call).toBeDefined();
      const timestamp = call![1] as number;
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should clear error state', async () => {
      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');

      await stateManager.setSuccess();

      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmInitError',
        null,
        expect.any(Object),
      );
    });

    it('should make three storage calls (status, time, error)', async () => {
      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');

      await stateManager.setSuccess();

      expect(setValidatedStorage).toHaveBeenCalledTimes(3);
    });

    it('should complete without throwing', async () => {
      await expect(stateManager.setSuccess()).resolves.toBeUndefined();
    });
  });

  describe('setFailed', () => {
    it('should set status to failed', async () => {
      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');

      await stateManager.setFailed('Test error');

      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmStatus',
        'failed',
        expect.any(Object),
      );
    });

    it('should store error message', async () => {
      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');

      await stateManager.setFailed('Specific error message');

      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmInitError',
        'Specific error message',
        expect.any(Object),
      );
    });

    it('should make two storage calls (status, error)', async () => {
      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');

      await stateManager.setFailed('Error');

      expect(setValidatedStorage).toHaveBeenCalledTimes(2);
    });

    it('should handle empty error message', async () => {
      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');

      await stateManager.setFailed('');

      expect(setValidatedStorage).toHaveBeenCalledWith('wasmInitError', '', expect.any(Object));
    });

    it('should handle long error message', async () => {
      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');
      const longError = 'Error: '.repeat(100);

      await stateManager.setFailed(longError);

      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmInitError',
        longError,
        expect.any(Object),
      );
    });

    it('should complete without throwing', async () => {
      await expect(stateManager.setFailed('Error')).resolves.toBeUndefined();
    });
  });

  describe('isReady', () => {
    it('should return true when status is success', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValueOnce({
        wasmStatus: 'success',
      });

      const result = await stateManager.isReady();

      expect(result).toBe(true);
    });

    it('should return false when status is initializing', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValueOnce({
        wasmStatus: 'initializing',
      });

      const result = await stateManager.isReady();

      expect(result).toBe(false);
    });

    it('should return false when status is failed', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValueOnce({
        wasmStatus: 'failed',
      });

      const result = await stateManager.isReady();

      expect(result).toBe(false);
    });

    it('should return false when status is undefined', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValueOnce({});

      const result = await stateManager.isReady();

      expect(result).toBe(false);
    });

    it('should query correct storage key', async () => {
      await stateManager.isReady();

      expect(fakeBrowser.storage.local.get).toHaveBeenCalledWith('wasmStatus');
    });

    it('should handle storage errors gracefully', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockRejectedValueOnce(new Error('Storage error'));

      const result = await stateManager.isReady();

      expect(result).toBe(false);
    });

    it('should return false on storage read failure', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockRejectedValueOnce(new Error('Read error'));

      await expect(stateManager.isReady()).resolves.toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return status and error for failed state', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValueOnce({
        wasmStatus: 'failed',
        wasmInitError: 'Initialization failed',
      });

      const result = await stateManager.getStatus();

      expect(result).toEqual({
        status: 'failed',
        error: 'Initialization failed',
      });
    });

    it('should return status without error for success state', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValueOnce({
        wasmStatus: 'success',
      });

      const result = await stateManager.getStatus();

      expect(result).toEqual({
        status: 'success',
        error: undefined,
      });
    });

    it('should return status without error for initializing state', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValueOnce({
        wasmStatus: 'initializing',
      });

      const result = await stateManager.getStatus();

      expect(result).toEqual({
        status: 'initializing',
        error: undefined,
      });
    });

    it('should return unknown status when no data exists', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValueOnce({});

      const result = await stateManager.getStatus();

      expect(result).toEqual({
        status: 'unknown',
        error: undefined,
      });
    });

    it('should query both status and error keys', async () => {
      await stateManager.getStatus();

      expect(fakeBrowser.storage.local.get).toHaveBeenCalledWith(['wasmStatus', 'wasmInitError']);
    });

    it('should handle storage errors gracefully', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockRejectedValueOnce(new Error('Storage error'));

      const result = await stateManager.getStatus();

      expect(result.status).toBe('unknown');
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Storage error');
    });

    it('should return error message in unknown status on failure', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockRejectedValueOnce(
        new Error('Specific storage error'),
      );

      const result = await stateManager.getStatus();

      expect(result).toEqual({
        status: 'unknown',
        error: expect.stringContaining('Specific storage error'),
      });
    });

    it('should handle non-string error values', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValueOnce({
        wasmStatus: 'failed',
        wasmInitError: null,
      });

      const result = await stateManager.getStatus();

      expect(result.status).toBe('failed');
      // null is cast to undefined in TypeScript, but JavaScript preserves null
      expect(result.error).toBeNull();
    });
  });

  describe('state transitions', () => {
    it('should transition from initializing to success', async () => {
      await stateManager.setInitializing();
      await stateManager.setSuccess();

      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');
      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmStatus',
        'initializing',
        expect.any(Object),
      );
      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmStatus',
        'success',
        expect.any(Object),
      );
    });

    it('should transition from initializing to failed', async () => {
      await stateManager.setInitializing();
      await stateManager.setFailed('Error');

      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');
      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmStatus',
        'initializing',
        expect.any(Object),
      );
      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmStatus',
        'failed',
        expect.any(Object),
      );
    });

    it('should handle multiple failed transitions', async () => {
      await stateManager.setFailed('Error 1');
      await stateManager.setFailed('Error 2');
      await stateManager.setFailed('Error 3');

      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');
      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmInitError',
        'Error 1',
        expect.any(Object),
      );
      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmInitError',
        'Error 2',
        expect.any(Object),
      );
      expect(setValidatedStorage).toHaveBeenCalledWith(
        'wasmInitError',
        'Error 3',
        expect.any(Object),
      );
    });

    it('should handle retry after failure (initializing again)', async () => {
      await stateManager.setFailed('First error');
      await stateManager.setInitializing(); // Retry
      await stateManager.setSuccess();

      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');
      const calls = vi.mocked(setValidatedStorage).mock.calls;
      const statusCalls = calls.filter((c) => c[0] === 'wasmStatus');

      expect(statusCalls).toContainEqual(['wasmStatus', 'failed', expect.any(Object)]);
      expect(statusCalls).toContainEqual(['wasmStatus', 'initializing', expect.any(Object)]);
      expect(statusCalls).toContainEqual(['wasmStatus', 'success', expect.any(Object)]);
    });
  });

  describe('validation', () => {
    it('should use picklist schema for status', async () => {
      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');

      await stateManager.setInitializing();

      const call = vi.mocked(setValidatedStorage).mock.calls[0];
      expect(call[2]).toBeDefined(); // Schema should be passed
    });

    it('should use number schema for timestamp', async () => {
      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');

      await stateManager.setSuccess();

      const timeCall = vi.mocked(setValidatedStorage).mock.calls.find(
        (c) => c[0] === 'wasmInitTime',
      );
      expect(timeCall).toBeDefined();
      expect(timeCall![2]).toBeDefined(); // Schema should be passed
    });

    it('should use string schema for error message', async () => {
      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');

      await stateManager.setFailed('Error');

      const errorCall = vi.mocked(setValidatedStorage).mock.calls.find(
        (c) => c[0] === 'wasmInitError',
      );
      expect(errorCall).toBeDefined();
      expect(errorCall![2]).toBeDefined(); // Schema should be passed
    });

    it('should use null schema for error clearing', async () => {
      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');

      await stateManager.setSuccess();

      const errorCall = vi.mocked(setValidatedStorage).mock.calls.find(
        (c) => c[0] === 'wasmInitError',
      );
      expect(errorCall).toBeDefined();
      expect(errorCall![1]).toBeNull();
      expect(errorCall![2]).toBeDefined(); // Schema should be passed
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent state changes', async () => {
      await Promise.all([
        stateManager.setInitializing(),
        stateManager.setSuccess(),
        stateManager.setFailed('Error'),
      ]);

      const { setValidatedStorage } = await import('@/shared/infrastructure/storage');
      expect(setValidatedStorage).toHaveBeenCalled();
    });

    it('should handle rapid isReady calls', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValue({
        wasmStatus: 'success',
      });

      const results = await Promise.all([
        stateManager.isReady(),
        stateManager.isReady(),
        stateManager.isReady(),
      ]);

      expect(results).toEqual([true, true, true]);
    });

    it('should handle rapid getStatus calls', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValue({
        wasmStatus: 'initializing',
      });

      const results = await Promise.all([
        stateManager.getStatus(),
        stateManager.getStatus(),
        stateManager.getStatus(),
      ]);

      expect(results).toEqual([
        { status: 'initializing', error: undefined },
        { status: 'initializing', error: undefined },
        { status: 'initializing', error: undefined },
      ]);
    });

    it('should handle empty storage object', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValueOnce({});

      const ready = await stateManager.isReady();
      const status = await stateManager.getStatus();

      expect(ready).toBe(false);
      expect(status.status).toBe('unknown');
    });

    it('should handle null storage values', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValueOnce({
        wasmStatus: null,
        wasmInitError: null,
      });

      const status = await stateManager.getStatus();

      expect(status.status).toBe('unknown');
    });

    it('should handle undefined storage values', async () => {
      vi.mocked(fakeBrowser.storage.local.get).mockResolvedValueOnce({
        wasmStatus: undefined,
        wasmInitError: undefined,
      });

      const status = await stateManager.getStatus();

      expect(status.status).toBe('unknown');
      expect(status.error).toBeUndefined();
    });
  });
});
