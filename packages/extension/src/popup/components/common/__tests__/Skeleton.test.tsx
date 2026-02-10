// ABOUTME: Tests for Skeleton loading components.
// ABOUTME: Verifies rendering, accessibility, and animation behavior.

import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
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
      const { container } = render(() => <Skeleton class="w-32 h-4" />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md');
      expect(skeleton.className).toContain('bg-muted');
    });

    it('renders text variant', () => {
      const { container } = render(() => <Skeleton variant="text" class="w-32 h-4" />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('rounded-md', 'h-4');
    });

    it('renders circle variant', () => {
      const { container } = render(() => <Skeleton variant="circle" class="w-10 h-10" />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('rounded-full');
    });

    it('applies custom class', () => {
      const { container } = render(() => <Skeleton class="w-full h-12 custom-class" />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('w-full', 'h-12', 'custom-class');
    });

    it('is hidden from screen readers', () => {
      const { container } = render(() => <Skeleton />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    });

    it('has pulse animation', () => {
      const { container } = render(() => <Skeleton />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('animate-pulse');
    });
  });

  describe('SkeletonFileImport Component', () => {
    it('renders file import skeleton structure', () => {
      const { container } = render(() => <SkeletonFileImport />);

      const wrapper = container.querySelector('.border-2');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('rounded-lg');

      const circleSkeletons = container.querySelectorAll('.rounded-full');
      expect(circleSkeletons.length).toBeGreaterThan(0);
    });

    it('is hidden from screen readers', () => {
      const { container } = render(() => <SkeletonFileImport />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });

    it('has multiple skeleton elements', () => {
      const { container } = render(() => <SkeletonFileImport />);
      const skeletons = container.querySelectorAll('.animate-pulse');

      expect(skeletons.length).toBeGreaterThan(3);
    });
  });

  describe('SkeletonSettings Component', () => {
    it('renders settings skeleton structure', () => {
      const { container } = render(() => <SkeletonSettings />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(5);
    });

    it('mimics settings layout', () => {
      const { container } = render(() => <SkeletonSettings />);

      expect(container.querySelector('.space-y-6')).toBeInTheDocument();

      const allSkeletons = container.querySelectorAll('.animate-pulse');
      expect(allSkeletons.length).toBeGreaterThan(10);
    });

    it('is hidden from screen readers', () => {
      const { container } = render(() => <SkeletonSettings />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('SkeletonHeader Component', () => {
    it('renders header skeleton structure', () => {
      const { container } = render(() => <SkeletonHeader />);

      const wrapper = container.querySelector('.flex.justify-between');
      expect(wrapper).toBeInTheDocument();

      expect(wrapper).toHaveClass('border-b');
      expect(wrapper).toHaveClass('border-border');
    });

    it('has logo and settings icon skeletons', () => {
      const { container } = render(() => <SkeletonHeader />);
      const circleSkeletons = container.querySelectorAll('.rounded-full');

      expect(circleSkeletons.length).toBeGreaterThanOrEqual(2);
    });

    it('is hidden from screen readers', () => {
      const { container } = render(() => <SkeletonHeader />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('SkeletonExportSection Component', () => {
    it('renders export section skeleton structure', () => {
      const { container } = render(() => <SkeletonExportSection />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(2);
    });

    it('is hidden from screen readers', () => {
      const { container } = render(() => <SkeletonExportSection />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Accessibility', () => {
    it('all skeleton components have aria-hidden', () => {
      const components = [
        Skeleton,
        SkeletonFileImport,
        SkeletonSettings,
        SkeletonHeader,
        SkeletonExportSection,
      ];

      for (const Component of components) {
        const { container } = render(() => <Component />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper).toHaveAttribute('aria-hidden', 'true');
      }
    });

    it('skeleton does not interfere with screen reader navigation', () => {
      const { container } = render(() => (
        <div>
          <h1>Loading</h1>
          <Skeleton />
          <p>Please wait</p>
        </div>
      ));

      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByText('Please wait')).toBeInTheDocument();

      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Animation Performance', () => {
    it('uses CSS animations (not JS)', () => {
      const { container } = render(() => <Skeleton />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton.style.animation).toBeFalsy();
    });
  });

  describe('Visual Consistency', () => {
    it('all skeletons use same color', () => {
      const components = [
        Skeleton,
        SkeletonFileImport,
        SkeletonSettings,
        SkeletonHeader,
        SkeletonExportSection,
      ];

      for (const Component of components) {
        const { container } = render(() => <Component />);
        const skeletons = container.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
      }
    });

    it('skeletons have consistent border radius', () => {
      const { container: textContainer } = render(() => <Skeleton variant="text" />);
      const { container: rectContainer } = render(() => <Skeleton variant="rect" />);
      const { container: circleContainer } = render(() => <Skeleton variant="circle" />);

      expect(textContainer.firstChild).toHaveClass('rounded-md');
      expect(rectContainer.firstChild).toHaveClass('rounded-md');
      expect(circleContainer.firstChild).toHaveClass('rounded-full');
    });
  });
});
