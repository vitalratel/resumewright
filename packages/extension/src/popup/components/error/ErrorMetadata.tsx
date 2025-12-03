/**
 * Error Metadata Component
 *
 * Displays error ID, timestamp, and copy-to-clipboard functionality.
 * Extracted from ErrorState for better component organization .
 */

import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import type { ErrorCategory } from '@/shared/errors/';
import type { ErrorDetails } from '@/shared/errors/tracking/telemetry';
import {
  copyToClipboard,
  formatErrorDetailsForClipboard,
  formatErrorTimestamp,
} from '@/shared/errors/tracking/telemetry';
import type { ErrorMetadata as ErrorMetadataType } from '@/shared/types/models';
import { useLoadingState } from '../../hooks/ui/useLoadingState';
import { tokens } from '../../styles/tokens';

interface ErrorMetadataProps {
  /** Error ID for tracking */
  errorId?: string;

  /** Error timestamp */
  timestamp: number;

  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Error category */
  category?: ErrorCategory;

  /** Technical details */
  technicalDetails?: string;

  /** Additional metadata - Discriminated union type */
  metadata?: ErrorMetadataType;
}

/**
 * ErrorMetadata Component
 *
 * Displays error tracking information with copy-to-clipboard functionality.
 * Provides user with error ID and timestamp for support purposes.
 */
export function ErrorMetadata({
  errorId,
  timestamp,
  code,
  message,
  category,
  technicalDetails,
  metadata,
}: ErrorMetadataProps) {
  // Use useLoadingState for consistent loading state management
  const {
    loading: copying,
    success: copySuccess,
    execute: executeCopy,
  } = useLoadingState({
    trackSuccess: true,
    successDuration: 2000,
  });

  const handleCopyError = async () => {
    await executeCopy(async () => {
      const errorDetails: ErrorDetails = {
        errorId: errorId !== null && errorId !== undefined && errorId !== '' ? errorId : 'N/A',
        timestamp: formatErrorTimestamp(new Date(timestamp)),
        code,
        message,
        category,
        technicalDetails,
        metadata: metadata as Record<string, unknown> | undefined,
      };

      const formattedDetails = formatErrorDetailsForClipboard(errorDetails);
      const success = await copyToClipboard(formattedDetails);

      if (!success) {
        throw new Error('Failed to copy to clipboard');
      }
    });
  };

  return (
    <div
      className={`w-full max-w-md ${tokens.colors.neutral.bgWhite} ${tokens.borders.default} ${tokens.borders.roundedLg} ${tokens.spacing.cardSmall} ${tokens.effects.shadow}`}
    >
      <div className={`flex items-start justify-between ${tokens.spacing.gapMedium}`}>
        <div className={`flex-1 ${tokens.spacing.gapSmall}`}>
          <div className={`flex items-center ${tokens.spacing.gapSmall}`}>
            <span
              className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.textMuted}`}
            >
              Error ID:
            </span>
            <code
              className={`${tokens.typography.small} font-mono ${tokens.colors.neutral.text} ${tokens.colors.neutral.bgWhite} px-2 py-0.5 ${tokens.borders.rounded} ${tokens.borders.default}`}
            >
              {errorId !== null && errorId !== undefined && errorId !== '' ? errorId : 'UNKNOWN'}
            </code>
          </div>
          <div className={`flex items-center ${tokens.spacing.gapSmall}`}>
            <span
              className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.textMuted}`}
            >
              Time:
            </span>
            <span className={`${tokens.typography.small} ${tokens.colors.neutral.textMuted}`}>
              {formatErrorTimestamp(new Date(timestamp))}
            </span>
          </div>
        </div>

        {/* Copy Button with loading state */}
        <button
          type="button"
          onClick={() => {
            void handleCopyError();
          }}
          disabled={copying}
          className={`flex items-center gap-1.5 px-3 py-1.5 ${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.bgWhite} ${tokens.borders.default} ${tokens.borders.rounded} ${copying ? 'opacity-50 cursor-not-allowed' : `${tokens.colors.neutral.hover} ${tokens.effects.hoverBorder} ${tokens.effects.shadowInteractive} ${tokens.buttons.variants.iconActive} active:scale-95`} ${tokens.effects.focusRing} ${tokens.transitions.default}`
            .trim()
            .replace(/\s+/g, ' ')}
          aria-label={copying ? 'Copying error details...' : 'Copy error details to clipboard'}
        >
          {copying ? (
            <>
              <svg
                className={`animate-spin ${tokens.icons.md} ${tokens.colors.neutral.textMuted}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className={tokens.colors.neutral.textMuted}>Copying...</span>
            </>
          ) : copySuccess ? (
            <>
              <CheckIcon
                className={`${tokens.icons.md} ${tokens.colors.success.icon} animate-pulse`}
                aria-hidden="true"
              />
              <span className={tokens.colors.success.textStrong}>Copied!</span>
            </>
          ) : (
            <>
              <ClipboardDocumentIcon
                className={`${tokens.icons.md} ${tokens.colors.neutral.textMuted}`}
                aria-hidden="true"
              />
              <span className={tokens.colors.neutral.text}>Copy Details</span>
            </>
          )}
        </button>
      </div>

      {/* Suggestion to report with error ID */}
      <p
        className={`${tokens.spacing.marginSmall} ${tokens.typography.small} ${tokens.colors.neutral.textMuted} leading-relaxed`}
      >
        Use the error ID above when reporting this issue for faster resolution.
      </p>
    </div>
  );
}
