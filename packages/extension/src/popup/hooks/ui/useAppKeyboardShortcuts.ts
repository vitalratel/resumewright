/**
 * useAppKeyboardShortcuts Hook
 *
 * Extract keyboard shortcuts logic from App.tsx
 *
 * Solution: Use refs for frequently changing values + stable callback handlers
 * to ensure shortcuts array only recreates when actual handler functions change.
 */

import type { UIState } from '../../store';
import type { ShortcutConfig } from './useKeyboardShortcuts';
import { useCallback, useEffect, useMemo, useRef } from 'react';

export interface UseAppKeyboardShortcutsOptions {
  uiState: UIState;
  importedFile: { name: string; content: string; size: number } | null;
  showShortcutsModal: boolean;
  currentView: 'main' | 'settings' | 'help';

  // Handlers
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
 * Provides stable keyboard shortcuts array for App component
 *
 * Uses refs for frequently changing state (uiState, modal visibility, etc.)
 * to prevent shortcuts array recreation on every render.
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
  // Use refs for frequently changing values to avoid recreating handlers
  const uiStateRef = useRef(uiState);
  const importedFileRef = useRef(importedFile);
  const showShortcutsModalRef = useRef(showShortcutsModal);
  const currentViewRef = useRef(currentView);

  // Keep refs updated
  useEffect(() => {
    uiStateRef.current = uiState;
  }, [uiState]);

  useEffect(() => {
    importedFileRef.current = importedFile;
  }, [importedFile]);

  useEffect(() => {
    showShortcutsModalRef.current = showShortcutsModal;
  }, [showShortcutsModal]);

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  // Stable handlers that read from refs
  // Only recreate when the actual handler functions change, not when state changes

  const handleExportShortcut = useCallback(() => {
    if (uiStateRef.current === 'file_validated' && importedFileRef.current) {
      onExport();
    }
  }, [onExport]);

  const handleRetryShortcut = useCallback(() => {
    if (uiStateRef.current === 'error') {
      onRetry();
    }
  }, [onRetry]);

  const handleEscapeShortcut = useCallback(() => {
    if (showShortcutsModalRef.current) {
      onHideShortcutsModal();
    }
    else if (currentViewRef.current === 'settings') {
      void onCloseSettings();
    }
    else if (currentViewRef.current === 'help') {
      onCloseHelp();
    }
  }, [onHideShortcutsModal, onCloseSettings, onCloseHelp]);

  // Return stable shortcuts array
  // Only recreates when handler functions change, not when state changes
  return useMemo(() => [
    // Primary Actions
    {
      key: 'e',
      ctrl: true,
      meta: true,
      handler: handleExportShortcut,
      description: 'Export to PDF',
      // Note: enabled check uses refs inside handler, not here
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
  ], [
    handleExportShortcut,
    handleRetryShortcut,
    handleEscapeShortcut,
    onOpenSettings,
    onOpenHelp,
    onShowShortcutsModal,
  ]);
}
