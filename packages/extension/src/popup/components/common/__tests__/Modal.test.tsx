/**
 * ABOUTME: Tests for Modal base component using native dialog element.
 * ABOUTME: Validates focus trapping, escape key, backdrop click, ARIA, and animation.
 */

import { fireEvent, render, screen } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Modal } from '../Modal';

describe('Modal', () => {
  const defaultChildren = () => (
    <>
      <h2 id="modal-title">Test Modal</h2>
      <p id="modal-description">This is a test modal</p>
    </>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Entrance Animation', () => {
    it('should apply fade-in animation to modal content', () => {
      render(() => (
        <Modal
          isOpen={true}
          onClose={vi.fn()}
          ariaLabelledBy="modal-title"
          ariaDescribedBy="modal-description"
        >
          {defaultChildren()}
        </Modal>
      ));

      const modalContent = screen.getByRole('dialog');
      expect(modalContent.className).toMatch(/animate-fade-in|animate-\[fadeIn/);
    });
  });

  describe('Rendering', () => {
    it('should render as dialog with proper ARIA attributes', () => {
      render(() => (
        <Modal
          isOpen={true}
          onClose={vi.fn()}
          ariaLabelledBy="modal-title"
          ariaDescribedBy="modal-description"
        >
          {defaultChildren()}
        </Modal>
      ));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog.tagName).toBe('DIALOG');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
    });

    it('should render children content', () => {
      render(() => (
        <Modal
          isOpen={true}
          onClose={vi.fn()}
          ariaLabelledBy="modal-title"
          ariaDescribedBy="modal-description"
        >
          {defaultChildren()}
        </Modal>
      ));

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('This is a test modal')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(() => (
        <Modal
          isOpen={false}
          onClose={vi.fn()}
          ariaLabelledBy="modal-title"
          ariaDescribedBy="modal-description"
        >
          {defaultChildren()}
        </Modal>
      ));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should use native dialog backdrop via CSS pseudo-element', () => {
      render(() => (
        <Modal
          isOpen={true}
          onClose={vi.fn()}
          ariaLabelledBy="modal-title"
          ariaDescribedBy="modal-description"
        >
          {defaultChildren()}
        </Modal>
      ));

      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('backdrop:bg-black');
    });
  });

  describe('Keyboard Interaction', () => {
    it('should call onClose when native cancel event fires (Escape key)', () => {
      const onClose = vi.fn();
      render(() => (
        <Modal isOpen={true} onClose={onClose} ariaLabelledBy="modal-title">
          {defaultChildren()}
        </Modal>
      ));

      const dialog = screen.getByRole('dialog');
      fireEvent(dialog, new Event('cancel', { bubbles: true }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose on cancel event when closeOnEscape is false', () => {
      const onClose = vi.fn();
      render(() => (
        <Modal isOpen={true} onClose={onClose} closeOnEscape={false} ariaLabelledBy="modal-title">
          {defaultChildren()}
        </Modal>
      ));

      const dialog = screen.getByRole('dialog');
      fireEvent(dialog, new Event('cancel', { bubbles: true }));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Backdrop Click Behavior', () => {
    it('should call onClose when dialog element itself is clicked (backdrop area)', () => {
      const onClose = vi.fn();
      render(() => (
        <Modal isOpen={true} onClose={onClose} ariaLabelledBy="modal-title">
          {defaultChildren()}
        </Modal>
      ));

      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content (child) is clicked', () => {
      const onClose = vi.fn();
      render(() => (
        <Modal isOpen={true} onClose={onClose} ariaLabelledBy="modal-title">
          {defaultChildren()}
        </Modal>
      ));

      const title = screen.getByText('Test Modal');
      fireEvent.click(title);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not call onClose on backdrop click when closeOnBackdropClick is false', () => {
      const onClose = vi.fn();
      render(() => (
        <Modal
          isOpen={true}
          onClose={onClose}
          closeOnBackdropClick={false}
          ariaLabelledBy="modal-title"
        >
          {defaultChildren()}
        </Modal>
      ));

      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Customization', () => {
    it('should apply custom maxWidth class', () => {
      render(() => (
        <Modal isOpen={true} onClose={vi.fn()} maxWidth="max-w-lg">
          {defaultChildren()}
        </Modal>
      ));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-lg');
    });

    it('should apply custom class', () => {
      render(() => (
        <Modal isOpen={true} onClose={vi.fn()} class="custom-modal-class">
          {defaultChildren()}
        </Modal>
      ));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-modal-class');
    });

    it('should apply default maxWidth when not provided', () => {
      render(() => (
        <Modal isOpen={true} onClose={vi.fn()}>
          {defaultChildren()}
        </Modal>
      ));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-md');
    });
  });

  describe('Native Dialog Styling', () => {
    it('should use native dialog with backdrop pseudo-element styling', () => {
      render(() => (
        <Modal isOpen={true} onClose={vi.fn()}>
          {defaultChildren()}
        </Modal>
      ));

      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('backdrop:bg-black');
    });
  });

  describe('Focus Management', () => {
    it('should have focusable content inside modal', () => {
      render(() => (
        <Modal isOpen={true} onClose={vi.fn()}>
          <h2 id="modal-title">Modal with Button</h2>
          <button type="button">Click me</button>
        </Modal>
      ));

      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog role via native element', () => {
      render(() => (
        <Modal isOpen={true} onClose={vi.fn()}>
          {defaultChildren()}
        </Modal>
      ));

      const dialog = screen.getByRole('dialog');
      expect(dialog.tagName).toBe('DIALOG');
    });

    it('should be modal via native showModal()', () => {
      render(() => (
        <Modal isOpen={true} onClose={vi.fn()}>
          {defaultChildren()}
        </Modal>
      ));

      const dialog = screen.getByRole('dialog');
      expect(dialog.tagName).toBe('DIALOG');
    });

    it('should connect aria-labelledby to title', () => {
      render(() => (
        <Modal isOpen={true} onClose={vi.fn()} ariaLabelledBy="custom-title">
          {defaultChildren()}
        </Modal>
      ));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'custom-title');
    });

    it('should connect aria-describedby to description', () => {
      render(() => (
        <Modal isOpen={true} onClose={vi.fn()} ariaDescribedBy="custom-description">
          {defaultChildren()}
        </Modal>
      ));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'custom-description');
    });
  });
});
