/**
 * useLoadingState Hook
 * Standardized loading state management
 *
 * Provides consistent loading state management across components.
 * Prevents race conditions and ensures proper cleanup.
 *
 * Features:
 * - Automatic cleanup on unmount
 * - Race condition protection
 * - Type-safe error handling
 * - Optional success state tracking
 *
 * @example
 * // Basic usage
 * const { loading, error, execute } = useLoadingState();
 *
 * const handleSubmit = async () => {
 *   const result = await execute(async () => {
 *     return await apiCall();
 *   });
 *   if (result.success) {
 *     // Handle success
 *   }
 * };
 *
 * @example
 * // With success state
 * const { loading, error, success, execute } = useLoadingState({ trackSuccess: true });
 *
 * return (
 *   <Button loading={loading} success={success} onClick={() => execute(saveData)}>
 *     Save
 *   </Button>
 * );
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseLoadingStateOptions {
  /** Track success state (auto-clears after 2 seconds) */
  trackSuccess?: boolean;
  /** Custom success duration in milliseconds */
  successDuration?: number;
  /** Callback when operation succeeds */
  onSuccess?: () => void;
  /** Callback when operation fails */
  onError?: (error: Error) => void;
}

interface LoadingStateResult<T> {
  success: true;
  data: T;
  error: null;
}

interface LoadingStateError {
  success: false;
  data: null;
  error: Error;
}

type LoadingStateReturn<T> = LoadingStateResult<T> | LoadingStateError;

/**
 * Hook for managing loading, error, and success states consistently
 */
export function useLoadingState<T = void>(options: UseLoadingStateOptions = {}) {
  const { trackSuccess = false, successDuration = 2000, onSuccess, onError } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  /**
   * Execute an async operation with automatic loading state management
   */
  const execute = useCallback(
    async (operation: () => Promise<T>): Promise<LoadingStateReturn<T>> => {
      // Clear previous error and success states
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
        setSuccess(false);

        // Clear any pending success timer
        if (successTimerRef.current) {
          clearTimeout(successTimerRef.current);
          successTimerRef.current = null;
        }
      }

      try {
        const data = await operation();

        if (!isMountedRef.current) {
          return { success: false, data: null, error: new Error('Component unmounted') };
        }

        setLoading(false);

        if (trackSuccess) {
          setSuccess(true);
          // Auto-clear success state after duration
          successTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setSuccess(false);
            }
          }, successDuration);
        }

        onSuccess?.();

        return { success: true, data, error: null };
      } catch (err) {
        if (!isMountedRef.current) {
          return { success: false, data: null, error: err as Error };
        }

        const error = err instanceof Error ? err : new Error('Unknown error');
        setLoading(false);
        setError(error.message);
        onError?.(error);

        return { success: false, data: null, error };
      }
    },
    [trackSuccess, successDuration, onSuccess, onError],
  );

  /**
   * Manually clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset all states
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  }, []);

  return {
    loading,
    error,
    success,
    execute,
    clearError,
    reset,
  };
}
