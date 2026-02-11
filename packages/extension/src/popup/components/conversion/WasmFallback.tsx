// ABOUTME: WASM initialization failure display with diagnostics and recovery actions.
// ABOUTME: Provides browser compatibility checks, troubleshooting steps, and cache clearing.

import {
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineExclamationTriangle,
} from 'solid-icons/hi';
import { createSignal, For, Show } from 'solid-js';
import { WEBASSEMBLY_URLS } from '@/shared/config/externalUrls';
import { ErrorCategory, ErrorCode } from '@/shared/errors/codes';
import {
  copyToClipboard,
  formatErrorDetailsForClipboard,
  formatErrorTimestamp,
} from '@/shared/errors/tracking/telemetry';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import type { WasmCompatibilityReport } from '@/shared/infrastructure/wasm/compatibility';
import type { ConversionError } from '@/shared/types/models';
import { createLoadingState } from '../../reactivity/loading';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';
import { WASM } from '../common/TechTerm';

// Extract cache clear delay constant
const CACHE_CLEAR_DELAY_MS = 500;

interface WasmFallbackProps {
  /** Compatibility report from WasmCompatibilityChecker */
  report: WasmCompatibilityReport;

  /** Optional WASM initialization error */
  error?: ConversionError;

  /** Optional ref for the root element */
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void);
}

