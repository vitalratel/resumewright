// ABOUTME: Displays PDF conversion progress with visual feedback and accessibility.
// ABOUTME: Shows stage, percentage, ETA, and provides cancel functionality.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useConversion } from '../../context/ConversionContext';
import { useThrottledAnnouncement } from '../../hooks/ui/useThrottledAnnouncement';
import { useProgressStore } from '../../store/progressStore';
import { tokens } from '../../styles/tokens';
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

  // Memoize cancel handler to prevent ConfirmDialog re-renders
  const handleConfirmCancel = useCallback(() => {
    setShowCancelConfirm(false);
    if (handleCancelConversion) {
      handleCancelConversion();
    }
  }, [handleCancelConversion]);

  const handleCancelDialog = useCallback(() => {
    setShowCancelConfirm(false);
  }, []);

  return (
    <div
      className={`w-full h-full ${tokens.colors.neutral.bgWhite} ${tokens.spacing.cardFullPage} flex flex-col items-center justify-center ${tokens.spacing.sectionGapCompact} ${tokens.animations.fadeIn}`}
    >
      {/* P1-A11Y-005: Throttled announcements for screen readers */}
      {shouldAnnounce && (
        <output aria-live="polite" aria-atomic="true" className="sr-only">
          Converting: {currentProgress.percentage}% complete. {currentProgress.currentOperation}.
        </output>
      )}

      {/* Animated Spinner - 32px blue-500 - aria-label for screen readers */}
      <Spinner size="large" ariaLabel="Converting to PDF" />

      {/* Heading - Full-page typography */}
      <h1
        className={`${tokens.typography.sectionHeading} tracking-tight ${tokens.colors.neutral.text} text-center`}
      >
        Converting to PDF...
      </h1>

      {/* Show filename being converted */}
      {appState.lastFilename !== null &&
        appState.lastFilename !== undefined &&
        appState.lastFilename !== '' && (
          <p
            className={`${tokens.typography.base} ${tokens.colors.neutral.textMuted} font-mono ${tokens.colors.neutral.bg} ${tokens.spacing.alert} ${tokens.borders.rounded} ${tokens.colors.neutral.border} ${tokens.borders.default} max-w-full truncate`
              .trim()
              .replace(/\s+/g, ' ')}
          >
            {appState.lastFilename}
          </p>
        )}

      {/* Progress Bar */}
      <div className="w-full">
        <ProgressBar percentage={currentProgress.percentage} animated />
      </div>

      {/* Progress Status */}
      <ProgressStatus
        stage={currentProgress.stage}
        currentOperation={currentProgress.currentOperation}
        eta={currentProgress.estimatedTimeRemaining}
        pagesProcessed={currentProgress.pagesProcessed}
        totalPages={currentProgress.totalPages}
      />

      {/* Cancel Button - Touch target, Show confirmation */}
      {/* Double-click protection to prevent accidental cancellation */}
      {handleCancelConversion && (
        <button
          type="button"
          onClick={() => {
            if (cancelClickCount === 0) {
              // First click - start timer with AbortController
              setCancelClickCount(1);

              // AbortController pattern for async timer
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
              // Second click within 2s - show confirmation
              if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
              }
              setCancelClickCount(0);
              setShowCancelConfirm(true);
            }
          }}
          className={`${tokens.typography.small} ${cancelClickCount > 0 ? tokens.colors.warning.text : tokens.colors.neutral.textMuted} ${tokens.colors.link.hover} ${tokens.colors.link.hoverUnderline} ${tokens.spacing.marginSmall} ${tokens.effects.focusRingLight} ${tokens.buttons.default.secondary} ${tokens.transitions.default}`
            .trim()
            .replace(/\s+/g, ' ')}
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
