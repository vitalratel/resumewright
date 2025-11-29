/**
 * CV Preview Modal Component
 * CV preview before export with confirmation and settings adjustment
 *
 * Shows a preview of the CV content before converting to PDF,
 * allowing users to:
 * - Verify they're exporting the correct file
 * - See page layout with margin guides
 * - Make final adjustments to page size and margins
 * - Proceed with PDF conversion
 */

import { DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/ui/useFocusManagement';
import { tokens } from '../styles/tokens';
import { extractCVPreviewInfo } from '../utils/tsxParsing';
import { getShortcutDisplay, KeyboardHint } from './common';
import { Button } from './common/Button';
import { PageLayoutPreview } from './common/PageLayoutPreview';
import { QuickSettings } from './quick-settings';

interface CVPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tsxContent: string;
  filename: string;
  fileSize: string;

  // Settings adjustment in preview
  pageSize: 'A4' | 'Letter' | 'Legal';
  margins: 'compact' | 'narrow' | 'normal' | 'wide' | 'spacious' | 'custom';
  marginValues: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  onPageSizeChange: (size: 'A4' | 'Letter' | 'Legal') => void;
  onMarginsChange: (preset: 'compact' | 'narrow' | 'normal' | 'wide' | 'spacious') => void;
  onCustomMarginChange: (side: 'top' | 'right' | 'bottom' | 'left', value: number) => void;
}

export const CVPreviewModal = React.memo(({
  isOpen,
  onClose,
  onConfirm,
  tsxContent,
  filename,
  fileSize,
  pageSize,
  margins,
  marginValues,
  onPageSizeChange,
  onMarginsChange,
  onCustomMarginChange,
}: CVPreviewModalProps) => {
  const trapRef = useFocusTrap(isOpen);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const previewInfo = extractCVPreviewInfo(tsxContent);

  // P1-A11Y-007: Focus management for screen reader accessibility + Focus trap
  useEffect(() => {
    if (!isOpen)
      return;

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen)
    return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-${tokens.zIndex.modal} ${tokens.animations.fadeIn}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
    >
      <div
        ref={trapRef}
        className={`${tokens.colors.neutral.bgWhite} ${tokens.borders.roundedLg} ${tokens.effects.shadowXl} max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-in`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${tokens.borders.default}`}>
          <div className={`flex items-center ${tokens.spacing.gapMedium}`}>
            <DocumentTextIcon className={`${tokens.icons.lg} ${tokens.colors.info.icon}`} aria-hidden="true" />
            <div>
              <h2 id="preview-title" className={`${tokens.typography.base} ${tokens.typography.semibold} ${tokens.colors.neutral.text}`}>
                Preview & Adjust Settings
              </h2>
              <p className={`${tokens.typography.small} ${tokens.colors.neutral.textMuted}`}>Review layout and make final adjustments before converting</p>
            </div>
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            className={`p-2 ${tokens.colors.neutral.hover} ${tokens.borders.full} ${tokens.transitions.default} ${tokens.effects.focusRing}`.trim().replace(/\s+/g, ' ')}
            aria-label="Close preview"
          >
            <XMarkIcon className={`${tokens.icons.md} ${tokens.colors.neutral.textMuted}`} aria-hidden="true" />
          </button>
        </div>

        {/* Content - Two columns */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Layout Preview & File Info */}
            <div className={tokens.spacing.stack}>
              {/* Page Layout Preview */}
              <div className={`${tokens.colors.neutral.bg} ${tokens.borders.roundedLg} p-4`}>
                <PageLayoutPreview
                  pageSize={pageSize}
                  margins={marginValues}
                />
              </div>

              {/* File Info */}
              <div className={`${tokens.colors.info.bg} ${tokens.colors.info.border} ${tokens.borders.roundedLg} p-4`}>
                <h3 className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.info.textStrong} ${tokens.spacing.marginSmall}`}>File Information</h3>
                <dl className={`${tokens.spacing.gapSmall} ${tokens.typography.small}`}>
                  <div className="flex justify-between">
                    <dt className={tokens.colors.info.text}>Filename:</dt>
                    <dd className={`font-mono ${tokens.colors.info.textStrong}`}>{filename}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className={tokens.colors.info.text}>Size:</dt>
                    <dd className={tokens.colors.info.textStrong}>{fileSize}</dd>
                  </div>
                  {previewInfo.sections > 0 && (
                    <div className="flex justify-between">
                      <dt className={tokens.colors.info.text}>Sections:</dt>
                      <dd className={tokens.colors.info.textStrong}>{previewInfo.sections}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Detected Content */}
              {((previewInfo.name !== null && previewInfo.name !== undefined && previewInfo.name !== '') || (previewInfo.title !== null && previewInfo.title !== undefined && previewInfo.title !== '')) && (
                <div className={`${tokens.colors.success.bg} ${tokens.colors.success.border} ${tokens.borders.roundedLg} p-4`}>
                  <h3 className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.success.textStrong} ${tokens.spacing.marginSmall}`}>Detected Content</h3>
                  <dl className={`${tokens.spacing.gapSmall} ${tokens.typography.small}`}>
                    {(previewInfo.name !== null && previewInfo.name !== undefined && previewInfo.name !== '') && (
                      <div>
                        <dt className={`${tokens.colors.success.text} ${tokens.typography.medium}`}>Name:</dt>
                        <dd className={tokens.colors.success.textStrong}>{previewInfo.name}</dd>
                      </div>
                    )}
                    {(previewInfo.title !== null && previewInfo.title !== undefined && previewInfo.title !== '') && (
                      <div>
                        <dt className={`${tokens.colors.success.text} ${tokens.typography.medium}`}>Title:</dt>
                        <dd className={tokens.colors.success.textStrong}>{previewInfo.title}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>

            {/* Right Column: Quick Settings */}
            <div className={tokens.spacing.stack}>
              <div className={`${tokens.colors.neutral.bg} ${tokens.borders.roundedLg} p-4`}>
                <h3 className={`${tokens.typography.base} ${tokens.typography.medium} ${tokens.colors.neutral.text} mb-4`}>
                  Adjust Layout Settings
                </h3>
                <QuickSettings
                  pageSize={pageSize}
                  margins={margins}
                  marginValues={marginValues}
                  onPageSizeChange={onPageSizeChange}
                  onMarginsChange={onMarginsChange}
                  onCustomMarginChange={onCustomMarginChange}
                  onOpenFullSettings={onClose}
                />
              </div>

              {/* Confirmation Message */}
              <div className={`${tokens.colors.warning.bg} ${tokens.colors.warning.border} ${tokens.borders.roundedLg} p-4`}>
                <p className={`${tokens.typography.small} ${tokens.colors.warning.text}`}>
                  <strong>Ready to convert?</strong>
                  {' '}
                  Review the layout preview and settings above.
                  Click &ldquo;Convert to PDF&rdquo; when you&apos;re satisfied with the configuration.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end ${tokens.spacing.gapMedium} p-4 border-t ${tokens.borders.default} ${tokens.colors.neutral.bg}`}>
          <Button
            variant="secondary"
            onClick={onClose}
            fullWidth={false}
            className="px-6"
          >
            Cancel
            <KeyboardHint keys="Esc" />
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            fullWidth={false}
            className="px-6"
            data-testid="confirm-export-button"
          >
            Convert to PDF
            <KeyboardHint keys={getShortcutDisplay('E')} />
          </Button>
        </div>
      </div>
    </div>
  );
});
