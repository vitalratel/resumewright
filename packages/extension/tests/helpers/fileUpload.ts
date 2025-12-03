/**
 * File Upload Helpers
 * Utilities for uploading TSX files in E2E tests.
 */

import { Buffer } from 'node:buffer';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { type ConsoleLogEntry, captureDiagnostics, setupConsoleCapture } from './diagnostics';

/**
 * Upload options for TSX file
 */
export interface UploadOptions {
  /** Timeout for WASM initialization (default: 15000ms) */
  timeout?: number;
  /** Whether to expect validation error (default: false) */
  expectError?: boolean;
  /** Whether to enable verbose diagnostics (default: false) */
  verbose?: boolean;
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
    console.error('[uploadTsxContent] File input not found. Diagnostics:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      consoleLogs: diagnostics.consoleLogs,
      visibleText: diagnostics.textContent.substring(0, 500),
    });
    throw new Error(
      `File input not found: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  if (verbose) {
    console.warn('[uploadTsxContent] File input ready, uploading content:', fileName);
  }

  // Upload file content from buffer
  const fileInput = page.locator('[data-testid="file-input"]');
  const buffer = Buffer.from(content, 'utf-8');
  await fileInput.setInputFiles({
    name: fileName,
    mimeType: 'text/plain',
    buffer,
  });

  // Wait for validation to process (monitor console for validation logs)
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
      console.warn('[uploadTsxContent] Got expected error:', errorText);
    }
    return;
  }

  if (hasError) {
    const errorText = await validationError.textContent();

    // Capture detailed diagnostics on validation failure
    const diagnostics = await captureDiagnostics(page, logs);
    console.error('[uploadTsxContent] File validation failed:', {
      errorText,
      fileName,
      consoleLogs: diagnostics.consoleLogs.filter(
        (log) => log.text.includes('validate') || log.text.includes('WASM') || log.type === 'error',
      ),
    });

    throw new Error(`File validation failed: ${errorText}`);
  }

  if (verbose) {
    console.warn('[uploadTsxContent] File validated successfully');
  }

  // Wait for export button to be enabled (file validated + settings loaded)
  // Note: For manual uploads, the button is "preview-button", for Claude-detected CVs it's "export-button"
  try {
    await expect(
      page.locator('[data-testid="preview-button"], [data-testid="export-button"]'),
    ).toBeVisible({ timeout });
  } catch (error) {
    const diagnostics = await captureDiagnostics(page, logs);
    console.error('[uploadTsxContent] Export button not visible. Diagnostics:', {
      consoleLogs: diagnostics.consoleLogs,
      visibleText: diagnostics.textContent.substring(0, 500),
    });
    throw error;
  }
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
    console.error('[uploadTsxFile] File input not found. Diagnostics:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      consoleLogs: diagnostics.consoleLogs,
      visibleText: diagnostics.textContent.substring(0, 500),
    });
    throw new Error(
      `File input not found: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  if (verbose) {
    console.warn('[uploadTsxFile] File input ready, uploading file:', filePath);
  }

  // Upload file
  const fileInput = page.locator('[data-testid="file-input"]');
  await fileInput.setInputFiles(filePath);

  // Wait for validation to process (monitor console for validation logs)
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
      console.warn('[uploadTsxFile] Got expected error:', errorText);
    }
    return;
  }

  if (hasError) {
    const errorText = await validationError.textContent();

    // Capture detailed diagnostics on validation failure
    const diagnostics = await captureDiagnostics(page, logs);
    console.error('[uploadTsxFile] File validation failed:', {
      errorText,
      file: filePath,
      consoleLogs: diagnostics.consoleLogs.filter(
        (log) => log.text.includes('validate') || log.text.includes('WASM') || log.type === 'error',
      ),
    });

    throw new Error(`File validation failed: ${errorText}`);
  }

  if (verbose) {
    console.warn('[uploadTsxFile] File validated successfully');
  }

  // Wait for export button to be enabled (file validated + settings loaded)
  // Note: For manual uploads, the button is "preview-button", for Claude-detected CVs it's "export-button"
  try {
    await expect(
      page.locator('[data-testid="preview-button"], [data-testid="export-button"]'),
    ).toBeVisible({ timeout });
  } catch (error) {
    const diagnostics = await captureDiagnostics(page, logs);
    console.error('[uploadTsxFile] Export button not visible. Diagnostics:', {
      consoleLogs: diagnostics.consoleLogs,
      visibleText: diagnostics.textContent.substring(0, 500),
    });
    throw error;
  }
}
