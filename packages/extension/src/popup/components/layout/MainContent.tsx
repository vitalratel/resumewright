// ABOUTME: State machine content renderer using popupStore.
// ABOUTME: Renders different content based on UI state (import, converting, success, error).

import { Match, Switch } from 'solid-js';
import { generateFilename } from '../../../shared/utils/filenameSanitization';
import { useConversion } from '../../context/ConversionContext';
import { popupStore } from '../../store';
import { ConvertingState } from '../conversion/ConvertingState';
import { ErrorState } from '../conversion/ErrorState';
import { Success } from '../conversion/Success';
import { ErrorBoundary, SectionErrorBoundary } from '../ErrorBoundary';
import { FileImport } from '../FileImport';
import { FileValidatedView } from './FileValidatedView';

export function MainContent() {
  const conversionHandlers = useConversion();

  let successRef: HTMLDivElement | undefined;
  let errorRef: HTMLDivElement | undefined;

  const handleExportAnother = () => {
    popupStore.clearImportedFile();
    popupStore.resetUI();
  };

  return (
    <main id="main-content" class="flex-1 overflow-y-auto">
      <Switch>
        <Match when={popupStore.state.uiState === 'waiting_for_import'}>
          <div class="animate-fade-in">
            <SectionErrorBoundary section="file-import" onReset={popupStore.clearImportedFile}>
              <FileImport
                onFileValidated={(content, fileName, fileSize) => {
                  void conversionHandlers.handleFileValidated(content, fileName, fileSize);
                }}
                onClearFile={popupStore.clearImportedFile}
                importedFile={popupStore.state.importedFile}
              />
            </SectionErrorBoundary>
          </div>
        </Match>

        <Match
          when={
            popupStore.state.uiState === 'file_validated' ||
            popupStore.state.uiState === 'validation_error'
          }
        >
          <FileValidatedView />
        </Match>

        <Match when={popupStore.state.uiState === 'converting'}>
          <div class="animate-fade-in">
            <ConvertingState />
          </div>
        </Match>

        <Match when={popupStore.state.uiState === 'success'}>
          <div ref={successRef} class="animate-fade-in">
            <ErrorBoundary>
              <Success
                filename={popupStore.state.lastFilename ?? generateFilename(undefined)}
                autoCloseSeconds={20}
                onExportAnother={handleExportAnother}
              />
            </ErrorBoundary>
          </div>
        </Match>

        <Match when={popupStore.state.uiState === 'error' ? popupStore.state.lastError : undefined}>
          {(error) => (
            <div ref={errorRef} class="animate-fade-in">
              <ErrorState
                error={error()}
                onRetry={conversionHandlers.handleRetry}
                onDismiss={conversionHandlers.handleDismissError}
                onReportIssue={conversionHandlers.handleReportIssue}
                onImportDifferent={conversionHandlers.handleImportDifferent}
              />
            </div>
          )}
        </Match>
      </Switch>
    </main>
  );
}
