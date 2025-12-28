// ABOUTME: Tests for ErrorBoundary component error catching and recovery.
// ABOUTME: Verifies fallback UI display and recovery/reload functionality.

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary, SectionErrorBoundary } from '../ErrorBoundary';

// Component that throws an error when shouldThrow is true
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests (React logs errors when boundaries catch)
  beforeEach(() => {
    vi.spyOn(globalThis.console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should catch errors and display fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/The extension encountered an error/i)).toBeInTheDocument();
  });

  it('should display error icon', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    // Check for the error icon (via className or role)
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should display Try Again button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Try to Recover')).toBeInTheDocument();
  });

  it('should display Reload Extension button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Reload Popup')).toBeInTheDocument();
  });

  it('should reload window when Reload Popup is clicked', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByText('Reload Popup'));

    expect(reloadMock).toHaveBeenCalled();
  });

  it('should log error to console', () => {
    const consoleErrorMock = vi.fn();
    console.error = consoleErrorMock;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(consoleErrorMock).toHaveBeenCalled();
  });

  // Verify ErrorBoundary catches store initialization errors
  it('should catch store hook errors during render', () => {
    // Component that throws an error in a hook (simulating store initialization failure)
    function ComponentWithStoreError(): React.ReactElement {
      // Simulate a Zustand store hook throwing an error
      throw new Error('Store initialization failed: chrome.storage.local is unavailable');
    }

    render(
      <ErrorBoundary>
        <ComponentWithStoreError />
      </ErrorBoundary>,
    );

    // ErrorBoundary should catch the error and display fallback UI
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/The extension encountered an error/i)).toBeInTheDocument();
    expect(screen.getByText('Try to Recover')).toBeInTheDocument();
    expect(screen.getByText('Reload Popup')).toBeInTheDocument();
  });

  describe('Development mode error details', () => {
    it('should show error details in development mode', () => {
      vi.stubEnv('PROD', false);
      vi.stubEnv('DEV', true);

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Error Details (Dev Only)')).toBeInTheDocument();
      expect(screen.getByText(/Test error/)).toBeInTheDocument();

      vi.unstubAllEnvs();
    });

    it('should NOT show error details in production mode', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('DEV', false);

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.queryByText('Error Details (Dev Only)')).not.toBeInTheDocument();

      vi.unstubAllEnvs();
    });

    it('should handle errorInfo with componentStack', () => {
      vi.stubEnv('PROD', false);
      vi.stubEnv('DEV', true);

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      // Error details should be shown and componentStack is included via errorInfo
      const detailsElement = screen.getByText('Error Details (Dev Only)');
      expect(detailsElement).toBeInTheDocument();

      // The error details should contain error information
      const preElement = detailsElement.parentElement?.querySelector('pre');
      expect(preElement).toBeInTheDocument();
      expect(preElement?.textContent).toContain('Error: Test error');

      vi.unstubAllEnvs();
    });
  });

  describe('SectionErrorBoundary', () => {
    it('should render children when there is no error', () => {
      render(
        <SectionErrorBoundary section="conversion">
          <div>Section content</div>
        </SectionErrorBoundary>,
      );

      expect(screen.getByText('Section content')).toBeInTheDocument();
    });

    it('should catch errors and display section-specific fallback', () => {
      render(
        <SectionErrorBoundary section="conversion">
          <ThrowError shouldThrow={true} />
        </SectionErrorBoundary>,
      );

      expect(screen.getByText('Conversion Error')).toBeInTheDocument();
      expect(screen.getByText('Dismiss Error')).toBeInTheDocument();
    });

    it('should display correct message for file-import section', () => {
      render(
        <SectionErrorBoundary section="file-import">
          <ThrowError shouldThrow={true} />
        </SectionErrorBoundary>,
      );

      expect(screen.getByText('File Import Error')).toBeInTheDocument();
    });

    it('should display correct message for settings section', () => {
      render(
        <SectionErrorBoundary section="settings">
          <ThrowError shouldThrow={true} />
        </SectionErrorBoundary>,
      );

      expect(screen.getByText('Settings Error')).toBeInTheDocument();
    });

    it('should call onReset when Dismiss Error is clicked', () => {
      const onResetMock = vi.fn();

      render(
        <SectionErrorBoundary section="conversion" onReset={onResetMock}>
          <ThrowError shouldThrow={true} />
        </SectionErrorBoundary>,
      );

      fireEvent.click(screen.getByText('Dismiss Error'));
      expect(onResetMock).toHaveBeenCalled();
    });

    it('should use custom fallback message when provided', () => {
      render(
        <SectionErrorBoundary section="conversion" fallbackMessage="Custom error message">
          <ThrowError shouldThrow={true} />
        </SectionErrorBoundary>,
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
  });
});
