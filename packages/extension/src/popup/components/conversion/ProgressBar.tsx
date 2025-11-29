/**
 * ProgressBar Component
 *
 * Displays a horizontal progress bar with percentage text for accessibility (WCAG 1.4.1).
 * Includes support for smooth animations and visual variants (default, success, error).
 * Designed to assist users with low vision or color blindness.
 */

import React, { useMemo } from 'react';
import { tokens } from '../../styles/tokens';

interface ProgressBarProps {
  /** Progress percentage (0-100) */
  percentage: number;

  /** Enable smooth width transition animation */
  animated?: boolean;

  /** Visual variant */
  variant?: 'default' | 'success' | 'error';
}

export const ProgressBar = React.memo(({
  percentage,
  animated = true,
  variant = 'default',
}: ProgressBarProps) => {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  // Memoize variant classes to prevent recreation on every render
  const colorClass = useMemo(() => ({
    default: tokens.colors.primary.bg,
    success: tokens.colors.success.bg,
    error: tokens.colors.error.bg,
  })[variant], [variant]);

  const textColorClass = useMemo(() => ({
    default: tokens.colors.neutral.text,
    success: tokens.colors.success.textStrong,
    error: tokens.colors.error.textStrong,
  })[variant], [variant]);

  // Memoize style object to prevent recreation on every render
  const progressStyle = useMemo(() => ({
    width: `${clampedPercentage}%`,
  }), [clampedPercentage]);

  return (
    <div className={`flex items-center ${tokens.spacing.gapMedium}`}>
      <div className={`flex-1 ${tokens.colors.neutral.bg} ${tokens.borders.full} h-3 overflow-hidden`}>
        {/* P2-A11Y-001: Add aria-label for screen reader context (WCAG 4.1.2 Name, Role, Value) */}
        {/* Provides context about what this progress represents */}
        <div
          className={`${colorClass} h-full ${animated ? 'transition-[width] duration-300 ease-out' : ''}`.trim().replace(/\s+/g, ' ')}
          style={progressStyle}
          role="progressbar"
          aria-label="PDF conversion progress"
          aria-valuenow={clampedPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className={`${tokens.typography.small} ${tokens.typography.medium} ${textColorClass} min-w-[3ch] text-right`} aria-hidden="true">
        {Math.round(clampedPercentage)}
        %
      </span>
    </div>
  );
});
