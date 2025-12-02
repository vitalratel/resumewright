/**
 * Network Error Factory
 * Split from errorFactory.ts for better organization
 *
 * Handles network-related errors (fonts, resources)
 */

import type { ConversionError, ConversionStatus } from '../../types/models';
import { ErrorCode } from '../codes';
import { createConversionError } from './errorFactory';

/**
 * Creates a font loading error
 *
 * @param stage - Conversion stage where error occurred
 * @param technicalDetails - Optional technical error details (font name, URL)
 * @returns ConversionError configured for font loading failures
 */
export function createFontLoadError(
  stage: ConversionStatus,
  technicalDetails?: string,
): ConversionError {
  return createConversionError({
    code: ErrorCode.FONT_LOAD_ERROR,
    stage,
    technicalDetails,
  });
}
