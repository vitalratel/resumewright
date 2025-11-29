/**
 * WelcomeScreen Component Tests
 * First-Time User Guidance
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WelcomeScreen } from '../screens/WelcomeScreen';

describe('WelcomeScreen', () => {
  describe('Rendering', () => {
    it('should render welcome title', () => {
      render(<WelcomeScreen />);

      expect(screen.getByText('Welcome to ResumeWright!')).toBeInTheDocument();
    });

    it('should render subtitle describing the tool', () => {
      render(<WelcomeScreen />);

      expect(
        screen.getByText('Turn Claude-generated CVs into professional PDFs instantly.'),
      ).toBeInTheDocument();
    });

    it('should have onboarding-title id for accessibility', () => {
      render(<WelcomeScreen />);

      const title = screen.getByText('Welcome to ResumeWright!');
      expect(title).toHaveAttribute('id', 'onboarding-title');
    });

    it('should render sparkles icon', () => {
      const { container } = render(<WelcomeScreen />);

      // Icon has aria-hidden="true"
      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon in colored circle', () => {
      const { container } = render(<WelcomeScreen />);

      // Icon container uses tokens.colors.success.bg (bg-green-50 dark:bg-green-950) and rounded-full
      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Feature Items', () => {
    it('should display "100% Private" feature', () => {
      render(<WelcomeScreen />);

      expect(screen.getByText('100% Private')).toBeInTheDocument();
      expect(
        screen.getByText('All processing happens in your browser. No data leaves your computer.'),
      ).toBeInTheDocument();
    });

    it('should display "Lightning Fast" feature', () => {
      render(<WelcomeScreen />);

      expect(screen.getByText('Lightning Fast')).toBeInTheDocument();
      expect(
        screen.getByText('Convert your CV in seconds, not minutes.'),
      ).toBeInTheDocument();
    });

    it('should display "ATS-Friendly" feature', () => {
      render(<WelcomeScreen />);

      // Text is split across <abbr>ATS</abbr>-Friendly, so we need a custom matcher
      expect(
        screen.getByText((_content, element) => {
          return element?.textContent === 'ATS-Friendly';
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('PDFs optimized for applicant tracking systems.'),
      ).toBeInTheDocument();
    });

    it('should render feature icons', () => {
      render(<WelcomeScreen />);

      // Check for checkmark, lightning bolt, and document icons (as text content)
      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByText('⚡')).toBeInTheDocument();
      expect(screen.getByText('📄')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should center the icon', () => {
      const { container } = render(<WelcomeScreen />);

      const iconWrapper = container.querySelector('.flex.justify-center');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('should center the title and description', () => {
      const { container } = render(<WelcomeScreen />);

      const textCenter = container.querySelector('.text-center');
      expect(textCenter).toBeInTheDocument();
    });

    it('should have proper spacing between features', () => {
      const { container } = render(<WelcomeScreen />);

      // Features container uses tokens.spacing.sectionGap (space-y-6 md:space-y-8)
      const featuresContainer = container.querySelector('.space-y-6');
      expect(featuresContainer).toBeInTheDocument();
    });
  });

  describe('Content Stability', () => {
    // Replace brittle snapshot test with semantic assertions
    it('should render with expected structure and content', () => {
      const { container } = render(<WelcomeScreen />);

      // Verify main container exists
      expect(container.firstChild).toBeInTheDocument();

      // Verify key semantic elements are present
      expect(screen.getByText('Welcome to ResumeWright!')).toBeInTheDocument();
      expect(screen.getByText('100% Private')).toBeInTheDocument();
      expect(screen.getByText('Lightning Fast')).toBeInTheDocument();
      expect(screen.getByText(/-Friendly/)).toBeInTheDocument(); // ATS is in <abbr> tag

      // Verify structural integrity (icon, title, features)
      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();

      const title = screen.getByText('Welcome to ResumeWright!');
      expect(title).toHaveAttribute('id', 'onboarding-title');
    });
  });
});
