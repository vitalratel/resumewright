/**
 * WelcomeScreen Component Tests
 * Onboarding screen test coverage
 *
 * Tests WelcomeScreen rendering, accessibility, and feature display.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect } from 'vitest';
import { WelcomeScreen } from '../WelcomeScreen';

describe('WelcomeScreen', () => {
  describe('Title and Description', () => {
    it('renders welcome title with correct ID for aria-labelledby', () => {
      render(<WelcomeScreen />);

      const title = screen.getByText('Welcome to ResumeWright!');
      expect(title).toBeInTheDocument();
      expect(title).toHaveAttribute('id', 'onboarding-title');
    });

    it('renders subtitle describing the tool', () => {
      render(<WelcomeScreen />);

      expect(
        screen.getByText('Turn Claude-generated CVs into professional PDFs instantly.'),
      ).toBeInTheDocument();
    });
  });

  describe('Icon', () => {
    it('renders sparkles icon with aria-hidden', () => {
      const { container } = render(<WelcomeScreen />);

      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('icon is in a colored circular container', () => {
      const { container } = render(<WelcomeScreen />);

      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Features', () => {
    it.each([
      { title: '100% Private', description: 'All processing happens in your browser' },
      { title: 'Lightning Fast', description: 'Convert your CV in seconds' },
      { title: '-Friendly', description: 'PDFs optimized for applicant tracking systems' }, // ATS component renders as text
    ])('displays $title feature', ({ title, description }) => {
      render(<WelcomeScreen />);

      expect(screen.getByText(title, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(description, { exact: false })).toBeInTheDocument();
    });

    it('displays all three features', () => {
      const { container } = render(<WelcomeScreen />);

      // Each feature has an icon in a colored circle
      const featureIcons = container.querySelectorAll('.rounded-full');
      // 1 main icon + 3 feature icons = 4 total
      expect(featureIcons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Accessibility', () => {
    it('has descriptive text for screen readers', () => {
      render(<WelcomeScreen />);

      // Title is available for aria-labelledby
      expect(screen.getByText('Welcome to ResumeWright!')).toHaveAttribute('id', 'onboarding-title');
    });

    it('decorative icon has aria-hidden', () => {
      const { container } = render(<WelcomeScreen />);

      const decorativeIcon = container.querySelector('svg[aria-hidden="true"]');
      expect(decorativeIcon).toBeInTheDocument();
    });
  });
});
