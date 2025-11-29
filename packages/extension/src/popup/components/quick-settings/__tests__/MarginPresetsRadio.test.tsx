/**
 * MarginPresetsRadio Component Tests
 * Quick Settings Panel - Margin Presets
 * Added compact and spacious presets
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarginPresetsRadio } from '../MarginPresetsRadio';

describe('MarginPresetsRadio', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all five preset options', () => {
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      expect(screen.getByRole('radio', { name: /Compact/ })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Narrow/ })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Normal/ })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Wide/ })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Spacious/ })).toBeInTheDocument();
    });

    it('should render custom option', () => {
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      expect(screen.getByRole('radio', { name: /Custom/ })).toBeInTheDocument();
    });

    it('should render Margins label', () => {
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      expect(screen.getByText('Margins')).toBeInTheDocument();
    });

    it('should render radio group with accessible name', () => {
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      const group = screen.getByRole('group', { name: /Margin presets/i });
      expect(group).toBeInTheDocument();
    });

    it('should show descriptions for each preset', () => {
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      expect(screen.getByText(/0\.5" all sides/)).toBeInTheDocument();
      expect(screen.getByText(/0\.5" top\/bottom, 0\.625" sides/)).toBeInTheDocument();
      expect(screen.getByText(/0\.75" all sides/)).toBeInTheDocument();
      expect(screen.getByText(/1\.0" all sides/)).toBeInTheDocument();
      expect(screen.getByText(/1\.25" all sides/)).toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('should show compact as checked when value is compact', () => {
      render(<MarginPresetsRadio value="compact" onChange={mockOnChange} />);

      const compactRadio = screen.getByRole('radio', { name: /Compact/ });
      expect(compactRadio).toBeChecked();
    });

    it('should show narrow as checked when value is narrow', () => {
      render(<MarginPresetsRadio value="narrow" onChange={mockOnChange} />);

      const narrowRadio = screen.getByRole('radio', { name: /Narrow/ });
      expect(narrowRadio).toBeChecked();
    });

    it('should show normal as checked when value is normal', () => {
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      const normalRadio = screen.getByRole('radio', { name: /Normal/ });
      expect(normalRadio).toBeChecked();
    });

    it('should show wide as checked when value is wide', () => {
      render(<MarginPresetsRadio value="wide" onChange={mockOnChange} />);

      const wideRadio = screen.getByRole('radio', { name: /Wide/ });
      expect(wideRadio).toBeChecked();
    });

    it('should show spacious as checked when value is spacious', () => {
      render(<MarginPresetsRadio value="spacious" onChange={mockOnChange} />);

      const spaciousRadio = screen.getByRole('radio', { name: /Spacious/ });
      expect(spaciousRadio).toBeChecked();
    });

    it('should show custom as checked when value is custom', () => {
      render(<MarginPresetsRadio value="custom" onChange={mockOnChange} />);

      const customRadio = screen.getByRole('radio', { name: /Custom/ });
      expect(customRadio).toBeChecked();
    });

    it('should only check one radio at a time', () => {
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      const checkedRadios = screen.getAllByRole('radio').filter(radio => (radio as HTMLInputElement).checked);
      expect(checkedRadios).toHaveLength(1);
    });
  });

  describe('User Interactions', () => {
    it('should call onChange with compact when compact selected', async () => {
      const user = userEvent.setup();
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      const compactRadio = screen.getByRole('radio', { name: /Compact/ });
      await user.click(compactRadio);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('compact');
    });

    it('should call onChange with narrow when narrow selected', async () => {
      const user = userEvent.setup();
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      const narrowRadio = screen.getByRole('radio', { name: /Narrow/ });
      await user.click(narrowRadio);

      expect(mockOnChange).toHaveBeenCalledWith('narrow');
    });

    it('should call onChange with wide when wide selected', async () => {
      const user = userEvent.setup();
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      const wideRadio = screen.getByRole('radio', { name: /Wide/ });
      await user.click(wideRadio);

      expect(mockOnChange).toHaveBeenCalledWith('wide');
    });

    it('should call onChange with spacious when spacious selected', async () => {
      const user = userEvent.setup();
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      const spaciousRadio = screen.getByRole('radio', { name: /Spacious/ });
      await user.click(spaciousRadio);

      expect(mockOnChange).toHaveBeenCalledWith('spacious');
    });

    it('should NOT call onChange when custom radio clicked', async () => {
      const user = userEvent.setup();
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      const customRadio = screen.getByRole('radio', { name: /Custom/ });
      await user.click(customRadio);

      // Custom is managed by parent, so onChange should not be called
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should allow clicking label to select preset', async () => {
      const user = userEvent.setup();
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      // Click on the label text, not the radio itself
      const compactLabel = screen.getByText(/Compact/).closest('label');
      await user.click(compactLabel!);

      expect(mockOnChange).toHaveBeenCalledWith('compact');
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should be focusable with keyboard', async () => {
      const user = userEvent.setup();
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      await user.tab();

      const normalRadio = screen.getByRole('radio', { name: /Normal/ });
      expect(normalRadio).toHaveFocus();
    });

    it('should have focus ring styles', () => {
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      const normalRadio = screen.getByRole('radio', { name: /Normal/ });
      expect(normalRadio).toHaveClass('focus:outline-none');
      expect(normalRadio).toHaveClass('focus:ring-[3px]');
      expect(normalRadio).toHaveClass('focus:ring-blue-600'); // tokens.effects.focusRing
      expect(normalRadio).toHaveClass('focus:ring-offset-2'); // tokens.effects.focusRing
    });

    it('should support arrow key navigation', async () => {
      const user = userEvent.setup();
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      const normalRadio = screen.getByRole('radio', { name: /Normal/ });
      normalRadio.focus();

      // Arrow down should select next preset
      await user.keyboard('{ArrowDown}');

      expect(mockOnChange).toHaveBeenCalledWith('wide');
    });
  });

  describe('Styling', () => {
    it('should have hover effects on labels', () => {
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      const labels = screen.getAllByRole('radio').map(radio => radio.closest('label'));
      labels.forEach((label) => {
        expect(label).toHaveClass('hover:bg-gray-100'); // tokens.colors.neutral.hover
      });
    });

    it('should have transition effects', () => {
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      const labels = screen.getAllByRole('radio').map(radio => radio.closest('label'));
      labels.forEach((label) => {
        expect(label).toHaveClass('transition-all'); // tokens.transitions.default
      });
    });

    it('should have cursor pointer on labels', () => {
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      const labels = screen.getAllByRole('radio').map(radio => radio.closest('label'));
      labels.forEach((label) => {
        expect(label).toHaveClass('cursor-pointer');
      });
    });
  });

  describe('Radio Group Behavior', () => {
    it('should have same name attribute for all radios', () => {
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      const radios = screen.getAllByRole('radio');
      radios.forEach((radio) => {
        expect((radio as HTMLInputElement).name).toBe('margin-preset');
      });
    });

    it('should have correct value attributes', () => {
      render(<MarginPresetsRadio value="normal" onChange={mockOnChange} />);

      expect(screen.getByRole('radio', { name: /Compact/ })).toHaveAttribute('value', 'compact');
      expect(screen.getByRole('radio', { name: /Narrow/ })).toHaveAttribute('value', 'narrow');
      expect(screen.getByRole('radio', { name: /Normal/ })).toHaveAttribute('value', 'normal');
      expect(screen.getByRole('radio', { name: /Wide/ })).toHaveAttribute('value', 'wide');
      expect(screen.getByRole('radio', { name: /Spacious/ })).toHaveAttribute('value', 'spacious');
      expect(screen.getByRole('radio', { name: /Custom/ })).toHaveAttribute('value', 'custom');
    });
  });
});
