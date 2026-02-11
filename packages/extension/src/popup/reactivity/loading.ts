// ABOUTME: Standardized loading state management for async operations.
// ABOUTME: Provides loading, error, and optional success tracking with cleanup.

import type { Accessor } from 'solid-js';
import { createSignal, onCleanup } from 'solid-js';

interface LoadingStateOptions {
  /** Track success state (auto-clears after duration) */
  trackSuccess?: boolean;
  /** Custom success duration in milliseconds (default: 2000) */
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
 * Manage loading, error, and success states for async operations.
 *
 * @param options - Configuration for success tracking, callbacks, etc.
 * @returns Object with state accessors, execute function, clearError, and reset
 */
export function createLoadingState<T = void>(options: LoadingStateOptions = {}) {
  const { trackSuccess = false, successDuration = 2000, onSuccess, onError } = options;

  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal(false);

  let successTimer: ReturnType<typeof setTimeout> | null = null;

  const clearSuccessTimer = () => {
    if (successTimer !== null) {
      clearTimeout(successTimer);
      successTimer = null;
    }
  };

  onCleanup(clearSuccessTimer);

  const execute = async (operation: () => Promise<T>): Promise<LoadingStateReturn<T>> => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    clearSuccessTimer();

    try {
      const data = await operation();

      setLoading(false);

      if (trackSuccess) {
        setSuccess(true);
        successTimer = setTimeout(() => {
          setSuccess(false);
          successTimer = null;
        }, successDuration);
      }

      onSuccess?.();

      return { success: true, data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setLoading(false);
      setError(error.message);
      onError?.(error);

      return { success: false, data: null, error };
    }
  };

  const clearError = () => setError(null);

  const reset = () => {
    setLoading(false);
    setError(null);
    setSuccess(false);
    clearSuccessTimer();
  };

  return {
    loading: loading as Accessor<boolean>,
    error: error as Accessor<string | null>,
    success: success as Accessor<boolean>,
    execute,
    clearError,
    reset,
  };
}
