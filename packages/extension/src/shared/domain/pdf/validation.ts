/**
 * Unified TSX Validation Module
 *
 * Consolidates all validation logic from popup utils and validator service.
 * Provides both comprehensive file validation and fast syntax-only validation.
 */

import type { WasmStatusPayload } from '../../types/messages';
import type { ILogger } from '../logging/ILogger';
import type { TsxToPdfConverter } from './types';
import browser from 'webextension-polyfill';
import { MessageType } from '../../types/messages';
import { FILE_SIZE_LIMITS as SIZE_LIMITS } from './constants';
import { parseFontRequirements } from './wasmSchemas';

// Re-export for backward compatibility
export { SIZE_LIMITS as FILE_SIZE_LIMITS };

/**
 * Validation result with optional error and warnings
 */
export interface TsxValidationResult {
  /** Whether the TSX is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Non-blocking warnings (e.g., large file) */
  warnings?: string[];
}

/**
 * Validate TSX file comprehensively
 *
 * Performs all validation checks:
 * - File extension check
 * - File size check
 * - Basic JSX structure check
 * - TSX syntax validation (WASM-based)
 *
 * @param content - File content
 * @param fileSize - File size in bytes
 * @param fileName - File name (for extension check)
 * @returns Validation result with error/warnings
 *
 * @example
 * ```typescript
 * const result = await validateTsxFile(content, fileSize, 'resume.tsx');
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export async function validateTsxFile(
  content: string,
  fileSize: number,
  fileName: string,
  logger: ILogger,
): Promise<TsxValidationResult> {
  const warnings: string[] = [];

  // Check 1: File extension
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  if (ext !== '.tsx' && ext !== '.ts') {
    return {
      valid: false,
      error: 'File must be a .tsx or .ts file',
    };
  }

  // Check 2: File size - minimum
  if (fileSize < SIZE_LIMITS.MIN_VALID) {
    return {
      valid: false,
      error: 'This file appears too small to be a valid CV. Please make sure you exported the complete TSX file from Claude.',
    };
  }

  // Check 2b: File size - warning for large files
  if (fileSize > SIZE_LIMITS.LARGE_WARNING) {
    const sizeKB = (fileSize / 1024).toFixed(0);
    warnings.push(`Large file detected (${sizeKB}KB) - conversion may take longer`);
    logger.warn('TsxValidation', 'Large file', { fileSize });
  }

  // Check 3: Basic JSX structure
  if (!content.includes('<') || !content.includes('>')) {
    return {
      valid: false,
      error: 'This file doesn\'t contain JSX markup. Please make sure you exported a TSX file from your Claude conversation.',
    };
  }

  if (!content.includes('return')) {
    return {
      valid: false,
      error: 'This file doesn\'t appear to be a valid React component. Components must have a return statement with JSX.',
    };
  }

  // Check 4: Wait for WASM to be ready
  // In browser environment, WASM is initialized in the background worker.
  // Query the background worker's WASM status via messaging.
  // React 19 pattern: Use recursion instead of await in while loop
  try {
    const maxWaitMs = 15000; // 15 seconds max (WASM typically initializes in ~5s)
    const checkIntervalMs = 500;
    const startTime = Date.now();

    /**
     * Recursive function to poll WASM status
     * Avoids await-in-loop ESLint warning by using recursion
     */
    async function pollWasmStatus(): Promise<{ ready: boolean; error?: string }> {
      // Check timeout
      if (Date.now() - startTime >= maxWaitMs) {
        return { ready: false };
      }

      try {
        const response = await browser.runtime.sendMessage({
          type: MessageType.GET_WASM_STATUS,
          payload: {},
        });

        const status = response as WasmStatusPayload;

        if (status.initialized) {
          return { ready: true };
        }

        // If there's a permanent error, stop waiting
        if (status.error != null) {
          logger.error('TsxValidation', 'WASM initialization failed', { error: status.error });
          return {
            ready: false,
            error: 'PDF converter initialization failed. Please reload the extension.',
          };
        }

        // Still initializing, wait and retry recursively
        await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
        return await pollWasmStatus();
      }
      catch (err) {
        const error = err as Error;
        // If background worker not responding, wait and retry
        if (error.message.includes('Receiving end does not exist')) {
          await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
          return pollWasmStatus();
        }
        else {
          throw err; // Other errors should bubble up
        }
      }
    }

    const result = await pollWasmStatus();

    if (!result.ready) {
      if (result.error !== null && result.error !== undefined) {
        return { valid: false, error: result.error };
      }
      logger.error('TsxValidation', 'WASM initialization timeout', { maxWaitMs });
      return {
        valid: false,
        error: 'PDF converter is still initializing. Please wait a moment and try again.',
      };
    }
  }
  catch (err) {
    logger.error('TsxValidation', 'Error checking WASM status', err);
    return {
      valid: false,
      error: 'Unable to verify PDF converter status. Please reload the extension.',
    };
  }

  // Check 5: TSX syntax validation (WASM-based via background worker)
  try {
    // Send TSX to background worker for validation
    const response = await browser.runtime.sendMessage({
      type: MessageType.VALIDATE_TSX,
      payload: { tsx: content },
    });

    const result = response as { valid: boolean };

    if (!result.valid) {
      return {
        valid: false,
        error: generateDetailedErrorMessage(content),
      };
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
  catch (error) {
    logger.error('TsxValidation', 'Syntax validation failed', error);
    return {
      valid: false,
      error: 'Unable to read this file. Please try exporting your CV from Claude again.',
    };
  }
}

/**
 * Validate TSX syntax only (fast validation)
 *
 * Uses WASM detect_fonts() which parses TSX without full conversion.
 * This is faster than convert_tsx_to_pdf() for validation-only scenarios.
 *
 * @param tsx - TSX source code
 * @param logger - Logger instance for error reporting
 * @param converter - WASM converter instance (injected dependency)
 * @returns True if syntax is valid, false otherwise
 *
 * @example
 * ```typescript
 * if (await validateTsxSyntax(tsx)) {
 *   // Proceed with conversion
 * }
 * ```
 */
export async function validateTsxSyntax(
  tsx: string,
  logger: ILogger,
  converter: TsxToPdfConverter,
): Promise<boolean> {
  if (!tsx || tsx.trim().length === 0) {
    return false;
  }

  try {

    // Use detect_fonts() which parses TSX and returns font requirements
    // If parsing fails, this will throw an error
    const fontsJson = converter.detect_fonts(tsx);

    // Use Valibot validation via parseFontRequirements
    // This validates both JSON syntax AND structure/types
    try {
      const fonts = parseFontRequirements(fontsJson);
      // If we got a validated array of fonts (even empty), parsing succeeded
      return Array.isArray(fonts);
    }
    catch (parseError) {
      logger.error('TsxValidation', 'Failed to parse/validate fonts from WASM', parseError);
      return false;
    }
  }
  catch (error) {
    // Any error means TSX is invalid (parse error, invalid structure, etc.)
    logger.error('TsxValidation', 'validateTsxSyntax failed', error);
    return false;
  }
}

/**
 * Generate detailed error message based on content analysis
 *
 * Provides specific guidance for common TSX issues.
 *
 * @param content - TSX content to analyze
 * @returns Detailed error message with guidance
 */
function generateDetailedErrorMessage(content: string): string {
  let error = 'This file doesn\'t appear to be a valid CV file from Claude.';

  // Provide specific guidance based on common issues
  if (!content.includes('export')) {
    error += ' Missing export statement - make sure the file exports a CV component.';
  }
  else if (!content.includes('function') && !content.includes('=>')) {
    error += ' No component function found - the file should contain a React component.';
  }
  else if (!content.includes('return')) {
    error += ' Missing return statement - components must return JSX.';
  }
  else if (content.includes('import ') && !content.includes('React')) {
    error += ' React imports may be missing or incorrect.';
  }
  else {
    error += ' Please make sure you exported the TSX file correctly from your Claude conversation.';
  }

  return error;
}

/**
 * Validate file extension
 *
 * @param fileName - File name to check
 * @param acceptedExtensions - Array of valid extensions (e.g., ['.tsx', '.ts'])
 * @returns True if extension is valid
 *
 * @example
 * ```typescript
 * if (!validateFileExtension('resume.pdf', ['.tsx', '.ts'])) {
 *   console.error('Invalid file type');
 * }
 * ```
 */
export function validateFileExtension(
  fileName: string,
  acceptedExtensions: string[],
): boolean {
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  return acceptedExtensions.includes(extension);
}

/**
 * Get file extension from filename
 *
 * @param fileName - File name
 * @returns Lowercase file extension (e.g., '.tsx')
 *
 * @example
 * ```typescript
 * const ext = getFileExtension('resume.TSX'); // '.tsx'
 * ```
 */
export function getFileExtension(fileName: string): string {
  return fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
}
