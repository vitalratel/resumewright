// ABOUTME: Unified TSX validation module for file and syntax validation.
// ABOUTME: Provides comprehensive file validation and fast syntax-only validation.

import { sendMessage } from '@/shared/messaging';
import type { ILogger } from '../../infrastructure/logging/logger';
import { FILE_SIZE_LIMITS as SIZE_LIMITS } from './constants';
import type { TsxToPdfConverter } from './types';
import { parseFontRequirements } from './wasmSchemas';

export { SIZE_LIMITS as FILE_SIZE_LIMITS };

/**
 * Validation result with optional error and warnings
 */
interface TsxValidationResult {
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
      error:
        'This file appears too small to be a valid CV. Please make sure you exported the complete TSX file from Claude.',
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
      error:
        "This file doesn't contain JSX markup. Please make sure you exported a TSX file from your Claude conversation.",
    };
  }

  if (!content.includes('return')) {
    return {
      valid: false,
      error:
        "This file doesn't appear to be a valid React component. Components must have a return statement with JSX.",
    };
  }

  // Check 4: Wait for WASM to be ready
  try {
    const maxWaitMs = 15000;
    const checkIntervalMs = 500;
    const startTime = Date.now();

    /**
     * Recursive function to poll WASM status
     */
    async function pollWasmStatus(): Promise<{ ready: boolean; error?: string }> {
      if (Date.now() - startTime >= maxWaitMs) {
        // Stryker disable next-line ObjectLiteral: Equivalent mutant - !undefined equals !false
        return { ready: false };
      }

      try {
        const status = await sendMessage('getWasmStatus', {});

        if (status.initialized) {
          return { ready: true };
        }

        if (status.error != null) {
          logger.error('TsxValidation', 'WASM initialization failed', { error: status.error });
          return {
            ready: false,
            error: 'PDF converter initialization failed. Please reload the extension.',
          };
        }

        await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
        return await pollWasmStatus();
      } catch (err) {
        const error = err as Error;
        if (error.message.includes('Receiving end does not exist')) {
          await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
          return pollWasmStatus();
        } else {
          throw err;
        }
      }
    }

    const result = await pollWasmStatus();

    if (!result.ready) {
      if (result.error != null) {
        return { valid: false, error: result.error };
      }
      logger.error('TsxValidation', 'WASM initialization timeout', { maxWaitMs });
      return {
        valid: false,
        error: 'PDF converter is still initializing. Please wait a moment and try again.',
      };
    }
  } catch (err) {
    logger.error('TsxValidation', 'Error checking WASM status', err);
    return {
      valid: false,
      error: 'Unable to verify PDF converter status. Please reload the extension.',
    };
  }

  // Check 5: TSX syntax validation (WASM-based via background worker)
  try {
    const result = await sendMessage('validateTsx', { tsx: content });

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
  } catch (error) {
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
    const fontsJson = converter.detect_fonts(tsx);

    const parseResult = parseFontRequirements(fontsJson);
    if (parseResult.isErr()) {
      logger.error('TsxValidation', 'Failed to parse/validate fonts from WASM', parseResult.error);
      return false;
    }
    return Array.isArray(parseResult.value);
  } catch (error) {
    logger.error('TsxValidation', 'validateTsxSyntax failed', error);
    return false;
  }
}

/**
 * Generate detailed error message based on content analysis
 */
function generateDetailedErrorMessage(content: string): string {
  let error = "This file doesn't appear to be a valid CV file from Claude.";

  if (!content.includes('export')) {
    error += ' Missing export statement - make sure the file exports a CV component.';
  } else if (!content.includes('function') && !content.includes('=>')) {
    error += ' No component function found - the file should contain a React component.';
  } else if (content.includes('import ') && !content.includes('React')) {
    error += ' React imports may be missing or incorrect.';
  } else {
    error += ' Please make sure you exported the TSX file correctly from your Claude conversation.';
  }

  return error;
}

/**
 * Validate file extension
 */
export function validateFileExtension(fileName: string, acceptedExtensions: string[]): boolean {
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  return acceptedExtensions.includes(extension);
}
