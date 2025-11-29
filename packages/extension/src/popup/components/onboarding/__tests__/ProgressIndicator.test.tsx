/**
 * ProgressIndicator Component Tests
 * Visual progress dots for multi-step flows
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressIndicator } from '../ProgressIndicator';

describe('ProgressIndicator', () => {
  describe('Rendering', () => {
    it('should render correct number of dots', () => {
      render(<ProgressIndicator current={0} total={3} />);

      const dots = screen.getAllByRole('presentation');
      expect(dots).toHaveLength(3);
    });

    it('should render 5 dots when total is 5', () => {
      render(<ProgressIndicator current={0} total={5} />);

      const dots = screen.getAllByRole('presentation');
      expect(dots).toHaveLength(5);
    });

    it('should render single dot when total is 1', () => {
      render(<ProgressIndicator current={0} total={1} />);

      const dots = screen.getAllByRole('presentation');
      expect(dots).toHaveLength(1);
    });
  });

  describe('Current Dot Styling', () => {
    it('should highlight current dot (first screen)', () => {
      render(<ProgressIndicator current={0} total={3} />);

      const currentDot = screen.getByLabelText('Screen 1 (current)');
      expect(currentDot).toHaveClass('bg-green-500');
      expect(currentDot).toHaveClass('w-8');
    });

    it('should highlight current dot (middle screen)', () => {
      render(<ProgressIndicator current={1} total={3} />);

      const currentDot = screen.getByLabelText('Screen 2 (current)');
      expect(currentDot).toHaveClass('bg-green-500');
      expect(currentDot).toHaveClass('w-8');
    });

    it('should highlight current dot (last screen)', () => {
      render(<ProgressIndicator current={2} total={3} />);

      const currentDot = screen.getByLabelText('Screen 3 (current)');
      expect(currentDot).toHaveClass('bg-green-500');
      expect(currentDot).toHaveClass('w-8');
    });

    it('should make current dot wider than others', () => {
      render(<ProgressIndicator current={1} total={3} />);

      const currentDot = screen.getByLabelText('Screen 2 (current)');
      const upcomingDot = screen.getByLabelText('Screen 3 (upcoming)');

      expect(currentDot).toHaveClass('w-8');
      expect(upcomingDot).toHaveClass('w-1.5');
    });
  });

  describe('Completed Dots Styling', () => {
    it('should show completed dots in light green', () => {
      render(<ProgressIndicator current={2} total={3} />);

      const completedDot1 = screen.getByLabelText('Screen 1 (completed)');
      const completedDot2 = screen.getByLabelText('Screen 2 (completed)');

      expect(completedDot1).toHaveClass('bg-green-300');
      expect(completedDot2).toHaveClass('bg-green-300');
    });

    it('should make completed dots small width', () => {
      render(<ProgressIndicator current={2} total={3} />);

      const completedDot = screen.getByLabelText('Screen 1 (completed)');
      expect(completedDot).toHaveClass('w-1.5');
    });

    it('should have no completed dots on first screen', () => {
      render(<ProgressIndicator current={0} total={3} />);

      const dots = screen.getAllByRole('presentation');
      const completedDots = dots.filter(dot =>
        dot.getAttribute('aria-label')?.includes('completed'),
      );

      expect(completedDots).toHaveLength(0);
    });

    it('should have 2 completed dots on third screen', () => {
      render(<ProgressIndicator current={2} total={3} />);

      expect(screen.getByLabelText('Screen 1 (completed)')).toBeInTheDocument();
      expect(screen.getByLabelText('Screen 2 (completed)')).toBeInTheDocument();
    });
  });

  describe('Upcoming Dots Styling', () => {
    it('should show upcoming dots in gray', () => {
      render(<ProgressIndicator current={0} total={3} />);

      const upcomingDot1 = screen.getByLabelText('Screen 2 (upcoming)');
      const upcomingDot2 = screen.getByLabelText('Screen 3 (upcoming)');

      expect(upcomingDot1).toHaveClass('bg-gray-300');
      expect(upcomingDot2).toHaveClass('bg-gray-300');
    });

    it('should make upcoming dots small width', () => {
      render(<ProgressIndicator current={0} total={3} />);

      const upcomingDot = screen.getByLabelText('Screen 2 (upcoming)');
      expect(upcomingDot).toHaveClass('w-1.5');
    });

    it('should have no upcoming dots on last screen', () => {
      render(<ProgressIndicator current={2} total={3} />);

      const dots = screen.getAllByRole('presentation');
      const upcomingDots = dots.filter(dot =>
        dot.getAttribute('aria-label')?.includes('upcoming'),
      );

      expect(upcomingDots).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive aria-labels for each dot', () => {
      render(<ProgressIndicator current={1} total={3} />);

      expect(screen.getByLabelText('Screen 1 (completed)')).toBeInTheDocument();
      expect(screen.getByLabelText('Screen 2 (current)')).toBeInTheDocument();
      expect(screen.getByLabelText('Screen 3 (upcoming)')).toBeInTheDocument();
    });

    it('should use presentation role for dots', () => {
      render(<ProgressIndicator current={0} total={3} />);

      const dots = screen.getAllByRole('presentation');
      expect(dots).toHaveLength(3);
    });

    it('should label screens starting from 1, not 0', () => {
      render(<ProgressIndicator current={0} total={3} />);

      // Screen numbers should be 1, 2, 3 (not 0, 1, 2)
      expect(screen.getByLabelText('Screen 1 (current)')).toBeInTheDocument();
      expect(screen.getByLabelText('Screen 2 (upcoming)')).toBeInTheDocument();
      expect(screen.getByLabelText('Screen 3 (upcoming)')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have rounded dots', () => {
      const { container } = render(<ProgressIndicator current={0} total={3} />);

      const dots = container.querySelectorAll('.rounded-full');
      expect(dots.length).toBeGreaterThan(0);
    });

    it('should have transition effects', () => {
      const { container } = render(<ProgressIndicator current={0} total={3} />);

      const dots = container.querySelectorAll('.transition-all');
      expect(dots).toHaveLength(3);
    });

    it('should center dots with spacing', () => {
      const { container } = render(<ProgressIndicator current={0} total={3} />);

      const wrapper = container.querySelector('.flex.items-center.justify-center.space-x-2');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('should update when current changes from 0 to 1', () => {
      const { rerender } = render(<ProgressIndicator current={0} total={3} />);

      expect(screen.getByLabelText('Screen 1 (current)')).toBeInTheDocument();

      rerender(<ProgressIndicator current={1} total={3} />);

      expect(screen.getByLabelText('Screen 1 (completed)')).toBeInTheDocument();
      expect(screen.getByLabelText('Screen 2 (current)')).toBeInTheDocument();
    });

    it('should update when current changes from 1 to 2', () => {
      const { rerender } = render(<ProgressIndicator current={1} total={3} />);

      expect(screen.getByLabelText('Screen 2 (current)')).toBeInTheDocument();

      rerender(<ProgressIndicator current={2} total={3} />);

      expect(screen.getByLabelText('Screen 2 (completed)')).toBeInTheDocument();
      expect(screen.getByLabelText('Screen 3 (current)')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single screen', () => {
      render(<ProgressIndicator current={0} total={1} />);

      expect(screen.getByLabelText('Screen 1 (current)')).toBeInTheDocument();
      expect(screen.getAllByRole('presentation')).toHaveLength(1);
    });

    it('should handle many screens', () => {
      render(<ProgressIndicator current={3} total={10} />);

      const dots = screen.getAllByRole('presentation');
      expect(dots).toHaveLength(10);

      // 3 completed, 1 current, 6 upcoming
      expect(screen.getByLabelText('Screen 1 (completed)')).toBeInTheDocument();
      expect(screen.getByLabelText('Screen 2 (completed)')).toBeInTheDocument();
      expect(screen.getByLabelText('Screen 3 (completed)')).toBeInTheDocument();
      expect(screen.getByLabelText('Screen 4 (current)')).toBeInTheDocument();
      expect(screen.getByLabelText('Screen 5 (upcoming)')).toBeInTheDocument();
    });
  });
});
