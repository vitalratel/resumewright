/**
 * HowToScreen Component Tests
 * Visual example of Claude.ai UI
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HowToScreen } from '../screens/HowToScreen';

describe('HowToScreen', () => {
  describe('Rendering', () => {
    it('should render title', () => {
      render(<HowToScreen />);

      expect(screen.getByText('How to Get Your CV Code')).toBeInTheDocument();
    });

    it('should render subtitle', () => {
      render(<HowToScreen />);

      expect(
        screen.getByText('Import your CV file from Claude.ai to convert it to PDF'),
      ).toBeInTheDocument();
    });

    it('should render document icon', () => {
      const { container } = render(<HowToScreen />);

      // Icon has aria-hidden="true"
      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon in colored circle', () => {
      const { container } = render(<HowToScreen />);

      const iconContainer = container.querySelector('.bg-green-50.rounded-full'); // Using tokens.colors.success.bg
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Step-by-Step Instructions', () => {
    it('should render "Step-by-step:" heading', () => {
      render(<HowToScreen />);

      expect(screen.getByText('Step-by-step:')).toBeInTheDocument();
    });

    it('should render step 1: Open Claude.ai', () => {
      render(<HowToScreen />);

      expect(screen.getByText(/Open/)).toBeInTheDocument();
      expect(screen.getByText(/and ask for a CV/)).toBeInTheDocument();
    });

    it('should render step 2: Download CV code file', () => {
      render(<HowToScreen />);

      expect(screen.getByText(/Download the CV code file/)).toBeInTheDocument();
    });

    it('should render step 3: Click extension icon', () => {
      render(<HowToScreen />);

      expect(screen.getByText(/Click the ResumeWright extension icon/)).toBeInTheDocument();
    });

    it('should render step 4: Import and export', () => {
      render(<HowToScreen />);

      expect(screen.getByText(/Import the.*file and export to PDF!/)).toBeInTheDocument();
    });

    it('should render as ordered list', () => {
      const { container } = render(<HowToScreen />);

      const orderedList = container.querySelector('ol');
      expect(orderedList).toBeInTheDocument();
    });

    it('should have 4 steps', () => {
      const { container } = render(<HowToScreen />);

      const steps = container.querySelectorAll('ol > li');
      expect(steps).toHaveLength(4);
    });
  });

  describe('Claude.ai Link', () => {
    it('should render link to Claude.ai', () => {
      render(<HowToScreen />);

      const link = screen.getByRole('link', { name: /Claude.ai/i });
      expect(link).toBeInTheDocument();
    });

    it('should link to Claude.ai website', () => {
      render(<HowToScreen />);

      const link = screen.getByRole('link', { name: /Claude.ai/i });
      expect(link).toHaveAttribute('href', 'https://claude.ai');
    });

    it('should open in new tab', () => {
      render(<HowToScreen />);

      const link = screen.getByRole('link', { name: /Claude.ai/i });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Styling', () => {
    it('should have blue background for instructions box', () => {
      const { container } = render(<HowToScreen />);

      const instructionsBox = container.querySelector('.bg-blue-50');
      expect(instructionsBox).toBeInTheDocument();
    });

    it('should have blue border for instructions box', () => {
      const { container } = render(<HowToScreen />);

      const instructionsBox = container.querySelector('.border-blue-200');
      expect(instructionsBox).toBeInTheDocument();
    });

    it('should center the title', () => {
      const { container } = render(<HowToScreen />);

      const textCenter = container.querySelector('.text-center');
      expect(textCenter).toBeInTheDocument();
    });

    it('should have proper spacing between steps', () => {
      const { container } = render(<HowToScreen />);

      const stepsList = container.querySelector('ol.gap-2'); // Using tokens.spacing.gapSmall
      expect(stepsList).toBeInTheDocument();
    });
  });

  describe('Content Stability', () => {
    // Replace brittle snapshot test with semantic assertions
    it('should render with expected structure and content', () => {
      const { container } = render(<HowToScreen />);

      // Verify main container exists
      expect(container.firstChild).toBeInTheDocument();

      // Verify key semantic elements are present
      expect(screen.getByText('How to Get Your CV Code')).toBeInTheDocument();
      expect(screen.getByText(/Open/)).toBeInTheDocument();
      expect(screen.getByText(/Download the CV code file/)).toBeInTheDocument();
      expect(screen.getByText(/Click the ResumeWright extension icon/)).toBeInTheDocument();
      expect(screen.getByText(/Import the.*file and export to PDF!/)).toBeInTheDocument();

      // Verify structural integrity (ordered list structure)
      const orderedList = container.querySelector('ol');
      expect(orderedList).toBeInTheDocument();
    });
  });
});
