/**
 * SuccessView Component (Presentational)
 *
 * Pure presentational component for displaying the success state after PDF conversion.
 * Shows download confirmation with file information, copy-to-clipboard functionality,
 * and action buttons. Separated from business logic for better testability.
 *
 * @remarks
 * This component uses React 19's native ref handling (no forwardRef needed).
 * Refs are passed as regular props for focus management.
 *
 * Features:
 * - Conditional messaging based on browser download API availability
 * - Copy filename to clipboard with visual feedback
 * - Collapsible export details section
 * - Optional auto-close countdown with pause/resume
 * - Accessible keyboard navigation and screen reader support
 *
 * @example
 * ```tsx
 * <SuccessView
 *   displayFilename="John_Doe_Resume.pdf"
 *   fileSize="324 KB"
 *   apiAvailable={true}
 *   isAvailable={true}
 *   countdown={20}
 *   isPaused={false}
 *   onPause={handlePause}
 *   onResume={handleResume}
 *   onOpenDownload={handleOpenDownload}
 *   onShowInFolder={handleShowInFolder}
 *   onExportAnother={handleExportAnother}
 * />
 * ```
 *
 * @see {@link Success} - Container component with business logic
 */

import { ArrowDownTrayIcon, CheckCircleIcon, ClipboardDocumentCheckIcon, ClipboardDocumentIcon, DocumentIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useState } from 'react';
import { getLogger } from '@/shared/infrastructure/logging';
import { tokens } from '../../styles/tokens';
import { Alert, PDF } from '../common';

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
  ref?: React.Ref<HTMLDivElement>;
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

