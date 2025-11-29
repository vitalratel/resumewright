/**
 * ResetConfirmationModal Component Tests
 * Modal close on Escape
 * Show current values before reset
 *
 * Tests for ResetConfirmationModal component:
 * - Rendering with current settings preview
 * - Confirm/Cancel actions
 * - Keyboard interaction (Escape key)
 * - Backdrop click behavior
 */

import type { UserSettings } from '@/shared/types/settings';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResetConfirmationModal } from '../ResetConfirmationModal';

describe('ResetConfirmationModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  const mockSettings: UserSettings = {
    theme: 'auto' as const,
    defaultConfig: {
      pageSize: 'A4' as const,
      margin: {
        top: 1.0,
        right: 1.0,
        bottom: 1.0,
        left: 1.0,
      },
      fontSize: 12,
      fontFamily: 'Arial',
      compress: false,
      includeMetadata: true,
    },
    autoDetectCV: true,
    showConvertButtons: false,
    telemetryEnabled: false,
    retentionDays: 30,
    settingsVersion: 1,
    lastUpdated: Date.now(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render as dialog modal', () => {
      render(
        <ResetConfirmationModal
          currentSettings={mockSettings}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'reset-modal-title');
    });

    it('should display warning title and description', () => {
      render(
        <ResetConfirmationModal
          currentSettings={mockSettings}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText('Reset Settings to Defaults?')).toBeInTheDocument();
      expect(screen.getByText(/This will discard your current settings/i)).toBeInTheDocument();
    });

    it('should display current page size', () => {
      render(
        <ResetConfirmationModal
          currentSettings={mockSettings}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText('Page Size:')).toBeInTheDocument();
      expect(screen.getByText('A4')).toBeInTheDocument();
    });

    it('should display all current margin values', () => {
      render(
        <ResetConfirmationModal
          currentSettings={mockSettings}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText('Margins:')).toBeInTheDocument();
      expect(screen.getByText('Top:')).toBeInTheDocument();
      expect(screen.getByText('Bottom:')).toBeInTheDocument();
      expect(screen.getByText('Left:')).toBeInTheDocument();
      expect(screen.getByText('Right:')).toBeInTheDocument();

      // All margins are 1.0"
      const marginValues = screen.getAllByText('1"');
      expect(marginValues.length).toBe(4);
    });

    it('should display changed values with before/after comparison - P2-SETTINGS-009', () => {
      render(
        <ResetConfirmationModal
          currentSettings={mockSettings}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      // Should show that settings will change
      expect(screen.getByText(/Settings that will change/i)).toBeInTheDocument();

      // Should show A4 → Letter for page size
      expect(screen.getByText('A4')).toBeInTheDocument();
      expect(screen.getByText('Letter')).toBeInTheDocument();
      expect(screen.getAllByText('→').length).toBeGreaterThan(0);

      // Should show margin changes (1" → 0.5")
      expect(screen.getAllByText('1"').length).toBeGreaterThan(0);
      expect(screen.getAllByText('0.5"').length).toBeGreaterThan(0);
    });

    it('should render Cancel and Reset buttons', () => {
      render(
        <ResetConfirmationModal
          currentSettings={mockSettings}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset to Defaults' })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm when Reset button is clicked', () => {
      render(
        <ResetConfirmationModal
          currentSettings={mockSettings}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const resetButton = screen.getByRole('button', { name: 'Reset to Defaults' });
      fireEvent.click(resetButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should call onCancel when Cancel button is clicked', () => {
      render(
        <ResetConfirmationModal
          currentSettings={mockSettings}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should call onCancel when backdrop is clicked', () => {
      const { container } = render(
        <ResetConfirmationModal
          currentSettings={mockSettings}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      // After backdrop is the outer div, dialog role is on inner content
      const backdrop = container.firstChild as HTMLElement;
      if (backdrop != null) {
        fireEvent.click(backdrop);
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
      }
    });

    it('should NOT call onCancel when modal content is clicked', () => {
      const { container } = render(
        <ResetConfirmationModal
          currentSettings={mockSettings}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      // The modal content is the inner div with stopPropagation
      const modalContent = container.querySelector('.bg-white');
      if (modalContent) {
        fireEvent.click(modalContent);
        expect(mockOnCancel).not.toHaveBeenCalled();
        expect(mockOnConfirm).not.toHaveBeenCalled();
      }
    });
  });

  describe('Keyboard Interaction - P2-ROOT-011', () => {
    it('should call onCancel when Escape key is pressed', () => {
      render(
        <ResetConfirmationModal
          currentSettings={mockSettings}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should NOT call onCancel when other keys are pressed', () => {
      render(
        <ResetConfirmationModal
          currentSettings={mockSettings}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      fireEvent.keyDown(document, { key: 'Tab' });

      expect(mockOnCancel).not.toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should cleanup Escape listener on unmount', () => {
      const { unmount } = render(
        <ResetConfirmationModal
          currentSettings={mockSettings}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      unmount();

      // After unmount, Escape should not trigger onCancel
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Settings Display - P2-UX-001', () => {
    it('should show no changes when settings match defaults - P2-SETTINGS-009', () => {
      const defaultSettings: UserSettings = {
        ...mockSettings,
        defaultConfig: {
          ...mockSettings.defaultConfig,
          pageSize: 'Letter' as const,
          margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        },
      };

      render(
        <ResetConfirmationModal
          currentSettings={defaultSettings}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText(/No custom settings to reset/i)).toBeInTheDocument();
    });

    it('should display Legal page size correctly', () => {
      const legalSettings: UserSettings = {
        ...mockSettings,
        defaultConfig: {
          ...mockSettings.defaultConfig,
          pageSize: 'Legal' as const,
        },
      };

      render(
        <ResetConfirmationModal
          currentSettings={legalSettings}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText('Legal')).toBeInTheDocument();
    });

    it('should display different margin values correctly', () => {
      const customMarginSettings: UserSettings = {
        ...mockSettings,
        defaultConfig: {
          ...mockSettings.defaultConfig,
          margin: {
            top: 0.5,
            right: 0.75,
            bottom: 0.5,
            left: 0.75,
          },
        },
      };

      render(
        <ResetConfirmationModal
          currentSettings={customMarginSettings}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      // Check that different margin values are displayed (multiple elements may have same text)
      const halfInchMargins = screen.getAllByText('0.5"');
      const threeQuarterInchMargins = screen.getAllByText('0.75"');

      expect(halfInchMargins.length).toBeGreaterThan(0);
      expect(threeQuarterInchMargins.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have warning icon with aria-hidden', () => {
      const { container } = render(
        <ResetConfirmationModal
          currentSettings={mockSettings}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />,
      );

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });
});
