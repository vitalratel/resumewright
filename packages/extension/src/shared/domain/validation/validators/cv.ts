/**
 * CV Validation Functions
 *
 * Runtime validation functions using Valibot schemas.
 */

import type { CVDocument, CVMetadata } from '@/shared/types/models';
import { CVDocumentSchema, CVMetadataSchema } from '../schemas/cv';
import { parse, safeParse } from '../valibot';

/**
 * Validate CVMetadata
 */
export function validateCVMetadata(data: unknown): data is CVMetadata {
  return safeParse(CVMetadataSchema, data).success;
}

/**
 * Validate CVDocument
 */
export function validateCVDocument(data: unknown): data is CVDocument {
  return safeParse(CVDocumentSchema, data).success;
}

/**
 * Parse CVDocument with detailed error
 */
export function parseCVDocument(data: unknown): CVDocument {
  return parse(CVDocumentSchema, data);
}
