/**
 * Spinner Component
 * Standardized loading spinner with size variants
 *
 * Replaces duplicated spinner patterns across 6+ files:
 * - FileImport.tsx (small spinner in button)
 * - ConvertingState.tsx (large blue spinner)
 * - CustomFonts.tsx (spinner in upload states)
 * - Various other components with loading states
 *
 * Features:
 * - Three size variants (small, medium, large)
 * - Customizable color
 * - Accessible (aria-hidden, paired with loading text)
 * - Consistent animation via design tokens
 */

import React from 'react';
import { useDelayedSpinner } from '../../hooks/ui';
import { tokens } from '../../styles/tokens';

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

const sizeMap: Record<SpinnerSize, string> = {
  small: tokens.icons.xs,
  medium: tokens.icons.md,
  large: tokens.icons.lg,
};

/**
 * Loading spinner component
 *
 * @example
 * // Small spinner in button
 * <button disabled>
 *   <Spinner size="small" />
 *   <span>Loading...</span>
 * </button>
 *
 * @example
 * // Large centered spinner
 * <div className="flex justify-center">
 *   <Spinner size="large" color="text-blue-500" />
 * </div>
 */
export const Spinner = React.memo(({
  size = 'medium',
  className = '',
  color = 'text-blue-500',
  ariaLabel,
  delayMs = 300,
}: SpinnerProps) => {
  // Delay spinner display to prevent janky flashing
  const shouldShow = useDelayedSpinner(true, delayMs);

  if (!shouldShow) {
    return null;
  }

  return (
    <svg
      className={`${tokens.animations.spin} ${sizeMap[size]} ${color} ${className}`.trim()}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden={(ariaLabel !== null && ariaLabel !== undefined && ariaLabel !== '') ? undefined : 'true'}
      aria-label={ariaLabel}
      role={(ariaLabel !== null && ariaLabel !== undefined && ariaLabel !== '') ? 'img' : undefined}
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
});
