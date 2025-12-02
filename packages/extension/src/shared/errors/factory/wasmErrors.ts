/**
 * WASM Error Factory
 * Split from errorFactory.ts for better organization
 *
 * Handles WASM initialization and execution errors
 */

import type { ConversionError, ConversionStatus } from '../../types/models';
import { ErrorCode } from '../codes';
import { createConversionError } from './errorFactory';

/**
 * Creates a WASM initialization error
 *
 * @param stage - Conversion stage where error occurred
 * @param technicalDetails - Optional technical error details
 * @returns ConversionError configured for WASM init failures
 */
export function createWasmInitError(
  stage: ConversionStatus,
  technicalDetails?: string,
): ConversionError {
  return createConversionError({
    code: ErrorCode.WASM_INIT_FAILED,
    stage,
    technicalDetails,
  });
}

/**
 * Creates a WASM execution error
 *
 * @param stage - Conversion stage where error occurred
 * @param technicalDetails - Optional technical error details
 * @returns ConversionError for WASM runtime failures
 */
export function createWasmExecutionError(
  stage: ConversionStatus,
  technicalDetails?: string,
): ConversionError {
  return createConversionError({
    code: ErrorCode.WASM_EXECUTION_ERROR,
    stage,
    technicalDetails,
  });
}
