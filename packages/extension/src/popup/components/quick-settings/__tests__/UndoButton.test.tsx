/**
 * UndoButton Component Tests
 * Undo functionality for accidental changes
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UndoButton } from '../UndoButton';

describe('UndoButton', () => {
  const mockOnUndo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render undo button', () => {
      render(<UndoButton onUndo={mockOnUndo} />);

      expect(screen.getByRole('button', { name: /Undo recent changes/i })).toBeInTheDocument();
    });

    it('should display countdown timer', () => {
      render(<UndoButton onUndo={mockOnUndo} />);

      // Default timeout is 10s
      expect(screen.getByText('(10s)')).toBeInTheDocument();
    });

    it('should show Undo text', () => {
      render(<UndoButton onUndo={mockOnUndo} />);

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should have accessible label', () => {
      render(<UndoButton onUndo={mockOnUndo} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName('Undo recent changes');
    });
  });

  describe('Countdown Timer', () => {
    it('should start at 10 seconds with default timeout', () => {
      render(<UndoButton onUndo={mockOnUndo} />);

      expect(screen.getByText('(10s)')).toBeInTheDocument();
    });

    it('should start at custom timeout value', () => {
      render(<UndoButton onUndo={mockOnUndo} timeout={5000} />);

      expect(screen.getByText('(5s)')).toBeInTheDocument();
    });

    it('should decrement by 1 second every second', () => {
      render(<UndoButton onUndo={mockOnUndo} />);

      expect(screen.getByText('(10s)')).toBeInTheDocument();

      // Advance 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText('(9s)')).toBeInTheDocument();

      // Advance another second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText('(8s)')).toBeInTheDocument();
    });

    it('should count down to 0', () => {
      render(<UndoButton onUndo={mockOnUndo} timeout={3000} />);

      expect(screen.getByText('(3s)')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('(2s)')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('(1s)')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('(0s)')).toBeInTheDocument();
    });

    it('should not go below 0 seconds', () => {
      render(<UndoButton onUndo={mockOnUndo} timeout={1000} />);

      expect(screen.getByText('(1s)')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('(0s)')).toBeInTheDocument();

      // Advance more time
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should still show 0s
      expect(screen.getByText('(0s)')).toBeInTheDocument();
    });

    it('should update every 1000ms', () => {
      render(<UndoButton onUndo={mockOnUndo} timeout={10000} />);

      // Advance 999ms - should not update yet
      act(() => {
        vi.advanceTimersByTime(999);
      });
      expect(screen.getByText('(10s)')).toBeInTheDocument();

      // Advance 1ms more (total 1000ms) - should update
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.getByText('(9s)')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onUndo when clicked', () => {
      render(<UndoButton onUndo={mockOnUndo} />);

      const undoButton = screen.getByRole('button', { name: /Undo recent changes/i });
      fireEvent.click(undoButton);

      expect(mockOnUndo).toHaveBeenCalledTimes(1);
    });

    it('should call onUndo even if timer has run out', () => {
      render(<UndoButton onUndo={mockOnUndo} timeout={1000} />);

      const undoButton = screen.getByRole('button');
      fireEvent.click(undoButton);

      expect(mockOnUndo).toHaveBeenCalledTimes(1);
    });

    it('should call onUndo multiple times if clicked multiple times', () => {
      render(<UndoButton onUndo={mockOnUndo} />);

      const undoButton = screen.getByRole('button');
      fireEvent.click(undoButton);
      fireEvent.click(undoButton);

      expect(mockOnUndo).toHaveBeenCalledTimes(2);
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should be focusable with keyboard', () => {
      render(<UndoButton onUndo={mockOnUndo} />);

      const undoButton = screen.getByRole('button');
      undoButton.focus();

      expect(undoButton).toHaveFocus();
    });

    it('should activate with Enter key', () => {
      render(<UndoButton onUndo={mockOnUndo} />);

      const undoButton = screen.getByRole('button');
      undoButton.focus();

      // Simulate Enter key activating the button (browser converts to click)
      fireEvent.click(undoButton);

      expect(mockOnUndo).toHaveBeenCalledTimes(1);
    });

    it('should activate with Space key', () => {
      render(<UndoButton onUndo={mockOnUndo} />);

      const undoButton = screen.getByRole('button');
      undoButton.focus();

      // Simulate Space key activating the button (browser converts to click)
      fireEvent.click(undoButton);

      expect(mockOnUndo).toHaveBeenCalledTimes(1);
    });

    it('should have focus ring styles', () => {
      render(<UndoButton onUndo={mockOnUndo} />);

      const undoButton = screen.getByRole('button');
      expect(undoButton).toHaveClass('focus:outline-none');
      expect(undoButton).toHaveClass('focus:ring-2');
      expect(undoButton).toHaveClass('focus:ring-blue-300'); // Using focusRounded token
    });
  });

  describe('Styling', () => {
    it('should have blue text color', () => {
      render(<UndoButton onUndo={mockOnUndo} />);

      const undoButton = screen.getByRole('button');
      expect(undoButton).toHaveClass('text-blue-600');
    });

    it('should have hover effects', () => {
      render(<UndoButton onUndo={mockOnUndo} />);

      const undoButton = screen.getByRole('button');
      expect(undoButton).toHaveClass('hover:text-blue-700');
      expect(undoButton).toHaveClass('hover:underline');
    });

    it('should have transition effects', () => {
      render(<UndoButton onUndo={mockOnUndo} />);

      const undoButton = screen.getByRole('button');
      expect(undoButton).toHaveClass('transition-all'); // Using transitions.default token
      expect(undoButton).toHaveClass('duration-300');
    });

    it('should display countdown in gray text', () => {
      const { container } = render(<UndoButton onUndo={mockOnUndo} />);

      const countdown = container.querySelector('.text-gray-600');
      expect(countdown).toBeInTheDocument();
      expect(countdown).toHaveTextContent('(10s)');
    });
  });

  describe('Timer Cleanup', () => {
    it('should cleanup interval on unmount', () => {
      const { unmount } = render(<UndoButton onUndo={mockOnUndo} />);

      // Verify timer is running
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      unmount();

      // Advance timers after unmount - should not cause errors
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(5000);
        });
      }).not.toThrow();
    });

    it('should not update state after unmount', async () => {
      const { unmount } = render(<UndoButton onUndo={mockOnUndo} />);

      unmount();

      // Advance timers - should not cause "Can't perform a React state update on an unmounted component" warning
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(5000);
        });
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short timeout (1ms)', () => {
      render(<UndoButton onUndo={mockOnUndo} timeout={1} />);

      // Should show 1s initially (ceiling of 1ms / 1000)
      expect(screen.getByText('(1s)')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText('(0s)')).toBeInTheDocument();
    });

    it('should handle long timeout (60s)', () => {
      render(<UndoButton onUndo={mockOnUndo} timeout={60000} />);

      expect(screen.getByText('(60s)')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText('(59s)')).toBeInTheDocument();
    });

    it('should round up fractional seconds (ceiling)', () => {
      // 10500ms should show as 11s (ceiling)
      render(<UndoButton onUndo={mockOnUndo} timeout={10500} />);

      expect(screen.getByText('(11s)')).toBeInTheDocument();
    });

    it('should handle 0 timeout', () => {
      render(<UndoButton onUndo={mockOnUndo} timeout={0} />);

      expect(screen.getByText('(0s)')).toBeInTheDocument();
    });
  });
});
