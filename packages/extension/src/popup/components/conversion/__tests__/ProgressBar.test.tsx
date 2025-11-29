/**
 * ProgressBar Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  describe('Rendering', () => {
    it('should render progress bar at 0%', () => {
      const { container } = render(<ProgressBar percentage={0} />);
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should render progress bar at 50%', () => {
      const { container } = render(<ProgressBar percentage={50} />);
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveStyle({ width: '50%' });
    });

    it('should render progress bar at 100%', () => {
      const { container } = render(<ProgressBar percentage={100} />);
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('should display percentage text when >= 10%', () => {
      render(<ProgressBar percentage={50} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should display percentage text even when < 10%', () => {
      render(<ProgressBar percentage={5} />);
      expect(screen.getByText('5%')).toBeInTheDocument();
    });

    it('should clamp percentage to 0-100 range', () => {
      const { container, rerender } = render(<ProgressBar percentage={-10} />);
      let progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');

      rerender(<ProgressBar percentage={150} />);
      progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('Variants', () => {
    it('should render default variant with blue color', () => {
      const { container } = render(<ProgressBar percentage={50} variant="default" />);
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveClass('bg-blue-600');
    });

    it('should render success variant with green color', () => {
      const { container } = render(<ProgressBar percentage={100} variant="success" />);
      const progressBar = container.querySelector('[role="progressbar"]');
      // Now uses semantic token instead of hardcoded color
      expect(progressBar?.className).toMatch(/bg-green/);
    });

    it('should render error variant with red color', () => {
      const { container } = render(<ProgressBar percentage={50} variant="error" />);
      const progressBar = container.querySelector('[role="progressbar"]');
      // Now uses semantic token instead of hardcoded color
      expect(progressBar?.className).toMatch(/bg-red/);
    });
  });

  describe('Animation', () => {
    it('should add transition classes by default', () => {
      const { container } = render(<ProgressBar percentage={50} />);
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveClass('transition-[width]');
      expect(progressBar).toHaveClass('duration-300');
      expect(progressBar).toHaveClass('ease-out');
    });

    it('should not add transition classes when animated=false', () => {
      const { container } = render(<ProgressBar percentage={50} animated={false} />);
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).not.toHaveClass('transition-[width]');
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      const { container } = render(<ProgressBar percentage={50} />);
      const progressBar = container.querySelector('[role="progressbar"]');

      expect(progressBar).toHaveAttribute('role', 'progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });
});
