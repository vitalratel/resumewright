/**
 * UnsavedChangesModal Component Tests
 * Unsaved Changes Protection
 * Modal close on Escape
 *
 * Tests for UnsavedChangesModal component:
 * - Rendering with warning content
 * - Save/Discard/Cancel actions
 * - Keyboard interaction (Escape key)
 * - Backdrop click behavior
 * - Focus management
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnsavedChangesModal } from '../UnsavedChangesModal';

describe('UnsavedChangesModal', () => {
  const mockOnSave = vi.fn();
  const mockOnDiscard = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    onSave: mockOnSave,
    onDiscard: mockOnDiscard,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render as dialog modal', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'unsaved-modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'unsaved-modal-description');
    });

    it('should display warning title and description', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
      expect(screen.getByText('Do you want to save your settings before leaving?')).toBeInTheDocument();
    });

    it('should render all three action buttons', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Save changes and go back' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Discard changes and go back' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel and stay on settings' })).toBeInTheDocument();
    });

    it('should display warning icon', () => {
      const { container } = render(<UnsavedChangesModal {...defaultProps} />);

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onSave when Save & Continue button is clicked', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: 'Save changes and go back' });
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnDiscard).not.toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should call onDiscard when Discard Changes button is clicked', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const discardButton = screen.getByRole('button', { name: 'Discard changes and go back' });
      fireEvent.click(discardButton);

      expect(mockOnDiscard).toHaveBeenCalledTimes(1);
      expect(mockOnSave).not.toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should call onCancel when Cancel button is clicked', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel and stay on settings' });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnSave).not.toHaveBeenCalled();
      expect(mockOnDiscard).not.toHaveBeenCalled();
    });

    it('should call onCancel when backdrop is clicked', () => {
      const { container } = render(<UnsavedChangesModal {...defaultProps} />);

      // After backdrop is the outer div, dialog role is on inner content
      const backdrop = container.firstChild as HTMLElement | null;
      if (backdrop !== null && backdrop !== undefined) {
        fireEvent.click(backdrop);
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
      }
    });

    it('should NOT call onCancel when modal content is clicked', () => {
      const { container } = render(<UnsavedChangesModal {...defaultProps} />);

      // The modal content is the inner div (child of dialog)
      const dialog = container.querySelector('[role="dialog"]');
      const modalContent = dialog?.firstChild as HTMLElement | null;

      if (modalContent !== null && modalContent !== undefined) {
        fireEvent.click(modalContent);
        expect(mockOnCancel).not.toHaveBeenCalled();
      }
    });
  });

  describe('Keyboard Interaction - P2-ROOT-011', () => {
    it('should call onCancel when Escape key is pressed', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnSave).not.toHaveBeenCalled();
      expect(mockOnDiscard).not.toHaveBeenCalled();
    });

    it('should NOT call onCancel when other keys are pressed', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      fireEvent.keyDown(document, { key: 'Tab' });

      expect(mockOnCancel).not.toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
      expect(mockOnDiscard).not.toHaveBeenCalled();
    });

    it('should cleanup Escape listener on unmount', () => {
      const { unmount } = render(<UnsavedChangesModal {...defaultProps} />);

      unmount();

      // After unmount, Escape should not trigger onCancel
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management - + P1-LAYOUT-001', () => {
    it('should focus first focusable element on mount (useFocusTrap)', async () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      await waitFor(() => {
        // useFocusTrap focuses the first focusable element (Save button)
        const saveButton = screen.getByRole('button', { name: 'Save changes and go back' });
        expect(saveButton).toHaveFocus();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'unsaved-modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'unsaved-modal-description');
    });

    it('should have accessible button labels', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: 'Save changes and go back' });
      const discardButton = screen.getByRole('button', { name: 'Discard changes and go back' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel and stay on settings' });

      expect(saveButton).toHaveAccessibleName();
      expect(discardButton).toHaveAccessibleName();
      expect(cancelButton).toHaveAccessibleName();
    });

    it('should have warning icon with aria-hidden', () => {
      const { container } = render(<UnsavedChangesModal {...defaultProps} />);

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('should have accessible title', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const title = screen.getByText('You have unsaved changes');
      expect(title).toHaveAttribute('id', 'unsaved-modal-title');
    });

    it('should have accessible description', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const description = screen.getByText('Do you want to save your settings before leaving?');
      expect(description).toHaveAttribute('id', 'unsaved-modal-description');
    });
  });

  describe('Button Hierarchy', () => {
    it('should have Save as primary action (green)', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: 'Save changes and go back' });
      expect(saveButton.className).toContain('bg-green-500');
    });

    it('should have Discard as secondary action (bordered)', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const discardButton = screen.getByRole('button', { name: 'Discard changes and go back' });
      expect(discardButton.className).toContain('border');
    });

    it('should have Cancel as tertiary action (text-only)', () => {
      render(<UnsavedChangesModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel and stay on settings' });
      // Verify it's styled as text-only (no background color)
      expect(cancelButton.className).not.toContain('bg-green');
      expect(cancelButton.className).not.toContain('border');
    });
  });
});
