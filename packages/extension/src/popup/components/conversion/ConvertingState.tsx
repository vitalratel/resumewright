// ABOUTME: Displays PDF conversion progress with visual feedback and accessibility.
// ABOUTME: Shows stage, percentage, ETA, and provides cancel functionality.

import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useConversion } from '../../context/ConversionContext';
import { useEvent } from '../../hooks/core/useEvent';
import { useThrottledAnnouncement } from '../../hooks/ui/useThrottledAnnouncement';
import { useProgressStore } from '../../store/progressStore';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Spinner } from '../common/Spinner';
import { ErrorBoundary } from '../ErrorBoundary';
import { ProgressBar } from './ProgressBar';
import { ProgressStatus } from './ProgressStatus';

export const ConvertingState = React.memo(() => {
  const { currentJobId, appState } = useAppContext();
  const { handleCancelConversion } = useConversion();
  const jobId = currentJobId;

  // Progress store uses value equality checks to prevent re-renders on duplicate updates
  const progress = useProgressStore((state) => state.getProgress(jobId));

  // Cancel confirmation state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Track cancel clicks to prevent accidental cancellation
  const [cancelClickCount, setCancelClickCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup timer using AbortController pattern on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Default progress if not found
  const currentProgress = progress || {
    stage: 'queued' as const,
    percentage: 0,
    currentOperation: 'Starting conversion...',
    estimatedTimeRemaining: undefined,
    pagesProcessed: undefined,
    totalPages: undefined,
  };

  // P1-A11Y-005 & Throttle screen reader announcements using extracted hook
  // Only announce every 10% progress or every 5 seconds (whichever is longer)
  const shouldAnnounce = useThrottledAnnouncement(currentProgress.percentage, 10, 5000);

  const handleConfirmCancel = useEvent(() => {
    setShowCancelConfirm(false);
    if (handleCancelConversion) {
      handleCancelConversion();
    }
  });

  const handleCancelDialog = useEvent(() => {
    setShowCancelConfirm(false);
  });

  return (
    <div className="w-full h-full bg-elevated px-6 py-8 md:px-8 md:py-10 flex flex-col items-center justify-center space-y-4 animate-fade-in">
      {shouldAnnounce && (
        <output aria-live="polite" aria-atomic="true" className="sr-only">
          Converting: {currentProgress.percentage}% complete. {currentProgress.currentOperation}.
        </output>
      )}

      <Spinner size="large" ariaLabel="Converting to PDF" />

      <h1 className="text-xl font-semibold tracking-tight text-foreground text-center">
        Converting to PDF...
      </h1>

      {appState.lastFilename !== null &&
        appState.lastFilename !== undefined &&
        appState.lastFilename !== '' && (
          <p className="text-base text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md border border-border max-w-full truncate">
            {appState.lastFilename}
          </p>
        )}

      <div className="w-full">
        <ProgressBar percentage={currentProgress.percentage} animated />
      </div>

      <ProgressStatus
        stage={currentProgress.stage}
        currentOperation={currentProgress.currentOperation}
        eta={currentProgress.estimatedTimeRemaining}
        pagesProcessed={currentProgress.pagesProcessed}
        totalPages={currentProgress.totalPages}
      />

      {handleCancelConversion && (
        <button
          type="button"
          onClick={() => {
            if (cancelClickCount === 0) {
              setCancelClickCount(1);

              const controller = new AbortController();
              abortControllerRef.current = controller;

              const timeoutPromise = new Promise<void>((resolve) => {
                const timeoutId = setTimeout(resolve, 2000);
                controller.signal.addEventListener('abort', () => {
                  clearTimeout(timeoutId);
                });
              });

              void timeoutPromise.then(() => {
                if (!controller.signal.aborted) {
                  setCancelClickCount(0);
                  abortControllerRef.current = null;
                }
              });
            } else {
              if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
              }
              setCancelClickCount(0);
              setShowCancelConfirm(true);
            }
          }}
          className={`text-sm ${cancelClickCount > 0 ? 'text-warning-foreground' : 'text-muted-foreground'} hover:text-link hover:underline mt-2 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300`}
          aria-label={
            cancelClickCount > 0 ? 'Click again to confirm cancellation' : 'Cancel conversion'
          }
        >
          {cancelClickCount > 0 ? 'Click again to cancel' : 'Cancel'}
        </button>
      )}

      {/* Cancel confirmation dialog */}
      {handleCancelConversion && (
        <ErrorBoundary>
          <ConfirmDialog
            isOpen={showCancelConfirm}
            title="Cancel Conversion?"
            message="Are you sure you want to cancel the PDF conversion? This cannot be undone."
            confirmText="Cancel Conversion"
            cancelText="Continue Converting"
            confirmVariant="danger"
            onConfirm={handleConfirmCancel}
            onCancel={handleCancelDialog}
          />
        </ErrorBoundary>
      )}
    </div>
  );
});
