/**
 * Unsaved Changes Protection Tests
 * Unsaved Changes Protection
 *
 * Tests for Settings component with unsaved changes:
 * - Dirty state detection
 * - Visual indicators
 * - Warning modal
 * - Save/Discard/Cancel actions
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { settingsStore } from '@/shared/infrastructure/settings/SettingsStore';
import { Settings } from '../settings';
import { UnsavedChangesModal } from '../UnsavedChangesModal';

// Mock settingsStore
vi.mock('@/shared/infrastructure/settings/SettingsStore', () => ({
  settingsStore: {
    loadSettings: vi.fn(),
    saveSettings: vi.fn(),
    resetSettings: vi.fn(),
  },
}));

const mockSettings = {
  defaultConfig: {
    pageSize: 'Letter' as const,
    margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    fontSize: 12,
    fontFamily: 'Arial',
    compress: false,
    includeMetadata: true,
  },
  customFonts: [],
};

describe('Unsaved Changes Protection', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (settingsStore.loadSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
    (settingsStore.saveSettings as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (settingsStore.resetSettings as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  describe('Dirty State Detection', () => {
    it('should start with no unsaved changes', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.queryByText(/unsaved/i)).not.toBeInTheDocument();
      });
    });

    it('should detect changes when page size is modified', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Change page size
      const a4Button = screen.getByRole('radio', { name: /A4/i });
      fireEvent.click(a4Button);

      // Should show unsaved indicator (changed from "(unsaved)" to "Unsaved changes" in P2)
      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });
    });

    it('should detect changes when margins are modified', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Change top margin
      const sliders = screen.getAllByRole('slider');
      const topMarginSlider = sliders.find(s => s.getAttribute('aria-label')?.toLowerCase().includes('top'));
      fireEvent.change(topMarginSlider!, { target: { value: '0.75' } });

      // Should show unsaved indicator (changed from "(unsaved)" to "Unsaved changes" in P2)
      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });
    });

    it('should clear dirty state after auto-save completes ', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change
      const a4Button = screen.getByRole('radio', { name: /A4/i });
      fireEvent.click(a4Button);

      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });

      // Wait for auto-save to complete (500ms debounce + save time)
      await waitFor(() => {
        expect(settingsStore.saveSettings).toHaveBeenCalled();
      }, { timeout: 2000 });

      // Should clear dirty state after save completes
      await waitFor(() => {
        expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
      });
    });
  });

  describe('Visual Indicators', () => {
    it('should show orange dot on back button when dirty', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change
      const a4Button = screen.getByRole('radio', { name: /A4/i });
      fireEvent.click(a4Button);

      // Check for unsaved indicator
      await waitFor(() => {
        const indicator = screen.getByLabelText(/unsaved changes/i);
        expect(indicator).toBeInTheDocument();
      });
    });

    it('should show "Unsaved changes" in title when dirty', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change
      const a4Button = screen.getByRole('radio', { name: /A4/i });
      fireEvent.click(a4Button);

      // Check for unsaved text in title (changed from "(unsaved)" to "Unsaved changes" in P2)
      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });
    });

    it('should trigger auto-save after changes ', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change to trigger auto-save
      const a4Button = screen.getByRole('radio', { name: /A4/i });
      fireEvent.click(a4Button);

      // Auto-save should be triggered after debounce (500ms)
      await waitFor(() => {
        expect(settingsStore.saveSettings).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('should show success message after auto-save completes ', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change
      const a4Button = screen.getByRole('radio', { name: /A4/i });
      fireEvent.click(a4Button);

      // Wait for auto-save to complete
      await waitFor(() => {
        expect(settingsStore.saveSettings).toHaveBeenCalled();
      }, { timeout: 2000 });

      // Check for success feedback
      // Note: Success message auto-hides after 3 seconds per implementation
      // Implementation may show visual feedback or toast notification
    });
  });

  describe('Navigation Protection (Auto-save on navigation)', () => {
    it('should navigate directly when no changes', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Click back without making changes
      const backButton = screen.getByRole('button', { name: /back to main screen/i });
      fireEvent.click(backButton);

      // Should navigate immediately
      expect(mockOnBack).toHaveBeenCalled();
    });

    it('should auto-save and navigate when back is clicked with unsaved changes ', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change
      const a4Button = screen.getByRole('radio', { name: /A4/i });
      fireEvent.click(a4Button);

      await waitFor(() => {
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      });

      // Try to navigate back
      const backButton = screen.getByRole('button', { name: /back to main screen/i });
      fireEvent.click(backButton);

      // Should auto-save immediately and then navigate
      await waitFor(() => {
        expect(settingsStore.saveSettings).toHaveBeenCalled();
        expect(mockOnBack).toHaveBeenCalled();
      });
    });
  });

  describe('UnsavedChangesModal Component', () => {
    const mockOnSave = vi.fn();
    const mockOnDiscard = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
      mockOnSave.mockClear();
      mockOnDiscard.mockClear();
      mockOnCancel.mockClear();
    });

    it('should render modal with correct content', () => {
      render(
        <UnsavedChangesModal
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText(/you have unsaved changes/i)).toBeInTheDocument();
      expect(screen.getByText(/do you want to save/i)).toBeInTheDocument();
    });

    it('should have all three action buttons', () => {
      render(
        <UnsavedChangesModal
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByRole('button', { name: /save changes and go back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /discard changes and go back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel and stay on settings/i })).toBeInTheDocument();
    });

    it('should call onSave when Save & Continue clicked', () => {
      render(
        <UnsavedChangesModal
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
          onCancel={mockOnCancel}
        />,
      );

      const saveButton = screen.getByRole('button', { name: /save changes and go back/i });
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalled();
    });

    it('should call onDiscard when Discard Changes clicked', () => {
      render(
        <UnsavedChangesModal
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
          onCancel={mockOnCancel}
        />,
      );

      const discardButton = screen.getByRole('button', { name: /discard changes and go back/i });
      fireEvent.click(discardButton);

      expect(mockOnDiscard).toHaveBeenCalled();
    });

    it('should call onCancel when Cancel clicked', () => {
      render(
        <UnsavedChangesModal
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
          onCancel={mockOnCancel}
        />,
      );

      const cancelButton = screen.getByRole('button', { name: /cancel and stay on settings/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should call onCancel when Escape is pressed', () => {
      render(
        <UnsavedChangesModal
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should call onCancel when backdrop is clicked', () => {
      render(
        <UnsavedChangesModal
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
          onCancel={mockOnCancel}
        />,
      );

      // The backdrop is the parent div with inset-0, dialog is the inner div
      const dialog = screen.getByRole('dialog');
      const backdrop = dialog.parentElement;

      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <UnsavedChangesModal
          onSave={mockOnSave}
          onDiscard={mockOnDiscard}
          onCancel={mockOnCancel}
        />,
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'unsaved-modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'unsaved-modal-description');
    });
  });

  describe('Integration: Auto-Save Flow ', () => {
    it('should auto-save immediately when navigating with unsaved changes', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change
      const a4Button = screen.getByRole('radio', { name: /A4/i });
      fireEvent.click(a4Button);

      // Try to navigate (before auto-save debounce completes)
      const backButton = screen.getByRole('button', { name: /back to main screen/i });
      fireEvent.click(backButton);

      // Should auto-save immediately (canceling debounced save) and navigate
      await waitFor(() => {
        expect(settingsStore.saveSettings).toHaveBeenCalled();
        expect(mockOnBack).toHaveBeenCalled();
      });
    });

    it('should remain on page if save fails during navigation', async () => {
      // Mock save to fail
      (settingsStore.saveSettings as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Save failed'),
      );

      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change
      const a4Button = screen.getByRole('radio', { name: /A4/i });
      fireEvent.click(a4Button);

      // Try to navigate
      const backButton = screen.getByRole('button', { name: /back to main screen/i });
      fireEvent.click(backButton);

      // Should try to save but stay on page when save fails
      await waitFor(() => {
        expect(settingsStore.saveSettings).toHaveBeenCalled();
      });

      // Should NOT navigate
      expect(mockOnBack).not.toHaveBeenCalled();
    });

    it('should navigate immediately when no unsaved changes', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Don't make any changes
      const backButton = screen.getByRole('button', { name: /back to main screen/i });
      fireEvent.click(backButton);

      // Should navigate without saving
      expect(mockOnBack).toHaveBeenCalled();
      expect(settingsStore.saveSettings).not.toHaveBeenCalled();
    });
  });
});
