// ABOUTME: Keyboard shortcut management with cross-platform modifier support.
// ABOUTME: Registers global keydown listeners and provides formatting utilities.

import { onCleanup } from 'solid-js';
import { getLogger } from '@/shared/infrastructure/logging/instance';

/**
 * Configuration for a keyboard shortcut
 */
export interface ShortcutConfig {
  /** The key to listen for (e.g., 'e', 'Escape', '/') */
  key: string;

  /** Require Ctrl key (Windows/Linux) */
  ctrl?: boolean;

  /** Require Cmd/Meta key (Mac) */
  meta?: boolean;

  /** Require Shift key */
  shift?: boolean;

  /** Require Alt key */
  alt?: boolean;

  /** Handler function to call when shortcut is triggered */
  handler: (e: KeyboardEvent) => void;

  /** Human-readable description of what the shortcut does */
  description: string;

  /** Whether the shortcut is currently enabled (default: true) */
  enabled?: boolean;

  /** Prevent default browser behavior (default: true) */
  preventDefault?: boolean;
}

/**
 * Get the platform-specific modifier key symbol.
 * @returns '⌘' for Mac, 'Ctrl' for Windows/Linux
 */
export function getModifierKey(): '⌘' | 'Ctrl' {
  const isMac = navigator.userAgent.toUpperCase().includes('MAC');
  return isMac ? '⌘' : 'Ctrl';
}

/**
 * Get the platform-specific modifier key name.
 * @returns 'Cmd' for Mac, 'Ctrl' for Windows/Linux
 */
export function getModifierKeyName(): 'Cmd' | 'Ctrl' {
  const isMac = navigator.userAgent.toUpperCase().includes('MAC');
  return isMac ? 'Cmd' : 'Ctrl';
}

/**
 * Format a shortcut for display.
 * @param shortcut - The shortcut configuration
 * @returns A formatted string like '⌘E' or 'Ctrl+Shift+R'
 */
export function formatShortcut(shortcut: ShortcutConfig): string {
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(getModifierKey());
  }

  if (shortcut.shift) {
    parts.push('⇧');
  }

  if (shortcut.alt) {
    parts.push('Alt');
  }

  const key =
    shortcut.key === 'Escape'
      ? 'Esc'
      : shortcut.key === ' '
        ? 'Space'
        : shortcut.key.length === 1
          ? shortcut.key.toUpperCase()
          : shortcut.key;

  parts.push(key);

  return parts.join('');
}

/**
 * Check if a keyboard event matches a shortcut configuration.
 */
function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutConfig): boolean {
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
  if (!keyMatches) return false;

  const modifierPressed = (shortcut.ctrl && event.ctrlKey) || (shortcut.meta && event.metaKey);
  const modifierRequired = shortcut.ctrl || shortcut.meta;

  if (modifierRequired && !modifierPressed) return false;
  if (!modifierRequired && (event.ctrlKey || event.metaKey)) return false;

  const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
  if (!shiftMatches) return false;

  const altMatches = shortcut.alt ? event.altKey : !event.altKey;
  if (!altMatches) return false;

  return true;
}

/**
 * Register keyboard shortcuts with automatic cleanup.
 *
 * @param shortcuts - Array of shortcut configurations
 */
export function createKeyboardShortcuts(shortcuts: ShortcutConfig[]): void {
  getLogger().debug('KeyboardShortcuts', 'REGISTERING keyboard listener');

  const handleKeyDown = (event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      if (shortcut.enabled === false) continue;

      if (matchesShortcut(event, shortcut)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }

        shortcut.handler(event);
        break;
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  onCleanup(() => {
    getLogger().debug('KeyboardShortcuts', 'REMOVING keyboard listener');
    window.removeEventListener('keydown', handleKeyDown);
  });
}

/**
 * Get all available keyboard shortcuts for display.
 * @param shortcuts - Array of shortcut configurations
 * @returns Array of enabled shortcuts with formatted display strings
 */
export function getAvailableShortcuts(shortcuts: ShortcutConfig[]): Array<{
  shortcut: string;
  description: string;
}> {
  return shortcuts
    .filter((s) => s.enabled !== false)
    .map((s) => ({
      shortcut: formatShortcut(s),
      description: s.description,
    }));
}
