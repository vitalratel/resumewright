// ABOUTME: Presentational component for successful PDF conversion state.
// ABOUTME: Shows download confirmation, file info, copy-to-clipboard, and auto-close countdown.

import {
  HiOutlineArrowDownTray,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocument,
  HiOutlineClipboardDocumentCheck,
  HiOutlineDocument,
  HiOutlineFolderOpen,
} from 'solid-icons/hi';
import { createSignal, Show } from 'solid-js';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import { Alert } from '../common/Alert';
import { PDF } from '../common/TechTerm';

// Extract copy feedback timeout constant
const COPY_FEEDBACK_TIMEOUT_MS = 2000;

/**
 * Props for the SuccessView component
 *
 * @property ref - Optional ref to the root div element
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
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void);
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

export function SuccessView(props: SuccessViewProps) {
  // Copy filename to clipboard feature
  const [copied, setCopied] = createSignal(false);

  const handleCopyFilename = async () => {
    try {
      await navigator.clipboard.writeText(props.displayFilename);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_TIMEOUT_MS);
    } catch (err) {
      getLogger().error('SuccessView', 'Failed to copy filename', err);
    }
  };

  return (
    <div
      ref={props.ref}
      tabIndex={-1}
      class="success-card w-full h-full bg-elevated px-6 py-8 md:px-8 md:py-10 flex flex-col items-center justify-center relative animate-fade-in"
      data-testid="success-state"
    >
      <div class="success-primary text-center space-y-4 w-full max-w-md">
        <HiOutlineCheckCircle
          class="w-16 h-16 text-icon-success mx-auto animate-bounce-once"
          aria-hidden="true"
        />

        <h1 class="text-2xl md:text-3xl font-bold text-foreground">
          <Show
            when={props.apiAvailable && props.isAvailable}
            fallback={
              <>
                <PDF /> Ready
              </>
            }
          >
            <PDF /> Downloaded Successfully
          </Show>
        </h1>

        <div class="flex items-center justify-center gap-2 max-w-full">
          <p class="text-sm text-muted-foreground font-mono truncate">{props.displayFilename}</p>
          <button
            type="button"
            onClick={() => {
              void handleCopyFilename();
            }}
            class="shrink-0 p-1.5 rounded-md hover:bg-muted transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset"
            aria-label={copied() ? 'Filename copied' : 'Copy filename to clipboard'}
            title={copied() ? 'Copied!' : 'Copy filename'}
          >
            <Show
              when={copied()}
              fallback={
                <HiOutlineClipboardDocument
                  class="w-4 h-4 text-muted-foreground"
                  aria-hidden="true"
                />
              }
            >
              <HiOutlineClipboardDocumentCheck
                class="w-4 h-4 text-icon-success"
                aria-hidden="true"
              />
            </Show>
          </button>
        </div>

        <Show
          when={props.apiAvailable && props.isAvailable}
          fallback={
            <Alert variant="success" class="mt-4 mb-2">
              <div class="flex items-center justify-center gap-2">
                <HiOutlineArrowDownTray class="w-4 h-4 text-icon-success" aria-hidden="true" />
                <p class="text-sm font-medium text-success-text">Downloaded to your computer</p>
              </div>
            </Alert>
          }
        >
          <button
            type="button"
            onClick={props.onOpenDownload}
            class="mt-4 mb-2 w-full px-6 py-3 text-lg font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset"
            aria-label={`Open downloaded ${props.displayFilename}`}
          >
            <HiOutlineArrowDownTray class="w-6 h-6" aria-hidden="true" />
            Open Downloaded <PDF />
          </button>
        </Show>
      </div>

      <details class="success-details mt-4 mb-2 w-full max-w-md text-left">
        <summary class="text-sm text-muted-foreground cursor-pointer hover:text-foreground select-none text-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset rounded-md transition-all duration-300">
          View export details
        </summary>
        <div class="mt-3 text-sm text-light-foreground space-y-2 bg-muted rounded-lg p-3">
          <p class="flex items-center gap-2">
            <HiOutlineDocument class="w-3 h-3 text-muted-foreground" aria-hidden="true" />
            <span aria-hidden="true">File size: {props.fileSize}</span>
            <span class="sr-only">
              File size: {props.fileSize.replace('MB', 'megabytes').replace('KB', 'kilobytes')}
            </span>
          </p>
          <p class="flex items-center gap-2">
            <HiOutlineFolderOpen class="w-3 h-3 text-muted-foreground" aria-hidden="true" />
            <span>Location: Downloads folder</span>
          </p>
          <Show when={props.apiAvailable && props.isAvailable}>
            <button
              type="button"
              onClick={props.onShowInFolder}
              class="mt-2 text-sm text-link hover:text-link-hover hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset rounded-md transition-all duration-300"
              aria-label={`Show ${props.displayFilename} in Downloads folder`}
            >
              Show in folder →
            </button>
          </Show>
          <Show when={!props.apiAvailable}>
            <p class="text-xs text-light-foreground mt-2">
              Check your browser&apos;s Downloads folder or download bar
            </p>
          </Show>
        </div>
      </details>

      <div class="success-actions mt-4 mb-2 flex justify-center gap-4 text-sm">
        <button
          type="button"
          onClick={props.onExportAnother}
          class="px-4 py-2 text-link hover:text-link-hover hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset rounded-md transition-all duration-300"
          aria-label="Start a new conversion and convert another CV file to PDF"
        >
          Convert another CV
        </button>
      </div>

      <Show when={props.countdown !== undefined && props.countdown! > 0}>
        <div class="absolute bottom-4 flex items-center gap-4">
          <p class="text-xs text-muted-foreground">
            Closing in {props.countdown}s {props.isPaused && '(paused)'}
          </p>
          <Show when={props.onPause && props.onResume}>
            <button
              type="button"
              onClick={props.isPaused ? props.onResume : props.onPause}
              class="min-h-11 px-2 py-1 text-xs text-link hover:text-link-hover hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset rounded-md transition-all duration-300"
              aria-label={
                props.isPaused ? 'Resume auto-close countdown' : 'Pause auto-close countdown'
              }
            >
              {props.isPaused ? 'Resume' : 'Pause'}
            </button>
          </Show>
          <button
            type="button"
            onClick={props.onExportAnother}
            class="min-h-11 px-2 py-1 text-xs text-link hover:text-link-hover hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ring-offset rounded-md transition-all duration-300"
            aria-label="Close success message and start new conversion"
          >
            Close
          </button>
        </div>
      </Show>
    </div>
  );
}
