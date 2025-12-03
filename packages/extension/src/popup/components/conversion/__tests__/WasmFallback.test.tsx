/**
 * WasmFallback Component Tests
 * WASM Initialization Fallback UI
 * Enhanced troubleshooting steps
 *
 * Tests for WasmFallback component:
 * - Rendering with compatible/incompatible browser states
 * - Browser information display
 * - Issues list display
 * - Enhanced troubleshooting steps
 * - Action buttons
 * - Technical details collapsible section
 * - Accessibility
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { fakeBrowser } from '@webext-core/fake-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WasmFallback } from '../WasmFallback';
import {
  compatibleReport,
  incompatibleReport,
  lowMemoryReport,
  reportWithoutMemory,
} from './__fixtures__/wasmReports';

// Note: wxt/browser is mocked globally in vitest.setup.ts with fakeBrowser
// We spy on fakeBrowser methods to control behavior

// Mock clipboard functions
vi.mock('@/shared/errors', async () => {
  const actual = await vi.importActual('@/shared/errors');
  return {
    ...actual,
    copyToClipboard: vi.fn().mockResolvedValue(true),
  };
});

describe('WasmFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock reload since fakeBrowser doesn't implement it
    vi.spyOn(fakeBrowser.runtime, 'reload').mockImplementation(() => {});
  });

  describe('Rendering', () => {
    it('should render as alert with assertive aria-live', () => {
      render(<WasmFallback report={compatibleReport} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should display error icon', () => {
      render(<WasmFallback report={compatibleReport} />);

      expect(screen.getByLabelText('Error')).toBeInTheDocument();
    });

    it('should display error title', () => {
      render(<WasmFallback report={compatibleReport} />);

      expect(screen.getByText('Converter Initialization Failed')).toBeInTheDocument();
    });

    it.each([
      [compatibleReport, /The PDF converter failed to initialize. This may be a temporary issue./i],
      [
        incompatibleReport,
        /Your browser does not meet the requirements to run the PDF converter./i,
      ],
    ])('should show appropriate message based on compatibility', (report, expectedMessage) => {
      render(<WasmFallback report={report} />);

      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
    });
  });

  describe('Browser Information', () => {
    it('should display browser name, version, and platform', () => {
      render(<WasmFallback report={compatibleReport} />);

      expect(screen.getByText(/Chrome 120.0/i)).toBeInTheDocument();
    });

    it('should display memory information when available', () => {
      render(<WasmFallback report={compatibleReport} />);

      expect(screen.getByText(/Memory: 2048MB \/ 8192MB \(25%\)/i)).toBeInTheDocument();
    });

    it('should handle missing memory info gracefully', () => {
      render(<WasmFallback report={reportWithoutMemory} />);

      expect(screen.getByText('Browser Information')).toBeInTheDocument();
      expect(screen.queryByText(/Memory:/i)).not.toBeInTheDocument();
    });
  });

  describe('Issues List', () => {
    it('should display issues when present', () => {
      render(<WasmFallback report={incompatibleReport} />);

      expect(screen.getByText('Detected Issues:')).toBeInTheDocument();
      expect(screen.getByText('WebAssembly not supported')).toBeInTheDocument();
      expect(screen.getByText('Update to Safari 14.1 or later')).toBeInTheDocument();
      expect(screen.getByText('Low memory available')).toBeInTheDocument();
      expect(screen.getByText('Close other applications')).toBeInTheDocument();
    });

    it('should not display issues section when no issues', () => {
      render(<WasmFallback report={compatibleReport} />);

      expect(screen.queryByText('Detected Issues:')).not.toBeInTheDocument();
    });

    it.each(['ERROR', 'WARNING'])('should display %s severity badges', (severity) => {
      render(<WasmFallback report={incompatibleReport} />);

      const badges = screen.getAllByText(severity);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe('Troubleshooting Steps - P2-CONV-007', () => {
    it('should display numbered troubleshooting steps', () => {
      render(<WasmFallback report={compatibleReport} />);

      expect(screen.getByText('Troubleshooting Steps:')).toBeInTheDocument();
      expect(screen.getByText(/Update your browser/i)).toBeInTheDocument();
      expect(screen.getByText(/Check.*support/i)).toBeInTheDocument();
      expect(screen.getByText(/Clear cache and reload/i)).toBeInTheDocument();
      expect(screen.getByText(/Check browser console/i)).toBeInTheDocument();
      expect(screen.getByText(/Try a different browser/i)).toBeInTheDocument();
    });

    it('should include browser-specific update links', () => {
      render(<WasmFallback report={compatibleReport} />);

      expect(
        screen.getByText(/chrome:\/\/settings\/help or edge:\/\/settings\/help/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/about:support → Check for updates/i)).toBeInTheDocument();
    });

    it('should include WebAssembly verification link', () => {
      render(<WasmFallback report={compatibleReport} />);

      const wasmLink = screen.getByRole('link', { name: /webassembly\.org/i });
      expect(wasmLink).toBeInTheDocument();
      expect(wasmLink).toHaveAttribute('href', 'https://webassembly.org');
      expect(wasmLink).toHaveAttribute('target', '_blank');
      expect(wasmLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should include recommended browser versions', () => {
      render(<WasmFallback report={compatibleReport} />);

      expect(screen.getByText(/Chrome 87\+, Firefox 89\+, or Edge 88\+/i)).toBeInTheDocument();
    });

    it('should show memory warning when usage > 75%', () => {
      render(<WasmFallback report={lowMemoryReport} />);

      expect(screen.getByText(/Free up memory/i)).toBeInTheDocument();
      expect(screen.getByText(/currently using.*85.*% of available memory/i)).toBeInTheDocument();
    });

    it('should NOT show memory warning when usage <= 75%', () => {
      render(<WasmFallback report={compatibleReport} />);

      expect(screen.queryByText(/Free up memory/i)).not.toBeInTheDocument();
    });

    it('should show console debugging step', () => {
      render(<WasmFallback report={compatibleReport} />);

      expect(
        screen.getByText(/Press F12 → Console tab for detailed error messages/i),
      ).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should display Clear Cache & Reload button', () => {
      render(<WasmFallback report={compatibleReport} />);

      expect(screen.getByRole('button', { name: /Clear cache and reload/i })).toBeInTheDocument();
    });

    it('should call browser.runtime.reload on Clear Cache click', async () => {
      const { browser } = await import('wxt/browser');
      render(<WasmFallback report={compatibleReport} />);

      const button = screen.getByRole('button', { name: /Clear cache and reload/i });
      fireEvent.click(button);

      // Wait for async operation (500ms delay + processing)
      await waitFor(
        () => {
          expect(browser.runtime.reload).toHaveBeenCalled();
        },
        { timeout: 2000 },
      );
    });

    it('should NOT display Copy Error Details in production', () => {
      vi.stubEnv('DEV', false);
      render(<WasmFallback report={compatibleReport} />);

      expect(screen.queryByRole('button', { name: /Copy Error Details/i })).not.toBeInTheDocument();
      vi.unstubAllEnvs();
    });

    it('should display Copy Error Details in dev mode', () => {
      vi.stubEnv('DEV', true);
      render(<WasmFallback report={compatibleReport} />);

      expect(
        screen.getByRole('button', { name: /Copy error details and open GitHub issue template/i }),
      ).toBeInTheDocument();
      vi.unstubAllEnvs();
    });

    it('should copy error details to clipboard when Copy Error Details clicked', async () => {
      const { copyToClipboard } = await import('@/shared/errors');
      vi.stubEnv('DEV', true);

      render(<WasmFallback report={compatibleReport} />);

      const button = screen.getByRole('button', {
        name: /Copy error details and open GitHub issue template/i,
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(copyToClipboard).toHaveBeenCalledTimes(1);
      });
      expect(copyToClipboard).toHaveBeenCalledWith(expect.stringContaining('WASM_INIT_FAILED'));

      vi.unstubAllEnvs();
    });
  });

  describe('Technical Details', () => {
    it('should display collapsed technical details by default', () => {
      render(<WasmFallback report={compatibleReport} />);

      const button = screen.getByRole('button', { name: /Technical Details/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-controls', 'technical-details');
    });

    it('should expand and collapse technical details on click', () => {
      render(<WasmFallback report={compatibleReport} />);

      const button = screen.getByRole('button', { name: /Technical Details/i });

      // Initially collapsed
      expect(button).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert" with assertive aria-live', () => {
      render(<WasmFallback report={compatibleReport} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have focusable container', () => {
      const { container } = render(<WasmFallback report={compatibleReport} />);

      const alertDiv = container.querySelector('[role="alert"]');
      expect(alertDiv).toHaveAttribute('tabindex', '-1');
    });

    it('should have accessible button labels', () => {
      render(<WasmFallback report={compatibleReport} />);

      const clearButton = screen.getByRole('button', { name: /Clear cache and reload/i });
      expect(clearButton).toHaveAccessibleName();
    });

    it('should have accessible external link', () => {
      render(<WasmFallback report={compatibleReport} />);

      const wasmLink = screen.getByRole('link', { name: /webassembly\.org/i });
      expect(wasmLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should have error icon with aria-label', () => {
      render(<WasmFallback report={compatibleReport} />);

      expect(screen.getByLabelText('Error')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle ref forwarding', () => {
      const ref = { current: null };
      render(<WasmFallback ref={ref} report={compatibleReport} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});
