/**
 * PageSizeSelector Component Tests
 * Quick Settings Panel - Page Size Toggle
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PageSizeSelector } from '../PageSizeSelector';

describe('PageSizeSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all three page size options', () => {
      render(<PageSizeSelector value="A4" onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: 'A4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Letter' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Legal' })).toBeInTheDocument();
    });

    it('should render Page Size label', () => {
      render(<PageSizeSelector value="A4" onChange={mockOnChange} />);

      expect(screen.getByText('Page Size')).toBeInTheDocument();
    });

    it('should render buttons in a group', () => {
      render(<PageSizeSelector value="A4" onChange={mockOnChange} />);

      const group = screen.getByRole('group');
      expect(group).toBeInTheDocument();
      expect(group).toHaveAccessibleName('Page Size');
    });
  });

  describe('Selection State', () => {
    it('should show A4 as selected when value is A4', () => {
      render(<PageSizeSelector value="A4" onChange={mockOnChange} />);

      const a4Button = screen.getByRole('button', { name: 'A4' });
      expect(a4Button).toHaveAttribute('aria-pressed', 'true');
      expect(a4Button).toHaveClass('bg-blue-500');
      expect(a4Button).toHaveClass('text-white');
    });

    it('should show Letter as selected when value is Letter', () => {
      render(<PageSizeSelector value="Letter" onChange={mockOnChange} />);

      const letterButton = screen.getByRole('button', { name: 'Letter' });
      expect(letterButton).toHaveAttribute('aria-pressed', 'true');
      expect(letterButton).toHaveClass('bg-blue-500');
    });

    it('should show Legal as selected when value is Legal', () => {
      render(<PageSizeSelector value="Legal" onChange={mockOnChange} />);

      const legalButton = screen.getByRole('button', { name: 'Legal' });
      expect(legalButton).toHaveAttribute('aria-pressed', 'true');
      expect(legalButton).toHaveClass('bg-blue-500');
    });

    it('should show unselected buttons with white background', () => {
      render(<PageSizeSelector value="A4" onChange={mockOnChange} />);

      const letterButton = screen.getByRole('button', { name: 'Letter' });
      const legalButton = screen.getByRole('button', { name: 'Legal' });

      expect(letterButton).toHaveAttribute('aria-pressed', 'false');
      expect(letterButton).toHaveClass('bg-white');
      expect(legalButton).toHaveAttribute('aria-pressed', 'false');
      expect(legalButton).toHaveClass('bg-white');
    });
  });

  describe('User Interactions', () => {
    it('should call onChange with Letter when Letter button clicked', async () => {
      const user = userEvent.setup();
      render(<PageSizeSelector value="A4" onChange={mockOnChange} />);

      const letterButton = screen.getByRole('button', { name: 'Letter' });
      await user.click(letterButton);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('Letter');
    });

    it('should call onChange with A4 when A4 button clicked', async () => {
      const user = userEvent.setup();
      render(<PageSizeSelector value="Letter" onChange={mockOnChange} />);

      const a4Button = screen.getByRole('button', { name: 'A4' });
      await user.click(a4Button);

      expect(mockOnChange).toHaveBeenCalledWith('A4');
    });

    it('should call onChange with Legal when Legal button clicked', async () => {
      const user = userEvent.setup();
      render(<PageSizeSelector value="A4" onChange={mockOnChange} />);

      const legalButton = screen.getByRole('button', { name: 'Legal' });
      await user.click(legalButton);

      expect(mockOnChange).toHaveBeenCalledWith('Legal');
    });

    it('should allow clicking already selected button', async () => {
      const user = userEvent.setup();
      render(<PageSizeSelector value="A4" onChange={mockOnChange} />);

      const a4Button = screen.getByRole('button', { name: 'A4' });
      await user.click(a4Button);

      expect(mockOnChange).toHaveBeenCalledWith('A4');
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should be focusable with keyboard', async () => {
      const user = userEvent.setup();
      render(<PageSizeSelector value="A4" onChange={mockOnChange} />);

      await user.tab();

      const a4Button = screen.getByRole('button', { name: 'A4' });
      expect(a4Button).toHaveFocus();
    });

    it('should activate button with Enter key', async () => {
      const user = userEvent.setup();
      render(<PageSizeSelector value="A4" onChange={mockOnChange} />);

      const letterButton = screen.getByRole('button', { name: 'Letter' });
      letterButton.focus();

      await user.keyboard('{Enter}');

      expect(mockOnChange).toHaveBeenCalledWith('Letter');
    });

    it('should activate button with Space key', async () => {
      const user = userEvent.setup();
      render(<PageSizeSelector value="A4" onChange={mockOnChange} />);

      const legalButton = screen.getByRole('button', { name: 'Legal' });
      legalButton.focus();

      await user.keyboard(' ');

      expect(mockOnChange).toHaveBeenCalledWith('Legal');
    });

    it('should have focus ring styles', () => {
      render(<PageSizeSelector value="A4" onChange={mockOnChange} />);

      const a4Button = screen.getByRole('button', { name: 'A4' });
      expect(a4Button).toHaveClass('focus:outline-none');
      expect(a4Button).toHaveClass('focus:ring-2');
      expect(a4Button).toHaveClass('focus:ring-blue-500');
    });
  });

  describe('Styling', () => {
    it('should have equal width buttons (flex-1)', () => {
      render(<PageSizeSelector value="A4" onChange={mockOnChange} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('flex-1');
      });
    });

    it('should have transition effects', () => {
      render(<PageSizeSelector value="A4" onChange={mockOnChange} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('transition-all'); // tokens.transitions.default
      });
    });

    it('should have hover styles on unselected buttons', () => {
      render(<PageSizeSelector value="A4" onChange={mockOnChange} />);

      const letterButton = screen.getByRole('button', { name: 'Letter' });
      expect(letterButton).toHaveClass('hover:bg-gray-100'); // tokens.colors.neutral.hover
    });
  });
});
