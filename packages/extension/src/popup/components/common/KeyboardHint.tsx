/**
 * Keyboard Shortcut Hint Component
 *
 * Displays keyboard shortcut hints next to buttons with platform-specific modifier keys.
 * Automatically uses the correct modifier key for the platform (⌘ or Ctrl).
 */


import { tokens } from '../../styles/tokens';

interface KeyboardHintProps {
  /** The key(s) to display (e.g., 'E', 'Esc', ',') */
  keys: string;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays a keyboard shortcut hint
 * Automatically uses the correct modifier key for the platform (⌘ or Ctrl)
 */
export function KeyboardHint({ keys, className = '' }: KeyboardHintProps) {
  return (
    <span
      className={`ml-2 ${tokens.typography.xs} opacity-60 font-mono ${className}`}
      aria-hidden="true"
    >
      {keys}
    </span>
  );
}

// Add displayName for React DevTools
KeyboardHint.displayName = 'KeyboardHint';


