// ABOUTME: Simplified view showing file import, export button, and settings summary.
// ABOUTME: Uses Context API and popupStore for state management.

import { HiOutlineDocumentArrowDown } from 'solid-icons/hi';
import { Show } from 'solid-js';
import { useAppContext } from '../../context/AppContext';
import { useConversion } from '../../context/ConversionContext';
import { useQuickSettings } from '../../context/QuickSettingsContext';
import { popupStore } from '../../store';
import { getMarginPreset } from '../../utils/marginPresets';
import { getShortcutDisplay } from '../../utils/shortcuts';
import { Button } from '../common/Button';
import { FileImport } from '../FileImport';

export function FileValidatedView() {
  const { onOpenSettings } = useAppContext();
  const { handleFileValidated, handleExportClick } = useConversion();
  const quickSettings = useQuickSettings();

  // Format settings summary (derived computation)
  const settingsSummary = () => {
    const s = quickSettings.settings;
    if (!s) return null;
    const { pageSize, margin } = s.defaultConfig;
    const preset = getMarginPreset(margin);
    const presetName = preset.charAt(0).toUpperCase() + preset.slice(1);
    return `${pageSize}, ${presetName} margins`;
  };

  return (
    <div class="animate-fade-in">
      <FileImport
        onFileValidated={(content, fileName, fileSize) => {
          void handleFileValidated(content, fileName, fileSize);
        }}
        onClearFile={popupStore.clearImportedFile}
        importedFile={popupStore.state.importedFile}
      />

      <Show when={popupStore.state.importedFile && quickSettings.settings}>
        <div class="px-6 py-8 md:px-8 md:py-10 pb-6 space-y-4">
          <Button
            variant="primary"
            onClick={() => {
              void handleExportClick();
            }}
            class="w-full"
            aria-label="Export to PDF"
            aria-keyshortcuts="Control+e"
            data-testid="export-button"
          >
            <span class="flex items-center justify-center gap-2">
              <HiOutlineDocumentArrowDown class="w-5 h-5" aria-hidden="true" />
              <span>Export to PDF</span>
              <kbd class="ml-1 px-2 py-0.5 text-xs bg-primary/20 text-primary-foreground border border-primary/30 rounded-md font-mono font-semibold">
                {getShortcutDisplay('E')}
              </kbd>
            </span>
          </Button>

          <div class="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
            <span>Current settings: {settingsSummary()}</span>
            <button
              type="button"
              onClick={onOpenSettings}
              class="text-primary hover:text-primary/80 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
              aria-label="Open settings to change export configuration"
            >
              Change
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
