/**
 * ErrorState Component
 *
 * Displays user-friendly error messages with recovery options and debugging information.
 * Distinguishes between recoverable and non-recoverable errors with appropriate actions.
 *
 * Error categories:
 * - SYNTAX: Parse errors in CV code (recoverable)
 * - SIZE: File too large or memory exceeded (partially recoverable)
 * - SYSTEM: WASM or internal errors (retry recommended)
 * - NETWORK: Font loading or resource failures (retry recommended)
 * - UNKNOWN: Unexpected errors (report issue)
 *
 * Features:
 * - What-Why-How error messaging structure
 * - Prioritized recovery suggestions
 * - Code context for syntax errors (with line numbers)
 * - Size reduction tips for memory errors
 * - Copy error details to clipboard
 * - Error ID for support tracking
 * - Retry action (for recoverable errors)
 * - Import different file option
 *
 * @example
 * ```tsx
 * <ErrorState
 *   error={conversionError}
 *   onRetry={() => retryConversion()}
 *   onDismiss={() => clearError()}
 *   onReportIssue={() => openGitHubIssue()}
 *   onImportDifferent={() => backToFileImport()}
 * />
 * ```
 *
 * @see {@link ErrorSuggestions} for suggestion rendering
 * @see {@link ErrorActions} for action buttons
 * @see {@link ErrorMetadata} for error ID and copy functionality
 * @see {@link ErrorCodeContext} for code context display
 * @see {@link ErrorLocationInfo} for line/column or size info
 */

import type { ConversionError } from '@/shared/types/models';
import { memo, useEffect } from 'react';
import { useErrorLogging, useErrorPresentation, useErrorSuggestions } from '@/popup/hooks/ui';
import { ERROR_CATEGORIES, ERROR_MESSAGES, ErrorCategory } from '@/shared/types/errors/';
import { isLocationErrorMetadata, isParseErrorMetadata, isSizeErrorMetadata } from '@/shared/types/models/conversion';
import { tokens } from '../../styles/tokens';
import { ErrorActions } from '../error/ErrorActions';
import { ErrorCodeContext } from '../error/ErrorCodeContext';
import { ErrorLocationInfo } from '../error/ErrorLocationInfo';
import { ErrorMetadata } from '../error/ErrorMetadata';
import { ErrorSuggestions } from '../error/ErrorSuggestions';

interface ErrorStateProps {
  /** Conversion error to display */
  error: ConversionError;

  /** Retry callback (only shown if error.recoverable) */
  onRetry?: () => void;

  /** Dismiss callback to clear error state */
  onDismiss?: () => void;

  /** Report issue callback (dev mode only) */
  onReportIssue?: () => void;

  /** Import different file callback */
  onImportDifferent?: () => void;
}

/**
 * Format error category for display (title case, friendlier)
 */
function formatCategoryDisplay(category?: ErrorCategory): string {
  if (category === null || category === undefined)
    return '';

  const categoryLabels: Record<ErrorCategory, string> = {
    [ErrorCategory.SYNTAX]: 'Syntax Error',
    [ErrorCategory.SIZE]: 'File Size',
    [ErrorCategory.SYSTEM]: 'System Error',
    [ErrorCategory.NETWORK]: 'Network Error',
    [ErrorCategory.UNKNOWN]: 'Unknown Error',
  };

  return categoryLabels[category] || category;
}

