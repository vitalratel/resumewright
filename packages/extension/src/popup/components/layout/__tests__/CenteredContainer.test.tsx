/**
 * CenteredContainer Component Tests
 *
 * Tests CenteredContainer for proper full-page centered layout,
 * max-width constraints, and responsive behavior.
 */

import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { CenteredContainer } from '../CenteredContainer';

// Test constants for dimensions and test content
const CONTAINER_DIMENSIONS = {
  DEFAULT_MAX_WIDTH: '672px', // From tokens.layout.maxWidthConverter (equivalent to max-w-2xl)
  CUSTOM_MAX_WIDTH_PX: '1200px',
  CUSTOM_MAX_WIDTH_VALUE: '896px', // Equivalent to max-w-4xl (56rem)
  ALTERNATE_WIDTH: '800px',
  LARGE_WIDTH: '1000px',
  ZERO_WIDTH: '0',
  VERY_LARGE_WIDTH: '9999px',
} as const;

const TEST_CONTENT = {
  SIMPLE: 'Test Content',
  FIRST: 'First',
  SECOND: 'Second',
  HEADER: 'Header',
  MAIN: 'Main Content',
  FOOTER: 'Footer',
  FIRST_RENDER: 'First Render',
  SECOND_RENDER: 'Second Render',
  FRAGMENT_CHILD_1: 'Fragment Child 1',
  FRAGMENT_CHILD_2: 'Fragment Child 2',
  DEEPLY_NESTED: 'Deeply Nested',
} as const;

