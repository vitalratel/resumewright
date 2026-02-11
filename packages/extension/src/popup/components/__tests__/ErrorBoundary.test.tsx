/**
 * ABOUTME: Tests for ErrorBoundary component error catching and recovery.
 * ABOUTME: Verifies fallback UI display and recovery/reload functionality.
 */

import { fireEvent, render, screen } from '@solidjs/testing-library';
import type { JSX } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary, SectionErrorBoundary } from '../ErrorBoundary';

vi.mock('@/shared/infrastructure/logging/instance', () => ({
  getLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  })),
}));

import { getLogger } from '@/shared/infrastructure/logging/instance';

function ThrowError(props: { shouldThrow: boolean }): JSX.Element {
  if (props.shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(globalThis.console, 'error').mockImplementation(() => {});
    vi.mocked(getLogger).mockReturnValue({
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children when there is no error', () => {
    render(() => (
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    ));

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should catch errors and display fallback UI', () => {
    render(() => (
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    ));

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/The extension encountered an error/i)).toBeInTheDocument();
  });

  it('should display error icon', () => {
    const { container } = render(() => (
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    ));

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should display Try to Recover button', () => {
    render(() => (
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    ));

    expect(screen.getByText('Try to Recover')).toBeInTheDocument();
  });

  it('should display Reload Popup button', () => {
    render(() => (
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    ));

    expect(screen.getByText('Reload Popup')).toBeInTheDocument();
  });

  it('should reload window when Reload Popup is clicked', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(() => (
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    ));

    fireEvent.click(screen.getByText('Reload Popup'));

    expect(reloadMock).toHaveBeenCalled();
  });

  it('should log error via logger', () => {
    const mockError = vi.fn();
    vi.mocked(getLogger).mockReturnValue({
      error: mockError,
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    });

    render(() => (
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    ));

    expect(mockError).toHaveBeenCalledWith(
      'ErrorBoundary',
      expect.stringContaining('error'),
      expect.objectContaining({
        error: expect.any(Error),
      }),
    );
  });

  it('should catch store hook errors during render', () => {
    function ComponentWithStoreError(): JSX.Element {
      throw new Error('Store initialization failed: chrome.storage.local is unavailable');
    }

    render(() => (
      <ErrorBoundary>
        <ComponentWithStoreError />
      </ErrorBoundary>
    ));

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/The extension encountered an error/i)).toBeInTheDocument();
    expect(screen.getByText('Try to Recover')).toBeInTheDocument();
    expect(screen.getByText('Reload Popup')).toBeInTheDocument();
  });

  describe('Development mode error details', () => {
    it('should show error details in development mode', () => {
      vi.stubEnv('PROD', false);
      vi.stubEnv('DEV', true);

      render(() => (
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      ));

      expect(screen.getByText('Error Details (Dev Only)')).toBeInTheDocument();
      expect(screen.getByText(/Test error/)).toBeInTheDocument();

      vi.unstubAllEnvs();
    });

    it('should NOT show error details in production mode', () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('DEV', false);

      render(() => (
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      ));

      expect(screen.queryByText('Error Details (Dev Only)')).not.toBeInTheDocument();

      vi.unstubAllEnvs();
    });

    it('should display error message in details', () => {
      vi.stubEnv('PROD', false);
      vi.stubEnv('DEV', true);

      render(() => (
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      ));

      const detailsElement = screen.getByText('Error Details (Dev Only)');
      expect(detailsElement).toBeInTheDocument();

      const preElement = detailsElement.parentElement?.querySelector('pre');
      expect(preElement).toBeInTheDocument();
      expect(preElement?.textContent).toContain('Test error');

      vi.unstubAllEnvs();
    });
  });

  describe('SectionErrorBoundary', () => {
    it('should render children when there is no error', () => {
      render(() => (
        <SectionErrorBoundary section="conversion">
          <div>Section content</div>
        </SectionErrorBoundary>
      ));

      expect(screen.getByText('Section content')).toBeInTheDocument();
    });

    it('should catch errors and display section-specific fallback', () => {
      render(() => (
        <SectionErrorBoundary section="conversion">
          <ThrowError shouldThrow={true} />
        </SectionErrorBoundary>
      ));

      expect(screen.getByText('Conversion Error')).toBeInTheDocument();
      expect(screen.getByText('Dismiss Error')).toBeInTheDocument();
    });

    it('should display correct message for file-import section', () => {
      render(() => (
        <SectionErrorBoundary section="file-import">
          <ThrowError shouldThrow={true} />
        </SectionErrorBoundary>
      ));

      expect(screen.getByText('File Import Error')).toBeInTheDocument();
    });

    it('should display correct message for settings section', () => {
      render(() => (
        <SectionErrorBoundary section="settings">
          <ThrowError shouldThrow={true} />
        </SectionErrorBoundary>
      ));

      expect(screen.getByText('Settings Error')).toBeInTheDocument();
    });

    it('should call onReset when Dismiss Error is clicked', () => {
      const onResetMock = vi.fn();

      render(() => (
        <SectionErrorBoundary section="conversion" onReset={onResetMock}>
          <ThrowError shouldThrow={true} />
        </SectionErrorBoundary>
      ));

      fireEvent.click(screen.getByText('Dismiss Error'));
      expect(onResetMock).toHaveBeenCalled();
    });

    it('should use custom fallback message when provided', () => {
      render(() => (
        <SectionErrorBoundary section="conversion" fallbackMessage="Custom error message">
          <ThrowError shouldThrow={true} />
        </SectionErrorBoundary>
      ));

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
  });
});
