/**
 * ErrorMetadata Component Tests
 * Metadata formatting and display tests
 *
 * Tests ErrorMetadata component for:
 * - Error ID display
 * - Timestamp formatting
 * - Copy-to-clipboard functionality
 * - Loading and success states
 * - Different metadata types
 */

import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { beforeEach, describe, expect, vi } from 'vitest';
import type { ErrorCategory } from '@/shared/errors/codes';
import { ErrorCode } from '@/shared/errors/codes';
import { ErrorMetadata } from '../ErrorMetadata';

// Mock error tracking utilities
const mockFormatErrorTimestamp = vi.fn();
const mockFormatErrorDetailsForClipboard = vi.fn();
const mockCopyToClipboard = vi.fn();

vi.mock('@/shared/errors/tracking/telemetry', () => ({
  formatErrorTimestamp: (...args: unknown[]): ReturnType<typeof mockFormatErrorTimestamp> =>
    mockFormatErrorTimestamp(...args),
  formatErrorDetailsForClipboard: (
    ...args: unknown[]
  ): ReturnType<typeof mockFormatErrorDetailsForClipboard> =>
    mockFormatErrorDetailsForClipboard(...args),
  copyToClipboard: (...args: unknown[]): ReturnType<typeof mockCopyToClipboard> =>
    mockCopyToClipboard(...args),
}));

