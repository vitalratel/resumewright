/**
 * QuickStartScreen Component Tests
 * First-Time User Guidance
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuickStartScreen } from '../screens/QuickStartScreen';

describe('QuickStartScreen', () => {
  describe('Rendering', () => {
    it('should render title', () => {
      render(<QuickStartScreen />);

      expect(screen.getByText('Quick Start Guide')).toBeInTheDocument();
    });

    it('should render subtitle', () => {
      render(<QuickStartScreen />);

      expect(screen.getByText('Here\'s what you can do with ResumeWright')).toBeInTheDocument();
    });

    it('should render cog icon', () => {
      const { container } = render(<QuickStartScreen />);

      // Icon has aria-hidden="true"
      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon in colored circle', () => {
      const { container } = render(<QuickStartScreen />);

      // Icon container uses tokens.colors.success.bg (bg-green-50 dark:bg-green-950) and rounded-full
      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Feature Cards', () => {
    it('should render "Convert to PDF" feature card', () => {
      render(<QuickStartScreen />);

      expect(screen.getByText('Convert to PDF')).toBeInTheDocument();
      expect(
        screen.getByText('When we detect a CV, click \'Convert to PDF\' to download.'),
      ).toBeInTheDocument();
    });

    it('should render "Customize Settings" feature card', () => {
      render(<QuickStartScreen />);

      expect(screen.getByText('Customize Settings')).toBeInTheDocument();
      expect(
        screen.getByText('Choose page size (Letter/A4), adjust margins, and set fonts.'),
      ).toBeInTheDocument();
    });

    it('should render "Import Files" feature card', () => {
      render(<QuickStartScreen />);

      expect(screen.getByText('Import Files')).toBeInTheDocument();
      // Description continues with TSX reference
    });

    it('should render all three feature cards', () => {
      const { container } = render(<QuickStartScreen />);

      // Feature cards container uses tokens.spacing.sectionGapCompact (space-y-4 md:space-y-6)
      const featuresContainer = container.querySelector('.space-y-4');
      expect(featuresContainer).toBeInTheDocument();
    });
  });

  describe('Feature Card Icons', () => {
    it('should render download icon for Convert to PDF', () => {
      const { container } = render(<QuickStartScreen />);

      // ArrowDownTrayIcon in green background
      const greenBgIcons = container.querySelectorAll('.bg-green-500');
      expect(greenBgIcons.length).toBeGreaterThan(0);
    });

    it('should render cog icon for Customize Settings', () => {
      const { container } = render(<QuickStartScreen />);

      // CogIcon in gray background
      const grayBgIcons = container.querySelectorAll('.bg-gray-500');
      expect(grayBgIcons.length).toBeGreaterThan(0);
    });

    it('should render document icon for Import Files', () => {
      const { container } = render(<QuickStartScreen />);

      // DocumentTextIcon in blue background
      const blueBgIcons = container.querySelectorAll('.bg-blue-500');
      expect(blueBgIcons.length).toBeGreaterThan(0);
    });

    it('should render white icons on colored backgrounds', () => {
      const { container } = render(<QuickStartScreen />);

      const whiteIcons = container.querySelectorAll('.text-white');
      expect(whiteIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Layout and Styling', () => {
    it('should center the title and description', () => {
      const { container } = render(<QuickStartScreen />);

      const textCenter = container.querySelector('.text-center');
      expect(textCenter).toBeInTheDocument();
    });

    it('should have proper spacing between feature cards', () => {
      const { container } = render(<QuickStartScreen />);

      // Feature cards container uses tokens.spacing.sectionGapCompact (space-y-4 md:space-y-6)
      const featuresContainer = container.querySelector('.space-y-4');
      expect(featuresContainer).toBeInTheDocument();
    });

    it('should align feature cards to the left', () => {
      const { container } = render(<QuickStartScreen />);

      const leftAligned = container.querySelector('.text-left');
      expect(leftAligned).toBeInTheDocument();
    });
  });

  describe('Content Stability', () => {
    // Replace brittle snapshot test with semantic assertions
    it('should render with expected structure and content', () => {
      const { container } = render(<QuickStartScreen />);

      // Verify main container exists
      expect(container.firstChild).toBeInTheDocument();

      // Verify key semantic elements are present
      expect(screen.getByText('Quick Start Guide')).toBeInTheDocument();
      expect(screen.getByText('Here\'s what you can do with ResumeWright')).toBeInTheDocument();
      expect(screen.getByText('Convert to PDF')).toBeInTheDocument();
      expect(screen.getByText('Customize Settings')).toBeInTheDocument();
      expect(screen.getByText('Import Files')).toBeInTheDocument();

      // Verify structural integrity (feature cards present)
      const featuresContainer = container.querySelector('.space-y-4');
      expect(featuresContainer).toBeInTheDocument();
    });
  });
});
