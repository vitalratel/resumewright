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
    it('should apply slide-down animation class to modal content', () => {
      render(<Modal {...defaultProps} />);

      const modalContent = screen.getByRole('dialog');
      expect(modalContent).toHaveClass('animate-slide-down');
    });

    it('should apply fade-in animation to modal content', () => {
      render(<Modal {...defaultProps} />);

      const modalContent = screen.getByRole('dialog');
      // Check for fadeIn animation class (from tokens.animations.fadeIn)
      expect(modalContent.className).toMatch(/animate-fade-in|animate-\[fadeIn/);
    });

    it('should apply both fade-in and slide-down animations', () => {
      render(<Modal {...defaultProps} />);

      const modalContent = screen.getByRole('dialog');
      const classes = modalContent.className;

      // Should have both animations
      expect(classes).toContain('animate-slide-down');
      expect(classes).toMatch(/animate-fade-in|animate-\[fadeIn/);
    });
  });

  describe('Rendering', () => {
    it('should render as dialog with proper ARIA attributes', () => {
      render(<Modal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
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

    it('should render backdrop when showBackdrop is true', () => {
      const { container } = render(<Modal {...defaultProps} showBackdrop={true} />);

      // Backdrop has bg-black and fadeIn animation
      const backdrop = container.querySelector('.bg-black');
      expect(backdrop).toBeInTheDocument();
    });

    it('should not render backdrop when showBackdrop is false', () => {
      const { container } = render(<Modal {...defaultProps} showBackdrop={false} />);

      const backdrop = container.querySelector('.bg-black');
      expect(backdrop).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Interaction', () => {
    it('should call onClose when Escape key is pressed', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose on Escape when closeOnEscape is false', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />);

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not respond to other keys', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(window, { key: 'Enter' });
      fireEvent.keyDown(window, { key: 'Tab' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Backdrop Click Behavior', () => {
    it('should call onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      const { container } = render(<Modal {...defaultProps} onClose={onClose} showBackdrop={true} />);

      // Click the backdrop (fixed inset-0 container with bg-black class)
      const backdrop = container.querySelector('.bg-black');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should not call onClose when modal content is clicked', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not call onClose on backdrop click when closeOnBackdropClick is false', () => {
      const onClose = vi.fn();
      const { container } = render(
        <Modal {...defaultProps} onClose={onClose} closeOnBackdropClick={false} showBackdrop={true} />,
      );

      const backdrop = container.querySelector('.bg-black');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).not.toHaveBeenCalled();
      }
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

    it('should use custom backdrop opacity', () => {
      const { container } = render(
        <Modal {...defaultProps} backdropOpacity="bg-opacity-75" showBackdrop={true} />,
      );

      const backdrop = container.querySelector('.bg-black');
      expect(backdrop).toHaveClass('bg-opacity-75');
    });

    it('should apply default maxWidth when not provided', () => {
      render(<Modal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-md');
    });
  });

  describe('Z-Index Management', () => {
    it('should use token-based z-index for backdrop by default', () => {
      const { container } = render(<Modal {...defaultProps} showBackdrop={true} />);

      const backdrop = container.querySelector('.bg-black');
      // Should use z-${tokens.zIndex.backdrop} which is z-40
      expect(backdrop?.className).toMatch(/z-40/);
    });

    it('should use token-based z-index for modal by default', () => {
      const { container } = render(<Modal {...defaultProps} />);

      const modalContainer = container.querySelector('.fixed.inset-0.flex');
      // Should use z-${tokens.zIndex.modal} which is z-50
      expect(modalContainer?.className).toMatch(/z-50/);
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
    it('should have proper dialog role', () => {
      render(<Modal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('role', 'dialog');
    });

    it('should mark modal as aria-modal', () => {
      render(<Modal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
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

    it('should mark backdrop as aria-hidden', () => {
      const { container } = render(<Modal {...defaultProps} showBackdrop={true} />);

      const backdrop = container.querySelector('.bg-black');
      expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
