/**
 * FileValidatedView Component
 * Extracted from MainContent
 * Refactored to use Context API
 *
 * Simplified view: file import + export button + settings summary
 */

import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import React, { useMemo, useTransition } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useConversion } from '../../context/ConversionContext';
import { useQuickSettings } from '../../context/QuickSettingsContext';
import { tokens } from '../../styles/tokens';
import { getMarginPreset } from '../../utils/marginPresets';
import { getShortcutDisplay } from '../../utils/shortcuts';
import { Button } from '../common/Button';
import { FileImport } from '../FileImport';

// Props removed - now using Context API
export const FileValidatedView = React.memo(() => {
  const { appState, onOpenSettings } = useAppContext();
  const { handleFileValidated, handleExportClick } = useConversion();
  const { settings } = useQuickSettings();

  // React 19 pattern: useTransition for async state updates
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
    <div className={tokens.animations.fadeIn}>
      <FileImport
        onFileValidated={(content, fileName, fileSize) => {
          // React 19 pattern: wrap async operations in startTransition
          startTransition(async () => {
            await handleFileValidated(content, fileName, fileSize);
          });
        }}
        onClearFile={appState.clearImportedFile}
        importedFile={importedFile}
      />

      {/* Export button with current settings display */}
      {importedFile && settings && (
        <div className={`${tokens.spacing.containerPadding} pb-6 ${tokens.spacing.stack}`}>
          <Button
            variant="primary"
            onClick={() => {
              void handleExportClick();
            }}
            className={`w-full flex items-center justify-center ${tokens.spacing.gapSmall}`}
            aria-label="Export to PDF using current settings (Ctrl+E shortcut)"
            data-testid="export-button"
          >
            <DocumentArrowDownIcon className={tokens.icons.md} aria-hidden="true" />
            <span>Export to PDF</span>
            <kbd
              className={`ml-auto px-2 py-0.5 ${tokens.typography.xs} ${tokens.colors.neutral.bg} ${tokens.borders.default} ${tokens.borders.rounded} font-mono ${tokens.typography.semibold} ${tokens.effects.shadow}`
                .trim()
                .replace(/\s+/g, ' ')}
            >
              {getShortcutDisplay('E')}
            </kbd>
          </Button>

          {/* Current settings display with link to Settings */}
          <div
            className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted} text-center flex items-center justify-center ${tokens.spacing.gapSmall}`}
          >
            <span>Current settings: {settingsSummary}</span>
            <button
              type="button"
              onClick={onOpenSettings}
              className={`${tokens.colors.link.text} ${tokens.colors.link.hover} ${tokens.colors.link.hoverUnderline} ${tokens.effects.focusRing}`}
              aria-label="Open settings to change export configuration"
            >
              Change
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
