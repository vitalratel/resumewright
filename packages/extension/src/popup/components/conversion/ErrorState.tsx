// ABOUTME: User-friendly error state component with recovery options.
// ABOUTME: Shows What-Why-How error messaging with category badges and debugging info.

import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { memo, useEffect } from 'react';
import { useErrorLogging } from '@/popup/hooks/ui/useErrorLogging';
import { ErrorCategory, ErrorCode } from '@/shared/errors/codes';
import { ERROR_MESSAGES } from '@/shared/errors/messages';
import { ERROR_CATEGORIES } from '@/shared/errors/metadata';
import {
  getSizeReductionTips,
  prioritizeSuggestions,
} from '@/shared/errors/presentation/suggestions';
import type { ConversionError } from '@/shared/types/models';
import {
  isLocationErrorMetadata,
  isParseErrorMetadata,
  isRetryErrorMetadata,
  isSizeErrorMetadata,
} from '@/shared/types/models';
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
  onReportIssue?: () => void | Promise<void>;

  /** Import different file callback */
  onImportDifferent?: () => void;
}

/**
 * Format error category for display (title case, friendlier)
 */
function formatCategoryDisplay(category?: ErrorCategory): string {
  if (category === null || category === undefined) return '';

  const categoryLabels: Record<ErrorCategory, string> = {
    [ErrorCategory.SYNTAX]: 'Syntax Error',
    [ErrorCategory.SIZE]: 'File Size',
    [ErrorCategory.SYSTEM]: 'System Error',
    [ErrorCategory.NETWORK]: 'Network Error',
    [ErrorCategory.UNKNOWN]: 'Unknown Error',
  };

  return categoryLabels[category] || category;
}

export const ErrorState = memo(
  ({
    ref,
    error,
    onRetry,
    onDismiss,
    onReportIssue,
    onImportDifferent,
  }: ErrorStateProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
    const category =
      error.category !== null && error.category !== undefined
        ? error.category
        : ERROR_CATEGORIES[error.code];

    // Error presentation based on category
    const isWarning = category === ErrorCategory.SYNTAX || category === ErrorCategory.SIZE;
    const Icon = isWarning ? ExclamationTriangleIcon : XCircleIcon;
    const iconClass = isWarning ? 'text-icon-warning' : 'text-icon-error';
    const bgClass = isWarning ? 'bg-warning' : 'bg-error';
    const iconLabel = isWarning ? 'Warning' : 'Error';

    // Get error messages
    const errorMessage = ERROR_MESSAGES[error.code];
    const titleText: string = errorMessage?.title ?? 'An error occurred';
    const descriptionText: string =
      errorMessage?.description ?? error.message ?? 'An unexpected error occurred';

    // Error suggestions data (inlined from useErrorSuggestions)
    const retryAttempt = isRetryErrorMetadata(error.metadata) ? error.metadata.retryAttempt : 0;
    const lastError = isRetryErrorMetadata(error.metadata) ? error.metadata.lastError : undefined;
    const isSizeError = error.code === ErrorCode.MEMORY_LIMIT_EXCEEDED;
    const prioritizedSuggestions = prioritizeSuggestions(
      error.code,
      error.suggestions,
      retryAttempt,
    );
    const sizeReductionTips = isSizeError
      ? getSizeReductionTips(
          isSizeErrorMetadata(error.metadata) || isLocationErrorMetadata(error.metadata)
            ? error.metadata.fileSize
            : undefined,
          isSizeErrorMetadata(error.metadata) || isLocationErrorMetadata(error.metadata)
            ? error.metadata.maxSize
            : undefined,
        )
      : [];

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
        className="w-full h-full bg-elevated p-6 flex flex-col items-center justify-start space-y-4 overflow-y-auto"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-testid="error-display"
      >
        <div
          className={`shrink-0 w-16 h-16 ${bgClass} rounded-full flex items-center justify-center`}
        >
          <Icon className={`w-10 h-10 ${iconClass}`} aria-label={iconLabel} />
        </div>

        <h1
          className="text-lg font-bold tracking-tight text-foreground text-center"
          data-testid="error-message"
        >
          {titleText}
        </h1>

        <p
          className="text-base text-muted-foreground text-center max-w-md leading-relaxed"
          data-testid="error-explanation"
        >
          {descriptionText}
        </p>

        {isParseErrorMetadata(error.metadata) && (
          <ErrorCodeContext codeContext={error.metadata.codeContext} line={error.metadata.line} />
        )}

        {isLocationErrorMetadata(error.metadata) && (
          <ErrorLocationInfo
            line={error.metadata.line}
            column={error.metadata.column}
            fileSize={error.metadata.fileSize}
            maxSize={error.metadata.maxSize}
          />
        )}
        {isSizeErrorMetadata(error.metadata) && (
          <ErrorLocationInfo fileSize={error.metadata.fileSize} maxSize={error.metadata.maxSize} />
        )}

        {category !== null && category !== undefined && (
          <div
            className="px-3 py-1 bg-muted text-muted-foreground text-sm font-semibold rounded-full"
            data-testid="error-badge"
          >
            {formatCategoryDisplay(category)}
          </div>
        )}

        <ErrorMetadata
          errorId={error.errorId}
          timestamp={error.timestamp}
          code={error.code}
          message={error.message}
          category={category}
          technicalDetails={error.technicalDetails}
          metadata={error.metadata}
        />

        <div className="w-full max-w-md text-center">
          <a
            href="https://github.com/yourusername/resumewright/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-link hover:text-link-hover hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset rounded-md px-2 py-1 transition-all duration-300"
            aria-label="Get help with this error on GitHub"
          >
            Need help? View FAQ or report this issue
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <ErrorSuggestions
          error={error}
          retryAttempt={retryAttempt}
          lastError={lastError}
          prioritizedSuggestions={prioritizedSuggestions}
          isSizeError={isSizeError}
          sizeReductionTips={sizeReductionTips}
        />

        <ErrorActions
          error={error}
          onRetry={onRetry}
          onDismiss={onDismiss}
          onReportIssue={onReportIssue}
          onImportDifferent={onImportDifferent}
          retryAttempt={retryAttempt}
        />

        {error.technicalDetails !== null &&
          error.technicalDetails !== undefined &&
          error.technicalDetails !== '' && (
            <details className="w-full max-w-md">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-link focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset rounded-md px-2 py-1 select-none">
                Technical details (for support)
              </summary>
              <pre className="mt-2 text-sm text-muted-foreground bg-muted p-3 rounded-md overflow-x-auto border border-border font-mono">
                {error.technicalDetails}
              </pre>
            </details>
          )}
      </div>
    );
  },
);
