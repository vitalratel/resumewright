/**
 * ABOUTME: Tests for RangeSlider component with visual track fill and tooltip.
 * ABOUTME: Validates rendering, accessibility, interactions, and number formatting.
 */

import { fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RangeSlider } from '../RangeSlider';

describe('RangeSlider', () => {
  const defaultProps = {
    id: 'test-slider',
    label: 'margin',
    value: 1.0,
    min: 0.5,
    max: 2.0,
    step: 0.1,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders slider with proper label and value display', () => {
      render(() => <RangeSlider {...defaultProps} />);

      // Check slider is present with correct aria-label
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute('aria-label', 'margin in inches');

      // Check label is present
      const label = document.querySelector('label[for="test-slider"]');
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent(/margin/i);

      // Check value display - use aria-hidden to distinguish from help text
      const valueDisplay = screen.getByText(/1[.,]00"/, { selector: 'span[aria-hidden="true"]' });
      expect(valueDisplay).toBeInTheDocument();
    });

    it('renders with custom unit', () => {
      render(() => <RangeSlider {...defaultProps} unit="cm" />);

      const valueDisplay = screen.getByText(/1[.,]00cm/, { selector: 'span[aria-hidden="true"]' });
      expect(valueDisplay).toBeInTheDocument();
    });

    it('applies custom class', () => {
      const { container } = render(() => <RangeSlider {...defaultProps} class="custom-class" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('formats value with locale-aware number formatting', () => {
      render(() => <RangeSlider {...defaultProps} value={1.5} />);

      const valueDisplay = screen.getByText(/1[.,]50"/, { selector: 'span[aria-hidden="true"]' });
      expect(valueDisplay).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(() => <RangeSlider {...defaultProps} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemin', '0.5');
      expect(slider).toHaveAttribute('aria-valuemax', '2');
      expect(slider).toHaveAttribute('aria-valuenow', '1');
      expect(slider).toHaveAttribute('aria-valuetext');
      expect(slider).toHaveAttribute('aria-describedby', 'test-slider-help');
    });

    it('provides descriptive help text for screen readers', () => {
      render(() => <RangeSlider {...defaultProps} />);

      const helpText = document.getElementById('test-slider-help');
      expect(helpText).toBeInTheDocument();
      expect(helpText).toHaveClass('sr-only');
      expect(helpText).toHaveTextContent(/Adjust margin/);
      expect(helpText).toHaveTextContent(/Range 0.5 to 2/);
    });

    it('increment button has descriptive label', () => {
      render(() => <RangeSlider {...defaultProps} />);

      const incrementButton = screen.getByRole('button', {
        name: /increase.*margin.*0\.1"/i,
      });
      expect(incrementButton).toBeInTheDocument();
    });

    it('decrement button has descriptive label', () => {
      render(() => <RangeSlider {...defaultProps} />);

      const decrementButton = screen.getByRole('button', {
        name: /decrease.*margin.*0\.1"/i,
      });
      expect(decrementButton).toBeInTheDocument();
    });
  });

  describe('User Interactions - Slider', () => {
    it('calls onChange when slider value changes', () => {
      const onChange = vi.fn();
      render(() => <RangeSlider {...defaultProps} onChange={onChange} />);

      const slider = screen.getByRole('slider');
      fireEvent.input(slider, { target: { value: '1.5' } });

      expect(onChange).toHaveBeenCalledWith(1.5);
    });

    it('updates aria-valuenow when value changes', () => {
      const [value, setValue] = createSignal(1.0);

      render(() => <RangeSlider {...defaultProps} value={value()} />);

      let slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '1');

      setValue(1.5);
      slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '1.5');
    });
  });

  describe('User Interactions - Increment/Decrement Buttons', () => {
    it('increments value when increment button clicked', () => {
      const onChange = vi.fn();
      render(() => <RangeSlider {...defaultProps} value={1.0} onChange={onChange} />);

      const incrementButton = screen.getByRole('button', { name: /increase/i });
      fireEvent.click(incrementButton);

      expect(onChange).toHaveBeenCalledWith(1.1);
    });

    it('decrements value when decrement button clicked', () => {
      const onChange = vi.fn();
      render(() => <RangeSlider {...defaultProps} value={1.0} onChange={onChange} />);

      const decrementButton = screen.getByRole('button', { name: /decrease/i });
      fireEvent.click(decrementButton);

      expect(onChange).toHaveBeenCalledWith(0.9);
    });

    it('disables increment button when value is at maximum', () => {
      render(() => <RangeSlider {...defaultProps} value={2.0} />);

      const incrementButton = screen.getByRole('button', { name: /increase/i });
      expect(incrementButton).toBeDisabled();
    });

    it('disables decrement button when value is at minimum', () => {
      render(() => <RangeSlider {...defaultProps} value={0.5} />);

      const decrementButton = screen.getByRole('button', { name: /decrease/i });
      expect(decrementButton).toBeDisabled();
    });

    it('does not call onChange when clicking disabled increment button', () => {
      const onChange = vi.fn();
      render(() => <RangeSlider {...defaultProps} value={2.0} onChange={onChange} />);

      const incrementButton = screen.getByRole('button', { name: /increase/i });
      fireEvent.click(incrementButton);

      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not call onChange when clicking disabled decrement button', () => {
      const onChange = vi.fn();
      render(() => <RangeSlider {...defaultProps} value={0.5} onChange={onChange} />);

      const decrementButton = screen.getByRole('button', { name: /decrease/i });
      fireEvent.click(decrementButton);

      expect(onChange).not.toHaveBeenCalled();
    });

    it('clamps increment to maximum value', () => {
      const onChange = vi.fn();
      render(() => <RangeSlider {...defaultProps} value={1.95} onChange={onChange} />);

      const incrementButton = screen.getByRole('button', { name: /increase/i });
      fireEvent.click(incrementButton);

      expect(onChange).toHaveBeenCalledWith(2.0);
    });

    it('clamps decrement to minimum value', () => {
      const onChange = vi.fn();
      render(() => <RangeSlider {...defaultProps} value={0.55} onChange={onChange} />);

      const decrementButton = screen.getByRole('button', { name: /decrease/i });
      fireEvent.click(decrementButton);

      expect(onChange).toHaveBeenCalledWith(0.5);
    });
  });

  describe('Value Formatting', () => {
    it('formats values consistently across display and ARIA', () => {
      render(() => <RangeSlider {...defaultProps} value={1.5} />);

      const slider = screen.getByRole('slider');
      const ariaValueText = slider.getAttribute('aria-valuetext');

      expect(ariaValueText).toMatch(/1[.,]50"/);

      const valueDisplay = screen.getByText(/1[.,]50"/, { selector: 'span[aria-hidden="true"]' });
      expect(valueDisplay).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero value correctly', () => {
      render(() => <RangeSlider {...defaultProps} min={0} value={0} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '0');

      const valueDisplay = screen.getByText(/0[.,]00"/, { selector: 'span[aria-hidden="true"]' });
      expect(valueDisplay).toBeInTheDocument();
    });

    it('handles very small step sizes', () => {
      render(() => <RangeSlider {...defaultProps} step={0.01} value={1.23} />);

      const valueDisplay = screen.getByText(/1[.,]23"/, { selector: 'span[aria-hidden="true"]' });
      expect(valueDisplay).toBeInTheDocument();
    });

    it('handles negative values', () => {
      render(() => <RangeSlider {...defaultProps} min={-1} max={1} value={-0.5} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '-0.5');
    });
  });
});
