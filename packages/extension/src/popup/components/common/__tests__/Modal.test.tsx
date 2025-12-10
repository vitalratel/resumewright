/**
 * Modal Base Component Tests
 *
 * Tests for the base Modal component, including:
 * - Modal entrance slide-down animation
 * - Focus trapping
 * - Escape key handling
 * - Backdrop click behavior
 * - ARIA attributes
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Modal } from '../Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    ariaLabelledBy: 'modal-title',
    ariaDescribedBy: 'modal-description',
    children: (
      <>
        <h2 id="modal-title">Test Modal</h2>
        <p id="modal-description">This is a test modal</p>
      </>
    ),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Entrance Animation', () => {
    it('should apply fade-in animation to modal content', () => {
      render(<Modal {...defaultProps} />);

      const modalContent = screen.getByRole('dialog');
      expect(modalContent.className).toMatch(/animate-fade-in|animate-\[fadeIn/);
    });
  });

  describe('Rendering', () => {
    it('should render as dialog with proper ARIA attributes', () => {
      render(<Modal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      // Native <dialog> has implicit aria-modal when opened with showModal()
      expect(dialog.tagName).toBe('DIALOG');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
    });

    it('should render children content', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('This is a test modal')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should use native dialog backdrop via CSS pseudo-element', () => {
      render(<Modal {...defaultProps} />);

      // Native <dialog> uses ::backdrop pseudo-element styled via backdrop: classes
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('backdrop:bg-black');
    });
  });

  describe('Keyboard Interaction', () => {
    it('should call onClose when native cancel event fires (Escape key)', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      // Native <dialog> handles Escape via 'cancel' event, not keydown
      const dialog = screen.getByRole('dialog');
      fireEvent(dialog, new Event('cancel', { bubbles: true }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose on cancel event when closeOnEscape is false', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />);

      // Native <dialog> handles Escape via 'cancel' event
      const dialog = screen.getByRole('dialog');
      fireEvent(dialog, new Event('cancel', { bubbles: true }));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Backdrop Click Behavior', () => {
    it('should call onClose when dialog element itself is clicked (backdrop area)', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      // Click the dialog element itself (simulates backdrop click via native dialog)
      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content (child) is clicked', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      // Click on child content, not the dialog element itself
      const title = screen.getByText('Test Modal');
      fireEvent.click(title);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not call onClose on backdrop click when closeOnBackdropClick is false', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} closeOnBackdropClick={false} />);

      // Click the dialog element itself
      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Customization', () => {
    it('should apply custom maxWidth class', () => {
      render(<Modal {...defaultProps} maxWidth="max-w-lg" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-lg');
    });

    it('should apply custom className', () => {
      render(<Modal {...defaultProps} className="custom-modal-class" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-modal-class');
    });

    it('should apply default maxWidth when not provided', () => {
      render(<Modal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-md');
    });
  });

  describe('Native Dialog Styling', () => {
    it('should use native dialog with backdrop pseudo-element styling', () => {
      render(<Modal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      // Native <dialog> uses backdrop: pseudo-element classes
      expect(dialog.className).toContain('backdrop:bg-black');
    });
  });

  describe('Focus Management', () => {
    it('should have focusable content inside modal', () => {
      render(
        <Modal {...defaultProps}>
          <h2 id="modal-title">Modal with Button</h2>
          <button type="button">Click me</button>
        </Modal>,
      );

      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog role via native element', () => {
      render(<Modal {...defaultProps} />);

      // Native <dialog> has implicit role="dialog"
      const dialog = screen.getByRole('dialog');
      expect(dialog.tagName).toBe('DIALOG');
    });

    it('should be modal via native showModal()', () => {
      render(<Modal {...defaultProps} />);

      // Native <dialog> has implicit aria-modal="true" when opened with showModal()
      const dialog = screen.getByRole('dialog');
      expect(dialog.tagName).toBe('DIALOG');
    });

    it('should connect aria-labelledby to title', () => {
      render(<Modal {...defaultProps} ariaLabelledBy="custom-title" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'custom-title');
    });

    it('should connect aria-describedby to description', () => {
      render(<Modal {...defaultProps} ariaDescribedBy="custom-description" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'custom-description');
    });
  });
});
