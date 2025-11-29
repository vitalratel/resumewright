/**
 * Conversion Message Handler
 *
 * Handles PDF conversion requests and popup state synchronization.
 * Orchestrates the complete conversion workflow by delegating to services:
 * - WASM readiness validation
 * - Progress tracking (ProgressTracker service)
 * - PDF conversion (ConversionService)
 * - Checkpoint management for crash recovery
 * - Message passing to popup UI
 *
 * @module ConversionHandler
 */

import type { RetryCallback } from '../../shared/domain/retry/IRetryPolicy';
import type {
  ConversionCompletePayload,
  ConversionErrorPayload,
  ConversionRequestMessage,
  ConversionRequestPayload,
  PopupOpenedMessage,
  PopupOpenedPayload,
} from '../../shared/types/messages';
import type { ConversionError, ConversionStatus } from '../../shared/types/models';
import type { LifecycleManager } from '../core/lifecycle/lifecycleManager';
import type { ConversionService } from '../services/ConversionService';
import type { ProgressTracker } from '../services/ProgressTracker';
import type { MessageHandler } from './types';
import browser from 'webextension-polyfill';
import { getLogger } from '@/shared/infrastructure/logging';
import { MessageType } from '../../shared/types/messages';
import { parseConversionError } from '../utils/errorParser';
import { getWasmStatus } from '../wasmInit';

/**
 * Maximum conversion retry attempts
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Handles conversion-related messages for PDF generation workflow
 *
 * Responsibilities:
 * - Routes CONVERSION_REQUEST and POPUP_OPENED messages
 * - Validates WASM readiness before conversion
 * - Delegates to ConversionService for business logic
 * - Delegates to ProgressTracker for UI updates
 * - Manages checkpoint lifecycle for crash recovery
 * - Handles message passing to popup UI
 *
 * Thread Safety: Service workers are single-threaded, but conversions
 * can overlap. Each job is tracked independently by jobId.
 *
 * @example
 * ```ts
 * const conversionService = new ConversionService();
 * const progressTracker = new ProgressTracker();
 * const handler = new ConversionHandler(lifecycleManager, conversionService, progressTracker);
 * const result = await handler.handle(conversionRequestMessage, sender);
 * if (result.success) {
 *   console.log('Conversion completed');
 * }
 * ```
 */
