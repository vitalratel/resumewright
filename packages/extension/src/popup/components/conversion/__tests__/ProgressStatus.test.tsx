/**
 * ProgressStatus Component Tests
 * ETA debounce testing
 *
 * Tests for ProgressStatus component:
 * - Rendering with different stages
 * - Current operation display
 * - ETA display and debouncing
 * - Page progress display
 * - Accessibility
 */

import type { ConversionStatus } from '@/shared/types/models';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProgressStatus } from '../ProgressStatus';

describe('ProgressStatus', () => {
  afterEach(() => {
    // Clean up any timers
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  describe('Stage Rendering', () => {
    // Parameterized test - replaces 5 duplicate tests
    it.each<[ConversionStatus, string]>([
      ['queued', 'Preparing conversion...'],
      ['parsing', 'Parsing TSX structure...'],
      ['rendering', 'Rendering components...'],
      ['completed', 'Conversion complete'],
      ['failed', 'Conversion failed'],
    ])('should render %s stage with correct operation', (stage, operation) => {
      render(<ProgressStatus stage={stage} currentOperation={operation} />);

      const statusElement = screen.getByTestId('progress-status');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveAttribute('data-stage', stage);
      expect(screen.getByText(operation)).toBeInTheDocument();
    });
  });

  describe('ETA Display - P2-CONV-008', () => {
    it('should display ETA when provided', () => {
      render(<ProgressStatus stage="rendering" currentOperation="Rendering..." eta={5} />);

      expect(screen.getByText(/remaining/i)).toBeInTheDocument();
    });

    it('should show stable ETA during rapid updates', async () => {
      const { rerender } = render(
        <ProgressStatus stage="rendering" currentOperation="Rendering..." eta={10} />
      );

      // Simulate rapid ETA changes (as user would experience)
      rerender(<ProgressStatus stage="rendering" currentOperation="Rendering..." eta={9} />);
      rerender(<ProgressStatus stage="rendering" currentOperation="Rendering..." eta={8} />);
      rerender(<ProgressStatus stage="rendering" currentOperation="Rendering..." eta={7} />);

      // Wait for debounce to settle (testing user-visible stability)
      await waitFor(
        () => {
          expect(screen.getByText(/seconds remaining/i)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should update ETA when change is significant (>= 1 second)', async () => {
      const { rerender } = render(
        <ProgressStatus stage="rendering" currentOperation="Rendering..." eta={10} />
      );

      expect(screen.getByText('10 seconds remaining')).toBeInTheDocument();

      // Significant change
      rerender(<ProgressStatus stage="rendering" currentOperation="Rendering..." eta={8} />);

      // Wait for update
      await waitFor(
        () => {
          expect(screen.getByText('8 seconds remaining')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it.each([
      [undefined, /Usually completes in 3-5 seconds/i],
      [0, /Usually completes in 3-5 seconds/i],
    ])('should show default message when ETA is %s', (eta, expectedText) => {
      render(<ProgressStatus stage="rendering" currentOperation="Rendering..." eta={eta} />);

      expect(screen.getByText(expectedText)).toBeInTheDocument();
      expect(screen.queryByText(/remaining/i)).not.toBeInTheDocument();
    });

    it.each<ConversionStatus>(['completed', 'failed'])(
      'should not show default message for %s stage',
      (stage) => {
        render(<ProgressStatus stage={stage} currentOperation="Done" />);

        expect(screen.queryByText(/Usually completes/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/remaining/i)).not.toBeInTheDocument();
      }
    );
  });

  describe('Page Progress', () => {
    it('should display page progress when multi-page', () => {
      render(
        <ProgressStatus
          stage="rendering"
          currentOperation="Rendering..."
          pagesProcessed={2}
          totalPages={5}
        />
      );

      expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
    });

    it('should not display page progress for single page', () => {
      render(
        <ProgressStatus
          stage="rendering"
          currentOperation="Rendering..."
          pagesProcessed={1}
          totalPages={1}
        />
      );

      expect(screen.queryByText(/Page/i)).not.toBeInTheDocument();
    });

    it('should not display page progress when undefined', () => {
      render(<ProgressStatus stage="rendering" currentOperation="Rendering..." />);

      expect(screen.queryByText(/Page/i)).not.toBeInTheDocument();
    });

    it.each([
      [1, 3, 'Page 1 of 3'],
      [3, 3, 'Page 3 of 3'],
    ])('should display page %d of %d correctly', (current, total, expected) => {
      render(
        <ProgressStatus
          stage="rendering"
          currentOperation="Rendering..."
          pagesProcessed={current}
          totalPages={total}
        />
      );

      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible stage icon', () => {
      render(<ProgressStatus stage="rendering" currentOperation="Rendering..." />);

      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('aria-label');
    });

    it('should use semantic text hierarchy', () => {
      render(
        <ProgressStatus stage="rendering" currentOperation="Rendering components..." eta={5} />
      );

      const stageDisplay = screen.getByTestId('progress-status');
      expect(stageDisplay).toBeInTheDocument();
      expect(screen.getByText('Rendering components...')).toBeInTheDocument();
      expect(screen.getByText(/remaining/i)).toBeInTheDocument();
    });

    it('should have testid for easy selection', () => {
      render(<ProgressStatus stage="rendering" currentOperation="Test" />);

      expect(screen.getByTestId('progress-status')).toBeInTheDocument();
    });
  });

  describe('Current Operation', () => {
    it('should display current operation text', () => {
      render(<ProgressStatus stage="parsing" currentOperation="Extracting CV components..." />);

      expect(screen.getByText('Extracting CV components...')).toBeInTheDocument();
    });

    it('should handle empty operation text', () => {
      render(<ProgressStatus stage="queued" currentOperation="" />);

      expect(screen.getByTestId('progress-status')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid stage changes', () => {
      const { rerender } = render(<ProgressStatus stage="queued" currentOperation="Starting..." />);

      rerender(<ProgressStatus stage="parsing" currentOperation="Parsing..." />);
      rerender(<ProgressStatus stage="rendering" currentOperation="Rendering..." />);

      expect(screen.getByTestId('progress-status')).toHaveAttribute('data-stage', 'rendering');
      expect(screen.getByText('Rendering...')).toBeInTheDocument();
    });

    it('should handle undefined to defined ETA transition', async () => {
      const { rerender } = render(
        <ProgressStatus stage="rendering" currentOperation="Rendering..." />
      );

      expect(screen.getByText(/Usually completes/i)).toBeInTheDocument();

      rerender(<ProgressStatus stage="rendering" currentOperation="Rendering..." eta={3} />);

      await waitFor(
        () => {
          expect(screen.getByText('3 seconds remaining')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });
});
