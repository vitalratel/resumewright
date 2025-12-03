/**
 * Spinner Component Tests
 *
 * Tests Spinner component for proper rendering, size variants,
 * color customization, and accessibility attributes.
 */

import { render } from '@testing-library/react';
import { describe, expect } from 'vitest';
import type { SpinnerSize } from '../Spinner';
import { Spinner } from '../Spinner';

describe('Spinner', () => {
  describe('Rendering', () => {
    it('renders an SVG element', () => {
      const { container } = render(<Spinner delayMs={0} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders with default medium size', () => {
      const { container } = render(<Spinner delayMs={0} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-6', 'h-6'); // medium size from tokens
    });

    it('renders with default blue color', () => {
      const { container } = render(<Spinner delayMs={0} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-blue-500');
    });

    it('has spinning animation', () => {
      const { container } = render(<Spinner delayMs={0} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('animate-spin');
    });
  });

  describe('Size Variants', () => {
    it.each([
      ['small' as SpinnerSize, 'w-4', 'h-4'],
      ['medium' as SpinnerSize, 'w-6', 'h-6'],
      ['large' as SpinnerSize, 'w-8', 'h-8'],
    ])('renders %s size with correct classes', (size, widthClass, heightClass) => {
      const { container } = render(<Spinner size={size} delayMs={0} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass(widthClass, heightClass);
    });
  });

  describe('Color Customization', () => {
    it('applies custom color class', () => {
      const { container } = render(<Spinner color="text-red-500" delayMs={0} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-red-500');
    });

    it('applies custom color with multiple classes', () => {
      const { container } = render(
        <Spinner color="text-green-600 dark:text-green-400" delayMs={0} />,
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-green-600', 'dark:text-green-400');
    });

    it('uses currentColor for stroke and fill', () => {
      const { container } = render(<Spinner delayMs={0} />);
      const circle = container.querySelector('circle');
      const path = container.querySelector('path');

      expect(circle).toHaveAttribute('stroke', 'currentColor');
      expect(path).toHaveAttribute('fill', 'currentColor');
    });
  });

  describe('Custom ClassName', () => {
    it('applies additional custom classes', () => {
      const { container } = render(<Spinner className="custom-class" delayMs={0} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('custom-class');
    });

    it('preserves default classes when adding custom ones', () => {
      const { container } = render(<Spinner className="custom-class" delayMs={0} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('animate-spin', 'custom-class');
    });

    it('handles empty className', () => {
      const { container } = render(<Spinner className="" delayMs={0} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('is hidden from screen readers by default', () => {
      const { container } = render(<Spinner delayMs={0} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).not.toHaveAttribute('role');
      expect(svg).not.toHaveAttribute('aria-label');
    });

    it('is accessible when ariaLabel is provided', () => {
      const { container } = render(<Spinner ariaLabel="Loading content" delayMs={0} />);
      const svg = container.querySelector('svg');
      expect(svg).not.toHaveAttribute('aria-hidden');
      expect(svg).toHaveAttribute('role', 'img');
      expect(svg).toHaveAttribute('aria-label', 'Loading content');
    });

    it('changes from decorative to accessible with ariaLabel', () => {
      const { container, rerender } = render(<Spinner delayMs={0} />);
      const svg = container.querySelector('svg');

      // Initially decorative
      expect(svg).toHaveAttribute('aria-hidden', 'true');

      // Becomes accessible
      rerender(<Spinner ariaLabel="Please wait" delayMs={0} />);
      expect(svg).not.toHaveAttribute('aria-hidden');
      expect(svg).toHaveAttribute('aria-label', 'Please wait');
    });
  });

  describe('SVG Structure', () => {
    it('renders circle element for background', () => {
      const { container } = render(<Spinner delayMs={0} />);
      const circle = container.querySelector('circle');
      expect(circle).toBeInTheDocument();
      expect(circle).toHaveClass('opacity-25');
    });

    it('renders path element for spinning arc', () => {
      const { container } = render(<Spinner delayMs={0} />);
      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
      expect(path).toHaveClass('opacity-75');
    });

    it('circle has correct dimensions', () => {
      const { container } = render(<Spinner delayMs={0} />);
      const circle = container.querySelector('circle');
      expect(circle).toHaveAttribute('cx', '12');
      expect(circle).toHaveAttribute('cy', '12');
      expect(circle).toHaveAttribute('r', '10');
      expect(circle).toHaveAttribute('stroke-width', '4'); // SVG uses kebab-case
    });

    it('uses 24x24 viewBox', () => {
      const { container } = render(<Spinner delayMs={0} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });
  });

  describe('Combined Props', () => {
    it('handles all props together', () => {
      const { container } = render(
        <Spinner
          size="large"
          color="text-purple-500"
          className="mx-auto"
          ariaLabel="Processing"
          delayMs={0}
        />,
      );
      const svg = container.querySelector('svg');

      expect(svg).toHaveClass('w-8', 'h-8'); // large
      expect(svg).toHaveClass('text-purple-500'); // color
      expect(svg).toHaveClass('mx-auto'); // className
      expect(svg).toHaveAttribute('aria-label', 'Processing'); // ariaLabel
      expect(svg).not.toHaveAttribute('aria-hidden'); // accessible
    });

    it('handles size and color variations', () => {
      const { container, rerender } = render(
        <Spinner size="small" color="text-gray-400" delayMs={0} />,
      );
      const svg = container.querySelector('svg');

      expect(svg).toHaveClass('w-4', 'h-4', 'text-gray-400');

      rerender(<Spinner size="large" color="text-blue-600" delayMs={0} />);
      expect(svg).toHaveClass('w-8', 'h-8', 'text-blue-600');
    });
  });

  describe('Memoization', () => {
    it('does not re-render with same props', () => {
      const { container, rerender } = render(
        <Spinner size="medium" color="text-blue-500" delayMs={0} />,
      );
      const svg = container.querySelector('svg');
      const initialSvg = svg;

      rerender(<Spinner size="medium" color="text-blue-500" delayMs={0} />);
      const afterRerender = container.querySelector('svg');

      // Same element instance due to memo
      expect(afterRerender).toBe(initialSvg);
    });

    it('re-renders when props change', () => {
      const { container, rerender } = render(<Spinner size="small" delayMs={0} />);

      expect(container.querySelector('svg')).toHaveClass('w-4');

      rerender(<Spinner size="large" delayMs={0} />);

      expect(container.querySelector('svg')).toHaveClass('w-8');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined props gracefully', () => {
      const { container } = render(<Spinner size={undefined} color={undefined} delayMs={0} />);
      const svg = container.querySelector('svg');

      // Should use defaults
      expect(svg).toHaveClass('w-6', 'h-6', 'text-blue-500');
    });

    it('handles empty ariaLabel', () => {
      const { container } = render(<Spinner ariaLabel="" delayMs={0} />);
      const svg = container.querySelector('svg');

      // Empty string still sets aria-label, but keeps aria-hidden
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).toHaveAttribute('aria-label', '');
    });

    it('trims whitespace in className', () => {
      const { container } = render(
        <Spinner className="  extra-class  " size="small" color="text-red-500" delayMs={0} />,
      );
      const svg = container.querySelector('svg');

      // Classes should be trimmed
      expect(svg?.classList.toString()).not.toMatch(/^\s+|\s+$/);
    });
  });
});
