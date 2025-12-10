// ABOUTME: Stable callback reference that always reads latest props/state.
// ABOUTME: Polyfill for React's upcoming useEffectEvent hook.

import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * Returns a stable callback reference that always calls the latest version
 * of the provided function.
 *
 * Use this for event handlers passed to effects or memoized children.
 * The returned function never changes identity, but always invokes the
 * most recent callback.
 *
 * This is a polyfill for React's experimental useEffectEvent hook.
 * When React ships useEffectEvent as stable, replace this with the official version.
 *
 * @example
 * ```tsx
 * function App() {
 *   const [count, setCount] = useState(0);
 *
 *   // handleClick is stable (same reference every render)
 *   // but always reads the latest count value
 *   const handleClick = useEvent(() => {
 *     console.log('Count is:', count);
 *   });
 *
 *   return <MemoizedChild onClick={handleClick} />;
 * }
 * ```
 */
export function useEvent<T extends (...args: never[]) => unknown>(handler: T): T {
  const handlerRef = useRef(handler);

  // Update ref synchronously before paint
  useLayoutEffect(() => {
    handlerRef.current = handler;
  });

  // Return stable callback that reads from ref at call time
  return useCallback((...args: Parameters<T>): ReturnType<T> => {
    return handlerRef.current(...args) as ReturnType<T>;
  }, []) as T;
}