export const SuccessView = React.memo(({ ref, displayFilename, fileSize, apiAvailable, isAvailable, countdown, isPaused, onPause, onResume, onOpenDownload, onShowInFolder, onExportAnother }: SuccessViewProps) => {
  // Copy filename to clipboard feature
  const [copied, setCopied] = useState(false);

  // Wrap in useCallback to prevent recreating on every render
  const handleCopyFilename = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(displayFilename);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_TIMEOUT_MS);
    }
    catch (err) {
      getLogger().error('SuccessView', 'Failed to copy filename', err);
    }
  }, [displayFilename]);

  return (
    <div ref={ref} tabIndex={-1} className={`success-card w-full h-full ${tokens.colors.neutral.bgWhite} ${tokens.spacing.cardFullPage} flex flex-col items-center justify-center relative animate-fade-in`} data-testid="success-state">
      {/* PRIMARY SECTION: Success message + Main action */}
      <div className={`success-primary text-center ${tokens.spacing.sectionGap} w-full max-w-md`}>
        {/* Success icon with hero size */}
        <CheckCircleIcon className={`${tokens.icons.hero} ${tokens.colors.success.icon} mx-auto animate-bounce-once`} aria-hidden="true" />

        {/* Conditional success message based on download state */}
        <h1 className={`${tokens.typography.heroHeading} ${tokens.colors.neutral.text}`}>
          {apiAvailable && isAvailable
            ? (
                <>
                  <PDF />
                  {' '}
                  Downloaded Successfully
                </>
              )
            : (
                <>
                  <PDF />
                  {' '}
                  Ready
                </>
              )}
        </h1>

        {/* Filename display with copy button  */}
        <div className={`flex items-center justify-center ${tokens.spacing.gapSmall} max-w-full`}>
          <p className={`${tokens.typography.small} ${tokens.colors.neutral.textMuted} font-mono truncate`}>
            {displayFilename}
          </p>
          <button
            type="button"
            onClick={() => { void handleCopyFilename(); }}
            className={`flex-shrink-0 p-1.5 ${tokens.borders.rounded} ${tokens.colors.neutral.hover} ${tokens.transitions.default} ${tokens.effects.focusRing}`}
            aria-label={copied ? 'Filename copied' : 'Copy filename to clipboard'}
            title={copied ? 'Copied!' : 'Copy filename'}
          >
            {copied
              ? (
                  <ClipboardDocumentCheckIcon className={`${tokens.icons.sm} ${tokens.colors.success.icon}`} aria-hidden="true" />
                )
              : (
                  <ClipboardDocumentIcon className={`${tokens.icons.sm} ${tokens.colors.neutral.icon}`} aria-hidden="true" />
                )}
          </button>
        </div>

        {/* Primary action button - text matches download state */}
        {apiAvailable && isAvailable
          ? (
              <button
                type="button"
                onClick={onOpenDownload}
                className={`${tokens.spacing.marginMedium} ${tokens.spacing.marginSmall} w-full ${tokens.buttons.hero.primary} text-lg ${tokens.typography.semibold} text-white ${tokens.gradients.blueHeader} ${tokens.borders.roundedLg} ${tokens.effects.shadowInteractiveLg} hover:-translate-y-0.5 active:translate-y-0 ${tokens.transitions.default} flex items-center justify-center ${tokens.spacing.gapSmall} ${tokens.effects.focusRing}`}
                aria-label={`Open downloaded ${displayFilename}`}
              >
                <ArrowDownTrayIcon className={tokens.icons.md} aria-hidden="true" />
                Open Downloaded
                {' '}
                <PDF />
              </button>
            )
          : (
              <Alert variant="success" className={`${tokens.spacing.marginMedium} ${tokens.spacing.marginSmall}`}>
                <div className={`flex items-center justify-center ${tokens.spacing.gapSmall}`}>
                  <ArrowDownTrayIcon className={`${tokens.icons.sm} ${tokens.colors.success.icon}`} aria-hidden="true" />
                  <p className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.success.textStrong}`}>Downloaded to your computer</p>
                </div>
              </Alert>
            )}
      </div>

      {/* Collapsible export details */}
      <details className={`success-details ${tokens.spacing.marginMedium} ${tokens.spacing.marginSmall} w-full max-w-md text-left`}>
        <summary className={`${tokens.typography.small} ${tokens.colors.neutral.textMuted} cursor-pointer hover:${tokens.colors.neutral.text} select-none text-center ${tokens.effects.focusRing} ${tokens.borders.rounded} ${tokens.transitions.default}`}>
          View export details
        </summary>
        <div className={`${tokens.spacing.gapMedium} ${tokens.typography.small} ${tokens.colors.neutral.textLight} ${tokens.spacing.gapSmall} ${tokens.colors.neutral.bg} ${tokens.borders.roundedLg} ${tokens.spacing.cardSmall}`}>
          <p className={`flex items-center ${tokens.spacing.gapSmall}`}>
            <DocumentIcon className={`${tokens.icons.xs} ${tokens.colors.neutral.icon}`} aria-hidden="true" />
            {/* Screen reader friendly file size pronunciation */}
            <span aria-label={`File size: ${fileSize.replace('MB', 'megabytes').replace('KB', 'kilobytes')}`}>
              File size:
              {' '}
              {fileSize}
            </span>
          </p>
          <p className={`flex items-center ${tokens.spacing.gapSmall}`}>
            <FolderOpenIcon className={`${tokens.icons.xs} ${tokens.colors.neutral.icon}`} aria-hidden="true" />
            <span>Location: Downloads folder</span>
          </p>
          {apiAvailable && isAvailable && (
            <button
              type="button"
              onClick={onShowInFolder}
              className={`${tokens.spacing.marginSmall} ${tokens.typography.small} ${tokens.colors.link.text} ${tokens.colors.link.hover} ${tokens.colors.link.hoverUnderline} ${tokens.effects.focusRing} ${tokens.borders.rounded} ${tokens.transitions.default}`}
              aria-label={`Show ${displayFilename} in Downloads folder`}
            >
              Show in folder →
            </button>
          )}
          {!apiAvailable && (
            <p className={`${tokens.typography.xs} ${tokens.colors.neutral.textLight} ${tokens.spacing.marginSmall}`}>
              Check your browser&apos;s Downloads folder or download bar
            </p>
          )}
        </div>
      </details>

      {/* Secondary actions */}
      <div className={`success-actions ${tokens.spacing.marginMedium} ${tokens.spacing.marginSmall} flex justify-center ${tokens.spacing.gapLarge} ${tokens.typography.small}`}>
        <button
          type="button"
          onClick={onExportAnother}
          className={`${tokens.buttons.default.secondary} ${tokens.colors.link.text} ${tokens.colors.link.hover} ${tokens.colors.link.hoverUnderline} ${tokens.effects.focusRing} ${tokens.borders.rounded} ${tokens.transitions.default}`}
          aria-label="Start a new conversion and convert another CV file to PDF"
        >
          Convert another CV
        </button>
      </div>

      {/* Auto-dismiss Timer - Added pause/resume */}
      {countdown !== undefined && countdown > 0 && (
        <div className={`absolute bottom-4 flex items-center ${tokens.spacing.gapLarge}`}>
          <p className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted}`}>
            Closing in
            {' '}
            {countdown}
            s
            {' '}
            {isPaused && '(paused)'}
          </p>
          {onPause && onResume && (
            <button
              type="button"
              onClick={isPaused ? onResume : onPause}
              className={`min-h-11 px-2 py-1 ${tokens.typography.xs} ${tokens.colors.link.text} ${tokens.colors.link.hover} ${tokens.colors.link.hoverUnderline} ${tokens.effects.focusRing} ${tokens.borders.rounded} ${tokens.transitions.default}`}
              aria-label={isPaused ? 'Resume auto-close countdown' : 'Pause auto-close countdown'}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}
          <button
            type="button"
            onClick={onExportAnother}
            className={`min-h-11 px-2 py-1 ${tokens.typography.xs} ${tokens.colors.link.text} ${tokens.colors.link.hover} ${tokens.colors.link.hoverUnderline} ${tokens.effects.focusRing} ${tokens.borders.rounded} ${tokens.transitions.default}`}
            aria-label="Close success message and start new conversion"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
});
