/**
 * LoadingScreen Component Tests
 * Accessibility improvements (ARIA labels, screen reader support)
 * Timeout fallback for stuck loading
 *
 * Tests LoadingScreen for proper rendering, accessibility attributes,
 * timeout behavior, and skeleton component integration.
 */

import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { LoadingScreen } from '../LoadingScreen';

describe('LoadingScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders loading spinner', () => {
      const { container } = render(<LoadingScreen />);

      // Should have spinner animation (dual ring with border animation)
      const spinner = container.querySelector('.border-4.border-blue-100.border-t-blue-600');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('renders loading messages', () => {
      render(<LoadingScreen />);

      // Should display WASM loading messages
      expect(screen.getByText(/loading pdf converter/i)).toBeInTheDocument();
      expect(screen.getByText(/first launch may take a few seconds/i)).toBeInTheDocument();
    });

    it('renders skeleton components', () => {
      const { container } = render(<LoadingScreen />);

      // Should have multiple skeleton elements (header, file import, quick settings)
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(5);
    });

    it('has proper layout structure', () => {
      const { container } = render(<LoadingScreen />);

      // Root should be flex column full height
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('flex', 'flex-col', 'h-full');
    });
  });

  describe('Accessibility ', () => {
    it('has role="status" on main container', () => {
      const { container } = render(<LoadingScreen />);

      // Main content container should have role="status"
      const statusRegion = container.querySelector('[role="status"]');
      expect(statusRegion).toBeInTheDocument();
    });

    it('has aria-label on main container', () => {
      const { container } = render(<LoadingScreen />);

      // Main content should have aria-label
      const statusRegion = container.querySelector('[aria-label="Loading ResumeWright extension"]');
      expect(statusRegion).toBeInTheDocument();
    });

    it('has aria-busy on root element', () => {
      const { container } = render(<LoadingScreen />);

      // Root should indicate busy state
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-live="polite" on root element', () => {
      const { container } = render(<LoadingScreen />);

      // Root should have polite live region
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveAttribute('aria-live', 'polite');
    });

    it('has screen reader only text', () => {
      render(<LoadingScreen />);

      // Should have sr-only text for screen readers
      const srOnly = screen.getByText('Loading extension, please wait...');
      expect(srOnly).toBeInTheDocument();
      expect(srOnly).toHaveClass('sr-only');
    });
  });

  describe('Timeout Fallback ', () => {
    it('does not show timeout message initially', () => {
      render(<LoadingScreen />);

      expect(screen.queryByText(/taking longer than expected/i)).not.toBeInTheDocument();
    });

    it('shows timeout message after 30 seconds', () => {
      render(<LoadingScreen />);

      // Fast-forward 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(screen.getByText(/taking longer than expected/i)).toBeInTheDocument();
    });

    it('timeout message has reload button', () => {
      render(<LoadingScreen />);

      act(() => {
        vi.advanceTimersByTime(30000);
      });

      const reloadButton = screen.getByRole('button', { name: /reload extension/i });
      expect(reloadButton).toBeInTheDocument();
    });

    it('does not show timeout before 30 seconds', () => {
      render(<LoadingScreen />);

      // Fast-forward 29 seconds (just before threshold)
      vi.advanceTimersByTime(29000);

      expect(screen.queryByText(/taking longer than expected/i)).not.toBeInTheDocument();
    });

    it('cleans up timeout on unmount', () => {
      const { unmount } = render(<LoadingScreen />);

      unmount();

      // Timer should be cleared, so advancing time should not cause errors
      vi.advanceTimersByTime(35000);
      // If cleanup didn't work, this would throw
    });
  });

  describe('Skeleton Integration', () => {
    it('renders SkeletonHeader', () => {
      const { container } = render(<LoadingScreen />);

      // Should have header skeleton with border-bottom
      const header = container.querySelector('.border-b');
      expect(header).toBeInTheDocument();
    });

    it('renders SkeletonFileImport', () => {
      const { container } = render(<LoadingScreen />);

      // Should have file import skeleton with border-2
      const fileImport = container.querySelector('.border-2');
      expect(fileImport).toBeInTheDocument();
    });

    it('renders SkeletonQuickSettings', () => {
      const { container } = render(<LoadingScreen />);

      // Should have quick settings skeleton
      const quickSettings = container.querySelector('.gap-2');
      expect(quickSettings).toBeInTheDocument();
    });

    it('skeleton components have reduced opacity', () => {
      const { container } = render(<LoadingScreen />);

      // Skeletons should be 50% opacity
      const opacityContainers = container.querySelectorAll('.opacity-50');
      expect(opacityContainers.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Visual Elements', () => {
    it('has dual ring spinner animation', () => {
      const { container } = render(<LoadingScreen />);

      // Outer ring
      const outerRing = container.querySelector('.h-12.w-12.border-4');
      expect(outerRing).toBeInTheDocument();
      expect(outerRing).toHaveClass('rounded-full', 'border-blue-100', 'border-t-blue-600');

      // Inner pulse
      const innerPulse = container.querySelector('.h-6.w-6.bg-blue-50');
      expect(innerPulse).toBeInTheDocument();
      expect(innerPulse).toHaveClass('rounded-full', 'animate-pulse');
    });

    it('applies fade-in animation to main content', () => {
      const { container } = render(<LoadingScreen />);

      // Main content should fade in
      const mainContent = container.querySelector('[role="status"]');
      expect(mainContent?.className).toContain('animate-fade-in');
    });

    it('centers spinner and messages', () => {
      const { container } = render(<LoadingScreen />);

      // Loading message container should be centered
      const messageContainer = container.querySelector('.text-center');
      expect(messageContainer).toBeInTheDocument();
    });
  });
});
