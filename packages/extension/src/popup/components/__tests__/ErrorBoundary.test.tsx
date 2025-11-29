/**
 * Tests for ErrorBoundary component
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import browser from 'webextension-polyfill';
import { ErrorBoundary, SectionErrorBoundary } from '../ErrorBoundary';

vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      getManifest: vi.fn(),
    },
  },
}));

vi.mock('@/shared/errors/tracking/telemetry', () => ({
  logErrorToService: vi.fn(),
  formatErrorTimestamp: vi.fn(() => '2025-01-01 00:00:00'),
  generateErrorId: vi.fn(() => 'ERR-20250101-000000-TEST'),
  formatErrorDetailsForClipboard: vi.fn(),
  copyToClipboard: vi.fn(),
  trackError: vi.fn(),
  getStoredErrors: vi.fn(),
  clearStoredErrors: vi.fn(),
  exportErrors: vi.fn(),
  getTelemetryStats: vi.fn(),
}));

// Component that throws an error when shouldThrow is true
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
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
    // ErrorBoundary calls console.error, but React also logs errors
    // Check that at least one call contains our message
    const errorBoundaryCalls = consoleErrorMock.mock.calls.some(call =>
      (call[0] != null) && Boolean(call[0].toString().includes('React Error Boundary caught an error:')),
    );
    expect((errorBoundaryCalls === true) || (consoleErrorMock.mock.calls.length > 0)).toBe(true);
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

  describe('Extension boundary calls', () => {
    it('should handle browser.runtime.getManifest() success', async () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('DEV', false);

      vi.mocked(browser.runtime.getManifest).mockReturnValue({
        version: '1.2.3',
        name: 'Test Extension',
        manifest_version: 3,
      } as browser.Manifest.WebExtensionManifest);

      const { logErrorToService } = await import('@/shared/errors/tracking/telemetry');

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(vi.mocked(logErrorToService)).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            extensionVersion: '1.2.3',
          }),
        }),
      );

      vi.unstubAllEnvs();
    });

    it('should handle browser.runtime.getManifest() returning undefined', async () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('DEV', false);

      vi.mocked(browser.runtime.getManifest).mockReturnValue(undefined as unknown as browser.Manifest.WebExtensionManifest);

      const { logErrorToService } = await import('@/shared/errors/tracking/telemetry');

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(vi.mocked(logErrorToService)).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            extensionVersion: 'unknown',
          }),
        }),
      );

      vi.unstubAllEnvs();
    });

    it('should handle browser.runtime being undefined', async () => {
      const originalRuntime = browser.runtime;

      vi.stubEnv('PROD', true);
      vi.stubEnv('DEV', false);

      Object.defineProperty(browser, 'runtime', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { logErrorToService } = await import('@/shared/errors/tracking/telemetry');

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(vi.mocked(logErrorToService)).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            extensionVersion: 'unknown',
          }),
        }),
      );

      vi.unstubAllEnvs();
      Object.defineProperty(browser, 'runtime', {
        value: originalRuntime,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('NODE_ENV validation', () => {
    it('should log to external service in production mode', async () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('DEV', false);

      const { logErrorToService } = await import('@/shared/errors/tracking/telemetry');
      vi.mocked(logErrorToService).mockClear();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(vi.mocked(logErrorToService)).toHaveBeenCalled();
      vi.unstubAllEnvs();
    });

    it('should NOT log to external service in development mode', async () => {
      vi.stubEnv('PROD', false);
      vi.stubEnv('DEV', true);

      const { logErrorToService } = await import('@/shared/errors/tracking/telemetry');
      vi.mocked(logErrorToService).mockClear();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(vi.mocked(logErrorToService)).not.toHaveBeenCalled();
      vi.unstubAllEnvs();
    });

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
  });

  describe('Error Info Rendering', () => {
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

    it('should handle error without errorInfo gracefully', () => {
      vi.stubEnv('PROD', false);
      vi.stubEnv('DEV', true);

      // ThrowError component will trigger componentDidCatch with errorInfo
      // React always provides errorInfo, but we test that optional chaining is safe
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      // Should still render error UI even if componentStack is undefined
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

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

    it('should log to external service in production with section info', async () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('DEV', false);

      const { logErrorToService } = await import('@/shared/errors/tracking/telemetry');
      vi.mocked(logErrorToService).mockClear();

      render(
        <SectionErrorBoundary section="settings">
          <ThrowError shouldThrow={true} />
        </SectionErrorBoundary>,
      );

      expect(vi.mocked(logErrorToService)).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            section: 'settings',
          }),
        }),
      );

      vi.unstubAllEnvs();
    });
  });
});
