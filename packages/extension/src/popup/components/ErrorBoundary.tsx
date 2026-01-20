// ABOUTME: Error boundary catching React errors to prevent complete app crashes.
// ABOUTME: Provides fallback UI and error recovery options for both full-app and section-specific failures.

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';
import { type FallbackProps, ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { getLogger } from '@/shared/infrastructure/logging/instance';

/**
 * Fallback UI for the main app error boundary
 */
function AppErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const handleReload = () => {
    window.location.reload();
  };

  // Normalize error to string for display
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

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
        {import.meta.env.DEV && (
          <details className="mt-4 p-3 bg-muted rounded-md">
            <summary className="text-sm font-medium cursor-pointer">
              Error Details (Dev Only)
            </summary>
            <pre className="mt-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap wrap-break-words">
              {errorMessage}
              {errorStack && `\n${errorStack}`}
            </pre>
          </details>
        )}

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={resetErrorBoundary}
            className="flex-1 px-4 py-2 bg-muted text-foreground hover:bg-muted/80 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
          >
            Try to Recover
          </button>
          <button
            type="button"
            onClick={handleReload}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
          >
            Reload Popup
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Log errors to the logger service
 */
function handleError(error: unknown, info: React.ErrorInfo) {
  getLogger().error('ErrorBoundary', 'React Error Boundary caught an error', {
    error: error instanceof Error ? error : new Error(String(error)),
    errorInfo: info,
  });
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Error Boundary that catches and handles React component errors
 * Prevents the entire popup from crashing when a component fails
 */
export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary FallbackComponent={AppErrorFallback} onError={handleError}>
      {children}
    </ReactErrorBoundary>
  );
}

/**
 * Section-specific error boundary props
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
 * Creates a section-specific fallback component
 */
function createSectionFallback(
  section: SectionErrorBoundaryProps['section'],
  fallbackMessage?: string,
) {
  return function SectionFallback({ error, resetErrorBoundary }: FallbackProps) {
    const sectionInfo = SECTION_MESSAGES[section];
    const errorMessage = error instanceof Error ? error.message : String(error);

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
            {import.meta.env.DEV && (
              <details className="mt-2 p-3 bg-card rounded-md">
                <summary className="text-xs font-medium cursor-pointer">Error Details</summary>
                <pre className="mt-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap wrap-break-words">
                  {errorMessage}
                </pre>
              </details>
            )}

            <button
              type="button"
              onClick={resetErrorBoundary}
              className="mt-2 px-3 py-1.5 bg-card border border-border rounded-md text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
            >
              Dismiss Error
            </button>
          </div>
        </div>
      </div>
    );
  };
}

/**
 * Section-specific error boundary with isolated failure handling
 * Prevents errors in one section from crashing the entire app
 */
export function SectionErrorBoundary({
  children,
  section,
  fallbackMessage,
  onReset,
}: SectionErrorBoundaryProps) {
  const handleSectionError = (error: unknown, info: React.ErrorInfo) => {
    getLogger().error('SectionErrorBoundary', `Error in ${section} section`, {
      error: error instanceof Error ? error : new Error(String(error)),
      errorInfo: info,
      section,
    });
  };

  const handleReset = () => {
    onReset?.();
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={createSectionFallback(section, fallbackMessage)}
      onError={handleSectionError}
      onReset={handleReset}
    >
      {children}
    </ReactErrorBoundary>
  );
}
