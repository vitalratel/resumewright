/**
 * ABOUTME: Tests for LoadingScreen WASM initialization state with skeleton screens.
 * ABOUTME: Validates rendering, accessibility, timeout fallback, and skeleton integration.
 */

import { render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
      const { container } = render(() => <LoadingScreen />);

      const spinner = container.querySelector('.border-4.border-primary\\/20.border-t-primary');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('renders loading messages', () => {
      render(() => <LoadingScreen />);

      expect(screen.getByText(/loading pdf converter/i)).toBeInTheDocument();
      expect(screen.getByText(/first launch may take a few seconds/i)).toBeInTheDocument();
    });

    it('renders skeleton components', () => {
      const { container } = render(() => <LoadingScreen />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(5);
    });

    it('has proper layout structure', () => {
      const { container } = render(() => <LoadingScreen />);

      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('flex', 'flex-col', 'h-full');
    });
  });

  describe('Accessibility', () => {
    it('has aria-live region for loading state', () => {
      const { container } = render(() => <LoadingScreen />);

      const root = container.firstChild as HTMLElement;
      expect(root).toHaveAttribute('aria-live', 'polite');
    });

    it('has sr-only text describing loading state', () => {
      render(() => <LoadingScreen />);

      const srOnly = screen.getByText('Loading extension, please wait...');
      expect(srOnly).toHaveClass('sr-only');
    });

    it('has aria-busy on root element', () => {
      const { container } = render(() => <LoadingScreen />);

      const root = container.firstChild as HTMLElement;
      expect(root).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-live="polite" on root element', () => {
      const { container } = render(() => <LoadingScreen />);

      const root = container.firstChild as HTMLElement;
      expect(root).toHaveAttribute('aria-live', 'polite');
    });

    it('has screen reader only text', () => {
      render(() => <LoadingScreen />);

      const srOnly = screen.getByText('Loading extension, please wait...');
      expect(srOnly).toBeInTheDocument();
      expect(srOnly).toHaveClass('sr-only');
    });
  });

  describe('Timeout Fallback', () => {
    it('does not show timeout message initially', () => {
      render(() => <LoadingScreen />);

      expect(screen.queryByText(/taking longer than expected/i)).not.toBeInTheDocument();
    });

    it('shows timeout message after 30 seconds', () => {
      render(() => <LoadingScreen />);

      vi.advanceTimersByTime(30000);

      expect(screen.getByText(/taking longer than expected/i)).toBeInTheDocument();
    });

    it('timeout message has reload button', () => {
      render(() => <LoadingScreen />);

      vi.advanceTimersByTime(30000);

      const reloadButton = screen.getByRole('button', { name: /reload extension/i });
      expect(reloadButton).toBeInTheDocument();
    });

    it('does not show timeout before 30 seconds', () => {
      render(() => <LoadingScreen />);

      vi.advanceTimersByTime(29000);

      expect(screen.queryByText(/taking longer than expected/i)).not.toBeInTheDocument();
    });

    it('cleans up timeout on unmount', () => {
      const { unmount } = render(() => <LoadingScreen />);

      unmount();

      // Timer should be cleared, so advancing time should not cause errors
      vi.advanceTimersByTime(35000);
    });
  });

  describe('Skeleton Integration', () => {
    it('renders SkeletonHeader', () => {
      const { container } = render(() => <LoadingScreen />);

      const header = container.querySelector('.border-b');
      expect(header).toBeInTheDocument();
    });

    it('renders SkeletonFileImport', () => {
      const { container } = render(() => <LoadingScreen />);

      const fileImport = container.querySelector('.border-2');
      expect(fileImport).toBeInTheDocument();
    });

    it('renders SkeletonExportSection', () => {
      const { container } = render(() => <LoadingScreen />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(5);
    });

    it('skeleton components have reduced opacity', () => {
      const { container } = render(() => <LoadingScreen />);

      const opacityContainers = container.querySelectorAll('.opacity-50');
      expect(opacityContainers.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Visual Elements', () => {
    it('has dual ring spinner animation', () => {
      const { container } = render(() => <LoadingScreen />);

      const outerRing = container.querySelector('.h-12.w-12.border-4');
      expect(outerRing).toBeInTheDocument();
      expect(outerRing).toHaveClass('rounded-full', 'border-primary/20', 'border-t-primary');

      const innerPulse = container.querySelector('.h-6.w-6.bg-primary\\/10');
      expect(innerPulse).toBeInTheDocument();
      expect(innerPulse).toHaveClass('rounded-full', 'animate-pulse');
    });

    it('applies fade-in animation to main content', () => {
      const { container } = render(() => <LoadingScreen />);

      const mainContent = container.querySelector('.flex-1');
      expect(mainContent?.className).toContain('animate-fade-in');
    });

    it('centers spinner and messages', () => {
      const { container } = render(() => <LoadingScreen />);

      const messageContainer = container.querySelector('.text-center');
      expect(messageContainer).toBeInTheDocument();
    });
  });
});
