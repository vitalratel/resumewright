/**
 * Validation Error Factory
 * Split from errorFactory.ts for better organization
 *
 * Handles TSX parsing and validation errors
 */

import type { ConversionError, ConversionStatus, LocationErrorMetadata } from '../../types/models';
import { ErrorCode } from '../codes';
import { createConversionError } from './errorFactory';

/**
 * Creates a TSX parsing error
 *
 * @param stage - Conversion stage where error occurred
 * @param technicalDetails - Optional technical error details
 * @param metadata - Optional metadata (line, column numbers)
 * @returns ConversionError configured for TSX parsing failures
 */
export function createTsxParseError(
  stage: ConversionStatus,
  technicalDetails?: string,
  metadata?: LocationErrorMetadata,
): ConversionError {
  return createConversionError({
    code: ErrorCode.TSX_PARSE_ERROR,
    stage,
    technicalDetails,
    metadata,
  });
}

/**
 * Creates an invalid TSX structure error
 *
 * @param stage - Conversion stage where error occurred
 * @param technicalDetails - Optional technical error details
 * @returns ConversionError for structural validation failures
 */
export function createInvalidStructureError(
  stage: ConversionStatus,
  technicalDetails?: string,
): ConversionError {
  return createConversionError({
    code: ErrorCode.INVALID_TSX_STRUCTURE,
    stage,
    technicalDetails,
  });
}
