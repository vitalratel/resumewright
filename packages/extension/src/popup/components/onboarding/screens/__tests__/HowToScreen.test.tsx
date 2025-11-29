/**
 * HowToScreen Component Tests
 * Onboarding screen test coverage
 *
 * Tests HowToScreen rendering, instructions, and accessibility.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect } from 'vitest';
import { HowToScreen } from '../HowToScreen';

describe('HowToScreen', () => {
  describe('Title and Description', () => {
    it('renders title', () => {
      render(<HowToScreen />);

      expect(screen.getByText('How to Get Your CV Code')).toBeInTheDocument();
    });

    it('renders subtitle', () => {
      render(<HowToScreen />);

      expect(
        screen.getByText('Import your CV file from Claude.ai to convert it to PDF'),
      ).toBeInTheDocument();
    });
  });

  describe('Icon', () => {
    it('renders document icon with aria-hidden', () => {
      const { container } = render(<HowToScreen />);

      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Instructions', () => {
    it.each([
      'Open',
      'and ask for a CV',
      'Download the CV code file',
      'Click the ResumeWright extension icon',
      'Import the',
      'file and export to PDF!',
    ])('displays instruction containing "%s"', (text) => {
      render(<HowToScreen />);

      expect(screen.getByText(text, { exact: false })).toBeInTheDocument();
    });

    it('displays step-by-step header', () => {
      render(<HowToScreen />);

      expect(screen.getByText('Step-by-step:')).toBeInTheDocument();
    });

    it('renders instructions in an ordered list', () => {
      const { container } = render(<HowToScreen />);

      const orderedList = container.querySelector('ol');
      expect(orderedList).toBeInTheDocument();
    });

    it('displays all four instruction steps', () => {
      const { container } = render(<HowToScreen />);

      const listItems = container.querySelectorAll('ol > *');
      expect(listItems.length).toBe(4);
    });
  });

  describe('Visual Design', () => {
    it('instructions are in an info-colored box', () => {
      const { container } = render(<HowToScreen />);

      // Info box has border and padding
      const infoBox = container.querySelector('.border');
      expect(infoBox).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('decorative icon has aria-hidden', () => {
      const { container } = render(<HowToScreen />);

      const decorativeIcon = container.querySelector('svg[aria-hidden="true"]');
      expect(decorativeIcon).toBeInTheDocument();
    });
  });
});
