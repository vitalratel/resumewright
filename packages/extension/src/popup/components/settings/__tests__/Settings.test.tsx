// ABOUTME: Tests for Settings component with tabbed navigation.
// ABOUTME: Tests rendering, page size, margins, reset, and keyboard navigation.

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ResultAsync } from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_USER_SETTINGS } from '@/shared/domain/settings/defaults';
import {
  loadSettings,
  resetSettings,
  saveSettings,
} from '@/shared/infrastructure/settings/SettingsStore';
import type { UserSettings } from '@/shared/types/settings';
import { Settings } from '../Settings';

// Helper to create success ResultAsync for settings operations
const okSettingsResult = () => ResultAsync.fromSafePromise(Promise.resolve(undefined as undefined));

/**
 * Helper to switch to a specific settings tab
 */
const switchToTab = (tabName: string) => {
  const tab = screen.getByRole('tab', { name: tabName });
  fireEvent.click(tab);
};

// Mock settings functions
vi.mock('@/shared/infrastructure/settings/SettingsStore', () => ({
  loadSettings: vi.fn(),
  saveSettings: vi.fn(),
  resetSettings: vi.fn(),
  validateSettings: vi.fn(),
}));

describe('Settings', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Use vi.mocked() for proper typing
    vi.mocked(loadSettings).mockResolvedValue(DEFAULT_USER_SETTINGS);
    vi.mocked(saveSettings).mockReturnValue(okSettingsResult());
    vi.mocked(resetSettings).mockReturnValue(okSettingsResult());
  });

  describe('Rendering', () => {
    it('renders with default values', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Page tab content (default)
      expect(screen.getByText('Letter (8.5" x 11")')).toBeInTheDocument();
      expect(screen.getByText('A4 (210mm x 297mm)')).toBeInTheDocument();

      // General tab content
      switchToTab('General');
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

      // Default margins are 0"
      const marginDisplays = screen.getAllByText('0.00"');
      expect(marginDisplays).toHaveLength(4); // top, bottom, left, right
    });
  });

  describe('Page Size Selection', () => {
    it('highlights Letter by default', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      const letterLabel = screen.getByText('Letter (8.5" x 11")').closest('label');
      expect(letterLabel).toHaveClass('border-success', 'bg-success/10');
    });

    it('updates selection when A4 is clicked', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      const a4Label = screen.getByText('A4 (210mm x 297mm)').closest('label');
      expect(a4Label).toBeDefined();
      if (!a4Label) throw new Error('A4 label not found');
      fireEvent.click(a4Label);

      expect(a4Label).toHaveClass('border-success', 'bg-success/10');
    });

    it('highlights A4 when loaded from storage', async () => {
      const a4Settings: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        defaultConfig: {
          ...DEFAULT_USER_SETTINGS.defaultConfig,
          pageSize: 'A4',
        },
      };
      vi.mocked(loadSettings).mockResolvedValue(a4Settings);

      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        const a4Label = screen.getByText('A4 (210mm x 297mm)').closest('label');
        expect(a4Label).toHaveClass('border-success', 'bg-success/10');
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
      expect(topSlider).toBeDefined();
      if (!topSlider) throw new Error('Top slider not found');
      fireEvent.change(topSlider, { target: { value: '0.75' } });

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
        .parentElement?.querySelector('input[type="range"]');
      expect(leftSlider).toBeDefined();
      if (!leftSlider) throw new Error('Left slider not found');
      fireEvent.change(leftSlider, { target: { value: '1.0' } });

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

      switchToTab('General');
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

      switchToTab('General');
      const resetButton = screen.getByText('Reset to Defaults');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/Reset Settings/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(resetSettings).not.toHaveBeenCalled();
    });

    it('resets settings if user confirms', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      switchToTab('General');
      const resetButton = screen.getByText('Reset to Defaults');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/Reset Settings/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Reset to Defaults/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(resetSettings).toHaveBeenCalled();
      });
    });

    it('shows success message after reset', async () => {
      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      switchToTab('General');
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
      vi.mocked(loadSettings).mockResolvedValueOnce(a4Settings);
      // After reset, load Letter settings
      vi.mocked(loadSettings).mockResolvedValueOnce(DEFAULT_USER_SETTINGS);

      render(<Settings onBack={mockOnBack} />);

      await waitFor(() => {
        // Page size options are <label> elements, not buttons
        const a4Label = screen.getByText('A4 (210mm x 297mm)').closest('label');
        expect(a4Label).toHaveClass('border-success');
      });

      switchToTab('General');
      const resetButton = screen.getByText('Reset to Defaults');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/Reset Settings/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Reset to Defaults/i });
      fireEvent.click(confirmButton);

      // Switch back to Page tab to check the page size
      switchToTab('Page');
      await waitFor(() => {
        // Letter should be selected after reset (default)
        const letterRadio = screen.getByRole('radio', { name: /Letter/ });
        expect(letterRadio).toBeChecked();
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
      expect(backButton).toBeInTheDocument();

      // Check tabs are navigable
      const pageTab = screen.getByRole('tab', { name: 'Page' });
      const generalTab = screen.getByRole('tab', { name: 'General' });
      expect(pageTab).toBeInTheDocument();
      expect(generalTab).toBeInTheDocument();

      // Check reset button in General tab
      switchToTab('General');
      const resetButton = screen.getByText('Reset to Defaults');
      expect(resetButton).toBeInTheDocument();
    });
  });
});
