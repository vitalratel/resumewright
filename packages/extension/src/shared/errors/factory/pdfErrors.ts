/**
 * PDF Error Factory
 * Split from errorFactory.ts for better organization
 *
 * Handles PDF generation and layout errors
 */

import type { ConversionError, ConversionStatus } from '../../types/models';
import { ErrorCode } from '../codes';
import { createConversionError } from './errorFactory';

/**
 * Creates a PDF generation error
 *
 * @param stage - Conversion stage where error occurred
 * @param technicalDetails - Optional technical error details
 * @returns ConversionError configured for PDF generation failures
 */
export function createPdfGenerationError(
  stage: ConversionStatus,
  technicalDetails?: string,
): ConversionError {
  return createConversionError({
    code: ErrorCode.PDF_GENERATION_FAILED,
    stage,
    technicalDetails,
  });
}
