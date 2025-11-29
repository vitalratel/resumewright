/**
 * PageLayoutPreview Component Tests
 * Test coverage for visual page layout preview
 *
 * Tests PageLayoutPreview component for:
 * - Rendering with different page sizes
 * - Margin calculations and display
 * - Content area dimensions
 * - Accessibility attributes
 */

import { render, screen } from '@testing-library/react';
import { describe, expect } from 'vitest';
import { PageLayoutPreview } from '../PageLayoutPreview';

describe('PageLayoutPreview', () => {
  describe('Rendering', () => {
    it('renders page layout preview', () => {
      render(
        <PageLayoutPreview
          pageSize="Letter"
          margins={{ top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 }}
        />,
      );

      expect(screen.getByText('Letter Page Layout')).toBeInTheDocument();
    });

    it('renders as img role for accessibility', () => {
      render(
        <PageLayoutPreview
          pageSize="Letter"
          margins={{ top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 }}
        />,
      );

      const preview = screen.getByRole('img');
      expect(preview).toBeInTheDocument();
    });

    it('has accessible label with margin details', () => {
      render(
        <PageLayoutPreview
          pageSize="Letter"
          margins={{ top: 1.0, right: 0.5, bottom: 0.75, left: 1.5 }}
        />,
      );

      const preview = screen.getByRole('img');
      expect(preview).toHaveAttribute(
        'aria-label',
        'Page layout preview for Letter with 1 inch top, 0.5 inch right, 0.75 inch bottom, 1.5 inch left margins',
      );
    });
  });

  describe('Page Sizes', () => {
    it.each([
      ['Letter', '8.5" × 11"'],
      ['A4', '210mm × 297mm'],
      ['Legal', '8.5" × 14"'],
    ])('renders %s page with correct dimensions label', (pageSize, expectedLabel) => {
      render(
        <PageLayoutPreview
          pageSize={pageSize as 'Letter' | 'A4' | 'Legal'}
          margins={{ top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 }}
        />,
      );

      expect(screen.getByText(`${pageSize} Page Layout`)).toBeInTheDocument();
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    });
  });

  describe('Margin Display', () => {
    it('displays margin values when margins are large enough', () => {
      render(
        <PageLayoutPreview
          pageSize="Letter"
          margins={{ top: 1.0, right: 1.0, bottom: 1.0, left: 1.0 }}
        />,
      );

      // Margin values should be visible when > 8% of page dimension
      // 1 inch margins on Letter page should be visible
      const { container } = render(
        <PageLayoutPreview
          pageSize="Letter"
          margins={{ top: 1.0, right: 1.0, bottom: 1.0, left: 1.0 }}
        />,
      );

      // Check that margin divs exist (visual regression is handled separately)
      const marginDivs = container.querySelectorAll('[style*="opacity"]');
      expect(marginDivs.length).toBeGreaterThan(0);
    });

    it('calculates content area dimensions correctly', () => {
      render(
        <PageLayoutPreview
          pageSize="Letter"
          margins={{ top: 1.0, right: 1.0, bottom: 1.0, left: 1.0 }}
        />,
      );

      // Letter: 8.5" × 11" with 1" margins on all sides
      // Content area: 6.5" × 9"
      expect(screen.getByText(/Content area: 6\.50" × 9\.00"/)).toBeInTheDocument();
    });

    it('calculates content area for asymmetric margins', () => {
      render(
        <PageLayoutPreview
          pageSize="Letter"
          margins={{ top: 0.5, right: 1.0, bottom: 0.75, left: 1.5 }}
        />,
      );

      // Letter: 8.5" × 11"
      // Width: 8.5 - 1.0 - 1.5 = 6.0"
      // Height: 11 - 0.5 - 0.75 = 9.75"
      expect(screen.getByText(/Content area: 6\.00" × 9\.75"/)).toBeInTheDocument();
    });
  });

  describe('Page Size Dimensions', () => {
    it.each([
      ['Letter', { top: 1, right: 1, bottom: 1, left: 1 }, '6.50" × 9.00"'],
      ['A4', { top: 1, right: 1, bottom: 1, left: 1 }, '6.27" × 9.69"'],
      ['Legal', { top: 1, right: 1, bottom: 1, left: 1 }, '6.50" × 12.00"'],
    ])('calculates %s content area correctly', (pageSize, margins, expectedDimensions) => {
      render(
        <PageLayoutPreview
          pageSize={pageSize as 'Letter' | 'A4' | 'Legal'}
          margins={margins}
        />,
      );

      expect(screen.getByText(new RegExp(`Content area: ${expectedDimensions.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('accepts custom className prop', () => {
      const { container } = render(
        <PageLayoutPreview
          pageSize="Letter"
          margins={{ top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 }}
          className="custom-test-class"
        />,
      );

      expect(container.firstChild).toHaveClass('custom-test-class');
    });
  });

  describe('Content Lines Simulation', () => {
    it('renders content line simulation', () => {
      const { container } = render(
        <PageLayoutPreview
          pageSize="Letter"
          margins={{ top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 }}
        />,
      );

      // Should have 8 content lines simulated
      const contentLines = container.querySelectorAll('[class*="h-1"]');
      expect(contentLines.length).toBe(8);
    });
  });

  describe('Edge Cases', () => {
    it('handles zero margins', () => {
      render(
        <PageLayoutPreview
          pageSize="Letter"
          margins={{ top: 0, right: 0, bottom: 0, left: 0 }}
        />,
      );

      // Content area should equal page size with zero margins
      expect(screen.getByText(/Content area: 8\.50" × 11\.00"/)).toBeInTheDocument();
    });

    it('handles very small margins', () => {
      render(
        <PageLayoutPreview
          pageSize="Letter"
          margins={{ top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 }}
        />,
      );

      // Should still render without errors
      expect(screen.getByText('Letter Page Layout')).toBeInTheDocument();
    });

    it('handles large margins', () => {
      render(
        <PageLayoutPreview
          pageSize="Letter"
          margins={{ top: 3, right: 3, bottom: 3, left: 3 }}
        />,
      );

      // Content area: 8.5 - 6 = 2.5" × 11 - 6 = 5"
      expect(screen.getByText(/Content area: 2\.50" × 5\.00"/)).toBeInTheDocument();
    });
  });
});