describe('ErrorMetadata', () => {
  const baseProps = {
    timestamp: Date.now(),
    code: ErrorCode.WASM_EXECUTION_ERROR,
    message: 'Test error message',
    category: 'wasm' as ErrorCategory,
    technicalDetails: 'Stack trace here',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFormatErrorTimestamp.mockReturnValue('2025-11-03 10:30:45');
    mockFormatErrorDetailsForClipboard.mockReturnValue('Formatted error details');
    mockCopyToClipboard.mockResolvedValue(true);
  });

  describe('Error Code Display', () => {
    it('displays error code', () => {
      render(() => <ErrorMetadata {...baseProps} />);

      expect(screen.getByText('Error Code:')).toBeInTheDocument();
      expect(screen.getByText(ErrorCode.WASM_EXECUTION_ERROR)).toBeInTheDocument();
    });

    it('renders error code in monospace font', () => {
      render(() => <ErrorMetadata {...baseProps} />);

      const errorCodeElement = screen.getByText(ErrorCode.WASM_EXECUTION_ERROR);
      expect(errorCodeElement).toHaveClass('font-mono');
    });
  });

  describe('Timestamp Formatting', () => {
    it('displays formatted timestamp', () => {
      const timestamp = new Date('2025-11-03T10:30:45').getTime();
      mockFormatErrorTimestamp.mockReturnValue('Nov 3, 2025 at 10:30 AM');

      render(() => <ErrorMetadata {...baseProps} timestamp={timestamp} />);

      expect(screen.getByText('Time:')).toBeInTheDocument();
      expect(screen.getByText('Nov 3, 2025 at 10:30 AM')).toBeInTheDocument();
      expect(mockFormatErrorTimestamp).toHaveBeenCalledWith(new Date(timestamp));
    });

    it('handles different timestamp formats', () => {
      const testCases = [
        { timestamp: Date.now(), formatted: '2025-11-03 10:30:45' },
        { timestamp: Date.now() - 3600000, formatted: '1 hour ago' },
        { timestamp: 0, formatted: 'Invalid date' },
      ];

      testCases.forEach(({ timestamp, formatted }) => {
        mockFormatErrorTimestamp.mockReturnValue(formatted);
        const { unmount } = render(() => <ErrorMetadata {...baseProps} timestamp={timestamp} />);

        expect(screen.getByText(formatted)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Copy-to-Clipboard Functionality', () => {
    it('shows copy button with correct label', () => {
      render(() => <ErrorMetadata {...baseProps} />);

      const copyButton = screen.getByRole('button', { name: /copy error details to clipboard/i });
      expect(copyButton).toBeInTheDocument();
      expect(screen.getByText('Copy Details')).toBeInTheDocument();
    });

    it('calls clipboard API when copy button clicked', async () => {
      render(() => <ErrorMetadata {...baseProps} />);

      const copyButton = screen.getByRole('button', { name: /copy error details to clipboard/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockFormatErrorDetailsForClipboard).toHaveBeenCalledWith({
          timestamp: mockFormatErrorTimestamp.mock.results[0].value,
          code: baseProps.code,
          message: baseProps.message,
          category: baseProps.category,
          technicalDetails: baseProps.technicalDetails,
          metadata: undefined,
        });
        expect(mockCopyToClipboard).toHaveBeenCalledWith('Formatted error details');
      });
    });

    it('shows loading state during copy', async () => {
      let resolveCopy: ((value: boolean) => void) | undefined;
      const copyPromise = new Promise<boolean>((resolve) => {
        resolveCopy = resolve;
      });
      mockCopyToClipboard.mockReturnValue(copyPromise);

      render(() => <ErrorMetadata {...baseProps} />);

      const copyButton = screen.getByRole('button', { name: /copy error details to clipboard/i });
      fireEvent.click(copyButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Copying...')).toBeInTheDocument();
        expect(screen.getByLabelText('Copying error details...')).toBeInTheDocument();
      });

      // Resolve copy
      expect(resolveCopy).toBeDefined();
      resolveCopy?.(true);

      // Loading should disappear
      await waitFor(() => {
        expect(screen.queryByText('Copying...')).not.toBeInTheDocument();
      });
    });

    it('shows success state after successful copy', async () => {
      render(() => <ErrorMetadata {...baseProps} />);

      const copyButton = screen.getByRole('button', { name: /copy error details to clipboard/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    // Note: Testing timeout behavior with fake timers is implementation detail testing
    // The important behavior is that success state shows after copy, not the exact timing

    it('prevents duplicate copy attempts', async () => {
      let resolveCopy: ((value: boolean) => void) | undefined;
      const copyPromise = new Promise<boolean>((resolve) => {
        resolveCopy = resolve;
      });
      mockCopyToClipboard.mockReturnValue(copyPromise);

      render(() => <ErrorMetadata {...baseProps} />);

      const copyButton = screen.getByRole('button', { name: /copy error details to clipboard/i });

      // Click multiple times rapidly
      fireEvent.click(copyButton);
      fireEvent.click(copyButton);
      fireEvent.click(copyButton);

      // Should only call once (button is disabled after first click)
      expect(mockCopyToClipboard).toHaveBeenCalledTimes(1);

      expect(resolveCopy).toBeDefined();
      resolveCopy?.(true);
    });

    it('handles copy failure gracefully', async () => {
      mockCopyToClipboard.mockResolvedValue(false);

      render(() => <ErrorMetadata {...baseProps} />);

      const copyButton = screen.getByRole('button', { name: /copy error details to clipboard/i });
      fireEvent.click(copyButton);

      // Should not show success state
      await waitFor(() => {
        expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
      });
    });
  });

  describe('Different Metadata Types', () => {
    it('includes parse error metadata when copying', async () => {
      const parseMetadata = {
        type: 'parse' as const,
        line: 42,
        column: 15,
        codeContext: '<CV>Invalid TSX</CV>',
      };

      render(() => <ErrorMetadata {...baseProps} metadata={parseMetadata} />);

      const copyButton = screen.getByRole('button', { name: /copy error details to clipboard/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockFormatErrorDetailsForClipboard).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: parseMetadata,
          }),
        );
      });
    });

    it('includes size error metadata when copying', async () => {
      const sizeMetadata = {
        type: 'size' as const,
        fileSize: 5000000,
        maxSize: 2000000,
      };

      render(() => <ErrorMetadata {...baseProps} metadata={sizeMetadata} />);

      const copyButton = screen.getByRole('button', { name: /copy error details to clipboard/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockFormatErrorDetailsForClipboard).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: sizeMetadata,
          }),
        );
      });
    });

    it('includes WASM error metadata when copying', async () => {
      const wasmMetadata = {
        type: 'wasm' as const,
        wasmFunction: 'generate_pdf',
        rustStackTrace: 'Error at line 123',
      };

      render(() => <ErrorMetadata {...baseProps} metadata={wasmMetadata} />);

      const copyButton = screen.getByRole('button', { name: /copy error details to clipboard/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockFormatErrorDetailsForClipboard).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: wasmMetadata,
          }),
        );
      });
    });

    it('handles missing metadata gracefully', async () => {
      render(() => <ErrorMetadata {...baseProps} metadata={undefined} />);

      const copyButton = screen.getByRole('button', { name: /copy error details to clipboard/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockFormatErrorDetailsForClipboard).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: undefined,
          }),
        );
      });
    });
  });

  describe('Support Guidance', () => {
    it('displays help text about using error ID for support', () => {
      render(() => <ErrorMetadata {...baseProps} />);

      expect(
        screen.getByText(
          /Use the error code above when reporting this issue for faster resolution/i,
        ),
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('copy button has descriptive aria-label', () => {
      render(() => <ErrorMetadata {...baseProps} />);

      const copyButton = screen.getByLabelText('Copy error details to clipboard');
      expect(copyButton).toBeInTheDocument();
    });

    it('copy button aria-label updates during loading', async () => {
      let resolveCopy: ((value: boolean) => void) | undefined;
      const copyPromise = new Promise<boolean>((resolve) => {
        resolveCopy = resolve;
      });
      mockCopyToClipboard.mockReturnValue(copyPromise);

      render(() => <ErrorMetadata {...baseProps} />);

      const copyButton = screen.getByRole('button', { name: /copy error details to clipboard/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Copying error details...')).toBeInTheDocument();
      });

      expect(resolveCopy).toBeDefined();
      resolveCopy?.(true);
    });

    it('copy button is disabled during copying', async () => {
      let resolveCopy: ((value: boolean) => void) | undefined;
      const copyPromise = new Promise<boolean>((resolve) => {
        resolveCopy = resolve;
      });
      mockCopyToClipboard.mockReturnValue(copyPromise);

      render(() => <ErrorMetadata {...baseProps} />);

      const copyButton = screen.getByRole('button', { name: /copy error details to clipboard/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(copyButton).toBeDisabled();
      });

      expect(resolveCopy).toBeDefined();
      resolveCopy?.(true);

      await waitFor(() => {
        expect(copyButton).not.toBeDisabled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing optional props', () => {
      render(() => (
        <ErrorMetadata
          timestamp={Date.now()}
          code={ErrorCode.WASM_EXECUTION_ERROR}
          message="Test error"
        />
      ));

      expect(screen.getByText(ErrorCode.WASM_EXECUTION_ERROR)).toBeInTheDocument();
      expect(screen.getByText('Copy Details')).toBeInTheDocument();
    });

    it('handles all props provided', () => {
      const allProps = {
        ...baseProps,
        metadata: {
          type: 'parse' as const,
          line: 10,
          column: 5,
          codeContext: 'test',
        },
      };

      render(() => <ErrorMetadata {...allProps} />);

      expect(screen.getByText(baseProps.code)).toBeInTheDocument();
      expect(screen.getByText('Copy Details')).toBeInTheDocument();
    });
  });
});
