// ABOUTME: Tests for Settings component auto-save with debounce.
// ABOUTME: Tests auto-save behavior, debounce, tab switching, and settings persistence.

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_USER_SETTINGS } from '@/shared/domain/settings/defaults';
import { settingsStore } from '@/shared/infrastructure/settings/SettingsStore';
import { Settings } from '../Settings';

/**
 * Helper to switch to a specific settings tab
 */
const switchToTab = (tabName: string) => {
  const tab = screen.getByRole('tab', { name: tabName });
  fireEvent.click(tab);
};

// Mock settingsStore
vi.mock('@/shared/infrastructure/settings/SettingsStore', () => ({
  settingsStore: {
    loadSettings: vi.fn(),
    saveSettings: vi.fn(),
    resetSettings: vi.fn(),
  },
}));

describe('Settings - Auto-Save ', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(settingsStore.loadSettings).mockResolvedValue(DEFAULT_USER_SETTINGS);
    vi.mocked(settingsStore.saveSettings).mockResolvedValue(undefined);
    vi.mocked(settingsStore.resetSettings).mockResolvedValue(undefined);
  });

  afterEach(async () => {
    // Cleanup DOM and ensure real timers are restored after each test
    cleanup();
    vi.useRealTimers();
    // Wait for any pending saves/flushes from unmounting components to complete
    // The Settings component flushes debounced saves on unmount if dirty
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Auto-Save Behavior', () => {
    it('should NOT auto-save on initial load', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Wait beyond debounce time
      await new Promise(resolve => setTimeout(resolve, 600));

      // Should not save on initial load
      expect(settingsStore.saveSettings).not.toHaveBeenCalled();
    });

    it('should auto-save after 500ms when page size changes', async () => {
      const user = userEvent.setup();
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Change page size from Letter to A4
      const a4Button = screen.getByRole('radio', { name: /select a4/i });
      await user.click(a4Button);

      // Should NOT save immediately
      expect(settingsStore.saveSettings).not.toHaveBeenCalled();

      // Wait for debounce (500ms + buffer)
      await waitFor(
        () => {
          expect(settingsStore.saveSettings).toHaveBeenCalledTimes(1);
        },
        { timeout: 1000 },
      );
    });

    it('should auto-save after 500ms when margin changes', async () => {
      const user = userEvent.setup();
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Change top margin using increment button
      const incrementButton = screen.getByRole('button', { name: /increase top margin/i });
      await user.click(incrementButton);

      // Should NOT save immediately
      expect(settingsStore.saveSettings).not.toHaveBeenCalled();

      // Wait for debounce
      await waitFor(
        () => {
          expect(settingsStore.saveSettings).toHaveBeenCalledTimes(1);
        },
        { timeout: 1000 },
      );
    });

    it('should debounce multiple rapid changes and save once', async () => {
      const user = userEvent.setup();
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Wait for component to fully stabilize
      await new Promise(resolve => setTimeout(resolve, 100));

      // Clear any calls from initial render/load
      vi.mocked(settingsStore.saveSettings).mockClear();

      // Make multiple changes quickly
      const incrementButton = screen.getByRole('button', { name: /increase top margin/i });

      // Click rapidly
      const click1 = user.click(incrementButton);
      const click2 = user.click(incrementButton);
      const click3 = user.click(incrementButton);

      // Wait for clicks to complete
      await Promise.all([click1, click2, click3]);

      // Wait for debounce to fire and verify it was called exactly once
      // (testing that multiple rapid changes result in a single debounced save)
      await waitFor(
        () => {
          expect(settingsStore.saveSettings).toHaveBeenCalledTimes(1);
        },
        { timeout: 2000 },
      );

      // Verify no additional saves occur after the debounced save
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(settingsStore.saveSettings).toHaveBeenCalledTimes(1);
    }, 15000); // Increase test timeout to 15s
  });

  describe('Immediate Save (No Debounce)', () => {
    it('should save immediately when navigating back with changes', async () => {
      const user = userEvent.setup();
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change
      const a4Button = screen.getByRole('radio', { name: /select a4/i });
      await user.click(a4Button);

      // Click back button immediately (before debounce)
      const backButton = screen.getByRole('button', { name: /back to main screen/i });
      await user.click(backButton);

      // Should save immediately without debounce
      await waitFor(() => {
        expect(settingsStore.saveSettings).toHaveBeenCalledTimes(1);
        expect(mockOnBack).toHaveBeenCalledTimes(1);
      });
    });

    it('should reset immediately when reset button clicked', async () => {
      const user = userEvent.setup();
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change
      const a4Button = screen.getByRole('radio', { name: /select a4/i });
      await user.click(a4Button);

      // Switch to General tab and reset settings
      switchToTab('General');
      const resetButton = screen.getByRole('button', { name: /reset settings to default/i });
      await user.click(resetButton);

      // Confirm reset in modal
      await waitFor(() => {
        expect(screen.getByText(/Reset Settings/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Reset to Defaults/i });
      await user.click(confirmButton);

      // Should reset immediately (without debounce)
      await waitFor(() => {
        expect(settingsStore.resetSettings).toHaveBeenCalledTimes(1);
      });
    });

    it('should navigate back immediately when no changes made', async () => {
      const user = userEvent.setup();
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Click back button without making changes
      const backButton = screen.getByRole('button', { name: /back to main screen/i });
      await user.click(backButton);

      // Should navigate without saving
      expect(settingsStore.saveSettings).not.toHaveBeenCalled();
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Success Feedback', () => {
    it('should show success message after auto-save', async () => {
      const user = userEvent.setup();
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change
      const a4Button = screen.getByRole('radio', { name: /select a4/i });
      await user.click(a4Button);

      // Wait for auto-save
      await waitFor(
        () => {
          expect(settingsStore.saveSettings).toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      // Should show success message
      await waitFor(() => {
        const successMessage = screen.getByRole('status');
        expect(successMessage).toHaveTextContent(/saved/i);
      });
    });

    it('should auto-hide success message after 3 seconds', async () => {
      const user = userEvent.setup();
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change and wait for auto-save
      const a4Button = screen.getByRole('radio', { name: /select a4/i });
      await user.click(a4Button);

      await waitFor(
        () => {
          expect(settingsStore.saveSettings).toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      // Wait for auto-hide (3 seconds + buffer)
      await waitFor(
        () => {
          expect(screen.queryByRole('status')).not.toBeInTheDocument();
        },
        { timeout: 4000 },
      );
    });
  });

  describe('Error Handling', () => {
    it('should show error message when auto-save fails', async () => {
      const user = userEvent.setup();

      // Make saveSettings fail
      vi.mocked(settingsStore.saveSettings).mockRejectedValueOnce(
        new Error('Network error'),
      );

      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change
      const a4Button = screen.getByRole('radio', { name: /select a4/i });
      await user.click(a4Button);

      // Wait for auto-save attempt
      await waitFor(
        () => {
          expect(settingsStore.saveSettings).toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/unable to save settings/i)).toBeInTheDocument();
      });
    });

    it('should retry auto-save on next change after error', async () => {
      const user = userEvent.setup();

      // First save fails, second succeeds
      vi.mocked(settingsStore.saveSettings)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // First change
      const a4Button = screen.getByRole('radio', { name: /select a4/i });
      await user.click(a4Button);

      await waitFor(
        () => {
          expect(settingsStore.saveSettings).toHaveBeenCalledTimes(1);
        },
        { timeout: 1000 },
      );

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/unable to save settings/i)).toBeInTheDocument();
      });

      // Make another change
      const legalButton = screen.getByRole('radio', { name: /select legal/i });
      await user.click(legalButton);

      // Should save successfully
      await waitFor(
        () => {
          expect(settingsStore.saveSettings).toHaveBeenCalledTimes(2);
        },
        { timeout: 1000 },
      );
    });

    it('should handle save failure on navigation gracefully', async () => {
      const user = userEvent.setup();

      // Make saveSettings fail
      vi.mocked(settingsStore.saveSettings).mockRejectedValueOnce(
        new Error('Save failed'),
      );

      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change
      const a4Button = screen.getByRole('radio', { name: /select a4/i });
      await user.click(a4Button);

      // Try to navigate back
      const backButton = screen.getByRole('button', { name: /back to main screen/i });
      await user.click(backButton);

      // Should attempt save
      await waitFor(() => {
        expect(settingsStore.saveSettings).toHaveBeenCalled();
      });

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/unable to save settings/i)).toBeInTheDocument();
      });

      // Should NOT navigate (save failed)
      expect(mockOnBack).not.toHaveBeenCalled();
    });
  });

  describe('P2-A11Y-005: Accessibility', () => {
    it('should have aria-live region for save status', async () => {
      const user = userEvent.setup();
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change and wait for auto-save
      const a4Button = screen.getByRole('radio', { name: /select a4/i });
      await user.click(a4Button);

      // Wait for debounce (500ms) + save to complete + success state to show
      // Success message should have role="status" (implicit aria-live="polite")
      await waitFor(
        () => {
          expect(settingsStore.saveSettings).toHaveBeenCalled();
          const status = screen.getByRole('status');
          expect(status).toBeInTheDocument();
          expect(status).toHaveTextContent(/settings saved/i);
        },
        { timeout: 2000 },
      );
    });

    it('should announce save errors to screen readers', async () => {
      const user = userEvent.setup();

      vi.mocked(settingsStore.saveSettings).mockRejectedValueOnce(
        new Error('Save failed'),
      );

      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Make a change
      const a4Button = screen.getByRole('radio', { name: /select a4/i });
      await user.click(a4Button);

      await waitFor(
        () => {
          expect(settingsStore.saveSettings).toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      // Error should be in an alert region
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent(/unable to save settings/i);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should save when changing back to original value', async () => {
      const user = userEvent.setup();
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Change to A4
      const a4Button = screen.getByRole('radio', { name: /select a4/i });
      await user.click(a4Button);

      await waitFor(
        () => {
          expect(settingsStore.saveSettings).toHaveBeenCalledTimes(1);
        },
        { timeout: 1000 },
      );

      // Change back to Letter (original)
      const letterButton = screen.getByRole('radio', { name: /select letter/i });
      await user.click(letterButton);

      // Should save again (settings changed, even if back to original)
      await waitFor(
        () => {
          expect(settingsStore.saveSettings).toHaveBeenCalledTimes(2);
        },
        { timeout: 1000 },
      );
    });

    it('should handle rapid page size changes', async () => {
      const user = userEvent.setup();
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Rapid changes (debounce should batch them)
      const a4Button = screen.getByRole('radio', { name: /select a4/i });
      await user.click(a4Button);

      const legalButton = screen.getByRole('radio', { name: /select legal/i });
      await user.click(legalButton);

      const letterButton = screen.getByRole('radio', { name: /select letter/i });
      await user.click(letterButton);

      // Wait for debounce - should save only once (final state)
      await waitFor(
        () => {
          expect(settingsStore.saveSettings).toHaveBeenCalledTimes(1);
        },
        { timeout: 1000 },
      );
    });
  });
});
