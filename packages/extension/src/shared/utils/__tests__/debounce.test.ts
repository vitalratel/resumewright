/**
 * Debounce Utility Tests
 * Comprehensive test coverage for debounce utility
 *
 * Tests both sync debounce() and async debounceAsync() functions,
 * including edge cases for cancel(), flush(), error handling, and race conditions.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce, debounceAsync } from '../debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should debounce function calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('call1');
      debouncedFn('call2');
      debouncedFn('call3');

      // Should not have called yet
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      // Should only call once with latest args
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call3');
    });

    it('should execute function after delay', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 200);

      debouncedFn('test');

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(199);
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should reset timer on subsequent calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('call1');
      vi.advanceTimersByTime(50);

      debouncedFn('call2'); // Reset timer
      vi.advanceTimersByTime(50);

      // Should not have called yet (total 100ms but timer was reset at 50ms)
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);

      // Now it should call with latest args
      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith('call2');
    });

    it('should handle multiple arguments', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2', 'arg3');
      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });

    it('should handle no arguments', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero delay', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 0);

      debouncedFn('test');

      expect(mockFn).not.toHaveBeenCalled();
      vi.advanceTimersByTime(0);

      expect(mockFn).toHaveBeenCalledOnce();
    });

    it('should handle rapid successive calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Call 100 times rapidly
      for (let i = 0; i < 100; i++) {
        debouncedFn(`call${i}`);
      }

      vi.advanceTimersByTime(100);

      // Should only call once with last value
      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith('call99');
    });

    it('should handle function that throws error', () => {
      const mockFn = vi.fn((_arg: string) => {
        throw new Error('Test error');
      });
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test');

      expect(() => {
        vi.advanceTimersByTime(100);
      }).toThrow('Test error');
    });

    it('should handle very long delays', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 10000);

      debouncedFn('test');

      vi.advanceTimersByTime(9999);
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalledOnce();
    });

    it('should allow multiple debounced functions with different delays', () => {
      const mockFn1 = vi.fn();
      const mockFn2 = vi.fn();
      const debouncedFn1 = debounce(mockFn1, 100);
      const debouncedFn2 = debounce(mockFn2, 200);

      debouncedFn1('fn1');
      debouncedFn2('fn2');

      vi.advanceTimersByTime(100);
      expect(mockFn1).toHaveBeenCalledWith('fn1');
      expect(mockFn2).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(mockFn2).toHaveBeenCalledWith('fn2');
    });
  });
});

describe('debounceAsync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should debounce async function calls', async () => {
      const mockFn = vi.fn(async (value: string) => `result: ${value}`);
      const debouncedFn = debounceAsync(mockFn, 100);

      const promise1 = debouncedFn('call1');
      const promise2 = debouncedFn('call2');
      const promise3 = debouncedFn('call3');

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      await Promise.resolve(); // Let promises resolve

      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith('call3');

      // All promises should resolve to same result
      await expect(promise1).resolves.toBe('result: call3');
      await expect(promise2).resolves.toBe('result: call3');
      await expect(promise3).resolves.toBe('result: call3');
    });

    it('should return promise that resolves with function result', async () => {
      const mockFn = vi.fn(async (x: number) => x * 2);
      const debouncedFn = debounceAsync(mockFn, 100);

      const promise = debouncedFn(5);
      vi.advanceTimersByTime(100);

      await expect(promise).resolves.toBe(10);
    });

    it('should handle multiple independent debounce cycles', async () => {
      const mockFn = vi.fn(async (value: string) => value.toUpperCase());
      const debouncedFn = debounceAsync(mockFn, 100);

      // First cycle
      const promise1 = debouncedFn('first');
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      await expect(promise1).resolves.toBe('FIRST');
      expect(mockFn).toHaveBeenCalledWith('first');

      // Second cycle
      const promise2 = debouncedFn('second');
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      await expect(promise2).resolves.toBe('SECOND');
      expect(mockFn).toHaveBeenCalledWith('second');

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('cancel() method', () => {
    it('should cancel pending operation', () => {
      const mockFn = vi.fn(async (value: string) => value);
      const debouncedFn = debounceAsync(mockFn, 100);

      debouncedFn('test').catch(() => {}); // Suppress unhandled rejection
      debouncedFn.cancel();

      vi.advanceTimersByTime(100);

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should reject pending promises when cancelled', async () => {
      const mockFn = vi.fn(async (value: string) => value);
      const debouncedFn = debounceAsync(mockFn, 100);

      const promise1 = debouncedFn('call1');
      const promise2 = debouncedFn('call2');

      // Suppress unhandled rejections
      promise1.catch(() => {});
      promise2.catch(() => {});

      debouncedFn.cancel();

      await expect(promise1).rejects.toThrow('Debounced operation cancelled');
      await expect(promise2).rejects.toThrow('Debounced operation cancelled');
    });

    it('should allow new calls after cancel', async () => {
      const mockFn = vi.fn(async (value: string) => value);
      const debouncedFn = debounceAsync(mockFn, 100);

      debouncedFn('first').catch(() => {}); // Suppress unhandled rejection
      debouncedFn.cancel();

      const promise = debouncedFn('second');
      vi.advanceTimersByTime(100);
      await Promise.resolve();

      await expect(promise).resolves.toBe('second');
      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith('second');
    });

    it('should be idempotent (multiple cancel calls safe)', () => {
      const mockFn = vi.fn(async (value: string) => value);
      const debouncedFn = debounceAsync(mockFn, 100);

      debouncedFn('test').catch(() => {}); // Suppress unhandled rejection

      expect(() => {
        debouncedFn.cancel();
        debouncedFn.cancel();
        debouncedFn.cancel();
      }).not.toThrow();
    });
  });

  describe('flush() method', () => {
    it('should immediately execute pending operation', async () => {
      const mockFn = vi.fn(async (value: string) => value.toUpperCase());
      const debouncedFn = debounceAsync(mockFn, 100);

      const promise = debouncedFn('test');

      expect(mockFn).not.toHaveBeenCalled();

      await debouncedFn.flush();

      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith('test');
      await expect(promise).resolves.toBe('TEST');
    });

    it('should resolve all pending promises on flush', async () => {
      const mockFn = vi.fn(async (value: string) => value);
      const debouncedFn = debounceAsync(mockFn, 100);

      const promise1 = debouncedFn('call1');
      const promise2 = debouncedFn('call2');
      const promise3 = debouncedFn('call3');

      await debouncedFn.flush();

      await expect(promise1).resolves.toBe('call3');
      await expect(promise2).resolves.toBe('call3');
      await expect(promise3).resolves.toBe('call3');
    });

    it('should do nothing if no pending operation', async () => {
      const mockFn = vi.fn(async (value: string) => value);
      const debouncedFn = debounceAsync(mockFn, 100);

      await expect(debouncedFn.flush()).resolves.toBeUndefined();
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should handle flush after timer expires naturally', async () => {
      const mockFn = vi.fn(async (value: string) => value);
      const debouncedFn = debounceAsync(mockFn, 100);

      void debouncedFn('test');
      vi.advanceTimersByTime(100);
      await Promise.resolve();

      // Flush after natural expiration should be safe
      await expect(debouncedFn.flush()).resolves.toBeUndefined();
      expect(mockFn).toHaveBeenCalledOnce();
    });

    it('should propagate errors from flushed operation', async () => {
      const mockFn = vi.fn(async (_arg: string) => {
        throw new Error('Flush error');
      });
      const debouncedFn = debounceAsync(mockFn, 100);

      debouncedFn('test').catch(() => {}); // Suppress unhandled rejection

      await expect(debouncedFn.flush()).rejects.toThrow('Flush error');
    });
  });

  describe('Error Handling', () => {
    it('should reject promises when async function throws', async () => {
      const mockFn = vi.fn(async (_arg: string) => {
        throw new Error('Async error');
      });
      const debouncedFn = debounceAsync(mockFn, 100);

      const promise1 = debouncedFn('call1');
      const promise2 = debouncedFn('call2');

      vi.advanceTimersByTime(100);
      await Promise.resolve();

      await expect(promise1).rejects.toThrow('Async error');
      await expect(promise2).rejects.toThrow('Async error');
    });

    it('should allow new calls after error', async () => {
      let shouldThrow = true;
      const mockFn = vi.fn(async (value: string) => {
        if (shouldThrow) {
          throw new Error('Error');
        }
        return value;
      });
      const debouncedFn = debounceAsync(mockFn, 100);

      // First call throws
      const promise1 = debouncedFn('first');
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      await expect(promise1).rejects.toThrow('Error');

      // Second call succeeds
      shouldThrow = false;
      const promise2 = debouncedFn('second');
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      await expect(promise2).resolves.toBe('second');
    });

    it('should reject all pending promises on error', async () => {
      const mockFn = vi.fn(async (_arg: string) => {
        throw new Error('Test error');
      });
      const debouncedFn = debounceAsync(mockFn, 100);

      const promises = [debouncedFn('call1'), debouncedFn('call2'), debouncedFn('call3')];

      vi.advanceTimersByTime(100);
      await Promise.resolve();

      // Verify all promises reject with the same error using Promise.all()
      await Promise.all(
        promises.map(async (promise) => expect(promise).rejects.toThrow('Test error')),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive async calls', async () => {
      const mockFn = vi.fn(async (value: string) => value);
      const debouncedFn = debounceAsync(mockFn, 100);

      const promises: Promise<string>[] = [];
      for (let i = 0; i < 50; i++) {
        promises.push(debouncedFn(`call${i}`));
      }

      vi.advanceTimersByTime(100);
      await Promise.resolve();

      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith('call49');

      // All promises should resolve to same result
      const results = await Promise.all(promises);
      expect(results.every((r) => r === 'call49')).toBe(true);
    });

    it('should handle zero delay', async () => {
      const mockFn = vi.fn(async (value: string) => value);
      const debouncedFn = debounceAsync(mockFn, 0);

      const promise = debouncedFn('test');

      vi.advanceTimersByTime(0);
      await Promise.resolve();

      await expect(promise).resolves.toBe('test');
    });

    it('should handle cancel and flush race condition', async () => {
      const mockFn = vi.fn(async (value: string) => value);
      const debouncedFn = debounceAsync(mockFn, 100);

      const promise = debouncedFn('test');
      promise.catch(() => {}); // Suppress unhandled rejection

      debouncedFn.cancel();
      await debouncedFn.flush(); // Should not throw

      await expect(promise).rejects.toThrow('Debounced operation cancelled');
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should handle flush and cancel race condition', async () => {
      const mockFn = vi.fn(async (value: string) => value);
      const debouncedFn = debounceAsync(mockFn, 100);

      debouncedFn('test').catch(() => {}); // Suppress unhandled rejection

      const flushPromise = debouncedFn.flush();
      debouncedFn.cancel(); // Cancel during flush

      // Flush should complete before cancel takes effect
      await expect(flushPromise).resolves.toBeUndefined();
    });

    it('should handle promise that resolves with undefined', async () => {
      const mockFn = vi.fn(async (): Promise<undefined> => undefined);
      const debouncedFn = debounceAsync(mockFn, 100);

      const promise = debouncedFn();
      vi.advanceTimersByTime(100);
      await Promise.resolve();

      await expect(promise).resolves.toBeUndefined();
    });

    it('should handle promise that resolves with null', async () => {
      const mockFn = vi.fn(async (): Promise<null> => null);
      const debouncedFn = debounceAsync(mockFn, 100);

      const promise = debouncedFn();
      vi.advanceTimersByTime(100);
      await Promise.resolve();

      await expect(promise).resolves.toBeNull();
    });
  });
});
