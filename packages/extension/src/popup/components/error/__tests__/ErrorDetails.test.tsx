/**
 * ErrorDetails Component Tests
 *
 * Tests ErrorDetails component for proper rendering, copy-to-clipboard functionality,
 * timestamp formatting, error ID display, and accessibility.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { ErrorCategory, ErrorCode } from '@/shared/errors/codes';
// Import mocked functions for assertions
import {
  copyToClipboard,
  formatErrorDetailsForClipboard,
  formatErrorTimestamp,
} from '@/shared/errors/tracking/telemetry';

import { ErrorDetails } from '../ErrorDetails';
import { createError } from './testHelpers';

// Mock the errorTracking utilities
vi.mock('@/shared/errors/tracking/telemetry', () => ({
  formatErrorTimestamp: vi.fn((date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  }),
  formatErrorDetailsForClipboard: vi.fn((details) => {
    return `Error Code: ${details.code}\nTime: ${details.timestamp}\nMessage: ${details.message}`;
  }),
  copyToClipboard: vi.fn(),
}));

describe('ErrorDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders error code', () => {
      const error = createError({ code: ErrorCode.TSX_PARSE_ERROR });
      render(<ErrorDetails error={error} />);

      expect(screen.getByText('Error Code:')).toBeInTheDocument();
      expect(screen.getByText(ErrorCode.TSX_PARSE_ERROR)).toBeInTheDocument();
    });

    it('renders formatted timestamp', () => {
      const testDate = new Date('2024-01-15T14:30:00');
      const error = createError({ timestamp: testDate.getTime() });

      render(<ErrorDetails error={error} />);

      expect(screen.getByText('Time:')).toBeInTheDocument();
      expect(formatErrorTimestamp).toHaveBeenCalledWith(testDate);
      // The mock returns a formatted string
      expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
    });

    it('renders copy button with clipboard icon', () => {
      const error = createError();
      render(<ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).toHaveTextContent('Copy Details');
    });

    it('renders usage suggestion text', () => {
      const error = createError();
      render(<ErrorDetails error={error} />);

      expect(screen.getByText(/Use the error code above when reporting/i)).toBeInTheDocument();
    });

    it('applies correct styling classes', () => {
      const error = createError();
      const { container } = render(<ErrorDetails error={error} />);

      // Check for container styling
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('w-full', 'max-w-md', 'shadow-sm');
    });
  });

  describe('Copy Functionality', () => {
    it('calls copyToClipboard with formatted error details when copy button clicked', async () => {
      const user = userEvent.setup();
      const error = createError({
        code: ErrorCode.WASM_EXECUTION_ERROR,
        message: 'Test error',
        technicalDetails: 'Details',
        metadata: { type: 'location', line: 10, column: 5 },
      });

      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(<ErrorDetails error={error} category={ErrorCategory.SYNTAX} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(formatErrorDetailsForClipboard).toHaveBeenCalledWith(
          expect.objectContaining({
            code: ErrorCode.WASM_EXECUTION_ERROR,
            message: 'Test error',
            category: ErrorCategory.SYNTAX,
            technicalDetails: 'Details',
            metadata: { type: 'location', line: 10, column: 5 },
          }),
        );
      });

      expect(copyToClipboard).toHaveBeenCalled();
    });

    it('shows success state when copy succeeds', async () => {
      const user = userEvent.setup();
      const error = createError();

      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(<ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('does not show success state when copy fails', async () => {
      const user = userEvent.setup();
      const error = createError();

      vi.mocked(copyToClipboard).mockResolvedValue(false);

      render(<ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      await user.click(copyButton);

      // Wait for async operations to complete
      await waitFor(() => {
        expect(copyToClipboard).toHaveBeenCalled();
      });

      // Should not show success state
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
      expect(screen.getByText('Copy Details')).toBeInTheDocument();
    });

    it('success state clears after 2 seconds', async () => {
      const user = userEvent.setup();
      const error = createError();

      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(<ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      await user.click(copyButton);

      // Should show success
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });

      // Wait for timeout to clear (2000ms + buffer) using waitFor for proper act wrapping
      await waitFor(
        () => {
          expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
          expect(screen.getByText('Copy Details')).toBeInTheDocument();
        },
        { timeout: 2500 },
      );
    });

    it('allows multiple copy operations', async () => {
      const user = userEvent.setup();
      const error = createError();

      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(<ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });

      // First copy
      await user.click(copyButton);
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });

      // Wait for state to clear using waitFor for proper act wrapping
      await waitFor(
        () => {
          expect(screen.getByText('Copy Details')).toBeInTheDocument();
        },
        { timeout: 2500 },
      );

      // Second copy
      await user.click(copyButton);
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });

      expect(copyToClipboard).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Category Handling', () => {
    it('includes category when provided', async () => {
      const user = userEvent.setup();
      const error = createError();

      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(<ErrorDetails error={error} category={ErrorCategory.SIZE} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(formatErrorDetailsForClipboard).toHaveBeenCalledWith(
          expect.objectContaining({
            category: ErrorCategory.SIZE,
          }),
        );
      });
    });

    it('handles missing category', async () => {
      const user = userEvent.setup();
      const error = createError();

      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(<ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(formatErrorDetailsForClipboard).toHaveBeenCalledWith(
          expect.objectContaining({
            category: undefined,
          }),
        );
      });
    });

    it.each([
      [ErrorCategory.SYNTAX],
      [ErrorCategory.SIZE],
      [ErrorCategory.SYSTEM],
      [ErrorCategory.NETWORK],
      [ErrorCategory.UNKNOWN],
    ])('handles category: %s', async (category) => {
      const user = userEvent.setup();
      const error = createError();

      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(<ErrorDetails error={error} category={category} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(formatErrorDetailsForClipboard).toHaveBeenCalledWith(
          expect.objectContaining({
            category,
          }),
        );
      });
    });
  });

  describe('Memoization', () => {
    it('memoizes formatted timestamp', () => {
      const testDate = new Date('2024-01-15T14:30:00');
      const error = createError({ timestamp: testDate.getTime() });

      const { rerender } = render(<ErrorDetails error={error} />);

      expect(formatErrorTimestamp).toHaveBeenCalledTimes(1);

      // Re-render with same timestamp
      rerender(<ErrorDetails error={error} />);

      // Should still only be called once due to memoization
      expect(formatErrorTimestamp).toHaveBeenCalledTimes(1);
    });

    it('recalculates timestamp when changed', () => {
      const testDate1 = new Date('2024-01-15T14:30:00');
      const testDate2 = new Date('2024-01-16T10:00:00');

      const error1 = createError({ timestamp: testDate1.getTime() });
      const error2 = createError({ timestamp: testDate2.getTime() });

      const { rerender } = render(<ErrorDetails error={error1} />);

      expect(formatErrorTimestamp).toHaveBeenCalledTimes(1);
      expect(formatErrorTimestamp).toHaveBeenCalledWith(testDate1);

      // Re-render with different timestamp
      rerender(<ErrorDetails error={error2} />);

      expect(formatErrorTimestamp).toHaveBeenCalledTimes(2);
      expect(formatErrorTimestamp).toHaveBeenCalledWith(testDate2);
    });
  });

  describe('Technical Details and Metadata', () => {
    it('includes technical details in copied content', async () => {
      const user = userEvent.setup();
      const error = createError({
        technicalDetails: 'Stack trace here',
      });

      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(<ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(formatErrorDetailsForClipboard).toHaveBeenCalledWith(
          expect.objectContaining({
            technicalDetails: 'Stack trace here',
          }),
        );
      });
    });

    it('includes metadata in copied content', async () => {
      const user = userEvent.setup();
      const error = createError({
        metadata: {
          type: 'wasm',
          browserInfo: { browser: 'Chrome', version: '120.0' },
          wasmInfo: { supported: true },
          memoryInfo: { platform: 'linux' },
        },
      });

      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(<ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(formatErrorDetailsForClipboard).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: {
              type: 'wasm',
              browserInfo: { browser: 'Chrome', version: '120.0' },
              wasmInfo: { supported: true },
              memoryInfo: { platform: 'linux' },
            },
          }),
        );
      });
    });

    it('handles missing technical details and metadata', async () => {
      const user = userEvent.setup();
      const error = createError({
        technicalDetails: undefined,
        metadata: undefined,
      });

      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(<ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(formatErrorDetailsForClipboard).toHaveBeenCalledWith(
          expect.objectContaining({
            technicalDetails: undefined,
            metadata: undefined,
          }),
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('copy button has accessible label', () => {
      const error = createError();
      render(<ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details to clipboard/i });
      expect(copyButton).toHaveAttribute('aria-label', 'Copy error details to clipboard');
    });

    it('error code is in code element for semantic markup', () => {
      const error = createError({ code: ErrorCode.TSX_PARSE_ERROR });
      const { container } = render(<ErrorDetails error={error} />);

      const codeElement = container.querySelector('code');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement).toHaveTextContent(ErrorCode.TSX_PARSE_ERROR);
      expect(codeElement).toHaveClass('font-mono');
    });

    it('button shows success state with proper icon', async () => {
      const user = userEvent.setup();
      const error = createError();

      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(<ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(copyButton).toHaveTextContent('Copied!');
      });
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      const error = createError();

      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(<ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      copyButton.focus();

      expect(copyButton).toHaveFocus();

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(copyToClipboard).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid multiple clicks gracefully', async () => {
      const user = userEvent.setup();
      const error = createError();

      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(<ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });

      // Click button rapidly
      await user.click(copyButton);
      await user.click(copyButton);

      // Should show success state
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });

      // copyToClipboard may be called once or twice depending on Button's pending state handling
      expect(copyToClipboard).toHaveBeenCalled();
    });

    it('handles timestamp at Unix epoch', () => {
      const error = createError({ timestamp: 0 });

      render(<ErrorDetails error={error} />);

      expect(formatErrorTimestamp).toHaveBeenCalledWith(new Date(0));
    });

    it('handles future timestamp', () => {
      const futureDate = new Date('2099-12-31T23:59:59');
      const error = createError({ timestamp: futureDate.getTime() });

      render(<ErrorDetails error={error} />);

      expect(formatErrorTimestamp).toHaveBeenCalledWith(futureDate);
    });
  });

  describe('Component Memo Behavior', () => {
    it('does not re-render when props are unchanged', () => {
      const error = createError();

      const { rerender } = render(<ErrorDetails error={error} />);

      const initialCallCount = vi.mocked(formatErrorTimestamp).mock.calls.length;

      // Re-render with same props
      rerender(<ErrorDetails error={error} />);

      // Should not call formatErrorTimestamp again (memoized)
      expect(vi.mocked(formatErrorTimestamp).mock.calls.length).toBe(initialCallCount);
    });

    it('re-renders when error prop changes', () => {
      const error1 = createError({ code: ErrorCode.WASM_EXECUTION_ERROR });
      const error2 = createError({ code: ErrorCode.TSX_PARSE_ERROR });

      const { rerender } = render(<ErrorDetails error={error1} />);

      expect(screen.getByText(ErrorCode.WASM_EXECUTION_ERROR)).toBeInTheDocument();

      rerender(<ErrorDetails error={error2} />);

      expect(screen.queryByText(ErrorCode.WASM_EXECUTION_ERROR)).not.toBeInTheDocument();
      expect(screen.getByText(ErrorCode.TSX_PARSE_ERROR)).toBeInTheDocument();
    });
  });
});
