// ABOUTME: WASM initialization loading state with skeleton screens.
// ABOUTME: Shows timeout message with reload option after 30 seconds.

import { useEffect, useState } from 'react';
import { WASM_LOADING_MESSAGES } from '../../constants/app';
import { Alert } from '../common/Alert';
import { SkeletonExportSection, SkeletonFileImport, SkeletonHeader } from '../common/Skeleton';

export function LoadingScreen() {
  // Timeout fallback after 30 seconds
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="flex flex-col h-full" aria-busy="true" aria-live="polite">
      <SkeletonHeader />

      <div className="flex-1 px-6 py-8 md:px-8 md:py-10 space-y-6 md:space-y-8 animate-fade-in overflow-y-auto">
        <div className="text-center gap-3">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-primary/10 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{WASM_LOADING_MESSAGES.title}</p>
            <p className="text-xs text-muted-foreground">{WASM_LOADING_MESSAGES.subtitle}</p>
          </div>

          <div className="w-48 mx-auto">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-primary rounded-full animate-shimmer motion-reduce:animate-pulse motion-reduce:w-2/3" />
            </div>
          </div>

          <span className="sr-only">Loading extension, please wait...</span>

          {showTimeout && (
            <div className="max-w-md mx-auto mb-4">
              <Alert variant="warning">
                <div className="space-y-3">
                  <p className="text-sm">
                    <strong>This is taking longer than expected.</strong>
                  </p>
                  <p className="text-sm">
                    The extension may be having trouble initializing. This could be due to a slow
                    connection or browser issue.
                  </p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all duration-300"
                    aria-label="Reload extension"
                  >
                    Reload Extension
                  </button>
                </div>
              </Alert>
            </div>
          )}
        </div>

        <div className="opacity-50">
          <SkeletonFileImport />
        </div>

        <div className="opacity-50">
          <SkeletonExportSection />
        </div>
      </div>
    </div>
  );
}
