/**
 * Keyboard Shortcut Utilities
 * Display platform-specific shortcuts
 * Centralized shortcut configuration
 */

import type { ShortcutConfig } from '../hooks/ui/useKeyboardShortcuts';
import React from 'react';
import { getModifierKey } from '../hooks/ui/useKeyboardShortcuts';

/**
 * Get the platform-specific shortcut display string
 * @param key - The main key
 * @param withModifier - Whether to include the modifier key (Cmd/Ctrl)
 * @returns Formatted shortcut string
 */
export function getShortcutDisplay(key: string, withModifier: boolean = true): string {
  if (!withModifier) return key;
  return `${getModifierKey()}${key}`;
}

/**
 * Convert cross-platform shortcut to platform-specific display
 * @param shortcut - Cross-platform shortcut (e.g., "Ctrl+E", "Ctrl+,")
 * @returns Platform-specific shortcut (e.g., "⌘E" on Mac, "Ctrl+E" on Windows/Linux)
 */
export function getPlatformShortcut(shortcut: string): string {
  const isMac =
    typeof navigator !== 'undefined' &&
    navigator.userAgent !== null &&
    navigator.userAgent !== undefined &&
    navigator.userAgent.toUpperCase().includes('MAC');
  return shortcut.replace('Ctrl', isMac ? '⌘' : 'Ctrl');
}

/**
 * Render keyboard shortcut as JSX element
 * @param shortcut - Cross-platform shortcut
 * @returns JSX element with styled keyboard shortcut
 */
export function renderShortcut(shortcut: string): React.ReactElement {
  const displayShortcut = getPlatformShortcut(shortcut);

  return (
    <kbd className="ml-2 text-xs opacity-60 px-2 py-0.5 bg-gray-100 rounded border border-gray-300 font-mono">
      {displayShortcut}
    </kbd>
  );
}

/**
 * Shortcut handler functions interface
 * Defines all handler callbacks needed for keyboard shortcuts
 */
export interface ShortcutHandlers {
  onExport: () => void;
  onSettings: () => void;
  onHelp: () => void;
  onEscape: () => void;
  onRetry: () => void;
  onShowShortcuts: () => void;
  onPreview: () => void;
}

/**
 * Shortcut enabled state interface
 * Defines which shortcuts are currently enabled
 */
export interface ShortcutEnabledState {
  export: boolean;
  settings: boolean;
  help: boolean;
  escape: boolean;
  retry: boolean;
  showShortcuts: boolean;
  preview: boolean;
}

/**
 * Create keyboard shortcuts configuration
 * Factory function to generate shortcuts array from handlers and enabled state
 *
 * @param handlers - Object containing all shortcut handler functions
 * @param enabled - Object indicating which shortcuts are currently enabled
 * @returns Array of shortcut configurations for useKeyboardShortcuts hook
 */
export function createShortcuts(
  handlers: ShortcutHandlers,
  enabled: ShortcutEnabledState
): ShortcutConfig[] {
  return [
    // Primary Actions
    {
      key: 'e',
      ctrl: true,
      meta: true,
      handler: handlers.onExport,
      description: 'Export to PDF',
      enabled: enabled.export,
    },
    {
      key: ',',
      ctrl: true,
      meta: true,
      handler: handlers.onSettings,
      description: 'Open Settings',
      enabled: enabled.settings,
    },
    {
      key: '/',
      shift: true, // ? key
      handler: handlers.onShowShortcuts,
      description: 'Show Keyboard Shortcuts',
      enabled: enabled.showShortcuts,
    },
    {
      key: 'k',
      ctrl: true,
      meta: true,
      handler: handlers.onShowShortcuts,
      description: 'Show Keyboard Shortcuts',
      enabled: enabled.showShortcuts,
    },
    {
      key: 'Escape',
      handler: handlers.onEscape,
      description: 'Close or Go Back',
      enabled: enabled.escape,
    },
    {
      key: 'r',
      ctrl: true,
      meta: true,
      handler: handlers.onRetry,
      description: 'Retry Conversion',
      enabled: enabled.retry,
    },
    // Secondary Actions
    {
      key: ' ',
      handler: handlers.onPreview,
      description: 'Toggle Preview',
      enabled: enabled.preview,
      preventDefault: true,
    },
  ];
}
