/**
 * File Upload Helpers
 * Utilities for uploading TSX files in E2E tests.
 */

import { Buffer } from 'node:buffer';
import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { type ConsoleLogEntry, captureDiagnostics, setupConsoleCapture } from './diagnostics';

/**
 * Upload options for TSX file
 */
interface UploadOptions {
  /** Timeout for WASM initialization (default: 15000ms) */
  timeout?: number;
  /** Whether to expect validation error (default: false) */
  expectError?: boolean;
  /** Whether to enable verbose diagnostics (default: false) */
  verbose?: boolean;
}

/**
 * Base implementation for TSX file upload
 *
 * Handles all shared logic: WASM wait, validation checking, diagnostics.
 * The actual file upload is delegated to the provided uploadFn.
 */
async function uploadTsxBase(
  page: Page,
  uploadFn: (fileInput: Locator) => Promise<void>,
  logPrefix: string,
  options?: UploadOptions,
): Promise<void> {
  const timeout = options?.timeout ?? 15000;
  const verbose = options?.verbose ?? false;
  const logs: ConsoleLogEntry[] = [];

  // Set up console capture if verbose mode
  if (verbose) {
    setupConsoleCapture(page);
  }

  // Wait for popup to fully load
  await page.waitForLoadState('networkidle');

  // Wait for WASM initialization - file input appears after WASM is ready
  try {
    await page.waitForSelector('[data-testid="file-input"]', {
      state: 'attached',
      timeout,
    });
  } catch (error) {
    // Capture diagnostics on failure
    const diagnostics = await captureDiagnostics(page, logs);
    console.error(`${logPrefix} File input not found. Diagnostics:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      consoleLogs: diagnostics.consoleLogs,
      visibleText: diagnostics.textContent.substring(0, 500),
    });
    throw new Error(
      `File input not found: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  if (verbose) {
    console.warn(`${logPrefix} File input ready, uploading...`);
  }

  // Execute the upload strategy
  const fileInput = page.locator('[data-testid="file-input"]');
  await uploadFn(fileInput);

  // Wait for validation to process
  await page.waitForTimeout(1000);

  // Check for validation errors
  const validationError = page.locator('[role="alert"]');
  const hasError = await validationError.isVisible().catch(() => false);

  if (options?.expectError) {
    if (!hasError) {
      throw new Error('Expected validation error but file was accepted');
    }
    if (verbose) {
      const errorText = await validationError.textContent();
      console.warn(`${logPrefix} Got expected error:`, errorText);
    }
    return;
  }

  if (hasError) {
    const errorText = await validationError.textContent();

    // Capture detailed diagnostics on validation failure
    const diagnostics = await captureDiagnostics(page, logs);
    console.error(`${logPrefix} File validation failed:`, {
      errorText,
      consoleLogs: diagnostics.consoleLogs.filter(
        (log) => log.text.includes('validate') || log.text.includes('WASM') || log.type === 'error',
      ),
    });

    throw new Error(`File validation failed: ${errorText}`);
  }

  if (verbose) {
    console.warn(`${logPrefix} File validated successfully`);
  }

  // Wait for export button to be enabled (file validated + settings loaded)
  try {
    await expect(
      page.locator('[data-testid="preview-button"], [data-testid="export-button"]'),
    ).toBeVisible({ timeout });
  } catch (error) {
    const diagnostics = await captureDiagnostics(page, logs);
    console.error(`${logPrefix} Export button not visible. Diagnostics:`, {
      consoleLogs: diagnostics.consoleLogs,
      visibleText: diagnostics.textContent.substring(0, 500),
    });
    throw error;
  }
}

/**
 * Upload TSX content from buffer without filesystem
 *
 * Uses Playwright's buffer API to upload file content directly.
 * Avoids filesystem race conditions in parallel test execution.
 *
 * @param page - Popup page
 * @param fileName - Name of file (e.g., 'resume.tsx')
 * @param content - File content as string
 * @param options - Upload options
 *
 * @example
 * ```typescript
 * await uploadTsxContent(page, 'resume.tsx', 'const CV = () => <div>Resume</div>; export default CV;');
 * ```
 */
export async function uploadTsxContent(
  page: Page,
  fileName: string,
  content: string,
  options?: UploadOptions,
): Promise<void> {
  await uploadTsxBase(
    page,
    async (fileInput) => {
      const buffer = Buffer.from(content, 'utf-8');
      await fileInput.setInputFiles({
        name: fileName,
        mimeType: 'text/plain',
        buffer,
      });
    },
    `[uploadTsxContent:${fileName}]`,
    options,
  );
}

/**
 * Upload TSX file to popup and wait for validation
 *
 * Handles WASM initialization wait and file validation.
 * The popup shows a loading screen while WASM initializes,
 * then shows the FileImport component.
 *
 * @param page - Popup page
 * @param filePath - Absolute path to TSX file
 * @param options - Upload options
 *
 * @example
 * ```typescript
 * await uploadTsxFile(page, '/path/to/resume.tsx');
 * ```
 *
 * @example
 * ```typescript
 * // Expect validation error
 * await uploadTsxFile(page, '/path/to/invalid.tsx', { expectError: true });
 * ```
 */
export async function uploadTsxFile(
  page: Page,
  filePath: string,
  options?: UploadOptions,
): Promise<void> {
  await uploadTsxBase(
    page,
    async (fileInput) => {
      await fileInput.setInputFiles(filePath);
    },
    `[uploadTsxFile:${filePath}]`,
    options,
  );
}
