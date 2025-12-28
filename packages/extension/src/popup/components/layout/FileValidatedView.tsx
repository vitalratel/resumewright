// ABOUTME: Simplified view showing file import, export button, and settings summary.
// ABOUTME: Uses Context API for state management.

import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useMemo, useTransition } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useConversion } from '../../context/ConversionContext';
import { useQuickSettings } from '../../context/QuickSettingsContext';
import { getMarginPreset } from '../../utils/marginPresets';
import { getShortcutDisplay } from '../../utils/shortcuts';
import { Button } from '../common/Button';
import { FileImport } from '../FileImport';

// Props removed - now using Context API
export function FileValidatedView() {
  const { appState, onOpenSettings } = useAppContext();
  const { handleFileValidated, handleExportClick } = useConversion();
  const { settings } = useQuickSettings();

  // useTransition for async state updates
  const [, startTransition] = useTransition();

  const { importedFile } = appState;

  // Format settings summary
  const settingsSummary = useMemo(() => {
    if (!settings) return null;
    const { pageSize, margin } = settings.defaultConfig;
    const preset = getMarginPreset(margin);
    const presetName = preset.charAt(0).toUpperCase() + preset.slice(1);

    return `${pageSize}, ${presetName} margins`;
  }, [settings]);

  return (
    <div className="animate-fade-in">
      <FileImport
        onFileValidated={(content, fileName, fileSize) => {
          startTransition(async () => {
            await handleFileValidated(content, fileName, fileSize);
          });
        }}
        onClearFile={appState.clearImportedFile}
        importedFile={importedFile}
      />

      {importedFile && settings && (
        <div className="px-6 py-8 md:px-8 md:py-10 pb-6 space-y-4">
          <Button
            variant="primary"
            onClick={() => {
              void handleExportClick();
            }}
            className="w-full"
            aria-label="Export to PDF"
            aria-keyshortcuts="Control+e"
            data-testid="export-button"
          >
            <span className="flex items-center justify-center gap-2">
              <DocumentArrowDownIcon className="w-5 h-5" aria-hidden="true" />
              <span>Export to PDF</span>
              <kbd className="ml-1 px-2 py-0.5 text-xs bg-primary/20 text-primary-foreground border border-primary/30 rounded-md font-mono font-semibold">
                {getShortcutDisplay('E')}
              </kbd>
            </span>
          </Button>

          <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
            <span>Current settings: {settingsSummary}</span>
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-primary hover:text-primary/80 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
              aria-label="Open settings to change export configuration"
            >
              Change
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
