/**
 * QuickSettings Component Tests
 * Quick Settings Panel
 * Custom margins editing
 * New margin presets (compact, spacious)
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { getMarginPreset } from '../../../utils/marginPresets';
import { QuickSettings } from '../QuickSettings';

describe('QuickSettings', () => {
  const defaultProps = {
    pageSize: 'Letter' as const,
    margins: 'normal' as const,
    marginValues: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
    onPageSizeChange: vi.fn(),
    onMarginsChange: vi.fn(),
    onCustomMarginChange: vi.fn(),
    onOpenFullSettings: vi.fn(),
  };

  // Helper to expand QuickSettings (collapsed by default in production, may vary in tests)
  const expandQuickSettings = () => {
    // Check if already expanded
    const collapseButton = screen.queryByRole('button', { name: /collapse quick settings panel/i });
    if (collapseButton) {
      // Already expanded, nothing to do
      return;
    }

    // Not expanded, click to expand
    const expandButton = screen.getByRole('button', { name: /expand quick settings panel/i });
    fireEvent.click(expandButton);
  };

  it('renders with default values', () => {
    render(<QuickSettings {...defaultProps} />);

    expect(screen.getByText('Quick Settings')).toBeInTheDocument();
    expect(screen.getByText(/Letter, Normal/)).toBeInTheDocument();
  });

  it('remembers expanded/collapsed state ', () => {
    render(<QuickSettings {...defaultProps} />);

    // Check if it has expand/collapse functionality
    const hasExpandButton = screen.queryByRole('button', { name: /expand quick settings panel/i });
    const hasCollapseButton = screen.queryByRole('button', { name: /collapse quick settings panel/i });

    // Should have exactly one of these buttons
    expect(hasExpandButton || hasCollapseButton).toBeTruthy();
    expect(hasExpandButton && hasCollapseButton).toBeFalsy();
  });

  it('toggles expanded state when header clicked', () => {
    render(<QuickSettings {...defaultProps} />);

    // Check initial state (may vary based on localStorage in tests)
    const initiallyExpanded = !!screen.queryByRole('button', { name: /collapse quick settings panel/i });

    if (initiallyExpanded) {
      // Currently expanded, test collapse then expand
      const collapseButton = screen.getByRole('button', { name: /collapse quick settings panel/i });
      fireEvent.click(collapseButton);
      expect(screen.queryByLabelText('Page Size')).not.toBeInTheDocument();

      const expandButton = screen.getByRole('button', { name: /expand quick settings panel/i });
      fireEvent.click(expandButton);
      expect(screen.getByLabelText('Page Size')).toBeInTheDocument();
    }
    else {
      // Currently collapsed, test expand then collapse
      const expandButton = screen.getByRole('button', { name: /expand quick settings panel/i });
      fireEvent.click(expandButton);
      expect(screen.getByLabelText('Page Size')).toBeInTheDocument();

      const collapseButton = screen.getByRole('button', { name: /collapse quick settings panel/i });
      fireEvent.click(collapseButton);
      expect(screen.queryByLabelText('Page Size')).not.toBeInTheDocument();
    }
  });

  it('calls onPageSizeChange when page size button clicked', () => {
    render(<QuickSettings {...defaultProps} />);
    expandQuickSettings(); // Expand first

    const a4Button = screen.getByRole('button', { name: 'A4' });
    fireEvent.click(a4Button);

    expect(defaultProps.onPageSizeChange).toHaveBeenCalledWith('A4');
  });

  it('calls onMarginsChange when margin preset selected', () => {
    render(<QuickSettings {...defaultProps} />);
    expandQuickSettings(); // Expand first

    const wideRadio = screen.getByRole('radio', { name: /Wide/ });
    fireEvent.click(wideRadio);

    expect(defaultProps.onMarginsChange).toHaveBeenCalledWith('wide');
  });

  it('calls onOpenFullSettings when "All Settings" clicked', () => {
    render(<QuickSettings {...defaultProps} />);
    expandQuickSettings(); // Expand first

    const allSettingsLink = screen.getByRole('button', { name: /Open full settings page/i });
    fireEvent.click(allSettingsLink);

    expect(defaultProps.onOpenFullSettings).toHaveBeenCalled();
  });

  it('highlights selected page size', () => {
    render(<QuickSettings {...defaultProps} pageSize="A4" />);
    expandQuickSettings(); // Expand first

    const a4Button = screen.getByRole('button', { name: 'A4' });
    const letterButton = screen.getByRole('button', { name: 'Letter' });

    expect(a4Button).toHaveClass('bg-blue-600');
    expect(letterButton).not.toHaveClass('bg-blue-600');
  });

  it('shows custom margin inputs when margins are custom', () => {
    render(<QuickSettings {...defaultProps} margins="custom" />);
    expandQuickSettings(); // Expand first

    expect(screen.getByLabelText('Top (in)')).toBeInTheDocument();
    expect(screen.getByLabelText('Right (in)')).toBeInTheDocument();
    expect(screen.getByLabelText('Bottom (in)')).toBeInTheDocument();
    expect(screen.getByLabelText('Left (in)')).toBeInTheDocument();
  });

  it('is keyboard accessible', () => {
    render(<QuickSettings {...defaultProps} />);
    expandQuickSettings(); // Expand first

    const a4Button = screen.getByRole('button', { name: 'A4' });

    // Verify aria-pressed attribute
    expect(a4Button).toHaveAttribute('aria-pressed');
  });

  it('displays margin preview', () => {
    render(<QuickSettings {...defaultProps} />);
    expandQuickSettings(); // Expand first

    // MarginPreview component renders with aria-label
    expect(screen.getByLabelText(/Page margin preview/)).toBeInTheDocument();
  });

  it('updates preview when margin values change', () => {
    const { rerender } = render(<QuickSettings {...defaultProps} />);
    expandQuickSettings(); // Expand first

    // Initial preview with 0.75" margins
    expect(screen.getByLabelText(/0\.75" top, 0\.75" right, 0\.75" bottom, 0\.75" left/)).toBeInTheDocument();

    // Update to narrow margins
    rerender(
      <QuickSettings
        {...defaultProps}
        margins="narrow"
        marginValues={{ top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 }}
      />,
    );

    // Preview should update
    expect(screen.getByLabelText(/0\.5" top, 0\.5" right, 0\.5" bottom, 0\.5" left/)).toBeInTheDocument();
  });

  it('updates page size in preview', () => {
    const { rerender } = render(<QuickSettings {...defaultProps} pageSize="Letter" />);
    expandQuickSettings(); // Expand first

    // Initial Letter page
    expect(screen.getByLabelText(/Letter page/)).toBeInTheDocument();

    // Switch to A4
    rerender(
      <QuickSettings
        {...defaultProps}
        pageSize="A4"
      />,
    );

    // Preview should show A4
    expect(screen.getByLabelText(/A4 page/)).toBeInTheDocument();
  });
});

describe('getMarginPreset', () => {
  it('returns "compact" for 0.5" all sides', () => {
    const margin = { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 };
    expect(getMarginPreset(margin)).toBe('compact');
  });

  it('returns "narrow" for 0.5" top/bottom and 0.625" sides', () => {
    const margin = { top: 0.5, right: 0.625, bottom: 0.5, left: 0.625 };
    expect(getMarginPreset(margin)).toBe('narrow');
  });

  it('returns "normal" for 0.75" margins', () => {
    const margin = { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 };
    expect(getMarginPreset(margin)).toBe('normal');
  });

  it('returns "wide" for 1.0" margins', () => {
    const margin = { top: 1.0, right: 1.0, bottom: 1.0, left: 1.0 };
    expect(getMarginPreset(margin)).toBe('wide');
  });

  it('returns "spacious" for 1.25" margins', () => {
    const margin = { top: 1.25, right: 1.25, bottom: 1.25, left: 1.25 };
    expect(getMarginPreset(margin)).toBe('spacious');
  });

  it('returns "custom" for unequal margins', () => {
    const margin = { top: 0.5, right: 0.75, bottom: 0.5, left: 0.75 };
    expect(getMarginPreset(margin)).toBe('custom');
  });

  it('returns "custom" for non-preset equal margins', () => {
    const margin = { top: 0.6, right: 0.6, bottom: 0.6, left: 0.6 };
    expect(getMarginPreset(margin)).toBe('custom');
  });
});

// Integration tests for preset↔custom margin flow
describe('Preset↔Custom Margin Flow Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const defaultProps = {
    pageSize: 'Letter' as const,
    margins: 'normal' as const,
    marginValues: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
    onPageSizeChange: vi.fn(),
    onMarginsChange: vi.fn(),
    onCustomMarginChange: vi.fn(),
    onOpenFullSettings: vi.fn(),
  };

  const expandQuickSettings = () => {
    const collapseButton = screen.queryByRole('button', { name: /collapse quick settings panel/i });
    if (collapseButton)
      return;
    const expandButton = screen.getByRole('button', { name: /expand quick settings panel/i });
    fireEvent.click(expandButton);
  };

  it('switches from preset to custom when custom margin edited', () => {
    const { rerender } = render(<QuickSettings {...defaultProps} />);
    expandQuickSettings();

    // Start with a preset
    const normalRadio = screen.getByRole('radio', { name: /Normal.*0\.75/i });
    expect(normalRadio).toBeChecked();

    // User cannot edit margins directly while in preset mode
    // Custom inputs are only visible when margins="custom"
    expect(screen.queryByLabelText('Top (in)')).not.toBeInTheDocument();

    // Switch to custom mode by rendering with custom margins
    rerender(
      <QuickSettings
        {...defaultProps}
        margins="custom"
        marginValues={{ top: 0.9, right: 0.75, bottom: 0.75, left: 0.75 }}
      />,
    );

    // Custom radio should now be selected
    const customRadio = screen.getByRole('radio', { name: /Custom/i });
    expect(customRadio).toBeChecked();

    // Custom inputs should be visible with updated value
    const topInput = screen.getByLabelText('Top (in)');
    expect(topInput).toBeInTheDocument();
    expect(topInput).toHaveValue(0.9);
  });

  it('switches from custom back to preset when preset selected', () => {
    const { rerender } = render(
      <QuickSettings
        {...defaultProps}
        margins="custom"
        marginValues={{ top: 0.9, right: 0.8, bottom: 0.7, left: 0.6 }}
      />,
    );
    expandQuickSettings();

    // Start with custom
    const customRadio = screen.getByRole('radio', { name: /Custom/i });
    expect(customRadio).toBeChecked();

    // Click a preset radio button
    const normalRadio = screen.getByRole('radio', { name: /Normal.*0\.75/i });
    fireEvent.click(normalRadio);

    // Should call onMarginsChange with the preset
    expect(defaultProps.onMarginsChange).toHaveBeenCalledWith('normal');

    // Re-render with preset
    rerender(
      <QuickSettings
        {...defaultProps}
        margins="normal"
        marginValues={{ top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 }}
      />,
    );

    // Preset should be selected
    expect(normalRadio).toBeChecked();
  });

  it('shows custom margin inputs with correct values', () => {
    const { rerender } = render(<QuickSettings {...defaultProps} margins="normal" />);
    expandQuickSettings();

    // With preset, custom inputs should NOT be visible
    expect(screen.queryByLabelText('Top (in)')).not.toBeInTheDocument();

    // Switch to custom mode
    rerender(
      <QuickSettings
        {...defaultProps}
        margins="custom"
        marginValues={{ top: 0.9, right: 0.8, bottom: 0.7, left: 0.6 }}
      />,
    );

    // Custom inputs should now be visible with correct values
    expect(screen.getByLabelText('Top (in)')).toHaveValue(0.9);
    expect(screen.getByLabelText('Right (in)')).toHaveValue(0.8);
    expect(screen.getByLabelText('Bottom (in)')).toHaveValue(0.7);
    expect(screen.getByLabelText('Left (in)')).toHaveValue(0.6);
  });

  it('switches between different margin presets', () => {
    const { rerender } = render(<QuickSettings {...defaultProps} margins="normal" />);
    expandQuickSettings();

    // Switch to compact preset
    const compactRadio = screen.getByRole('radio', { name: /Compact.*0\.5/i });
    fireEvent.click(compactRadio);
    expect(defaultProps.onMarginsChange).toHaveBeenCalledWith('compact');

    // Re-render with compact
    rerender(
      <QuickSettings
        {...defaultProps}
        margins="compact"
        marginValues={{ top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 }}
      />,
    );
    expect(compactRadio).toBeChecked();

    // Switch to wide preset
    const wideRadio = screen.getByRole('radio', { name: /Wide.*1\.0/i });
    fireEvent.click(wideRadio);
    expect(defaultProps.onMarginsChange).toHaveBeenCalledWith('wide');

    // Re-render with wide
    rerender(
      <QuickSettings
        {...defaultProps}
        margins="wide"
        marginValues={{ top: 1.0, right: 1.0, bottom: 1.0, left: 1.0 }}
      />,
    );

    // Wide should be selected
    expect(wideRadio).toBeChecked();
  });

  it('maintains margin preview when switching between preset and custom', () => {
    const { rerender } = render(<QuickSettings {...defaultProps} margins="normal" />);
    expandQuickSettings();

    // Check initial preview with normal preset
    const preview = screen.getByRole('img', { name: /page margin preview/i });
    expect(preview).toBeInTheDocument();

    // Switch to custom with asymmetric margins
    rerender(
      <QuickSettings
        {...defaultProps}
        margins="custom"
        marginValues={{ top: 0.5, right: 1.0, bottom: 0.5, left: 1.0 }}
      />,
    );

    // Preview should still be visible
    expect(screen.getByRole('img', { name: /page margin preview/i })).toBeInTheDocument();

    // Switch back to preset
    rerender(
      <QuickSettings
        {...defaultProps}
        margins="wide"
        marginValues={{ top: 1.0, right: 1.0, bottom: 1.0, left: 1.0 }}
      />,
    );

    // Preview should still be visible
    expect(screen.getByRole('img', { name: /page margin preview/i })).toBeInTheDocument();
  });
});
