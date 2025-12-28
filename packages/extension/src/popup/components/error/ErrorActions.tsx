// ABOUTME: Action buttons for error recovery (Try Again, Import Different, etc.).
// ABOUTME: Prioritizes actions based on error type and retry attempts.

import {
  copyToClipboard,
  formatErrorDetailsForClipboard,
  formatErrorTimestamp,
} from '@/shared/errors/tracking/telemetry';
import type { ConversionError } from '@/shared/types/models';
import { useEvent } from '../../hooks/core/useEvent';
import { useLoadingState } from '../../hooks/ui/useLoadingState';
import { Button } from '../common/Button';

interface ErrorActionsProps {
  /** Conversion error */
  error: ConversionError;

  /** Retry callback (only shown if error.recoverable) */
  onRetry?: () => void | Promise<void>;

  /** Dismiss callback to clear error state */
  onDismiss?: () => void;

  /** Report issue callback (dev mode only) */
  onReportIssue?: () => void | Promise<void>;

  /** Number of retry attempts (for button label) */
  retryAttempt: number;

  /** Import different file callback */
  onImportDifferent?: () => void;
}

/**
 * ErrorActions displays action buttons for error recovery
 */
export function ErrorActions({
  error,
  onRetry,
  onDismiss,
  onReportIssue,
  retryAttempt,
  onImportDifferent,
}: ErrorActionsProps) {
  const isDevMode = import.meta.env.DEV;

  // Use useLoadingState for consistent loading state management
  const { loading: retrying, execute: executeRetry } = useLoadingState();

  const handleRetry = useEvent(async () => {
    if (!onRetry) return;

    await executeRetry(async () => {
      await onRetry();
    });
  });

  const handleReportIssue = useEvent(async () => {
    if (onReportIssue) {
      await onReportIssue();
    } else {
      // Copy error details to clipboard
      const details = formatErrorDetailsForClipboard({
        timestamp: formatErrorTimestamp(new Date(error.timestamp)),
        code: error.code,
        message: error.message,
        category: error.category,
        technicalDetails: error.technicalDetails,
        metadata: error.metadata as Record<string, unknown> | undefined,
      });
      await copyToClipboard(details);
    }
  });

  // Determine if "Import Different File" should be primary action
  // Make it primary for parse errors, file structure errors, or after multiple retries
  const shouldPrioritizeImport =
    error.code === 'TSX_PARSE_ERROR' || error.code === 'INVALID_TSX_STRUCTURE' || retryAttempt >= 2;

  return (
    <div className="w-full max-w-md space-y-2 pt-2 flex flex-col">
      {onImportDifferent && shouldPrioritizeImport && (
        <Button
          onClick={onImportDifferent}
          variant="primary"
          aria-label="Dismiss error and import a different CV file to convert"
          data-testid="try-again-button"
        >
          Import Different File
        </Button>
      )}

      {error.recoverable && onRetry && (
        <Button
          onClick={() => {
            void handleRetry();
          }}
          variant={shouldPrioritizeImport ? 'secondary' : 'primary'}
          loading={retrying}
          disabled={retrying}
          aria-label={
            retryAttempt > 0
              ? `Try converting again (attempt ${retryAttempt + 1})`
              : 'Try converting your CV again'
          }
          data-testid="try-again-button"
        >
          {retrying
            ? 'Retrying...'
            : retryAttempt > 0
              ? `Try Again (Attempt ${retryAttempt + 1})`
              : 'Try Converting Again'}
        </Button>
      )}

      {onImportDifferent && !shouldPrioritizeImport && (
        <Button
          onClick={onImportDifferent}
          variant="secondary"
          aria-label="Dismiss error and import a different CV file to convert"
          data-testid="dismiss-button"
        >
          Import Different File
        </Button>
      )}

      {onDismiss && !onImportDifferent && (
        <Button
          onClick={onDismiss}
          variant="secondary"
          aria-label="Dismiss error and return to file selection screen"
          data-testid="dismiss-button"
        >
          Return to Import
        </Button>
      )}

      {isDevMode && (
        <button
          type="button"
          onClick={() => {
            void handleReportIssue();
          }}
          className="w-full px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset"
          aria-label="Copy error details and open GitHub issue template"
          data-testid="report-issue-button"
        >
          Copy Error Details
        </button>
      )}
    </div>
  );
}
