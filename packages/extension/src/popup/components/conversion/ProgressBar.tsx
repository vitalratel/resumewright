// ABOUTME: Horizontal progress bar with percentage text for accessibility.
// ABOUTME: Supports visual variants (default, success, error) with smooth animations.

import React, { useMemo } from 'react';

interface ProgressBarProps {
  /** Progress percentage (0-100) */
  percentage: number;

  /** Enable smooth width transition animation */
  animated?: boolean;

  /** Visual variant */
  variant?: 'default' | 'success' | 'error';
}

const bgColorClasses = {
  default: 'bg-primary',
  success: 'bg-success',
  error: 'bg-destructive',
} as const;

const textColorClasses = {
  default: 'text-foreground',
  success: 'text-success-text',
  error: 'text-destructive-text',
} as const;

export const ProgressBar = React.memo(
  ({ percentage, animated = true, variant = 'default' }: ProgressBarProps) => {
    const clampedPercentage = Math.min(100, Math.max(0, percentage));

    const progressStyle = useMemo(() => ({ width: `${clampedPercentage}%` }), [clampedPercentage]);

    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
          <div
            className={`${bgColorClasses[variant]} h-full ${animated ? 'transition-[width] duration-300 ease-out' : ''}`.trim()}
            style={progressStyle}
            role="progressbar"
            aria-label="PDF conversion progress"
            aria-valuenow={clampedPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <span
          className={`text-sm font-medium ${textColorClasses[variant]} min-w-[3ch] text-right`}
          aria-hidden="true"
        >
          {Math.round(clampedPercentage)}%
        </span>
      </div>
    );
  },
);
