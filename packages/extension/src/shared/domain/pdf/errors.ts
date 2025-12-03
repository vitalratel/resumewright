/**
 * Error Parser Module
 *
 * Parses WASM errors into ConversionError format.
 */

import type { InferOutput } from 'valibot';
import { array, boolean, object, optional, safeParse, string } from 'valibot';
import { ErrorCode } from '../../errors/codes';
import { generateErrorId } from '../../errors/tracking/telemetry';
import type { ConversionError } from '../../types/models';

/**
 * Valibot schema for WASM error JSON format
 * Runtime validation for WASM error responses
 */
const WasmErrorSchema = object({
  code: string(),
  message: string(),
  stage: optional(string()),
  technicalDetails: optional(string()),
  recoverable: optional(boolean()),
  suggestions: optional(array(string())),
});

type WasmError = InferOutput<typeof WasmErrorSchema>;

/**
 * Map WASM stage to ConversionStatus
 */
function mapStageToConversionStatus(stage: string): ConversionError['stage'] {
  const stageMap: Record<string, ConversionError['stage']> = {
    parsing: 'parsing',
    'extracting-metadata': 'extracting-metadata',
    rendering: 'rendering',
    'laying-out': 'laying-out',
    'generating-pdf': 'generating-pdf',
    completed: 'completed',
  };

  return stageMap[stage] || 'failed';
}

/**
 * Parse WASM error into ConversionError format
 *
 * Added Valibot validation for safe parsing
 *
 * @param {unknown} error - Error from WASM
 * @returns {ConversionError} Structured conversion error
 */
export function parseWasmError(error: unknown): ConversionError {
  // Try to parse as JSON error from Rust with validation
  try {
    const errorStr = String(error);
    const parsed: unknown = JSON.parse(errorStr);

    // Validate parsed JSON against schema
    const result = safeParse(WasmErrorSchema, parsed);

    if (result.success) {
      const errorJson: WasmError = result.output;
      return {
        stage: mapStageToConversionStatus(
          errorJson.stage !== null && errorJson.stage !== undefined && errorJson.stage !== ''
            ? errorJson.stage
            : 'unknown',
        ),
        code: errorJson.code as ErrorCode,
        message: errorJson.message,
        timestamp: Date.now(),
        errorId: generateErrorId(),
        technicalDetails: errorJson.technicalDetails,
        recoverable:
          errorJson.recoverable !== null && errorJson.recoverable !== undefined
            ? errorJson.recoverable
            : false,
        suggestions:
          errorJson.suggestions !== null && errorJson.suggestions !== undefined
            ? errorJson.suggestions
            : [],
      };
    }
    // If validation fails, fall through to default error handling
  } catch {
    // Not valid JSON or parsing failed, fall through to default
  }

  // Default error structure
  // Properly serialize error object to avoid "[object Object]"
  let errorMessage: string;
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object' && error !== null) {
    // Try to extract meaningful information from error object
    errorMessage = JSON.stringify(error, Object.getOwnPropertyNames(error));
  } else {
    errorMessage = String(error);
  }

  return {
    stage: 'failed',
    code: ErrorCode.UNKNOWN_ERROR,
    message: `Conversion failed: ${errorMessage}`,
    timestamp: Date.now(),
    errorId: generateErrorId(),
    recoverable: false,
    suggestions: ['Check TSX syntax', 'Try again', 'Contact support if error persists'],
  };
}

export { mapStageToConversionStatus };
