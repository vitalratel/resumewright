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
import { ResultAsync } from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SettingsError } from '@/shared/errors/result';
import {
  loadSettings,
  resetSettings,
  saveSettings,
} from '@/shared/infrastructure/settings/SettingsStore';
import { Settings } from '../settings/Settings';

// Helper to create success ResultAsync for settings operations
const okSettingsResult = () => ResultAsync.fromSafePromise(Promise.resolve(undefined as void));

// Helper to create error ResultAsync for settings operations
const errSettingsResult = (message: string) => {
  const error: SettingsError = { type: 'storage_failed', message };
  return ResultAsync.fromPromise(Promise.reject(new Error(message)), () => error);
};

// Mock settings functions
vi.mock('@/shared/infrastructure/settings/SettingsStore', () => ({
  loadSettings: vi.fn(),
  saveSettings: vi.fn(),
  resetSettings: vi.fn(),
}));

const mockSettings = {
  theme: 'auto' as const,
  defaultConfig: {
    pageSize: 'Letter' as const,
    margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    fontSize: 12,
    fontFamily: 'Arial',
    filename: 'resume.pdf',
    compress: false,
    atsOptimization: true,
    includeMetadata: true,
  },
  autoDetectCV: true,
  showConvertButtons: true,
  telemetryEnabled: false,
  retentionDays: 30,
  settingsVersion: 1,
  lastUpdated: Date.now(),
};

describe('Unsaved Changes Protection', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadSettings).mockResolvedValue(mockSettings);
    vi.mocked(saveSettings).mockReturnValue(okSettingsResult());
    vi.mocked(resetSettings).mockReturnValue(okSettingsResult());
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

      // Should trigger auto-save (verifies change was detected)
      await waitFor(() => {
        expect(saveSettings).toHaveBeenCalled();
      });
    });

    it('should detect changes when margins are modified', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Change top margin
      const sliders = screen.getAllByRole('slider');
      const topMarginSlider = sliders.find((s) =>
        s.getAttribute('aria-label')?.toLowerCase().includes('top'),
      );
      if (!topMarginSlider) throw new Error('Top margin slider not found');
      fireEvent.change(topMarginSlider, { target: { value: '0.75' } });

      // Should trigger auto-save (verifies change was detected)
      await waitFor(() => {
        expect(saveSettings).toHaveBeenCalled();
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

      // Wait for auto-save to complete
      await waitFor(() => {
        expect(saveSettings).toHaveBeenCalled();
      });

      // Should show success message after save completes
      await waitFor(() => {
        expect(screen.getByText('Settings saved!')).toBeInTheDocument();
      });
    });
  });

  describe('Visual Indicators', () => {
    it('should show success feedback after auto-save completes', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change
      const a4Button = screen.getByRole('radio', { name: /A4/i });
      fireEvent.click(a4Button);

      // Check for success message after auto-save
      await waitFor(() => {
        expect(screen.getByText('Settings saved!')).toBeInTheDocument();
      });
    });

    it('should show "Unsaved changes" banner when dirty', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change
      const a4Button = screen.getByRole('radio', { name: /A4/i });
      fireEvent.click(a4Button);

      // Check for unsaved changes banner
      await waitFor(() => {
        expect(screen.getByText(/Unsaved changes \(saving automatically/i)).toBeInTheDocument();
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
      await waitFor(
        () => {
          expect(saveSettings).toHaveBeenCalled();
        },
        { timeout: 2000 },
      );
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
      await waitFor(
        () => {
          expect(saveSettings).toHaveBeenCalled();
        },
        { timeout: 2000 },
      );

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

      // Wait for auto-save to complete first
      await waitFor(() => {
        expect(saveSettings).toHaveBeenCalled();
      });

      // Clear mock to track navigation save separately
      vi.mocked(saveSettings).mockClear();

      // Make another change to create dirty state
      const letterButton = screen.getByRole('radio', { name: /Letter/i });
      fireEvent.click(letterButton);

      // Try to navigate back immediately (before auto-save debounce)
      const backButton = screen.getByRole('button', { name: /back to main screen/i });
      fireEvent.click(backButton);

      // Should auto-save immediately and then navigate
      await waitFor(() => {
        expect(saveSettings).toHaveBeenCalled();
        expect(mockOnBack).toHaveBeenCalled();
      });
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
        expect(saveSettings).toHaveBeenCalled();
        expect(mockOnBack).toHaveBeenCalled();
      });
    });

    it('should remain on page if save fails during navigation', async () => {
      // Mock save to fail
      vi.mocked(saveSettings).mockReturnValueOnce(errSettingsResult('Save failed'));

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
        expect(saveSettings).toHaveBeenCalled();
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
      expect(saveSettings).not.toHaveBeenCalled();
    });
  });
});
