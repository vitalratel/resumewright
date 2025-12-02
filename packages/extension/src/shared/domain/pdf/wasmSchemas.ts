/**
 * WASM Response Validation Schemas
 *
 * Valibot schemas for runtime validation of WASM JSON responses.
 * Prevents runtime crashes from malformed WASM data.
 */

import { array, check, custom, literal, maxValue, minLength, minValue, nullable, number, object, picklist, pipe, safeParse, string, union } from 'valibot';

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
export const FontRequirementsArraySchema = array(FontRequirementSchema);

/**
 * Type-safe parser for WASM font detection response
 *
 * @param jsonString - JSON string from WASM detect_fonts()
 * @returns Validated FontRequirement array
 * @throws Error with detailed message if validation fails
 *
 * @example
 * ```typescript
 * const fontsJson = converter.detect_fonts(tsx);
 * const fonts = parseFontRequirements(fontsJson);
 * // fonts is now type-safe FontRequirement[]
 * ```
 */
export function parseFontRequirements(jsonString: string) {
  try {
    // Parse JSON
    const parsed: unknown = JSON.parse(jsonString);

    // Validate structure
    const result = safeParse(FontRequirementsArraySchema, parsed);

    if (!result.success) {
      const issues = result.issues
        .map(issue => `${(issue.path !== null && issue.path !== undefined) ? (issue.path.map(p => p.key).join('.') || 'root') : 'root'}: ${issue.message}`)
        .join(', ');
      throw new Error(`Invalid font requirements from WASM: ${issues}`);
    }

    return result.output;
  }
  catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse font requirements JSON: ${error.message}`);
    }

    throw new Error(`Failed to parse font requirements: ${String(error)}`);
  }
}

/**
 * WASM PDF config schema (for validation before sending to WASM)
 */
export const WasmPdfConfigSchema = object({
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
 * @returns Validated config
 * @throws Error if validation fails
 */
export function validateWasmPdfConfig(config: unknown) {
  const result = safeParse(WasmPdfConfigSchema, config);

  if (!result.success) {
    const issues = result.issues
      .map(issue => `${(issue.path !== null && issue.path !== undefined) ? (issue.path.map(p => p.key).join('.') || 'root') : 'root'}: ${issue.message}`)
      .join(', ');
    throw new Error(`Invalid PDF config: ${issues}`);
  }

  return result.output;
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
      value !== null
      && value !== undefined
      && typeof value === 'object'
      && 'length' in value
      && typeof value.length === 'number',
  ),
  check(bytes => bytes.length >= 50, 'PDF must be at least 50 bytes'),
  check(bytes => bytes.length <= 10 * 1024 * 1024, 'PDF cannot exceed 10MB'),
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
 * @returns Validated Uint8Array
 * @throws Error if validation fails
 *
 * @example
 * ```typescript
 * const pdfBytes = converter.convert_tsx_to_pdf(tsx, config, fonts);
 * const validatedPdf = validatePdfBytes(pdfBytes);
 * ```
 */
export function validatePdfBytes(bytes: unknown): Uint8Array {
  // Validate structure
  const result = safeParse(PdfBytesSchema, bytes);

  if (!result.success) {
    const issues = result.issues
      .map(issue => `${(issue.path !== null && issue.path !== undefined) ? (issue.path.map(p => p.key).join('.') || 'root') : 'root'}: ${issue.message}`)
      .join(', ');
    throw new Error(`Invalid PDF bytes from WASM: ${issues}`);
  }

  // Convert to Uint8Array
  const pdfArray = new Uint8Array(result.output);

  // Validate PDF magic bytes (PDF files start with "%PDF")
  const header = String.fromCharCode(...Array.from(pdfArray.slice(0, 4)));
  if (!header.startsWith('%PDF')) {
    throw new Error(`Invalid PDF format: expected header "%PDF", got "${header}"`);
  }

  return pdfArray;
}

/**
 * Validate progress callback parameters from WASM
 *
 * @param stage - Conversion stage name
 * @param percentage - Progress percentage (0-100)
 * @throws Error if validation fails
 *
 * @example
 * ```typescript
 * converter.convert_tsx_to_pdf(tsx, config, fonts, (stage, pct) => {
 *   validateProgressParams(stage, pct);
 *   onProgress(stage, pct);
 * });
 * ```
 */
export function validateProgressParams(stage: unknown, percentage: unknown): void {
  const result = safeParse(ProgressCallbackParamsSchema, { stage, percentage });

  if (!result.success) {
    const issues = result.issues
      .map(issue => `${(issue.path !== null && issue.path !== undefined) ? (issue.path.map(p => p.key).join('.') || 'root') : 'root'}: ${issue.message}`)
      .join(', ');
    throw new Error(`Invalid progress callback params from WASM: ${issues}`);
  }
}
