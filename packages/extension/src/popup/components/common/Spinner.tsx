// ABOUTME: Loading spinner with size variants and optional display delay.
// ABOUTME: Accessible with aria-hidden or aria-label for screen readers.

import React from 'react';
import { useDelayedSpinner } from '../../hooks/ui/useDelayedSpinner';

export type SpinnerSize = 'small' | 'medium' | 'large';

interface SpinnerProps {
  /** Spinner size variant */
  size?: SpinnerSize;
  /** Additional CSS classes */
  className?: string;
  /** Spinner color (Tailwind text-* class) */
  color?: string;
  /** Optional aria-label for screen readers when used as primary indicator */
  ariaLabel?: string;
  /** Delay in ms before showing spinner (default: 300ms, set to 0 to disable) */
  delayMs?: number;
}

const sizeClasses: Record<SpinnerSize, string> = {
  small: 'w-4 h-4',
  medium: 'w-6 h-6',
  large: 'w-8 h-8',
};

export const Spinner = React.memo(
  ({
    size = 'medium',
    className = '',
    color = 'text-primary',
    ariaLabel,
    delayMs = 300,
  }: SpinnerProps) => {
    const shouldShow = useDelayedSpinner(true, delayMs);

    if (!shouldShow) {
      return null;
    }

    return (
      <svg
        className={`animate-spin ${sizeClasses[size]} ${color} ${className}`.trim()}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden={ariaLabel ? undefined : 'true'}
        aria-label={ariaLabel}
        role={ariaLabel ? 'img' : undefined}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );
  },
);
