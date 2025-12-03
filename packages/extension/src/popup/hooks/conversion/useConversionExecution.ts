/**
 * useConversionExecution Hook
 * Handles PDF conversion execution logic
 *
 * Extracted from useConversionHandlers for single responsibility
 */

import { useCallback } from 'react';
import { ErrorCode } from '@/shared/errors/';
import { generateErrorId } from '@/shared/errors/tracking/telemetry';
import { getLogger } from '@/shared/infrastructure/logging';
import { ERROR_MESSAGES, FILE_SIZE_THRESHOLDS } from '../../constants/app';
import { extensionAPI } from '../../services/extensionAPI';
import { useProgressStore } from '../../store/progressStore';
import type { AppState } from '../integration/useAppState';

export interface ConversionExecutionHandlers {
  handleExportClick: () => Promise<void>;
  handleCancelConversion: () => void;
}

interface UseConversionExecutionOptions {
  appState: AppState;
  currentJobId: string;
  wasmInitialized: boolean | null;
}

/**
 * Hook for managing conversion execution and cancellation
 */
export function useConversionExecution({
  appState,
  currentJobId,
  wasmInitialized,
}: UseConversionExecutionOptions): ConversionExecutionHandlers {
  const { importedFile, setValidationError, startConversion, setError, reset } = appState;

  // Handle export button click - start conversion immediately
  const handleExportClick = useCallback(async () => {
    if (!importedFile) {
      setValidationError(ERROR_MESSAGES.noFileImported);
      return;
    }

    // Pre-flight check - WASM availability
    if (!wasmInitialized) {
      setError({
        stage: 'queued',
        code: ErrorCode.CONVERSION_START_FAILED,
        message: ERROR_MESSAGES.wasmNotReady,
        timestamp: Date.now(),
        errorId: generateErrorId(),
        recoverable: true,
        suggestions: [
          'Reload the extension',
          'Restart your browser',
          'Check browser compatibility',
        ],
      });
      return;
    }

    // Pre-flight warning for large files (non-blocking, just log)
    if (importedFile.size > FILE_SIZE_THRESHOLDS.largeFileWarning) {
      getLogger().info('ConversionExecution', 'Converting large file - may take longer', {
        size: importedFile.size,
      });
    }

    // Start conversion in both stores
    startConversion();
    useProgressStore.getState().startConversion(currentJobId);

    try {
      // Start conversion with TSX content from imported file
      getLogger().info('ConversionExecution', 'Sending conversion request to background script', {
        contentLength: importedFile.content.length,
        fileName: importedFile.name,
      });
      await extensionAPI.startConversion(importedFile.content, importedFile.name);
      getLogger().info('ConversionExecution', 'Conversion request sent successfully');
    } catch (err) {
      getLogger().error('ConversionExecution', 'Conversion request failed', err);
      getLogger().error('ConversionExecution', 'Error details', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        type: typeof err,
        stringified: JSON.stringify(err, null, 2),
      });
      setError({
        stage: 'queued',
        code: ErrorCode.CONVERSION_START_FAILED,
        message: ERROR_MESSAGES.conversionStartFailed,
        timestamp: Date.now(),
        errorId: generateErrorId(),
        recoverable: true,
        suggestions: [
          'Try converting again',
          'Make sure your file is from Claude',
          'Check your internet connection',
        ],
        technicalDetails: err instanceof Error ? err.message : String(err),
      });
    }
  }, [importedFile, currentJobId, wasmInitialized, startConversion, setError, setValidationError]);

  // Handle conversion cancellation
  const handleCancelConversion = useCallback(() => {
    // Reset to file validated state
    reset();
    // Clear progress
    useProgressStore.getState().clearConversion(currentJobId);
  }, [reset, currentJobId]);

  return {
    handleExportClick,
    handleCancelConversion,
  };
}
