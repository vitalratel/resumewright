/**
 * ABOUTME: Tests for ErrorDetails component rendering, copy functionality, and accessibility.
 * ABOUTME: Validates error code display, timestamp formatting, and clipboard integration.
 */

import { fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCategory, ErrorCode } from '@/shared/errors/codes';
import {
  copyToClipboard,
  formatErrorDetailsForClipboard,
  formatErrorTimestamp,
} from '@/shared/errors/tracking/telemetry';
import { ErrorDetails } from '../ErrorDetails';
import { createError } from './testHelpers';

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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders error code', () => {
      const error = createError({ code: ErrorCode.TSX_PARSE_ERROR });
      render(() => <ErrorDetails error={error} />);

      expect(screen.getByText('Error Code:')).toBeInTheDocument();
      expect(screen.getByText(ErrorCode.TSX_PARSE_ERROR)).toBeInTheDocument();
    });

    it('renders formatted timestamp', () => {
      const testDate = new Date('2024-01-15T14:30:00');
      const error = createError({ timestamp: testDate.getTime() });

      render(() => <ErrorDetails error={error} />);

      expect(screen.getByText('Time:')).toBeInTheDocument();
      expect(formatErrorTimestamp).toHaveBeenCalledWith(testDate);
      expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
    });

    it('renders copy button with clipboard icon', () => {
      const error = createError();
      render(() => <ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).toHaveTextContent('Copy Details');
    });

    it('renders usage suggestion text', () => {
      const error = createError();
      render(() => <ErrorDetails error={error} />);

      expect(screen.getByText(/Use the error code above when reporting/i)).toBeInTheDocument();
    });

    it('applies correct styling classes', () => {
      const error = createError();
      const { container } = render(() => <ErrorDetails error={error} />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('w-full', 'max-w-md', 'shadow-sm');
    });
  });

  describe('Copy Functionality', () => {
    it('calls copyToClipboard with formatted error details when copy button clicked', async () => {
      const error = createError({
        code: ErrorCode.WASM_EXECUTION_ERROR,
        message: 'Test error',
        technicalDetails: 'Details',
        metadata: { type: 'location', line: 10, column: 5 },
      });

      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(() => <ErrorDetails error={error} category={ErrorCategory.SYNTAX} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      fireEvent.click(copyButton);
      await vi.advanceTimersByTimeAsync(0);

      expect(formatErrorDetailsForClipboard).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.WASM_EXECUTION_ERROR,
          message: 'Test error',
          category: ErrorCategory.SYNTAX,
          technicalDetails: 'Details',
          metadata: { type: 'location', line: 10, column: 5 },
        }),
      );
      expect(copyToClipboard).toHaveBeenCalled();
    });

    it('shows success state when copy succeeds', async () => {
      const error = createError();
      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(() => <ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      fireEvent.click(copyButton);
      await vi.advanceTimersByTimeAsync(0);

      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });

    it('does not show success state when copy fails', async () => {
      const error = createError();
      vi.mocked(copyToClipboard).mockResolvedValue(false);

      render(() => <ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      fireEvent.click(copyButton);
      await vi.advanceTimersByTimeAsync(0);

      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
      expect(screen.getByText('Copy Details')).toBeInTheDocument();
    });

    it('success state clears after 2 seconds', async () => {
      const error = createError();
      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(() => <ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      fireEvent.click(copyButton);
      await vi.advanceTimersByTimeAsync(0);

      expect(screen.getByText('Copied!')).toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(2100);

      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
      expect(screen.getByText('Copy Details')).toBeInTheDocument();
    });

    it('allows multiple copy operations', async () => {
      const error = createError();
      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(() => <ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });

      // First copy
      fireEvent.click(copyButton);
      await vi.advanceTimersByTimeAsync(0);
      expect(screen.getByText('Copied!')).toBeInTheDocument();

      // Wait for success state to clear + Button pending timeout
      await vi.advanceTimersByTimeAsync(2200);
      expect(screen.getByText('Copy Details')).toBeInTheDocument();

      // Second copy
      fireEvent.click(copyButton);
      await vi.advanceTimersByTimeAsync(0);
      expect(screen.getByText('Copied!')).toBeInTheDocument();

      expect(copyToClipboard).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Category Handling', () => {
    it('includes category when provided', async () => {
      const error = createError();
      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(() => <ErrorDetails error={error} category={ErrorCategory.SIZE} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      fireEvent.click(copyButton);
      await vi.advanceTimersByTimeAsync(0);

      expect(formatErrorDetailsForClipboard).toHaveBeenCalledWith(
        expect.objectContaining({
          category: ErrorCategory.SIZE,
        }),
      );
    });

    it('handles missing category', async () => {
      const error = createError();
      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(() => <ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      fireEvent.click(copyButton);
      await vi.advanceTimersByTimeAsync(0);

      expect(formatErrorDetailsForClipboard).toHaveBeenCalledWith(
        expect.objectContaining({
          category: undefined,
        }),
      );
    });

    it.each([
      [ErrorCategory.SYNTAX],
      [ErrorCategory.SIZE],
      [ErrorCategory.SYSTEM],
      [ErrorCategory.NETWORK],
      [ErrorCategory.UNKNOWN],
    ])('handles category: %s', async (category) => {
      const error = createError();
      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(() => <ErrorDetails error={error} category={category} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      fireEvent.click(copyButton);
      await vi.advanceTimersByTimeAsync(0);

      expect(formatErrorDetailsForClipboard).toHaveBeenCalledWith(
        expect.objectContaining({ category }),
      );
    });
  });

  describe('Memoization', () => {
    it('recalculates timestamp when it changes', () => {
      const testDate1 = new Date('2024-01-15T14:30:00');
      const testDate2 = new Date('2024-01-16T10:00:00');
      const [error, setError] = createSignal(createError({ timestamp: testDate1.getTime() }));

      render(() => <ErrorDetails error={error()} />);

      expect(formatErrorTimestamp).toHaveBeenCalledWith(testDate1);

      setError(createError({ timestamp: testDate2.getTime() }));

      expect(formatErrorTimestamp).toHaveBeenCalledWith(testDate2);
    });

    it('displays updated error code when error changes', () => {
      const [error, setError] = createSignal(createError({ code: ErrorCode.WASM_EXECUTION_ERROR }));

      render(() => <ErrorDetails error={error()} />);

      expect(screen.getByText(ErrorCode.WASM_EXECUTION_ERROR)).toBeInTheDocument();

      setError(createError({ code: ErrorCode.TSX_PARSE_ERROR }));

      expect(screen.queryByText(ErrorCode.WASM_EXECUTION_ERROR)).not.toBeInTheDocument();
      expect(screen.getByText(ErrorCode.TSX_PARSE_ERROR)).toBeInTheDocument();
    });
  });

  describe('Technical Details and Metadata', () => {
    it('includes technical details in copied content', async () => {
      const error = createError({ technicalDetails: 'Stack trace here' });
      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(() => <ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      fireEvent.click(copyButton);
      await vi.advanceTimersByTimeAsync(0);

      expect(formatErrorDetailsForClipboard).toHaveBeenCalledWith(
        expect.objectContaining({ technicalDetails: 'Stack trace here' }),
      );
    });

    it('includes metadata in copied content', async () => {
      const error = createError({
        metadata: {
          type: 'wasm',
          browserInfo: { browser: 'Chrome', version: '120.0' },
          wasmInfo: { supported: true },
          memoryInfo: { platform: 'linux' },
        },
      });
      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(() => <ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      fireEvent.click(copyButton);
      await vi.advanceTimersByTimeAsync(0);

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

    it('handles missing technical details and metadata', async () => {
      const error = createError({
        technicalDetails: undefined,
        metadata: undefined,
      });
      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(() => <ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      fireEvent.click(copyButton);
      await vi.advanceTimersByTimeAsync(0);

      expect(formatErrorDetailsForClipboard).toHaveBeenCalledWith(
        expect.objectContaining({
          technicalDetails: undefined,
          metadata: undefined,
        }),
      );
    });
  });

  describe('Accessibility', () => {
    it('copy button has accessible label', () => {
      const error = createError();
      render(() => <ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details to clipboard/i });
      expect(copyButton).toHaveAttribute('aria-label', 'Copy error details to clipboard');
    });

    it('error code is in code element for semantic markup', () => {
      const error = createError({ code: ErrorCode.TSX_PARSE_ERROR });
      const { container } = render(() => <ErrorDetails error={error} />);

      const codeElement = container.querySelector('code');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement).toHaveTextContent(ErrorCode.TSX_PARSE_ERROR);
      expect(codeElement).toHaveClass('font-mono');
    });

    it('button shows success state after copy', async () => {
      const error = createError();
      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(() => <ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      fireEvent.click(copyButton);
      await vi.advanceTimersByTimeAsync(0);

      expect(copyButton).toHaveTextContent('Copied!');
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid multiple clicks gracefully', async () => {
      const error = createError();
      vi.mocked(copyToClipboard).mockResolvedValue(true);

      render(() => <ErrorDetails error={error} />);

      const copyButton = screen.getByRole('button', { name: /copy error details/i });
      fireEvent.click(copyButton);
      fireEvent.click(copyButton);
      await vi.advanceTimersByTimeAsync(0);

      expect(screen.getByText('Copied!')).toBeInTheDocument();
      expect(copyToClipboard).toHaveBeenCalled();
    });

    it('handles timestamp at Unix epoch', () => {
      const error = createError({ timestamp: 0 });
      render(() => <ErrorDetails error={error} />);

      expect(formatErrorTimestamp).toHaveBeenCalledWith(new Date(0));
    });

    it('handles future timestamp', () => {
      const futureDate = new Date('2099-12-31T23:59:59');
      const error = createError({ timestamp: futureDate.getTime() });
      render(() => <ErrorDetails error={error} />);

      expect(formatErrorTimestamp).toHaveBeenCalledWith(futureDate);
    });
  });
});