export class ConversionHandler
  implements MessageHandler<MessageType.CONVERSION_REQUEST | MessageType.POPUP_OPENED>
{
  readonly type = [MessageType.CONVERSION_REQUEST, MessageType.POPUP_OPENED] as const;

  /**
   * Creates a new ConversionHandler instance
   *
   * @param lifecycleManager - Manages service worker lifecycle and job checkpoints for crash recovery
   * @param conversionService - Handles PDF conversion business logic
   * @param progressTracker - Manages progress tracking and UI updates
   */
  constructor(
    private readonly lifecycleManager: LifecycleManager,
    private readonly conversionService: ConversionService,
    private readonly progressTracker: ProgressTracker
  ) {}

  /**
   * Routes incoming messages to appropriate handlers
   *
   * @param message - Conversion request or popup opened message
   * @param _sender - Message sender information (unused but required by MessageHandler interface)
   * @returns Promise resolving to handler-specific response
   */
  async handle(
    message: ConversionRequestMessage | PopupOpenedMessage,
    _sender: browser.Runtime.MessageSender
  ): Promise<unknown> {
    switch (message.type) {
      case MessageType.CONVERSION_REQUEST:
        return this.handleConversionRequest(message.payload);

      case MessageType.POPUP_OPENED:
        return this.handlePopupOpened(message.payload);
    }
  }

  /**
   * Handles PDF conversion requests
   *
   * Orchestrates the complete conversion workflow:
   * 1. Validates WASM module is ready
   * 2. Extracts CV metadata from TSX content
   * 3. Loads and validates conversion configuration
   * 4. Executes conversion with progress tracking and retry logic
   * 5. Generates sanitized filename from metadata
   * 6. Sends PDF bytes to popup for download
   *
   * Progress is reported via CONVERSION_PROGRESS messages.
   * Errors are sent via CONVERSION_ERROR messages.
   *
   * @param payload - Conversion request containing TSX content and optional config
   * @returns Promise resolving to success status and optional error message
   * @throws Never - All errors are caught and returned in response object
   */
  private async handleConversionRequest(
    payload: ConversionRequestPayload
  ): Promise<{ success: boolean; error?: string }> {
    const jobId = crypto.randomUUID();
    const startTime = performance.now();

    // Validate WASM module is initialized before starting conversion
    // Prevents "Module not initialized" errors when service worker restarts between init and conversion
    const wasmError = await this.validateWasmReady();
    if (wasmError !== undefined) {
      return { success: false, error: wasmError };
    }

    // Ensure cleanup happens on all code paths (success, error, or exception)
    try {
      getLogger().info('ConversionHandler', `Starting PDF conversion (job: ${jobId})`);

      // Save checkpoint for crash recovery - enables resuming after service worker restart
      await this.lifecycleManager.saveJobCheckpoint(jobId, 'queued');

      // Start progress tracking and send CONVERSION_STARTED message
      await this.progressTracker.startTracking(jobId);

      // Create progress callback that saves checkpoints and sends UI updates
      const onProgress = this.createProgressCallback(jobId);

      // Create retry callback that sends retry progress to UI
      const onRetry = this.createRetryCallback(jobId);

      // Execute complete conversion workflow (delegates to ConversionService)
      const result = await this.conversionService.convert(payload, onProgress, onRetry);

      // Calculate total conversion duration for metrics
      const duration = performance.now() - startTime;

      // Send PDF bytes to popup for download (service workers can't access DOM APIs)
      await this.sendConversionComplete(jobId, result.pdfBytes, result.filename, duration);

      getLogger().info(
        'ConversionHandler',
        `PDF conversion completed successfully (job: ${jobId})`,
        {
          duration: duration.toFixed(0),
          filename: result.filename,
          fileSize: result.pdfBytes.length,
        }
      );

      return { success: true };
    } catch (error: unknown) {
      // Parse and enrich error with context for user-friendly display
      const conversionError = parseConversionError(error, jobId);

      // Log full error details with structured format for debugging
      getLogger().error(
        'ConversionHandler',
        `[${jobId}] [${conversionError.category}] ${conversionError.code}: ${conversionError.message}`,
        {
          stage: conversionError.stage,
          technicalDetails: conversionError.technicalDetails,
          metadata: conversionError.metadata,
          timestamp: new Date().toISOString(),
          error,
        }
      );

      // Send error message to popup for user-friendly display
      await this.sendConversionError(jobId, conversionError);

      return { success: false };
    } finally {
      // Stop progress tracking to prevent memory leaks
      this.progressTracker.stopTracking(jobId);

      // Clear checkpoint after completion or error to avoid stale data
      await this.lifecycleManager.clearJobCheckpoint(jobId);
    }
  }

  /**
   * Handles popup opened events
   * Synchronizes current conversion progress to newly opened popup
   *
   * @param payload - Popup opened payload with progress update flag
   * @returns Promise resolving to success status
   */
  private async handlePopupOpened(payload: PopupOpenedPayload): Promise<{ success: boolean }> {
    if (payload.requestProgressUpdate) {
      // Synchronize current progress for all active conversions
      // Allows popup to display progress for conversions started before it opened
      await this.progressTracker.synchronizeProgress();
    }
    return { success: true };
  }

  /**
   * Creates a progress callback that saves checkpoints and sends UI updates
   *
   * Combines checkpoint management (fire-and-forget) with throttled progress updates.
   *
   * @param jobId - Unique conversion job identifier
   * @returns Progress callback function for conversion pipeline
   */
  private createProgressCallback(jobId: string): (stage: string, percentage: number) => void {
    const throttledProgressSend = this.progressTracker.createProgressCallback(jobId);

    return (stage: string, percentage: number) => {
      // Save checkpoint for crash recovery (fire-and-forget - don't block progress reporting)
      void this.lifecycleManager.saveJobCheckpoint(jobId, stage as ConversionStatus);

      // Send throttled progress update to UI
      throttledProgressSend(stage, percentage);
    };
  }

  /**
   * Creates a retry callback that logs and sends retry progress
   *
   * @param jobId - Unique conversion job identifier
   * @returns Retry callback function for retry policy
   */
  private createRetryCallback(jobId: string): RetryCallback {
    return (attempt: number, delay: number, error: Error) => {
      getLogger().warn(
        'ConversionHandler',
        `Conversion retry attempt ${attempt}/${MAX_RETRY_ATTEMPTS} after ${delay}ms delay`,
        { error: error.message }
      );

      // Send retry progress update to UI
      this.progressTracker.sendRetryProgress(jobId, attempt, MAX_RETRY_ATTEMPTS, delay, error);
    };
  }

  /**
   * Validates that WASM module is ready for conversion
   *
   * @returns Error message if WASM is not ready, undefined otherwise
   */
  private async validateWasmReady(): Promise<string | undefined> {
    const wasmStatus = await getWasmStatus();
    if (wasmStatus.status !== 'success') {
      getLogger().error(
        'ConversionHandler',
        `Cannot convert: WASM not ready (status: ${wasmStatus.status})`
      );

      if (wasmStatus.status === 'initializing') {
        return 'PDF generation engine is initializing. Please wait a moment and try again.';
      } else if (wasmStatus.status === 'failed') {
        return `PDF generation engine failed to initialize: ${wasmStatus.error ?? 'Unknown error'}. Please try reloading the extension.`;
      } else {
        return 'PDF generation engine status unknown. Please try reloading the extension.';
      }
    }
    return undefined;
  }

  /**
   * Sends conversion completion message with PDF bytes to popup
   *
   * Service workers can't download files (no DOM APIs), so we send
   * PDF bytes to popup which has access to URL.createObjectURL() and download APIs.
   *
   * Uint8Array is supported by structured clone algorithm in Chrome/Firefox.
   *
   * @param jobId - Unique conversion job identifier
   * @param pdfBytes - Generated PDF as byte array
   * @param filename - Optional sanitized filename
   * @param duration - Conversion duration in milliseconds
   * @throws Error if message send fails
   */
  private async sendConversionComplete(
    jobId: string,
    pdfBytes: Uint8Array,
    filename: string | undefined,
    duration: number
  ): Promise<void> {
    getLogger().info('ConversionHandler', `PDF generated successfully (job: ${jobId})`, {
      filename,
      fileSize: pdfBytes.length,
      hasFilename: filename !== null && filename !== undefined && filename !== '',
    });

    const completePayload: ConversionCompletePayload = {
      jobId,
      filename,
      fileSize: pdfBytes.length,
      duration,
      pdfBytes, // Popup will handle download (has DOM APIs)
    };

    getLogger().info('ConversionHandler', `Sending CONVERSION_COMPLETE message (job: ${jobId})`, {
      payloadKeys: Object.keys(completePayload),
      hasPdfBytes: completePayload.pdfBytes !== null && completePayload.pdfBytes !== undefined,
      pdfBytesLength: completePayload.pdfBytes.length,
    });

    try {
      await browser.runtime.sendMessage({
        type: MessageType.CONVERSION_COMPLETE,
        payload: completePayload,
      });
      getLogger().info(
        'ConversionHandler',
        `CONVERSION_COMPLETE message sent successfully (job: ${jobId})`
      );
    } catch (sendError) {
      getLogger().error(
        'ConversionHandler',
        `Failed to send CONVERSION_COMPLETE message (job: ${jobId})`,
        sendError
      );
      throw sendError;
    }
  }

  /**
   * Sends conversion error message to popup
   *
   * @param jobId - Unique conversion job identifier
   * @param error - Parsed and enriched conversion error
   */
  private async sendConversionError(jobId: string, error: ConversionError): Promise<void> {
    const errorPayload: ConversionErrorPayload = {
      jobId,
      error,
    };
    await browser.runtime.sendMessage({
      type: MessageType.CONVERSION_ERROR,
      payload: errorPayload,
    });
  }
}
