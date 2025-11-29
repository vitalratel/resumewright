// ABOUTME: Keyboard shortcut display utilities.
// ABOUTME: Provides platform-specific shortcut formatting (Cmd on Mac, Ctrl elsewhere).

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
