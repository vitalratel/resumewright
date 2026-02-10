/**
 * ABOUTME: Context for dependency injection of conversion handler functions.
 * ABOUTME: Provides file validation, export, retry, and error recovery handlers.
 */

import { createContext, type JSX, useContext } from 'solid-js';

export interface ConversionHandlers {
  handleFileValidated: (content: string, fileName: string, fileSize: number) => Promise<void>;
  handleExportClick: () => Promise<void>;
  handleCancelConversion?: () => void;
  handleRetry: () => void;
  handleDismissError: () => void;
  handleImportDifferent: () => void;
  handleReportIssue: () => Promise<void>;
}

const ConversionContext = createContext<ConversionHandlers>();

export function ConversionProvider(props: { value: ConversionHandlers; children: JSX.Element }) {
  return (
    <ConversionContext.Provider value={props.value}>{props.children}</ConversionContext.Provider>
  );
}

export function useConversion(): ConversionHandlers {
  const context = useContext(ConversionContext);
  if (!context) {
    throw new Error('useConversion must be used within ConversionProvider');
  }
  return context;
}
