/**
 * useAppSubscriptions Hook
 * Extracted from App.tsx to follow Single Responsibility Principle
 *
 * Manages all extensionAPI message subscriptions for the popup:
 * - onProgress: Updates conversion progress in progressStore
 * - onSuccess: Triggers PDF download and updates UI state to success
 * - onError: Updates UI state with error details
 *
 * This hook is purely side-effect based - it subscribes to messages and updates
 * stores directly without returning any values. All state updates go through
 * Zustand stores (useProgressStore, useUIStore).
 *
 * Performance:
 * - Uses stable store action references via getState()
 * - Empty dependency array prevents subscription recreation
 * - Proper cleanup on unmount
 *
 * @see {@link useProgressStore} for progress state management
 * @see {@link useUIStore} for UI state management
 * @see {@link extensionAPI} for message passing interface
 */

import { useEffect } from 'react';
import { getLogger } from '@/shared/infrastructure/logging';
import { downloadPDF } from '../../../shared/infrastructure/pdf/downloader';
import { ErrorCode } from '../../../shared/types/errors/codes';
import { extensionAPI } from '../../services/extensionAPI';
import { useUIStore } from '../../store';
import { useProgressStore } from '../../store/progressStore';

/**
 * Hook to manage extensionAPI message subscriptions
 *
 * Sets up subscriptions to:
 * - Progress updates during PDF conversion
 * - Success events with PDF download handling
 * - Error events with user-friendly error display
 *
 * @example
 * ```tsx
 * function App() {
 *   // Initialize message subscriptions
 *   useAppSubscriptions();
 *
 *   // Rest of app logic...
 * }
 * ```
 */
export function useAppSubscriptions(): void {
  useEffect(() => {
    getLogger().debug('AppSubscriptions', 'CREATING message subscriptions');

    // Get store actions directly - these are stable references
    const { updateProgress } = useProgressStore.getState();
    const { setSuccess, setError } = useUIStore.getState();

    // Subscribe to progress updates
    const unsubProgress = extensionAPI.onProgress((progressPayload) => {
      // Update progress store with the received progress data
      updateProgress(progressPayload.jobId, progressPayload.progress);
    });

    // Subscribe to conversion success
    const unsubSuccess = extensionAPI.onSuccess((result) => {
      void (async () => {
        // Logging
        getLogger().debug('AppSubscriptions', 'Received CONVERSION_COMPLETE', {
          hasFilename:
            result.filename !== null && result.filename !== undefined && result.filename !== '',
          filename: result.filename,
          fileSize: result.fileSize,
          hasPdfBytes: result.pdfBytes !== null && result.pdfBytes !== undefined,
          pdfBytesLength: result.pdfBytes != null ? result.pdfBytes.length : 0,
        });

        // Filename is optional - may be undefined if generation fails
        // Success component has fallback to 'Resume.pdf', so always transition to success state

        // Trigger download in popup context (has access to DOM APIs like blob URLs)
        if (result.pdfBytes !== null && result.pdfBytes !== undefined) {
          getLogger().debug('AppSubscriptions', 'Starting PDF download...');
          try {
            // Convert back to Uint8Array if needed (message passing may convert it)
            const pdfBytes =
              result.pdfBytes instanceof Uint8Array
                ? result.pdfBytes
                : new Uint8Array(Object.values(result.pdfBytes));

            getLogger().debug('AppSubscriptions', 'PDF bytes prepared', {
              isUint8Array: pdfBytes instanceof Uint8Array,
              length: pdfBytes.length,
            });

            await downloadPDF(pdfBytes, result.filename);

            getLogger().debug('AppSubscriptions', 'PDF download started successfully');
            // Only set success state after download starts successfully
            setSuccess(result.filename);
          } catch (error) {
            getLogger().error('AppSubscriptions', 'Failed to download PDF', error);
            // Set error state if download fails
            setError({
              stage: 'generating-pdf',
              code: ErrorCode.DOWNLOAD_FAILED,
              message: 'Failed to download PDF file',
              technicalDetails: error instanceof Error ? error.message : String(error),
              recoverable: true,
              suggestions: ['Try exporting the file again', 'Check browser download permissions'],
              timestamp: Date.now(),
              errorId: `ERR-${Date.now()}`,
            });
          }
        } else {
          getLogger().warn('AppSubscriptions', 'No PDF bytes received in success payload!');
          // Still set success state even without PDF bytes (for backwards compat)
          setSuccess(result.filename);
        }
      })();
    });

    // Subscribe to conversion errors
    const unsubError = extensionAPI.onError((errorPayload) => {
      setError(errorPayload.error);
    });

    // Cleanup subscriptions on unmount
    return () => {
      getLogger().debug('AppSubscriptions', 'CLEANING UP message subscriptions');
      unsubProgress();
      unsubSuccess();
      unsubError();
    };
  }, []); // Empty deps - store actions are stable, subscriptions never recreate
}
