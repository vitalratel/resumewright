/**
 * ABOUTME: Tests for ProgressStatus stage display, ETA debouncing, and page progress.
 * ABOUTME: Validates rendering, accessibility, and edge cases for conversion tracking.
 */

import { render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConversionStatus } from '@/shared/types/models';
import { ProgressStatus } from '../ProgressStatus';

describe('ProgressStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Stage Rendering', () => {
    it.each<[ConversionStatus, string]>([
      ['queued', 'Preparing conversion...'],
      ['parsing', 'Parsing TSX structure...'],
      ['rendering', 'Rendering components...'],
      ['completed', 'Conversion complete'],
      ['failed', 'Conversion failed'],
    ])('should render %s stage with correct operation', (stage, operation) => {
      render(() => <ProgressStatus stage={stage} currentOperation={operation} />);

      const statusElement = screen.getByTestId('progress-status');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveAttribute('data-stage', stage);
      expect(screen.getByText(operation)).toBeInTheDocument();
    });
  });

  describe('ETA Display', () => {
    it('should display ETA when provided', () => {
      render(() => <ProgressStatus stage="rendering" currentOperation="Rendering..." eta={5} />);

      expect(screen.getByText(/remaining/i)).toBeInTheDocument();
    });

    it('should show stable ETA during rapid updates', () => {
      const [eta, setEta] = createSignal(10);
      render(() => (
        <ProgressStatus stage="rendering" currentOperation="Rendering..." eta={eta()} />
      ));

      // Simulate rapid ETA changes
      setEta(9);
      setEta(8);
      setEta(7);

      // Advance past debounce (500ms)
      vi.advanceTimersByTime(600);

      expect(screen.getByText(/seconds remaining/i)).toBeInTheDocument();
    });

    it('should update ETA when change is significant', () => {
      const [eta, setEta] = createSignal(10);
      render(() => (
        <ProgressStatus stage="rendering" currentOperation="Rendering..." eta={eta()} />
      ));

      expect(screen.getByText('10 seconds remaining')).toBeInTheDocument();

      setEta(8);
      vi.advanceTimersByTime(600);

      expect(screen.getByText('8 seconds remaining')).toBeInTheDocument();
    });

    it.each([
      [undefined, /Usually completes in 3-5 seconds/i],
      [0, /Usually completes in 3-5 seconds/i],
    ])('should show default message when ETA is %s', (eta, expectedText) => {
      render(() => <ProgressStatus stage="rendering" currentOperation="Rendering..." eta={eta} />);

      expect(screen.getByText(expectedText)).toBeInTheDocument();
      expect(screen.queryByText(/remaining/i)).not.toBeInTheDocument();
    });

    it.each<ConversionStatus>([
      'completed',
      'failed',
    ])('should not show default message for %s stage', (stage) => {
      render(() => <ProgressStatus stage={stage} currentOperation="Done" />);

      expect(screen.queryByText(/Usually completes/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/remaining/i)).not.toBeInTheDocument();
    });
  });

  describe('Page Progress', () => {
    it('should display page progress when multi-page', () => {
      render(() => (
        <ProgressStatus
          stage="rendering"
          currentOperation="Rendering..."
          pagesProcessed={2}
          totalPages={5}
        />
      ));

      expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
    });

    it('should not display page progress for single page', () => {
      render(() => (
        <ProgressStatus
          stage="rendering"
          currentOperation="Rendering..."
          pagesProcessed={1}
          totalPages={1}
        />
      ));

      expect(screen.queryByText(/Page/i)).not.toBeInTheDocument();
    });

    it('should not display page progress when undefined', () => {
      render(() => <ProgressStatus stage="rendering" currentOperation="Rendering..." />);

      expect(screen.queryByText(/Page/i)).not.toBeInTheDocument();
    });

    it.each([
      [1, 3, 'Page 1 of 3'],
      [3, 3, 'Page 3 of 3'],
    ])('should display page %d of %d correctly', (current, total, expected) => {
      render(() => (
        <ProgressStatus
          stage="rendering"
          currentOperation="Rendering..."
          pagesProcessed={current}
          totalPages={total}
        />
      ));

      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible stage icon', () => {
      render(() => <ProgressStatus stage="rendering" currentOperation="Rendering..." />);

      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('aria-label');
    });

    it('should use semantic text hierarchy', () => {
      render(() => (
        <ProgressStatus stage="rendering" currentOperation="Rendering components..." eta={5} />
      ));

      const stageDisplay = screen.getByTestId('progress-status');
      expect(stageDisplay).toBeInTheDocument();
      expect(screen.getByText('Rendering components...')).toBeInTheDocument();
      expect(screen.getByText(/remaining/i)).toBeInTheDocument();
    });

    it('should have testid for easy selection', () => {
      render(() => <ProgressStatus stage="rendering" currentOperation="Test" />);

      expect(screen.getByTestId('progress-status')).toBeInTheDocument();
    });
  });

  describe('Current Operation', () => {
    it('should display current operation text', () => {
      render(() => (
        <ProgressStatus stage="parsing" currentOperation="Extracting CV components..." />
      ));

      expect(screen.getByText('Extracting CV components...')).toBeInTheDocument();
    });

    it('should handle empty operation text', () => {
      render(() => <ProgressStatus stage="queued" currentOperation="" />);

      expect(screen.getByTestId('progress-status')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid stage changes', () => {
      const [stage, setStage] = createSignal<ConversionStatus>('queued');
      const [operation, setOperation] = createSignal('Starting...');

      render(() => <ProgressStatus stage={stage()} currentOperation={operation()} />);

      setStage('parsing');
      setOperation('Parsing...');
      setStage('rendering');
      setOperation('Rendering...');

      expect(screen.getByTestId('progress-status')).toHaveAttribute('data-stage', 'rendering');
      expect(screen.getByText('Rendering...')).toBeInTheDocument();
    });

    it('should handle undefined to defined ETA transition', () => {
      const [eta, setEta] = createSignal<number | undefined>(undefined);
      render(() => (
        <ProgressStatus stage="rendering" currentOperation="Rendering..." eta={eta()} />
      ));

      expect(screen.getByText(/Usually completes/i)).toBeInTheDocument();

      setEta(3);
      vi.advanceTimersByTime(600);

      expect(screen.getByText('3 seconds remaining')).toBeInTheDocument();
    });
  });
});
