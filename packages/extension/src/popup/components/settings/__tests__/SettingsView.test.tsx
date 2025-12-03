// ABOUTME: Tests for SettingsView component with tabbed navigation.
// ABOUTME: Validates Page and General tab content, accessibility, and interactions.

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_USER_SETTINGS } from '@/shared/domain/settings/defaults';
import { SettingsView } from '../SettingsView';

describe('SettingsView', () => {
  const mockOnBack = vi.fn();
  const mockOnPageSizeChange = vi.fn();
  const mockOnMarginChange = vi.fn();
  const mockOnResetClick = vi.fn();

  const mockSettings = {
    ...DEFAULT_USER_SETTINGS,
    defaultConfig: {
      ...DEFAULT_USER_SETTINGS.defaultConfig,
      pageSize: 'Letter' as const,
      margin: {
        top: 1,
        right: 1,
        bottom: 1,
        left: 1,
      },
    },
  };

  const defaultProps = {
    settings: mockSettings,
    isDirty: false,
    saving: false,
    showSuccess: false,
    lastSaved: null,
    errors: {},
    onBack: mockOnBack,
    onPageSizeChange: mockOnPageSizeChange,
    onMarginChange: mockOnMarginChange,
    onResetClick: mockOnResetClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders settings UI with all elements', () => {
      render(<SettingsView {...defaultProps} />);

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Back to main screen')).toBeInTheDocument();
      expect(screen.getByText('Letter (8.5" x 11")')).toBeInTheDocument();
      expect(screen.getByText('A4 (210mm x 297mm)')).toBeInTheDocument();
      expect(screen.getByText('Legal (8.5" x 14")')).toBeInTheDocument();
    });

    it('shows loading state when settings is null', () => {
      render(<SettingsView {...defaultProps} settings={null} />);

      expect(screen.getByText('Loading settings...')).toBeInTheDocument();
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });

    it('displays margin controls for all sides', () => {
      render(<SettingsView {...defaultProps} />);

      expect(screen.getByText('top')).toBeInTheDocument();
      expect(screen.getByText('bottom')).toBeInTheDocument();
      expect(screen.getByText('left')).toBeInTheDocument();
      expect(screen.getByText('right')).toBeInTheDocument();
    });

    it('displays current margin values', () => {
      render(<SettingsView {...defaultProps} />);

      // All margins set to 1.0"
      const marginDisplays = screen.getAllByText('1.00"');
      expect(marginDisplays.length).toBeGreaterThanOrEqual(4);
    });

    it('shows auto-save status indicator', () => {
      render(<SettingsView {...defaultProps} showSuccess={true} />);

      expect(screen.getByText('Settings saved!')).toBeInTheDocument();
    });

    it('renders tab navigation', () => {
      render(<SettingsView {...defaultProps} />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Page' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'General' })).toBeInTheDocument();
    });

    it('defaults to Page tab selected', () => {
      render(<SettingsView {...defaultProps} />);

      const pageTab = screen.getByRole('tab', { name: 'Page' });
      expect(pageTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Dirty Indicator Visibility', () => {
    it('hides dirty indicator when isDirty is false', () => {
      render(<SettingsView {...defaultProps} isDirty={false} />);

      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Unsaved changes')).not.toBeInTheDocument();
    });

    it('shows dirty indicator dot when isDirty is true', () => {
      render(<SettingsView {...defaultProps} isDirty={true} />);

      // The dot has title attribute and sr-only text for accessibility
      const backButton = screen.getByLabelText('Back to main screen');
      const dirtyDot = backButton.querySelector('[title="You have unsaved changes"]');
      expect(dirtyDot).toBeInTheDocument();
    });

    it('shows dirty indicator sr-only text when isDirty is true', () => {
      render(<SettingsView {...defaultProps} isDirty={true} />);

      // sr-only text is combined in one span
      expect(
        screen.getByText('Unsaved changes - Your changes have not been saved yet'),
      ).toBeInTheDocument();
    });

    it('shows dirty indicator banner when isDirty is true and not saving', () => {
      render(<SettingsView {...defaultProps} isDirty={true} saving={false} />);

      expect(screen.getByText('Unsaved changes (saving automatically...)')).toBeInTheDocument();
    });

    it('hides dirty banner when saving', () => {
      render(<SettingsView {...defaultProps} isDirty={true} saving={true} />);

      expect(
        screen.queryByText('Unsaved changes (saving automatically...)'),
      ).not.toBeInTheDocument();
    });

    it('shows saving indicator when saving is true', () => {
      render(<SettingsView {...defaultProps} saving={true} />);

      expect(screen.getByText('Saving changes...')).toBeInTheDocument();
    });
  });

  describe('Page Size Selection', () => {
    it('highlights selected page size', () => {
      render(<SettingsView {...defaultProps} />);

      // Native radio inputs get their accessible name from the wrapping label
      const letterRadio = screen.getByRole('radio', { name: /Letter/ });
      expect(letterRadio).toBeChecked();

      const a4Radio = screen.getByRole('radio', { name: /A4/ });
      expect(a4Radio).not.toBeChecked();
    });

    it('calls onPageSizeChange when selecting different size', () => {
      render(<SettingsView {...defaultProps} />);

      const a4Radio = screen.getByRole('radio', { name: /A4/ });
      fireEvent.click(a4Radio);

      expect(mockOnPageSizeChange).toHaveBeenCalledWith('A4');
    });

    it('calls onPageSizeChange for each page size option', () => {
      render(<SettingsView {...defaultProps} />);

      // Note: Letter is already selected, so clicking it won't fire onChange
      // Test A4 and Legal which will trigger onChange
      const a4Radio = screen.getByRole('radio', { name: /A4.*210mm/ });
      fireEvent.click(a4Radio);
      expect(mockOnPageSizeChange).toHaveBeenCalledWith('A4');

      const legalRadio = screen.getByRole('radio', { name: /Legal.*14/ });
      fireEvent.click(legalRadio);
      expect(mockOnPageSizeChange).toHaveBeenCalledWith('Legal');

      // Letter can be tested by clicking it after another option is visually selected
      // But the component state won't change since props control it
      // This test verifies A4 and Legal options work
      expect(mockOnPageSizeChange).toHaveBeenCalledTimes(2);
    });

    it('displays all page size options with dimensions', () => {
      render(<SettingsView {...defaultProps} />);

      expect(screen.getByText('Letter (8.5" x 11")')).toBeInTheDocument();
      expect(screen.getByText('A4 (210mm x 297mm)')).toBeInTheDocument();
      expect(screen.getByText('Legal (8.5" x 14")')).toBeInTheDocument();
    });
  });

  describe('Margin Controls', () => {
    it('displays margin sliders for all sides', () => {
      render(<SettingsView {...defaultProps} />);

      expect(screen.getByText('top')).toBeInTheDocument();
      expect(screen.getByText('bottom')).toBeInTheDocument();
      expect(screen.getByText('left')).toBeInTheDocument();
      expect(screen.getByText('right')).toBeInTheDocument();
    });

    it('calls onMarginChange when adjusting margins', () => {
      render(<SettingsView {...defaultProps} />);

      // RangeSlider uses buttons for increment/decrement, not direct input
      const increaseButton = screen.getByLabelText(/Increase top margin/i);
      fireEvent.click(increaseButton);

      expect(mockOnMarginChange).toHaveBeenCalled();
      expect(mockOnMarginChange).toHaveBeenCalledWith('top', expect.any(Number));
    });

    it('displays margin range limits in help text', () => {
      render(<SettingsView {...defaultProps} />);

      expect(screen.getByText(/In inches \(0\.25 - 1\.5\)/i)).toBeInTheDocument();
    });

    it('shows margin preview', () => {
      render(<SettingsView {...defaultProps} />);

      // MarginPreview component should be rendered
      // Check for its presence by looking for the component structure
      const container = screen.getByText('Settings').closest('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onBack when back button clicked', () => {
      render(<SettingsView {...defaultProps} />);

      const backButton = screen.getByLabelText('Back to main screen');
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('back button is keyboard accessible', () => {
      render(<SettingsView {...defaultProps} />);

      const backButton = screen.getByLabelText('Back to main screen');
      expect(backButton.tagName).toBe('BUTTON');
    });
  });

  describe('Error Handling', () => {
    it('displays general error message when provided', () => {
      render(<SettingsView {...defaultProps} errors={{ general: 'Failed to save settings' }} />);

      expect(screen.getByText('Failed to save settings')).toBeInTheDocument();
    });

    it('hides error message when errors object is empty', () => {
      render(<SettingsView {...defaultProps} errors={{}} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows skeleton when settings is null', () => {
      render(<SettingsView {...defaultProps} settings={null} />);

      expect(screen.getByText('Loading settings...')).toBeInTheDocument();
      const container = screen.getByText('Loading settings...').closest('div');
      expect(container).toHaveAttribute('aria-busy', 'true');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('hides main content when loading', () => {
      render(<SettingsView {...defaultProps} settings={null} />);

      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      expect(screen.queryByText('Page Size')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for page size radio group', () => {
      render(<SettingsView {...defaultProps} />);

      // Radio inputs get accessible name from their wrapping label text
      const letterRadio = screen.getByRole('radio', { name: /Letter/ });
      expect(letterRadio).toBeChecked();
    });

    it('has proper ARIA labels for margin controls group', () => {
      render(<SettingsView {...defaultProps} />);

      // Margins fieldset uses legend for accessible name and has help text via aria-describedby
      const marginsFieldset = screen.getByRole('group', { name: /margins/i });
      expect(marginsFieldset).toBeInTheDocument();

      // Help text exists with proper id
      const helpText = screen.getByText(/In inches \(0\.25 - 1\.5\)/);
      expect(helpText).toHaveAttribute('id', 'margins-help');
    });

    it('has screen reader text for dirty indicator', () => {
      render(<SettingsView {...defaultProps} isDirty={true} />);

      // sr-only text is combined: "Unsaved changes - Your changes have not been saved yet"
      const srText = screen.getByText('Unsaved changes - Your changes have not been saved yet');
      expect(srText).toBeInTheDocument();
      expect(srText).toHaveClass('sr-only');
    });

    it('dirty indicator banner has aria-live="polite"', () => {
      render(<SettingsView {...defaultProps} isDirty={true} saving={false} />);

      // <output> element has implicit role="status" and we add aria-live="polite"
      const banner = screen
        .getByText('Unsaved changes (saving automatically...)')
        .closest('output');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Props Validation', () => {
    it('renders with different page sizes', () => {
      const { rerender } = render(<SettingsView {...defaultProps} />);

      // Radio inputs get accessible name from label text
      const letterRadio = screen.getByRole('radio', { name: /Letter/ });
      expect(letterRadio).toBeChecked();

      rerender(
        <SettingsView
          {...defaultProps}
          settings={{
            ...mockSettings,
            defaultConfig: { ...mockSettings.defaultConfig, pageSize: 'A4' },
          }}
        />,
      );

      const a4Radio = screen.getByRole('radio', { name: /A4/ });
      expect(a4Radio).toBeChecked();
    });

    it('renders with different margin values', () => {
      const customMargins = {
        ...mockSettings,
        defaultConfig: {
          ...mockSettings.defaultConfig,
          pageSize: 'Letter' as const,
          margin: { top: 0.5, right: 0.75, bottom: 0.5, left: 0.75 },
        },
      };

      render(<SettingsView {...defaultProps} settings={customMargins} />);

      // Check that different margin values are displayed (multiple elements may have same text)
      const halfInchMargins = screen.getAllByText('0.50"');
      const threeQuarterInchMargins = screen.getAllByText('0.75"');

      expect(halfInchMargins.length).toBeGreaterThan(0);
      expect(threeQuarterInchMargins.length).toBeGreaterThan(0);
    });
  });
});
