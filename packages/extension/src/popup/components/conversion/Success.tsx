/**
 * Success Component (Container)
 *
 * Container component that manages business logic for the success state after PDF conversion.
 * Handles browser download interactions, error recovery, and delegates presentation to SuccessView.
 *
 * @remarks
 * This component uses React 19's native ref handling (no forwardRef needed).
 * Refs are passed as regular props for focus management in the success state.
 *
 * Architecture:
 * - Container/Presentational pattern: This component handles logic, {@link SuccessView} handles UI
 * - Error handling: Catches download API failures and shows retry UI
 * - Hook composition: Uses {@link useBrowserDownloads} and {@link useCountdown}
 *
 * Features:
 * - Browser download API integration (open file, show in folder)
 * - Error recovery with retry buttons for failed download actions
 * - Auto-close countdown with pause/resume (WCAG 2.2.1 compliant)
 * - Graceful degradation when browser APIs unavailable
 *
 * @example
 * ```tsx
 * <Success
 *   filename="John_Doe_Resume.pdf"
 *   fileSize="324 KB"
 *   autoCloseSeconds={20}  // Increased from 10s for WCAG 2.2.1 compliance
 *   onExportAnother={() => resetToFileImport()}
 * />
 * ```
 *
 * @example Error state
 * ```tsx
 * // Component automatically shows error UI if download fails
 * // User can retry or choose alternative actions
 * <Success
 *   filename="Resume.pdf"
 *   onExportAnother={handleReset}
 * />
 * ```
 *
 * @see {@link SuccessView} - Presentational component
 * @see {@link ConvertingState} - Previous state in conversion flow
 * @see {@link useBrowserDownloads} - Browser download API hook
 * @see {@link useCountdown} - Auto-close countdown hook
 */

import React, { useCallback, useState } from 'react';
import { useBrowserDownloads, useCountdown } from '../../hooks';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';
import { SuccessView } from './SuccessView';

/**
 * Props for the Success component
 *
 * @property ref - Optional ref to the root element (React 19 native ref handling)
 * @property filename - Name of the generated PDF file (always provided by conversionHandler)
 * @property fileSize - Human-readable file size (defaults to "324 KB")
 * @property autoCloseSeconds - Optional auto-close countdown duration in seconds (WCAG 2.2.1: minimum 20s recommended)
 * @property onExportAnother - Callback to reset and start a new conversion
 */
interface SuccessProps {
  ref?: React.Ref<HTMLDivElement>;
  filename: string;
  fileSize?: string;
  autoCloseSeconds?: number;
  onExportAnother: () => void;
}

export const Success = React.memo(({ ref, filename, fileSize = '324 KB', autoCloseSeconds, onExportAnother }: SuccessProps) => {
  // Add error state for download API failures
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Use custom hooks for downloads and countdown
  // Get API availability status
  const { isAvailable, apiAvailable, openDownload, showInFolder } = useBrowserDownloads(filename);
  // Destructure pause/resume functionality
  const { countdown, isPaused, pause, resume } = useCountdown(autoCloseSeconds);

  // Wrap download actions with error handling
  const handleOpenDownload = useCallback(() => {
    try {
      setDownloadError(null);
      openDownload();
    }
    catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Failed to open download');
    }
  }, [openDownload]);

  const handleShowInFolder = useCallback(() => {
    try {
      setDownloadError(null);
      showInFolder();
    }
    catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Failed to show download folder');
    }
  }, [showInFolder]);

  // Improve download error recovery with retry button
  if (downloadError !== null && downloadError !== undefined && downloadError !== '') {
    // Determine which action failed based on error message
    const isOpenDownloadError = downloadError.includes('open download');
    const isShowFolderError = downloadError.includes('show download folder');

    return (
      <div ref={ref} className="flex flex-col items-center justify-center p-6">
        <Alert variant="error" dismissible onDismiss={() => setDownloadError(null)}>
          <p className="mb-3">{downloadError}</p>
          <div className="flex gap-2">
            {/* Retry the failed action */}
            {isOpenDownloadError && (
              <Button
                onClick={handleOpenDownload}
                variant="primary"
                aria-label="Retry opening download"
              >
                Retry Open
              </Button>
            )}
            {isShowFolderError && (
              <Button
                onClick={handleShowInFolder}
                variant="primary"
                aria-label="Retry showing download folder"
              >
                Retry Show Folder
              </Button>
            )}
            {/* Fallback: try the other action if one failed */}
            {!apiAvailable && (
              <Button
                onClick={onExportAnother}
                variant="secondary"
                aria-label="Export another CV"
              >
                Export Another
              </Button>
            )}
            {apiAvailable && (
              <>
                {isOpenDownloadError && (
                  <Button
                    onClick={handleShowInFolder}
                    variant="secondary"
                    aria-label="Try showing folder instead"
                  >
                    Show in Folder
                  </Button>
                )}
                {isShowFolderError && (
                  <Button
                    onClick={handleOpenDownload}
                    variant="secondary"
                    aria-label="Try opening file instead"
                  >
                    Open File
                  </Button>
                )}
              </>
            )}
          </div>
        </Alert>
      </div>
    );
  }

  // Delegate presentation to SuccessView
  return (
    <SuccessView
      ref={ref}
      displayFilename={filename}
      fileSize={fileSize}
      apiAvailable={apiAvailable}
      isAvailable={isAvailable}
      countdown={countdown}
      isPaused={isPaused}
      onPause={pause}
      onResume={resume}
      onOpenDownload={handleOpenDownload}
      onShowInFolder={handleShowInFolder}
      onExportAnother={onExportAnother}
    />
  );
});
