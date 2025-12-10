// ABOUTME: Modal base component using native <dialog> for accessibility.
// ABOUTME: Provides focus trapping, escape key handling, and backdrop click to close.

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /**
   * Callback when modal should close (Escape key or backdrop click)
   *
   * **Performance Note :** This callback should be memoized with useCallback
   * to prevent unnecessary re-renders of the Modal component and its focus trap.
   *
   * @example
   * ```tsx
   * const handleClose = useCallback(() => {
   *   setIsOpen(false);
   * }, []);
   *
   * <Modal isOpen={isOpen} onClose={handleClose} />
   * ```
   */
  onClose: () => void;

  /** ID for aria-labelledby (should match an id in children) */
  ariaLabelledBy?: string;

  /** ID for aria-describedby (should match an id in children) */
  ariaDescribedBy?: string;

  /** Modal content */
  children: ReactNode;

  /** Custom max width class (default: max-w-md) */
  maxWidth?: string;

  /** Whether backdrop click closes modal (default: true) */
  closeOnBackdropClick?: boolean;

  /** Whether Escape key closes modal (default: true) */
  closeOnEscape?: boolean;

  /** Additional CSS classes for modal container */
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  ariaLabelledBy,
  ariaDescribedBy,
  children,
  maxWidth = 'max-w-md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

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
      if (closeOnEscape) {
        e.preventDefault();
        onClose();
      } else {
        e.preventDefault(); // Prevent close if disabled
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [closeOnEscape, onClose]);

  // Handle backdrop click (click on dialog element itself, not content)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (closeOnBackdropClick && e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <dialog> is interactive per HTML spec; keyboard handled via native cancel event. See https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/issues/1000
    <dialog
      ref={dialogRef}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      onClick={handleBackdropClick}
      className={`backdrop:bg-black/50 dark:backdrop:bg-black/60 bg-card rounded-lg shadow-xl dark:shadow-none border border-border ${maxWidth} w-full p-0 animate-fade-in ${className}`.trim()}
    >
      {children}
    </dialog>
  );
}
