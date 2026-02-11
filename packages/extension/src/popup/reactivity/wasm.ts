// ABOUTME: Manages WASM compatibility checking and initialization state.
// ABOUTME: Queries background worker for WASM status with retry logic.

import type { Accessor } from 'solid-js';
import { createSignal } from 'solid-js';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import type { WasmCompatibilityReport } from '@/shared/infrastructure/wasm/compatibility';
import { WasmCompatibilityChecker } from '@/shared/infrastructure/wasm/compatibility';
import { sendMessage } from '@/shared/messaging';

const logger = getLogger();

/**
 * Check WASM compatibility and initialization status.
 *
 * @returns Object with wasmInitialized and wasmReport accessors
 */
export function createWasmCompatibility(): {
  wasmInitialized: Accessor<boolean | null>;
  wasmReport: Accessor<WasmCompatibilityReport | null>;
} {
  const [wasmInitialized, setWasmInitialized] = createSignal<boolean | null>(null);
  const [wasmReport, setWasmReport] = createSignal<WasmCompatibilityReport | null>(null);

  const checkWasmCompatibility = async () => {
    try {
      // First, check browser compatibility (lightweight check)
      const report = await WasmCompatibilityChecker.check();
      setWasmReport(report);

      if (!report.compatible) {
        setWasmInitialized(false);
        logger.error('WasmCompatibility', 'WASM compatibility check failed', report);
        return;
      }

      // Query WASM initialization status from background worker
      const maxRetries = 5;
      const retryDelay = 500;

      async function attemptWasmStatusQuery(
        attempt: number,
      ): Promise<{ status?: { initialized: boolean; error?: string }; error?: Error }> {
        try {
          const status = await sendMessage('getWasmStatus', {});

          if (status.initialized || (status.error != null && status.error !== '')) {
            return { status };
          }

          if (attempt < maxRetries - 1) {
            logger.debug(
              'WasmCompatibility',
              `WASM still initializing (attempt ${attempt + 1}/${maxRetries}), retrying...`,
            );
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            return await attemptWasmStatusQuery(attempt + 1);
          }

          return { status };
        } catch (err) {
          const error = err as Error;

          if (attempt < maxRetries - 1 && error.message.includes('Receiving end does not exist')) {
            logger.debug(
              'WasmCompatibility',
              `Background worker not ready (attempt ${attempt + 1}/${maxRetries}), retrying...`,
            );
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            return attemptWasmStatusQuery(attempt + 1);
          }

          return { error };
        }
      }

      const { status, error: lastError } = await attemptWasmStatusQuery(0);

      if (!status) {
        const statusError =
          lastError instanceof Error ? lastError.message : 'Failed to query WASM status';
        logger.error('WasmCompatibility', 'Failed to query WASM status from background', lastError);
        setWasmInitialized(false);

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
        logger.info('WasmCompatibility', 'WASM is initialized (checked from background worker)');
      } else {
        setWasmInitialized(false);
        logger.error('WasmCompatibility', 'WASM not initialized', status.error);

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
      logger.error('WasmCompatibility', 'WASM compatibility check exception', err);
    }
  };

  void checkWasmCompatibility();

  return { wasmInitialized, wasmReport };
}
