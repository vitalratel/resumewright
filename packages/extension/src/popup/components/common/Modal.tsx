// ABOUTME: Modal base component using native <dialog> for accessibility.
// ABOUTME: Provides focus trapping, escape key handling, and backdrop click to close.

import { createEffect, type JSX, onCleanup, onMount } from 'solid-js';

interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /**
   * Callback when modal should close (Escape key or backdrop click)
   */
  onClose: () => void;

  /** ID for aria-labelledby (should match an id in children) */
  ariaLabelledBy?: string;

  /** ID for aria-describedby (should match an id in children) */
  ariaDescribedBy?: string;

  /** Modal content */
  children: JSX.Element;

  /** Custom max width class (default: max-w-md) */
  maxWidth?: string;

  /** Whether backdrop click closes modal (default: true) */
  closeOnBackdropClick?: boolean;

  /** Whether Escape key closes modal (default: true) */
  closeOnEscape?: boolean;

  /** Additional CSS classes for modal container */
  class?: string;
}

export function Modal(props: ModalProps) {
  let dialogRef: HTMLDialogElement | undefined;

  const maxWidth = () => props.maxWidth ?? 'max-w-md';
  const closeOnBackdropClick = () => props.closeOnBackdropClick ?? true;
  const closeOnEscape = () => props.closeOnEscape ?? true;

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
      if (closeOnEscape()) {
        props.onClose();
      }
    };

    dialogRef.addEventListener('cancel', handleCancel);
    onCleanup(() => dialogRef?.removeEventListener('cancel', handleCancel));
  });

  // Handle backdrop click (click on dialog element itself, not content)
  const handleBackdropClick: JSX.EventHandler<HTMLDialogElement, MouseEvent> = (e) => {
    if (closeOnBackdropClick() && e.target === dialogRef) {
      props.onClose();
    }
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <dialog> is interactive per HTML spec; keyboard handled via native cancel event. See https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/issues/1000
    <dialog
      ref={dialogRef}
      aria-labelledby={props.ariaLabelledBy}
      aria-describedby={props.ariaDescribedBy}
      onClick={handleBackdropClick}
      class={`backdrop:bg-black/50 dark:backdrop:bg-black/60 bg-card rounded-lg shadow-xl dark:shadow-none border border-border ${maxWidth()} w-full p-0 animate-fade-in ${props.class ?? ''}`.trim()}
    >
      {props.children}
    </dialog>
  );
}
