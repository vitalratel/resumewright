// ABOUTME: Error boundary catching React errors to prevent complete app crashes.
// ABOUTME: Provides fallback UI and error recovery options for both full-app and section-specific failures.

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { formatErrorTimestamp, logErrorToService } from '@/shared/errors/tracking/telemetry';
import { getLogger } from '@/shared/infrastructure/logging/instance';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary that catches and handles React component errors
 * Prevents the entire popup from crashing when a component fails
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so next render shows fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Logging for dev
    getLogger().error('ErrorBoundary', 'React Error Boundary caught an error', {
      error,
      errorInfo,
    });

    // External logging for production with PII sanitization (fix)
    if (import.meta.env.PROD) {
      void logErrorToService({
        errorId: `REACT-${Date.now()}`,
        code: 'REACT_ERROR',
        message: error.message, // Message only, no stack with user data
        timestamp: formatErrorTimestamp(),
        category: 'React Error Boundary',
        technicalDetails: this.sanitizeComponentStack(errorInfo.componentStack),
        metadata: {
          userAgent: navigator.userAgent,
          extensionVersion: browser.runtime?.getManifest?.()?.version || 'unknown',
          url: window.location.href,
        },
        // DO NOT include: error.stack, settings, CV content, localStorage
      });
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  /**
   * Sanitizes component stack to remove file paths, variable names, and potential PII
   * @param stack - The component stack from errorInfo
   * @returns Sanitized stack trace or undefined if empty
   */
  private sanitizeComponentStack(stack: string | null | undefined): string | undefined {
    if (stack === null || stack === undefined) return undefined;

    // Remove file paths, variable names, and potential PII
    return stack
      .split('\n')
      .map((line) => {
        // Replace specific file paths and function names with generic labels
        return line.replace(/at [^(]*\([^)]*\)/, 'at Component');
      })
      .join('\n')
      .substring(0, 500); // Limit length to prevent excessive data
  }

  handleReset = (): void => {
    // Reset error state and try to recover
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    // Reload the popup
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted p-4">
          <div className="max-w-md w-full bg-card rounded-lg shadow-lg dark:shadow-none border border-border p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-destructive/10 rounded-full">
              <ExclamationTriangleIcon className="w-6 h-6 text-destructive" aria-hidden="true" />
            </div>

            <h1 className="mt-4 text-lg font-semibold text-foreground text-center">
              Something went wrong
            </h1>

            <p className="mt-2 text-base text-muted-foreground text-center">
              The extension encountered an error. You can try to recover or reload the popup.
            </p>

            {/* Show error details in development mode */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 p-3 bg-muted rounded-md">
                <summary className="text-sm font-medium cursor-pointer">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap wrap-break-words">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-muted text-foreground hover:bg-muted/80 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
              >
                Try to Recover
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
              >
                Reload Popup
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Specialized Error Boundary for specific sections
 * Granular error boundaries for isolation
 */
interface SectionErrorBoundaryProps {
  children: ReactNode;
  section: 'file-import' | 'settings' | 'conversion' | 'quick-settings';
  fallbackMessage?: string;
  onReset?: () => void;
}

const SECTION_MESSAGES = {
  'file-import': {
    title: 'File Import Error',
    description: 'Failed to import or validate the file. You can try importing a different file.',
  },
  settings: {
    title: 'Settings Error',
    description: 'An error occurred in the settings panel. You can close settings and try again.',
  },
  conversion: {
    title: 'Conversion Error',
    description: 'An error occurred during PDF conversion. You can retry the conversion.',
  },
  'quick-settings': {
    title: 'Quick Settings Error',
    description: 'An error occurred in quick settings. You can continue using other features.',
  },
};

/**
 * Section-specific error boundary with isolated failure handling
 * Prevents errors in one section from crashing the entire app
 */
export class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { section } = this.props;

    getLogger().error('SectionErrorBoundary', `Error in ${section} section`, {
      error,
      errorInfo,
      section,
    });

    // Log to external service in production
    if (import.meta.env.PROD) {
      void logErrorToService({
        errorId: `SECTION-${Date.now()}`,
        code: 'SECTION_ERROR',
        message: error.message,
        timestamp: formatErrorTimestamp(),
        category: `Section Error: ${section}`,
        technicalDetails: this.sanitizeComponentStack(errorInfo.componentStack),
        metadata: {
          section,
          userAgent: navigator.userAgent,
          extensionVersion: browser.runtime?.getManifest?.()?.version || 'unknown',
        },
      });
    }

    this.setState({ error, errorInfo });
  }

  private sanitizeComponentStack(stack: string | null | undefined): string | undefined {
    if (stack === null || stack === undefined) return undefined;
    return stack
      .split('\n')
      .map((line) => line.replace(/at [^(]*\([^)]*\)/, 'at Component'))
      .join('\n')
      .substring(0, 500);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler if provided
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { section, fallbackMessage } = this.props;
      const sectionInfo = SECTION_MESSAGES[section];

      return (
        <div className="p-4 bg-muted rounded-md border border-border">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon
              className="w-6 h-6 text-destructive shrink-0"
              aria-hidden="true"
            />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-foreground">{sectionInfo.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {fallbackMessage ?? sectionInfo.description}
              </p>

              {/* Show error details in development */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-2 p-3 bg-card rounded-md">
                  <summary className="text-xs font-medium cursor-pointer">Error Details</summary>
                  <pre className="mt-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap wrap-break-words">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}

              <button
                type="button"
                onClick={this.handleReset}
                className="mt-2 px-3 py-1.5 bg-card border border-border rounded-md text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
              >
                Dismiss Error
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
