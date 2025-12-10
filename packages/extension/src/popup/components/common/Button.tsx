// ABOUTME: Reusable button component with multiple variants (primary, secondary, tertiary, danger, ghost, link).
// ABOUTME: Supports loading states, success feedback, micro-interactions, and accessibility features.

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import React from 'react';
import { useEvent } from '../../hooks/core/useEvent';
import { useDelayedSpinner } from '../../hooks/ui/useDelayedSpinner';

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

  // Delay spinner display to prevent janky flashing
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
  // useEvent provides stable reference while reading latest state
  const handleClick = useEvent((event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading || isPending) {
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
  });

  const baseClasses =
    'px-4 py-3 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ring-offset-ring-offset transition-all duration-200 ease-in-out relative overflow-hidden';

  const variantClasses = React.useMemo(
    () => ({
      primary:
        'bg-primary hover:bg-primary-hover hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] text-primary-foreground focus:ring-ring-focus disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none',
      secondary:
        'bg-elevated hover:bg-muted hover:scale-[1.01] hover:shadow-md active:scale-[0.99] text-link border-2 border-info focus:ring-ring-focus disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none',
      tertiary:
        'bg-muted hover:bg-muted-hover hover:scale-[1.01] hover:shadow-sm active:scale-[0.99] text-muted-foreground focus:ring-ring-focus disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none',
      danger:
        'bg-danger-action hover:bg-danger-action-hover hover:scale-[1.02] hover:shadow-lg active:bg-danger-action-active active:scale-[0.98] text-white focus:ring-ring-focus-danger disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none',
      ghost:
        'bg-transparent hover:bg-muted hover:scale-[1.01] active:scale-[0.99] text-muted-foreground focus:ring-ring-focus focus:ring-[3px] focus:bg-muted disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
      link: 'min-h-11 flex items-center bg-transparent hover:underline active:scale-[0.98] text-link focus:ring-ring-focus disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed disabled:hover:scale-100',
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
        {shouldShowSpinner && (
          <svg
            className="animate-spin w-4 h-4"
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

        {success && !loading && !isPending && (
          <svg
            className="w-4 h-4 animate-scale-in"
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

        {!loading && !success && !isPending && Icon && (
          <Icon className="w-4 h-4" aria-hidden="true" />
        )}

        <span>{children}</span>
      </span>
    </button>
  );
};
