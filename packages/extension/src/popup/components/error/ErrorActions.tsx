// ABOUTME: Action buttons for error recovery (Try Again, Import Different, etc.).
// ABOUTME: Prioritizes actions based on error type and retry attempts.

import { Show } from 'solid-js';
import {
  copyToClipboard,
  formatErrorDetailsForClipboard,
  formatErrorTimestamp,
} from '@/shared/errors/tracking/telemetry';
import type { ConversionError } from '@/shared/types/models';
import { createLoadingState } from '../../reactivity/loading';
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
export function ErrorActions(props: ErrorActionsProps) {
  const isDevMode = import.meta.env.DEV;

  const { loading: retrying, execute: executeRetry } = createLoadingState();

  const handleRetry = async () => {
    if (!props.onRetry) return;

    await executeRetry(async () => {
      await props.onRetry!();
    });
  };

  const handleReportIssue = async () => {
    if (props.onReportIssue) {
      await props.onReportIssue();
    } else {
      const details = formatErrorDetailsForClipboard({
        timestamp: formatErrorTimestamp(new Date(props.error.timestamp)),
        code: props.error.code,
        message: props.error.message,
        category: props.error.category,
        technicalDetails: props.error.technicalDetails,
        metadata: props.error.metadata as Record<string, unknown> | undefined,
      });
      await copyToClipboard(details);
    }
  };

  // Determine if "Import Different File" should be primary action
  // Make it primary for parse errors, file structure errors, or after multiple retries
  const shouldPrioritizeImport = () =>
    props.error.code === 'TSX_PARSE_ERROR' ||
    props.error.code === 'INVALID_TSX_STRUCTURE' ||
    props.retryAttempt >= 2;

  return (
    <div class="w-full max-w-md space-y-2 pt-2 flex flex-col">
      <Show when={props.onImportDifferent && shouldPrioritizeImport()}>
        <Button
          onClick={props.onImportDifferent}
          variant="primary"
          aria-label="Dismiss error and import a different CV file to convert"
          data-testid="try-again-button"
        >
          Import Different File
        </Button>
      </Show>

      <Show when={props.error.recoverable && props.onRetry}>
        <Button
          onClick={() => {
            void handleRetry();
          }}
          variant={shouldPrioritizeImport() ? 'secondary' : 'primary'}
          loading={retrying()}
          disabled={retrying()}
          aria-label={
            props.retryAttempt > 0
              ? `Try converting again (attempt ${props.retryAttempt + 1})`
              : 'Try converting your CV again'
          }
          data-testid="try-again-button"
        >
          {retrying()
            ? 'Retrying...'
            : props.retryAttempt > 0
              ? `Try Again (Attempt ${props.retryAttempt + 1})`
              : 'Try Converting Again'}
        </Button>
      </Show>

      <Show when={props.onImportDifferent && !shouldPrioritizeImport()}>
        <Button
          onClick={props.onImportDifferent}
          variant="secondary"
          aria-label="Dismiss error and import a different CV file to convert"
          data-testid="dismiss-button"
        >
          Import Different File
        </Button>
      </Show>

      <Show when={props.onDismiss && !props.onImportDifferent}>
        <Button
          onClick={props.onDismiss}
          variant="secondary"
          aria-label="Dismiss error and return to file selection screen"
          data-testid="dismiss-button"
        >
          Return to Import
        </Button>
      </Show>

      <Show when={isDevMode}>
        <button
          type="button"
          onClick={() => {
            void handleReportIssue();
          }}
          class="w-full px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset"
          aria-label="Copy error details and open GitHub issue template"
          data-testid="report-issue-button"
        >
          Copy Error Details
        </button>
      </Show>
    </div>
  );
}
