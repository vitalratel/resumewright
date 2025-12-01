/**
 * WASM Fallback Component
 *
 * Displays WASM initialization failure with diagnostics and recovery actions.
 * Provides browser compatibility checks, troubleshooting steps, and cache clearing functionality.

 */

import type { WasmCompatibilityReport } from '@/shared/infrastructure/wasm/compatibility';
import type { ConversionError } from '@/shared/types/models';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { WEBASSEMBLY_URLS } from '@/shared/config/externalUrls';
import {
  copyToClipboard,
  formatErrorDetailsForClipboard,
  formatErrorTimestamp,
  generateErrorId,
} from '@/shared/errors';
import { getLogger } from '@/shared/infrastructure/logging';
import { ErrorCategory, ErrorCode } from '@/shared/types/errors/';
import { useLoadingState } from '../../hooks/ui/useLoadingState';
import { tokens } from '../../styles/tokens';
import { WASM } from '../common';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';

// Extract cache clear delay constant
const CACHE_CLEAR_DELAY_MS = 500;

interface WasmFallbackProps {
  /** Compatibility report from WasmCompatibilityChecker */
  report: WasmCompatibilityReport;

  /** Optional WASM initialization error */
  error?: ConversionError;
}

export const WasmFallback = React.memo(
  ({
    ref,
    report,
    error,
  }: WasmFallbackProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
    const [showTechnical, setShowTechnical] = useState(false);
    const [clearCacheError, setClearCacheError] = useState<string | null>(null);
    const isDevMode = import.meta.env.DEV;

    // Use useLoadingState for consistent loading state management
    const { loading: isReloading, execute: executeReload } = useLoadingState({
      onError: (err) => {
        // Use logger instead of console.error for consistency
        getLogger().error('WasmFallback', 'Failed to clear cache', err);
        // Show error feedback to user via Alert component
        setClearCacheError('Failed to clear cache. Please try reloading the extension manually.');
      },
    });

    // Add error handling to handleClearCache
    const handleClearCache = async () => {
      await executeReload(async () => {
        // Clear cache and reload extension
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(async (registration) => registration.unregister()));
        }

        // Wait briefly to show loading state before reload
        await new Promise((resolve) => setTimeout(resolve, CACHE_CLEAR_DELAY_MS));
        browser.runtime.reload();
      });
    };

    const handleReportIssue = async () => {
      // Create error object for reporting
      const wasmError: ConversionError = error || {
        stage: 'queued',
        code: ErrorCode.WASM_INIT_FAILED,
        message: 'Failed to initialize WASM converter',
        timestamp: Date.now(),
        errorId: generateErrorId(),
        recoverable: true,
        suggestions: ['Restart browser', 'Check WebAssembly support', 'Update browser'],
        category: ErrorCategory.SYSTEM,
        metadata: {
          type: 'wasm',
          browserInfo: report.browserInfo,
          wasmInfo: report.wasmInfo,
          memoryInfo: report.memoryInfo,
        },
      };

      // Copy error details to clipboard
      const details = formatErrorDetailsForClipboard({
        errorId: wasmError.errorId,
        timestamp: formatErrorTimestamp(new Date(wasmError.timestamp)),
        code: wasmError.code,
        message: wasmError.message,
        category: wasmError.category,
        technicalDetails: wasmError.technicalDetails,
        metadata: wasmError.metadata as Record<string, unknown> | undefined,
      });
      await copyToClipboard(details);
    };

    return (
      <div
        ref={ref}
        tabIndex={-1}
        className={`w-full h-full ${tokens.colors.neutral.bgWhite} ${tokens.spacing.card} flex flex-col items-center justify-start ${tokens.spacing.sectionGap} overflow-y-auto`}
        role="alert"
        aria-live="assertive"
      >
        {/* Warning Icon */}
        <div
          className={`shrink-0 w-16 h-16 ${tokens.colors.error.bg} ${tokens.borders.full} flex items-center justify-center`}
        >
          <ExclamationTriangleIcon
            className={`${tokens.icons.xl} ${tokens.colors.error.icon}`}
            aria-label="Error"
          />
        </div>

        {/* Error Title */}
        <h1
          className={`text-2xl ${tokens.typography.bold} tracking-tight ${tokens.colors.neutral.text} text-center`}
        >
          Converter Initialization Failed
        </h1>

        {/* Error Message */}
        <p
          className={`${tokens.typography.base} ${tokens.colors.neutral.text} text-center max-w-md`}
        >
          {report.compatible
            ? 'The PDF converter failed to initialize. This may be a temporary issue.'
            : 'Your browser does not meet the requirements to run the PDF converter.'}
        </p>

        {/* Cache Clear Error Alert */}
        {clearCacheError !== null && (
          <div className="w-full max-w-md">
            <Alert variant="error" dismissible onDismiss={() => setClearCacheError(null)}>
              <p>{clearCacheError}</p>
            </Alert>
          </div>
        )}

        {/* Browser Info */}
        <div
          className={`w-full max-w-md ${tokens.typography.small} ${tokens.colors.neutral.bg} ${tokens.spacing.alert} ${tokens.borders.roundedLg}`}
        >
          <p
            className={`${tokens.typography.semibold} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}
          >
            Browser Information
          </p>
          <p className={tokens.colors.neutral.textMuted}>
            {report.browserInfo.browserName} {report.browserInfo.browserVersion}
          </p>
          {report.memoryInfo && (
            <p className={`${tokens.colors.neutral.textMuted} ${tokens.spacing.marginSmall}`}>
              Memory: {report.memoryInfo.usedMB}
              MB / {report.memoryInfo.totalMB}
              MB ({report.memoryInfo.percentUsed}
              %)
            </p>
          )}
        </div>

        {/* Issues List */}
        {report.issues.length > 0 && (
          <div className="w-full max-w-md">
            <h2
              className={`${tokens.typography.small} ${tokens.typography.semibold} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}
            >
              Detected Issues:
            </h2>
            <ul className={tokens.spacing.gapSmall}>
              {report.issues.map((issue) => (
                <li key={`${issue.severity}-${issue.message}`} className={tokens.typography.small}>
                  <div className={`flex items-start ${tokens.spacing.gapSmall}`}>
                    <span
                      className={`px-2 py-0.5 ${tokens.typography.xs} ${tokens.typography.semibold} ${tokens.borders.rounded} ${
                        issue.severity === 'error'
                          ? `${tokens.colors.error.bg} ${tokens.colors.error.textStrong}`
                          : `${tokens.colors.warning.bg} ${tokens.colors.warning.textStrong}`
                      }`}
                    >
                      {issue.severity.toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <p className={`${tokens.colors.neutral.text} ${tokens.typography.medium}`}>
                        {issue.message}
                      </p>
                      <p
                        className={`${tokens.colors.neutral.textMuted} ${tokens.spacing.marginSmall}`}
                      >
                        {issue.recommendation}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Troubleshooting Steps - */}
        <div className="w-full max-w-md">
          <h2
            className={`${tokens.typography.small} ${tokens.typography.semibold} ${tokens.colors.neutral.text} ${tokens.spacing.marginSmall}`}
          >
            Troubleshooting Steps:
          </h2>
          <ol
            className={`list-decimal list-inside ${tokens.spacing.gapSmall} ${tokens.typography.small} ${tokens.colors.neutral.text} space-y-2`}
          >
            <li>
              <strong>Update your browser</strong> - Ensure you&apos;re using the latest version:
              <ul className={`list-disc list-inside ml-6 mt-1 ${tokens.colors.neutral.textMuted}`}>
                <li>Chrome/Edge: chrome://settings/help or edge://settings/help</li>
                <li>Firefox: about:support → Check for updates</li>
              </ul>
            </li>
            <li>
              <strong>
                Check
                <WASM /> support
              </strong>{' '}
              - Visit{' '}
              <a
                href={WEBASSEMBLY_URLS.ORG}
                target="_blank"
                rel="noopener noreferrer"
                className={`${tokens.colors.link.text} ${tokens.colors.link.hoverUnderline} ${tokens.effects.focusRing} ${tokens.borders.rounded}`}
              >
                webassembly.org
              </a>{' '}
              to verify
              <WASM /> is enabled
            </li>
            <li>
              <strong>Clear cache and reload</strong> - Click &quot;Clear Cache & Reload&quot;
              button below
            </li>
            {report.memoryInfo && report.memoryInfo.percentUsed > 75 && (
              <li>
                <strong>Free up memory</strong> - Close unused tabs (currently using
                {report.memoryInfo.percentUsed}% of available memory)
              </li>
            )}
            <li>
              <strong>Check browser console</strong> - Press F12 → Console tab for detailed error
              messages
            </li>
            <li>
              <strong>Try a different browser</strong> - Recommended: Chrome 87+, Firefox 89+, or
              Edge 88+
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className={`w-full max-w-md ${tokens.spacing.gapSmall} pt-2`}>
          <Button
            onClick={() => {
              void handleClearCache();
            }}
            variant="primary"
            loading={isReloading}
            aria-label="Clear cache and reload"
          >
            Clear Cache & Reload
          </Button>

          {isDevMode && (
            <button
              type="button"
              onClick={() => {
                void handleReportIssue();
              }}
              className={`w-full px-4 py-2 ${tokens.typography.small} ${tokens.colors.neutral.textMuted} hover:${tokens.colors.neutral.text} ${tokens.colors.neutral.hover} ${tokens.borders.roundedLg} ${tokens.transitions.default} ${tokens.effects.focusRingLight}`
                .trim()
                .replace(/\s+/g, ' ')}
              aria-label="Copy error details and open GitHub issue template"
            >
              Copy Error Details
            </button>
          )}
        </div>

        {/* Technical Details (Collapsible) */}
        <div className={`w-full max-w-md border-t ${tokens.colors.neutral.borderLight} pt-4`}>
          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className={`w-full flex items-center justify-between ${tokens.typography.small} ${tokens.colors.neutral.textMuted} hover:${tokens.colors.neutral.text} ${tokens.effects.focusRingLight} ${tokens.transitions.default}`
              .trim()
              .replace(/\s+/g, ' ')}
            aria-expanded={showTechnical}
            aria-controls="technical-details"
          >
            <span className={tokens.typography.semibold}>Technical Details</span>
            {showTechnical ? (
              <ChevronUpIcon className={tokens.icons.md} aria-hidden="true" />
            ) : (
              <ChevronDownIcon className={tokens.icons.md} aria-hidden="true" />
            )}
          </button>

          {showTechnical && (
            <div
              id="technical-details"
              className={`${tokens.spacing.marginMedium} ${tokens.spacing.alert} ${tokens.colors.neutral.bg} ${tokens.borders.roundedLg} ${tokens.typography.xs} font-mono overflow-x-auto`}
            >
              <pre className="whitespace-pre-wrap wrap-break-words">
                {JSON.stringify(
                  {
                    compatible: report.compatible,
                    browserInfo: report.browserInfo,
                    wasmInfo: report.wasmInfo,
                    memoryInfo: report.memoryInfo,
                    issues: report.issues,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }
);
