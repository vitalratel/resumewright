/**
 * Keyboard Shortcuts Hook
 *
 * Provides keyboard shortcut handling with cross-platform support (Mac/Windows/Linux).
 * Enhances accessibility and productivity for power users.
 */

import { useEffect, useRef } from 'react';
import { getLogger } from '@/shared/infrastructure/logging';

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
 * Get the platform-specific modifier key symbol
 * @returns '⌘' for Mac, 'Ctrl' for Windows/Linux
 */
export function getModifierKey(): '⌘' | 'Ctrl' {
  // Check if running on Mac
  const isMac = navigator.userAgent.toUpperCase().includes('MAC');
  return isMac ? '⌘' : 'Ctrl';
}

/**
 * Get the platform-specific modifier key name
 * @returns 'Cmd' for Mac, 'Ctrl' for Windows/Linux
 */
export function getModifierKeyName(): 'Cmd' | 'Ctrl' {
  const isMac = navigator.userAgent.toUpperCase().includes('MAC');
  return isMac ? 'Cmd' : 'Ctrl';
}

/**
 * Format a shortcut for display
 * @param shortcut - The shortcut configuration
 * @returns A formatted string like '⌘E' or 'Ctrl+Shift+R'
 */
export function formatShortcut(shortcut: ShortcutConfig): string {
  const parts: string[] = [];

  // Add modifier keys
  if (shortcut.ctrl || shortcut.meta) {
    parts.push(getModifierKey());
  }

  if (shortcut.shift) {
    parts.push('⇧');
  }

  if (shortcut.alt) {
    parts.push('Alt');
  }

  // Add the main key (capitalize if single letter)
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
 * Check if a keyboard event matches a shortcut configuration
 * @param event - The keyboard event
 * @param shortcut - The shortcut configuration
 * @returns True if the event matches the shortcut
 */
function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutConfig): boolean {
  // Check if the key matches (case-insensitive)
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
  if (!keyMatches) return false;

  // Check modifier keys
  // On Mac, meta key is Cmd; on Windows/Linux, ctrl is used
  const modifierPressed = (shortcut.ctrl && event.ctrlKey) || (shortcut.meta && event.metaKey);

  const modifierRequired = shortcut.ctrl || shortcut.meta;

  // If modifier is required but not pressed, or vice versa, don't match
  if (modifierRequired && !modifierPressed) return false;
  if (!modifierRequired && (event.ctrlKey || event.metaKey)) return false;

  // Check shift key
  const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
  if (!shiftMatches) return false;

  // Check alt key
  const altMatches = shortcut.alt ? event.altKey : !event.altKey;
  if (!altMatches) return false;

  return true;
}

/**
 * Hook to register keyboard shortcuts
 *
 * @param shortcuts - Array of shortcut configurations
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     key: 'e',
 *     ctrl: true,
 *     meta: true,
 *     handler: handleExport,
 *     description: 'Export to PDF',
 *     enabled: canExport,
 *   },
 *   {
 *     key: 'Escape',
 *     handler: handleClose,
 *     description: 'Close modal',
 *   },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]): void {
  // Firefox fix: Use ref to prevent event listener churn when shortcuts array changes
  // This prevents memory leak from constantly adding/removing listeners
  const shortcutsRef = useRef(shortcuts);

  // Update ref on every render to see latest values
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  });

  useEffect(() => {
    getLogger().debug('KeyboardShortcuts', 'REGISTERING keyboard listener');

    const handleKeyDown = (event: KeyboardEvent) => {
      // Use ref to get latest shortcuts without recreating listener
      for (const shortcut of shortcutsRef.current) {
        // Skip disabled shortcuts
        if (shortcut.enabled === false) continue;

        // Check if the event matches this shortcut
        if (matchesShortcut(event, shortcut)) {
          // Prevent default behavior unless explicitly disabled
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }

          // Call the handler
          shortcut.handler(event);

          // Stop checking other shortcuts
          break;
        }
      }
    };

    // Register the event listener ONCE
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount ONLY
    return () => {
      getLogger().debug('KeyboardShortcuts', 'REMOVING keyboard listener');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty deps - register listener once!
}

/**
 * Get all available keyboard shortcuts for display in help modal
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
