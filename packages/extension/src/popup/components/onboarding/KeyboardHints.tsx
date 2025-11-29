/**
 * Keyboard Hints
 * Display keyboard shortcuts for navigation
 */

import { memo } from 'react';
import { tokens } from '../../styles/tokens';

export const KeyboardHints = memo(() => {
  return (
    <div className={`text-center ${tokens.typography.xs} ${tokens.colors.neutral.textMuted}`}>
      Press
      {' '}
      <kbd className={tokens.code.kbd}>Enter</kbd>
      {' '}
      to continue or
      {' '}
      <kbd className={tokens.code.kbd}>Esc</kbd>
      {' '}
      to skip
    </div>
  );
});
