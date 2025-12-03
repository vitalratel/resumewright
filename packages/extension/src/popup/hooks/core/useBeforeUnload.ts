/**
 * useBeforeUnload Hook
 *
 * Prevent navigation/window close when there are unsaved changes
 *
 * Displays browser confirmation dialog when user attempts to:
 * - Close browser tab/window
 * - Refresh page
 * - Navigate to different URL
 *
 * Use for preventing data loss from in-progress operations.
 */

import { useEffect } from 'react';

/**
 * Block window unload (close/refresh) when condition is true
 *
 * @param shouldBlock - Whether to block unload (e.g., hasUnsavedChanges)
 * @param message - Message to show in confirmation dialog
 *
 * @example
 * ```tsx
 * function Form() {
 *   const [isDirty, setIsDirty] = useState(false);
 *
 *   useBeforeUnload(
 *     isDirty,
 *     'You have unsaved changes. Are you sure you want to leave?'
 *   );
 *
 *   // ... form implementation
 * }
 * ```
 */
export function useBeforeUnload(
  shouldBlock: boolean,
  message: string = 'Are you sure you want to leave?',
): void {
  useEffect(() => {
    if (!shouldBlock) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return message;
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [shouldBlock, message]);
}
