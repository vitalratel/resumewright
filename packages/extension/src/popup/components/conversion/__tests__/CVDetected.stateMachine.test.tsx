/**
 * CVDetected - State Machine Integration Tests
 *
 * Tests the file_validated state rendering (legacy CVDetected component).
 * This component shows CV metadata and export functionality.
 *
 * Memory-efficient: Tests component in isolation (0.3MB per test vs 3MB for full App)
 */

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CVDetected } from '../CVDetected';

describe('CVDetected - State Machine Integration', () => {
  // Clean up timers from Button component to prevent test leaks
  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
  });
  describe('CV Metadata Display', () => {
    it('should show CV name and role', () => {
      const mockExport = vi.fn();

      render(
        <CVDetected
          cvName="Jane Smith"
          cvRole="Product Manager"
          onExport={mockExport}
        />,
      );

      expect(screen.getByText(/Jane Smith\s*-\s*Product Manager/i)).toBeInTheDocument();
    });

    it('should show default values when metadata not provided', () => {
      const mockExport = vi.fn();

      render(<CVDetected onExport={mockExport} />);

      expect(screen.getByText(/John Doe\s*-\s*Software Engineer/i)).toBeInTheDocument();
    });

    it('should display CV detected heading', () => {
      const mockExport = vi.fn();

      render(<CVDetected onExport={mockExport} />);

      expect(screen.getByRole('heading', { name: /CV Detected!/i })).toBeInTheDocument();
    });

    it('should show success checkmark icon', () => {
      const mockExport = vi.fn();

      render(<CVDetected onExport={mockExport} />);

      // Check for green checkmark (SVG icon from heroicons)
      const heading = screen.getByRole('heading', { name: /CV Detected!/i });
      const container = heading.parentElement;
      const svg = container?.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('text-green-600');
      expect(svg).toHaveClass('dark:text-green-400');
    });
  });

  describe('Export Button', () => {
    it('should show export button', () => {
      const mockExport = vi.fn();

      render(<CVDetected onExport={mockExport} />);

      const exportButton = screen.getByRole('button', { name: /Export CV to PDF/i });
      expect(exportButton).toBeInTheDocument();
    });

    it('should call onExport when button clicked', async () => {
      const mockExport = vi.fn();
      const user = userEvent.setup();

      render(<CVDetected onExport={mockExport} />);

      const exportButton = screen.getByRole('button', { name: /Export CV to PDF/i });
      await user.click(exportButton);

      expect(mockExport).toHaveBeenCalledOnce();
    });
  });

  describe('Settings Link', () => {
    it('should show customize settings link when onOpenSettings provided', () => {
      const mockExport = vi.fn();
      const mockSettings = vi.fn();

      render(
        <CVDetected
          onExport={mockExport}
          onOpenSettings={mockSettings}
        />,
      );

      const settingsLink = screen.getByRole('button', { name: /Customize settings/i });
      expect(settingsLink).toBeInTheDocument();
    });

    it('should call onOpenSettings when settings link clicked', async () => {
      const mockExport = vi.fn();
      const mockSettings = vi.fn();
      const user = userEvent.setup();

      render(
        <CVDetected
          onExport={mockExport}
          onOpenSettings={mockSettings}
        />,
      );

      const settingsLink = screen.getByRole('button', { name: /Customize settings/i });
      await user.click(settingsLink);

      expect(mockSettings).toHaveBeenCalledOnce();
    });

    it('should handle missing optional onOpenSettings gracefully', () => {
      const mockExport = vi.fn();

      // Should not throw even if onOpenSettings is undefined
      expect(() => {
        render(<CVDetected onExport={mockExport} />);
      }).not.toThrow();

      const settingsLink = screen.getByRole('button', { name: /Customize settings/i });
      expect(settingsLink).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible export button', () => {
      const mockExport = vi.fn();

      render(<CVDetected onExport={mockExport} />);

      const exportButton = screen.getByRole('button', { name: /Export CV to PDF/i });
      expect(exportButton).toHaveAccessibleName('Export CV to PDF');
    });

    it('should have accessible settings link', () => {
      const mockExport = vi.fn();
      const mockSettings = vi.fn();

      render(
        <CVDetected
          onExport={mockExport}
          onOpenSettings={mockSettings}
        />,
      );

      const settingsLink = screen.getByRole('button', { name: /Customize settings/i });
      expect(settingsLink).toHaveAccessibleName('Customize settings');
    });

    it('should have focus ring on settings link', () => {
      const mockExport = vi.fn();
      const mockSettings = vi.fn();

      render(
        <CVDetected
          onExport={mockExport}
          onOpenSettings={mockSettings}
        />,
      );

      const settingsLink = screen.getByRole('button', { name: /Customize settings/i });
      expect(settingsLink).toHaveClass('focus:ring-2');
      expect(settingsLink).toHaveClass('focus:ring-blue-500');
    });
  });
});
