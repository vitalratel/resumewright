/**
 * MarginPreview Component Tests
 * Test coverage for margin preview visualization and dark mode
 *
 * Tests for:
 * - Rendering with different page sizes (Letter, A4, Legal)
 * - Margin value calculations and display
 * - Dark mode styling (verification)
 * - Accessibility attributes
 * - Content area calculations
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarginPreview } from '../MarginPreview';

describe('MarginPreview', () => {
  const defaultMargins = {
    top: 1.0,
    right: 1.0,
    bottom: 1.0,
    left: 1.0,
  };

  describe('Rendering', () => {
    it('should render margin preview with title', () => {
      render(<MarginPreview pageSize="Letter" margins={defaultMargins} />);

      expect(screen.getByText('Margin Preview')).toBeInTheDocument();
    });

    it('should render all margin labels', () => {
      render(<MarginPreview pageSize="Letter" margins={defaultMargins} />);

      // Each margin value should appear exactly once in the preview
      const marginLabels = screen.getAllByText('1"');
      expect(marginLabels).toHaveLength(4); // top, right, bottom, left
    });

    it('should render legend with Top/Bottom and Left/Right labels', () => {
      render(<MarginPreview pageSize="Letter" margins={defaultMargins} />);

      expect(screen.getByText('Top/Bottom')).toBeInTheDocument();
      expect(screen.getByText('Left/Right')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <MarginPreview pageSize="Letter" margins={defaultMargins} className="custom-test-class" />,
      );

      const previewContainer = container.querySelector('.margin-preview');
      expect(previewContainer).toHaveClass('custom-test-class');
    });
  });

  describe('Page Size Support', () => {
    it.each([
      { pageSize: 'Letter' as const, width: 8.5, height: 11 },
      { pageSize: 'A4' as const, width: 8.27, height: 11.69 },
      { pageSize: 'Legal' as const, width: 8.5, height: 14 },
    ])('should render $pageSize page with correct aspect ratio', ({ pageSize, width, height }) => {
      render(<MarginPreview pageSize={pageSize} margins={defaultMargins} />);

      // Verify page size is mentioned in ARIA label
      const previewImage = screen.getByRole('img');
      expect(previewImage).toHaveAttribute('aria-label', expect.stringContaining(pageSize));

      // Calculate expected content area dimensions
      const contentWidth = (width - defaultMargins.left - defaultMargins.right).toFixed(2);
      const contentHeight = (height - defaultMargins.top - defaultMargins.bottom).toFixed(2);

      // Verify content area dimensions label is present
      const dimensionLabel = screen.getByTestId('dimension-label');
      expect(dimensionLabel).toHaveTextContent(`${contentWidth}" × ${contentHeight}"`);
    });
  });

  describe('Margin Value Display', () => {
    it('should display different margin values correctly', () => {
      const customMargins = {
        top: 0.5,
        right: 0.75,
        bottom: 1.25,
        left: 1.5,
      };

      render(<MarginPreview pageSize="Letter" margins={customMargins} />);

      expect(screen.getByText('0.5"')).toBeInTheDocument();
      expect(screen.getByText('0.75"')).toBeInTheDocument();
      expect(screen.getByText('1.25"')).toBeInTheDocument();
      expect(screen.getByText('1.5"')).toBeInTheDocument();
    });

    it('should display asymmetric margins', () => {
      const asymmetricMargins = {
        top: 2.0,
        right: 0.5,
        bottom: 1.0,
        left: 1.5,
      };

      render(<MarginPreview pageSize="A4" margins={asymmetricMargins} />);

      expect(screen.getByText('2"')).toBeInTheDocument();
      expect(screen.getByText('0.5"')).toBeInTheDocument();
      expect(screen.getByText('1"')).toBeInTheDocument();
      expect(screen.getByText('1.5"')).toBeInTheDocument();
    });

    it('should handle minimum margins (0.25")', () => {
      const minMargins = {
        top: 0.25,
        right: 0.25,
        bottom: 0.25,
        left: 0.25,
      };

      render(<MarginPreview pageSize="Letter" margins={minMargins} />);

      const marginLabels = screen.getAllByText('0.25"');
      expect(marginLabels).toHaveLength(4);
    });

    it('should handle maximum margins (2.0")', () => {
      const maxMargins = {
        top: 2.0,
        right: 2.0,
        bottom: 2.0,
        left: 2.0,
      };

      render(<MarginPreview pageSize="Letter" margins={maxMargins} />);

      const marginLabels = screen.getAllByText('2"');
      expect(marginLabels).toHaveLength(4);
    });
  });

  describe('Content Area Calculations', () => {
    it('should calculate content area for Letter page with 1" margins', () => {
      render(<MarginPreview pageSize="Letter" margins={defaultMargins} />);

      // Letter: 8.5" × 11" - 1" margins all around = 6.5" × 9.0"
      expect(screen.getByTestId('dimension-label')).toHaveTextContent('6.50" × 9.00"');
    });

    it('should calculate content area for A4 page with 1" margins', () => {
      render(<MarginPreview pageSize="A4" margins={defaultMargins} />);

      // A4: 8.27" × 11.69" - 1" margins all around = 6.27" × 9.69"
      expect(screen.getByTestId('dimension-label')).toHaveTextContent('6.27" × 9.69"');
    });

    it('should calculate content area for Legal page with 1" margins', () => {
      render(<MarginPreview pageSize="Legal" margins={defaultMargins} />);

      // Legal: 8.5" × 14" - 1" margins all around = 6.5" × 12.0"
      expect(screen.getByTestId('dimension-label')).toHaveTextContent('6.50" × 12.00"');
    });

    it('should calculate content area with asymmetric margins', () => {
      const customMargins = {
        top: 0.5,
        right: 1.0,
        bottom: 0.75,
        left: 1.5,
      };

      render(<MarginPreview pageSize="Letter" margins={customMargins} />);

      // Letter: 8.5" × 11"
      // Width: 8.5 - 1.0 - 1.5 = 6.0"
      // Height: 11 - 0.5 - 0.75 = 9.75"
      expect(screen.getByTestId('dimension-label')).toHaveTextContent('6.00" × 9.75"');
    });
  });

  describe('Dark Mode Styling', () => {
    it('should use semantic classes on page container', () => {
      const { container } = render(<MarginPreview pageSize="Letter" margins={defaultMargins} />);

      // Find the page container (has border-2 class)
      const pageContainer = container.querySelector('.border-2');
      expect(pageContainer).toBeInTheDocument();

      // Verify semantic classes are present (CSS variables handle dark mode)
      expect(pageContainer?.className).toContain('bg-card');
      expect(pageContainer?.className).toContain('border-border');
    });

    it('should use semantic classes on content area', () => {
      const { container } = render(<MarginPreview pageSize="Letter" margins={defaultMargins} />);

      // Content area should use semantic background class
      const contentArea = container.querySelector('.p-1.overflow-hidden');
      expect(contentArea?.className).toContain('bg-card');
    });

    it('should use semantic classes on dimension label', () => {
      const { container } = render(<MarginPreview pageSize="Letter" margins={defaultMargins} />);

      // Dimension label should use semantic background class
      const dimensionLabel = container.querySelector('[data-testid="dimension-label"]');
      expect(dimensionLabel?.className).toContain('bg-card');
    });

    it('should use semantic color tokens for margin colors', () => {
      const { container } = render(<MarginPreview pageSize="Letter" margins={defaultMargins} />);

      // Top/Bottom margins should have info colors
      const topMargin = container.querySelector('.bg-info\\/30');
      expect(topMargin).toBeInTheDocument();
      expect(topMargin?.className).toContain('border-info/50');

      // Left/Right margins should have success colors
      const leftMargin = container.querySelector('.bg-success\\/30');
      expect(leftMargin).toBeInTheDocument();
      expect(leftMargin?.className).toContain('border-success/50');
    });
  });

  describe('Accessibility', () => {
    it('should have role="img" for screen readers', () => {
      render(<MarginPreview pageSize="Letter" margins={defaultMargins} />);

      const previewImage = screen.getByRole('img');
      expect(previewImage).toBeInTheDocument();
    });

    it('should have descriptive aria-label with all margin values', () => {
      const customMargins = {
        top: 0.5,
        right: 1.0,
        bottom: 1.5,
        left: 0.75,
      };

      render(<MarginPreview pageSize="A4" margins={customMargins} />);

      const previewImage = screen.getByRole('img');
      const ariaLabel = previewImage.getAttribute('aria-label');

      expect(ariaLabel).toContain('0.5" top');
      expect(ariaLabel).toContain('1" right');
      expect(ariaLabel).toContain('1.5" bottom');
      expect(ariaLabel).toContain('0.75" left');
      expect(ariaLabel).toContain('A4 page');
    });

    it('should mark decorative elements with aria-hidden', () => {
      const { container } = render(<MarginPreview pageSize="Letter" margins={defaultMargins} />);

      // Margin overlays should be aria-hidden
      const marginOverlays = container.querySelectorAll('[aria-hidden="true"]');

      // Should have: 4 margin divs + 2 legend color boxes + 1 content area = 7 total
      expect(marginOverlays.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Layout and Styling', () => {
    it('should have fixed preview dimensions', () => {
      const { container } = render(<MarginPreview pageSize="Letter" margins={defaultMargins} />);

      const pageContainer = container.querySelector('.relative.border-2') as HTMLElement;
      expect(pageContainer).toBeInTheDocument();

      // Letter page should be 200px wide
      expect(pageContainer?.style.width).toBe('200px');

      // Height should be calculated based on aspect ratio (11/8.5 * 200)
      // Use approximate match to handle floating point precision differences
      const height = Number.parseFloat(pageContainer?.style.height ?? '0');
      const expectedHeight = (11 / 8.5) * 200;
      expect(height).toBeCloseTo(expectedHeight, 4);
    });

    it('should render simulated text lines in content area', () => {
      const { container } = render(<MarginPreview pageSize="Letter" margins={defaultMargins} />);

      // Content lines should have h-1 class (height)
      const contentLines = container.querySelectorAll('.h-1.rounded');

      // Should have 7 text lines (as per component implementation)
      expect(contentLines.length).toBe(7);
    });

    it('should show shadow on page preview', () => {
      const { container } = render(<MarginPreview pageSize="Letter" margins={defaultMargins} />);

      const pageContainer = container.querySelector('.shadow-md');
      expect(pageContainer).toBeInTheDocument();
    });
  });

  describe('Re-render Behavior', () => {
    it('should render without errors when props change', () => {
      const { rerender } = render(<MarginPreview pageSize="Letter" margins={defaultMargins} />);

      expect(screen.getByText('Margin Preview')).toBeInTheDocument();

      // Change all props to verify memo doesn't break re-renders
      rerender(
        <MarginPreview
          pageSize="A4"
          margins={{ top: 0.5, right: 0.75, bottom: 1.0, left: 1.25 }}
        />,
      );

      expect(screen.getByText('Margin Preview')).toBeInTheDocument();
      expect(screen.getByText('0.5"')).toBeInTheDocument();
      expect(screen.getByText('0.75"')).toBeInTheDocument();
      expect(screen.getByText('1"')).toBeInTheDocument();
      expect(screen.getByText('1.25"')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small margins', () => {
      const tinyMargins = {
        top: 0.25,
        right: 0.25,
        bottom: 0.25,
        left: 0.25,
      };

      render(<MarginPreview pageSize="Letter" margins={tinyMargins} />);

      // Should still render content area dimensions
      // Letter: 8.5 - 0.5 = 8.0" wide, 11 - 0.5 = 10.5" tall
      expect(screen.getByTestId('dimension-label')).toHaveTextContent('8.00" × 10.50"');
    });

    it('should handle large margins', () => {
      const largeMargins = {
        top: 2.0,
        right: 2.0,
        bottom: 2.0,
        left: 2.0,
      };

      render(<MarginPreview pageSize="Letter" margins={largeMargins} />);

      // Letter: 8.5 - 4.0 = 4.5" wide, 11 - 4.0 = 7.0" tall
      expect(screen.getByTestId('dimension-label')).toHaveTextContent('4.50" × 7.00"');
    });

    it('should handle different page sizes with same margins', () => {
      const margins = {
        top: 1.0,
        right: 1.0,
        bottom: 1.0,
        left: 1.0,
      };

      const { rerender } = render(<MarginPreview pageSize="Letter" margins={margins} />);

      expect(screen.getByTestId('dimension-label')).toHaveTextContent('6.50" × 9.00"');

      rerender(<MarginPreview pageSize="A4" margins={margins} />);

      expect(screen.getByTestId('dimension-label')).toHaveTextContent('6.27" × 9.69"');

      rerender(<MarginPreview pageSize="Legal" margins={margins} />);

      expect(screen.getByTestId('dimension-label')).toHaveTextContent('6.50" × 12.00"');
    });
  });
});
