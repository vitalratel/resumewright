// ABOUTME: Displays PDF conversion progress with visual feedback and accessibility.
// ABOUTME: Shows stage, percentage, ETA, and provides cancel functionality.

import { createSignal, onCleanup, Show } from 'solid-js';
import { useAppContext } from '../../context/AppContext';
import { useConversion } from '../../context/ConversionContext';
import { createThrottledAnnouncement } from '../../reactivity/throttledAnnouncement';
import { popupStore } from '../../store';
import { progressStore } from '../../store/progressStore';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Spinner } from '../common/Spinner';
import { ErrorBoundary } from '../ErrorBoundary';
import { ProgressBar } from './ProgressBar';
import { ProgressStatus } from './ProgressStatus';

const DEFAULT_PROGRESS = {
  stage: 'queued' as const,
  percentage: 0,
  currentOperation: 'Starting conversion...',
  estimatedTimeRemaining: undefined,
  pagesProcessed: undefined,
  totalPages: undefined,
};

export function ConvertingState() {
  const { currentJobId } = useAppContext();
  const { handleCancelConversion } = useConversion();

  // Progress store — reactive via Solid store proxy
  const currentProgress = () => progressStore.getProgress(currentJobId) ?? DEFAULT_PROGRESS;

  // Cancel confirmation state
  const [showCancelConfirm, setShowCancelConfirm] = createSignal(false);

  // Track cancel clicks to prevent accidental cancellation
  const [cancelClickCount, setCancelClickCount] = createSignal(0);
  let abortControllerRef: AbortController | null = null;

  // Cleanup timer using AbortController pattern on unmount
  onCleanup(() => {
    if (abortControllerRef) {
      abortControllerRef.abort();
    }
  });

  // P1-A11Y-005 & Throttle screen reader announcements using extracted hook
  // Only announce every 10% progress or every 5 seconds (whichever is longer)
  const shouldAnnounce = createThrottledAnnouncement(
    () => currentProgress().percentage,
    () => 10,
    () => 5000,
  );

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    if (handleCancelConversion) {
      handleCancelConversion();
    }
  };

  const handleCancelDialog = () => {
    setShowCancelConfirm(false);
  };

  return (
    <div class="w-full h-full bg-elevated px-6 py-8 md:px-8 md:py-10 flex flex-col items-center justify-center space-y-4 animate-fade-in">
      <Show when={shouldAnnounce()}>
        <output aria-live="polite" aria-atomic="true" class="sr-only">
          Converting: {currentProgress().percentage}% complete. {currentProgress().currentOperation}
          .
        </output>
      </Show>

      <Spinner size="large" ariaLabel="Converting to PDF" />

      <h1 class="text-xl font-semibold tracking-tight text-foreground text-center">
        Converting to PDF...
      </h1>

      <Show when={popupStore.state.lastFilename}>
        <p class="text-base text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md border border-border max-w-full truncate">
          {popupStore.state.lastFilename}
        </p>
      </Show>

      <div class="w-full">
        <ProgressBar percentage={currentProgress().percentage} animated />
      </div>

      <ProgressStatus
        stage={currentProgress().stage}
        currentOperation={currentProgress().currentOperation}
        eta={currentProgress().estimatedTimeRemaining}
        pagesProcessed={currentProgress().pagesProcessed}
        totalPages={currentProgress().totalPages}
      />

      <Show when={handleCancelConversion}>
        <button
          type="button"
          onClick={() => {
            if (cancelClickCount() === 0) {
              setCancelClickCount(1);

              const controller = new AbortController();
              abortControllerRef = controller;

              const timeoutPromise = new Promise<void>((resolve) => {
                const timeoutId = setTimeout(resolve, 2000);
                controller.signal.addEventListener('abort', () => {
                  clearTimeout(timeoutId);
                });
              });

              void timeoutPromise.then(() => {
                if (!controller.signal.aborted) {
                  setCancelClickCount(0);
                  abortControllerRef = null;
                }
              });
            } else {
              if (abortControllerRef) {
                abortControllerRef.abort();
                abortControllerRef = null;
              }
              setCancelClickCount(0);
              setShowCancelConfirm(true);
            }
          }}
          class={`text-sm ${cancelClickCount() > 0 ? 'text-warning-foreground' : 'text-muted-foreground'} hover:text-link hover:underline mt-2 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300`}
          aria-label={
            cancelClickCount() > 0 ? 'Click again to confirm cancellation' : 'Cancel conversion'
          }
        >
          {cancelClickCount() > 0 ? 'Click again to cancel' : 'Cancel'}
        </button>
      </Show>

      {/* Cancel confirmation dialog */}
      <Show when={handleCancelConversion}>
        <ErrorBoundary>
          <ConfirmDialog
            isOpen={showCancelConfirm()}
            title="Cancel Conversion?"
            message="Are you sure you want to cancel the PDF conversion? This cannot be undone."
            confirmText="Cancel Conversion"
            cancelText="Continue Converting"
            confirmVariant="danger"
            onConfirm={handleConfirmCancel}
            onCancel={handleCancelDialog}
          />
        </ErrorBoundary>
      </Show>
    </div>
  );
}
