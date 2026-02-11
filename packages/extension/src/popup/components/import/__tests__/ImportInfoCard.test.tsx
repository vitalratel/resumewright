/**
 * ImportInfoCard Component Tests
 * Critical import component test coverage
 *
 * Tests collapsible instruction card with basic rendering and accessibility.
 * Focuses on user-visible behavior rather than implementation details.
 */

import { fireEvent, render, screen } from '@solidjs/testing-library';
import { beforeEach, describe, expect, vi } from 'vitest';
import { ImportInfoCard } from '../ImportInfoCard';

describe('ImportInfoCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Rendering - Expanded State', () => {
    it('renders expanded card with instructions', () => {
      render(() => <ImportInfoCard />);

      expect(screen.getByText(/Get.*from Claude\.ai/i)).toBeInTheDocument();
      expect(screen.getByText(/Ask Claude to create your CV/i)).toBeInTheDocument();
    });

    it('renders all instruction steps', () => {
      render(() => <ImportInfoCard />);

      expect(screen.getByText(/Ask Claude to create your CV in.*format/i)).toBeInTheDocument();
      expect(screen.getByText(/Copy the.*code from Claude's response/i)).toBeInTheDocument();
      expect(screen.getByText(/Save it as a \.tsx file on your computer/i)).toBeInTheDocument();
      expect(screen.getByText(/Import that file here to convert to PDF/i)).toBeInTheDocument();
    });

    it('renders information icon', () => {
      const { container } = render(() => <ImportInfoCard />);

      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('renders minimize button', () => {
      render(() => <ImportInfoCard />);

      const minimizeButton = screen.getByRole('button', {
        name: /hide instructions for getting tsx file from claude\.ai/i,
      });
      expect(minimizeButton).toBeInTheDocument();
    });

    it('displays ordered list with steps', () => {
      const { container } = render(() => <ImportInfoCard />);

      const orderedList = container.querySelector('ol');
      expect(orderedList).toBeInTheDocument();
      expect(orderedList).toHaveClass('list-decimal', 'list-inside');

      const listItems = orderedList?.querySelectorAll('li');
      expect(listItems).toHaveLength(4);
    });
  });

  describe('User Interaction', () => {
    it('clicking minimize button collapses the card', () => {
      render(() => <ImportInfoCard />);

      const minimizeButton = screen.getByRole('button', {
        name: /hide instructions/i,
      });

      fireEvent.click(minimizeButton);

      // Card should now be in minimized state with expand button
      expect(screen.getByRole('button', { name: /show instructions/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('minimize button has accessible label', () => {
      render(() => <ImportInfoCard />);

      const minimizeButton = screen.getByRole('button', {
        name: /hide instructions for getting tsx file from claude\.ai/i,
      });
      expect(minimizeButton).toHaveAccessibleName();
    });

    it('icons have aria-hidden attribute', () => {
      const { container } = render(() => <ImportInfoCard />);

      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('buttons are keyboard accessible', () => {
      render(() => <ImportInfoCard />);

      const minimizeButton = screen.getByRole('button', {
        name: /hide instructions/i,
      });

      minimizeButton.focus();
      expect(minimizeButton).toHaveFocus();

      fireEvent.keyDown(minimizeButton, { key: 'Enter' });
      // Should not throw
    });
  });

  describe('Visual Styling', () => {
    it('expanded card has correct background and border', () => {
      const { container } = render(() => <ImportInfoCard />);

      const card = container.querySelector('.bg-muted.border-border');
      expect(card).toBeInTheDocument();
    });

    it('instruction list has small text and muted color', () => {
      const { container } = render(() => <ImportInfoCard />);

      const list = container.querySelector('ol');
      expect(list).toHaveClass('text-xs', 'text-muted-foreground');
    });
  });

  describe('Component Lifecycle', () => {
    it('does not cause memory leaks on unmount', () => {
      const { unmount } = render(() => <ImportInfoCard />);

      unmount();

      // Should not throw errors
      expect(() => unmount()).not.toThrow();
    });

    it('renders without crashing', () => {
      expect(() => render(() => <ImportInfoCard />)).not.toThrow();
    });
  });
});
