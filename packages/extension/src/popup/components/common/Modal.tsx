/**
 * Modal Base Component
 * Unified modal pattern
 *
 * Provides consistent modal behavior across the application:
 * - Focus trapping for accessibility
 * - Escape key handling
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
import { useCallback, useEffect } from 'react';
import { useFocusTrap } from '../../hooks/ui/useFocusManagement';
import { tokens } from '../../styles/tokens';

export interface ModalProps {
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

  /** Whether to show backdrop (default: true) */
  showBackdrop?: boolean;

  /** Custom backdrop opacity class (default: bg-opacity-50) */
  backdropOpacity?: string;

  /** Whether backdrop click closes modal (default: true) */
  closeOnBackdropClick?: boolean;

  /** Whether Escape key closes modal (default: true) */
  closeOnEscape?: boolean;

  /** Additional CSS classes for modal container */
  className?: string;

  /** Custom z-index for backdrop (default: tokens.zIndex.backdrop) */
  backdropZIndex?: string;

  /** Custom z-index for modal (default: tokens.zIndex.modal) */
  modalZIndex?: string;
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
  showBackdrop = true,
  backdropOpacity = 'bg-opacity-50 dark:bg-opacity-70',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  backdropZIndex = `z-${tokens.zIndex.backdrop}`,
  modalZIndex = `z-${tokens.zIndex.modal}`,
}: ModalProps) {
  // Focus trap for accessibility
  const trapRef = useFocusTrap(isOpen);

  // Memoize backdrop click handler to prevent recreation on every render
  // MUST be called before early return to satisfy rules-of-hooks
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  }, [closeOnBackdropClick, onClose]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape)
      return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Don't render if not open
  if (!isOpen)
    return null;

  return (
    <>
      {/* Backdrop */}
      {showBackdrop && (
        <div
          className={`fixed inset-0 bg-black ${backdropOpacity} ${backdropZIndex} ${tokens.animations.fadeIn}`}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Modal Container */}
      <div
        className={`fixed inset-0 flex items-center justify-center ${modalZIndex} p-4`}
        onClick={handleBackdropClick}
      >
        {/* Modal Content */}
        <div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          className={`${tokens.colors.neutral.bgWhite} ${tokens.borders.roundedLg} ${tokens.effects.shadowXl} ${maxWidth} w-full ${tokens.animations.fadeIn} animate-slide-down ${className}`.trim().replace(/\s+/g, ' ')}
          onClick={e => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );
}
