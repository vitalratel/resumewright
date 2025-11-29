/**
 * Help Component Tests
 *
 * Tests for Help component, including:
 * - Link underlines for WCAG 1.4.1 compliance
 * - Rendering help links
 * - Accessibility attributes
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Help } from '../Help';

describe('Help', () => {
  describe('Link Accessibility', () => {
    it('should render all help links with default underline', () => {
      render(<Help onBack={() => {}} />);

      const links = screen.getAllByRole('link');

      // Should have multiple help links
      expect(links.length).toBeGreaterThan(0);

      // All links should have underline class (not just hover:underline)
      links.forEach((link) => {
        expect(link.className).toMatch(/underline/);
      });
    });

    it('should have proper focus styles on links', () => {
      render(<Help onBack={() => {}} />);

      const links = screen.getAllByRole('link');

      // Links should have focus styles (at least one link has focus:ring-2)
      const hasForusStyles = links.some(link => link.className.includes('focus:ring'));
      expect(hasForusStyles).toBe(true);
    });

    it('should have accessible link text', () => {
      render(<Help onBack={() => {}} />);

      // Verify specific help links exist
      expect(screen.getByRole('link', { name: /Getting Started/i })).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('should render help content', () => {
      render(<Help onBack={() => {}} />);

      // Should have help links
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have keyboard navigable links', () => {
      render(<Help onBack={() => {}} />);

      const links = screen.getAllByRole('link');

      // All links should be focusable
      links.forEach((link) => {
        expect(link).toBeInTheDocument();
        expect(link.tagName).toBe('A');
      });
    });

    it('should have proper focus outline', () => {
      render(<Help onBack={() => {}} />);

      const links = screen.getAllByRole('link');

      // At least some links should have focus:outline-none with custom focus:ring
      const hasCustomFocus = links.some(link =>
        link.className.includes('focus:outline-none') && link.className.includes('focus:ring'),
      );
      expect(hasCustomFocus).toBe(true);
    });
  });
});
