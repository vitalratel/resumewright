/**
 * ABOUTME: Tests for createLoadingState reactive function.
 * ABOUTME: Validates loading, error, and success state management with async operations.
 */

import { renderHook } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLoadingState } from '../loading';

describe('createLoadingState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('starts with loading=false, error=null, success=false', () => {
      const { result } = renderHook(() => createLoadingState());

      expect(result.loading()).toBe(false);
      expect(result.error()).toBeNull();
      expect(result.success()).toBe(false);
    });
  });

  describe('Execute - Success', () => {
    it('sets loading=true during execution', async () => {
      const { result } = renderHook(() => createLoadingState());

      let resolveOp: () => void;
      const operation = new Promise<void>((resolve) => {
        resolveOp = resolve;
      });

      const executePromise = result.execute(() => operation);

      expect(result.loading()).toBe(true);

      resolveOp!();
      await executePromise;

      expect(result.loading()).toBe(false);
    });

    it('returns success result with data', async () => {
      const { result } = renderHook(() => createLoadingState<string>());

      const res = await result.execute(async () => 'data');

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('data');
      }
    });

    it('clears error on new execution', async () => {
      const { result } = renderHook(() => createLoadingState());

      // First: cause an error
      await result.execute(async () => {
        throw new Error('fail');
      });
      expect(result.error()).toBe('fail');

      // Second: successful execution clears error
      await result.execute(async () => {});
      expect(result.error()).toBeNull();
    });
  });

  describe('Execute - Error', () => {
    it('sets error message on failure', async () => {
      const { result } = renderHook(() => createLoadingState());

      await result.execute(async () => {
        throw new Error('Something went wrong');
      });

      expect(result.loading()).toBe(false);
      expect(result.error()).toBe('Something went wrong');
    });

    it('handles non-Error throws', async () => {
      const { result } = renderHook(() => createLoadingState());

      await result.execute(async () => {
        throw 'string error';
      });

      expect(result.error()).toBe('Unknown error');
    });

    it('returns error result', async () => {
      const { result } = renderHook(() => createLoadingState());

      const res = await result.execute(async () => {
        throw new Error('oops');
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.message).toBe('oops');
      }
    });

    it('calls onError callback', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => createLoadingState({ onError }));

      await result.execute(async () => {
        throw new Error('callback test');
      });

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'callback test' }));
    });
  });

  describe('Success Tracking', () => {
    it('does not track success by default', async () => {
      const { result } = renderHook(() => createLoadingState());

      await result.execute(async () => {});

      expect(result.success()).toBe(false);
    });

    it('sets success=true when trackSuccess enabled', async () => {
      const { result } = renderHook(() => createLoadingState({ trackSuccess: true }));

      await result.execute(async () => {});

      expect(result.success()).toBe(true);
    });

    it('auto-clears success after duration', async () => {
      const { result } = renderHook(() =>
        createLoadingState({ trackSuccess: true, successDuration: 1000 }),
      );

      await result.execute(async () => {});
      expect(result.success()).toBe(true);

      vi.advanceTimersByTime(1000);
      expect(result.success()).toBe(false);
    });

    it('uses default 2000ms success duration', async () => {
      const { result } = renderHook(() => createLoadingState({ trackSuccess: true }));

      await result.execute(async () => {});
      expect(result.success()).toBe(true);

      vi.advanceTimersByTime(1999);
      expect(result.success()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(result.success()).toBe(false);
    });

    it('calls onSuccess callback', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => createLoadingState({ onSuccess }));

      await result.execute(async () => {});

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearError', () => {
    it('clears error state', async () => {
      const { result } = renderHook(() => createLoadingState());

      await result.execute(async () => {
        throw new Error('test');
      });
      expect(result.error()).toBe('test');

      result.clearError();
      expect(result.error()).toBeNull();
    });
  });

  describe('reset', () => {
    it('resets all states', async () => {
      const { result } = renderHook(() => createLoadingState({ trackSuccess: true }));

      await result.execute(async () => {});
      expect(result.success()).toBe(true);

      result.reset();

      expect(result.loading()).toBe(false);
      expect(result.error()).toBeNull();
      expect(result.success()).toBe(false);
    });

    it('clears pending success timer', async () => {
      const { result } = renderHook(() =>
        createLoadingState({ trackSuccess: true, successDuration: 5000 }),
      );

      await result.execute(async () => {});
      expect(result.success()).toBe(true);

      result.reset();
      expect(result.success()).toBe(false);

      // Timer should be cleared, so advancing shouldn't cause issues
      vi.advanceTimersByTime(5000);
      expect(result.success()).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('cleans up success timer on cleanup', async () => {
      const { result, cleanup } = renderHook(() =>
        createLoadingState({ trackSuccess: true, successDuration: 5000 }),
      );

      await result.execute(async () => {});

      cleanup();

      // Timer count should be 0 after cleanup
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('Race Conditions', () => {
    it('clears previous success timer on new execution', async () => {
      const { result } = renderHook(() =>
        createLoadingState({ trackSuccess: true, successDuration: 5000 }),
      );

      // First execution
      await result.execute(async () => {});
      expect(result.success()).toBe(true);

      // Second execution before timer fires
      await result.execute(async () => {});
      expect(result.success()).toBe(true);

      // Only one timer should be active
      expect(vi.getTimerCount()).toBe(1);
    });
  });
});
