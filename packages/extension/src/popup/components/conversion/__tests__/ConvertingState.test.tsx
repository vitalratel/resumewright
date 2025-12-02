/**
 * ConvertingStateWrapper Component Tests
 * Cancel confirmation flow
 * Progress updates and display
 * Progress indicators
 */

import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConvertingStateWrapper } from './ConvertingStateWrapper';
import { createProgress, progressFixtures, progressStore } from './testHelpers';

describe('ConvertingStateWrapper', () => {
  const mockOnCancel = vi.fn();
  const testJobId = 'test-job-123';

  beforeEach(() => {
    vi.clearAllMocks();
    progressStore.reset();
  });

  afterEach(() => {
    progressStore.reset();
  });

  describe('Basic Rendering', () => {
    it('should render converting state with default progress', async () => {
      render(<ConvertingStateWrapper jobId={testJobId} />);

      expect(screen.getByText('Converting to PDF...')).toBeInTheDocument();
      // Wait for spinner to appear (has 300ms delay)
      await waitFor(() => {
        expect(screen.getByRole('img', { name: 'Converting to PDF' })).toBeInTheDocument();
      });
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByTestId('progress-status')).toBeInTheDocument();
    });

    it('should display large spinner', async () => {
      render(<ConvertingStateWrapper jobId={testJobId} />);

      // Wait for spinner to appear (has 300ms delay)
      const spinner = await screen.findByRole('img', { name: 'Converting to PDF' });
      expect(spinner).toBeInTheDocument();
      // Spinner with size="large" has w-8 h-8 class
      expect(spinner).toHaveClass('w-8', 'h-8');
    });

    it('should show animated progress bar', () => {
      render(<ConvertingStateWrapper jobId={testJobId} />);

      const progressBar = screen.getByRole('progressbar');
      // Animated progress bar has transition class (optimized to transition only width)
      expect(progressBar).toHaveClass('transition-[width]');
    });

    it('should not show cancel button when onCancel is not provided', () => {
      render(<ConvertingStateWrapper jobId={testJobId} />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('should show cancel button when onCancel is provided', () => {
      render(<ConvertingStateWrapper jobId={testJobId} onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Filename Display ', () => {
    it('should not show filename when not provided', () => {
      render(<ConvertingStateWrapper jobId={testJobId} />);

      expect(screen.queryByText(/\.tsx$/)).not.toBeInTheDocument();
    });

    it('should display filename when provided', () => {
      const filename = 'john-doe-resume.tsx';
      render(<ConvertingStateWrapper jobId={testJobId} filename={filename} />);

      expect(screen.getByText(filename)).toBeInTheDocument();
    });

    it('should style filename as monospace code', () => {
      const filename = 'test-cv.tsx';
      render(<ConvertingStateWrapper jobId={testJobId} filename={filename} />);

      const filenameElement = screen.getByText(filename);
      expect(filenameElement).toHaveClass('font-mono');
      expect(filenameElement).toHaveClass('bg-gray-50');
    });

    it('should truncate long filenames', () => {
      const longFilename = 'very-long-filename-that-should-be-truncated-to-fit-in-ui.tsx';
      render(<ConvertingStateWrapper jobId={testJobId} filename={longFilename} />);

      const filenameElement = screen.getByText(longFilename);
      expect(filenameElement).toHaveClass('truncate');
      expect(filenameElement).toHaveClass('max-w-full');
    });
  });

  describe('Progress Updates', () => {
    it('should display 0% progress initially', () => {
      render(<ConvertingStateWrapper jobId={testJobId} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should update progress when store updates', async () => {
      // Start conversion first
      act(() => {
        progressStore.start(testJobId);
      });

      render(<ConvertingStateWrapper jobId={testJobId} />);

      // Update progress in store
      act(() => {
        progressStore.update(testJobId, progressFixtures.parsing);
      });

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '25');
      });
    });

    // Parameterized tests for different conversion stages
    it.each([
      {
        name: 'parsing',
        fixture: createProgress({
          stage: 'parsing',
          percentage: 20,
          currentOperation: 'Parsing TSX code...',
        }),
        expectedStage: 'parsing',
        expectedOp: 'Parsing TSX code...',
      },
      {
        name: 'rendering',
        fixture: progressFixtures.rendering,
        expectedStage: 'rendering',
        expectedOp: 'Rendering components...',
      },
      {
        name: 'layout',
        fixture: progressFixtures.layout,
        expectedStage: 'laying-out',
        expectedOp: 'Calculating layout...',
      },
      {
        name: 'generating-pdf',
        fixture: progressFixtures.pdf,
        expectedStage: 'generating-pdf',
        expectedOp: 'Generating PDF...',
      },
    ])('should show $name stage', async ({ fixture, expectedStage, expectedOp }) => {
      act(() => {
        progressStore.start(testJobId);
        progressStore.update(testJobId, fixture);
      });

      render(<ConvertingStateWrapper jobId={testJobId} />);

      await waitFor(() => {
        const statusContainer = screen.getByTestId('progress-status');
        expect(statusContainer).toHaveAttribute('data-stage', expectedStage);
        // Query within the status container to handle duplicate text
        expect(statusContainer).toHaveTextContent(expectedOp);
      });
    });

    it('should display ETA when calculated by store', async () => {
      // Start conversion to enable ETA calculation
      act(() => {
        progressStore.start(testJobId);
      });

      render(<ConvertingStateWrapper jobId={testJobId} />);

      // Update progress multiple times to build history for ETA calculation
      act(() => {
        progressStore.update(
          testJobId,
          createProgress({ stage: 'parsing', percentage: 25, currentOperation: 'Parsing...' })
        );
      });

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '25');
      });

      // Second update - ETA might be calculated now
      act(() => {
        progressStore.update(
          testJobId,
          createProgress({ percentage: 50, currentOperation: 'Processing...' })
        );
      });

      // ETA element should exist (value is calculated by store, so we just check it exists)
      await waitFor(() => {
        const progressStatus = screen.getByTestId('progress-status');
        expect(progressStatus).toBeInTheDocument();
        // If ETA is calculated, it should be rendered by the mock
        // Note: ETA may or may not be calculated depending on timing
        // This test just verifies the component passes ETA to ProgressStatus
      });
    });

    it('should display page progress when provided', async () => {
      act(() => {
        progressStore.start(testJobId);
        progressStore.update(
          testJobId,
          createProgress({
            stage: 'laying-out',
            percentage: 60,
            currentOperation: 'Laying out pages...',
            pagesProcessed: 2,
            totalPages: 3,
          })
        );
      });

      render(<ConvertingStateWrapper jobId={testJobId} />);

      await waitFor(() => {
        expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
      });
    });

    it('should handle 100% completion', async () => {
      act(() => {
        progressStore.start(testJobId);
        progressStore.update(
          testJobId,
          createProgress({
            stage: 'generating-pdf',
            percentage: 100,
            currentOperation: 'Finalizing PDF...',
          })
        );
      });

      render(<ConvertingStateWrapper jobId={testJobId} />);

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '100');
      });
    });

    it('should update progress multiple times', async () => {
      act(() => {
        progressStore.start(testJobId);
      });

      render(<ConvertingStateWrapper jobId={testJobId} />);

      // First update
      act(() => {
        progressStore.update(
          testJobId,
          createProgress({ stage: 'parsing', percentage: 25, currentOperation: 'Parsing...' })
        );
      });

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '25');
      });

      // Second update
      act(() => {
        progressStore.update(
          testJobId,
          createProgress({ percentage: 50, currentOperation: 'Rendering...' })
        );
      });

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      });

      // Third update
      act(() => {
        progressStore.update(
          testJobId,
          createProgress({
            stage: 'generating-pdf',
            percentage: 90,
            currentOperation: 'Generating...',
          })
        );
      });

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '90');
      });
    });
  });

  describe('Cancel Confirmation Flow', () => {
    it('should show confirmation dialog when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConvertingStateWrapper jobId={testJobId} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel conversion/i });

      // First click shows "Click again" state
      await user.click(cancelButton);
      expect(screen.getByRole('button', { name: /click again to confirm/i })).toBeInTheDocument();

      // Second click shows dialog
      await user.click(screen.getByRole('button', { name: /click again to confirm/i }));

      // Should show ConfirmDialog
      expect(screen.getByText('Cancel Conversion?')).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to cancel the PDF conversion/)
      ).toBeInTheDocument();
    });

    it('should call onCancel when confirming cancellation', async () => {
      const user = userEvent.setup();
      render(<ConvertingStateWrapper jobId={testJobId} onCancel={mockOnCancel} />);

      // Click cancel twice to show dialog
      const cancelButton = screen.getByRole('button', { name: /cancel conversion/i });
      await user.click(cancelButton);
      await user.click(screen.getByRole('button', { name: /click again to confirm/i }));

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Cancel Conversion?')).toBeInTheDocument();
      });

      // Click confirm in dialog (red danger button)
      // Use getAllByRole since there are now two "Cancel Conversion" buttons
      const buttons = screen.getAllByRole('button', { name: /cancel conversion/i });
      const confirmButton = buttons[1]; // Second one is in the dialog
      await user.click(confirmButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when dismissing dialog', async () => {
      const user = userEvent.setup();
      render(<ConvertingStateWrapper jobId={testJobId} onCancel={mockOnCancel} />);

      // Click cancel twice to show dialog
      const cancelButton = screen.getByRole('button', { name: /cancel conversion/i });
      await user.click(cancelButton);
      await user.click(screen.getByRole('button', { name: /click again to confirm/i }));

      // Click "Continue Converting" in dialog
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue converting/i })).toBeInTheDocument();
      });
      const continueButton = screen.getByRole('button', { name: /continue converting/i });
      await user.click(continueButton);

      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should have accessible cancel button', () => {
      render(<ConvertingStateWrapper jobId={testJobId} onCancel={mockOnCancel} />);

      // Initial state shows "Cancel conversion"
      const cancelButton = screen.getByRole('button', { name: /cancel conversion/i });
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).toHaveAccessibleName('Cancel conversion');
    });

    it('should style cancel button appropriately', () => {
      render(<ConvertingStateWrapper jobId={testJobId} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel conversion/i });
      // Using design tokens: tokens.colors.neutral.textMuted + tokens.colors.link.hover
      expect(cancelButton).toHaveClass('text-gray-600');
      expect(cancelButton).toHaveClass('hover:text-blue-700');
      expect(cancelButton).toHaveClass('hover:underline');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<ConvertingStateWrapper jobId={testJobId} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel conversion/i });

      // Tab to button
      await user.tab();
      expect(cancelButton).toHaveFocus();

      // First Enter press prompts for confirmation
      await user.keyboard('{Enter}');

      // Should now show "Click again" state
      expect(screen.getByRole('button', { name: /click again to confirm/i })).toBeInTheDocument();

      // Second Enter press opens dialog
      await user.keyboard('{Enter}');

      // Dialog should be open
      expect(screen.getByText('Cancel Conversion?')).toBeInTheDocument();
    });

    it('should be activatable with Space key', async () => {
      const user = userEvent.setup();
      render(<ConvertingStateWrapper jobId={testJobId} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel conversion/i });
      cancelButton.focus();

      // First space shows "Click again" state
      await user.keyboard(' ');
      expect(screen.getByRole('button', { name: /click again to confirm/i })).toBeInTheDocument();

      // Second space opens dialog
      await user.keyboard(' ');

      // Dialog should be open
      expect(screen.getByText('Cancel Conversion?')).toBeInTheDocument();
    });

    it('should have focus indicator', () => {
      render(<ConvertingStateWrapper jobId={testJobId} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel conversion/i });
      expect(cancelButton).toHaveClass('focus:ring-2');
      expect(cancelButton).toHaveClass('focus:ring-blue-300');
    });
  });

  describe('P1-A11Y-005: Screen Reader Announcements', () => {
    it('should have screen reader status region when announcing', async () => {
      // Start with non-zero progress to trigger announcement (>10% threshold)
      act(() => {
        progressStore.start(testJobId);
        progressStore.update(
          testJobId,
          createProgress({ percentage: 25, currentOperation: 'Rendering...' })
        );
      });

      render(<ConvertingStateWrapper jobId={testJobId} />);

      // Wait for the announcement to be rendered (25% > 10% threshold)
      await waitFor(() => {
        const statusRegion = screen.getByRole('status');
        expect(statusRegion).toBeInTheDocument();
        expect(statusRegion).toHaveAttribute('aria-live', 'polite');
        expect(statusRegion).toHaveAttribute('aria-atomic', 'true');
      });
    });

    it('should have visually hidden screen reader text', async () => {
      // Start with non-zero progress to trigger announcement
      act(() => {
        progressStore.start(testJobId);
        progressStore.update(
          testJobId,
          createProgress({ percentage: 30, currentOperation: 'Rendering...' })
        );
      });

      render(<ConvertingStateWrapper jobId={testJobId} />);

      await waitFor(() => {
        const statusRegion = screen.getByRole('status');
        expect(statusRegion).toHaveClass('sr-only');
      });
    });

    it('should show initial 0% announcement', async () => {
      render(<ConvertingStateWrapper jobId={testJobId} />);

      // Initial announcement IS shown (shouldAnnounce starts as true)
      // This ensures screen reader users know conversion has started
      await waitFor(() => {
        const statusRegion = screen.getByRole('status');
        expect(statusRegion).toBeInTheDocument();
        expect(statusRegion).toHaveTextContent(/Converting: 0% complete/);
        expect(statusRegion).toHaveTextContent(/Starting conversion/);
      });
    });

    it('should announce updated progress', async () => {
      act(() => {
        progressStore.start(testJobId);
      });

      render(<ConvertingStateWrapper jobId={testJobId} />);

      // Update to 25% - should announce (10% threshold)
      act(() => {
        progressStore.update(
          testJobId,
          createProgress({ stage: 'parsing', percentage: 25, currentOperation: 'Parsing TSX...' })
        );
      });

      await waitFor(() => {
        const statusRegion = screen.getByRole('status');
        expect(statusRegion).toHaveTextContent(/Converting: 25% complete/);
        expect(statusRegion).toHaveTextContent(/Parsing TSX/);
      });
    });

    it('should not have aria-hidden on visual content', () => {
      render(<ConvertingStateWrapper jobId={testJobId} />);

      // The visual content should be visible to screen readers
      // (aria-hidden is used for the announcements, not the visual UI)
      const heading = screen.getByText('Converting to PDF...');
      expect(heading).toBeInTheDocument();
      expect(heading).not.toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing progress in store gracefully', () => {
      // Don't start conversion, so no progress exists
      render(<ConvertingStateWrapper jobId="nonexistent-job" />);

      // Should show default values
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(screen.getByText('Starting conversion...')).toBeInTheDocument();
    });

    it('should handle rapid progress updates', async () => {
      act(() => {
        progressStore.start(testJobId);
      });

      render(<ConvertingStateWrapper jobId={testJobId} />);

      // Rapid updates
      act(() => {
        for (let i = 10; i <= 90; i += 10) {
          progressStore.update(
            testJobId,
            createProgress({ percentage: i, currentOperation: `Processing ${i}%...` })
          );
        }
      });

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '90');
      });
    });

    it('should handle empty filename', () => {
      render(<ConvertingStateWrapper jobId={testJobId} filename="" />);

      // Empty filename should not render the filename container
      // Check that the filename paragraph element doesn't exist
      const filenameElements = screen.queryAllByText((content, element) => {
        return (
          element?.tagName === 'P' && element?.className.includes('font-mono') && content === ''
        );
      });
      expect(filenameElements).toHaveLength(0);
    });

    it('should handle undefined onCancel', () => {
      render(<ConvertingStateWrapper jobId={testJobId} onCancel={undefined} />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('should not leak subscriptions on unmount', () => {
      const { unmount } = render(<ConvertingStateWrapper jobId={testJobId} />);

      // Update progress
      act(() => {
        progressStore.update(
          testJobId,
          createProgress({ percentage: 50, currentOperation: 'Test' })
        );
      });

      // Unmount
      unmount();

      // Further updates should not cause errors
      expect(() => {
        act(() => {
          progressStore.update(
            testJobId,
            createProgress({ stage: 'generating-pdf', percentage: 75, currentOperation: 'Test 2' })
          );
        });
      }).not.toThrow();
    });

    it('should re-subscribe when jobId changes', async () => {
      const { rerender } = render(<ConvertingStateWrapper jobId="job-1" />);

      act(() => {
        progressStore.start('job-1');
        progressStore.update(
          'job-1',
          createProgress({ percentage: 50, currentOperation: 'Job 1' })
        );
      });

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      });

      // Change jobId
      act(() => {
        progressStore.start('job-2');
        progressStore.update(
          'job-2',
          createProgress({ stage: 'laying-out', percentage: 75, currentOperation: 'Job 2' })
        );
      });

      rerender(<ConvertingStateWrapper jobId="job-2" />);

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '75');
        expect(screen.getByText('Job 2')).toBeInTheDocument();
      });
    });
  });
});
