/**
 * ErrorActions Component
 *
 * Displays action buttons for error recovery:
 * - Try Again (if recoverable)
 * - Return to Import (dismiss)
 * - Import Different File
 * - Report Issue (dev mode only)
 */

import { memo, useCallback } from 'react';
import {
  copyToClipboard,
  formatErrorDetailsForClipboard,
  formatErrorTimestamp,
} from '@/shared/errors';
import type { ConversionError } from '@/shared/types/models';
import { useLoadingState } from '../../hooks/ui/useLoadingState';
import { tokens } from '../../styles/tokens';
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
export const ErrorActions = memo(
  ({
    error,
    onRetry,
    onDismiss,
    onReportIssue,
    retryAttempt,
    onImportDifferent,
  }: ErrorActionsProps) => {
    const isDevMode = import.meta.env.DEV;

    // Use useLoadingState for consistent loading state management
    const { loading: retrying, execute: executeRetry } = useLoadingState();

    // Handle retry with loading state (memoized)
    const handleRetry = useCallback(async () => {
      if (!onRetry) return;

      await executeRetry(async () => {
        await onRetry();
      });
    }, [onRetry, executeRetry]);

    // Handle issue reporting (memoized)
    const handleReportIssue = useCallback(async () => {
      if (onReportIssue) {
        await onReportIssue();
      } else {
        // Copy error details to clipboard
        const details = formatErrorDetailsForClipboard({
          errorId: error.errorId,
          timestamp: formatErrorTimestamp(new Date(error.timestamp)),
          code: error.code,
          message: error.message,
          category: error.category,
          technicalDetails: error.technicalDetails,
          metadata: error.metadata as Record<string, unknown> | undefined,
        });
        await copyToClipboard(details);
      }
    }, [onReportIssue, error]);

    // Determine if "Import Different File" should be primary action
    // Make it primary for parse errors, file structure errors, or after multiple retries
    const shouldPrioritizeImport =
      error.code === 'TSX_PARSE_ERROR' ||
      error.code === 'INVALID_TSX_STRUCTURE' ||
      retryAttempt >= 2;

    return (
      <div
        className={`w-full ${tokens.layout.maxWidthPopup} ${tokens.spacing.gapSmall} pt-2 flex flex-col`}
      >
        {/* Import Different File button (primary for file-related errors) */}
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

        {/* Try Again button (only if recoverable) */}
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

        {/* Import Different File button (secondary for other errors) */}
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

        {/* Dismiss button (tertiary action) */}
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

        {/* Copy Error Details button (dev mode only) */}
        {isDevMode && (
          <button
            type="button"
            onClick={() => {
              void handleReportIssue();
            }}
            className={`w-full ${tokens.buttons.default.secondary} ${tokens.typography.small} ${tokens.colors.neutral.textMuted} ${tokens.colors.neutral.hover} ${tokens.borders.roundedLg} ${tokens.transitions.default} ${tokens.effects.focusRing}`
              .trim()
              .replace(/\s+/g, ' ')}
            aria-label="Copy error details and open GitHub issue template"
            data-testid="report-issue-button"
          >
            Copy Error Details
          </button>
        )}
      </div>
    );
  },
);
