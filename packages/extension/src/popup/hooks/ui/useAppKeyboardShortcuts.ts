// ABOUTME: Keyboard shortcuts configuration for the main App component.
// ABOUTME: Returns stable shortcut configs that read latest state via useEvent.

import { useMemo } from 'react';
import type { UIState } from '../../store';
import { useEvent } from '../core/useEvent';
import type { ShortcutConfig } from './useKeyboardShortcuts';

interface UseAppKeyboardShortcutsOptions {
  uiState: UIState;
  importedFile: { name: string; content: string; size: number } | null;
  showShortcutsModal: boolean;
  currentView: 'main' | 'settings' | 'help';

  // Handlers (stable references from useEvent in App.tsx)
  onExport: () => void;
  onRetry: () => void;
  onOpenSettings: () => void;
  onCloseSettings: () => Promise<void>;
  onOpenHelp: () => void;
  onCloseHelp: () => void;
  onShowShortcutsModal: () => void;
  onHideShortcutsModal: () => void;
}

/**
 * Provides keyboard shortcuts for the App component.
 *
 * Uses useEvent for handlers that need to read current state,
 * ensuring the shortcuts array stays stable while handlers
 * always access the latest values.
 */
export function useAppKeyboardShortcuts({
  uiState,
  importedFile,
  showShortcutsModal,
  currentView,
  onExport,
  onRetry,
  onOpenSettings,
  onCloseSettings,
  onOpenHelp,
  onCloseHelp,
  onShowShortcutsModal,
  onHideShortcutsModal,
}: UseAppKeyboardShortcutsOptions): ShortcutConfig[] {
  // Wrap handlers that need to check current state
  const handleExportShortcut = useEvent(() => {
    if (uiState === 'file_validated' && importedFile) {
      onExport();
    }
  });

  const handleRetryShortcut = useEvent(() => {
    if (uiState === 'error') {
      onRetry();
    }
  });

  const handleEscapeShortcut = useEvent(() => {
    if (showShortcutsModal) {
      onHideShortcutsModal();
    } else if (currentView === 'settings') {
      void onCloseSettings();
    } else if (currentView === 'help') {
      onCloseHelp();
    }
  });

  // Shortcuts array is stable - handlers are stable via useEvent
  return useMemo(
    () => [
      {
        key: 'e',
        ctrl: true,
        meta: true,
        handler: handleExportShortcut,
        description: 'Export to PDF',
        enabled: true,
      },
      {
        key: ',',
        ctrl: true,
        meta: true,
        handler: onOpenSettings,
        description: 'Open Settings',
        enabled: true,
      },
      {
        key: 'F1',
        handler: onOpenHelp,
        description: 'Open Help',
        enabled: true,
      },
      {
        key: 'Escape',
        handler: handleEscapeShortcut,
        description: 'Close or Go Back',
        enabled: true,
      },
      {
        key: 'r',
        ctrl: true,
        meta: true,
        handler: handleRetryShortcut,
        description: 'Retry Conversion',
        enabled: true,
      },
      {
        key: '/',
        ctrl: true,
        meta: true,
        handler: onShowShortcutsModal,
        description: 'Show Keyboard Shortcuts',
        enabled: true,
      },
    ],
    [
      handleExportShortcut,
      handleRetryShortcut,
      handleEscapeShortcut,
      onOpenSettings,
      onOpenHelp,
      onShowShortcutsModal,
    ],
  );
}
