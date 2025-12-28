// ABOUTME: Presentational component for successful PDF conversion state.
// ABOUTME: Shows download confirmation, file info, copy-to-clipboard, and auto-close countdown.

import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  DocumentIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline';
import { type Ref, useState } from 'react';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import { useEvent } from '../../hooks/core/useEvent';
import { Alert } from '../common/Alert';
import { PDF } from '../common/TechTerm';

// Extract copy feedback timeout constant
const COPY_FEEDBACK_TIMEOUT_MS = 2000;

/**
 * Props for the SuccessView component
 *
 * @property ref - Optional ref to the root div element (React 19 native ref handling)
 * @property displayFilename - Name of the generated PDF file
 * @property fileSize - Human-readable file size (e.g., "324 KB", "1.2 MB")
 * @property apiAvailable - Whether browser download API is available
 * @property isAvailable - Whether the download is accessible via browser API
 * @property countdown - Optional auto-close countdown in seconds
 * @property isPaused - Whether the countdown timer is paused
 * @property onPause - Callback to pause the auto-close countdown
 * @property onResume - Callback to resume the auto-close countdown
 * @property onOpenDownload - Callback to open the downloaded PDF file
 * @property onShowInFolder - Callback to show the PDF in the downloads folder
 * @property onExportAnother - Callback to start a new conversion
 */
interface SuccessViewProps {
  ref?: Ref<HTMLDivElement>;
  displayFilename: string;
  fileSize: string;
  apiAvailable: boolean;
  isAvailable: boolean;
  countdown?: number;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onOpenDownload: () => void;
  onShowInFolder: () => void;
  onExportAnother: () => void;
}

export function SuccessView({
  ref,
  displayFilename,
  fileSize,
  apiAvailable,
  isAvailable,
  countdown,
  isPaused,
  onPause,
  onResume,
  onOpenDownload,
  onShowInFolder,
  onExportAnother,
}: SuccessViewProps) {
  // Copy filename to clipboard feature
  const [copied, setCopied] = useState(false);

  const handleCopyFilename = useEvent(async () => {
    try {
      await navigator.clipboard.writeText(displayFilename);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_TIMEOUT_MS);
    } catch (err) {
      getLogger().error('SuccessView', 'Failed to copy filename', err);
    }
  });

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="success-card w-full h-full bg-elevated px-6 py-8 md:px-8 md:py-10 flex flex-col items-center justify-center relative animate-fade-in"
      data-testid="success-state"
    >
      <div className="success-primary text-center space-y-4 w-full max-w-md">
        <CheckCircleIcon
          className="w-16 h-16 text-icon-success mx-auto animate-bounce-once"
          aria-hidden="true"
        />

        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {apiAvailable && isAvailable ? (
            <>
              <PDF /> Downloaded Successfully
            </>
          ) : (
            <>
              <PDF /> Ready
            </>
          )}
        </h1>

        <div className="flex items-center justify-center gap-2 max-w-full">
          <p className="text-sm text-muted-foreground font-mono truncate">{displayFilename}</p>
          <button
            type="button"
            onClick={() => {
              void handleCopyFilename();
            }}
            className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset"
            aria-label={copied ? 'Filename copied' : 'Copy filename to clipboard'}
            title={copied ? 'Copied!' : 'Copy filename'}
          >
            {copied ? (
              <ClipboardDocumentCheckIcon
                className="w-4 h-4 text-icon-success"
                aria-hidden="true"
              />
            ) : (
              <ClipboardDocumentIcon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            )}
          </button>
        </div>

        {apiAvailable && isAvailable ? (
          <button
            type="button"
            onClick={onOpenDownload}
            className="mt-4 mb-2 w-full px-6 py-3 text-lg font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset"
            aria-label={`Open downloaded ${displayFilename}`}
          >
            <ArrowDownTrayIcon className="w-6 h-6" aria-hidden="true" />
            Open Downloaded <PDF />
          </button>
        ) : (
          <Alert variant="success" className="mt-4 mb-2">
            <div className="flex items-center justify-center gap-2">
              <ArrowDownTrayIcon className="w-4 h-4 text-icon-success" aria-hidden="true" />
              <p className="text-sm font-medium text-success-text">Downloaded to your computer</p>
            </div>
          </Alert>
        )}
      </div>

      <details className="success-details mt-4 mb-2 w-full max-w-md text-left">
        <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground select-none text-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset rounded-md transition-all duration-300">
          View export details
        </summary>
        <div className="mt-3 text-sm text-light-foreground space-y-2 bg-muted rounded-lg p-3">
          <p className="flex items-center gap-2">
            <DocumentIcon className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
            <span aria-hidden="true">File size: {fileSize}</span>
            <span className="sr-only">
              File size: {fileSize.replace('MB', 'megabytes').replace('KB', 'kilobytes')}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <FolderOpenIcon className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
            <span>Location: Downloads folder</span>
          </p>
          {apiAvailable && isAvailable && (
            <button
              type="button"
              onClick={onShowInFolder}
              className="mt-2 text-sm text-link hover:text-link-hover hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset rounded-md transition-all duration-300"
              aria-label={`Show ${displayFilename} in Downloads folder`}
            >
              Show in folder →
            </button>
          )}
          {!apiAvailable && (
            <p className="text-xs text-light-foreground mt-2">
              Check your browser&apos;s Downloads folder or download bar
            </p>
          )}
        </div>
      </details>

      <div className="success-actions mt-4 mb-2 flex justify-center gap-4 text-sm">
        <button
          type="button"
          onClick={onExportAnother}
          className="px-4 py-2 text-link hover:text-link-hover hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset rounded-md transition-all duration-300"
          aria-label="Start a new conversion and convert another CV file to PDF"
        >
          Convert another CV
        </button>
      </div>

      {countdown !== undefined && countdown > 0 && (
        <div className="absolute bottom-4 flex items-center gap-4">
          <p className="text-xs text-muted-foreground">
            Closing in {countdown}s {isPaused && '(paused)'}
          </p>
          {onPause && onResume && (
            <button
              type="button"
              onClick={isPaused ? onResume : onPause}
              className="min-h-11 px-2 py-1 text-xs text-link hover:text-link-hover hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset rounded-md transition-all duration-300"
              aria-label={isPaused ? 'Resume auto-close countdown' : 'Pause auto-close countdown'}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}
          <button
            type="button"
            onClick={onExportAnother}
            className="min-h-11 px-2 py-1 text-xs text-link hover:text-link-hover hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset rounded-md transition-all duration-300"
            aria-label="Close success message and start new conversion"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
