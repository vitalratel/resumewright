/**
 * Reset Confirmation Modal Component
 * Show current values before reset
 *
 * Displays a confirmation dialog when user attempts to reset settings,
 * showing the current values that will be lost.
 */

import type { UserSettings } from '@/shared/types/settings';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { tokens } from '../styles/tokens';
import { Modal } from './common/Modal';

interface ResetConfirmationModalProps {
  currentSettings: UserSettings;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetConfirmationModal = React.memo(({
  currentSettings,
  onConfirm,
  onCancel,
}: ResetConfirmationModalProps) => {
  const { pageSize, margin } = currentSettings.defaultConfig;

  // Compare current values with defaults to highlight only changes
  const defaultPageSize = 'Letter';
  const defaultMargin = { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 };

  const pageSizeChanged = pageSize !== defaultPageSize;
  const marginTopChanged = margin.top !== defaultMargin.top;
  const marginBottomChanged = margin.bottom !== defaultMargin.bottom;
  const marginLeftChanged = margin.left !== defaultMargin.left;
  const marginRightChanged = margin.right !== defaultMargin.right;
  const anyMarginChanged = marginTopChanged || marginBottomChanged || marginLeftChanged || marginRightChanged;

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      ariaLabelledBy="reset-modal-title"
      ariaDescribedBy="reset-modal-description"
    >
      <div className={`p-6 ${tokens.spacing.stack}`}>
        {/* Header with warning icon */}
        <div className={`flex items-start ${tokens.spacing.gapMedium}`}>
          <ExclamationTriangleIcon className={`${tokens.icons.md} ${tokens.colors.warning.icon} flex-shrink-0 mt-1`} aria-hidden="true" />
          <div className="flex-1">
            <h2 id="reset-modal-title" className={`${tokens.typography.large} ${tokens.typography.semibold} ${tokens.colors.neutral.text}`}>
              Reset Settings to Defaults?
            </h2>
            <p id="reset-modal-description" className={`${tokens.typography.base} ${tokens.colors.neutral.textMuted} ${tokens.spacing.marginSmall}`}>
              This will discard your current settings and restore defaults.
            </p>
          </div>
        </div>

        {/* Current values preview - Only show changed values */}
        <div className={`${tokens.colors.neutral.bg} border ${tokens.borders.default} ${tokens.borders.rounded} p-4 ${tokens.spacing.gapMedium} flex flex-col`.trim().replace(/\s+/g, ' ')}>
          <p className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.text}`}>
            {pageSizeChanged || anyMarginChanged ? 'Settings that will change:' : 'No custom settings to reset'}
          </p>

          {(pageSizeChanged || anyMarginChanged) && (
            <div className={`${tokens.spacing.gapSmall} ${tokens.typography.small} flex flex-col`}>
              {pageSizeChanged && (
                <div className="flex justify-between items-center">
                  <span className={tokens.colors.neutral.textMuted}>Page Size:</span>
                  <div className="flex items-center gap-2">
                    <span className={`${tokens.typography.medium} ${tokens.colors.warning.text} ${tokens.typography.semibold}`}>{pageSize}</span>
                    <span className={tokens.colors.neutral.textMuted}>→</span>
                    <span className={`${tokens.typography.medium} ${tokens.colors.neutral.text}`}>{defaultPageSize}</span>
                  </div>
                </div>
              )}

              {anyMarginChanged && (
                <div className={tokens.spacing.gapSmall}>
                  <span className={`${tokens.colors.neutral.textMuted} block`}>Margins:</span>
                  <div className={`ml-4 ${tokens.spacing.gapSmall}`}>
                    {marginTopChanged && (
                      <div className="flex justify-between items-center">
                        <span className={tokens.colors.neutral.textMuted}>Top:</span>
                        <div className="flex items-center gap-2">
                          <span className={`${tokens.typography.medium} ${tokens.colors.warning.text} ${tokens.typography.semibold} font-mono`}>
                            {margin.top}
                            &quot;
                          </span>
                          <span className={tokens.colors.neutral.textMuted}>→</span>
                          <span className={`${tokens.typography.medium} ${tokens.colors.neutral.text} font-mono`}>
                            {defaultMargin.top}
                            &quot;
                          </span>
                        </div>
                      </div>
                    )}
                    {marginBottomChanged && (
                      <div className="flex justify-between items-center">
                        <span className={tokens.colors.neutral.textMuted}>Bottom:</span>
                        <div className="flex items-center gap-2">
                          <span className={`${tokens.typography.medium} ${tokens.colors.warning.text} ${tokens.typography.semibold} font-mono`}>
                            {margin.bottom}
                            &quot;
                          </span>
                          <span className={tokens.colors.neutral.textMuted}>→</span>
                          <span className={`${tokens.typography.medium} ${tokens.colors.neutral.text} font-mono`}>
                            {defaultMargin.bottom}
                            &quot;
                          </span>
                        </div>
                      </div>
                    )}
                    {marginLeftChanged && (
                      <div className="flex justify-between items-center">
                        <span className={tokens.colors.neutral.textMuted}>Left:</span>
                        <div className="flex items-center gap-2">
                          <span className={`${tokens.typography.medium} ${tokens.colors.warning.text} ${tokens.typography.semibold} font-mono`}>
                            {margin.left}
                            &quot;
                          </span>
                          <span className={tokens.colors.neutral.textMuted}>→</span>
                          <span className={`${tokens.typography.medium} ${tokens.colors.neutral.text} font-mono`}>
                            {defaultMargin.left}
                            &quot;
                          </span>
                        </div>
                      </div>
                    )}
                    {marginRightChanged && (
                      <div className="flex justify-between items-center">
                        <span className={tokens.colors.neutral.textMuted}>Right:</span>
                        <div className="flex items-center gap-2">
                          <span className={`${tokens.typography.medium} ${tokens.colors.warning.text} ${tokens.typography.semibold} font-mono`}>
                            {margin.right}
                            &quot;
                          </span>
                          <span className={tokens.colors.neutral.textMuted}>→</span>
                          <span className={`${tokens.typography.medium} ${tokens.colors.neutral.text} font-mono`}>
                            {defaultMargin.right}
                            &quot;
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className={`flex ${tokens.spacing.gapMedium} pt-2`}>
          <button
            type="button"
            onClick={onCancel}
            className={`flex-1 px-4 py-2 ${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.text} ${tokens.colors.neutral.bgWhite} border ${tokens.borders.default} ${tokens.borders.rounded} ${tokens.colors.neutral.hover} ${tokens.effects.hoverBorder} ${tokens.effects.focusRing} ${tokens.transitions.default}`.trim().replace(/\s+/g, ' ')}
            autoFocus
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 ${tokens.typography.small} ${tokens.typography.medium} text-white ${tokens.buttons.variants.warning} ${tokens.borders.rounded} focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:ring-offset-2 ${tokens.transitions.default}`.trim().replace(/\s+/g, ' ')}
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </Modal>
  );
});
