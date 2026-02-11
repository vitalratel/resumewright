// ABOUTME: Conversion handler factory combining file import, execution, and error recovery.
// ABOUTME: Creates ConversionHandlers for dependency injection via ConversionContext.

import { validateTsxFile } from '@/shared/domain/pdf/validation';
import { ErrorCode } from '@/shared/errors/codes';
import {
  copyToClipboard,
  formatErrorDetailsForClipboard,
  formatErrorTimestamp,
} from '@/shared/errors/tracking/telemetry';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import { ERROR_MESSAGES, FILE_SIZE_THRESHOLDS } from '../constants/app';
import type { ConversionHandlers } from '../context/ConversionContext';
import { requestConversion } from '../services/extensionAPI';
import { popupStore } from '../store';
import { progressStore } from '../store/progressStore';

/**
 * Create conversion handler functions for file validation, export, and error recovery.
 *
 * @param currentJobId - Job ID for tracking conversion progress
 * @returns ConversionHandlers for use via ConversionContext
 */
export function createConversionHandlers(currentJobId: string): ConversionHandlers {
  const handleFileValidated = async (
    content: string,
    fileName: string,
    fileSize: number,
  ): Promise<void> => {
    popupStore.setValidating(true);

    try {
      const result = await validateTsxFile(content, fileSize, fileName, getLogger());

      if (result.valid) {
        popupStore.setImportedFile(fileName, fileSize, content);
        popupStore.setUIState('file_validated');
        popupStore.clearValidationError();
      } else {
        const errorMessage =
          result.error !== null && result.error !== undefined && result.error !== ''
            ? result.error
            : 'Validation failed';
        popupStore.setValidationError(errorMessage);
        getLogger().error('FileImport', 'Validation Error', { errorMessage, fileName, fileSize });
      }
    } catch {
      popupStore.setValidationError(ERROR_MESSAGES.fileReadFailed);
    } finally {
      popupStore.setValidating(false);
    }
  };

  const handleExportClick = async (): Promise<void> => {
    const importedFile = popupStore.state.importedFile;

    if (!importedFile) {
      popupStore.setValidationError(ERROR_MESSAGES.noFileImported);
      return;
    }

    if (importedFile.size > FILE_SIZE_THRESHOLDS.largeFileWarning) {
      getLogger().info('ConversionExecution', 'Converting large file - may take longer', {
        size: importedFile.size,
      });
    }

    popupStore.startConversion();
    progressStore.startConversion(currentJobId);

    try {
      getLogger().info('ConversionExecution', 'Sending conversion request to background script', {
        contentLength: importedFile.content.length,
        fileName: importedFile.name,
      });
      await requestConversion(importedFile.content, importedFile.name);
      getLogger().info('ConversionExecution', 'Conversion request sent successfully');
    } catch (err) {
      getLogger().error('ConversionExecution', 'Conversion request failed', err);
      getLogger().error('ConversionExecution', 'Error details', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        type: typeof err,
        stringified: JSON.stringify(err, null, 2),
      });
      popupStore.setError({
        stage: 'queued',
        code: ErrorCode.CONVERSION_START_FAILED,
        message: ERROR_MESSAGES.conversionStartFailed,
        timestamp: Date.now(),
        recoverable: true,
        suggestions: [
          'Try converting again',
          'Make sure your file is from Claude',
          'Check your internet connection',
        ],
        technicalDetails: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleCancelConversion = (): void => {
    popupStore.resetUI();
    popupStore.clearImportedFile();
    progressStore.clearConversion(currentJobId);
  };

  const handleRetry = (): void => {
    popupStore.resetUI();
    popupStore.clearImportedFile();
  };

  const handleDismissError = (): void => {
    popupStore.resetUI();
    popupStore.clearImportedFile();
  };

  const handleImportDifferent = (): void => {
    popupStore.clearImportedFile();
    popupStore.setUIState('waiting_for_import');
    popupStore.clearValidationError();
  };

  const handleReportIssue = async (): Promise<void> => {
    const lastError = popupStore.state.lastError;
    if (lastError) {
      const details = formatErrorDetailsForClipboard({
        timestamp: formatErrorTimestamp(new Date(lastError.timestamp)),
        code: lastError.code,
        message: lastError.message,
        category: lastError.category,
        technicalDetails: lastError.technicalDetails,
        metadata: lastError.metadata as Record<string, unknown> | undefined,
      });
      await copyToClipboard(details);
    }
  };

  return {
    handleFileValidated,
    handleExportClick,
    handleCancelConversion,
    handleRetry,
    handleDismissError,
    handleImportDifferent,
    handleReportIssue,
  };
}