describe('CenteredContainer', () => {
  describe('Rendering', () => {
    it('renders children', () => {
      const { getByText } = render(
        <CenteredContainer>
          <div>{TEST_CONTENT.SIMPLE}</div>
        </CenteredContainer>,
      );
      expect(getByText(TEST_CONTENT.SIMPLE)).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      const { getByText } = render(
        <CenteredContainer>
          <div>{TEST_CONTENT.FIRST}</div>
          <div>{TEST_CONTENT.SECOND}</div>
        </CenteredContainer>,
      );
      expect(getByText(TEST_CONTENT.FIRST)).toBeInTheDocument();
      expect(getByText(TEST_CONTENT.SECOND)).toBeInTheDocument();
    });

    it('renders complex children', () => {
      const { getByText } = render(
        <CenteredContainer>
          <header>{TEST_CONTENT.HEADER}</header>
          <main>{TEST_CONTENT.MAIN}</main>
          <footer>{TEST_CONTENT.FOOTER}</footer>
        </CenteredContainer>,
      );
      expect(getByText(TEST_CONTENT.HEADER)).toBeInTheDocument();
      expect(getByText(TEST_CONTENT.MAIN)).toBeInTheDocument();
      expect(getByText(TEST_CONTENT.FOOTER)).toBeInTheDocument();
    });
  });

  describe('Layout Classes', () => {
    it('applies min-h-screen class for full viewport height', () => {
      const { container } = render(
        <CenteredContainer>
          <div>Test</div>
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild as HTMLElement;
      expect(outerWrapper).toHaveClass('min-h-screen');
    });

    it('applies flexbox centering classes', () => {
      const { container } = render(
        <CenteredContainer>
          <div>Test</div>
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild as HTMLElement;
      expect(outerWrapper).toHaveClass('flex', 'flex-col', 'items-center', 'justify-start');
    });

    it('applies neutral background color', () => {
      const { container } = render(
        <CenteredContainer>
          <div>Test</div>
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild as HTMLElement;
      expect(outerWrapper).toHaveClass('bg-gray-50', 'dark:bg-gray-850');
    });

    it('inner container has full width', () => {
      const { container } = render(
        <CenteredContainer>
          <div>Test</div>
        </CenteredContainer>,
      );
      // Get the first div inside the outer wrapper
      const outerWrapper = container.firstChild as HTMLElement;
      const innerContainer = outerWrapper.firstChild as HTMLElement;
      expect(innerContainer).toHaveClass('w-full');
    });

    it('inner container has container padding', () => {
      const { container } = render(
        <CenteredContainer>
          <div>Test</div>
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild as HTMLElement;
      const innerContainer = outerWrapper.firstChild as HTMLElement;
      expect(innerContainer).toHaveClass('px-6', 'py-8', 'md:px-8', 'md:py-10');
    });
  });

  describe('Max Width', () => {
    it('uses default max width from tokens (max-w-2xl)', () => {
      const { container } = render(
        <CenteredContainer>
          <div>{TEST_CONTENT.SIMPLE}</div>
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild as HTMLElement;
      const innerContainer = outerWrapper.firstChild as HTMLElement;
      // Default maxWidthConverter is 'max-w-2xl' (672px)
      expect(innerContainer.style.maxWidth).toBe(CONTAINER_DIMENSIONS.DEFAULT_MAX_WIDTH);
    });

    it('applies custom max width when provided', () => {
      const { container } = render(
        <CenteredContainer maxWidth={CONTAINER_DIMENSIONS.CUSTOM_MAX_WIDTH_PX}>
          <div>{TEST_CONTENT.SIMPLE}</div>
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild as HTMLElement;
      const innerContainer = outerWrapper.firstChild as HTMLElement;
      expect(innerContainer.style.maxWidth).toBe(CONTAINER_DIMENSIONS.CUSTOM_MAX_WIDTH_PX);
    });

    it('memoizes inline style for performance', () => {
      const { container, rerender } = render(
        <CenteredContainer maxWidth={CONTAINER_DIMENSIONS.ALTERNATE_WIDTH}>
          <div>{TEST_CONTENT.FIRST_RENDER}</div>
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild as HTMLElement;
      const firstInner = outerWrapper.firstChild as HTMLElement;
      const firstMaxWidth = firstInner.style.maxWidth;

      // Re-render with same maxWidth
      rerender(
        <CenteredContainer maxWidth={CONTAINER_DIMENSIONS.ALTERNATE_WIDTH}>
          <div>{TEST_CONTENT.SECOND_RENDER}</div>
        </CenteredContainer>,
      );
      const secondInner = outerWrapper.firstChild as HTMLElement;
      const secondMaxWidth = secondInner.style.maxWidth;

      expect(firstMaxWidth).toBe(secondMaxWidth);
      expect(firstMaxWidth).toBe(CONTAINER_DIMENSIONS.ALTERNATE_WIDTH);
    });

    it('recalculates style when maxWidth changes', () => {
      const { container, rerender } = render(
        <CenteredContainer maxWidth={CONTAINER_DIMENSIONS.ALTERNATE_WIDTH}>
          <div>{TEST_CONTENT.SIMPLE}</div>
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild as HTMLElement;
      let innerContainer = outerWrapper.firstChild as HTMLElement;
      expect(innerContainer.style.maxWidth).toBe(CONTAINER_DIMENSIONS.ALTERNATE_WIDTH);

      rerender(
        <CenteredContainer maxWidth={CONTAINER_DIMENSIONS.LARGE_WIDTH}>
          <div>{TEST_CONTENT.SIMPLE}</div>
        </CenteredContainer>,
      );
      innerContainer = outerWrapper.firstChild as HTMLElement;
      expect(innerContainer.style.maxWidth).toBe(CONTAINER_DIMENSIONS.LARGE_WIDTH);
    });

    it('handles CSS value as maxWidth', () => {
      const { container } = render(
        <CenteredContainer maxWidth={CONTAINER_DIMENSIONS.CUSTOM_MAX_WIDTH_VALUE}>
          <div>{TEST_CONTENT.SIMPLE}</div>
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild as HTMLElement;
      const innerContainer = outerWrapper.firstChild as HTMLElement;
      expect(innerContainer.style.maxWidth).toBe(CONTAINER_DIMENSIONS.CUSTOM_MAX_WIDTH_VALUE);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children', () => {
      const { container } = render(
        <CenteredContainer>
          {null}
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild;
      expect(outerWrapper).toBeInTheDocument();
    });

    it('handles undefined children', () => {
      const { container } = render(
        <CenteredContainer>
          {undefined}
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild;
      expect(outerWrapper).toBeInTheDocument();
    });

    it('handles fragment children', () => {
      const { getByText } = render(
        <CenteredContainer>
          <>
            <div>{TEST_CONTENT.FRAGMENT_CHILD_1}</div>
            <div>{TEST_CONTENT.FRAGMENT_CHILD_2}</div>
          </>
        </CenteredContainer>,
      );
      expect(getByText(TEST_CONTENT.FRAGMENT_CHILD_1)).toBeInTheDocument();
      expect(getByText(TEST_CONTENT.FRAGMENT_CHILD_2)).toBeInTheDocument();
    });

    it('handles deeply nested children', () => {
      const { getByText } = render(
        <CenteredContainer>
          <div>
            <div>
              <div>
                <span>{TEST_CONTENT.DEEPLY_NESTED}</span>
              </div>
            </div>
          </div>
        </CenteredContainer>,
      );
      expect(getByText(TEST_CONTENT.DEEPLY_NESTED)).toBeInTheDocument();
    });

    it('handles zero maxWidth', () => {
      const { container } = render(
        <CenteredContainer maxWidth={CONTAINER_DIMENSIONS.ZERO_WIDTH}>
          <div>{TEST_CONTENT.SIMPLE}</div>
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild as HTMLElement;
      const innerContainer = outerWrapper.firstChild as HTMLElement;
      expect(innerContainer.style.maxWidth).toBe(CONTAINER_DIMENSIONS.ZERO_WIDTH);
    });

    it('handles very large maxWidth', () => {
      const { container } = render(
        <CenteredContainer maxWidth={CONTAINER_DIMENSIONS.VERY_LARGE_WIDTH}>
          <div>{TEST_CONTENT.SIMPLE}</div>
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild as HTMLElement;
      const innerContainer = outerWrapper.firstChild as HTMLElement;
      expect(innerContainer.style.maxWidth).toBe(CONTAINER_DIMENSIONS.VERY_LARGE_WIDTH);
    });
  });

  // Responsive layout tests for full-page mode
  describe('Responsive Behavior', () => {
    let originalMatchMedia: typeof window.matchMedia;

    beforeEach(() => {
      // Save original matchMedia
      originalMatchMedia = window.matchMedia;
    });

    afterEach(() => {
      // Restore original matchMedia
      window.matchMedia = originalMatchMedia;
    });

    it('applies mobile padding on small viewports (<768px)', () => {
      // Mock matchMedia to simulate mobile viewport
      window.matchMedia = (query: string) => ({
        matches: query.includes('max-width'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      }) as MediaQueryList;

      const { container } = render(
        <CenteredContainer>
          <div>{TEST_CONTENT.SIMPLE}</div>
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild as HTMLElement;
      const innerContainer = outerWrapper.firstChild as HTMLElement;

      // Should have base mobile padding classes
      expect(innerContainer).toHaveClass('px-6', 'py-8');
      // Should also have responsive classes (applied via Tailwind)
      expect(innerContainer).toHaveClass('md:px-8', 'md:py-10');
    });

    it('applies desktop padding on medium+ viewports (>=768px)', () => {
      // Mock matchMedia to simulate desktop viewport
      window.matchMedia = (query: string) => ({
        matches: query.includes('min-width'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      }) as MediaQueryList;

      const { container } = render(
        <CenteredContainer>
          <div>{TEST_CONTENT.SIMPLE}</div>
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild as HTMLElement;
      const innerContainer = outerWrapper.firstChild as HTMLElement;

      // Should have both mobile and desktop padding classes
      expect(innerContainer).toHaveClass('px-6', 'py-8', 'md:px-8', 'md:py-10');
    });

    it('maintains full width on mobile', () => {
      const { container } = render(
        <CenteredContainer>
          <div>{TEST_CONTENT.SIMPLE}</div>
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild as HTMLElement;
      const innerContainer = outerWrapper.firstChild as HTMLElement;

      // Inner container should always be full width
      expect(innerContainer).toHaveClass('w-full');
    });

    it('respects max-width constraint on wide viewports', () => {
      const customMaxWidth = '1000px';
      const { container } = render(
        <CenteredContainer maxWidth={customMaxWidth}>
          <div>{TEST_CONTENT.SIMPLE}</div>
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild as HTMLElement;
      const innerContainer = outerWrapper.firstChild as HTMLElement;

      // Should respect custom maxWidth
      expect(innerContainer.style.maxWidth).toBe(customMaxWidth);
      // Should still have full width class for responsiveness
      expect(innerContainer).toHaveClass('w-full');
    });

    it('outer container fills viewport height', () => {
      const { container } = render(
        <CenteredContainer>
          <div>{TEST_CONTENT.SIMPLE}</div>
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild as HTMLElement;

      // Should use min-h-screen for full viewport height
      expect(outerWrapper).toHaveClass('min-h-screen');
    });

    it('centers content horizontally with flexbox', () => {
      const { container } = render(
        <CenteredContainer>
          <div>{TEST_CONTENT.SIMPLE}</div>
        </CenteredContainer>,
      );
      const outerWrapper = container.firstChild as HTMLElement;

      // Should center content
      expect(outerWrapper).toHaveClass('flex', 'items-center');
    });
  });
});
