// ABOUTME: View router for popup extension with lazy-loaded settings, help, and shortcuts modal.
// ABOUTME: Provides context providers for main view and manages focus trap for settings.

import { lazy, Match, Show, Suspense, Switch } from 'solid-js';
import type { UserSettings } from '@/shared/types/settings';
import { DEFAULT_JOB_ID, getContainerClass, getContentWrapperClass } from '../constants/app';
import { AppProvider } from '../context/AppContext';
import type { ConversionHandlers } from '../context/ConversionContext';
import { ConversionProvider } from '../context/ConversionContext';
import { QuickSettingsProvider } from '../context/QuickSettingsContext';
import { createFocusTrap } from '../reactivity/focus';
import type { ShortcutConfig } from '../reactivity/keyboard';
import { ErrorBoundary } from './ErrorBoundary';
import { AppFooter } from './layout/AppFooter';
import { AppHeader } from './layout/AppHeader';
import { MainContent } from './layout/MainContent';

// Lazy load heavy components to reduce initial bundle size
const Settings = lazy(async () =>
  import('./settings/Settings').then((m) => ({ default: m.Settings })),
);
const Help = lazy(async () => import('./Help').then((m) => ({ default: m.Help })));
const KeyboardShortcutsModal = lazy(async () =>
  import('./KeyboardShortcutsModal').then((m) => ({ default: m.KeyboardShortcutsModal })),
);

interface AppRouterProps {
  currentView: 'main' | 'settings' | 'help';
  onCloseSettings: () => Promise<void>;
  onCloseHelp: () => void;
  onOpenSettings: () => void;
  onShowHelp: () => void;
  showShortcutsModal: boolean;
  onCloseShortcutsModal: () => void;
  conversionHandlers: ConversionHandlers;
  quickSettings: {
    settings: UserSettings | null;
    handlers: {
      handlePageSizeChange: (pageSize: 'A4' | 'Letter' | 'Legal') => Promise<void>;
      handleMarginsChange: (
        preset: 'compact' | 'narrow' | 'normal' | 'wide' | 'spacious',
      ) => Promise<void>;
      handleCustomMarginChange: (
        side: 'top' | 'right' | 'bottom' | 'left',
        value: number,
      ) => Promise<void>;
    };
  };
  shortcuts: ShortcutConfig[];
}

export function AppRouter(props: AppRouterProps) {
  // Focus trap for settings view (accessibility)
  const settingsTrapRef = createFocusTrap(() => props.currentView === 'settings');

  return (
    <Switch>
      {/* Settings View */}
      <Match when={props.currentView === 'settings'}>
        <div class={getContainerClass()} ref={settingsTrapRef}>
          <ErrorBoundary>
            <Suspense
              fallback={
                <div class="flex items-center justify-center h-full">
                  <div class="text-muted-foreground">Loading settings...</div>
                </div>
              }
            >
              <Settings
                onBack={() => {
                  void props.onCloseSettings();
                }}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      </Match>

      {/* Help View */}
      <Match when={props.currentView === 'help'}>
        <div class={getContainerClass()}>
          <Suspense
            fallback={
              <div class="flex items-center justify-center h-full">
                <div class="text-muted-foreground">Loading help...</div>
              </div>
            }
          >
            <Help onBack={props.onCloseHelp} />
          </Suspense>
        </div>
      </Match>

      {/* Main View — State Machine */}
      <Match when={props.currentView === 'main'}>
        <div class={getContainerClass()}>
          <div class={getContentWrapperClass()}>
            <AppHeader onOpenSettings={props.onOpenSettings} onShowHelp={props.onShowHelp} />
            <AppProvider
              value={{ currentJobId: DEFAULT_JOB_ID, onOpenSettings: props.onOpenSettings }}
            >
              <ConversionProvider value={props.conversionHandlers}>
                <QuickSettingsProvider value={props.quickSettings}>
                  <MainContent />
                </QuickSettingsProvider>
              </ConversionProvider>
            </AppProvider>
            <AppFooter />
          </div>

          {/* Keyboard Shortcuts Help Modal */}
          <Show when={props.showShortcutsModal}>
            <ErrorBoundary>
              <Suspense fallback={null}>
                <KeyboardShortcutsModal
                  shortcuts={props.shortcuts}
                  isOpen={props.showShortcutsModal}
                  onClose={props.onCloseShortcutsModal}
                />
              </Suspense>
            </ErrorBoundary>
          </Show>
        </div>
      </Match>
    </Switch>
  );
}
