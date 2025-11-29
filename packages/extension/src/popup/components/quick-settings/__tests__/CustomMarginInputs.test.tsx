/**
 * CustomMarginInputs Component Tests
 * Custom margin input controls
 */

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomMarginInputs } from '../CustomMarginInputs';

// Mock useDebounce to return value immediately (no delay)
// Must match the import path used by the component: '../../hooks/core/useDebounce'
vi.mock('../../hooks/core/useDebounce', () => ({
  useDebounce: <T,>(value: T, _delay: number) => value,
}));

describe('CustomMarginInputs', () => {
  const mockOnChange = vi.fn();
  const defaultValues = {
    top: 0.75,
    right: 0.75,
    bottom: 0.75,
    left: 0.75,
  };
  const defaultPageSize = 'Letter' as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all four margin inputs', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      expect(screen.getByLabelText('Top (in)')).toBeInTheDocument();
      expect(screen.getByLabelText('Right (in)')).toBeInTheDocument();
      expect(screen.getByLabelText('Bottom (in)')).toBeInTheDocument();
      expect(screen.getByLabelText('Left (in)')).toBeInTheDocument();
    });

    it('should display current values in inputs', () => {
      const values = { top: 1.0, right: 0.5, bottom: 1.25, left: 0.625 };
      render(<CustomMarginInputs values={values} onChange={mockOnChange} pageSize={defaultPageSize} />);

      expect(screen.getByLabelText('Top (in)')).toHaveValue(1.0);
      expect(screen.getByLabelText('Right (in)')).toHaveValue(0.5);
      expect(screen.getByLabelText('Bottom (in)')).toHaveValue(1.25);
      expect(screen.getByLabelText('Left (in)')).toHaveValue(0.625);
    });

    it('should show validation hint', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      expect(screen.getByText(/Valid range: 0-2" in 0\.05" increments/)).toBeInTheDocument();
    });

    it('should have background styling', () => {
      const { container } = render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('bg-gray-50');
      expect(wrapper).toHaveClass('rounded-md'); // tokens.borders.rounded
      expect(wrapper).toHaveClass('border');
    });
  });

  describe('Input Attributes', () => {
    it('should have correct input types', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('type', 'number');
      });
    });

    it('should have min="0" attribute', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('min', '0');
      });
    });

    it('should have max="2" attribute', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('max', '2');
      });
    });

    it('should have step="0.05" attribute', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('step', '0.05');
      });
    });

    it('should have unique IDs for each input', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      expect(screen.getByLabelText('Top (in)')).toHaveAttribute('id', 'margin-top');
      expect(screen.getByLabelText('Right (in)')).toHaveAttribute('id', 'margin-right');
      expect(screen.getByLabelText('Bottom (in)')).toHaveAttribute('id', 'margin-bottom');
      expect(screen.getByLabelText('Left (in)')).toHaveAttribute('id', 'margin-left');
    });
  });

  describe('User Interactions - Local State Updates', () => {
    // onChange is debounced and only called when values differ from props
    // These tests verify that local state updates immediately for responsive UI
    it('should update local state when top input changes', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const topInput = screen.getByLabelText('Top (in)');
      fireEvent.change(topInput, { target: { value: '1.25' } });

      // Local state updates immediately
      expect((topInput as HTMLInputElement).value).toBe('1.25');
    });

    it('should update local state when right input changes', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const rightInput = screen.getByLabelText('Right (in)');
      fireEvent.change(rightInput, { target: { value: '0.5' } });

      expect((rightInput as HTMLInputElement).value).toBe('0.5');
    });

    it('should update local state when bottom input changes', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const bottomInput = screen.getByLabelText('Bottom (in)');
      fireEvent.change(bottomInput, { target: { value: '1.0' } });

      expect((bottomInput as HTMLInputElement).value).toBe('1.0');
    });

    it('should update local state when left input changes', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const leftInput = screen.getByLabelText('Left (in)');
      fireEvent.change(leftInput, { target: { value: '0.625' } });

      expect((leftInput as HTMLInputElement).value).toBe('0.625');
    });

    it('should handle empty input as 0', async () => {
      const user = userEvent.setup();
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const topInput = screen.getByLabelText('Top (in)');
      await user.clear(topInput);

      // Empty input is converted to 0
      expect((topInput as HTMLInputElement).value).toBe('0');
    });
  });

  describe('Validation on Blur - Clamping', () => {
    it('should clamp value to 0 when negative value is entered', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const topInput = screen.getByLabelText('Top (in)');
      fireEvent.change(topInput, { target: { value: '-0.5' } });
      fireEvent.blur(topInput);

      // Verify input was clamped to 0
      expect((topInput as HTMLInputElement).value).toBe('0');
    });

    it('should clamp value to 2 when value exceeds maximum', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const topInput = screen.getByLabelText('Top (in)');
      fireEvent.change(topInput, { target: { value: '3.5' } });
      fireEvent.blur(topInput);

      // Verify input was clamped to 2
      expect((topInput as HTMLInputElement).value).toBe('2');
    });

    it('should clamp value to 2 when slightly over maximum', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const topInput = screen.getByLabelText('Top (in)');
      fireEvent.change(topInput, { target: { value: '2.1' } });
      fireEvent.blur(topInput);

      // Verify input was clamped to 2
      expect((topInput as HTMLInputElement).value).toBe('2');
    });
  });

  describe('Validation on Blur - Rounding', () => {
    it('should round to nearest 0.05" increment on blur', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const topInput = screen.getByLabelText('Top (in)');
      fireEvent.change(topInput, { target: { value: '0.77' } });
      fireEvent.blur(topInput);

      // Verify input was rounded to 0.75
      expect((topInput as HTMLInputElement).value).toBe('0.75');
    });

    it('should round 0.77 down to 0.75', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const topInput = screen.getByLabelText('Top (in)');
      fireEvent.change(topInput, { target: { value: '0.77' } });
      fireEvent.blur(topInput);

      // Verify input was rounded to 0.75
      expect((topInput as HTMLInputElement).value).toBe('0.75');
    });

    it('should round 0.78 up to 0.8', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const topInput = screen.getByLabelText('Top (in)');
      fireEvent.change(topInput, { target: { value: '0.78' } });
      fireEvent.blur(topInput);

      // Verify input was rounded to 0.8
      expect((topInput as HTMLInputElement).value).toBe('0.8');
    });

    it('should round 1.234 to 1.25', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const topInput = screen.getByLabelText('Top (in)');
      fireEvent.change(topInput, { target: { value: '1.234' } });
      fireEvent.blur(topInput);

      // Verify input was rounded to 1.25
      expect((topInput as HTMLInputElement).value).toBe('1.25');
    });

    it('should not update input if value unchanged after rounding', () => {
      render(<CustomMarginInputs values={{ ...defaultValues, top: 0.75 }} onChange={mockOnChange} pageSize={defaultPageSize} />);

      vi.clearAllMocks(); // Clear previous onChange calls

      const topInput = screen.getByLabelText('Top (in)');
      fireEvent.focus(topInput);
      fireEvent.blur(topInput); // Blur without changing value

      // Value should still be 0.75 (no change needed)
      expect((topInput as HTMLInputElement).value).toBe('0.75');
      // onChange not called since value didn't change
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Validation on Blur - Combined Clamping and Rounding', () => {
    it('should round then clamp: 2.03 → 2.05 → 2.0', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const topInput = screen.getByLabelText('Top (in)');
      fireEvent.change(topInput, { target: { value: '2.03' } });
      fireEvent.blur(topInput);

      // Verify input was rounded to 2.05 then clamped to 2
      expect((topInput as HTMLInputElement).value).toBe('2');
    });

    it('should round negative value then clamp: -0.77 → -0.75 → 0', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const topInput = screen.getByLabelText('Top (in)');
      fireEvent.change(topInput, { target: { value: '-0.77' } });
      fireEvent.blur(topInput);

      // Verify input was rounded to -0.75 then clamped to 0
      expect((topInput as HTMLInputElement).value).toBe('0');
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should be focusable with keyboard', async () => {
      const user = userEvent.setup();
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      await user.tab();

      const topInput = screen.getByLabelText('Top (in)');
      expect(topInput).toHaveFocus();
    });

    it('should tab through all inputs in order', async () => {
      const user = userEvent.setup();
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      await user.tab();
      expect(screen.getByLabelText('Top (in)')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Right (in)')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Bottom (in)')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Left (in)')).toHaveFocus();
    });

    it('should have focus ring styles', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach((input) => {
        expect(input).toHaveClass('focus:outline-none');
        expect(input).toHaveClass('focus:ring-2');
        expect(input).toHaveClass('focus:ring-blue-500');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle 0 values', () => {
      const values = { top: 0, right: 0, bottom: 0, left: 0 };
      render(<CustomMarginInputs values={values} onChange={mockOnChange} pageSize={defaultPageSize} />);

      expect(screen.getByLabelText('Top (in)')).toHaveValue(0);
      expect(screen.getByLabelText('Right (in)')).toHaveValue(0);
      expect(screen.getByLabelText('Bottom (in)')).toHaveValue(0);
      expect(screen.getByLabelText('Left (in)')).toHaveValue(0);
    });

    it('should handle maximum values', () => {
      const values = { top: 2, right: 2, bottom: 2, left: 2 };
      render(<CustomMarginInputs values={values} onChange={mockOnChange} pageSize={defaultPageSize} />);

      expect(screen.getByLabelText('Top (in)')).toHaveValue(2);
      expect(screen.getByLabelText('Right (in)')).toHaveValue(2);
      expect(screen.getByLabelText('Bottom (in)')).toHaveValue(2);
      expect(screen.getByLabelText('Left (in)')).toHaveValue(2);
    });

    it('should handle mixed values', () => {
      const values = { top: 0, right: 2, bottom: 0.5, left: 1.25 };
      render(<CustomMarginInputs values={values} onChange={mockOnChange} pageSize={defaultPageSize} />);

      expect(screen.getByLabelText('Top (in)')).toHaveValue(0);
      expect(screen.getByLabelText('Right (in)')).toHaveValue(2);
      expect(screen.getByLabelText('Bottom (in)')).toHaveValue(0.5);
      expect(screen.getByLabelText('Left (in)')).toHaveValue(1.25);
    });

    it('should handle non-numeric input as 0', () => {
      render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const topInput = screen.getByLabelText('Top (in)');
      fireEvent.change(topInput, { target: { value: 'abc' } });

      // Non-numeric input is converted to 0
      expect((topInput as HTMLInputElement).value).toBe('0');
    });
  });

  describe('Layout', () => {
    it('should use 2-column grid layout', () => {
      const { container } = render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-2');
      expect(grid).toHaveClass('gap-2');
    });

    it('should have proper spacing', () => {
      const { container } = render(<CustomMarginInputs values={defaultValues} onChange={mockOnChange} pageSize={defaultPageSize} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('gap-2'); // tokens.spacing.gapSmall
      expect(wrapper).toHaveClass('p-3'); // tokens.spacing.alert
    });
  });
});
