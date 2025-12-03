/**
 * useFileImport Hook
 * Handles file validation and import logic
 *
 * Extracted from useConversionHandlers for single responsibility
 */

import { useCallback } from 'react';
import { validateTsxFile } from '@/shared/domain/pdf/validation';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import { ERROR_MESSAGES } from '../../constants/app';
import type { AppState } from '../integration/useAppState';

export interface FileImportHandlers {
  handleFileValidated: (content: string, fileName: string, fileSize: number) => Promise<void>;
  handleImportDifferent: () => void;
}

interface UseFileImportOptions {
  appState: AppState;
}

/**
 * Hook for managing file import and validation
 */
export function useFileImport({ appState }: UseFileImportOptions): FileImportHandlers {
  const {
    setValidating,
    setValidationError,
    clearValidationError,
    setImportedFile,
    clearImportedFile,
  } = appState;

  // Handle file validated
  const handleFileValidated = useCallback(
    async (content: string, fileName: string, fileSize: number) => {
      setValidating(true);

      try {
        const result = await validateTsxFile(content, fileSize, fileName, getLogger());

        if (result.valid) {
          setImportedFile(fileName, fileSize, content);
          appState.setUIState('file_validated');
          clearValidationError();
        } else {
          const errorMessage =
            result.error !== null && result.error !== undefined && result.error !== ''
              ? result.error
              : 'Validation failed';
          setValidationError(errorMessage);
          // AC10: Logging for validation errors
          getLogger().error('FileImport', 'Validation Error', { errorMessage, fileName, fileSize });
        }
      } catch {
        // P1-A11Y-001: Simplified error message
        setValidationError(ERROR_MESSAGES.fileReadFailed);
      } finally {
        setValidating(false);
      }
    },
    [setValidating, setImportedFile, setValidationError, clearValidationError, appState],
  );

  // Handle import different file from error state
  const handleImportDifferent = useCallback(() => {
    clearImportedFile();
    clearValidationError();
    // UI state is already set to 'waiting_for_import' by clearImportedFile
  }, [clearImportedFile, clearValidationError]);

  return {
    handleFileValidated,
    handleImportDifferent,
  };
}
