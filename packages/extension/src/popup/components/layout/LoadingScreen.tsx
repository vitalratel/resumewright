/**
 * LoadingScreen Component
 * Improved WASM initialization loading state
 * P2: Enhanced with skeleton screens for better perceived performance
 * Added timeout fallback for stuck loading
 *
 * Shows loading animation with skeleton UI mimicking actual layout
 * during WASM initialization. After 30 seconds, shows timeout message
 * with reload option for recovery.
 */

import { useEffect, useState } from 'react';
import { WASM_LOADING_MESSAGES } from '../../constants/app';
import { tokens } from '../../styles/tokens';
import { Alert, SkeletonExportSection, SkeletonFileImport, SkeletonHeader } from '../common';

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
      {/* Skeleton Header */}
      <SkeletonHeader />

      {/* Main Content with Loading State */}
      <div
        className={`flex-1 ${tokens.spacing.containerPadding} ${tokens.spacing.sectionGap} ${tokens.animations.fadeIn} overflow-y-auto`}
      >
        {/* Loading Message */}
        <div className={`text-center ${tokens.spacing.gapMedium}`}>
          <div className="relative inline-block">
            <div
              className={`${tokens.animations.spin} ${tokens.borders.full} h-12 w-12 border-4 ${tokens.colors.loading.spinner} ${tokens.colors.loading.spinnerDark}`}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`h-6 w-6 ${tokens.borders.full} ${tokens.colors.loading.skeleton} animate-pulse`}
              ></div>
            </div>
          </div>

          <div className="space-y-1">
            <p
              className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.neutral.text}`}
            >
              {WASM_LOADING_MESSAGES.title}
            </p>
            <p className={`${tokens.typography.xs} ${tokens.colors.neutral.textMuted}`}>
              {WASM_LOADING_MESSAGES.subtitle}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-48 mx-auto">
            <div
              className={`h-1 ${tokens.colors.neutral.bg} ${tokens.borders.full} overflow-hidden`}
            >
              <div
                className={`h-full w-1/3 ${tokens.colors.primary.bg} ${tokens.borders.full} animate-shimmer motion-reduce:animate-pulse motion-reduce:w-2/3`}
              ></div>
            </div>
          </div>

          {/* Screen reader only text for accessibility */}
          <span className="sr-only">Loading extension, please wait...</span>

          {/* Timeout fallback message */}
          {showTimeout && (
            <div className={`max-w-md mx-auto ${tokens.spacing.marginMedium}`}>
              <Alert variant="warning">
                <div className="space-y-3">
                  <p className={tokens.typography.small}>
                    <strong>This is taking longer than expected.</strong>
                  </p>
                  <p className={tokens.typography.small}>
                    The extension may be having trouble initializing. This could be due to a slow
                    connection or browser issue.
                  </p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className={`px-3 py-1.5 ${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.primary.bg} ${tokens.colors.neutral.bgWhite} ${tokens.borders.rounded} ${tokens.colors.primary.hover} ${tokens.effects.focusRing} ${tokens.transitions.default}`}
                    aria-label="Reload extension"
                  >
                    Reload Extension
                  </button>
                </div>
              </Alert>
            </div>
          )}
        </div>

        {/* Skeleton UI - File Import Area */}
        <div className="opacity-50">
          <SkeletonFileImport />
        </div>

        {/* Skeleton UI - Export Section */}
        <div className="opacity-50">
          <SkeletonExportSection />
        </div>
      </div>
    </div>
  );
}
