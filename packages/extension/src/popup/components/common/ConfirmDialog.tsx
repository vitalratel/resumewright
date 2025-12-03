/**
 * ConfirmDialog Component
 *
 * Modal dialog for confirming destructive or important actions.
 * Uses native <dialog> element for proper accessibility.
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
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleConfirm = () => {
    onConfirm();
    onCancel(); // Close dialog
  };

  // Sync dialog open state with isOpen prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Handle native cancel event (Escape key)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onCancel();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onCancel]);

  // Handle backdrop click (click on dialog element itself, not content)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onCancel();
    }
  };

  // Render via portal to avoid z-index issues
  return createPortal(
    // biome-ignore lint/a11y/useKeyWithClickEvents: <dialog> is interactive per HTML spec; keyboard handled via native cancel event. See https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/issues/1000
    <dialog
      ref={dialogRef}
      aria-labelledby="dialog-title"
      onClick={handleBackdropClick}
      className={`backdrop:bg-black/50 dark:backdrop:bg-black/60 ${tokens.colors.neutral.bgWhite} ${tokens.borders.roundedLg} ${tokens.effects.shadowXl} max-w-md w-full mx-4 p-6 open:flex open:flex-col`}
    >
      {/* Header */}
      <div className={`flex items-start justify-between ${tokens.spacing.marginSmall}`}>
        <h2
          id="dialog-title"
          className={`${tokens.typography.large} ${tokens.typography.semibold} ${tokens.colors.neutral.text}`}
        >
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
      <div
        className={`${tokens.spacing.marginMedium} ${tokens.typography.small} ${tokens.colors.neutral.textMuted}`}
      >
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
          }`
            .trim()
            .replace(/\s+/g, ' ')}
        >
          {confirmText}
        </button>
      </div>
    </dialog>,
    document.body,
  );
}

// Add displayName for React DevTools
ConfirmDialog.displayName = 'ConfirmDialog';
