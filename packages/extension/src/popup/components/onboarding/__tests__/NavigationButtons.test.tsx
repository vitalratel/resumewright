/**
 * NavigationButtons Component Tests
 * Navigation buttons for multi-step wizards
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationButtons } from '../NavigationButtons';

describe('NavigationButtons', () => {
  const mockOnPrevious = vi.fn();
  const mockOnNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('First Screen - Rendering', () => {
    it('should show "Skip" button on first screen', () => {
      render(
        <NavigationButtons
          currentScreen={0}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
    });

    it('should show "Next" button on first screen', () => {
      render(
        <NavigationButtons
          currentScreen={0}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    it('should show screen counter "1 / 3" on first screen', () => {
      render(
        <NavigationButtons
          currentScreen={0}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      expect(screen.getByText(/1\s*\/\s*3/)).toBeInTheDocument();
    });
  });

  describe('Middle Screen - Rendering', () => {
    it('should show "Back" button on middle screen', () => {
      render(
        <NavigationButtons
          currentScreen={1}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    });

    it('should show "Next" button on middle screen', () => {
      render(
        <NavigationButtons
          currentScreen={1}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    it('should show screen counter "2 / 3" on middle screen', () => {
      render(
        <NavigationButtons
          currentScreen={1}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      expect(screen.getByText(/2\s*\/\s*3/)).toBeInTheDocument();
    });
  });

  describe('Last Screen - Rendering', () => {
    it('should show "Back" button on last screen', () => {
      render(
        <NavigationButtons
          currentScreen={2}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    });

    it('should show "Get Started" button on last screen', () => {
      render(
        <NavigationButtons
          currentScreen={2}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
    });

    it('should show screen counter "3 / 3" on last screen', () => {
      render(
        <NavigationButtons
          currentScreen={2}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      expect(screen.getByText(/3\s*\/\s*3/)).toBeInTheDocument();
    });
  });

  describe('User Interactions - Previous/Skip Button', () => {
    it('should call onPrevious when Skip clicked (first screen)', async () => {
      const user = userEvent.setup();
      render(
        <NavigationButtons
          currentScreen={0}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      const skipButton = screen.getByRole('button', { name: 'Skip' });
      await user.click(skipButton);

      expect(mockOnPrevious).toHaveBeenCalledTimes(1);
    });

    it('should call onPrevious when Back clicked (middle screen)', async () => {
      const user = userEvent.setup();
      render(
        <NavigationButtons
          currentScreen={1}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      const backButton = screen.getByRole('button', { name: 'Back' });
      await user.click(backButton);

      expect(mockOnPrevious).toHaveBeenCalledTimes(1);
    });

    it('should call onPrevious when Back clicked (last screen)', async () => {
      const user = userEvent.setup();
      render(
        <NavigationButtons
          currentScreen={2}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      const backButton = screen.getByRole('button', { name: 'Back' });
      await user.click(backButton);

      expect(mockOnPrevious).toHaveBeenCalledTimes(1);
    });
  });

  describe('User Interactions - Next/Get Started Button', () => {
    it('should call onNext when Next clicked (first screen)', async () => {
      const user = userEvent.setup();
      render(
        <NavigationButtons
          currentScreen={0}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      const nextButton = screen.getByRole('button', { name: 'Next' });
      await user.click(nextButton);

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it('should call onNext when Next clicked (middle screen)', async () => {
      const user = userEvent.setup();
      render(
        <NavigationButtons
          currentScreen={1}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      const nextButton = screen.getByRole('button', { name: 'Next' });
      await user.click(nextButton);

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it('should call onNext when Get Started clicked (last screen)', async () => {
      const user = userEvent.setup();
      render(
        <NavigationButtons
          currentScreen={2}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      const getStartedButton = screen.getByRole('button', { name: 'Get Started' });
      await user.click(getStartedButton);

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should be focusable with Tab key', async () => {
      const user = userEvent.setup();
      render(
        <NavigationButtons
          currentScreen={1}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      await user.tab();
      expect(screen.getByRole('button', { name: 'Back' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    });

    it('should activate with Enter key', async () => {
      const user = userEvent.setup();
      render(
        <NavigationButtons
          currentScreen={0}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      const nextButton = screen.getByRole('button', { name: 'Next' });
      nextButton.focus();

      await user.keyboard('{Enter}');

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it('should activate with Space key', async () => {
      const user = userEvent.setup();
      render(
        <NavigationButtons
          currentScreen={0}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      const skipButton = screen.getByRole('button', { name: 'Skip' });
      skipButton.focus();

      await user.keyboard(' ');

      expect(mockOnPrevious).toHaveBeenCalledTimes(1);
    });

    it('should have focus ring styles on all buttons', () => {
      render(
        <NavigationButtons
          currentScreen={1}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('focus:outline-none');
        expect(button).toHaveClass('focus:ring-2');
      });
    });
  });

  describe('Styling', () => {
    it('should style Skip/Back button as gray', () => {
      render(
        <NavigationButtons
          currentScreen={1}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      const backButton = screen.getByRole('button', { name: 'Back' });
      expect(backButton).toHaveClass('text-gray-600');
      expect(backButton).toHaveClass('hover:text-blue-700');
    });

    it('should style Next/Get Started button as green', () => {
      render(
        <NavigationButtons
          currentScreen={0}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      const nextButton = screen.getByRole('button', { name: 'Next' });
      expect(nextButton).toHaveClass('bg-green-500');
      expect(nextButton).toHaveClass('hover:bg-green-600');
      expect(nextButton).toHaveClass('text-white');
    });

    it('should have transition effects', () => {
      render(
        <NavigationButtons
          currentScreen={1}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('transition-all');
      });
    });

    it('should have rounded corners on Next button', () => {
      render(
        <NavigationButtons
          currentScreen={0}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      const nextButton = screen.getByRole('button', { name: 'Next' });
      expect(nextButton).toHaveClass('rounded-md');
    });
  });

  describe('Layout', () => {
    it('should arrange buttons with space between', () => {
      const { container } = render(
        <NavigationButtons
          currentScreen={1}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      const wrapper = container.querySelector('.flex.items-center.justify-between');
      expect(wrapper).toBeInTheDocument();
    });

    it('should place Skip/Back on left, Next/Get Started on right', () => {
      render(
        <NavigationButtons
          currentScreen={1}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      const buttons = screen.getAllByRole('button');
      const backButton = screen.getByRole('button', { name: 'Back' });
      const nextButton = screen.getByRole('button', { name: 'Next' });

      // Back should be first in DOM
      expect(buttons[0]).toBe(backButton);
      // Next should be last in DOM
      expect(buttons[buttons.length - 1]).toBe(nextButton);
    });

    it('should display screen counter between buttons', () => {
      const { container } = render(
        <NavigationButtons
          currentScreen={1}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      const counter = screen.getByText(/2\s*\/\s*3/);
      const wrapper = container.querySelector('.flex.items-center.justify-between');

      // Counter should be in the middle
      expect(wrapper).toContainElement(counter);
    });
  });

  describe('Screen Counter', () => {
    it('should show 1-based screen numbers', () => {
      const { rerender } = render(
        <NavigationButtons
          currentScreen={0}
          totalScreens={5}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      expect(screen.getByText(/1\s*\/\s*5/)).toBeInTheDocument();

      rerender(
        <NavigationButtons
          currentScreen={1}
          totalScreens={5}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );
      expect(screen.getByText(/2\s*\/\s*5/)).toBeInTheDocument();

      rerender(
        <NavigationButtons
          currentScreen={4}
          totalScreens={5}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );
      expect(screen.getByText(/5\s*\/\s*5/)).toBeInTheDocument();
    });

    it('should update counter when screen changes', () => {
      const { rerender } = render(
        <NavigationButtons
          currentScreen={0}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      expect(screen.getByText(/1\s*\/\s*3/)).toBeInTheDocument();

      rerender(
        <NavigationButtons
          currentScreen={1}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      expect(screen.getByText(/2\s*\/\s*3/)).toBeInTheDocument();
    });

    it('should style counter in gray', () => {
      render(
        <NavigationButtons
          currentScreen={1}
          totalScreens={3}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      const counter = screen.getByText(/2\s*\/\s*3/);
      expect(counter).toHaveClass('text-gray-600');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single screen (both first and last)', () => {
      render(
        <NavigationButtons
          currentScreen={0}
          totalScreens={1}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      // Should show "Get Started" (last screen takes precedence)
      expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
      expect(screen.getByText(/1\s*\/\s*1/)).toBeInTheDocument();
    });

    it('should handle many screens', () => {
      render(
        <NavigationButtons
          currentScreen={5}
          totalScreens={10}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />,
      );

      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
      expect(screen.getByText(/6\s*\/\s*10/)).toBeInTheDocument();
    });
  });
});
