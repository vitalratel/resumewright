/**
 * Reusable Button Component
 *
 * Supports multiple variants (primary, secondary, tertiary, danger, ghost, link)
 * with loading states, success feedback, and micro-interactions.
 *
 * Design: docs/design/design-system.md Components > Buttons
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import React from 'react';
import { useDelayedSpinner } from '../../hooks/ui/useDelayedSpinner';
import { tokens } from '../../styles/tokens';

// Extract magic numbers for pending state timeout and spinner delay
// Extract hardcoded spinner delay (300ms)
const PENDING_STATE_TIMEOUT_MS = 100;
const SPINNER_DELAY_MS = 300;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'link';
  fullWidth?: boolean;
  children: ReactNode;
  /** Loading state - shows spinner and disables button */
  loading?: boolean;
  /** Success state - shows checkmark briefly */
  success?: boolean;
  /** Icon to show before text (only when not loading/success) */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export const Button = ({
  ref,
  variant = 'primary',
  fullWidth = true,
  children,
  className = '',
  loading = false,
  success = false,
  icon: Icon,
  disabled,
  onClick,
  ...props
}: ButtonProps & { ref?: React.RefObject<HTMLButtonElement | null> }) => {
  // Local pending state to prevent double-clicks
  const [isPending, setIsPending] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Use ref to avoid recreating callback on isPending changes
  const isPendingRef = React.useRef(isPending);
  React.useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

  // Delay spinner display to prevent janky flashing
  // Use extracted constant for spinner delay
  const shouldShowSpinner = useDelayedSpinner(loading || isPending, SPINNER_DELAY_MS);

  // Cleanup timeout on unmount to prevent "window is not defined" errors in tests
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Wrapped onClick handler to disable button immediately
  // Optimized to use ref for isPending, preventing recreation
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading || isPendingRef.current) {
        return;
      }

      // Set pending state immediately to prevent double-clicks
      setIsPending(true);

      // Call original onClick handler
      if (onClick) {
        onClick(event);
      }

      // Reset pending state after a short delay (parent's loading prop should take over)
      timeoutRef.current = setTimeout(() => {
        setIsPending(false);
      }, PENDING_STATE_TIMEOUT_MS);
    },
    [onClick, disabled, loading],
  );

  // Enhanced micro-interactions with 2px focus rings
  const baseClasses = `px-4 py-3 ${tokens.typography.small} ${tokens.typography.medium} ${tokens.borders.roundedLg} ${tokens.effects.focusRing} transition-all duration-200 ease-in-out relative overflow-hidden`;

  // Memoize variant classes to prevent recreation on every render
  // Enhanced hover, focus, and active states with improved visual feedback
  // Increased hover contrast for better visual feedback
  const variantClasses = React.useMemo(
    () => ({
      primary: `${tokens.colors.primary.bg} ${tokens.colors.primary.hover} hover:scale-[1.02] hover:shadow-lg active:bg-blue-800 dark:active:bg-blue-300 active:scale-[0.98] text-white focus:ring-blue-500 dark:focus:ring-blue-400 ${tokens.effects.disabledState} disabled:hover:scale-100 disabled:shadow-none`,
      secondary: `${tokens.colors.neutral.bgWhite} ${tokens.buttons.variants.secondaryBorder} hover:scale-[1.01] hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 active:scale-[0.99] ${tokens.colors.info.text} border-2 ${tokens.colors.info.border} focus:ring-blue-500 dark:focus:ring-blue-400 ${tokens.effects.disabledState} disabled:hover:scale-100 disabled:shadow-none`,
      tertiary: `${tokens.colors.neutral.bg} ${tokens.buttons.variants.tertiary} hover:scale-[1.01] hover:shadow-sm active:scale-[0.99] ${tokens.colors.neutral.textMuted} focus:ring-blue-500 dark:focus:ring-blue-400 ${tokens.effects.disabledState} disabled:hover:scale-100 disabled:shadow-none`,
      danger: `${tokens.buttons.variants.danger} hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] text-white focus:ring-red-500 dark:focus:ring-red-400 ${tokens.effects.disabledState} disabled:hover:scale-100 disabled:shadow-none`,
      ghost: `${tokens.buttons.variants.ghost} hover:scale-[1.01] active:scale-[0.99] ${tokens.colors.neutral.textMuted} focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-[3px] focus:bg-gray-50 dark:focus:bg-gray-800 ${tokens.effects.disabledState} disabled:hover:scale-100`,
      link: `min-h-11 flex items-center ${tokens.buttons.variants.link} active:scale-[0.98] ${tokens.colors.info.text} focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed disabled:hover:scale-100`,
    }),
    [],
  );

  const widthClass = fullWidth ? 'w-full' : '';

  // Disable button when loading, disabled, or pending (prevents double-clicks)
  const isDisabled = disabled || loading || isPending;

  return (
    <button
      type="button"
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
      disabled={isDisabled}
      aria-busy={loading || isPending}
      aria-live={success ? 'polite' : undefined}
      onClick={handleClick}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        {/* Loading Spinner - Increased size for better visibility */}
        {/* Show spinner only after 300ms delay */}
        {shouldShowSpinner && (
          <svg
            className={`animate-spin ${tokens.icons.sm}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
        )}

        {/* Success Checkmark */}
        {success && !loading && !isPending && (
          <svg
            className={`${tokens.icons.sm} animate-[scale-in_0.2s_ease-out]`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}

        {/* Optional Icon (when not loading/success/pending) */}
        {!loading && !success && !isPending && Icon && (
          <Icon className={tokens.icons.sm} aria-hidden="true" />
        )}

        {/* Button Text */}
        <span>{children}</span>
      </span>
    </button>
  );
};
