/**
 * Debounce Utility
 * Debounce expensive operations like state persistence
 */

/**
 * Debounce a function to reduce call frequency
 * @param fn - Function to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Debounced function with cancel and flush methods
 */
export function debounce<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  delayMs: number,
): ((...args: TArgs) => void) & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: TArgs | undefined;

  const debouncedFn = (...args: TArgs) => {
    lastArgs = args;
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = undefined;
      lastArgs = undefined;
    }, delayMs);
  };

  // Add cancel method to clear pending operations
  debouncedFn.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
      lastArgs = undefined;
    }
  };

  // Add flush method to immediately execute pending operation
  debouncedFn.flush = () => {
    if (timeoutId !== undefined && lastArgs !== undefined) {
      clearTimeout(timeoutId);
      fn(...lastArgs);
      timeoutId = undefined;
      lastArgs = undefined;
    }
  };

  return debouncedFn;
}

/**
 * Debounce an async function to reduce call frequency
 * Returns a promise that resolves when the debounced function finally executes
 * @param fn - Async function to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Debounced async function with cancel method
 */
export function debounceAsync<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  delayMs: number,
): ((...args: TArgs) => Promise<TReturn>) & { cancel: () => void; flush: () => Promise<void> } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let resolveQueue: ((value: TReturn) => void)[] = [];
  let rejectQueue: ((reason: Error) => void)[] = [];
  let pendingArgs: TArgs | undefined;

  const debouncedFn = async (...args: TArgs): Promise<TReturn> => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    // Store the latest args for flush()
    pendingArgs = args;

    // Create promise that will resolve when function executes
    const promise = new Promise<TReturn>((resolve, reject) => {
      resolveQueue.push(resolve);
      rejectQueue.push(reject);
    });

    timeoutId = setTimeout(() => {
      void (async () => {
      try {
        const result = await fn(...args);

        // Resolve all waiting promises
        for (const resolve of resolveQueue) {
          resolve(result);
        }
        resolveQueue = [];
        rejectQueue = [];
        pendingArgs = undefined;
      }
      catch (error) {
        // Reject all waiting promises
        for (const reject of rejectQueue) {
          reject(error as Error);
        }
        resolveQueue = [];
        rejectQueue = [];
        pendingArgs = undefined;
      }
      })();
    }, delayMs);

    return promise;
  };

  // Add cancel method to clear pending operations
  debouncedFn.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    // Reject all pending promises
    const cancelError = new Error('Debounced operation cancelled');
    for (const reject of rejectQueue) {
      reject(cancelError);
    }
    resolveQueue = [];
    rejectQueue = [];
    pendingArgs = undefined;
  };

  // Add flush method to immediately execute pending operation
  // Flush debounced writes on popup close to prevent data loss
  debouncedFn.flush = async () => {
    if (timeoutId !== undefined && pendingArgs !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;

      const args = pendingArgs;
      pendingArgs = undefined;

      try {
        const result = await fn(...args);

        // Resolve all waiting promises
        for (const resolve of resolveQueue) {
          resolve(result);
        }
        resolveQueue = [];
        rejectQueue = [];
      }
      catch (error) {
        // Reject all waiting promises
        for (const reject of rejectQueue) {
          reject(error as Error);
        }
        resolveQueue = [];
        rejectQueue = [];
        throw error;
      }
    }
  };

  return debouncedFn;
}
