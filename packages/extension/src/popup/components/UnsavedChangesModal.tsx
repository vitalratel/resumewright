/**
 * Unsaved Changes Modal Component
 * Unsaved Changes Protection
 *
 * Warning modal shown when user tries to navigate away from
 * Settings with unsaved changes.
 */

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { tokens } from '../styles/tokens';
import { Modal } from './common/Modal';

interface UnsavedChangesModalProps {
  /** Save changes and continue navigation */
  onSave: () => void;

  /** Discard changes and continue navigation */
  onDiscard: () => void;

  /** Cancel navigation and stay on settings */
  onCancel: () => void;
}

export const UnsavedChangesModal = React.memo(({ onSave, onDiscard, onCancel }: UnsavedChangesModalProps) => {
  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      ariaLabelledBy="unsaved-modal-title"
      ariaDescribedBy="unsaved-modal-description"
    >
      <div className={`p-6 ${tokens.spacing.stack}`}>
        {/* Icon and Title */}
        <div className={`flex items-start ${tokens.spacing.gapMedium}`}>
          <div className={`flex-shrink-0 w-12 h-12 ${tokens.colors.warning.bg} ${tokens.borders.full} flex items-center justify-center`.trim().replace(/\s+/g, ' ')}>
            <ExclamationTriangleIcon className={`${tokens.icons.lg} ${tokens.colors.warning.icon}`} aria-hidden="true" />
          </div>
          <div className="flex-1 pt-1">
            <h2 id="unsaved-modal-title" className={`${tokens.typography.base} ${tokens.typography.semibold} ${tokens.colors.neutral.text}`}>
              You have unsaved changes
            </h2>
            <p id="unsaved-modal-description" className={`${tokens.spacing.marginSmall} ${tokens.typography.small} ${tokens.colors.neutral.textMuted}`}>
              Do you want to save your settings before leaving?
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className={`${tokens.spacing.gapSmall} flex flex-col pt-2`}>
          {/* Primary: Save & Continue */}
          <button
            type="button"
            onClick={onSave}
            className={`w-full ${tokens.buttons.variants.success} text-white px-4 py-2.5 ${tokens.borders.rounded} ${tokens.typography.medium} ${tokens.transitions.default} focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:ring-offset-2 dark:ring-offset-gray-850`.trim().replace(/\s+/g, ' ')}
            aria-label="Save changes and go back"
          >
            Save & Continue
          </button>

          {/* Secondary: Discard Changes */}
          <button
            type="button"
            onClick={onDiscard}
            className={`w-full ${tokens.colors.neutral.bgWhite} ${tokens.borders.default} ${tokens.colors.neutral.hover} ${tokens.colors.neutral.textMuted} px-4 py-2.5 ${tokens.borders.rounded} ${tokens.typography.medium} ${tokens.transitions.default} ${tokens.effects.focusRing}`.trim().replace(/\s+/g, ' ')}
            aria-label="Discard changes and go back"
          >
            Discard Changes
          </button>

          {/* Tertiary: Cancel */}
          <button
            type="button"
            onClick={onCancel}
            className={`w-full ${tokens.colors.neutral.textMuted} hover:${tokens.colors.neutral.text} px-4 py-2 ${tokens.typography.small} ${tokens.transitions.default} ${tokens.effects.focusRing} ${tokens.borders.rounded}`.trim().replace(/\s+/g, ' ')}
            aria-label="Cancel and stay on settings"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
});