export const ErrorState = memo((
  { ref, error, onRetry, onDismiss, onReportIssue, onImportDifferent }: ErrorStateProps & { ref?: React.RefObject<HTMLDivElement | null> },
) => {
  const category = (error.category !== null && error.category !== undefined) ? error.category : ERROR_CATEGORIES[error.code];

  // Extract presentation logic to hook
  const { Icon, iconClass, bgClass, iconLabel } = useErrorPresentation(category);

  // Get error messages
  const errorMessage = ERROR_MESSAGES[error.code];
  const titleText: string = errorMessage?.title ?? 'An error occurred';
  const descriptionText: string = errorMessage?.description ?? (error.message ?? 'An unexpected error occurred');

  // Extract suggestion/tips logic to hook
  const { prioritizedSuggestions, sizeReductionTips, retryAttempt, lastError, isSizeError } = useErrorSuggestions(error);

  // Extract logging logic to hook
  useErrorLogging(error, category, errorMessage);

  // Focus management - automatically focus error when it appears
  useEffect(() => {
    if (ref && typeof ref !== 'function' && ref.current) {
      ref.current.focus();
    }
  }, [ref]);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className={`w-full h-full ${tokens.colors.neutral.bgWhite} ${tokens.spacing.cardGenerous} flex flex-col items-center justify-start ${tokens.spacing.sectionGap} overflow-y-auto`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid="error-display"
    >
      {/* Error Icon */}
      <div className={`flex-shrink-0 w-16 h-16 ${bgClass} ${tokens.borders.full} flex items-center justify-center`}>
        <Icon className={`${tokens.icons.xl} ${iconClass}`} aria-label={iconLabel} />
      </div>

      {/* Error Title - WHAT HAPPENED */}
      <h1 className={`${tokens.typography.large} ${tokens.typography.bold} tracking-tight ${tokens.colors.neutral.text} text-center`} data-testid="error-message">
        {titleText}
      </h1>

      {/* Error Description - WHY IT HAPPENED */}
      <p className={`${tokens.typography.base} ${tokens.colors.neutral.textMuted} text-center max-w-md leading-relaxed`} data-testid="error-explanation">
        {descriptionText}
      </p>

      {/* Code Context for Parse Errors  - Type-safe rendering */}
      {isParseErrorMetadata(error.metadata) && (
        <ErrorCodeContext
          codeContext={error.metadata.codeContext}
          line={error.metadata.line}
        />
      )}

      {/* Error Location/Size Info - Type-safe rendering */}
      {isLocationErrorMetadata(error.metadata) && (
        <ErrorLocationInfo
          line={error.metadata.line}
          column={error.metadata.column}
          fileSize={error.metadata.fileSize}
          maxSize={error.metadata.maxSize}
        />
      )}
      {isSizeErrorMetadata(error.metadata) && (
        <ErrorLocationInfo
          fileSize={error.metadata.fileSize}
          maxSize={error.metadata.maxSize}
        />
      )}

      {/* Error Category Badge - Title case for friendlier tone */}
      {(category !== null && category !== undefined) && (
        <div className={`px-3 py-1 ${tokens.colors.neutral.bg} ${tokens.colors.neutral.textMuted} ${tokens.typography.small} ${tokens.typography.semibold} ${tokens.borders.full}`} data-testid="error-badge">
          {formatCategoryDisplay(category)}
        </div>
      )}

      {/* Error ID and Timestamp with Copy Functionality */}
      <ErrorMetadata
        errorId={error.errorId}
        timestamp={error.timestamp}
        code={error.code}
        message={error.message}
        category={category}
        technicalDetails={error.technicalDetails}
        metadata={error.metadata}
      />

      {/* Get Help Link */}
      <div className="w-full max-w-md text-center">
        <a
          href="https://github.com/yourusername/resumewright/issues"
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center ${tokens.spacing.gapSmall} ${tokens.typography.small} ${tokens.colors.info.text} ${tokens.colors.link.hover} ${tokens.colors.link.hoverUnderline} ${tokens.effects.focusRing} ${tokens.borders.rounded} px-2 py-1 ${tokens.transitions.default}`
            .trim()
            .replace(/\s+/g, ' ')}
          aria-label="Get help with this error on GitHub"
        >
          Need help? View FAQ or report this issue
          <span aria-hidden="true">→</span>
        </a>
      </div>

      {/* Suggestions Component */}
      <ErrorSuggestions
        error={error}
        retryAttempt={retryAttempt}
        lastError={lastError}
        prioritizedSuggestions={prioritizedSuggestions}
        isSizeError={isSizeError}
        sizeReductionTips={sizeReductionTips}
      />

      {/* Actions Component - Added Import Different File action */}
      <ErrorActions
        error={error}
        onRetry={onRetry}
        onDismiss={onDismiss}
        onReportIssue={onReportIssue}
        onImportDifferent={onImportDifferent}
        retryAttempt={retryAttempt}
      />

      {/* Technical Details (expandable for all users, not just dev mode) */}
      {(error.technicalDetails !== null && error.technicalDetails !== undefined && error.technicalDetails !== '') && (
        <details className="w-full max-w-md">
          <summary className={`${tokens.typography.small} ${tokens.colors.neutral.textMuted} cursor-pointer ${tokens.colors.link.hover} ${tokens.effects.focusRing} ${tokens.borders.rounded} px-2 py-1 select-none`}>
            Technical details (for support)
          </summary>
          <pre className={`${tokens.spacing.marginSmall} ${tokens.typography.small} ${tokens.colors.neutral.textMuted} ${tokens.colors.neutral.bg} ${tokens.spacing.cardSmall} ${tokens.borders.rounded} overflow-x-auto ${tokens.borders.default} font-mono`}>
            {error.technicalDetails}
          </pre>
        </details>
      )}
    </div>
  );
});
