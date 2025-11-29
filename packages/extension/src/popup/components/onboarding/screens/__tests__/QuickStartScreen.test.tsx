/**
 * QuickStartScreen Component Tests
 * Onboarding screen test coverage
 *
 * Tests QuickStartScreen rendering, feature cards, and accessibility.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect } from 'vitest';
import { QuickStartScreen } from '../QuickStartScreen';

describe('QuickStartScreen', () => {
  describe('Title and Description', () => {
    it('renders title', () => {
      render(<QuickStartScreen />);

      expect(screen.getByText('Quick Start Guide')).toBeInTheDocument();
    });

    it('renders subtitle', () => {
      render(<QuickStartScreen />);

      expect(
        screen.getByText('Here\'s what you can do with ResumeWright'),
      ).toBeInTheDocument();
    });
  });

  describe('Icon', () => {
    it('renders cog icon with aria-hidden', () => {
      const { container } = render(<QuickStartScreen />);

      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      // At least one icon (main) should be present
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Feature Cards', () => {
    it.each([
      { title: 'Convert to PDF', description: 'When we detect a CV' },
      { title: 'Customize Settings', description: 'Choose page size' },
      { title: 'Import Files', description: 'files downloaded from Claude' },
    ])('displays $title feature card', ({ title, description }) => {
      render(<QuickStartScreen />);

      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getByText(description, { exact: false })).toBeInTheDocument();
    });

    it('displays all three feature cards', () => {
      render(<QuickStartScreen />);

      expect(screen.getByText('Convert to PDF')).toBeInTheDocument();
      expect(screen.getByText('Customize Settings')).toBeInTheDocument();
      expect(screen.getByText('Import Files')).toBeInTheDocument();
    });

    it('feature cards have descriptive content', () => {
      render(<QuickStartScreen />);

      // Convert to PDF description
      expect(screen.getByText('click \'Convert to PDF\'', { exact: false })).toBeInTheDocument();

      // Customize Settings description mentions specific options
      expect(screen.getByText('page size', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('margins', { exact: false })).toBeInTheDocument();

      // Import Files mentions TSX files from Claude
      expect(screen.getByText('files downloaded from Claude', { exact: false })).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts Hint', () => {
    it('displays keyboard shortcut information', () => {
      const { container } = render(<QuickStartScreen />);

      // Keyboard hint is in an info-colored box
      const infoBoxes = container.querySelectorAll('.border');
      expect(infoBoxes.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('decorative icons have aria-hidden', () => {
      const { container } = render(<QuickStartScreen />);

      const decorativeIcons = container.querySelectorAll('svg[aria-hidden="true"]');
      // Main icon + feature card icons
      expect(decorativeIcons.length).toBeGreaterThanOrEqual(4);
    });

    it('uses semantic HTML structure', () => {
      render(<QuickStartScreen />);

      // Has heading element
      const heading = screen.getByText('Quick Start Guide');
      expect(heading.tagName).toBe('H2');
    });
  });
});
