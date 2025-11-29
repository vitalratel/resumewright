/**
 * CV Validation Schemas
 *
 * Valibot schemas and validation functions for CV-related types.
 */

import type { CVDocument, CVMetadata } from '@/shared/types/models';
import { boolean, check, email, integer, minLength, minValue, number, object, optional, parse, picklist, pipe, safeParse, string, url } from '../valibot';

/**
 * CVMetadata Schema
 */
export const CVMetadataSchema = object({
  name: optional(string('Name must be a string')),
  title: optional(string('Title must be a string')),
  email: optional(pipe(
    string('Email must be a string'),
    email('Email must be a valid email address'),
  )),
  phone: optional(string('Phone must be a string')),
  location: optional(string('Location must be a string')),
  website: optional(pipe(
    string('Website must be a string'),
    url('Website must be a valid URL'),
  )),
  layoutType: picklist(['single-column', 'two-column', 'academic', 'portfolio', 'custom']),
  estimatedPages: pipe(
    number('Estimated pages must be a number'),
    integer('Estimated pages must be an integer'),
    minValue(1, 'Estimated pages must be positive'),
  ),
  componentCount: pipe(
    number('Component count must be a number'),
    integer('Component count must be an integer'),
    minValue(0, 'Component count cannot be negative'),
  ),
  hasContactInfo: boolean('Has contact info must be a boolean'),
  hasClearSections: boolean('Has clear sections must be a boolean'),
  fontComplexity: picklist(['simple', 'moderate', 'complex']),
});

/**
 * CVDocument Schema
 */
export const CVDocumentSchema = pipe(
  object({
    id: pipe(
      string('CV ID must be a string'),
      minLength(1, 'CV ID cannot be empty'),
    ),
    sourceType: picklist(['claude', 'manual']),
    tsx: pipe(
      string('TSX must be a string'),
      minLength(1, 'TSX cannot be empty'),
    ),
    metadata: CVMetadataSchema,
    parseTimestamp: pipe(
      number('Parse timestamp must be a number'),
      integer('Parse timestamp must be an integer'),
      minValue(1, 'Parse timestamp must be positive'),
    ),
  }),
  check(data => data.parseTimestamp <= Date.now(), 'parseTimestamp cannot be in the future'),
);

/**
 * Validation Functions
 */

export function validateCVMetadata(data: unknown): data is CVMetadata {
  return safeParse(CVMetadataSchema, data).success;
}

export function validateCVDocument(data: unknown): data is CVDocument {
  return safeParse(CVDocumentSchema, data).success;
}

/**
 * Parse Functions
 */

export function parseCVDocument(data: unknown): CVDocument {
  return parse(CVDocumentSchema, data);
}
