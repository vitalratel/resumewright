/**
 * Centered Container Component
 *
 * Provides full-page layout with centered content (max-width 800px)
 * Used for converter tab workflow (v1.7+)
 *
 * Fix 400px constraint for full-page converter
 * Use tokens.layout.maxWidthConverter instead of hardcoded value
 */

import { useMemo } from 'react';
import { tokens } from '../../styles/tokens';

interface CenteredContainerProps {
  children: React.ReactNode;
  maxWidth?: string;
}

export function CenteredContainer({
  children,
  maxWidth = tokens.layout.maxWidthConverter,
}: CenteredContainerProps) {
  // Memoize inline style to prevent unnecessary re-renders
  const containerStyle = useMemo(() => ({ maxWidth }), [maxWidth]);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-start ${tokens.colors.neutral.bg}`}>
      <div
        className={`w-full ${tokens.spacing.containerPadding}`}
        style={containerStyle}
      >
        {children}
      </div>
    </div>
  );
}
