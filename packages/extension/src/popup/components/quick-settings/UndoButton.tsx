/**
 * UndoButton Component
 *
 * Undo functionality for accidental changes
 *
 * Displays undo button with countdown timer.
 * Automatically disappears after timeout expires.
 */

import { memo, useEffect, useState } from 'react';
import { tokens } from '../../styles/tokens';

interface UndoButtonProps {
  /** Callback when undo button is clicked */
  onUndo: () => void;

  /** Timeout in milliseconds before undo disappears (default: 10000ms / 10s) */
  timeout?: number;

  /** Description of what will be undone  */
  description?: string;

  /** Whether the button is disabled  */
  disabled?: boolean;
}

/**
 * UndoButton - Temporary undo button with countdown timer
 *
 * Shows undo option with countdown in seconds.
 * Countdown updates every second until timeout expires.
 */
export const UndoButton = memo(({
  onUndo,
  timeout = 10000,
  description,
  disabled = false,
}: UndoButtonProps) => {
  const [timeLeft, setTimeLeft] = useState(timeout);

  useEffect(() => {
    // Update countdown every second
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const secondsLeft = Math.ceil(timeLeft / 1000);

  return (
    <div className={`flex items-center justify-center ${tokens.spacing.gapSmall} pt-1`}>
      <button
        type="button"
        onClick={onUndo}
        disabled={disabled}
        className={`${tokens.typography.small} ${disabled ? tokens.colors.neutral.textMuted : tokens.colors.link.text} ${!disabled && tokens.colors.link.hover} ${!disabled && tokens.colors.link.hoverUnderline} ${tokens.effects.focusRounded} ${tokens.transitions.default} px-2 py-1 ${disabled ? 'cursor-not-allowed opacity-60' : ''}`.trim().replace(/\s+/g, ' ')}
        aria-label={disabled ? 'No changes to undo' : ((description !== null && description !== undefined && description !== '') ? `Undo recent changes: ${description}` : 'Undo recent changes')}
        title={disabled ? 'No changes to undo' : ((description !== null && description !== undefined && description !== '') ? `Undo: ${description}` : 'Undo recent changes')}
      >
        Undo
        {(description !== null && description !== undefined && description !== '') && `: ${description}`}
      </button>
      {!disabled && (
        <span className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted}`}>
          (
          {secondsLeft}
          s)
        </span>
      )}
    </div>
  );
});
