/**
 * ABOUTME: Root application component for the converter UI.
 * ABOUTME: Orchestrates state, routing, keyboard shortcuts, and screen reader announcements.
 */

import { createSignal, onMount, Show } from 'solid-js';
import { AppRouter } from './components/AppRouter';
import { AppShell } from './components/AppShell';
import { Button } from './components/common/Button';
import { DEFAULT_JOB_ID, getContainerClass } from './constants/app';
import { createConversionHandlers } from './reactivity/conversion';
import { createFocusOnMount, createScreenReaderAnnouncement } from './reactivity/focus';
import { createKeyboardShortcuts, type ShortcutConfig } from './reactivity/keyboard';
import { createQuickSettings } from './reactivity/quickSettings';
import { createAppSubscriptions } from './reactivity/subscriptions';
import { popupStore } from './store';
import { progressStore } from './store/progressStore';

function App() {
  // Hydrate persisted state from Chrome storage
  onMount(() => {
    void popupStore.hydrate();
  });

  // View routing
  const [currentView, setCurrentView] = createSignal<'main' | 'settings' | 'help'>('main');
  const [showShortcutsModal, setShowShortcutsModal] = createSignal(false);

  // Quick settings (load from Chrome storage with fallback)
  const quickSettings = createQuickSettings();

  // Conversion handlers (file validation, export, error recovery)
  const conversionHandlers = createConversionHandlers(DEFAULT_JOB_ID);

  // Message subscriptions (progress, success, error from background)
  createAppSubscriptions();

  // Focus management for screen readers
  createFocusOnMount(() => popupStore.state.uiState === 'success');
  createFocusOnMount(() => popupStore.state.uiState === 'error');

  // Screen reader announcements for conversion progress
  createScreenReaderAnnouncement(
    () => {
      const progress = progressStore.state.activeConversions[DEFAULT_JOB_ID];
      if (progress && popupStore.state.uiState === 'converting') {
        return `Converting: ${progress.percentage}% complete. ${progress.currentOperation}`;
      }
      return null;
    },
    () => 'polite',
  );

  // Announce state transitions to screen readers
  createScreenReaderAnnouncement(
    () => {
      switch (popupStore.state.uiState) {
        case 'waiting_for_import':
        case 'converting':
          return null;
        case 'validation_error':
          return popupStore.state.validationError ?? 'Validation error occurred';
        case 'file_validated':
          return 'File validated successfully. Ready to export to PDF.';
        case 'success':
          return `PDF exported successfully: ${popupStore.state.lastFilename}`;
        case 'error':
          return `Error: ${popupStore.state.lastError?.message}`;
      }
    },
    () => (popupStore.state.uiState === 'error' ? 'assertive' : 'polite'),
  );

  // Navigation handlers
  const handleOpenSettings = () => setCurrentView('settings');
  const handleCloseSettings = async () => {
    await quickSettings.reloadSettings();
    setCurrentView('main');
  };
  const handleOpenHelp = () => setCurrentView('help');
  const handleCloseHelp = () => setCurrentView('main');

  // Keyboard shortcuts
  const shortcuts: ShortcutConfig[] = [
    {
      key: 'e',
      ctrl: true,
      meta: true,
      handler: () => {
        if (popupStore.state.uiState === 'file_validated' && popupStore.state.importedFile) {
          void conversionHandlers.handleExportClick();
        }
      },
      description: 'Export to PDF',
      enabled: true,
    },
    {
      key: ',',
      ctrl: true,
      meta: true,
      handler: handleOpenSettings,
      description: 'Open Settings',
      enabled: true,
    },
    {
      key: 'F1',
      handler: handleOpenHelp,
      description: 'Open Help',
      enabled: true,
    },
    {
      key: 'Escape',
      handler: () => {
        if (showShortcutsModal()) {
          setShowShortcutsModal(false);
        } else if (currentView() === 'settings') {
          void handleCloseSettings();
        } else if (currentView() === 'help') {
          handleCloseHelp();
        }
      },
      description: 'Close or Go Back',
      enabled: true,
    },
    {
      key: 'r',
      ctrl: true,
      meta: true,
      handler: () => {
        if (popupStore.state.uiState === 'error') {
          conversionHandlers.handleRetry();
        }
      },
      description: 'Retry Conversion',
      enabled: true,
    },
    {
      key: '/',
      ctrl: true,
      meta: true,
      handler: () => setShowShortcutsModal(true),
      description: 'Show Keyboard Shortcuts',
      enabled: true,
    },
  ];

  createKeyboardShortcuts(shortcuts);

  return (
    <AppShell>
      <Show
        when={popupStore.state.hydrationError}
        fallback={
          <AppRouter
            currentView={currentView()}
            onCloseSettings={handleCloseSettings}
            onCloseHelp={handleCloseHelp}
            onOpenSettings={handleOpenSettings}
            onShowHelp={handleOpenHelp}
            showShortcutsModal={showShortcutsModal()}
            onCloseShortcutsModal={() => setShowShortcutsModal(false)}
            conversionHandlers={conversionHandlers}
            quickSettings={{
              get settings() {
                return quickSettings.settings();
              },
              handlers: quickSettings.handlers,
            }}
            shortcuts={shortcuts}
          />
        }
      >
        {(error) => (
          <div class={getContainerClass()}>
            <div class="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
              <div class="text-destructive text-4xl" aria-hidden="true">
                ⚠️
              </div>
              <h2 class="text-lg font-semibold text-foreground">Failed to Load Settings</h2>
              <p class="text-sm text-muted-foreground max-w-md">{error().message}</p>
              <Button fullWidth={false} onClick={() => window.location.reload()}>
                Reload Extension
              </Button>
            </div>
          </div>
        )}
      </Show>
    </AppShell>
  );
}

export default App;
