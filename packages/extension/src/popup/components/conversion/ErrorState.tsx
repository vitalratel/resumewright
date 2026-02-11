// ABOUTME: User-friendly error state component with recovery options.
// ABOUTME: Shows What-Why-How error messaging with category badges and debugging info.

import { HiOutlineExclamationTriangle, HiOutlineXCircle } from 'solid-icons/hi';
import { Show } from 'solid-js';
import { createErrorLogging } from '@/popup/reactivity/errorLogging';
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
  /** Ref for focus management */
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void);

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

export function ErrorState(props: ErrorStateProps) {
  // Derived values from error
  const category = () =>
    props.error.category !== null && props.error.category !== undefined
      ? props.error.category
      : ERROR_CATEGORIES[props.error.code];

  // Error presentation based on category
  const isWarning = () => category() === ErrorCategory.SYNTAX || category() === ErrorCategory.SIZE;
  const iconClass = () => (isWarning() ? 'text-icon-warning' : 'text-icon-error');
  const bgClass = () => (isWarning() ? 'bg-warning' : 'bg-error');
  const iconLabel = () => (isWarning() ? 'Warning' : 'Error');

  // Get error messages
  const errorMessage = () => ERROR_MESSAGES[props.error.code];
  const titleText = () => errorMessage()?.title ?? 'An error occurred';
  const descriptionText = () =>
    errorMessage()?.description ?? props.error.message ?? 'An unexpected error occurred';

  // Error suggestions data (inlined from useErrorSuggestions)
  const retryAttempt = () =>
    isRetryErrorMetadata(props.error.metadata) ? props.error.metadata.retryAttempt : 0;
  const lastError = () =>
    isRetryErrorMetadata(props.error.metadata) ? props.error.metadata.lastError : undefined;
  const isSizeError = () => props.error.code === ErrorCode.MEMORY_LIMIT_EXCEEDED;
  const prioritizedSuggestions = () =>
    prioritizeSuggestions(props.error.code, props.error.suggestions, retryAttempt());
  const sizeReductionTips = () =>
    isSizeError()
      ? getSizeReductionTips(
          isSizeErrorMetadata(props.error.metadata) || isLocationErrorMetadata(props.error.metadata)
            ? props.error.metadata.fileSize
            : undefined,
          isSizeErrorMetadata(props.error.metadata) || isLocationErrorMetadata(props.error.metadata)
            ? props.error.metadata.maxSize
            : undefined,
        )
      : [];

  // Error logging with deduplication
  createErrorLogging(() => props.error, {
    category,
    errorMessage,
  });

  return (
    <div
      ref={(el: HTMLDivElement) => {
        // Forward ref to parent
        const r = props.ref;
        if (typeof r === 'function') r(el);
        // Focus on mount
        el.focus();
      }}
      tabIndex={-1}
      class="w-full h-full bg-elevated p-6 flex flex-col items-center justify-start space-y-4 overflow-y-auto"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid="error-display"
    >
      <div class={`shrink-0 w-16 h-16 ${bgClass()} rounded-full flex items-center justify-center`}>
        <Show
          when={isWarning()}
          fallback={
            <HiOutlineXCircle class={`w-10 h-10 ${iconClass()}`} aria-label={iconLabel()} />
          }
        >
          <HiOutlineExclamationTriangle
            class={`w-10 h-10 ${iconClass()}`}
            aria-label={iconLabel()}
          />
        </Show>
      </div>

      <h1
        class="text-lg font-bold tracking-tight text-foreground text-center"
        data-testid="error-message"
      >
        {titleText()}
      </h1>

      <p
        class="text-base text-muted-foreground text-center max-w-md leading-relaxed"
        data-testid="error-explanation"
      >
        {descriptionText()}
      </p>

      <Show when={isParseErrorMetadata(props.error.metadata)}>
        <ErrorCodeContext
          codeContext={(props.error.metadata as { codeContext?: string }).codeContext}
          line={(props.error.metadata as { line?: number }).line}
        />
      </Show>

      <Show when={isLocationErrorMetadata(props.error.metadata)}>
        <ErrorLocationInfo
          line={(props.error.metadata as { line?: number }).line}
          column={(props.error.metadata as { column?: number }).column}
          fileSize={(props.error.metadata as { fileSize?: number }).fileSize}
          maxSize={(props.error.metadata as { maxSize?: number }).maxSize}
        />
      </Show>
      <Show when={isSizeErrorMetadata(props.error.metadata)}>
        <ErrorLocationInfo
          fileSize={(props.error.metadata as { fileSize?: number }).fileSize}
          maxSize={(props.error.metadata as { maxSize?: number }).maxSize}
        />
      </Show>

      <Show when={category() !== null && category() !== undefined}>
        <div
          class="px-3 py-1 bg-muted text-muted-foreground text-sm font-semibold rounded-full"
          data-testid="error-badge"
        >
          {formatCategoryDisplay(category())}
        </div>
      </Show>

      <ErrorMetadata
        timestamp={props.error.timestamp}
        code={props.error.code}
        message={props.error.message}
        category={category()}
        technicalDetails={props.error.technicalDetails}
        metadata={props.error.metadata}
      />

      <div class="w-full max-w-md text-center">
        <a
          href="https://github.com/yourusername/resumewright/issues"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-sm text-link hover:text-link-hover hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset rounded-md px-2 py-1 transition-all duration-300"
          aria-label="Get help with this error on GitHub"
        >
          Need help? View FAQ or report this issue
          <span aria-hidden="true">→</span>
        </a>
      </div>

      <ErrorSuggestions
        error={props.error}
        retryAttempt={retryAttempt()}
        lastError={lastError()}
        prioritizedSuggestions={prioritizedSuggestions()}
        isSizeError={isSizeError()}
        sizeReductionTips={sizeReductionTips()}
      />

      <ErrorActions
        error={props.error}
        onRetry={props.onRetry}
        onDismiss={props.onDismiss}
        onReportIssue={props.onReportIssue}
        onImportDifferent={props.onImportDifferent}
        retryAttempt={retryAttempt()}
      />

      <Show
        when={
          props.error.technicalDetails !== null &&
          props.error.technicalDetails !== undefined &&
          props.error.technicalDetails !== ''
        }
      >
        <details class="w-full max-w-md">
          <summary class="text-sm text-muted-foreground cursor-pointer hover:text-link focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset rounded-md px-2 py-1 select-none">
            Technical details (for support)
          </summary>
          <pre class="mt-2 text-sm text-muted-foreground bg-muted p-3 rounded-md overflow-x-auto border border-border font-mono">
            {props.error.technicalDetails}
          </pre>
        </details>
      </Show>
    </div>
  );
}
