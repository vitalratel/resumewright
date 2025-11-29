/**
 * ErrorState Component Tests
 * Error Handling and User Guidance
 */

import type { ConversionError } from '@/shared/types/models';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as issueReporter from '@/shared/errors/presentation/formatting';
import { ErrorCategory, ErrorCode } from '@/shared/types/errors/codes';
import { ErrorState } from '../ErrorState';

// Mock browser API for issueReporter
vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      getManifest: () => ({ version: '1.0.0-test' }),
    },
  },
}));

describe('ErrorState', () => {
  const mockRetry = vi.fn();
  const mockDismiss = vi.fn();
  const mockReportIssue = vi.fn();

  const baseError: ConversionError = {
    stage: 'parsing',
    code: ErrorCode.TSX_PARSE_ERROR,
    message: 'Failed to parse CV code',
    recoverable: true,
    suggestions: ['Try regenerating the CV', 'Check for syntax errors'],
    category: ErrorCategory.SYNTAX,
    timestamp: Date.now(),
    errorId: 'test-error-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Display', () => {
    it('should render error title from ERROR_MESSAGES', () => {
      const { container } = render(<ErrorState error={baseError} />);
      // Check for heading element with the title
      const heading = container.querySelector('h1');
      // Updated to simplified error message
      expect(heading).toHaveTextContent('Invalid CV file format');
    });

    it('should render error message', () => {
      const { container } = render(<ErrorState error={baseError} />);
      // Check for message paragraph
      const message = container.querySelector('p.text-base');
      // Updated to simplified error message
      expect(message).toHaveTextContent(
        'This file has invalid CV code. Try regenerating it in Claude or importing a different file.'
      );
    });

    it('should render error suggestions', () => {
      render(<ErrorState error={baseError} />);
      expect(screen.getByText('Try regenerating the CV')).toBeInTheDocument();
      expect(screen.getByText('Check for syntax errors')).toBeInTheDocument();
    });

    it('should render category badge', () => {
      render(<ErrorState error={baseError} />);
      expect(screen.getByText('Syntax Error')).toBeInTheDocument();
    });
  });

  describe('Error Icons', () => {
    it('should show warning icon for SYNTAX category', () => {
      const syntaxError = { ...baseError, category: ErrorCategory.SYNTAX };
      const { container } = render(<ErrorState error={syntaxError} />);
      const icon = container.querySelector('[aria-label="Warning"]');
      expect(icon).toBeInTheDocument();
    });

    it('should show warning icon for SIZE category', () => {
      const sizeError = { ...baseError, category: ErrorCategory.SIZE };
      const { container } = render(<ErrorState error={sizeError} />);
      const icon = container.querySelector('[aria-label="Warning"]');
      expect(icon).toBeInTheDocument();
    });

    it('should show error icon for SYSTEM category', () => {
      const systemError = { ...baseError, category: ErrorCategory.SYSTEM };
      const { container } = render(<ErrorState error={systemError} />);
      const icon = container.querySelector('[aria-label="Error"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('should display line and column for parse errors (AC5)', () => {
      const parseError: ConversionError = {
        ...baseError,
        metadata: { type: 'location', line: 42, column: 15 },
      };
      render(<ErrorState error={parseError} />);
      expect(screen.getByText(/Line 42, Column 15/)).toBeInTheDocument();
    });

    it('should display file size information (AC6)', () => {
      const sizeError: ConversionError = {
        ...baseError,
        code: ErrorCode.MEMORY_LIMIT_EXCEEDED,
        category: ErrorCategory.SIZE,
        metadata: { type: 'location', fileSize: 5242880, maxSize: 4194304 }, // 5MB / 4MB
      };
      render(<ErrorState error={sizeError} />);
      expect(screen.getByText(/5\.0 MB/)).toBeInTheDocument();
      expect(screen.getByText(/4\.0 MB/)).toBeInTheDocument();
    });

    it('should not render metadata section when no metadata', () => {
      const { container } = render(<ErrorState error={baseError} />);
      // The component should not render metadata section when metadata is missing
      // Check that there's no line/column display
      expect(container.textContent).not.toContain('Line');
      expect(container.textContent).not.toContain('Column');
    });
  });

  describe('Action Buttons', () => {
    it('should render "Try Again" button for recoverable errors', () => {
      render(<ErrorState error={baseError} onRetry={mockRetry} />);
      expect(screen.getByText('Try Converting Again')).toBeInTheDocument();
    });

    it('should NOT render "Try Again" button for non-recoverable errors', () => {
      const nonRecoverableError = { ...baseError, recoverable: false };
      render(<ErrorState error={nonRecoverableError} onRetry={mockRetry} />);
      expect(screen.queryByText('Try Converting Again')).not.toBeInTheDocument();
    });

    it('should call onRetry when "Try Again" is clicked', async () => {
      const user = userEvent.setup();
      render(<ErrorState error={baseError} onRetry={mockRetry} />);

      const retryButton = screen.getByText('Try Converting Again');
      await user.click(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('should render "Dismiss" button when onDismiss provided', () => {
      render(<ErrorState error={baseError} onDismiss={mockDismiss} />);
      expect(screen.getByText('Return to Import')).toBeInTheDocument();
    });

    it('should call onDismiss when "Dismiss" is clicked', async () => {
      const user = userEvent.setup();
      render(<ErrorState error={baseError} onDismiss={mockDismiss} />);

      const dismissButton = screen.getByText('Return to Import');
      await user.click(dismissButton);

      expect(mockDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Issue Reporting (AC9)', () => {
    const originalEnv = import.meta.env.DEV;

    afterEach(() => {
      // Restore original env
      // Restore environment variable
      (import.meta.env as Record<string, unknown>).DEV = originalEnv;
    });

    it('should render "Copy Error Details" button in dev mode', () => {
      (import.meta.env as Record<string, unknown>).DEV = true;
      render(<ErrorState error={baseError} onReportIssue={mockReportIssue} />);
      expect(screen.getByText('Copy Error Details')).toBeInTheDocument();
    });

    it('should NOT render "Copy Error Details" button in production', () => {
      (import.meta.env as Record<string, unknown>).DEV = false;
      render(<ErrorState error={baseError} onReportIssue={mockReportIssue} />);
      expect(screen.queryByText('Copy Error Details')).not.toBeInTheDocument();
    });

    it('should call onReportIssue when button clicked', async () => {
      (import.meta.env as Record<string, unknown>).DEV = true;
      const user = userEvent.setup();
      render(<ErrorState error={baseError} onReportIssue={mockReportIssue} />);

      const reportButton = screen.getByText('Copy Error Details');
      await user.click(reportButton);

      expect(mockReportIssue).toHaveBeenCalledTimes(1);
    });

    it('should use default reportIssue handler when onReportIssue not provided', async () => {
      (import.meta.env as { DEV?: boolean }).DEV = true;
      const user = userEvent.setup();

      // Spy on the reportIssue function
      const reportIssueSpy = vi.spyOn(issueReporter, 'reportIssue');

      render(<ErrorState error={baseError} />);

      const reportButton = screen.getByText('Copy Error Details');
      await user.click(reportButton);

      // Should call reportIssue with the error
      expect(reportIssueSpy).toHaveBeenCalledWith(baseError);

      reportIssueSpy.mockRestore();
    });
  });

  describe('Accessibility (WCAG 2.1)', () => {
    it('should have role="alert"', () => {
      const { container } = render(<ErrorState error={baseError} />);
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });

    it('should have aria-live="assertive"', () => {
      const { container } = render(<ErrorState error={baseError} />);
      const alert = container.querySelector('[aria-live="assertive"]');
      expect(alert).toBeInTheDocument();
    });

    it('should have aria-atomic="true"', () => {
      const { container } = render(<ErrorState error={baseError} />);
      const alert = container.querySelector('[aria-atomic="true"]');
      expect(alert).toBeInTheDocument();
    });

    it('should have aria-label for "Try Again" button', () => {
      render(<ErrorState error={baseError} onRetry={mockRetry} />);
      const button = screen.getByLabelText('Try converting your CV again');
      expect(button).toBeInTheDocument();
    });

    it('should have aria-label for "Dismiss" button', () => {
      render(<ErrorState error={baseError} onDismiss={mockDismiss} />);
      const button = screen.getByLabelText('Dismiss error and return to file selection screen');
      expect(button).toBeInTheDocument();
    });

    it('should have aria-label for icon', () => {
      const { container } = render(<ErrorState error={baseError} />);
      const icon = container.querySelector('[aria-label]');
      expect(icon).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ErrorState error={baseError} onRetry={mockRetry} onDismiss={mockDismiss} />);

      // Verify all interactive elements are keyboard-accessible
      // P2: Help resource links were added, so we verify presence rather than exact tab order
      const copyButton = screen.getByLabelText('Copy error details to clipboard');
      const helpLink = screen.getByLabelText('Get help with this error on GitHub');
      const retryButton = screen.getByRole('button', { name: /try converting your cv again/i });
      const dismissButton = screen.getByRole('button', { name: /return to file selection/i });

      // Tab through elements and verify all are reachable
      await user.tab(); // First element gets focus
      const firstFocused = document.activeElement;
      // Verify first focused element is one of our interactive elements
      const allButtons = [copyButton, helpLink, retryButton, dismissButton];
      expect(allButtons.includes(firstFocused as HTMLElement)).toBe(true);

      // Continue tabbing to verify all elements are in tab order
      const focusedElements: Element[] = [firstFocused!];
      for (let i = 0; i < 10; i++) {
        // Tab enough times to reach all elements
        // eslint-disable-next-line no-await-in-loop -- Sequential tab navigation is required for testing keyboard accessibility
        await user.tab();
        const currentFocus = document.activeElement;
        if (currentFocus && !focusedElements.includes(currentFocus)) {
          focusedElements.push(currentFocus);
        }
      }

      // Verify all critical buttons are keyboard-accessible
      expect(focusedElements.includes(retryButton)).toBe(true);
      expect(focusedElements.includes(dismissButton)).toBe(true);
    });

    it('should activate buttons with Enter key', async () => {
      const user = userEvent.setup();
      render(<ErrorState error={baseError} onRetry={mockRetry} />);

      const retryButton = screen.getByRole('button', { name: /try converting your cv again/i });
      retryButton.focus();

      await user.keyboard('{Enter}');
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('should activate buttons with Space key', async () => {
      const user = userEvent.setup();
      render(<ErrorState error={baseError} onRetry={mockRetry} />);

      const retryButton = screen.getByRole('button', { name: /try converting your cv again/i });
      retryButton.focus();

      await user.keyboard(' ');
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Categories', () => {
    it('should handle SYNTAX category errors', () => {
      const syntaxError = { ...baseError, category: ErrorCategory.SYNTAX };
      render(<ErrorState error={syntaxError} />);
      expect(screen.getByText('Syntax Error')).toBeInTheDocument();
    });

    it('should handle SIZE category errors', () => {
      const sizeError = { ...baseError, category: ErrorCategory.SIZE };
      render(<ErrorState error={sizeError} />);
      expect(screen.getByText('File Size')).toBeInTheDocument();
    });

    it('should handle SYSTEM category errors', () => {
      const systemError = { ...baseError, category: ErrorCategory.SYSTEM };
      render(<ErrorState error={systemError} />);
      expect(screen.getByText('System Error')).toBeInTheDocument();
    });

    it('should handle NETWORK category errors', () => {
      const networkError = { ...baseError, category: ErrorCategory.NETWORK };
      render(<ErrorState error={networkError} />);
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });

    it('should handle UNKNOWN category errors', () => {
      const unknownError = { ...baseError, category: ErrorCategory.UNKNOWN };
      render(<ErrorState error={unknownError} />);
      // Badge now uses title case, no uppercase/tracking-wide classes
      expect(screen.getByText('Unknown Error')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty suggestions array', () => {
      const errorWithNoSuggestions = { ...baseError, suggestions: [] };
      const { container } = render(<ErrorState error={errorWithNoSuggestions} />);
      expect(container.textContent).not.toContain('What you can try:');
    });

    it('should handle missing category', () => {
      const errorWithoutCategory = { ...baseError, category: undefined };
      const { container } = render(<ErrorState error={errorWithoutCategory} />);
      // Should still render without crashing
      expect(container).toBeInTheDocument();
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(500);
      const errorWithLongMessage = { ...baseError, message: longMessage };
      const { container } = render(<ErrorState error={errorWithLongMessage} />);
      // Component shows ERROR_MESSAGES description, not raw message
      // Just verify it renders without crashing
      expect(container.querySelector('h1')).toBeInTheDocument();
    });

    it('should handle multiple metadata fields', () => {
      const complexError: ConversionError = {
        ...baseError,
        metadata: {
          type: 'location',
          line: 10,
          column: 5,
          fileSize: 1000000,
          maxSize: 2000000,
        },
      };
      render(<ErrorState error={complexError} />);
      expect(screen.getByText(/Line 10, Column 5/)).toBeInTheDocument();
    });
  });

  describe('Formatting Helpers', () => {
    it('should format bytes correctly', () => {
      const sizeError: ConversionError = {
        ...baseError,
        metadata: {
          type: 'location',
          fileSize: 1024,
          maxSize: 2048,
        },
      };
      render(<ErrorState error={sizeError} />);
      expect(screen.getByText(/1\.0 KB/)).toBeInTheDocument();
      expect(screen.getByText(/2\.0 KB/)).toBeInTheDocument();
    });

    it('should format megabytes correctly', () => {
      const sizeError: ConversionError = {
        ...baseError,
        metadata: {
          type: 'location',
          fileSize: 5242880, // 5 MB
          maxSize: 10485760, // 10 MB
        },
      };
      render(<ErrorState error={sizeError} />);
      expect(screen.getByText(/5\.0 MB/)).toBeInTheDocument();
      expect(screen.getByText(/10\.0 MB/)).toBeInTheDocument();
    });
  });
});
