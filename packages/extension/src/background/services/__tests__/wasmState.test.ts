/**
 * WASM State Manager Tests
 *
 * Comprehensive tests for WasmStateManager service.
 * Coverage: State transitions, validation, storage operations, error handling
 * Uses fakeBrowser for real storage behavior.
 */

import { fakeBrowser } from '@webext-core/fake-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetLogger, setLogger } from '@/shared/infrastructure/logging/instance';
import { Logger, LogLevel } from '@/shared/infrastructure/logging/logger';
import { localExtStorage } from '@/shared/infrastructure/storage/typedStorage';
import { WasmStateManager } from '../wasmState';

describe('WasmStateManager', () => {
  let stateManager: WasmStateManager;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Clear storage before each test
    await fakeBrowser.storage.local.clear();

    stateManager = new WasmStateManager();

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
      await stateManager.setInitializing();

      const status = await localExtStorage.getItem('wasmStatus');
      expect(status).toBe('initializing');
    });

    it('should complete without throwing', async () => {
      await expect(stateManager.setInitializing()).resolves.toBeUndefined();
    });
  });

  describe('setSuccess', () => {
    it('should set status to success', async () => {
      await stateManager.setSuccess();

      const status = await localExtStorage.getItem('wasmStatus');
      expect(status).toBe('success');
    });

    it('should set initialization timestamp', async () => {
      const beforeTime = Date.now();
      await stateManager.setSuccess();
      const afterTime = Date.now();

      const timestamp = await localExtStorage.getItem('wasmInitTime');
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should clear error state', async () => {
      // Set an error first
      await localExtStorage.setItem('wasmInitError', 'Previous error');

      await stateManager.setSuccess();

      const error = await localExtStorage.getItem('wasmInitError');
      expect(error).toBeNull();
    });

    it('should complete without throwing', async () => {
      await expect(stateManager.setSuccess()).resolves.toBeUndefined();
    });
  });

  describe('setFailed', () => {
    it('should set status to failed', async () => {
      await stateManager.setFailed('Test error');

      const status = await localExtStorage.getItem('wasmStatus');
      expect(status).toBe('failed');
    });

    it('should store error message', async () => {
      await stateManager.setFailed('Specific error message');

      const error = await localExtStorage.getItem('wasmInitError');
      expect(error).toBe('Specific error message');
    });

    it('should handle empty error message', async () => {
      await stateManager.setFailed('');

      const error = await localExtStorage.getItem('wasmInitError');
      expect(error).toBe('');
    });

    it('should handle long error message', async () => {
      const longError = 'Error: '.repeat(100);

      await stateManager.setFailed(longError);

      const error = await localExtStorage.getItem('wasmInitError');
      expect(error).toBe(longError);
    });

    it('should complete without throwing', async () => {
      await expect(stateManager.setFailed('Error')).resolves.toBeUndefined();
    });
  });

  describe('isReady', () => {
    it('should return true when status is success', async () => {
      await localExtStorage.setItem('wasmStatus', 'success');

      const result = await stateManager.isReady();

      expect(result).toBe(true);
    });

    it('should return false when status is initializing', async () => {
      await localExtStorage.setItem('wasmStatus', 'initializing');

      const result = await stateManager.isReady();

      expect(result).toBe(false);
    });

    it('should return false when status is failed', async () => {
      await localExtStorage.setItem('wasmStatus', 'failed');

      const result = await stateManager.isReady();

      expect(result).toBe(false);
    });

    it('should return false when status is undefined', async () => {
      // Storage is empty from beforeEach

      const result = await stateManager.isReady();

      expect(result).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return status and error for failed state', async () => {
      await localExtStorage.setItem('wasmStatus', 'failed');
      await localExtStorage.setItem('wasmInitError', 'Initialization failed');

      const result = await stateManager.getStatus();

      expect(result).toEqual({
        status: 'failed',
        error: 'Initialization failed',
      });
    });

    it('should return status without error for success state', async () => {
      await localExtStorage.setItem('wasmStatus', 'success');

      const result = await stateManager.getStatus();

      expect(result).toEqual({
        status: 'success',
        error: undefined,
      });
    });

    it('should return status without error for initializing state', async () => {
      await localExtStorage.setItem('wasmStatus', 'initializing');

      const result = await stateManager.getStatus();

      expect(result).toEqual({
        status: 'initializing',
        error: undefined,
      });
    });

    it('should return unknown status when no data exists', async () => {
      // Storage is empty from beforeEach

      const result = await stateManager.getStatus();

      expect(result).toEqual({
        status: 'unknown',
        error: undefined,
      });
    });
  });

  describe('state transitions', () => {
    it('should transition from initializing to success', async () => {
      await stateManager.setInitializing();
      const statusAfterInit = await localExtStorage.getItem('wasmStatus');
      expect(statusAfterInit).toBe('initializing');

      await stateManager.setSuccess();
      const statusAfterSuccess = await localExtStorage.getItem('wasmStatus');
      expect(statusAfterSuccess).toBe('success');
    });

    it('should transition from initializing to failed', async () => {
      await stateManager.setInitializing();
      const statusAfterInit = await localExtStorage.getItem('wasmStatus');
      expect(statusAfterInit).toBe('initializing');

      await stateManager.setFailed('Error');
      const statusAfterFailed = await localExtStorage.getItem('wasmStatus');
      expect(statusAfterFailed).toBe('failed');
    });

    it('should handle multiple failed transitions', async () => {
      await stateManager.setFailed('Error 1');
      const error1 = await localExtStorage.getItem('wasmInitError');
      expect(error1).toBe('Error 1');

      await stateManager.setFailed('Error 2');
      const error2 = await localExtStorage.getItem('wasmInitError');
      expect(error2).toBe('Error 2');

      await stateManager.setFailed('Error 3');
      const error3 = await localExtStorage.getItem('wasmInitError');
      expect(error3).toBe('Error 3');
    });

    it('should handle retry after failure (initializing again)', async () => {
      await stateManager.setFailed('First error');
      expect(await localExtStorage.getItem('wasmStatus')).toBe('failed');

      await stateManager.setInitializing(); // Retry
      expect(await localExtStorage.getItem('wasmStatus')).toBe('initializing');

      await stateManager.setSuccess();
      expect(await localExtStorage.getItem('wasmStatus')).toBe('success');
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent state changes', async () => {
      // This tests that concurrent operations don't throw
      await Promise.all([
        stateManager.setInitializing(),
        stateManager.setSuccess(),
        stateManager.setFailed('Error'),
      ]);

      // Final state should be one of the valid states
      const status = await localExtStorage.getItem('wasmStatus');
      expect(['initializing', 'success', 'failed']).toContain(status);
    });

    it('should handle rapid isReady calls', async () => {
      await localExtStorage.setItem('wasmStatus', 'success');

      const results = await Promise.all([
        stateManager.isReady(),
        stateManager.isReady(),
        stateManager.isReady(),
      ]);

      expect(results).toEqual([true, true, true]);
    });

    it('should handle rapid getStatus calls', async () => {
      await localExtStorage.setItem('wasmStatus', 'initializing');

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

    it('should handle null storage values', async () => {
      await localExtStorage.setItem('wasmStatus', null);

      const status = await stateManager.getStatus();

      expect(status.status).toBe('unknown');
    });
  });
});
