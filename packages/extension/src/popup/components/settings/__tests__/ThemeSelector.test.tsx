/**
 * ThemeSelector Component Tests
 * Theme selection and accessibility
 * Updated for radio input pattern
 */

import { fireEvent, render, screen } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDarkMode } from '@/popup/reactivity/theme';
import { ThemeSelector } from '../ThemeSelector';

// Mock createDarkMode reactivity module
let mockTheme = 'light';
const mockSetTheme = vi.fn();
vi.mock('@/popup/reactivity/theme', () => ({
  createDarkMode: vi.fn(() => ({
    theme: () => mockTheme,
    setTheme: mockSetTheme,
  })),
}));

describe('ThemeSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTheme = 'light';
  });

  describe('Rendering', () => {
    it('renders all three theme options', () => {
      render(() => <ThemeSelector />);

      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('Auto')).toBeInTheDocument();
    });

    it('displays theme label', () => {
      render(() => <ThemeSelector />);

      expect(screen.getByText('Theme')).toBeInTheDocument();
    });

    it('shows status text for current theme', () => {
      render(() => <ThemeSelector />);

      expect(screen.getByText('Always use light mode')).toBeInTheDocument();
    });
  });

  describe('Theme Selection', () => {
    it('calls setTheme with "light" when Light radio clicked', () => {
      // Start with dark theme so clicking light will trigger onChange
      mockTheme = 'dark';
      render(() => <ThemeSelector />);

      const lightRadio = screen.getByRole('radio', { name: /light/i });
      fireEvent.click(lightRadio);

      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('calls setTheme with "dark" when Dark radio clicked', () => {
      render(() => <ThemeSelector />);

      const darkRadio = screen.getByRole('radio', { name: /dark/i });
      fireEvent.click(darkRadio);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('calls setTheme with "auto" when Auto radio clicked', () => {
      render(() => <ThemeSelector />);

      const autoRadio = screen.getByRole('radio', { name: /auto/i });
      fireEvent.click(autoRadio);

      expect(mockSetTheme).toHaveBeenCalledWith('auto');
    });
  });

  describe('Visual State', () => {
    it('shows light theme as selected', () => {
      mockTheme = 'light';
      render(() => <ThemeSelector />);

      const lightRadio = screen.getByRole('radio', { name: /light/i });
      expect(lightRadio).toBeChecked();
    });

    it('shows dark theme as selected', () => {
      mockTheme = 'dark';
      render(() => <ThemeSelector />);

      const darkRadio = screen.getByRole('radio', { name: /dark/i });
      expect(darkRadio).toBeChecked();
    });

    it('shows auto theme as selected', () => {
      mockTheme = 'auto';
      render(() => <ThemeSelector />);

      const autoRadio = screen.getByRole('radio', { name: /auto/i });
      expect(autoRadio).toBeChecked();
    });

    it('displays correct status text for auto theme', () => {
      mockTheme = 'auto';
      render(() => <ThemeSelector />);

      expect(screen.getByText('Follows your system preference')).toBeInTheDocument();
    });

    it('displays correct status text for dark theme', () => {
      mockTheme = 'dark';
      render(() => <ThemeSelector />);

      expect(screen.getByText('Always use dark mode')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible radio labels', () => {
      render(() => <ThemeSelector />);

      expect(screen.getByRole('radio', { name: /light/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /dark/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /auto/i })).toBeInTheDocument();
    });

    it('uses radiogroup role for semantic grouping', () => {
      render(() => <ThemeSelector />);

      const radiogroup = screen.getByRole('radiogroup', { name: /theme selection/i });
      expect(radiogroup).toBeInTheDocument();
    });

    it('uses checked state to indicate selection', () => {
      render(() => <ThemeSelector />);

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(3);

      // Exactly one should be checked
      const checkedRadios = radios.filter((radio) => (radio as HTMLInputElement).checked);
      expect(checkedRadios).toHaveLength(1);
    });

    it('is keyboard accessible', () => {
      // Start with dark theme
      mockTheme = 'dark';
      render(() => <ThemeSelector />);

      // Focus the dark radio directly
      const darkRadio = screen.getByRole('radio', { name: /dark/i });
      darkRadio.focus();
      expect(darkRadio).toHaveFocus();
    });
  });

  describe('Icons', () => {
    it('renders sun icon for light theme', () => {
      render(() => <ThemeSelector />);

      // Find the label containing the Light radio
      const lightRadio = screen.getByRole('radio', { name: /light/i });
      const label = lightRadio.closest('label');
      const svg = label?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders moon icon for dark theme', () => {
      render(() => <ThemeSelector />);

      const darkRadio = screen.getByRole('radio', { name: /dark/i });
      const label = darkRadio.closest('label');
      const svg = label?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders computer icon for auto theme', () => {
      render(() => <ThemeSelector />);

      const autoRadio = screen.getByRole('radio', { name: /auto/i });
      const label = autoRadio.closest('label');
      const svg = label?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});
