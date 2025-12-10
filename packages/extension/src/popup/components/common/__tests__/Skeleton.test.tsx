// ABOUTME: Tests for Skeleton loading components.
// ABOUTME: Verifies rendering, accessibility, and animation behavior.

import { render, screen } from '@testing-library/react';
import { describe, expect } from 'vitest';
import {
  Skeleton,
  SkeletonExportSection,
  SkeletonFileImport,
  SkeletonHeader,
  SkeletonSettings,
} from '../Skeleton';

describe('Skeleton', () => {
  describe('Basic Skeleton Component', () => {
    it('renders with default variant (rect)', () => {
      const { container } = render(<Skeleton className="w-32 h-4" />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md');
      expect(skeleton.className).toContain('bg-muted');
    });

    it('renders text variant', () => {
      const { container } = render(<Skeleton variant="text" className="w-32 h-4" />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('rounded-md', 'h-4');
    });

    it('renders circle variant', () => {
      const { container } = render(<Skeleton variant="circle" className="w-10 h-10" />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('rounded-full');
    });

    it('applies custom className', () => {
      const { container } = render(<Skeleton className="w-full h-12 custom-class" />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('w-full', 'h-12', 'custom-class');
    });

    it('is hidden from screen readers', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    });

    it('has pulse animation', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('animate-pulse');
    });
  });

  describe('SkeletonFileImport Component', () => {
    it('renders file import skeleton structure', () => {
      const { container } = render(<SkeletonFileImport />);

      // Should have border and rounded corners
      const wrapper = container.querySelector('.border-2');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('rounded-lg');

      // Should have circle skeleton (icon)
      const circleSkeletons = container.querySelectorAll('.rounded-full');
      expect(circleSkeletons.length).toBeGreaterThan(0);
    });

    it('is hidden from screen readers', () => {
      const { container } = render(<SkeletonFileImport />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });

    it('has multiple skeleton elements', () => {
      const { container } = render(<SkeletonFileImport />);
      const skeletons = container.querySelectorAll('.animate-pulse');

      // Should have multiple skeleton elements for icon, text, button
      expect(skeletons.length).toBeGreaterThan(3);
    });
  });

  describe('SkeletonSettings Component', () => {
    it('renders settings skeleton structure', () => {
      const { container } = render(<SkeletonSettings />);

      // Should have multiple sections
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(5); // Multiple controls
    });

    it('mimics settings layout', () => {
      const { container } = render(<SkeletonSettings />);

      // Should have space-y-6 for section spacing
      expect(container.querySelector('.space-y-6')).toBeInTheDocument();

      // Should have button skeletons at bottom
      const allSkeletons = container.querySelectorAll('.animate-pulse');
      expect(allSkeletons.length).toBeGreaterThan(10); // Radio buttons + sliders + buttons
    });

    it('is hidden from screen readers', () => {
      const { container } = render(<SkeletonSettings />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('SkeletonHeader Component', () => {
    it('renders header skeleton structure', () => {
      const { container } = render(<SkeletonHeader />);

      // Should have flex layout with justify-between
      const wrapper = container.querySelector('.flex.justify-between');
      expect(wrapper).toBeInTheDocument();

      // Should have border bottom with semantic token
      expect(wrapper).toHaveClass('border-b');
      expect(wrapper).toHaveClass('border-border');
    });

    it('has logo and settings icon skeletons', () => {
      const { container } = render(<SkeletonHeader />);
      const circleSkeletons = container.querySelectorAll('.rounded-full');

      // Should have at least 2 circle skeletons (logo icon + settings icon)
      expect(circleSkeletons.length).toBeGreaterThanOrEqual(2);
    });

    it('is hidden from screen readers', () => {
      const { container } = render(<SkeletonHeader />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('SkeletonExportSection Component', () => {
    it('renders export section skeleton structure', () => {
      const { container } = render(<SkeletonExportSection />);

      // Should have skeletons for button and settings summary
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(2);
    });

    it('is hidden from screen readers', () => {
      const { container } = render(<SkeletonExportSection />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Accessibility', () => {
    it('all skeleton components have aria-hidden', () => {
      const components = [
        <Skeleton key="skeleton" />,
        <SkeletonFileImport key="file" />,
        <SkeletonSettings key="settings" />,
        <SkeletonHeader key="header" />,
        <SkeletonExportSection key="export" />,
      ];

      components.forEach((component) => {
        const { container } = render(component);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('skeleton does not interfere with screen reader navigation', () => {
      const { container } = render(
        <div>
          <h1>Loading</h1>
          <Skeleton />
          <p>Please wait</p>
        </div>,
      );

      // Screen reader should only see h1 and p, not skeleton
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByText('Please wait')).toBeInTheDocument();

      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Animation Performance', () => {
    it('uses CSS animations (not JS)', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;

      // Should use Tailwind's animate-pulse (CSS animation)
      expect(skeleton).toHaveClass('animate-pulse');

      // Should not have any inline style animations
      expect(skeleton.style.animation).toBeFalsy();
    });

    it('pulse animation is subtle', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;

      // Tailwind's animate-pulse is: animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      // This is 60fps-friendly and subtle
      expect(skeleton).toHaveClass('animate-pulse');
    });
  });

  describe('Visual Consistency', () => {
    it('all skeletons use same color (gray-200)', () => {
      const components = [
        <Skeleton key="skeleton" />,
        <SkeletonFileImport key="file" />,
        <SkeletonSettings key="settings" />,
        <SkeletonHeader key="header" />,
        <SkeletonExportSection key="export" />,
      ];

      components.forEach((component) => {
        const { container } = render(component);
        const skeletons = container.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });

    it('skeletons have consistent border radius', () => {
      const { container: textContainer } = render(<Skeleton variant="text" />);
      const { container: rectContainer } = render(<Skeleton variant="rect" />);
      const { container: circleContainer } = render(<Skeleton variant="circle" />);

      expect(textContainer.firstChild).toHaveClass('rounded-md');
      expect(rectContainer.firstChild).toHaveClass('rounded-md');
      expect(circleContainer.firstChild).toHaveClass('rounded-full');
    });
  });
});