export function WasmFallback(props: WasmFallbackProps) {
  const [showTechnical, setShowTechnical] = createSignal(false);
  const [clearCacheError, setClearCacheError] = createSignal<string | null>(null);
  const isDevMode = import.meta.env.DEV;

  // Use createLoadingState for consistent loading state management
  const { loading: isReloading, execute: executeReload } = createLoadingState({
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
    const wasmError: ConversionError = props.error || {
      stage: 'queued',
      code: ErrorCode.WASM_INIT_FAILED,
      message: 'Failed to initialize WASM converter',
      timestamp: Date.now(),
      recoverable: true,
      suggestions: ['Restart browser', 'Check WebAssembly support', 'Update browser'],
      category: ErrorCategory.SYSTEM,
      metadata: {
        type: 'wasm',
        browserInfo: props.report.browserInfo,
        wasmInfo: props.report.wasmInfo,
        memoryInfo: props.report.memoryInfo,
      },
    };

    // Copy error details to clipboard
    const details = formatErrorDetailsForClipboard({
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
      ref={props.ref}
      tabIndex={-1}
      class="w-full h-full bg-card p-4 flex flex-col items-center justify-start space-y-6 md:space-y-8 overflow-y-auto"
      role="alert"
      aria-live="assertive"
    >
      {/* Warning Icon */}
      <div class="shrink-0 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
        <HiOutlineExclamationTriangle class="w-10 h-10 text-destructive" aria-label="Error" />
      </div>

      {/* Error Title */}
      <h1 class="text-2xl font-bold tracking-tight text-foreground text-center">
        Converter Initialization Failed
      </h1>

      {/* Error Message */}
      <p class="text-base text-foreground text-center max-w-md">
        {props.report.compatible
          ? 'The PDF converter failed to initialize. This may be a temporary issue.'
          : 'Your browser does not meet the requirements to run the PDF converter.'}
      </p>

      {/* Cache Clear Error Alert */}
      <Show when={clearCacheError() !== null}>
        <div class="w-full max-w-md">
          <Alert variant="error" dismissible onDismiss={() => setClearCacheError(null)}>
            <p>{clearCacheError()}</p>
          </Alert>
        </div>
      </Show>

      {/* Browser Info */}
      <div class="w-full max-w-md text-sm bg-muted p-3 rounded-lg">
        <p class="font-semibold text-foreground mb-3">Browser Information</p>
        <p class="text-muted-foreground">
          {props.report.browserInfo.browserName} {props.report.browserInfo.browserVersion}
        </p>
        <Show when={props.report.memoryInfo}>
          <p class="text-muted-foreground mb-3">
            Memory: {props.report.memoryInfo!.usedMB}
            MB / {props.report.memoryInfo!.totalMB}
            MB ({props.report.memoryInfo!.percentUsed}
            %)
          </p>
        </Show>
      </div>

      {/* Issues List */}
      <Show when={props.report.issues.length > 0}>
        <div class="w-full max-w-md">
          <h2 class="text-sm font-semibold text-foreground mb-3">Detected Issues:</h2>
          <ul class="gap-2">
            <For each={props.report.issues}>
              {(issue) => (
                <li class="text-sm">
                  <div class="flex items-start gap-2">
                    <span
                      class={`px-2 py-0.5 text-xs font-semibold rounded-md ${
                        issue.severity === 'error'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {issue.severity.toUpperCase()}
                    </span>
                    <div class="flex-1">
                      <p class="text-foreground font-medium">{issue.message}</p>
                      <p class="text-muted-foreground mb-3">{issue.recommendation}</p>
                    </div>
                  </div>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>

      {/* Troubleshooting Steps */}
      <div class="w-full max-w-md">
        <h2 class="text-sm font-semibold text-foreground mb-3">Troubleshooting Steps:</h2>
        <ol class="list-decimal list-inside gap-2 text-sm text-foreground space-y-2">
          <li>
            <strong>Update your browser</strong> - Ensure you&apos;re using the latest version:
            <ul class="list-disc list-inside ml-6 mt-1 text-muted-foreground">
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
              class="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background rounded-md"
            >
              webassembly.org
            </a>{' '}
            to verify
            <WASM /> is enabled
          </li>
          <li>
            <strong>Clear cache and reload</strong> - Click &quot;Clear Cache & Reload&quot; button
            below
          </li>
          <Show when={props.report.memoryInfo && props.report.memoryInfo.percentUsed > 75}>
            <li>
              <strong>Free up memory</strong> - Close unused tabs (currently using
              {props.report.memoryInfo!.percentUsed}% of available memory)
            </li>
          </Show>
          <li>
            <strong>Check browser console</strong> - Press F12 → Console tab for detailed error
            messages
          </li>
          <li>
            <strong>Try a different browser</strong> - Recommended: Chrome 87+, Firefox 89+, or Edge
            88+
          </li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div class="w-full max-w-md gap-2 pt-2">
        <Button
          onClick={() => {
            void handleClearCache();
          }}
          variant="primary"
          loading={isReloading()}
          aria-label="Clear cache and reload"
        >
          Clear Cache & Reload
        </Button>

        <Show when={isDevMode}>
          <button
            type="button"
            onClick={() => {
              void handleReportIssue();
            }}
            class="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Copy error details and open GitHub issue template"
          >
            Copy Error Details
          </button>
        </Show>
      </div>

      {/* Technical Details (Collapsible) */}
      <div class="w-full max-w-md border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setShowTechnical(!showTechnical())}
          class="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          aria-expanded={showTechnical()}
          aria-controls="technical-details"
        >
          <span class="font-semibold">Technical Details</span>
          <Show
            when={showTechnical()}
            fallback={<HiOutlineChevronDown class="w-6 h-6" aria-hidden="true" />}
          >
            <HiOutlineChevronUp class="w-6 h-6" aria-hidden="true" />
          </Show>
        </button>

        <Show when={showTechnical()}>
          <div
            id="technical-details"
            class="mt-4 p-3 bg-muted rounded-lg text-xs font-mono overflow-x-auto"
          >
            <pre class="whitespace-pre-wrap wrap-break-words">
              {JSON.stringify(
                {
                  compatible: props.report.compatible,
                  browserInfo: props.report.browserInfo,
                  wasmInfo: props.report.wasmInfo,
                  memoryInfo: props.report.memoryInfo,
                  issues: props.report.issues,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </Show>
      </div>
    </div>
  );
}
