// ABOUTME: Error boundary catching rendering errors to prevent complete app crashes.
// ABOUTME: Provides fallback UI and error recovery options for both full-app and section-specific failures.

import { HiOutlineExclamationTriangle } from 'solid-icons/hi';
import { type JSX, Show, ErrorBoundary as SolidErrorBoundary } from 'solid-js';
import { getLogger } from '@/shared/infrastructure/logging/instance';

interface AppErrorFallbackProps {
  error: unknown;
  reset: () => void;
}

function AppErrorFallback(props: AppErrorFallbackProps) {
  const handleReload = () => {
    window.location.reload();
  };

  const errorMessage = () =>
    props.error instanceof Error ? props.error.message : String(props.error);
  const errorStack = () => (props.error instanceof Error ? props.error.stack : undefined);

  return (
    <div class="min-h-screen flex items-center justify-center bg-muted p-4">
      <div class="max-w-md w-full bg-card rounded-lg shadow-lg dark:shadow-none border border-border p-6">
        <div class="flex items-center justify-center w-12 h-12 mx-auto bg-destructive/10 rounded-full">
          <HiOutlineExclamationTriangle class="w-6 h-6 text-destructive" aria-hidden="true" />
        </div>

        <h1 class="mt-4 text-lg font-semibold text-foreground text-center">Something went wrong</h1>

        <p class="mt-2 text-base text-muted-foreground text-center">
          The extension encountered an error. You can try to recover or reload the popup.
        </p>

        <Show when={import.meta.env.DEV}>
          <details class="mt-4 p-3 bg-muted rounded-md">
            <summary class="text-sm font-medium cursor-pointer">Error Details (Dev Only)</summary>
            <pre class="mt-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap wrap-break-words">
              {errorMessage()}
              {errorStack() && `\n${errorStack()}`}
            </pre>
          </details>
        </Show>

        <div class="flex gap-2 mt-4">
          <button
            type="button"
            onClick={props.reset}
            class="flex-1 px-4 py-2 bg-muted text-foreground hover:bg-muted/80 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
          >
            Try to Recover
          </button>
          <button
            type="button"
            onClick={handleReload}
            class="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
          >
            Reload Popup
          </button>
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: JSX.Element;
}

/**
 * Error Boundary that catches and handles component errors
 * Prevents the entire popup from crashing when a component fails
 */
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return (
    <SolidErrorBoundary
      fallback={(err, reset) => {
        getLogger().error('ErrorBoundary', 'Caught an error', {
          error: err instanceof Error ? err : new Error(String(err)),
        });
        return <AppErrorFallback error={err} reset={reset} />;
      }}
    >
      {props.children}
    </SolidErrorBoundary>
  );
}

interface SectionErrorBoundaryProps {
  children: JSX.Element;
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

interface SectionFallbackProps {
  error: unknown;
  reset: () => void;
  section: SectionErrorBoundaryProps['section'];
  fallbackMessage?: string;
}

function SectionFallback(props: SectionFallbackProps) {
  const sectionInfo = () => SECTION_MESSAGES[props.section];
  const errorMessage = () =>
    props.error instanceof Error ? props.error.message : String(props.error);

  return (
    <div class="p-4 bg-muted rounded-md border border-border">
      <div class="flex items-start gap-2">
        <HiOutlineExclamationTriangle
          class="w-6 h-6 text-destructive shrink-0"
          aria-hidden="true"
        />
        <div class="flex-1">
          <h3 class="text-base font-semibold text-foreground">{sectionInfo().title}</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            {props.fallbackMessage ?? sectionInfo().description}
          </p>

          <Show when={import.meta.env.DEV}>
            <details class="mt-2 p-3 bg-card rounded-md">
              <summary class="text-xs font-medium cursor-pointer">Error Details</summary>
              <pre class="mt-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap wrap-break-words">
                {errorMessage()}
              </pre>
            </details>
          </Show>

          <button
            type="button"
            onClick={props.reset}
            class="mt-2 px-3 py-1.5 bg-card border border-border rounded-md text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
          >
            Dismiss Error
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Section-specific error boundary with isolated failure handling
 * Prevents errors in one section from crashing the entire app
 */
export function SectionErrorBoundary(props: SectionErrorBoundaryProps) {
  return (
    <SolidErrorBoundary
      fallback={(err, reset) => {
        getLogger().error('SectionErrorBoundary', `Error in ${props.section} section`, {
          error: err instanceof Error ? err : new Error(String(err)),
          section: props.section,
        });

        const handleReset = () => {
          props.onReset?.();
          reset();
        };

        return (
          <SectionFallback
            error={err}
            reset={handleReset}
            section={props.section}
            fallbackMessage={props.fallbackMessage}
          />
        );
      }}
    >
      {props.children}
    </SolidErrorBoundary>
  );
}
