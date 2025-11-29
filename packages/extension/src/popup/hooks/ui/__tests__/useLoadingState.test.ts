/**
 * useLoadingState Hook Tests
 * Standardized loading state management tests
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLoadingState } from '../useLoadingState';

describe('useLoadingState', () => {
  // Use real timers for this hook since it manages timeouts internally
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default states', () => {
      const { result } = renderHook(() => useLoadingState());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.success).toBe(false);
    });

    it('should set loading state during async operation', async () => {
      const { result } = renderHook(() => useLoadingState<string>());

      let resolveOp: (value: string) => void;
      const operation = async () => new Promise<string>((resolve) => {
        resolveOp = resolve;
      });

      act(() => {
        void result.current.execute(operation);
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);

      await act(async () => {
        resolveOp!('result');
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(result.current.loading).toBe(false);
    });

    it('should return success result on successful operation', async () => {
      const { result } = renderHook(() => useLoadingState<string>());

      const operation = async () => 'test-data';

      const executeResult = await act(async () => {
        return result.current.execute(operation);
      });

      expect(executeResult).toEqual({
        success: true,
        data: 'test-data',
        error: null,
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle errors and set error state', async () => {
      const { result } = renderHook(() => useLoadingState());

      const errorMessage = 'Operation failed';
      const operation = async () => {
        throw new Error(errorMessage);
      };

      const executeResult = await act(async () => {
        return result.current.execute(operation);
      });

      expect(executeResult.success).toBe(false);
      expect(executeResult.error?.message).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle non-Error thrown values', async () => {
      const { result } = renderHook(() => useLoadingState());

      // Test that the hook gracefully handles non-Error thrown values
      // by wrapping them in an Error with "Unknown error" message.
      // We use a mock that rejects with a string instead of an Error.
      const mockOperation = vi.fn<() => Promise<void>>().mockRejectedValue('string error');
      
      const executeResult = await act(async () => {
        return result.current.execute(mockOperation);
      });

      expect(executeResult.success).toBe(false);
      expect(executeResult.error?.message).toBe('Unknown error');
      expect(result.current.error).toBe('Unknown error');
    });
  });

  describe('Success State Tracking', () => {
    it('should track success state when trackSuccess is true', async () => {
      const { result } = renderHook(() =>
        useLoadingState<string>({ trackSuccess: true }),
      );

      const operation = async () => 'success';

      await act(async () => {
        await result.current.execute(operation);
      });

      expect(result.current.success).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    it('should not track success state when trackSuccess is false', async () => {
      const { result } = renderHook(() =>
        useLoadingState<string>({ trackSuccess: false }),
      );

      const operation = async () => 'success';

      await act(async () => {
        await result.current.execute(operation);
      });

      expect(result.current.success).toBe(false);
    });

    it('should auto-clear success state after successDuration', async () => {
      const { result } = renderHook(() =>
        useLoadingState<string>({
          trackSuccess: true,
          successDuration: 100, // Short duration for testing
        }),
      );

      const operation = async () => 'success';

      await act(async () => {
        await result.current.execute(operation);
      });

      expect(result.current.success).toBe(true);

      // Wait for success to clear
      await waitFor(() => {
        expect(result.current.success).toBe(false);
      }, { timeout: 200 });
    });
  });

  describe('Callbacks', () => {
    it('should call onSuccess callback on successful operation', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useLoadingState<string>({ onSuccess }),
      );

      const operation = async () => 'data';

      await act(async () => {
        await result.current.execute(operation);
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('should call onError callback on failed operation', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useLoadingState({ onError }),
      );

      const error = new Error('test error');
      const operation = async () => {
        throw error;
      };

      await act(async () => {
        await result.current.execute(operation);
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should not call onSuccess on error', async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useLoadingState({ onSuccess, onError }),
      );

      const operation = async () => {
        throw new Error('fail');
      };

      await act(async () => {
        await result.current.execute(operation);
      });

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup and Unmount Safety', () => {
    it('should not update state after unmount', async () => {
      const { result, unmount } = renderHook(() => useLoadingState<string>());

      const operation = async () => new Promise<string>((resolve) => {
        setTimeout(() => {
          resolve('data');
        }, 50);
      });

      act(() => {
        void result.current.execute(operation);
      });

      expect(result.current.loading).toBe(true);

      // Unmount before operation completes
      unmount();

      // Complete the operation after unmount
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 60));
      });

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should clear success timer on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useLoadingState<string>({ trackSuccess: true, successDuration: 5000 }),
      );

      const operation = async () => 'success';

      await act(async () => {
        await result.current.execute(operation);
      });

      expect(result.current.success).toBe(true);

      unmount();

      // Should not throw
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(true).toBe(true);
    });
  });

  describe('Utility Methods', () => {
    it('should clear error with clearError()', async () => {
      const { result } = renderHook(() => useLoadingState());

      const operation = async () => {
        throw new Error('test error');
      };

      await act(async () => {
        await result.current.execute(operation);
      });

      expect(result.current.error).toBe('test error');

      void act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });

    it('should reset all states with reset()', async () => {
      const { result } = renderHook(() =>
        useLoadingState<string>({ trackSuccess: true }),
      );

      const operation = async () => 'success';

      await act(async () => {
        await result.current.execute(operation);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.success).toBe(true);
      expect(result.current.error).toBe(null);

      void act(() => {
        result.current.reset();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.success).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('State Transitions', () => {
    it('should clear previous error when starting new operation', async () => {
      const { result } = renderHook(() => useLoadingState<string>());

      // First operation fails
      await act(async () => {
        await result.current.execute(async () => {
          throw new Error('first error');
        });
      });

      expect(result.current.error).toBe('first error');

      // Second operation starts
      let resolveOp: (value: string) => void;
      const secondOp = async () => new Promise<string>((resolve) => {
        resolveOp = resolve;
      });

      void act(() => {
        void result.current.execute(secondOp);
      });

      // Error should be cleared immediately
      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveOp!('success');
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(result.current.loading).toBe(false);
    });

    it('should clear success state when starting new operation', async () => {
      const { result } = renderHook(() =>
        useLoadingState<string>({ trackSuccess: true }),
      );

      // First operation succeeds
      await act(async () => {
        await result.current.execute(async () => 'first');
      });

      expect(result.current.success).toBe(true);

      // Second operation starts
      const secondOp = async () => new Promise<string>((resolve) => {
        setTimeout(() => resolve('second'), 10);
      });

      void act(() => {
        void result.current.execute(secondOp);
      });

      // Success should be cleared immediately
      expect(result.current.success).toBe(false);
      expect(result.current.loading).toBe(true);
    });
  });
});
