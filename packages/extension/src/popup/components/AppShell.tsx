/**
 * AppShell Component
 * Extracted from App.tsx to follow Single Responsibility Principle
 *
 * Handles app initialization and loading states:
 * - Dark mode initialization
 * - Store hydration (wait for persisted state to load)
 * - WASM compatibility checking
 * - Loading screens and fallback UI
 * - Layout structure (container with header/footer)
 *
 * This component acts as the outer shell of the application, ensuring all
 * initialization steps complete before rendering the main content (children).
 *
 * Loading sequence:
 * 1. Dark mode applies immediately (side effect)
 * 2. Wait for store hydration (async)
 * 3. Check WASM initialization
 * 4. If all ready, render children
 * 5. Otherwise, show appropriate loading/fallback UI
 *
 * @see {@link useWasmCompatibility} for WASM checking
 * @see {@link usePersistedStore} for store persistence (uses _hasHydrated pattern)
 * @see {@link useDarkMode} for dark mode initialization
 */

// React 19: No longer need useState/useEffect for hydration - using Zustand store directly
import { getContainerClass } from '../constants/app';
import { useWasmCompatibility } from '../hooks/integration/useWasmCompatibility';
import { useDarkMode } from '../hooks/ui';
import { usePopupStore } from '../store';
import { WasmFallback } from './conversion/WasmFallback';
import { LoadingScreen } from './layout';

interface AppShellProps {
  /** Child components to render when initialization complete */
  children: React.ReactNode;
}

/**
 * App Shell Component
 *
 * Manages app initialization and displays loading states until ready.
 *
 * @example
 * ```tsx
 * <AppShell>
 *   <AppRouter {...routerProps} />
 * </AppShell>
 * ```
 */
export function AppShell({ children }: AppShellProps): React.ReactElement | null {
  // Initialize dark mode (applies theme class to <html>)
  useDarkMode();

  const storeHydrated = usePopupStore(state => state._hasHydrated);

  // Check WASM compatibility
  const { wasmInitialized, wasmReport } = useWasmCompatibility();

  // Show WASM fallback if initialization failed
  if (wasmInitialized === false && wasmReport) {
    return (
      <div className={getContainerClass()}>
        <WasmFallback report={wasmReport} />
      </div>
    );
  }

  // Improved WASM initialization loading state
  if (wasmInitialized === null) {
    return (
      <div className={getContainerClass()}>
        <LoadingScreen />
      </div>
    );
  }

  // Wait for store hydration before rendering
  if (!storeHydrated) {
    return (
      <div className={getContainerClass()}>
        <LoadingScreen />
      </div>
    );
  }

  // All initialization complete - render children
  return <>{children}</>;
}
