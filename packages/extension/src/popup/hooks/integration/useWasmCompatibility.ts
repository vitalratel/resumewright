// ABOUTME: Manages WASM compatibility checking and initialization state.
// ABOUTME: Queries background worker for WASM status with retry logic.

import { useEffect, useState } from 'react';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import type { WasmCompatibilityReport } from '@/shared/infrastructure/wasm/compatibility';
import { WasmCompatibilityChecker } from '@/shared/infrastructure/wasm/compatibility';
import { sendMessage } from '@/shared/messaging';

const logger = getLogger();

interface UseWasmCompatibilityReturn {
  /**
   * WASM initialization state
   * - null: checking
   * - true: ready
   * - false: failed
   */
  wasmInitialized: boolean | null;

  /**
   * Compatibility report with detailed information
   */
  wasmReport: WasmCompatibilityReport | null;
}

/**
 * Check WASM compatibility on mount
 *
 * @returns WASM initialization state and compatibility report
 */
export function useWasmCompatibility(): UseWasmCompatibilityReturn {
  const [wasmInitialized, setWasmInitialized] = useState<boolean | null>(null);
  const [wasmReport, setWasmReport] = useState<WasmCompatibilityReport | null>(null);

  useEffect(() => {
    const checkWasmCompatibility = async () => {
      try {
        // First, check browser compatibility (lightweight check)
        const report = await WasmCompatibilityChecker.check();
        setWasmReport(report);

        if (!report.compatible) {
          setWasmInitialized(false);
          logger.error('useWasmCompatibility', 'WASM compatibility check failed', report);
          return;
        }

        // Query WASM initialization status from background worker
        // Retry mechanism to handle service worker startup timing
        const maxRetries = 5;
        const retryDelay = 500; // ms

        /**
         * Recursive retry function to avoid await-in-loop
         */
        async function attemptWasmStatusQuery(
          attempt: number,
        ): Promise<{ status?: { initialized: boolean; error?: string }; error?: Error }> {
          try {
            const status = await sendMessage('getWasmStatus', {});

            // If WASM is initialized or has a permanent error, return success
            if (status.initialized || (status.error != null && status.error !== '')) {
              return { status };
            }

            // If WASM is still initializing (not initialized, no error), retry
            if (attempt < maxRetries - 1) {
              logger.debug(
                'useWasmCompatibility',
                `WASM still initializing (attempt ${attempt + 1}/${maxRetries}), retrying...`,
              );
              await new Promise((resolve) => {
                const timer = setTimeout(resolve, retryDelay);
                return () => clearTimeout(timer);
              });
              return await attemptWasmStatusQuery(attempt + 1);
            }

            // Max retries reached without definitive status
            return { status };
          } catch (err) {
            const error = err as Error;

            // If it's a "Receiving end does not exist" error, the background worker isn't ready yet
            if (
              attempt < maxRetries - 1 &&
              error.message.includes('Receiving end does not exist')
            ) {
              logger.debug(
                'useWasmCompatibility',
                `Background worker not ready (attempt ${attempt + 1}/${maxRetries}), retrying...`,
              );
              await new Promise((resolve) => {
                const timer = setTimeout(resolve, retryDelay);
                return () => clearTimeout(timer);
              });
              return attemptWasmStatusQuery(attempt + 1);
            }

            // Non-retryable error or max retries reached
            return { error };
          }
        }

        const { status, error: lastError } = await attemptWasmStatusQuery(0);

        // If we exhausted retries, handle the error
        if (!status) {
          const statusError =
            lastError instanceof Error ? lastError.message : 'Failed to query WASM status';
          logger.error(
            'useWasmCompatibility',
            'Failed to query WASM status from background',
            lastError,
          );
          setWasmInitialized(false);

          // Update report with status query error
          report.issues.push({
            severity: 'error',
            category: 'wasm',
            message: statusError,
            recommendation: 'Try reloading the extension',
          });
          report.compatible = false;
          setWasmReport({ ...report });
          return;
        }

        if (status.initialized) {
          setWasmInitialized(true);
          logger.info(
            'useWasmCompatibility',
            'WASM is initialized (checked from background worker)',
          );
        } else {
          setWasmInitialized(false);
          logger.error('useWasmCompatibility', 'WASM not initialized', status.error);

          // Update report with initialization error
          if (status.error != null && status.error !== '') {
            report.issues.push({
              severity: 'error',
              category: 'wasm',
              message: status.error,
              recommendation: 'Try reloading the extension',
            });
            report.compatible = false;
            setWasmReport({ ...report });
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown WASM initialization error';

        // Create a minimal report for the error case
        const errorReport: WasmCompatibilityReport = {
          compatible: false,
          browserInfo: {
            userAgent: navigator.userAgent,
            browserName: 'Unknown',
            browserVersion: 'Unknown',
          },
          wasmInfo: {
            supported: false,
            streaming: false,
            threads: false,
            simd: false,
          },
          issues: [
            {
              severity: 'error',
              category: 'wasm',
              message: errorMsg,
              recommendation: 'Try reloading the extension or updating your browser',
            },
          ],
        };

        setWasmReport(errorReport);
        setWasmInitialized(false);
        logger.error('useWasmCompatibility', 'WASM compatibility check exception', err);
      }
    };

    void checkWasmCompatibility();
  }, []);

  return { wasmInitialized, wasmReport };
}
