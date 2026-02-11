// ABOUTME: Displays error metadata (code, timestamp) with copy-to-clipboard functionality.
// ABOUTME: Extracted from ErrorState to maintain single responsibility.

import { HiOutlineCheck, HiOutlineClipboardDocument } from 'solid-icons/hi';
import { createMemo, createSignal } from 'solid-js';
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

export function ErrorDetails(props: ErrorDetailsProps) {
  const [copySuccess, setCopySuccess] = createSignal(false);

  const formattedTimestamp = createMemo(() =>
    formatErrorTimestamp(new Date(props.error.timestamp)),
  );

  const handleCopyError = async () => {
    const errorDetails: ErrorDetailsType = {
      timestamp: formattedTimestamp(),
      code: props.error.code,
      message: props.error.message,
      category: props.category,
      technicalDetails: props.error.technicalDetails,
      metadata: props.error.metadata as Record<string, unknown> | undefined,
    };

    const formattedDetails = formatErrorDetailsForClipboard(errorDetails);
    const success = await copyToClipboard(formattedDetails);

    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div class="w-full max-w-md bg-card border border-border rounded-lg p-3 shadow-sm dark:shadow-none">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-muted-foreground">Error Code:</span>
            <code class="text-sm font-mono text-foreground bg-card px-2 py-0.5 rounded-md border border-border">
              {props.error.code}
            </code>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-muted-foreground">Time:</span>
            <span class="text-sm text-muted-foreground">{formattedTimestamp()}</span>
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={() => {
            void handleCopyError();
          }}
          icon={copySuccess() ? HiOutlineCheck : HiOutlineClipboardDocument}
          success={copySuccess()}
          aria-label="Copy error details to clipboard"
        >
          {copySuccess() ? 'Copied!' : 'Copy Details'}
        </Button>
      </div>

      <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
        Use the error code above when reporting this issue for faster resolution.
      </p>
    </div>
  );
}
