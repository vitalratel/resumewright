/**
 * KeyboardShortcutsModal Component Tests
 * Modal close on Escape
 * Keyboard shortcuts discoverable
 * Focus trap for keyboard navigation
 *
 * Tests for KeyboardShortcutsModal component:
 * - Rendering with shortcuts organized by category
 * - Close actions (button click, backdrop, Escape key)
 * - Keyboard interaction (Escape key, focus trap)
 * - Accessibility (ARIA labels, focus management)
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ShortcutConfig } from '../../hooks/ui/useKeyboardShortcuts';
import { KeyboardShortcutsModal } from '../KeyboardShortcutsModal';

describe('KeyboardShortcutsModal', () => {
  const mockOnClose = vi.fn();

  const mockShortcuts: ShortcutConfig[] = [
    {
      key: ',',
      description: 'Open settings',
      handler: vi.fn(),
      enabled: true,
    },
    {
      key: 'Escape',
      description: 'Close modal or go back',
      handler: vi.fn(),
      enabled: true,
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      handler: vi.fn(),
      enabled: true,
    },
    {
      key: 'Enter',
      description: 'Convert CV to PDF',
      handler: vi.fn(),
      enabled: true,
    },
    {
      key: 'r',
      description: 'Retry failed conversion',
      handler: vi.fn(),
      enabled: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render as dialog modal when open', () => {
      render(
        <KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} shortcuts={mockShortcuts} />,
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      // Native <dialog> has implicit aria-modal="true" when opened with showModal()
      expect(dialog.tagName).toBe('DIALOG');
      expect(dialog).toHaveAttribute('aria-labelledby', 'shortcuts-modal-title');
    });

    it('should not render when closed', () => {
      render(
        <KeyboardShortcutsModal isOpen={false} onClose={mockOnClose} shortcuts={mockShortcuts} />,
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display modal title', () => {
      render(
        <KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} shortcuts={mockShortcuts} />,
      );

      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('should display all enabled shortcuts', () => {
      render(
        <KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} shortcuts={mockShortcuts} />,
      );

      expect(screen.getByText('Open settings')).toBeInTheDocument();
      expect(screen.getByText('Close modal or go back')).toBeInTheDocument();
      expect(screen.getByText('Show keyboard shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Convert CV to PDF')).toBeInTheDocument();
      expect(screen.getByText('Retry failed conversion')).toBeInTheDocument();
    });

    it('should organize shortcuts by category', () => {
      render(
        <KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} shortcuts={mockShortcuts} />,
      );

      // Should have category headers
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Help')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should filter out disabled shortcuts', () => {
      const shortcutsWithDisabled: ShortcutConfig[] = [
        ...mockShortcuts,
        {
          key: 'd',
          description: 'Disabled shortcut',
          handler: vi.fn(),
          enabled: false,
        },
      ];

      render(
        <KeyboardShortcutsModal
          isOpen={true}
          onClose={mockOnClose}
          shortcuts={shortcutsWithDisabled}
        />,
      );

      expect(screen.queryByText('Disabled shortcut')).not.toBeInTheDocument();
    });

    it('should render close button', () => {
      render(
        <KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} shortcuts={mockShortcuts} />,
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} shortcuts={mockShortcuts} />,
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      const { container } = render(
        <KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} shortcuts={mockShortcuts} />,
      );

      // The backdrop is the outer div with onClick
      const backdrop = container.firstChild as HTMLElement;
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should NOT call onClose when modal content is clicked', () => {
      const { container } = render(
        <KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} shortcuts={mockShortcuts} />,
      );

      // The modal content has stopPropagation
      const modalContent = container.querySelector('[role="dialog"]');
      if (modalContent) {
        fireEvent.click(modalContent);
        expect(mockOnClose).not.toHaveBeenCalled();
      }
    });
  });

  describe('Keyboard Interaction', () => {
    it('should call onClose when Escape key is pressed', () => {
      render(
        <KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} shortcuts={mockShortcuts} />,
      );

      // Native <dialog> handles Escape via 'cancel' event
      const dialog = screen.getByRole('dialog');
      fireEvent(dialog, new Event('cancel', { bubbles: true }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should NOT call onClose when other keys are pressed', () => {
      render(
        <KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} shortcuts={mockShortcuts} />,
      );

      fireEvent.keyDown(window, { key: 'Enter' });
      fireEvent.keyDown(window, { key: 'Space' });
      fireEvent.keyDown(window, { key: 'Tab' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should cleanup Escape listener on unmount', () => {
      const { unmount } = render(
        <KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} shortcuts={mockShortcuts} />,
      );

      unmount();

      // After unmount, Escape should not trigger onClose
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not add Escape listener when modal is closed', () => {
      render(
        <KeyboardShortcutsModal isOpen={false} onClose={mockOnClose} shortcuts={mockShortcuts} />,
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('should use native dialog showModal() for focus management', () => {
      render(
        <KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} shortcuts={mockShortcuts} />,
      );

      // Native <dialog> with showModal() provides automatic focus management
      // JSDOM doesn't fully implement this, so we verify the dialog is open
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('open');
      expect(dialog.tagName).toBe('DIALOG');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} shortcuts={mockShortcuts} />,
      );

      const dialog = screen.getByRole('dialog');
      // Native <dialog> has implicit aria-modal="true" when opened with showModal()
      expect(dialog.tagName).toBe('DIALOG');
      expect(dialog).toHaveAttribute('aria-labelledby', 'shortcuts-modal-title');
    });

    it('should have accessible close button', () => {
      render(
        <KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} shortcuts={mockShortcuts} />,
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveAccessibleName();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty shortcuts array', () => {
      render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} shortcuts={[]} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('should handle shortcuts with special characters', () => {
      const specialShortcuts: ShortcutConfig[] = [
        {
          key: 'Ctrl+Shift+P',
          description: 'Command palette',
          handler: vi.fn(),
          enabled: true,
        },
      ];

      render(
        <KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} shortcuts={specialShortcuts} />,
      );

      expect(screen.getByText('Command palette')).toBeInTheDocument();
    });
  });
});
