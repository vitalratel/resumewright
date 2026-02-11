/**
 * ABOUTME: Tests for ConfirmDialog component for confirming important actions.
 * ABOUTME: Validates rendering, button variants, interactions, keyboard, and accessibility.
 */

import { fireEvent, render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(() => (
        <ConfirmDialog
          isOpen={false}
          title="Test Title"
          message="Test message"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      ));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test Title"
          message="Test message"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      ));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should render with custom confirm and cancel text', () => {
      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          confirmText="Delete"
          cancelText="Keep"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      ));

      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Keep')).toBeInTheDocument();
    });

    it('should render default confirm and cancel text', () => {
      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      ));

      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render JSX element as message', () => {
      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message={
            <div>
              <strong>Warning:</strong> This action cannot be undone
            </div>
          }
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      ));

      expect(screen.getByText('Warning:')).toBeInTheDocument();
      expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
    });
  });

  describe('Button Variants', () => {
    it('should render danger variant with red background', () => {
      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          confirmVariant="danger"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      ));

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('bg-destructive');
    });

    it('should render warning variant with yellow background', () => {
      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          confirmVariant="warning"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      ));

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('bg-warning');
    });

    it('should render primary variant with blue background', () => {
      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          confirmVariant="primary"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      ));

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('bg-primary');
    });

    it('should render primary variant by default', () => {
      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      ));

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('bg-primary');
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm when confirm button clicked', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      ));

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1); // Dialog closes after confirm
    });

    it('should call onCancel when cancel button clicked', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      ));

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should call onCancel when close button clicked', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      ));

      const closeButton = screen.getByLabelText('Close dialog');
      fireEvent.click(closeButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should call onCancel when backdrop clicked', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      ));

      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should not close when clicking inside dialog content', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test Title"
          message="Test Message"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      ));

      const title = screen.getByText('Test Title');
      fireEvent.click(title);

      expect(onCancel).not.toHaveBeenCalled();
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Interactions', () => {
    it('should close on Escape key', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      ));

      const dialog = screen.getByRole('dialog');
      fireEvent(dialog, new Event('cancel', { bubbles: true }));

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should not close on other keys', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      ));

      fireEvent.keyDown(window, { key: 'Enter' });
      fireEvent.keyDown(window, { key: 'Space' });
      fireEvent.keyDown(window, { key: 'a' });

      expect(onCancel).not.toHaveBeenCalled();
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      ));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should be modal via native dialog showModal()', () => {
      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      ));

      const dialog = screen.getByRole('dialog');
      expect(dialog.tagName).toBe('DIALOG');
    });

    it('should have aria-labelledby pointing to title', () => {
      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test Title"
          message="Test"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      ));

      const dialog = screen.getByRole('dialog');
      const titleId = dialog.getAttribute('aria-labelledby');
      expect(titleId).toBe('dialog-title');
      if (!titleId) throw new Error('aria-labelledby not found');

      const title = document.getElementById(titleId);
      expect(title).toHaveTextContent('Test Title');
    });

    it('should have aria-label on close button', () => {
      render(() => (
        <ConfirmDialog
          isOpen={true}
          title="Test"
          message="Test"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      ));

      const closeButton = screen.getByLabelText('Close dialog');
      expect(closeButton).toBeInTheDocument();
    });
  });
});
