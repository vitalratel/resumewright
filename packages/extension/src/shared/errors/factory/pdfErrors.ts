/**
 * PDF Error Factory
 * Split from errorFactory.ts for better organization
 *
 * Handles PDF generation and layout errors
 */

import type { ConversionError, ConversionStatus } from '../../types/models';
import { ErrorCode } from '../../types/errors/';
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

/**
 * Creates a PDF layout error
 *
 * @param stage - Conversion stage where error occurred
 * @param technicalDetails - Optional technical error details
 * @returns ConversionError for layout calculation failures
 */
export function createPdfLayoutError(
  stage: ConversionStatus,
  technicalDetails?: string,
): ConversionError {
  return createConversionError({
    code: ErrorCode.PDF_LAYOUT_ERROR,
    stage,
    technicalDetails,
  });
}

/**
 * Creates a download failed error
 *
 * @param stage - Conversion stage where error occurred
 * @param technicalDetails - Optional technical error details
 * @returns ConversionError for PDF download failures
 */
export function createDownloadFailedError(
  stage: ConversionStatus,
  technicalDetails?: string,
): ConversionError {
  return createConversionError({
    code: ErrorCode.DOWNLOAD_FAILED,
    stage,
    technicalDetails,
  });
}
