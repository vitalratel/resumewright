/**
 * PopupContainer Component Tests
 *
 * Tests PopupContainer for proper fixed-size container rendering
 * and overflow handling for extension popup.
 */

import { render } from '@testing-library/react';
import { describe, expect } from 'vitest';
import { PopupContainer } from '../PopupContainer';

// Test constants for popup dimensions and test content
const POPUP_DIMENSIONS = {
  WIDTH: 'max-w-md', // From tokens.layout.maxWidthPopup (448px in Tailwind)
  HEIGHT: '600px',
} as const;

const TEST_CONTENT = {
  SIMPLE: 'Test',
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

describe('PopupContainer', () => {
  describe('Rendering', () => {
    it('renders children', () => {
      const { getByText } = render(
        <PopupContainer>
          <div>{TEST_CONTENT.SIMPLE} Content</div>
        </PopupContainer>,
      );
      expect(getByText(`${TEST_CONTENT.SIMPLE} Content`)).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      const { getByText } = render(
        <PopupContainer>
          <div>{TEST_CONTENT.FIRST}</div>
          <div>{TEST_CONTENT.SECOND}</div>
        </PopupContainer>,
      );
      expect(getByText(TEST_CONTENT.FIRST)).toBeInTheDocument();
      expect(getByText(TEST_CONTENT.SECOND)).toBeInTheDocument();
    });

    it('renders complex children', () => {
      const { getByText } = render(
        <PopupContainer>
          <header>{TEST_CONTENT.HEADER}</header>
          <main>{TEST_CONTENT.MAIN}</main>
          <footer>{TEST_CONTENT.FOOTER}</footer>
        </PopupContainer>,
      );
      expect(getByText(TEST_CONTENT.HEADER)).toBeInTheDocument();
      expect(getByText(TEST_CONTENT.MAIN)).toBeInTheDocument();
      expect(getByText(TEST_CONTENT.FOOTER)).toBeInTheDocument();
    });
  });

  describe('Container Styling', () => {
    it('applies overflow-hidden class', () => {
      const { container } = render(
        <PopupContainer>
          <div>{TEST_CONTENT.SIMPLE}</div>
        </PopupContainer>,
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('overflow-hidden');
    });

    it('has fixed width from tokens', () => {
      const { container } = render(
        <PopupContainer>
          <div>{TEST_CONTENT.SIMPLE}</div>
        </PopupContainer>,
      );
      const wrapper = container.firstChild as HTMLElement;
      // maxWidthPopup token value is 'max-w-md' which is 448px in Tailwind
      expect(wrapper).toHaveStyle({ width: POPUP_DIMENSIONS.WIDTH });
    });

    it('has fixed height of 600px', () => {
      const { container } = render(
        <PopupContainer>
          <div>{TEST_CONTENT.SIMPLE}</div>
        </PopupContainer>,
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ height: POPUP_DIMENSIONS.HEIGHT });
    });

    it('uses static style object for performance', () => {
      const { container, rerender } = render(
        <PopupContainer>
          <div>{TEST_CONTENT.FIRST_RENDER}</div>
        </PopupContainer>,
      );
      const firstStyle = (container.firstChild as HTMLElement).style;

      rerender(
        <PopupContainer>
          <div>{TEST_CONTENT.SECOND_RENDER}</div>
        </PopupContainer>,
      );
      const secondStyle = (container.firstChild as HTMLElement).style;

      // Style object should be the same reference (memoized)
      expect(firstStyle.width).toBe(secondStyle.width);
      expect(firstStyle.height).toBe(secondStyle.height);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children', () => {
      const { container } = render(<PopupContainer>{null}</PopupContainer>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles undefined children', () => {
      const { container } = render(<PopupContainer>{undefined}</PopupContainer>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles multiple children', () => {
      const { getByText } = render(
        <PopupContainer>
          <div>{TEST_CONTENT.FRAGMENT_CHILD_1}</div>
          <div>{TEST_CONTENT.FRAGMENT_CHILD_2}</div>
        </PopupContainer>,
      );
      expect(getByText(TEST_CONTENT.FRAGMENT_CHILD_1)).toBeInTheDocument();
      expect(getByText(TEST_CONTENT.FRAGMENT_CHILD_2)).toBeInTheDocument();
    });

    it('handles deeply nested children', () => {
      const { getByText } = render(
        <PopupContainer>
          <div>
            <div>
              <div>
                <span>{TEST_CONTENT.DEEPLY_NESTED}</span>
              </div>
            </div>
          </div>
        </PopupContainer>,
      );
      expect(getByText(TEST_CONTENT.DEEPLY_NESTED)).toBeInTheDocument();
    });
  });
});
