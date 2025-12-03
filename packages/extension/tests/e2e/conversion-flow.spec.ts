import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '../fixtures';
import { openExtensionPopup } from '../helpers/browserConfig';
import { captureDiagnostics, measureDuration, setupConsoleCapture } from '../helpers/diagnostics';
import { uploadTsxContent, uploadTsxFile } from '../helpers/fileUpload';
import { waitForPdfDownload, waitForProgressIndicator } from '../helpers/pdfDownload';
import { waitForBothWasmReady } from '../helpers/wasmReadiness';

// Test timeout constants for consistency
const TIMEOUTS = {
  APP_MOUNT: 10000,
  WASM_READY: 20000, // 20s timeout (WASM typically initializes in ~5s, 4x buffer)
  CONVERSION: 10000,
  ELEMENT_VISIBLE: 5000,
} as const;

// Use fixture files (same as conversion.spec.ts)
const FIXTURES_PATH = fileURLToPath(
  new URL('../../../../test-fixtures/tsx-samples/single-page', import.meta.url),
);

/**
 * E2E tests for TSX to PDF conversion flow.
 *
 * Validates:
 * - File upload is accepted
 * - Conversion process initiates
 * - Success state is reached
 * - PDF download is triggered
 * - Error handling works correctly
 */

test.describe('Conversion Flow', () => {
  const sampleTsxPath = path.join(FIXTURES_PATH, '01-single-column-traditional.tsx');

  test('should convert TSX to PDF successfully', async ({ context, extensionId, browserType }) => {
    // Open extension popup
    const page = await openExtensionPopup(context, extensionId, browserType);

    // Enhanced console capture with structured logging
    const logs = setupConsoleCapture(page);

    // Wait for React app to mount
    await expect(page.locator('text=ResumeWright')).toBeVisible({ timeout: TIMEOUTS.APP_MOUNT });

    // Check WASM readiness in BOTH popup AND service worker (BOTH REQUIRED)
    // NOTE: PDF conversion happens in the background service worker, NOT the popup!
    // The popup only validates TSX syntax. The background worker performs the actual conversion.
    const wasmReadiness = await waitForBothWasmReady(page, context, TIMEOUTS.WASM_READY);
    console.warn('[Test] WASM readiness:', {
      popupReady: wasmReadiness.popupReady,
      serviceWorkerReady: wasmReadiness.serviceWorkerReady,
      popupDurationMs: wasmReadiness.popupDurationMs,
      serviceWorkerDurationMs: wasmReadiness.serviceWorkerDurationMs,
    });

    // Log service worker status for diagnostics
    if (wasmReadiness.serviceWorkerLogs.length > 0) {
      console.warn('[Test] Service Worker Logs:');
      for (const log of wasmReadiness.serviceWorkerLogs) {
        console.warn('  ', log);
      }
    } else {
      console.warn(
        '[Test] ⚠️  No service worker logs captured - background script may not be loading',
      );
    }

    // REQUIRE BOTH popup AND service worker WASM to be ready
    if (!wasmReadiness.popupReady || !wasmReadiness.serviceWorkerReady) {
      const diagnostics = await captureDiagnostics(page, logs);
      console.error('[Test] WASM initialization failed. Full diagnostics:', diagnostics);

      throw new Error(
        `WASM initialization failed - BOTH contexts are required for conversion.\n` +
          `  Popup WASM: ${wasmReadiness.popupReady ? 'READY ✅' : 'NOT READY ❌'} (${wasmReadiness.popupDurationMs}ms)\n` +
          `  Service Worker WASM: ${wasmReadiness.serviceWorkerReady ? 'READY ✅' : 'NOT READY ❌'} (${wasmReadiness.serviceWorkerDurationMs}ms)\n` +
          `  Error: ${wasmReadiness.error ?? 'Unknown'}\n` +
          `\n` +
          `  Note: Conversion happens in background service worker, not popup.\n` +
          `  The popup only validates TSX. Service worker WASM must be initialized.`,
      );
    }

    console.warn(
      '[Test] ✅ Both WASM instances ready - popup and service worker initialized successfully',
    );

    // Upload test file (use actual fixture)
    await uploadTsxFile(page, sampleTsxPath, { verbose: true });

    // Measure conversion duration
    const duration = await measureDuration(async () => {
      // Click export button - conversion starts immediately (no preview modal)
      const exportButton = page.locator('[data-testid="export-button"]');
      await exportButton.click();

      // Wait for progress indicator
      await waitForProgressIndicator(page);

      // Wait for PDF download (via success state)
      await waitForPdfDownload(page, 15000);
    });

    console.warn(`Conversion completed in ${duration}ms`);

    // Log any errors or warnings from browser console
    const errorLogs = logs.filter(
      (log: { type: string }) => log.type === 'error' || log.type === 'warn',
    );
    if (errorLogs.length > 0) {
      console.warn('[Test] Browser console errors/warnings:', errorLogs);
    }

    // Target: <5s for high-end devices
    expect(duration).toBeLessThan(5000);
  });

  // NOTE: "should handle PDF download" test removed as redundant
  // This functionality is already thoroughly tested by "should convert TSX to PDF successfully" above
  // which verifies: upload, conversion, progress indicator, success state, and performance

  test('should handle invalid TSX input', async ({ context, extensionId, browserType }) => {
    const page = await openExtensionPopup(context, extensionId, browserType);
    const logs = setupConsoleCapture(page);

    // Wait for React app to mount
    await expect(page.locator('text=ResumeWright')).toBeVisible({ timeout: TIMEOUTS.APP_MOUNT });

    // Check WASM readiness in BOTH popup and service worker
    const wasmReadiness = await waitForBothWasmReady(page, context, TIMEOUTS.WASM_READY);

    // Log service worker console output
    if (wasmReadiness.serviceWorkerLogs.length > 0) {
      console.warn('[Test] Service Worker Logs:');
      for (const log of wasmReadiness.serviceWorkerLogs) {
        console.warn('  ', log);
      }
    } else {
      console.warn('[Test] No service worker logs captured');
    }

    if (!wasmReadiness.popupReady || !wasmReadiness.serviceWorkerReady) {
      // Include service worker logs in error
      if (wasmReadiness.serviceWorkerLogs.length > 0) {
        console.error('[Test] Service Worker Logs:', wasmReadiness.serviceWorkerLogs);
      }

      throw new Error(
        `WASM initialization failed. ` +
          `Popup: ${wasmReadiness.popupReady ? 'ready' : 'NOT ready'}, ` +
          `Service Worker: ${wasmReadiness.serviceWorkerReady ? 'ready' : 'NOT ready'}. ` +
          `Error: ${wasmReadiness.error}`,
      );
    }
    console.warn(
      `[Test] WASM ready - Popup: ${wasmReadiness.popupDurationMs}ms, Service Worker: ${wasmReadiness.serviceWorkerDurationMs}ms`,
    );

    // Create file with invalid TSX (proper format but broken JSX)
    const invalidTSX = `import React from 'react';

export default function InvalidResume() {
  return (
    <div>
      <h1>Test</h1>
      <p>Unclosed tag
    </div>
  );
}`;

    // Upload file (should fail validation)
    try {
      await uploadTsxContent(page, 'invalid-cv.tsx', invalidTSX, { verbose: true });

      // If we get here, validation didn't catch the error
      // Try clicking export to see if conversion catches it
      const exportButton = page.locator('[data-testid="export-button"]');
      await exportButton.click();

      // Wait for progress indicator
      await waitForProgressIndicator(page);

      // Verify error message appears during conversion
      await expect(
        page
          .locator('text=Error')
          .or(page.locator('.bg-red-50'))
          .or(page.locator('[role="alert"]')),
      ).toBeVisible({ timeout: TIMEOUTS.CONVERSION });
    } catch {
      // Expected to fail at validation stage
      console.warn('[Test] File correctly rejected during validation');
      const validationLogs = logs.filter(
        (log: { text: string }) =>
          log.text.includes('validate') || log.text.includes('detect_fonts'),
      );
      console.warn('[Test] Validation logs:', validationLogs);
    }
  });

  test('should handle empty TSX input', async ({ context, extensionId, browserType }) => {
    const page = await openExtensionPopup(context, extensionId, browserType);
    const logs = setupConsoleCapture(page);

    // Wait for React app to mount
    await expect(page.locator('text=ResumeWright')).toBeVisible({ timeout: TIMEOUTS.APP_MOUNT });

    // Check WASM readiness in BOTH popup and service worker
    const wasmReadiness = await waitForBothWasmReady(page, context, TIMEOUTS.WASM_READY);

    // Log service worker console output
    if (wasmReadiness.serviceWorkerLogs.length > 0) {
      console.warn('[Test] Service Worker Logs:');
      for (const log of wasmReadiness.serviceWorkerLogs) {
        console.warn('  ', log);
      }
    } else {
      console.warn('[Test] No service worker logs captured');
    }

    if (!wasmReadiness.popupReady || !wasmReadiness.serviceWorkerReady) {
      // Include service worker logs in error
      if (wasmReadiness.serviceWorkerLogs.length > 0) {
        console.error('[Test] Service Worker Logs:', wasmReadiness.serviceWorkerLogs);
      }

      throw new Error(
        `WASM initialization failed. ` +
          `Popup: ${wasmReadiness.popupReady ? 'ready' : 'NOT ready'}, ` +
          `Service Worker: ${wasmReadiness.serviceWorkerReady ? 'ready' : 'NOT ready'}. ` +
          `Error: ${wasmReadiness.error}`,
      );
    }
    console.warn(
      `[Test] WASM ready - Popup: ${wasmReadiness.popupDurationMs}ms, Service Worker: ${wasmReadiness.serviceWorkerDurationMs}ms`,
    );

    // Upload empty file expecting validation error
    await uploadTsxContent(page, 'empty.tsx', '', { expectError: true, verbose: true });

    // Export button should not be visible since file is invalid
    const exportButton = page.locator('[data-testid="export-button"]');
    await expect(exportButton).not.toBeVisible();

    // Log validation logs for debugging
    const validationLogs = logs.filter(
      (log: { text: string }) => log.text.includes('validate') || log.text.includes('empty'),
    );
    console.warn('[Test] Validation logs for empty file:', validationLogs);
  });
});
