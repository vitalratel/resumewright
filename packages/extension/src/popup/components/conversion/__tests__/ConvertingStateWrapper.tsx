/**
 * Test wrapper for ConvertingState
 * Provides context providers for testing
 */

import React from 'react';
import { AppProvider, ConversionProvider, QuickSettingsProvider } from '../../../context';
import type { ConversionHandlers } from '../../../hooks/conversion/useConversionHandlers';
import type { AppState } from '../../../hooks/integration/useAppState';
import { ConvertingState } from '../ConvertingState';

interface ConvertingStateWrapperProps {
  jobId: string;
  filename?: string;
  onCancel?: () => void;
}

/**
 * Wrapper component that provides all necessary contexts for ConvertingState testing
 */
export function ConvertingStateWrapper({ jobId, filename, onCancel }: ConvertingStateWrapperProps) {
  // Mock AppState
  const mockAppState: AppState = {
    uiState: 'converting',
    importedFile: null,
    validationError: null,
    isValidating: false,
    lastError: null,
    lastFilename: filename ?? null,
    setImportedFile: () => {},
    clearImportedFile: () => {},
    setValidationError: () => {},
    clearValidationError: () => {},
    setValidating: () => {},
    setUIState: () => {},
    startConversion: () => {},
    setSuccess: () => {},
    setError: () => {},
    getProgress: () => undefined,
    reset: () => {},
  };

  // Mock ConversionHandlers
  const mockConversionHandlers: ConversionHandlers = {
    handleFileValidated: async () => {},
    handleExportClick: async () => {},
    handleCancelConversion: onCancel ?? undefined,
    handleRetry: () => {},
    handleDismissError: () => {},
    handleReportIssue: async (): Promise<void> => {},
    handleImportDifferent: () => {},
  };

  // Mock QuickSettings
  const mockQuickSettings = {
    settings: null,
    handlers: {
      handlePageSizeChange: async () => {},
      handleMarginsChange: async () => {},
      handleCustomMarginChange: async () => {},
    },
  };

  const successRef = React.useRef<HTMLDivElement>(null);
  const errorRef = React.useRef<HTMLDivElement>(null);

  return (
    <AppProvider
      value={{
        appState: mockAppState,
        currentJobId: jobId,
        successRef,
        errorRef,
        onOpenSettings: () => {},
      }}
    >
      <ConversionProvider value={mockConversionHandlers}>
        <QuickSettingsProvider value={mockQuickSettings}>
          <ConvertingState />
        </QuickSettingsProvider>
      </ConversionProvider>
    </AppProvider>
  );
}
