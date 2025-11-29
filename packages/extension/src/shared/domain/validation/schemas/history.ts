/**
 * History Validation Schemas
 *
 * Valibot schemas and validation functions for conversion history.
 */

import type { HistoryEntry } from '@/shared/types/models';
import { boolean, check, instance, integer, maxLength, minLength, minValue, nullable, number, object, optional, parse, pipe, safeParse, string } from '../valibot';
import { ConversionConfigSchema, PDFMetadataSchema } from './conversion';

/**
 * HistoryEntry Schema
 */
export const HistoryEntrySchema = pipe(
  object({
    id: pipe(
      string('History entry ID must be a string'),
      minLength(1, 'History entry ID cannot be empty'),
      maxLength(100, 'History entry ID too long (max 100 characters)'),
    ),
    cvDocumentId: pipe(
      string('CV document ID must be a string'),
      minLength(1, 'CV document ID cannot be empty'),
      maxLength(100, 'CV document ID too long (max 100 characters)'),
    ),
    timestamp: pipe(
      number('Timestamp must be a number'),
      integer('Timestamp must be an integer'),
      minValue(1, 'Timestamp must be positive'),
    ),
    filename: pipe(
      string('Filename must be a string'),
      minLength(1, 'Filename cannot be empty'),
      maxLength(255, 'Filename too long (max 255 characters)'),
    ),
    success: boolean('Success must be a boolean'),
    config: ConversionConfigSchema,
    metadata: nullable(PDFMetadataSchema),
    tsxPreview: pipe(
      string('TSX preview must be a string'),
      maxLength(500, 'TSX preview too long (max 500 characters)'),
    ),
    tsxHash: pipe(
      string('TSX hash must be a string'),
      minLength(1, 'TSX hash cannot be empty'),
      maxLength(64, 'TSX hash too long (max 64 characters)'),
    ),
    cachedPdf: optional(instance(Uint8Array, 'Cached PDF must be a Uint8Array')),
  }),
  check(data => data.timestamp <= Date.now(), 'timestamp cannot be in the future'),
);

/**
 * Validation Functions
 */

export function validateHistoryEntry(data: unknown): data is HistoryEntry {
  return safeParse(HistoryEntrySchema, data).success;
}

/**
 * Parse Functions
 */

export function parseHistoryEntry(data: unknown): HistoryEntry {
  return parse(HistoryEntrySchema, data);
}
