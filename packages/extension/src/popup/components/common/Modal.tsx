/**
 * Modal Base Component
 * Uses native <dialog> element for proper accessibility
 *
 * Provides consistent modal behavior across the application:
 * - Native focus trapping (via showModal)
 * - Native Escape key handling (via cancel event)
 * - Backdrop click to close
 * - Proper ARIA attributes
 * - Consistent styling and animations
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={showModal}
 *   onClose={handleClose}
 *   ariaLabelledBy="modal-title"
 *   ariaDescribedBy="modal-description"
 * >
 *   <h2 id="modal-title">Confirm Action</h2>
 *   <p id="modal-description">Are you sure?</p>
 *   <button onClick={handleConfirm}>Confirm</button>
 * </Modal>
 * ```
 */

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { tokens } from '../../styles/tokens';

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

/**
 * Modal Component
 *
 * Unified modal implementation with consistent accessibility,
 * keyboard handling, and styling.
 */
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
      className={`backdrop:bg-black/50 dark:backdrop:bg-black/60 ${tokens.colors.neutral.bgWhite} ${tokens.borders.roundedLg} ${tokens.effects.shadowXl} ${maxWidth} w-full p-0 ${tokens.animations.fadeIn} ${className}`
        .trim()
        .replace(/\s+/g, ' ')}
    >
      {children}
    </dialog>
  );
}
