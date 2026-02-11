// ABOUTME: Modal dialog for confirming destructive or important actions.
// ABOUTME: Uses native <dialog> element for proper accessibility.

import { HiOutlineXMark } from 'solid-icons/hi';
import { createEffect, type JSX, onCleanup, onMount } from 'solid-js';
import { Portal } from 'solid-js/web';

interface ConfirmDialogProps {
  /** Controls dialog visibility */
  isOpen: boolean;

  /** Dialog title */
  title: string;

  /** Dialog message/content */
  message: string | JSX.Element;

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

export function ConfirmDialog(props: ConfirmDialogProps) {
  let dialogRef: HTMLDialogElement | undefined;

  const confirmText = () => props.confirmText ?? 'Confirm';
  const cancelText = () => props.cancelText ?? 'Cancel';
  const confirmVariant = () => props.confirmVariant ?? 'primary';

  const handleConfirm = () => {
    props.onConfirm();
    props.onCancel(); // Close dialog
  };

  // Sync dialog open state with isOpen prop
  createEffect(() => {
    if (!dialogRef) return;

    if (props.isOpen && !dialogRef.open) {
      dialogRef.showModal();
    } else if (!props.isOpen && dialogRef.open) {
      dialogRef.close();
    }
  });

  // Handle native cancel event (Escape key)
  onMount(() => {
    if (!dialogRef) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      props.onCancel();
    };

    dialogRef.addEventListener('cancel', handleCancel);
    onCleanup(() => dialogRef?.removeEventListener('cancel', handleCancel));
  });

  // Handle backdrop click (click on dialog element itself, not content)
  const handleBackdropClick: JSX.EventHandler<HTMLDialogElement, MouseEvent> = (e) => {
    if (e.target === dialogRef) {
      props.onCancel();
    }
  };

  const confirmVariantClass = () => {
    switch (confirmVariant()) {
      case 'danger':
        return 'bg-destructive hover:bg-destructive/90 active:bg-destructive/80';
      case 'warning':
        return 'bg-warning text-warning-foreground hover:bg-warning/90 active:bg-warning/80';
      default:
        return 'bg-primary hover:bg-primary/90 active:bg-primary/80';
    }
  };

  return (
    <Portal>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <dialog> is interactive per HTML spec; keyboard handled via native cancel event */}
      <dialog
        ref={dialogRef}
        aria-labelledby="dialog-title"
        onClick={handleBackdropClick}
        class="backdrop:bg-black/50 dark:backdrop:bg-black/60 bg-card rounded-lg shadow-xl dark:shadow-none border border-border max-w-md w-full mx-4 p-6 open:flex open:flex-col"
      >
        <div class="flex items-start justify-between mb-3">
          <h2 id="dialog-title" class="text-lg font-semibold text-foreground">
            {props.title}
          </h2>
          <button
            type="button"
            onClick={() => props.onCancel()}
            class="min-w-11 min-h-11 p-2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
            aria-label="Close dialog"
          >
            <HiOutlineXMark class="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <div class="mb-4 text-sm text-muted-foreground">{props.message}</div>

        <div class="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => props.onCancel()}
            class="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all duration-300"
          >
            {cancelText()}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            class={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all duration-300 ${confirmVariantClass()}`}
          >
            {confirmText()}
          </button>
        </div>
      </dialog>
    </Portal>
  );
}
