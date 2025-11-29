/**
 * Settings Component Tests
 *
 * Tests Settings UI component functionality
 */

import type { UserSettings } from '@/shared/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_USER_SETTINGS } from '@/shared/domain/settings/defaults';
import { settingsStore } from '@/shared/infrastructure/settings/SettingsStore';
import { Settings } from '../Settings';

// Mock settingsStore
vi.mock('@/shared/infrastructure/settings/SettingsStore', () => ({
  settingsStore: {
    loadSettings: vi.fn(),
    saveSettings: vi.fn(),
    resetSettings: vi.fn(),
    validateSettings: vi.fn(),
  },
}));

describe('Settings', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Use vi.mocked() for proper typing
    vi.mocked(settingsStore.loadSettings).mockResolvedValue(DEFAULT_USER_SETTINGS);
    vi.mocked(settingsStore.saveSettings).mockResolvedValue(undefined);
    vi.mocked(settingsStore.resetSettings).mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('renders with default values', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      expect(screen.getByText('Letter (8.5" x 11")')).toBeInTheDocument();
      expect(screen.getByText('A4 (210mm x 297mm)')).toBeInTheDocument();
      expect(screen.getByText('Reset to Defaults')).toBeInTheDocument();
    });

    it('shows loading state while fetching settings', () => {
      render(<Settings onBack={mockOnBack} />);

      expect(screen.getByText('Loading settings...')).toBeInTheDocument();
    });

    it('displays margin controls for all sides', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      expect(screen.getByText('top')).toBeInTheDocument();
      expect(screen.getByText('bottom')).toBeInTheDocument();
      expect(screen.getByText('left')).toBeInTheDocument();
      expect(screen.getByText('right')).toBeInTheDocument();
    });

    it('displays current margin values', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Default margins are 0.5"
      const marginDisplays = screen.getAllByText('0.50"');
      expect(marginDisplays).toHaveLength(4); // top, bottom, left, right
    });
  });

  describe('Page Size Selection', () => {
    it('highlights Letter by default', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      const letterButton = screen.getByText('Letter (8.5" x 11")').closest('button');
      expect(letterButton).toHaveClass('border-green-500', 'bg-green-50');
    });

    it('updates selection when A4 is clicked', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      const a4Button = screen.getByText('A4 (210mm x 297mm)').closest('button');
      fireEvent.click(a4Button!);

      expect(a4Button).toHaveClass('border-green-500', 'bg-green-50');
    });

    it('highlights A4 when loaded from storage', async () => {
      const a4Settings: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        defaultConfig: {
          ...DEFAULT_USER_SETTINGS.defaultConfig,
          pageSize: 'A4',
        },
      };
      vi.mocked(settingsStore.loadSettings).mockResolvedValue(a4Settings);

      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        const a4Button = screen.getByText('A4 (210mm x 297mm)').closest('button');
        expect(a4Button).toHaveClass('border-green-500', 'bg-green-50');
      });
    });
  });

  describe('Margin Controls', () => {
    it('updates margin value when slider is moved', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      const sliders = screen.getAllByRole('slider');
      const topSlider = sliders.find((s) => s.getAttribute('aria-label')?.includes('top'));
      fireEvent.change(topSlider!, { target: { value: '0.75' } });

      await waitFor(() => {
        const displays = screen.getAllByText('0.75"');
        expect(displays.length).toBeGreaterThan(0);
      });
    });

    it('displays updated margin values in real-time', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      const leftSlider = screen
        .getByText('left')
        .parentElement!.querySelector('input[type="range"]');
      fireEvent.change(leftSlider!, { target: { value: '1.0' } });

      await waitFor(() => {
        expect(screen.getByText('1.00"')).toBeInTheDocument();
      });
    });
  });

  describe('Reset to Defaults', () => {
    it('shows confirmation modal when Reset button is clicked', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      const resetButton = screen.getByText('Reset to Defaults');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/Reset Settings/i)).toBeInTheDocument();
      });
    });

    it('does not reset if user cancels confirmation', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      const resetButton = screen.getByText('Reset to Defaults');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/Reset Settings/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(settingsStore.resetSettings).not.toHaveBeenCalled();
    });

    it('resets settings if user confirms', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      const resetButton = screen.getByText('Reset to Defaults');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/Reset Settings/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Reset to Defaults/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(settingsStore.resetSettings).toHaveBeenCalled();
      });
    });

    it('shows success message after reset', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      const resetButton = screen.getByText('Reset to Defaults');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/Reset Settings/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Reset to Defaults/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Settings saved!')).toBeInTheDocument();
      });
    });

    it('reloads default values after reset', async () => {
      const a4Settings: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        defaultConfig: {
          ...DEFAULT_USER_SETTINGS.defaultConfig,
          pageSize: 'A4',
        },
      };

      // Initially load A4 settings
      vi.mocked(settingsStore.loadSettings).mockResolvedValueOnce(a4Settings);
      // After reset, load Letter settings
      vi.mocked(settingsStore.loadSettings).mockResolvedValueOnce(DEFAULT_USER_SETTINGS);

      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        const a4Button = screen.getByText('A4 (210mm x 297mm)').closest('button');
        expect(a4Button).toHaveClass('border-green-500');
      });

      const resetButton = screen.getByText('Reset to Defaults');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/Reset Settings/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Reset to Defaults/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        const letterButton = screen.getByText('Letter (8.5" x 11")').closest('button');
        expect(letterButton).toHaveClass('border-green-500');
      });
    });
  });

  describe('Navigation', () => {
    it('calls onBack when back button is clicked', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      const backButton = screen.getByLabelText('Back to main screen');
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation through interactive elements', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      const backButton = screen.getByLabelText('Back to main screen');
      const resetButton = screen.getByText('Reset to Defaults');

      expect(backButton).toBeInTheDocument();
      expect(resetButton).toBeInTheDocument();
    });
  });
});
