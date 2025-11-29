/**
 * Alert Component
 * Standardized alert/message display with semantic variants
 *
 * Replaces duplicated alert patterns across 7+ files:
 * - FileImport.tsx (error alerts)
 * - CustomFonts.tsx (error/success alerts)
 * - Settings.tsx (error alerts)
 * - Error.tsx, Success.tsx (state components)
 *
 * Features:
 * - WCAG 2.1 AA compliant with proper ARIA roles
 * - Semantic variants (error, success, info, warning)
 * - Live region announcements for screen readers
 * - Consistent styling via design tokens
 */

import { XMarkIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { getLogger } from '@/shared/infrastructure/logging';
import { tokens } from '../../styles/tokens';

export type AlertVariant = 'error' | 'success' | 'info' | 'warning';

interface AlertProps {
  /** Visual and semantic variant */
  variant: AlertVariant;
  /** Alert content */
  children: React.ReactNode;
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
export const Alert = React.memo(({
  variant,
  children,
  className = '',
  assertive = variant === 'error',
  dismissible = false,
  onDismiss,
}: AlertProps) => {
  // Warn if dismissible is true but onDismiss is not provided
  if (import.meta.env.MODE !== 'production' && dismissible && !onDismiss) {
    getLogger().warn('Alert', 'dismissible=true but onDismiss is not provided. Button will not render.');
  }

  const variantStyles = tokens.colors[variant];

  return (
    <div
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
      className={`
        ${tokens.spacing.alert}
        ${variantStyles.bg}
        ${variantStyles.border}
        ${tokens.borders.default}
        ${tokens.borders.rounded}
        ${tokens.typography.small}
        ${variantStyles.text}
        ${dismissible ? 'flex items-start justify-between gap-3' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      <div className={dismissible ? 'flex-1' : ''}>
        {children}
      </div>

      {/* Dismissible button */}
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={`flex-shrink-0 ${tokens.colors.neutral.hover} ${tokens.borders.rounded} p-0.5 ${tokens.transitions.default} ${tokens.effects.focusRing}`}
          aria-label="Dismiss alert"
          type="button"
        >
          <XMarkIcon className={`${tokens.icons.sm} ${variantStyles.text}`} aria-hidden="true" />
        </button>
      )}
    </div>
  );
});
