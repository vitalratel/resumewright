// ABOUTME: Displays error metadata (ID, timestamp) with copy-to-clipboard functionality.
// ABOUTME: Extracted from ErrorState to maintain single responsibility.

import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { memo, useMemo, useState } from 'react';
import type { ErrorCategory } from '@/shared/errors/codes';
import type { ErrorDetails as ErrorDetailsType } from '@/shared/errors/tracking/telemetry';
import {
  copyToClipboard,
  formatErrorDetailsForClipboard,
  formatErrorTimestamp,
} from '@/shared/errors/tracking/telemetry';
import type { ConversionError } from '@/shared/types/models';
import { Button } from '../common/Button';

interface ErrorDetailsProps {
  /** The conversion error to display details for */
  error: ConversionError;
  /** Error category for formatting */
  category?: ErrorCategory;
}

/**
 * ErrorDetails component shows error ID, timestamp, and copy functionality
 */
export const ErrorDetails = memo(({ error, category }: ErrorDetailsProps) => {
  const [copySuccess, setCopySuccess] = useState(false);

  // Memoize formatted timestamp to avoid calling twice per render
  const formattedTimestamp = useMemo(
    () => formatErrorTimestamp(new Date(error.timestamp)),
    [error.timestamp],
  );

  const handleCopyError = async () => {
    const errorDetails: ErrorDetailsType = {
      errorId: error.errorId || 'N/A',
      timestamp: formattedTimestamp,
      code: error.code,
      message: error.message,
      category,
      technicalDetails: error.technicalDetails,
      metadata: error.metadata as Record<string, unknown> | undefined,
    };

    const formattedDetails = formatErrorDetailsForClipboard(errorDetails);
    const success = await copyToClipboard(formattedDetails);

    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-lg p-3 shadow-sm dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Error ID:</span>
            <code className="text-sm font-mono text-foreground bg-card px-2 py-0.5 rounded-md border border-border">
              {error.errorId || 'UNKNOWN'}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Time:</span>
            <span className="text-sm text-muted-foreground">{formattedTimestamp}</span>
          </div>
        </div>

        {/* Copy Button - Use Button component instead of inline styles */}
        <Button
          variant="secondary"
          onClick={() => {
            void handleCopyError();
          }}
          icon={copySuccess ? CheckIcon : ClipboardDocumentIcon}
          success={copySuccess}
          aria-label="Copy error details to clipboard"
        >
          {copySuccess ? 'Copied!' : 'Copy Details'}
        </Button>
      </div>

      {/* Suggestion to report with error ID */}
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        Use the error ID above when reporting this issue for faster resolution.
      </p>
    </div>
  );
});
