/**
 * MainContent Component
 * Refactored to use Context API instead of prop drilling
 * State machine content renderer
 *
 * Renders different content based on UI state
 */

import React, { useTransition } from 'react';
import { generateFilename } from '../../../shared/utils/filenameSanitization';
import { useAppContext } from '../../context/AppContext';
import { useConversion } from '../../context/ConversionContext';
import { tokens } from '../../styles/tokens';
import { ConvertingState } from '../conversion/ConvertingState';
import { ErrorState } from '../conversion/ErrorState';
import { Success } from '../conversion/Success';
import { ErrorBoundary, SectionErrorBoundary } from '../ErrorBoundary';
import { FileImport } from '../FileImport';
import { FileValidatedView } from './FileValidatedView';

export const MainContent = React.memo(() => {
  const { appState, successRef, errorRef } = useAppContext();
  const conversionHandlers = useConversion();

  // React 19 pattern: useTransition for async state updates
  const [, startTransition] = useTransition();

  const { uiState, lastError, lastFilename } = appState;
  const {
    handleFileValidated,
    handleRetry,
    handleDismissError,
    handleReportIssue,
    handleImportDifferent,
  } = conversionHandlers;

  return (
    <main id="main-content" className="flex-1 overflow-y-auto">
      {uiState === 'waiting_for_import' && (
        <div className={tokens.animations.fadeIn}>
          {/* Isolate file import errors */}
          <SectionErrorBoundary section="file-import" onReset={appState.clearImportedFile}>
            <FileImport
              onFileValidated={(content, fileName, fileSize) => {
                // React 19 pattern: wrap async operations in startTransition
                startTransition(async () => {
                  await handleFileValidated(content, fileName, fileSize);
                });
              }}
              onClearFile={appState.clearImportedFile}
              importedFile={appState.importedFile}
            />
          </SectionErrorBoundary>
        </div>
      )}

      {(uiState === 'file_validated' || uiState === 'validation_error') && <FileValidatedView />}

      {uiState === 'converting' && (
        <div className={tokens.animations.fadeIn}>
          <ConvertingState />
        </div>
      )}

      {uiState === 'success' && (
        <div ref={successRef} className={tokens.animations.fadeIn}>
          <ErrorBoundary key={`success-${appState.lastFilename}`}>
            <Success
              filename={lastFilename ?? generateFilename(undefined)}
              autoCloseSeconds={20} // Increased from default 10s to 20s for WCAG 2.2.1
              onExportAnother={appState.reset}
            />
          </ErrorBoundary>
        </div>
      )}

      {uiState === 'error' && lastError && (
        <div ref={errorRef} className={tokens.animations.fadeIn}>
          <ErrorState
            error={lastError}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
            onReportIssue={handleReportIssue}
            onImportDifferent={handleImportDifferent}
          />
        </div>
      )}
    </main>
  );
});
