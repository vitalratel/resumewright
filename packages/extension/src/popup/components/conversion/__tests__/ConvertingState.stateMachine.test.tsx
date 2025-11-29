/**
 * ConvertingStateWrapper - State Machine Integration Tests
 *
 * Tests state machine integration focused on:
 * - Cancel button visibility based on onCancel prop
 * - Progress updates reflecting in UI
 * - Conversion stage transitions
 * - State-specific message displays
 *
 * Memory-efficient: Tests component in isolation (0.3MB per test vs 3MB for full App)
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProgressStore } from '../../../store/progressStore';
import { ConvertingStateWrapper } from './ConvertingStateWrapper';

const DEFAULT_JOB_ID = 'test-job-sm';

describe('ConvertingStateWrapper - State Machine Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProgressStore.getState().clearConversion(DEFAULT_JOB_ID);
  });

  describe('Cancel Button State Management', () => {
    it('should show cancel button when onCancel provided', () => {
      const mockCancel = vi.fn();

      useProgressStore.getState().startConversion(DEFAULT_JOB_ID);
      useProgressStore.getState().updateProgress(DEFAULT_JOB_ID, {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering components...',
      });

      render(<ConvertingStateWrapper jobId={DEFAULT_JOB_ID} onCancel={mockCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel conversion/i });
      expect(cancelButton).toBeInTheDocument();
    });

    it('should not show cancel button when onCancel is undefined', () => {
      useProgressStore.getState().startConversion(DEFAULT_JOB_ID);
      useProgressStore.getState().updateProgress(DEFAULT_JOB_ID, {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering components...',
      });

      render(<ConvertingStateWrapper jobId={DEFAULT_JOB_ID} />);

      expect(screen.queryByRole('button', { name: /cancel conversion/i })).not.toBeInTheDocument();
    });

    it('should call onCancel when cancel clicked', async () => {
      const mockCancel = vi.fn();
      const user = userEvent.setup();

      useProgressStore.getState().startConversion(DEFAULT_JOB_ID);
      useProgressStore.getState().updateProgress(DEFAULT_JOB_ID, {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering components...',
      });

      render(<ConvertingStateWrapper jobId={DEFAULT_JOB_ID} onCancel={mockCancel} />);

      // First click on cancel button
      const buttons = screen.getAllByRole('button', { name: /cancel conversion/i });
      const initialCancelButton = buttons[0];
      await user.click(initialCancelButton);

      // Button should change to "Click again to cancel"
      expect(screen.getByRole('button', { name: /click again to confirm/i })).toBeInTheDocument();

      // Second click to confirm
      await user.click(screen.getByRole('button', { name: /click again to confirm/i }));

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Cancel Conversion?')).toBeInTheDocument();
      });

      // Click confirm in dialog
      const confirmButton = screen.getAllByRole('button', { name: /cancel conversion/i })[1];
      await user.click(confirmButton);

      expect(mockCancel).toHaveBeenCalledOnce();
    });
  });

  describe('Progress Percentage Display', () => {
    it('should show progress percentage from store', async () => {
      useProgressStore.getState().startConversion(DEFAULT_JOB_ID);
      useProgressStore.getState().updateProgress(DEFAULT_JOB_ID, {
        stage: 'parsing',
        percentage: 25,
        currentOperation: 'Parsing TSX...',
      });

      render(<ConvertingStateWrapper jobId={DEFAULT_JOB_ID} />);

      await waitFor(() => {
        expect(screen.getByText('25%')).toBeInTheDocument();
      });
    });

    it('should update progress display when progress changes', async () => {
      useProgressStore.getState().startConversion(DEFAULT_JOB_ID);

      render(<ConvertingStateWrapper jobId={DEFAULT_JOB_ID} />);

      // Initial progress
      useProgressStore.getState().updateProgress(DEFAULT_JOB_ID, {
        stage: 'parsing',
        percentage: 25,
        currentOperation: 'Parsing...',
      });

      await waitFor(() => {
        expect(screen.getByText('25%')).toBeInTheDocument();
      });

      // Update progress
      useProgressStore.getState().updateProgress(DEFAULT_JOB_ID, {
        stage: 'rendering',
        percentage: 75,
        currentOperation: 'Rendering...',
      });

      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument();
      });
    });
  });

  describe('Current Operation Text', () => {
    it('should show current operation text from store', async () => {
      useProgressStore.getState().startConversion(DEFAULT_JOB_ID);
      useProgressStore.getState().updateProgress(DEFAULT_JOB_ID, {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Rendering components for page 1...',
      });

      render(<ConvertingStateWrapper jobId={DEFAULT_JOB_ID} />);

      await waitFor(() => {
        const elements = screen.getAllByText(/Rendering components for page 1/i);
        expect(elements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Conversion Stage Transitions', () => {
    it('should handle queued stage', async () => {
      useProgressStore.getState().startConversion(DEFAULT_JOB_ID);
      useProgressStore.getState().updateProgress(DEFAULT_JOB_ID, {
        stage: 'queued',
        percentage: 0,
        currentOperation: 'Waiting in queue...',
      });

      render(<ConvertingStateWrapper jobId={DEFAULT_JOB_ID} />);

      await waitFor(() => {
        expect(screen.getAllByText(/Waiting in queue/i).length).toBeGreaterThan(0);
      });
    });

    it('should handle parsing stage', async () => {
      useProgressStore.getState().startConversion(DEFAULT_JOB_ID);
      useProgressStore.getState().updateProgress(DEFAULT_JOB_ID, {
        stage: 'parsing',
        percentage: 20,
        currentOperation: 'Parsing TSX code...',
      });

      render(<ConvertingStateWrapper jobId={DEFAULT_JOB_ID} />);

      await waitFor(() => {
        expect(screen.getAllByText(/Parsing TSX code/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText('20%').length).toBeGreaterThan(0);
      });
    });

    it('should handle rendering stage', async () => {
      useProgressStore.getState().startConversion(DEFAULT_JOB_ID);
      useProgressStore.getState().updateProgress(DEFAULT_JOB_ID, {
        stage: 'rendering',
        percentage: 40,
        currentOperation: 'Rendering React components...',
      });

      render(<ConvertingStateWrapper jobId={DEFAULT_JOB_ID} />);

      await waitFor(() => {
        expect(screen.getAllByText(/Rendering React components/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText('40%').length).toBeGreaterThan(0);
      });
    });

    it('should handle layout stage', async () => {
      useProgressStore.getState().startConversion(DEFAULT_JOB_ID);
      useProgressStore.getState().updateProgress(DEFAULT_JOB_ID, {
        stage: 'laying-out',
        percentage: 60,
        currentOperation: 'Calculating page layout...',
      });

      render(<ConvertingStateWrapper jobId={DEFAULT_JOB_ID} />);

      await waitFor(() => {
        expect(screen.getAllByText(/Calculating page layout/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText('60%').length).toBeGreaterThan(0);
      });
    });

    it('should handle pdf_generation stage', async () => {
      useProgressStore.getState().startConversion(DEFAULT_JOB_ID);
      useProgressStore.getState().updateProgress(DEFAULT_JOB_ID, {
        stage: 'generating-pdf',
        percentage: 85,
        currentOperation: 'Generating PDF file...',
      });

      render(<ConvertingStateWrapper jobId={DEFAULT_JOB_ID} />);

      await waitFor(() => {
        expect(screen.getAllByText(/Generating PDF file/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText('85%').length).toBeGreaterThan(0);
      });
    });

    it('should handle compression stage', async () => {
      useProgressStore.getState().startConversion(DEFAULT_JOB_ID);
      useProgressStore.getState().updateProgress(DEFAULT_JOB_ID, {
        stage: 'optimizing',
        percentage: 95,
        currentOperation: 'Compressing PDF...',
      });

      render(<ConvertingStateWrapper jobId={DEFAULT_JOB_ID} />);

      await waitFor(() => {
        expect(screen.getAllByText(/Compressing PDF/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText('95%').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Stage-Specific Messages', () => {
    it('should display default message when no progress exists', () => {
      // Don't start conversion, so no progress in store
      render(<ConvertingStateWrapper jobId="nonexistent-job" />);

      expect(screen.getAllByText(/Starting conversion/i).length).toBeGreaterThan(0);
    });

    it('should update message as stage progresses', async () => {
      useProgressStore.getState().startConversion(DEFAULT_JOB_ID);

      render(<ConvertingStateWrapper jobId={DEFAULT_JOB_ID} />);

      // Parsing stage
      useProgressStore.getState().updateProgress(DEFAULT_JOB_ID, {
        stage: 'parsing',
        percentage: 20,
        currentOperation: 'Step 1: Parsing',
      });

      await waitFor(() => {
        expect(screen.getAllByText(/Step 1: Parsing/i).length).toBeGreaterThan(0);
      });

      // Rendering stage
      useProgressStore.getState().updateProgress(DEFAULT_JOB_ID, {
        stage: 'rendering',
        percentage: 50,
        currentOperation: 'Step 2: Rendering',
      });

      await waitFor(() => {
        expect(screen.getAllByText(/Step 2: Rendering/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/Step 1: Parsing/i).length).toBe(0);
      });
    });
  });
});
