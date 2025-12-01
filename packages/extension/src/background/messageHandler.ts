// ABOUTME: Central message routing for background script using @webext-core/messaging.
// ABOUTME: Registers typed message handlers for all popup ↔ background communication.

import type { TsxToPdfConverter } from '../shared/domain/pdf/types';
import type { ConversionStatus } from '../shared/types/models';
import type { LifecycleManager } from './core/lifecycle/lifecycleManager';
import { getLogger } from '@/shared/infrastructure/logging';
import { settingsStore } from '@/shared/infrastructure/settings/SettingsStore';
import { localExtStorage } from '@/shared/infrastructure/storage';
import { createConverterInstance, isWASMInitialized } from '@/shared/infrastructure/wasm';
import { onMessage, sendMessage } from '@/shared/messaging';
import { validateTsxSyntax } from '../shared/domain/pdf/validation';
import { ConversionService } from './services/ConversionService';
import { ProgressTracker } from './services/ProgressTracker';
import { parseConversionError } from './utils/errorParser';
import { getWasmStatus, retryWasmInit } from './wasmInit';

/**
 * Setup message handlers for extension communication
 * Uses @webext-core/messaging for type-safe message passing
 */
export function setupMessageHandler(lifecycleManager: LifecycleManager): void {
  const conversionService = new ConversionService();
  const progressTracker = new ProgressTracker();
  const getConverterInstance: () => TsxToPdfConverter = createConverterInstance;

  // === WASM Status Handlers ===

  onMessage('getWasmStatus', async () => {
    try {
      const status = await localExtStorage.getItem('wasmStatus');
      const initTime = await localExtStorage.getItem('wasmInitTime');
      const error = await localExtStorage.getItem('wasmInitError');

      if (status === null || status === 'failed') {
        return {
          initialized: false,
          error: error ?? 'WASM initialization failed',
        };
      }

      if (status === 'initializing') {
        return { initialized: false };
      }

      if (status === 'success') {
        return {
          initialized: true,
          initTime: initTime ?? undefined,
        };
      }

      return {
        initialized: false,
        error: 'Invalid WASM status in storage',
      };
    } catch (error: unknown) {
      return {
        initialized: false,
        error: error instanceof Error ? error.message : 'Failed to check WASM status',
      };
    }
  });

  onMessage('retryWasmInit', async () => {
    try {
      await retryWasmInit();
      await localExtStorage.removeItem('wasmInitError');
      return { initialized: true };
    } catch (error: unknown) {
      return {
        initialized: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // === TSX Validation ===

  onMessage('validateTsx', async ({ data }) => {
    const isValid = await validateTsxSyntax(data.tsx, getLogger(), getConverterInstance());
    return { valid: isValid };
  });

  // === Conversion ===

  onMessage('startConversion', async ({ data: payload }) => {
    const jobId = crypto.randomUUID();
    const startTime = performance.now();

    // Validate WASM is ready (check both storage state AND in-memory state)
    // Storage might show 'success' from a previous session while the current
    // service worker instance hasn't finished initializing yet
    const wasmStatus = await getWasmStatus();
    const wasmModuleReady = isWASMInitialized();

    if (wasmStatus.status !== 'success' || !wasmModuleReady) {
      let errorMessage: string;
      if (!wasmModuleReady && wasmStatus.status === 'success') {
        // Storage says success but module not ready - race condition on startup
        errorMessage = 'PDF generation engine is still loading. Please wait a moment and try again.';
      } else if (wasmStatus.status === 'initializing') {
        errorMessage = 'PDF generation engine is initializing. Please wait a moment and try again.';
      } else if (wasmStatus.status === 'failed') {
        errorMessage = `PDF generation engine failed to initialize: ${wasmStatus.error ?? 'Unknown error'}. Please try reloading the extension.`;
      } else {
        errorMessage = 'PDF generation engine status unknown. Please try reloading the extension.';
      }
      return { success: false, error: errorMessage };
    }

    try {
      getLogger().info('MessageHandler', `Starting PDF conversion (job: ${jobId})`);

      await lifecycleManager.saveJobCheckpoint(jobId, 'queued');
      progressTracker.startTracking(jobId);

      const onProgress = (stage: string, percentage: number) => {
        void lifecycleManager.saveJobCheckpoint(jobId, stage as ConversionStatus);
        progressTracker.createProgressCallback(jobId)(stage, percentage);
      };

      const onRetry = (attempt: number, delay: number, error: Error) => {
        getLogger().warn('MessageHandler', `Conversion retry attempt ${attempt}/3 after ${delay}ms delay`, { error: error.message });
        progressTracker.sendRetryProgress(jobId, attempt, 3, delay, error);
      };

      const result = await conversionService.convert(payload, onProgress, onRetry);
      const duration = performance.now() - startTime;

      // Send completion broadcast
      void sendMessage('conversionComplete', {
        jobId,
        filename: result.filename,
        fileSize: result.pdfBytes.length,
        duration,
        pdfBytes: result.pdfBytes,
      });

      getLogger().info('MessageHandler', `PDF conversion completed (job: ${jobId})`, {
        duration: duration.toFixed(0),
        filename: result.filename,
        fileSize: result.pdfBytes.length,
      });

      return { success: true };
    } catch (error: unknown) {
      // Log the ORIGINAL error before parsing/sanitization
      getLogger().error('MessageHandler', `[${jobId}] RAW ERROR:`, {
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorString: String(error),
      });

      const conversionError = parseConversionError(error, jobId);

      getLogger().error('MessageHandler', `[${jobId}] ${conversionError.code}: ${conversionError.message}`, {
        stage: conversionError.stage,
        error,
      });

      // Send error broadcast
      void sendMessage('conversionError', {
        jobId,
        error: conversionError,
      });

      return { success: false };
    } finally {
      progressTracker.stopTracking(jobId);
      await lifecycleManager.clearJobCheckpoint(jobId);
    }
  });

  // === Settings ===

  onMessage('getSettings', async () => {
    try {
      const settings = await settingsStore.loadSettings();
      return { success: true, settings };
    } catch (error: unknown) {
      getLogger().error('MessageHandler', 'Failed to load settings', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load settings',
      };
    }
  });

  onMessage('updateSettings', async ({ data: payload }) => {
    try {
      const currentSettings = await settingsStore.loadSettings();
      const updatedSettings = { ...currentSettings, ...payload.settings };
      await settingsStore.saveSettings(updatedSettings);
      return { success: true };
    } catch (error: unknown) {
      getLogger().error('MessageHandler', 'Failed to update settings', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update settings',
      };
    }
  });

  // === Popup Lifecycle ===

  onMessage('popupOpened', async ({ data: payload }) => {
    if (payload.requestProgressUpdate) {
      await progressTracker.synchronizeProgress();
    }
    return { success: true };
  });

  // === Health Check ===

  onMessage('ping', () => {
    return { pong: true };
  });

  getLogger().info('Background', 'Message handlers initialized');
}
