// ABOUTME: Standardized alert/message display with semantic variants.
// ABOUTME: WCAG 2.1 AA compliant with proper ARIA roles and live regions.

import { XMarkIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';
import { getLogger } from '@/shared/infrastructure/logging/instance';

type AlertVariant = 'error' | 'success' | 'info' | 'warning';

interface AlertProps {
  /** Visual and semantic variant */
  variant: AlertVariant;
  /** Alert content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /**
   * Whether this is an error (assertive) or status (polite) announcement.
   * Defaults to assertive for errors, polite for others.
   */
  assertive?: boolean;
  /** Show dismiss button */
  dismissible?: boolean;
  /** Dismiss handler callback */
  onDismiss?: () => void;
}

/**
 * Variant styles using semantic Tailwind classes with opacity pattern
 * Background: /10 for light tint, Border: /20 for subtle, Text: -text for contrast
 */
const variantClasses: Record<AlertVariant, string> = {
  error: 'bg-destructive/10 border-destructive/20 text-destructive-text',
  success: 'bg-success/10 border-success/20 text-success-text',
  info: 'bg-info/10 border-info/20 text-info-text',
  warning: 'bg-warning/10 border-warning/20 text-warning-text',
};

/**
 * Alert component for displaying messages with semantic meaning
 *
 * @example
 * // Error alert (assertive live region)
 * <Alert variant="error">
 *   <p>Failed to process file</p>
 * </Alert>
 *
 * @example
 * // Success alert (polite live region)
 * <Alert variant="success">
 *   <p>File uploaded successfully</p>
 * </Alert>
 */
export function Alert({
  variant,
  children,
  className = '',
  assertive = variant === 'error',
  dismissible = false,
  onDismiss,
}: AlertProps) {
  // Warn if dismissible is true but onDismiss is not provided
  if (import.meta.env.MODE !== 'production' && dismissible && !onDismiss) {
    getLogger().warn(
      'Alert',
      'dismissible=true but onDismiss is not provided. Button will not render.',
    );
  }

  return (
    <div
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
      className={`p-3 border rounded-md text-sm ${variantClasses[variant]} ${dismissible ? 'flex items-start justify-between gap-3' : ''} ${className}`}
    >
      <div className={dismissible ? 'flex-1' : ''}>{children}</div>

      {/* Dismissible button */}
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 hover:bg-muted rounded-md p-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset"
          aria-label="Dismiss alert"
          type="button"
        >
          <XMarkIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
