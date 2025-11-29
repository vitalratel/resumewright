/**
 * SuccessView Component Tests
 *
 * Tests for the presentational SuccessView component, including:
 * - Conditional success message based on download state
 * - Download button rendering based on API availability
 * - Copy filename functionality
 * - Countdown timer display
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SuccessView } from '../SuccessView';

describe('SuccessView', () => {
  const defaultProps = {
    displayFilename: 'john-doe-resume.pdf',
    fileSize: '324 KB',
    apiAvailable: true,
    isAvailable: true,
    countdown: undefined,
    isPaused: false,
    onPause: vi.fn(),
    onResume: vi.fn(),
    onOpenDownload: vi.fn(),
    onShowInFolder: vi.fn(),
    onExportAnother: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Conditional Success Message', () => {
    it('should show "Downloaded Successfully" when apiAvailable and isAvailable', () => {
      render(<SuccessView {...defaultProps} apiAvailable={true} isAvailable={true} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('PDF Downloaded Successfully');
    });

    it('should show "PDF Ready" when API not available', () => {
      render(<SuccessView {...defaultProps} apiAvailable={false} isAvailable={false} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('PDF Ready');
    });

    it('should show "PDF Ready" when API available but download not available', () => {
      render(<SuccessView {...defaultProps} apiAvailable={true} isAvailable={false} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('PDF Ready');
    });
  });

  describe('Download Button Rendering', () => {
    it('should show "Open Downloaded PDF" button when download available', () => {
      render(<SuccessView {...defaultProps} apiAvailable={true} isAvailable={true} />);

      const button = screen.getByRole('button', { name: /Open downloaded/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Open Downloaded');
    });

    it('should show success alert when download not available', () => {
      render(<SuccessView {...defaultProps} apiAvailable={false} isAvailable={false} />);

      expect(screen.getByText('Downloaded to your computer')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Open/i })).not.toBeInTheDocument();
    });

    it('should call onOpenDownload when button clicked', () => {
      const onOpenDownload = vi.fn();
      render(<SuccessView {...defaultProps} onOpenDownload={onOpenDownload} />);

      const button = screen.getByRole('button', { name: /Open downloaded/i });
      fireEvent.click(button);

      expect(onOpenDownload).toHaveBeenCalledTimes(1);
    });
  });

  describe('Filename Display', () => {
    it('should render the filename', () => {
      render(<SuccessView {...defaultProps} displayFilename="custom-resume.pdf" />);

      expect(screen.getByText('custom-resume.pdf')).toBeInTheDocument();
    });

    it('should have copy button with aria-label', () => {
      render(<SuccessView {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /Copy filename to clipboard/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('should handle clipboard copy errors gracefully', async () => {
      const user = userEvent.setup();
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard API not available'));
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        configurable: true,
      });

      render(<SuccessView {...defaultProps} displayFilename="test.pdf" />);

      const copyButton = screen.getByRole('button', { name: /Copy filename to clipboard/i });
      await user.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith('test.pdf');
    });

    it('should show copied feedback on successful clipboard copy', async () => {
      const user = userEvent.setup();
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        configurable: true,
      });

      render(<SuccessView {...defaultProps} displayFilename="test.pdf" />);

      const copyButton = screen.getByRole('button', { name: /Copy filename to clipboard/i });
      await user.click(copyButton);

      await waitFor(() => {
        const copiedButton = screen.getByRole('button', { name: /Filename copied/i });
        expect(copiedButton).toHaveAttribute('title', 'Copied!');
      });
    });
  });

  describe('File Size Display', () => {
    it('should render file size in details section', () => {
      render(<SuccessView {...defaultProps} fileSize="512 KB" />);

      expect(screen.getByText(/512 KB/)).toBeInTheDocument();
    });
  });

  describe('Countdown Timer', () => {
    it('should not render countdown when undefined', () => {
      render(<SuccessView {...defaultProps} countdown={undefined} />);

      expect(screen.queryByText(/Closing in/)).not.toBeInTheDocument();
    });

    it('should render countdown when provided', () => {
      render(<SuccessView {...defaultProps} countdown={15} />);

      expect(screen.getByText(/Closing in 15s/)).toBeInTheDocument();
    });

    it('should show (paused) when isPaused is true', () => {
      render(<SuccessView {...defaultProps} countdown={10} isPaused={true} />);

      expect(screen.getByText(/Closing in 10s \(paused\)/)).toBeInTheDocument();
    });

    it('should have pause button when countdown active and not paused', () => {
      render(<SuccessView {...defaultProps} countdown={10} isPaused={false} />);

      const pauseButton = screen.getByRole('button', { name: /Pause auto-close countdown/i });
      expect(pauseButton).toBeInTheDocument();
    });

    it('should have resume button when paused', () => {
      render(<SuccessView {...defaultProps} countdown={10} isPaused={true} />);

      const resumeButton = screen.getByRole('button', { name: /Resume auto-close countdown/i });
      expect(resumeButton).toBeInTheDocument();
    });

    it('should call onPause when pause button clicked', () => {
      const onPause = vi.fn();
      render(<SuccessView {...defaultProps} countdown={10} isPaused={false} onPause={onPause} />);

      const pauseButton = screen.getByRole('button', { name: /Pause auto-close countdown/i });
      fireEvent.click(pauseButton);

      expect(onPause).toHaveBeenCalledTimes(1);
    });

    it('should call onResume when resume button clicked', () => {
      const onResume = vi.fn();
      render(<SuccessView {...defaultProps} countdown={10} isPaused={true} onResume={onResume} />);

      const resumeButton = screen.getByRole('button', { name: /Resume auto-close countdown/i });
      fireEvent.click(resumeButton);

      expect(onResume).toHaveBeenCalledTimes(1);
    });
  });

  describe('Export Another Button', () => {
    it('should render export another button', () => {
      render(<SuccessView {...defaultProps} />);

      const button = screen.getByRole('button', { name: /Convert another/i });
      expect(button).toBeInTheDocument();
    });

    it('should call onExportAnother when clicked', () => {
      const onExportAnother = vi.fn();
      render(<SuccessView {...defaultProps} onExportAnother={onExportAnother} />);

      const button = screen.getByRole('button', { name: /Convert another/i });
      fireEvent.click(button);

      expect(onExportAnother).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<SuccessView {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible download button label', () => {
      render(<SuccessView {...defaultProps} displayFilename="test.pdf" />);

      const button = screen.getByRole('button', { name: /Open downloaded test\.pdf/i });
      expect(button).toBeInTheDocument();
    });

    it('should have aria-hidden on decorative icon', () => {
      const { container } = render(<SuccessView {...defaultProps} />);

      // Success icon should be decorative (aria-hidden)
      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
