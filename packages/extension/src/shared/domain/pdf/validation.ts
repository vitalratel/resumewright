// ABOUTME: Unified TSX validation module for file and syntax validation.
// ABOUTME: Provides comprehensive file validation and fast syntax-only validation.

import type { ILogger } from '../../infrastructure/logging/logger';
import { FILE_SIZE_LIMITS as SIZE_LIMITS } from './constants';
import type { TsxToPdfConverter } from './types';

export { SIZE_LIMITS as FILE_SIZE_LIMITS };

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
    return Array.isArray(JSON.parse(fontsJson));
  } catch (error) {
    logger.error('TsxValidation', 'validateTsxSyntax failed', error);
    return false;
  }
}

/**
 * Validate file extension
 */
export function validateFileExtension(fileName: string, acceptedExtensions: string[]): boolean {
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  return acceptedExtensions.includes(extension);
}
