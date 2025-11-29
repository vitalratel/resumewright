/**
 * ConfirmDialog Component
 *
 * Modal dialog for confirming destructive or important actions.
 * Replaces native confirm() with branded, accessible alternative.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   isOpen={showConfirm}
 *   title="Reset Settings?"
 *   message="This will restore all settings to defaults."
 *   confirmText="Reset"
 *   confirmVariant="danger"
 *   onConfirm={() => resetSettings()}
 *   onCancel={() => setShowConfirm(false)}
 * />
 * ```
 */

import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/ui';
import { tokens } from '../../styles/tokens';

export interface ConfirmDialogProps {
  /** Controls dialog visibility */
  isOpen: boolean;

  /** Dialog title */
  title: string;

  /** Dialog message/content */
  message: string | React.ReactNode;

  /** Confirm button text */
  confirmText?: string;

  /** Cancel button text */
  cancelText?: string;

  /** Confirm button variant */
  confirmVariant?: 'primary' | 'danger' | 'warning';

  /** Callback when confirmed */
  onConfirm: () => void;

  /** Callback when cancelled */
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Add focus trap to prevent Tab from escaping modal
  const trapRef = useFocusTrap(isOpen);

  const handleConfirm = () => {
    onConfirm();
    onCancel(); // Close dialog
  };

  // P1-A11Y-004: Close on Escape key (capture phase to ensure it works regardless of focus)
  useEffect(() => {
    if (!isOpen)
      return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    };

    // Use capture phase to catch Escape before other handlers
    window.addEventListener('keydown', handleEscape, { capture: true });
    return () => window.removeEventListener('keydown', handleEscape, { capture: true });
  }, [isOpen, onCancel]);

  if (!isOpen)
    return null;

  // Render via portal to avoid z-index issues
  return createPortal(
    <div
      className={`fixed inset-0 z-${tokens.zIndex.modal} flex items-center justify-center bg-black/50 dark:bg-black/60`}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        ref={trapRef}
        className={`${tokens.colors.neutral.bgWhite} ${tokens.borders.roundedLg} ${tokens.effects.shadowXl} max-w-md w-full mx-4 p-6`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-start justify-between ${tokens.spacing.marginSmall}`}>
          <h2 id="dialog-title" className={`${tokens.typography.large} ${tokens.typography.semibold} ${tokens.colors.neutral.text}`}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className={`${tokens.buttons.iconOnly.default} ${tokens.colors.neutral.icon} hover:${tokens.colors.neutral.textMuted} ${tokens.effects.focusRing}`}
            aria-label="Close dialog"
          >
            <XMarkIcon className={tokens.icons.md} aria-hidden="true" />
          </button>
        </div>

        {/* Message */}
        <div className={`${tokens.spacing.marginMedium} ${tokens.typography.small} ${tokens.colors.neutral.textMuted}`}>
          {message}
        </div>

        {/* Actions */}
        <div className={`flex ${tokens.spacing.gapMedium} justify-end`}>
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 ${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.text} ${tokens.colors.neutral.bgWhite} border ${tokens.colors.neutral.border} ${tokens.borders.rounded} ${tokens.colors.neutral.hover} ${tokens.effects.focusRing} ${tokens.transitions.default}`
              .trim()
              .replace(/\s+/g, ' ')}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 ${tokens.typography.small} ${tokens.typography.medium} text-white ${tokens.borders.rounded} ${tokens.effects.focusRing} ${tokens.transitions.default} ${
              confirmVariant === 'danger'
                ? `${tokens.buttons.variants.danger}`
                : confirmVariant === 'warning'
                  ? `${tokens.buttons.variants.warning}`
                  : `${tokens.colors.primary.bg} ${tokens.colors.primary.hover} active:bg-blue-700 dark:active:bg-blue-700`
            }`.trim().replace(/\s+/g, ' ')}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Add displayName for React DevTools
ConfirmDialog.displayName = 'ConfirmDialog';
