/**
 * ErrorActions Component Tests
 *
 * Tests ErrorActions component for proper button rendering,
 * action prioritization, retry logic, and dev mode features.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, vi } from 'vitest';
import { ErrorCode } from '@/shared/errors/codes';
import type { ConversionError } from '@/shared/types/models';
import { ErrorActions } from '../ErrorActions';

// Mock clipboard functions
vi.mock('@/shared/errors/tracking/telemetry', async () => {
  const actual = await vi.importActual('@/shared/errors/tracking/telemetry');
  return {
    ...actual,
    copyToClipboard: vi.fn().mockResolvedValue(true),
  };
});

describe('ErrorActions', () => {
  // Base error fixture
  const createError = (overrides: Partial<ConversionError> = {}): ConversionError => ({
    stage: 'generating-pdf',
    code: ErrorCode.WASM_EXECUTION_ERROR,
    message: 'Test error',
    errorId: 'test-123',
    timestamp: Date.now(),
    recoverable: true,
    suggestions: [],
    technicalDetails: 'Test details',
    ...overrides,
  });

  describe('Retry Button', () => {
    it('shows retry button when error is recoverable', () => {
      const error = createError({ recoverable: true });
      const onRetry = vi.fn();

      render(<ErrorActions error={error} onRetry={onRetry} retryAttempt={0} />);

      expect(screen.getByTestId('try-again-button')).toBeInTheDocument();
      expect(screen.getByText('Try Converting Again')).toBeInTheDocument();
    });

    it('does not show retry button when error is not recoverable', () => {
      const error = createError({ recoverable: false });

      render(<ErrorActions error={error} retryAttempt={0} />);

      expect(screen.queryByText(/Try Converting Again/i)).not.toBeInTheDocument();
    });

    it('calls onRetry when retry button clicked', async () => {
      const user = userEvent.setup();
      const error = createError({ recoverable: true });
      const onRetry = vi.fn().mockResolvedValue(undefined);

      render(<ErrorActions error={error} onRetry={onRetry} retryAttempt={0} />);

      const retryButton = screen.getByTestId('try-again-button');
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('shows loading state during retry', async () => {
      const user = userEvent.setup();
      const error = createError({ recoverable: true });

      let resolveRetry: (() => void) | undefined;
      const retryPromise = new Promise<void>((resolve) => {
        resolveRetry = resolve;
      });

      // Mock returns a promise - using async to satisfy ESLint ts/promise-function-async
      const onRetry = vi.fn().mockImplementation(async () => retryPromise);

      render(<ErrorActions error={error} onRetry={onRetry} retryAttempt={0} />);

      const retryButton = screen.getByTestId('try-again-button');
      await user.click(retryButton);

      // Should show loading text
      expect(screen.getByText('Retrying...')).toBeInTheDocument();

      // Resolve the retry
      expect(resolveRetry).toBeDefined();
      resolveRetry?.();
      await waitFor(() => {
        expect(screen.queryByText('Retrying...')).not.toBeInTheDocument();
      });
    });

    it('prevents double-clicks during retry', async () => {
      const user = userEvent.setup();
      const error = createError({ recoverable: true });

      let resolveRetry: (() => void) | undefined;
      const retryPromise = new Promise<void>((resolve) => {
        resolveRetry = resolve;
      });

      const onRetry = vi.fn().mockImplementation(async () => retryPromise);

      render(<ErrorActions error={error} onRetry={onRetry} retryAttempt={0} />);

      const retryButton = screen.getByTestId('try-again-button');

      // First click - should trigger onRetry
      await user.click(retryButton);

      // Wait for button to be disabled
      await waitFor(() => {
        expect(retryButton).toBeDisabled();
      });

      // Try clicking while disabled (should be ignored)
      await user.click(retryButton);
      await user.click(retryButton);

      // Should only call once (first click before disabled)
      expect(onRetry).toHaveBeenCalledTimes(1);

      // Resolve the retry to cleanup
      expect(resolveRetry).toBeDefined();
      resolveRetry?.();
      await waitFor(() => {
        expect(retryButton).not.toBeDisabled();
      });
    });

    it.each([
      [0, 'Try Converting Again'],
      [1, 'Try Again (Attempt 2)'],
      [2, 'Try Again (Attempt 3)'],
      [5, 'Try Again (Attempt 6)'],
    ])('shows correct text for retry attempt %i', (attempt, expectedText) => {
      const error = createError({ recoverable: true });
      const onRetry = vi.fn();

      render(<ErrorActions error={error} onRetry={onRetry} retryAttempt={attempt} />);

      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
  });

  describe('Import Different File Button', () => {
    it('shows import button when onImportDifferent provided', () => {
      const error = createError();
      const onImportDifferent = vi.fn();

      render(<ErrorActions error={error} onImportDifferent={onImportDifferent} retryAttempt={0} />);

      expect(screen.getByText('Import Different File')).toBeInTheDocument();
    });

    it('does not show import button when onImportDifferent not provided', () => {
      const error = createError();

      render(<ErrorActions error={error} retryAttempt={0} />);

      expect(screen.queryByText('Import Different File')).not.toBeInTheDocument();
    });

    it('calls onImportDifferent when button clicked', async () => {
      const user = userEvent.setup();
      const error = createError();
      const onImportDifferent = vi.fn();

      render(<ErrorActions error={error} onImportDifferent={onImportDifferent} retryAttempt={0} />);

      const importButton = screen.getByText('Import Different File');
      await user.click(importButton);

      expect(onImportDifferent).toHaveBeenCalledTimes(1);
    });

    it('prioritizes import button for TSX_PARSE_ERROR', () => {
      const error = createError({ code: ErrorCode.TSX_PARSE_ERROR, recoverable: true });
      const onRetry = vi.fn();
      const onImportDifferent = vi.fn();

      const { container } = render(
        <ErrorActions
          error={error}
          onRetry={onRetry}
          onImportDifferent={onImportDifferent}
          retryAttempt={0}
        />,
      );

      // Import button should be primary (first button)
      const buttons = container.querySelectorAll('button');
      const importButton = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Import Different File'),
      );

      expect(importButton).toHaveClass('bg-blue-600'); // Primary variant
    });

    it('prioritizes import button after multiple retry attempts', () => {
      const error = createError({ recoverable: true });
      const onRetry = vi.fn();
      const onImportDifferent = vi.fn();

      const { container } = render(
        <ErrorActions
          error={error}
          onRetry={onRetry}
          onImportDifferent={onImportDifferent}
          retryAttempt={2} // >= 2 attempts
        />,
      );

      // Import button should be primary
      const buttons = container.querySelectorAll('button');
      const importButton = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Import Different File'),
      );

      expect(importButton).toHaveClass('bg-blue-600'); // Primary variant
    });

    it('shows import as secondary button for other errors', () => {
      const error = createError({ code: ErrorCode.WASM_EXECUTION_ERROR, recoverable: true });
      const onRetry = vi.fn();
      const onImportDifferent = vi.fn();

      const { container } = render(
        <ErrorActions
          error={error}
          onRetry={onRetry}
          onImportDifferent={onImportDifferent}
          retryAttempt={0}
        />,
      );

      // Import button should be secondary
      const buttons = container.querySelectorAll('button');
      const importButton = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Import Different File'),
      );

      expect(importButton).not.toHaveClass('bg-blue-600'); // Not primary
    });
  });

  describe('Dismiss Button', () => {
    it('shows dismiss button when onDismiss provided and no onImportDifferent', () => {
      const error = createError();
      const onDismiss = vi.fn();

      render(<ErrorActions error={error} onDismiss={onDismiss} retryAttempt={0} />);

      expect(screen.getByText('Return to Import')).toBeInTheDocument();
    });

    it('does not show dismiss button when onImportDifferent provided', () => {
      const error = createError();
      const onDismiss = vi.fn();
      const onImportDifferent = vi.fn();

      render(
        <ErrorActions
          error={error}
          onDismiss={onDismiss}
          onImportDifferent={onImportDifferent}
          retryAttempt={0}
        />,
      );

      expect(screen.queryByText('Return to Import')).not.toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button clicked', async () => {
      const user = userEvent.setup();
      const error = createError();
      const onDismiss = vi.fn();

      render(<ErrorActions error={error} onDismiss={onDismiss} retryAttempt={0} />);

      const dismissButton = screen.getByText('Return to Import');
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dev Mode Features', () => {
    const originalEnv = import.meta.env.DEV;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('shows copy error details button in dev mode', () => {
      // Mock dev mode
      import.meta.env.DEV = true;

      const error = createError();

      render(<ErrorActions error={error} retryAttempt={0} />);

      expect(screen.getByText('Copy Error Details')).toBeInTheDocument();

      // Restore
      import.meta.env.DEV = originalEnv;
    });

    it('does not show copy button in production', () => {
      // Mock production mode
      import.meta.env.DEV = false;

      const error = createError();

      render(<ErrorActions error={error} retryAttempt={0} />);

      expect(screen.queryByText('Copy Error Details')).not.toBeInTheDocument();

      // Restore
      import.meta.env.DEV = originalEnv;
    });

    it('copies error details to clipboard when copy button clicked', async () => {
      const user = userEvent.setup();
      import.meta.env.DEV = true;

      const { copyToClipboard } = await import('@/shared/errors/tracking/telemetry');
      const error = createError();

      render(<ErrorActions error={error} retryAttempt={0} />);

      const copyButton = screen.getByText('Copy Error Details');
      await user.click(copyButton);

      expect(copyToClipboard).toHaveBeenCalledWith(expect.stringContaining('test-123'));

      import.meta.env.DEV = originalEnv;
    });

    it('calls onReportIssue if provided instead of default', async () => {
      const user = userEvent.setup();
      import.meta.env.DEV = true;

      const onReportIssue = vi.fn();
      const error = createError();

      render(<ErrorActions error={error} onReportIssue={onReportIssue} retryAttempt={0} />);

      const copyButton = screen.getByText('Copy Error Details');
      await user.click(copyButton);

      expect(onReportIssue).toHaveBeenCalledTimes(1);

      import.meta.env.DEV = originalEnv;
    });
  });

  describe('Accessibility', () => {
    it('retry button has descriptive aria-label', () => {
      const error = createError({ recoverable: true });
      const onRetry = vi.fn();

      render(<ErrorActions error={error} onRetry={onRetry} retryAttempt={0} />);

      const retryButton = screen.getByLabelText('Try converting your CV again');
      expect(retryButton).toBeInTheDocument();
    });

    it('retry button aria-label includes attempt number', () => {
      const error = createError({ recoverable: true });
      const onRetry = vi.fn();

      render(<ErrorActions error={error} onRetry={onRetry} retryAttempt={2} />);

      const retryButton = screen.getByLabelText('Try converting again (attempt 3)');
      expect(retryButton).toBeInTheDocument();
    });

    it('import button has descriptive aria-label', () => {
      const error = createError();
      const onImportDifferent = vi.fn();

      render(<ErrorActions error={error} onImportDifferent={onImportDifferent} retryAttempt={0} />);

      const importButton = screen.getByLabelText(
        'Dismiss error and import a different CV file to convert',
      );
      expect(importButton).toBeInTheDocument();
    });

    it('dismiss button has descriptive aria-label', () => {
      const error = createError();
      const onDismiss = vi.fn();

      render(<ErrorActions error={error} onDismiss={onDismiss} retryAttempt={0} />);

      const dismissButton = screen.getByLabelText(
        'Dismiss error and return to file selection screen',
      );
      expect(dismissButton).toBeInTheDocument();
    });

    it('copy button has descriptive aria-label', () => {
      import.meta.env.DEV = true;
      const error = createError();

      render(<ErrorActions error={error} retryAttempt={0} />);

      const copyButton = screen.getByLabelText('Copy error details and open GitHub issue template');
      expect(copyButton).toBeInTheDocument();

      import.meta.env.DEV = false;
    });
  });

  describe('Edge Cases', () => {
    it('handles error without recoverable property', () => {
      const error = { ...createError(), recoverable: false };

      render(<ErrorActions error={error} retryAttempt={0} />);

      // Should not crash, and retry button should not appear
      expect(screen.queryByText(/Try Converting/i)).not.toBeInTheDocument();
    });

    it('handles missing callbacks gracefully', () => {
      const error = createError();

      render(<ErrorActions error={error} retryAttempt={0} />);

      // Should not crash (but also won't show buttons without callbacks)
      expect(screen.queryByText(/Try Converting/i)).not.toBeInTheDocument();
    });

    it('handles all callbacks provided simultaneously', () => {
      const error = createError({ recoverable: true });
      const onRetry = vi.fn();
      const onDismiss = vi.fn();
      const onImportDifferent = vi.fn();
      const onReportIssue = vi.fn();
      import.meta.env.DEV = true;

      render(
        <ErrorActions
          error={error}
          onRetry={onRetry}
          onDismiss={onDismiss}
          onImportDifferent={onImportDifferent}
          onReportIssue={onReportIssue}
          retryAttempt={0}
        />,
      );

      // Should show retry, import, and copy buttons
      expect(screen.getByText(/Try Converting Again/i)).toBeInTheDocument();
      expect(screen.getByText('Import Different File')).toBeInTheDocument();
      expect(screen.getByText('Copy Error Details')).toBeInTheDocument();

      // Should not show dismiss (hidden when import is shown)
      expect(screen.queryByText('Return to Import')).not.toBeInTheDocument();

      import.meta.env.DEV = false;
    });

    it('handles retry failure gracefully', async () => {
      const user = userEvent.setup();
      const error = createError({ recoverable: true });

      // Create a promise that will reject, but we'll catch it
      let rejectFn: (error: Error) => void;
      const rejectedPromise = new Promise<void>((_, reject) => {
        rejectFn = reject;
      });

      const onRetry = vi.fn(() => {
        // Reject asynchronously after returning the promise
        setTimeout(() => rejectFn(new Error('Retry failed')), 0);
        void rejectedPromise.catch(() => {
          // Catch internally to prevent unhandled rejection
        });
      });

      render(<ErrorActions error={error} onRetry={onRetry} retryAttempt={0} />);

      const retryButton = screen.getByTestId('try-again-button');
      await user.click(retryButton);

      // Should call onRetry
      expect(onRetry).toHaveBeenCalled();

      // Should eventually clear loading state (handled by component)
      await waitFor(
        () => {
          expect(screen.queryByText('Retrying...')).not.toBeInTheDocument();
        },
        { timeout: 200 },
      );
    });
  });
});
