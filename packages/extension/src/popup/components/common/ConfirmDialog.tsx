// ABOUTME: Modal dialog for confirming destructive or important actions.
// ABOUTME: Uses native <dialog> element for proper accessibility.

import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
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

  return createPortal(
    // biome-ignore lint/a11y/useKeyWithClickEvents: <dialog> is interactive per HTML spec; keyboard handled via native cancel event
    <dialog
      ref={dialogRef}
      aria-labelledby="dialog-title"
      onClick={handleBackdropClick}
      className="backdrop:bg-black/50 dark:backdrop:bg-black/60 bg-card rounded-lg shadow-xl dark:shadow-none border border-border max-w-md w-full mx-4 p-6 open:flex open:flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <h2 id="dialog-title" className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="min-w-11 min-h-11 p-2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
          aria-label="Close dialog"
        >
          <XMarkIcon className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">{message}</div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all duration-300"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all duration-300 ${
            confirmVariant === 'danger'
              ? 'bg-destructive hover:bg-destructive/90 active:bg-destructive/80'
              : confirmVariant === 'warning'
                ? 'bg-warning text-warning-foreground hover:bg-warning/90 active:bg-warning/80'
                : 'bg-primary hover:bg-primary/90 active:bg-primary/80'
          }`}
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
