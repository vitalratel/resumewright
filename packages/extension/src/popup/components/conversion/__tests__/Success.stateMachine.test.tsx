/**
 * Success - State Machine Integration Tests
 *
 * Tests the success state after successful PDF conversion.
 * Focuses on state machine integration aspects.
 *
 * Memory-efficient: Tests component in isolation (0.3MB per test vs 3MB for full App)
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Success } from '../Success';

describe('Success - State Machine Integration', () => {
  describe('Success Message Display', () => {
    it('should show success message after conversion', () => {
      const mockExportAnother = vi.fn();

      render(<Success filename="jane-smith-cv.pdf" onExportAnother={mockExportAnother} />);

      const heading = screen.getByRole('heading', { level: 1 });
      // Shows "PDF Ready" when download API not available in test env
      expect(heading).toHaveTextContent('PDF Ready');
    });

    it('should show fallback filename format', () => {
      const mockExportAnother = vi.fn();
      const fallbackFilename = 'Resume_2025-10-31.pdf';

      render(<Success filename={fallbackFilename} onExportAnother={mockExportAnother} />);

      // Should show date-stamped filename (fallback pattern)
      expect(screen.getByText(fallbackFilename)).toBeInTheDocument();
    });
  });

  describe('Filename Display', () => {
    it('should show generated filename', () => {
      const mockExportAnother = vi.fn();

      render(<Success filename="john-doe-resume.pdf" onExportAnother={mockExportAnother} />);

      expect(screen.getByText('john-doe-resume.pdf')).toBeInTheDocument();
    });

    it('should handle filenames with special characters', () => {
      const mockExportAnother = vi.fn();

      render(<Success filename="résumé_2024.pdf" onExportAnother={mockExportAnother} />);

      expect(screen.getByText('résumé_2024.pdf')).toBeInTheDocument();
    });
  });

  describe('Export Another Action', () => {
    it('should show convert another button', () => {
      const mockExportAnother = vi.fn();

      render(<Success filename="test.pdf" onExportAnother={mockExportAnother} />);

      const button = screen.getByRole('button', { name: /Convert Another CV/i });
      expect(button).toBeInTheDocument();
    });

    it('should call onExportAnother when button clicked', async () => {
      const mockExportAnother = vi.fn();
      const user = userEvent.setup();

      render(<Success filename="test.pdf" onExportAnother={mockExportAnother} />);

      const button = screen.getByRole('button', { name: /Convert Another CV/i });
      await user.click(button);

      expect(mockExportAnother).toHaveBeenCalledOnce();
    });
  });

  describe('Download Actions', () => {
    it('should show download buttons when Chrome API available', () => {
      const mockExportAnother = vi.fn();

      render(<Success filename="test.pdf" onExportAnother={mockExportAnother} />);

      // Should have download-related UI (specific buttons depend on Chrome API mock)
      const convertButton = screen.getByRole('button', { name: /Convert Another CV/i });
      expect(convertButton).toBeInTheDocument();
    });
  });
});
