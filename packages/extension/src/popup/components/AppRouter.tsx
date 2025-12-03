/**
 * AppRouter Component
 * Extracted from App.tsx to follow Single Responsibility Principle
 *
 * Handles view routing and modal management:
 * - Routes between main, settings, and help views
 * - Manages keyboard shortcuts modal state and rendering
 * - Applies focus trap to settings view for accessibility
 * - Provides consistent layout structure (container + header/footer for main view)
 *
 * This component is responsible for all view transitions and modal displays,
 * keeping routing logic separate from app orchestration and state management.
 *
 * Views:
 * - main: Main app flow with header, MainContent, footer
 * - settings: Settings page with focus trap
 * - help: Help page
 *
 * Modals (overlays on main view):
 * - Keyboard shortcuts modal: Shows available shortcuts
 *
 * @see {@link Settings} for settings view
 * @see {@link Help} for help view
 * @see {@link MainContent} for main view content
 * @see {@link KeyboardShortcutsModal} for shortcuts modal
 */

import type React from 'react';
import { lazy, Suspense } from 'react';
import type { UserSettings } from '@/shared/types/settings';
import { DEFAULT_JOB_ID, getContainerClass, getContentWrapperClass } from '../constants/app';
import { AppProvider, ConversionProvider, QuickSettingsProvider } from '../context';
import type { ConversionHandlers } from '../hooks/conversion/useConversionHandlers';
import type { AppState } from '../hooks/integration/useAppState';
import { useFocusTrap } from '../hooks/ui/useFocusManagement';
import type { ShortcutConfig } from '../hooks/ui/useKeyboardShortcuts';
import { tokens } from '../styles/tokens';
import { ErrorBoundary } from './ErrorBoundary';
import { AppFooter, AppHeader, MainContent } from './layout';

// Lazy load heavy components to reduce initial bundle size
// P2-PERF: Code splitting for Settings, Help, and modals (~150KB reduction)
const Settings = lazy(async () => import('./settings').then((m) => ({ default: m.Settings })));
const Help = lazy(async () => import('./Help').then((m) => ({ default: m.Help })));
const KeyboardShortcutsModal = lazy(async () =>
  import('./KeyboardShortcutsModal').then((m) => ({ default: m.KeyboardShortcutsModal })),
);

interface AppRouterProps {
  /** Current view to display */
  currentView: 'main' | 'settings' | 'help';

  /** Callback when settings view should close */
  onCloseSettings: () => Promise<void>;

  /** Callback when help view should close */
  onCloseHelp: () => void;

  /** Callback to open settings view */
  onOpenSettings: () => void;

  /** Callback to show help view */
  onShowHelp: () => void;

  /** Whether shortcuts modal is visible */
  showShortcutsModal: boolean;

  /** Callback when shortcuts modal close requested */
  onCloseShortcutsModal: () => void;

  /** App state for main view */
  appState: AppState;

  /** Conversion handlers for main view */
  conversionHandlers: ConversionHandlers;

  /** Quick settings API for main view */
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

  /** Keyboard shortcuts for shortcuts modal */
  shortcuts: ShortcutConfig[];

  /** Ref for success state focus management */
  successRef: React.RefObject<HTMLDivElement | null>;

  /** Ref for error state focus management */
  errorRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * App Router Component
 *
 * Routes between views and manages modals.
 *
 * @example
 * ```tsx
 * <AppRouter
 *   currentView="main"
 *   onCloseSettings={handleCloseSettings}
 *   onCloseHelp={handleCloseHelp}
 *   onOpenSettings={handleOpenSettings}
 *   onShowHelp={handleShowHelp}
 *   showShortcutsModal={false}
 *   onCloseShortcutsModal={() => setShowShortcutsModal(false)}
 *   appState={appState}
 *   conversionHandlers={conversionHandlers}
 *   quickSettings={quickSettings}
 *   shortcuts={shortcuts}
 *   successRef={successRef}
 *   errorRef={errorRef}
 * />
 * ```
 */
export function AppRouter({
  currentView,
  onCloseSettings,
  onCloseHelp,
  onOpenSettings,
  onShowHelp,
  showShortcutsModal,
  onCloseShortcutsModal,
  appState,
  conversionHandlers,
  quickSettings,
  shortcuts,
  successRef,
  errorRef,
}: AppRouterProps): React.ReactElement {
  // Focus trap for settings view (accessibility)
  const settingsTrapRef = useFocusTrap(currentView === 'settings');

  // Settings View
  // Wrap Settings in ErrorBoundary to prevent crashes from propagating
  // P2-PERF: Lazy load Settings component to reduce initial bundle
  if (currentView === 'settings') {
    return (
      <div className={getContainerClass()} ref={settingsTrapRef}>
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <div className={tokens.colors.neutral.textMuted}>Loading settings...</div>
              </div>
            }
          >
            <Settings
              onBack={() => {
                void onCloseSettings();
              }}
            />
          </Suspense>
        </ErrorBoundary>
      </div>
    );
  }

  // Help View
  if (currentView === 'help') {
    return (
      <div className={getContainerClass()}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className={tokens.colors.neutral.textMuted}>Loading help...</div>
            </div>
          }
        >
          <Help onBack={onCloseHelp} />
        </Suspense>
      </div>
    );
  }

  // Main View - State Machine
  // Wrap MainContent with context providers to eliminate prop drilling
  return (
    <div className={getContainerClass()}>
      <div className={getContentWrapperClass()}>
        <AppHeader onOpenSettings={onOpenSettings} onShowHelp={onShowHelp} />
        <AppProvider
          value={{ appState, currentJobId: DEFAULT_JOB_ID, successRef, errorRef, onOpenSettings }}
        >
          <ConversionProvider value={conversionHandlers}>
            <QuickSettingsProvider value={quickSettings}>
              <MainContent />
            </QuickSettingsProvider>
          </ConversionProvider>
        </AppProvider>
        <AppFooter />
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      {showShortcutsModal && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <KeyboardShortcutsModal
              shortcuts={shortcuts}
              isOpen={showShortcutsModal}
              onClose={onCloseShortcutsModal}
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}
