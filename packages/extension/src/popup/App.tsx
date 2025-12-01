/**
 * Main Popup App Component
 *
 * Implements state machine: no_cv → cv_detected → converting → success/error
 *
 * Refactored to improve token-efficiency and maintainability by extracting:
 * - Custom hooks for WASM, state management, handlers, and settings
 * - Layout components for header, footer, loading, and content
 * - Constants for reusable values
 *
 * Includes keyboard shortcuts, screen reader announcements, and focus management.
 */

import { useCallback, useState } from 'react';
import { AppRouter } from './components/AppRouter';
import { AppShell } from './components/AppShell';
import { Button, Spinner } from './components/common';
import { DEFAULT_JOB_ID, getContainerClass } from './constants/app';
import { useConversionHandlers } from './hooks/conversion/useConversionHandlers';
import { useAppState, useAppSubscriptions } from './hooks/integration';
import { useQuickSettings } from './hooks/settings';
import {
  useAppKeyboardShortcuts,
  useFocusOnMount,
  useKeyboardShortcuts,
  useScreenReaderAnnouncement,
} from './hooks/ui';
import { usePopupStore } from './store';
import { useProgressStore } from './store/progressStore';

function App() {
  const hasHydrated = usePopupStore((state) => state._hasHydrated);
  const hydrationError = usePopupStore((state) => state._hydrationError);

  // State management (view routing and modal visibility)
  const [currentView, setCurrentView] = useState<'main' | 'settings' | 'help'>('main');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false); // Keyboard shortcuts help modal

  // Initialize hooks
  const appState = useAppState();
  // FIX: Extract only reloadSettings to avoid unstable object reference in handleCloseSettings
  const quickSettings = useQuickSettings();
  const { reloadSettings } = quickSettings;
  // Track active jobs dynamically (support multiple concurrent conversions)
  // Only track current job ID to prevent re-renders on progress updates
  const currentJobId = useProgressStore((state) => {
    const jobIds = Object.keys(state.activeConversions);
    return jobIds.length > 0 ? jobIds[0] : DEFAULT_JOB_ID;
  });

  const conversionHandlers = useConversionHandlers({
    appState,
    currentJobId,
    wasmInitialized: true, // AppShell ensures WASM is initialized before rendering this
  });

  // Subscribe to extensionAPI messages (progress, success, error)
  useAppSubscriptions();

  // Subscribe to primitive values from stores (stable, no object wrappers)
  // Use currentJobId for progress tracking (supports multiple jobs)
  const progressPercentage = useProgressStore(
    (state) => state.activeConversions[currentJobId]?.percentage
  );
  const progressOperation = useProgressStore(
    (state) => state.activeConversions[currentJobId]?.currentOperation
  );
  const lastErrorMessage = appState.lastError?.message;

  // Focus management for screen readers
  const successRef = useFocusOnMount(
    appState.uiState === 'success' ? appState.lastFilename : undefined
  );
  const errorRef = useFocusOnMount(appState.uiState === 'error' ? lastErrorMessage : undefined);

  // Screen reader announcements for conversion progress
  // Simple string concatenation - no useMemo needed (overhead > savings)
  const progressMessage =
    progressPercentage !== undefined && appState.uiState === 'converting'
      ? `Converting: ${progressPercentage}% complete. ${progressOperation}`
      : null;
  useScreenReaderAnnouncement(progressMessage, 'polite');

  // Announce state transitions to screen readers
  // Simple switch statement - no useMemo needed (overhead > savings)
  let stateMessage: string | null = null;
  switch (appState.uiState) {
    case 'waiting_for_import':
      // No announcement needed - waiting for user action
      stateMessage = null;
      break;
    case 'validation_error':
      stateMessage =
        appState.validationError !== null &&
        appState.validationError !== undefined &&
        appState.validationError !== ''
          ? appState.validationError
          : 'Validation error occurred';
      break;
    case 'file_validated':
      stateMessage = 'File validated successfully. Ready to export to PDF.';
      break;
    case 'converting':
      // Progress announcements handled separately above
      stateMessage = null;
      break;
    case 'success':
      stateMessage = `PDF exported successfully: ${appState.lastFilename}`;
      break;
    case 'error':
      stateMessage = `Error: ${lastErrorMessage}`;
      break;
  }
  useScreenReaderAnnouncement(stateMessage, appState.uiState === 'error' ? 'assertive' : 'polite');

  // Settings navigation handlers
  // Memoize callbacks passed to children
  const handleOpenSettings = useCallback(() => setCurrentView('settings'), []);
  const handleCloseSettings = useCallback(async () => {
    // Reload settings BEFORE changing view
    // This prevents race condition between Settings unmount cleanup and reloadSettings() state update
    // FIX: Use reloadSettings directly (stable function reference)
    await reloadSettings();
    setCurrentView('main');
  }, [reloadSettings]); // FIX: reloadSettings is stable (useCallback in hook)

  // Help navigation handlers
  const handleOpenHelp = useCallback(() => setCurrentView('help'), []);
  const handleCloseHelp = useCallback(() => setCurrentView('main'), []);

  // Keyboard shortcuts for accessibility and power users
  // Extract to useAppKeyboardShortcuts hook to prevent memory leak
  // Memoize callback handlers to prevent hook from recreating shortcuts
  const handleRetry = useCallback(() => appState.reset(), [appState]);
  const handleExport = useCallback(() => {
    void conversionHandlers.handleExportClick();
  }, [conversionHandlers]);
  const handleShowShortcuts = useCallback(() => setShowShortcutsModal(true), []);
  const handleHideShortcuts = useCallback(() => setShowShortcutsModal(false), []);

  const shortcuts = useAppKeyboardShortcuts({
    uiState: appState.uiState,
    importedFile: appState.importedFile,
    showShortcutsModal,
    currentView,
    onExport: handleExport,
    onRetry: handleRetry,
    onOpenSettings: handleOpenSettings,
    onCloseSettings: handleCloseSettings,
    onOpenHelp: handleOpenHelp,
    onCloseHelp: handleCloseHelp,
    onShowShortcutsModal: handleShowShortcuts,
    onHideShortcutsModal: handleHideShortcuts,
  });

  useKeyboardShortcuts(shortcuts);

  // FIX: Show error state for hydration failures
  if (hydrationError) {
    return (
      <AppShell>
        <div className={getContainerClass()}>
          <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
            <div className="text-red-600 text-4xl">⚠️</div>
            <h2 className="text-lg font-semibold text-gray-900">Failed to Load Settings</h2>
            <p className="text-sm text-gray-600 max-w-md">{hydrationError.message}</p>
            <Button fullWidth={false} onClick={() => window.location.reload()}>
              Reload Extension
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  // Show loading screen during store hydration
  if (!hasHydrated) {
    return (
      <AppShell>
        <div className={getContainerClass()}>
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Spinner size="large" />
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AppRouter
        currentView={currentView}
        onCloseSettings={handleCloseSettings}
        onCloseHelp={handleCloseHelp}
        onOpenSettings={handleOpenSettings}
        onShowHelp={handleOpenHelp}
        showShortcutsModal={showShortcutsModal}
        onCloseShortcutsModal={() => setShowShortcutsModal(false)}
        appState={appState}
        conversionHandlers={conversionHandlers}
        quickSettings={quickSettings}
        shortcuts={shortcuts}
        successRef={successRef}
        errorRef={errorRef}
      />
    </AppShell>
  );
}

export default App;
