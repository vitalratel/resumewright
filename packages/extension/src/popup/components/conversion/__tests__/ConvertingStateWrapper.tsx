/**
 * Test wrapper for ConvertingState
 * Provides context providers for testing
 */

import { AppProvider } from '../../../context/AppContext';
import { type ConversionHandlers, ConversionProvider } from '../../../context/ConversionContext';
import { popupStore } from '../../../store';
import { ConvertingState } from '../ConvertingState';

interface ConvertingStateWrapperProps {
  jobId: string;
  filename?: string;
  onCancel?: () => void;
}

/**
 * Wrapper component that provides all necessary contexts for ConvertingState testing
 */
export function ConvertingStateWrapper(props: ConvertingStateWrapperProps) {
  // Set filename in popupStore (ConvertingState reads from popupStore.state.lastFilename)
  if (props.filename) {
    popupStore.setSuccess(props.filename);
    popupStore.startConversion();
  }

  // Mock ConversionHandlers
  const mockConversionHandlers: ConversionHandlers = {
    handleFileValidated: async () => {},
    handleExportClick: async () => {},
    handleCancelConversion: props.onCancel,
    handleRetry: () => {},
    handleDismissError: () => {},
    handleReportIssue: async (): Promise<void> => {},
    handleImportDifferent: () => {},
  };

  return (
    <AppProvider
      value={{
        currentJobId: props.jobId,
        onOpenSettings: () => {},
      }}
    >
      <ConversionProvider value={mockConversionHandlers}>
        <ConvertingState />
      </ConversionProvider>
    </AppProvider>
  );
}
