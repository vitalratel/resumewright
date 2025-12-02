/**
 * ErrorDetails Component
 *
 * Displays error metadata (ID, timestamp) with copy-to-clipboard functionality.
 * Extracted from ErrorState to maintain single responsibility.
 *
 * @see {@link ErrorState} for main error display component
 */

import type { ErrorCategory } from '@/shared/errors/';
import type { ErrorDetails as ErrorDetailsType } from '@/shared/errors/tracking/telemetry';
import type { ConversionError } from '@/shared/types/models';
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { memo, useMemo, useState } from 'react';
import { copyToClipboard, formatErrorDetailsForClipboard, formatErrorTimestamp } from '@/shared/errors/tracking/telemetry';
import { tokens } from '../../styles/tokens';
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
    <div className={`w-full max-w-md ${tokens.colors.neutral.bgWhite} ${tokens.borders.default} ${tokens.borders.roundedLg} ${tokens.spacing.alert} ${tokens.effects.shadow}`}>
      <div className={`flex items-start justify-between ${tokens.spacing.gapMedium}`}>
        <div className="flex-1 space-y-1">
          <div className={`flex items-center ${tokens.spacing.gapSmall}`}>
            <span className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.textMuted}`}>Error ID:</span>
            <code className={`${tokens.typography.small} font-mono ${tokens.colors.neutral.text} ${tokens.colors.neutral.bgWhite} px-2 py-0.5 ${tokens.borders.rounded} ${tokens.borders.default}`}>
              {error.errorId || 'UNKNOWN'}
            </code>
          </div>
          <div className={`flex items-center ${tokens.spacing.gapSmall}`}>
            <span className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.textMuted}`}>Time:</span>
            <span className={`${tokens.typography.small} ${tokens.colors.neutral.textMuted}`}>
              {formattedTimestamp}
            </span>
          </div>
        </div>

        {/* Copy Button - Use Button component instead of inline styles */}
        <Button
          variant="secondary"
          onClick={() => { void handleCopyError(); }}
          icon={copySuccess ? CheckIcon : ClipboardDocumentIcon}
          success={copySuccess}
          aria-label="Copy error details to clipboard"
        >
          {copySuccess ? 'Copied!' : 'Copy Details'}
        </Button>
      </div>

      {/* Suggestion to report with error ID */}
      <p className={`mt-2 ${tokens.typography.small} ${tokens.colors.neutral.textMuted} leading-relaxed`}>
        Use the error ID above when reporting this issue for faster resolution.
      </p>
    </div>
  );
});
