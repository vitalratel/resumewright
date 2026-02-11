// ABOUTME: Message subscription management for popup-to-background communication.
// ABOUTME: Subscribes to progress, success, and error events with automatic cleanup.

import { onCleanup } from 'solid-js';
import { ErrorCode } from '@/shared/errors/codes';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import { downloadPDF } from '@/shared/infrastructure/pdf/downloader';
import { onError, onProgress, onSuccess } from '../services/extensionAPI';
import { popupStore } from '../store';
import { progressStore } from '../store/progressStore';

/**
 * Subscribe to extensionAPI messages for conversion progress, success, and errors.
 * Must be called within a reactive owner (component or createRoot) for cleanup.
 */
export function createAppSubscriptions(): void {
  getLogger().debug('AppSubscriptions', 'CREATING message subscriptions');

  const unsubProgress = onProgress((progressPayload) => {
    progressStore.updateProgress(progressPayload.jobId, progressPayload.progress);
  });

  const unsubSuccess = onSuccess((result) => {
    void (async () => {
      getLogger().debug('AppSubscriptions', 'Received CONVERSION_COMPLETE', {
        hasFilename:
          result.filename !== null && result.filename !== undefined && result.filename !== '',
        filename: result.filename,
        fileSize: result.fileSize,
        hasPdfBytes: result.pdfBytes !== null && result.pdfBytes !== undefined,
        pdfBytesLength: result.pdfBytes != null ? result.pdfBytes.length : 0,
      });

      if (result.pdfBytes !== null && result.pdfBytes !== undefined) {
        getLogger().debug('AppSubscriptions', 'Starting PDF download...');
        try {
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
          popupStore.setSuccess(result.filename);
        } catch (error) {
          getLogger().error('AppSubscriptions', 'Failed to download PDF', error);
          popupStore.setError({
            stage: 'generating-pdf',
            code: ErrorCode.DOWNLOAD_FAILED,
            message: 'Failed to download PDF file',
            technicalDetails: error instanceof Error ? error.message : String(error),
            recoverable: true,
            suggestions: ['Try exporting the file again', 'Check browser download permissions'],
            timestamp: Date.now(),
          });
        }
      } else {
        getLogger().warn('AppSubscriptions', 'No PDF bytes received in success payload!');
        popupStore.setSuccess(result.filename);
      }
    })();
  });

  const unsubError = onError((errorPayload) => {
    popupStore.setError(errorPayload.error);
  });

  onCleanup(() => {
    getLogger().debug('AppSubscriptions', 'CLEANING UP message subscriptions');
    unsubProgress();
    unsubSuccess();
    unsubError();
  });
}
