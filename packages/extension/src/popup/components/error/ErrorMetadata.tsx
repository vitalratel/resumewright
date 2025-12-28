// ABOUTME: Displays error code, timestamp, and copy-to-clipboard functionality.
// ABOUTME: Provides tracking information for support purposes.

import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import type { ErrorCategory } from '@/shared/errors/codes';
import type { ErrorDetails } from '@/shared/errors/tracking/telemetry';
import {
  copyToClipboard,
  formatErrorDetailsForClipboard,
  formatErrorTimestamp,
} from '@/shared/errors/tracking/telemetry';
import type { ErrorMetadata as ErrorMetadataType } from '@/shared/types/models';
import { useLoadingState } from '../../hooks/ui/useLoadingState';

interface ErrorMetadataProps {
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
 * Provides user with error code and timestamp for support purposes.
 */
export function ErrorMetadata({
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
    <div className="w-full max-w-md bg-card border border-border rounded-lg p-3 shadow-sm dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Error Code:</span>
            <code className="text-sm font-mono text-foreground bg-card px-2 py-0.5 rounded-md border border-border">
              {code}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Time:</span>
            <span className="text-sm text-muted-foreground">
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
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-card border border-border rounded-md ${copying ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted hover:border-border shadow-sm hover:shadow-md active:bg-muted active:scale-95'} focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all duration-300`}
          aria-label={copying ? 'Copying error details...' : 'Copy error details to clipboard'}
        >
          {copying ? (
            <>
              <svg
                className="animate-spin w-6 h-6 text-muted-foreground"
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
              <span className="text-muted-foreground">Copying...</span>
            </>
          ) : copySuccess ? (
            <>
              <CheckIcon className="w-6 h-6 text-success animate-pulse" aria-hidden="true" />
              <span className="text-success">Copied!</span>
            </>
          ) : (
            <>
              <ClipboardDocumentIcon className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
              <span className="text-foreground">Copy Details</span>
            </>
          )}
        </button>
      </div>

      {/* Suggestion to report with error code */}
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
        Use the error code above when reporting this issue for faster resolution.
      </p>
    </div>
  );
}
