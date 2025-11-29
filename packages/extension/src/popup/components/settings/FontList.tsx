/**
 * FontList Component
 * Display uploaded custom fonts
 *
 * Features:
 * - Display font metadata (family, weight, style, format, size)
 * - Delete functionality
 * - Visual format badges
 */

import type { CustomFont } from '@/shared/domain/fonts/models/Font';
import React, { useCallback, useState } from 'react';
import browser from 'webextension-polyfill';
import { MessageType } from '@/shared/types/messages';
import { tokens } from '../../styles/tokens';
import { formatFileSize } from '../../utils/formatting';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface FontListProps {
  /** List of uploaded fonts */
  fonts: CustomFont[];

  /** Callback when font is successfully deleted */
  onDeleteSuccess: (id: string, family: string) => void;

  /** Optional callback when deletion fails */
  onDeleteError?: (error: Error) => void;
}

/**
 * FontList displays uploaded custom fonts with delete option
 */
export const FontList = React.memo(({
  fonts,
  onDeleteSuccess,
  onDeleteError,
}: FontListProps) => {
  const [fontToDelete, setFontToDelete] = useState<{ id: string; family: string } | null>(null);

  // Memoize delete handlers to prevent recreation on every render
  const handleDeleteClick = useCallback((id: string, family: string) => {
    setFontToDelete({ id, family });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!fontToDelete)
      return;

    try {
      await browser.runtime.sendMessage({
        type: MessageType.REMOVE_CUSTOM_FONT,
        payload: { fontId: fontToDelete.id },
      });
      onDeleteSuccess(fontToDelete.id, fontToDelete.family);
      setFontToDelete(null);
    }
    catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete font');
      onDeleteError?.(error);
      setFontToDelete(null);
    }
  }, [fontToDelete, onDeleteSuccess, onDeleteError]);

  const handleCancelDelete = useCallback(() => {
    setFontToDelete(null);
  }, []);

  if (fonts.length === 0) {
    return (
      <div>
        <h3 className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.spacing.marginSmall}`}>Uploaded Fonts</h3>
        <div className={`${tokens.typography.small} ${tokens.colors.neutral.textMuted} text-center py-4`}>
          No custom fonts uploaded yet
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.spacing.marginSmall}`}>Uploaded Fonts</h3>
      <div className={tokens.spacing.gapSmall}>
        {fonts.map(font => (
          <div
            key={font.id}
            className={`flex items-center justify-between ${tokens.spacing.cardSmall} ${tokens.borders.default} ${tokens.borders.rounded} ${tokens.colors.neutral.hover}`.trim().replace(/\s+/g, ' ')}
          >
            <div className="flex-1">
              <div className={`flex items-center ${tokens.spacing.gapSmall}`}>
                <div className={`${tokens.typography.medium} ${tokens.typography.small}`}>{font.family}</div>
                <span
                  className={`px-2 py-0.5 ${tokens.typography.xs} ${tokens.typography.semibold} ${tokens.borders.rounded} ${tokens.colors.neutral.bg} ${tokens.colors.neutral.textMuted}`.trim().replace(/\s+/g, ' ')}
                  aria-label={`Font format: ${font.format.toUpperCase()}`}
                >
                  {font.format.toUpperCase()}
                </span>
              </div>
              <div className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted}`}>
                Weight:
                {' '}
                {font.weight}
                {' '}
                • Style:
                {' '}
                {font.style}
                {' '}
                • Size:
                {' '}
                {formatFileSize(font.fileSize)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDeleteClick(font.id, font.family)}
              className={`${tokens.spacing.gapMedium} ${tokens.colors.error.text} hover:text-red-800 dark:hover:text-red-300 ${tokens.typography.small} ${tokens.typography.medium} ${tokens.effects.focusRing} px-2 py-1 ${tokens.borders.rounded}`.trim().replace(/\s+/g, ' ')}
              aria-label={`Delete ${font.family}`}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={fontToDelete !== null}
        title="Delete Font"
        message={`Are you sure you want to delete "${fontToDelete?.family}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={() => { void handleConfirmDelete(); }}
        onCancel={handleCancelDelete}
      />
    </div>
  );
});
