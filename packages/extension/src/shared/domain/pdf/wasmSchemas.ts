// ABOUTME: Valibot schemas for runtime validation of WASM JSON responses.
// ABOUTME: Prevents runtime crashes from malformed WASM data.

import {
  array,
  check,
  custom,
  type InferOutput,
  literal,
  maxValue,
  minLength,
  minValue,
  nullable,
  number,
  object,
  picklist,
  pipe,
  safeParse,
  string,
  union,
} from 'valibot';
import { err, ok, type Result, type ValidationError } from '@/shared/errors/result';
import { formatValidationIssues } from '../validation/utils';
import type { WasmPdfConfig } from './types';

/**
 * Font weight schema (100-900 in increments of 100)
 */
export const FontWeightSchema = union([
  literal(100),
  literal(200),
  literal(300),
  literal(400),
  literal(500),
  literal(600),
  literal(700),
  literal(800),
  literal(900),
]);

/**
 * Font style schema
 */
export const FontStyleSchema = picklist(['normal', 'italic']);

/**
 * Font source schema
 */
export const FontSourceSchema = picklist(['google', 'custom', 'websafe']);

/**
 * Single font requirement schema
 * Validates individual FontRequirement objects returned by WASM
 */
export const FontRequirementSchema = object({
  family: pipe(string(), minLength(1, 'Font family cannot be empty')),
  weight: FontWeightSchema,
  style: FontStyleSchema,
  source: FontSourceSchema,
});

/**
 * Array of font requirements schema
 * Validates the complete JSON response from WASM detect_fonts()
 */
const FontRequirementsArraySchema = array(FontRequirementSchema);

/**
 * Inferred type from FontRequirementsArraySchema
 */
export type FontRequirementsArray = InferOutput<typeof FontRequirementsArraySchema>;

/**
 * Type-safe parser for WASM font detection response
 *
 * @param jsonString - JSON string from WASM detect_fonts()
 * @returns Result containing validated FontRequirement array or ValidationError
 *
 * @example
 * ```typescript
 * const fontsJson = converter.detect_fonts(tsx);
 * const result = parseFontRequirements(fontsJson);
 * if (result.isOk()) {
 *   const fonts = result.value; // type-safe FontRequirement[]
 * }
 * ```
 */
export function parseFontRequirements(
  jsonString: string,
): Result<FontRequirementsArray, ValidationError> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return err({
        type: 'invalid_input',
        message: `Failed to parse font requirements JSON: ${error.message}`,
      });
    }
    return err({
      type: 'invalid_input',
      message: `Failed to parse font requirements: ${String(error)}`,
    });
  }

  // Validate structure
  const result = safeParse(FontRequirementsArraySchema, parsed);

  if (!result.success) {
    return err({
      type: 'schema_mismatch',
      message: `Invalid font requirements from WASM: ${formatValidationIssues(result.issues)}`,
    });
  }

  return ok(result.output);
}

/**
 * WASM PDF config schema (for validation before sending to WASM)
 */
const WasmPdfConfigSchema = object({
  page_size: picklist(['Letter', 'A4', 'Legal']),
  margin: object({
    top: pipe(number(), minValue(0)),
    right: pipe(number(), minValue(0)),
    bottom: pipe(number(), minValue(0)),
    left: pipe(number(), minValue(0)),
  }),
  standard: picklist(['PDF17', 'PDFA1b']),
  title: string(),
  author: nullable(string()),
  subject: string(),
  keywords: nullable(string()),
  creator: string(),
});

/**
 * Validate WASM PDF config before sending to WASM
 *
 * @param config - Config object to validate
 * @returns Result containing validated config or ValidationError
 */
export function validateWasmPdfConfig(config: unknown): Result<WasmPdfConfig, ValidationError> {
  const result = safeParse(WasmPdfConfigSchema, config);

  if (!result.success) {
    return err({
      type: 'schema_mismatch',
      message: `Invalid PDF config: ${formatValidationIssues(result.issues)}`,
    });
  }

  return ok(result.output);
}

// ============================================================================
// WASM Output Validation
// ============================================================================

/**
 * PDF bytes validation schema
 * Validates raw PDF output from WASM convert_tsx_to_pdf()
 */
export const PdfBytesSchema = pipe(
  custom<ArrayLike<number>>(
    (value): value is ArrayLike<number> =>
      value !== null &&
      typeof value === 'object' &&
      'length' in value &&
      typeof value.length === 'number',
  ),
  check((bytes) => bytes.length >= 50, 'PDF must be at least 50 bytes'),
  check((bytes) => bytes.length <= 10 * 1024 * 1024, 'PDF cannot exceed 10MB'),
);

/**
 * Progress callback parameters schema
 * Validates stage and percentage from WASM progress callbacks
 */
export const ProgressCallbackParamsSchema = object({
  stage: string(),
  percentage: pipe(
    number(),
    minValue(0, 'Progress percentage cannot be negative'),
    maxValue(100, 'Progress percentage cannot exceed 100'),
  ),
});

/**
 * Validate PDF bytes output from WASM
 *
 * @param bytes - Raw PDF bytes from WASM
 * @returns Result containing validated Uint8Array or ValidationError
 *
 * @example
 * ```typescript
 * const pdfBytes = converter.convert_tsx_to_pdf(tsx, config, fonts);
 * const result = validatePdfBytes(pdfBytes);
 * if (result.isOk()) {
 *   const validatedPdf = result.value;
 * }
 * ```
 */
export function validatePdfBytes(bytes: unknown): Result<Uint8Array, ValidationError> {
  // Validate structure
  const result = safeParse(PdfBytesSchema, bytes);

  if (!result.success) {
    return err({
      type: 'schema_mismatch',
      message: `Invalid PDF bytes from WASM: ${formatValidationIssues(result.issues)}`,
    });
  }

  // Convert to Uint8Array
  const pdfArray = new Uint8Array(result.output);

  // Validate PDF magic bytes (PDF files start with "%PDF")
  const header = String.fromCharCode(...Array.from(pdfArray.slice(0, 4)));
  if (header !== '%PDF') {
    return err({
      type: 'invalid_input',
      message: `Invalid PDF format: expected header "%PDF", got "${header}"`,
    });
  }

  return ok(pdfArray);
}

/**
 * Validate progress callback parameters from WASM
 *
 * @param stage - Conversion stage name
 * @param percentage - Progress percentage (0-100)
 * @returns Result indicating success or ValidationError
 *
 * @example
 * ```typescript
 * converter.convert_tsx_to_pdf(tsx, config, fonts, (stage, pct) => {
 *   const result = validateProgressParams(stage, pct);
 *   if (result.isOk()) {
 *     onProgress(stage, pct);
 *   }
 * });
 * ```
 */
export function validateProgressParams(
  stage: unknown,
  percentage: unknown,
): Result<void, ValidationError> {
  const result = safeParse(ProgressCallbackParamsSchema, { stage, percentage });

  if (!result.success) {
    return err({
      type: 'schema_mismatch',
      message: `Invalid progress callback params from WASM: ${formatValidationIssues(result.issues)}`,
    });
  }

  return ok(undefined);
}
